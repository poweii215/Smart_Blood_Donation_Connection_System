from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import uuid
from pathlib import Path

from ..database import get_db_connection
from ..core.security import decode_token, create_access_token, verify_password, get_password_hash
from ..schemas import UserLogin, UserCreate, Token, UserUpdate

router = APIRouter()
security = HTTPBearer()
ADMIN_ROLES = {"HOSPITAL_ADMIN"}


def normalize_phone(phone: str) -> str:
    return ''.join(ch for ch in phone.strip() if ch.isdigit() or ch == '+')


def public_user(row):
    user = dict(row)
    user.pop("password", None)
    return user


async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(auth.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.post("/register")
async def register(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        phone = normalize_phone(user.phone)
        if len(phone) < 9:
            raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")
        role = user.role.value if hasattr(user.role, 'value') else user.role
        password_hash = get_password_hash(user.password) if user.password else 'phone-login'
        cursor.execute(
            """
            INSERT INTO users (phone, email, password, full_name, role, blood_type)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (phone, user.email, password_hash, user.full_name or "New Donor", role, user.blood_type or "UNKNOWN")
        )
        conn.commit()
        return {"id": cursor.lastrowid, "message": "Registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        msg = "Số điện thoại đã được sử dụng" if "UNIQUE" in str(e).upper() else str(e)
        raise HTTPException(status_code=400, detail=msg)
    finally:
        conn.close()


def build_token_for_user(user):
    user_dict = public_user(user)
    token = create_access_token(data={
        "id": user["id"],
        "role": user["role"],
        "phone": user["phone"],
        "email": user["email"] if "email" in user.keys() else None,
        "full_name": user["full_name"],
        "blood_type": user["blood_type"],
        "avatar_url": user["avatar_url"] if "avatar_url" in user.keys() else None,
        "reliability_score": user["reliability_score"],
        "humanitarian_points": user["humanitarian_points"],
        "total_donations": user["total_donations"],
        "last_donation_date": user["last_donation_date"],
    })
    return {"token": token, "user": user_dict}


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Role-aware login.

    Donor login is intentionally low-friction: phone number only.
    Hospital login is protected by email/phone + encrypted password.

    Demo accounts:
    - Donor: 0900000002
    - Hospital: hospital@sbdcs.com or 0900000001 / Admin@123
    """
    login_type = (credentials.login_type or "DONOR").upper()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if login_type == "HOSPITAL_ADMIN":
            identifier = (credentials.identifier or credentials.phone or "").strip()
            password = credentials.password or ""
            if not identifier or not password:
                raise HTTPException(status_code=400, detail="Hospital cần email/số điện thoại và mật khẩu")

            normalized_phone = normalize_phone(identifier)
            if "@" in identifier:
                cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role = 'HOSPITAL_ADMIN'", (identifier,))
            else:
                cursor.execute("SELECT * FROM users WHERE phone = ? AND role = 'HOSPITAL_ADMIN'", (normalized_phone,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Không tìm thấy tài khoản Hospital")
            if not verify_password(password, user["password"]):
                raise HTTPException(status_code=401, detail="Mật khẩu Hospital không đúng")
            return build_token_for_user(user)

        # Donor: phone-only login. Unknown numbers are welcomed as new DONOR accounts.
        phone = normalize_phone(credentials.phone or credentials.identifier or "")
        if len(phone) < 9:
            raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")

        cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
        user = cursor.fetchone()
        if user and user["role"] == "HOSPITAL_ADMIN":
            raise HTTPException(status_code=400, detail="Tài khoản Hospital phải đăng nhập bằng mật khẩu")

        if not user:
            full_name = f"Donor {phone[-4:]}"
            cursor.execute(
                "INSERT INTO users (phone, password, full_name, role, blood_type) VALUES (?, 'phone-login', ?, 'DONOR', 'UNKNOWN')",
                (phone, full_name)
            )
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
            user = cursor.fetchone()

        return build_token_for_user(user)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.post("/request-otp")
async def request_otp():
    raise HTTPException(status_code=400, detail="Hệ thống đã chuyển sang đăng nhập nhanh bằng số điện thoại, không dùng OTP.")


@router.post("/verify-otp")
async def verify_otp():
    raise HTTPException(status_code=400, detail="Hệ thống đã chuyển sang đăng nhập nhanh bằng số điện thoại, không dùng OTP.")


@router.post("/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload/change current user's avatar image."""
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF")

    uploads_dir = Path(os.getcwd()) / "uploads" / "avatars"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    original_name = file.filename or "avatar"
    suffix = Path(original_name).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        suffix = ".jpg"

    safe_name = f"user_{current_user['id']}_{uuid.uuid4().hex[:12]}{suffix}"
    destination = uploads_dir / safe_name

    content = await file.read()
    max_size = 3 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Ảnh đại diện không được vượt quá 3MB")
    destination.write_bytes(content)

    avatar_url = f"/uploads/avatars/{safe_name}"
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (avatar_url, current_user["id"]))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
        user = cursor.fetchone()
        return {"message": "Avatar updated", "avatar_url": avatar_url, "user": public_user(user)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.patch("/profile")
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        update_data = data.dict(exclude_unset=True)
        if "phone" in update_data and update_data["phone"]:
            update_data["phone"] = normalize_phone(update_data["phone"])
        if not update_data:
            return {"message": "No changes provided"}
        fields = [f"{key} = ?" for key in update_data.keys()]
        values = list(update_data.values()) + [current_user["id"]]
        cursor.execute(f"UPDATE users SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", tuple(values))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
        user = cursor.fetchone()
        return {"message": "Profile updated", "user": public_user(user)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
