from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import uuid
from pathlib import Path

from ..database import get_db_connection
from ..db_helpers import get_cursor, fetchone_dict, fetchall_dict
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
    cursor = get_cursor(conn)
    try:
        phone = normalize_phone(user.phone)
        if len(phone) < 9:
            raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")
        role = user.role.value if hasattr(user.role, 'value') else user.role
        if role == "HOSPITAL_ADMIN":
            raise HTTPException(status_code=403, detail="Tài khoản Hospital Admin do bệnh viện/hệ thống cấp. Vui lòng đăng nhập bằng tài khoản đã được cấp.")
        password_hash = get_password_hash(user.password) if user.password else 'phone-login'
        cursor.execute(
            """
            INSERT INTO users (
                phone, email, password, full_name, role, blood_type,
                birth_date, gender, citizen_id, weight, height, address, occupation
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                phone, user.email, password_hash, user.full_name or user.hospital_name or "New Donor",
                role, user.blood_type or "UNKNOWN", user.birth_date, user.gender, user.citizen_id,
                user.weight, user.height, user.address, user.occupation
            )
        )
        new_user_id = fetchone_dict(cursor)["id"]
        if role == "HOSPITAL_ADMIN":
            cursor.execute(
                """
                UPDATE hospitals
                SET name = %s, address = %s, contact_phone = %s, contact_email = %s,
                    hospital_code = %s, city = %s, district = %s, contact_name = %s, contact_title = %s,
                    contact_person_phone = %s, contact_person_email = %s, status = 'ACTIVE'
                WHERE id = 1
                """,
                (
                    user.hospital_name or user.full_name or "Central Blood Donation Hospital",
                    user.address or "Thông tin cập nhật bởi bệnh viện trong phần cài đặt", phone, user.email,
                    user.hospital_code, user.city, user.district, user.contact_name, user.contact_title,
                    user.contact_phone, user.contact_email
                )
            )
        conn.commit()
        return {"id": new_user_id, "message": "Registered successfully"}
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
    cursor = get_cursor(conn)
    try:
        if login_type == "HOSPITAL_ADMIN":
            identifier = (credentials.identifier or credentials.phone or "").strip()
            password = credentials.password or ""
            if not identifier or not password:
                raise HTTPException(status_code=400, detail="Hospital cần email/số điện thoại và mật khẩu")

            normalized_phone = normalize_phone(identifier)
            if "@" in identifier:
                cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(%s) AND role = 'HOSPITAL_ADMIN'", (identifier,))
            else:
                cursor.execute("SELECT * FROM users WHERE phone = %s AND role = 'HOSPITAL_ADMIN'", (normalized_phone,))
            user = fetchone_dict(cursor)
            if not user:
                raise HTTPException(status_code=401, detail="Không tìm thấy tài khoản Hospital")
            if not verify_password(password, user["password"]):
                raise HTTPException(status_code=401, detail="Mật khẩu Hospital không đúng")
            return build_token_for_user(user)

        # Donor: phone-only login. Unknown numbers are welcomed as new DONOR accounts.
        phone = normalize_phone(credentials.phone or credentials.identifier or "")
        if len(phone) < 9:
            raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")

        cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
        user = fetchone_dict(cursor)
        if user and user["role"] == "HOSPITAL_ADMIN":
            raise HTTPException(status_code=400, detail="Tài khoản Hospital phải đăng nhập bằng mật khẩu")

        if not user:
            full_name = f"Donor {phone[-4:]}"
            cursor.execute(
                "INSERT INTO users (phone, password, full_name, role, blood_type) VALUES (%s, 'phone-login', %s, 'DONOR', 'UNKNOWN') RETURNING id",
                (phone, full_name)
            )
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
            user = fetchone_dict(cursor)

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
    from ..core.cloudinary_config import upload_to_cloudinary
    
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF")

    content = await file.read()
    max_size = 3 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Ảnh đại diện không được vượt quá 3MB")
    
    # Reset file stream for Cloudinary upload
    from io import BytesIO
    file.file = BytesIO(content)
    file.file.seek(0)
    
    try:
        upload_result = await upload_to_cloudinary(file, folder="avatars")
        avatar_url = upload_result["url"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    conn = get_db_connection()
    cursor = get_cursor(conn)
    try:
        cursor.execute("UPDATE users SET avatar_url = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (avatar_url, current_user["id"]))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user["id"],))
        user = fetchone_dict(cursor)
        return {"message": "Avatar updated", "avatar_url": avatar_url, "user": public_user(user)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = get_cursor(conn)
    try:
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user["id"],))
        user = fetchone_dict(cursor)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        result = {"user": public_user(user)}
        if current_user.get("role") == "HOSPITAL_ADMIN":
            cursor.execute("SELECT * FROM hospitals WHERE id = 1")
            hospital = fetchone_dict(cursor)
            result["hospital"] = dict(hospital) if hospital else None
        return result
    finally:
        conn.close()


@router.patch("/profile")
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = get_cursor(conn)
    try:
        update_data = data.dict(exclude_unset=True)
        user_keys = {
            "full_name", "phone", "email", "blood_type", "birth_date", "gender",
            "citizen_id", "weight", "height", "address", "occupation"
        }
        hospital_keys = {
            "hospital_name", "hospital_code", "city", "district", "contact_name",
            "contact_title", "contact_phone", "contact_email"
        }
        user_update = {k: v for k, v in update_data.items() if k in user_keys}
        hospital_update = {k: v for k, v in update_data.items() if k in hospital_keys}
        if current_user.get("role") == "HOSPITAL_ADMIN" and "address" in update_data:
            hospital_update["address"] = update_data["address"]
        if "phone" in user_update and user_update["phone"]:
            user_update["phone"] = normalize_phone(user_update["phone"])
        if user_update:
            fields = [f"{key} = %s" for key in user_update.keys()]
            values = list(user_update.values()) + [current_user["id"]]
            cursor.execute(f"UPDATE users SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s", tuple(values))
        if current_user.get("role") == "HOSPITAL_ADMIN" and hospital_update:
            # Keep hospital profile in the single hospital record.
            column_map = {
                "hospital_name": "name",
                "address": "address",
                "hospital_code": "hospital_code",
                "city": "city",
                "district": "district",
                "contact_name": "contact_name",
                "contact_title": "contact_title",
                "contact_phone": "contact_person_phone",
                "contact_email": "contact_person_email",
            }
            if "contact_phone" in hospital_update:
                hospital_update["contact_phone"] = normalize_phone(hospital_update["contact_phone"])
            if "phone" in user_update:
                hospital_update.setdefault("contact_phone", user_update["phone"])
            if "email" in user_update:
                hospital_update.setdefault("contact_email", user_update["email"])
            assignments = []
            values = []
            for key, value in hospital_update.items():
                assignments.append(f"{column_map[key]} = %s")
                values.append(value)
            if assignments:
                cursor.execute(f"UPDATE hospitals SET {', '.join(assignments)} WHERE id = 1", tuple(values))
        if not user_update and not hospital_update:
            return {"message": "No changes provided"}
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user["id"],))
        user = fetchone_dict(cursor)
        result = {"message": "Profile updated", "user": public_user(user)}
        if current_user.get("role") == "HOSPITAL_ADMIN":
            cursor.execute("SELECT * FROM hospitals WHERE id = 1")
            hospital = fetchone_dict(cursor)
            result["hospital"] = dict(hospital) if hospital else None
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


def _require_hospital_admin(current_user: dict):
    if current_user.get("role") != "HOSPITAL_ADMIN":
        raise HTTPException(status_code=403, detail="Chỉ Hospital Admin được thay đổi ảnh trang chủ")


@router.get("/homepage-media")
async def get_homepage_media():
    """Public homepage media used by the landing page."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    try:
        cursor.execute("SELECT * FROM homepage_media WHERE id = 1")
        row = fetchone_dict(cursor)
        if not row:
            return {
                "hospital_image_url": "/images/hospital-showcase.svg",
                "donor_activity_image_url": "/images/donor-activity.svg",
                "hospital_title": "Central Blood Donation Hospital",
                "hospital_subtitle": "SBDCs - Kết nối hiến máu nhân đạo",
            }
        media = dict(row)
        legacy_title = media.get("hospital_title") or ""
        if "Chợ Rẫy" in legacy_title or "Choray" in legacy_title or legacy_title == "Central Blood Hospital":
            media["hospital_title"] = "Central Blood Donation Hospital"
            media["hospital_subtitle"] = "SBDCs - Kết nối hiến máu nhân đạo"
        return media
    finally:
        conn.close()


@router.post("/homepage-media/{media_type}")
async def upload_homepage_media(media_type: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Hospital Admin uploads public homepage images.

    media_type:
    - hospital: hospital showcase image on landing page
    - activity: people donating/activity image on landing page
    """
    from ..core.cloudinary_config import upload_to_cloudinary
    from io import BytesIO
    
    _require_hospital_admin(current_user)
    if media_type not in {"hospital", "activity"}:
        raise HTTPException(status_code=400, detail="media_type phải là hospital hoặc activity")

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF")

    content = await file.read()
    max_size = 5 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Ảnh trang chủ không được vượt quá 5MB")

    # Reset file stream for Cloudinary upload
    file.file = BytesIO(content)
    file.file.seek(0)
    
    try:
        upload_result = await upload_to_cloudinary(file, folder="homepage")
        media_url = upload_result["url"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    column = "hospital_image_url" if media_type == "hospital" else "donor_activity_image_url"

    conn = get_db_connection()
    cursor = get_cursor(conn)
    try:
        cursor.execute("""
            INSERT INTO homepage_media (id, hospital_image_url, donor_activity_image_url, hospital_title, hospital_subtitle)
            VALUES (1, '/images/hospital-showcase.svg', '/images/donor-activity.svg', 'Central Blood Donation Hospital', 'SBDCs - Kết nối hiến máu nhân đạo')
            ON CONFLICT (id) DO NOTHING
        """)
        cursor.execute(
            f"UPDATE homepage_media SET {column} = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
            (media_url, current_user["id"])
        )
        conn.commit()
        cursor.execute("SELECT * FROM homepage_media WHERE id = 1")
        return {"message": "Homepage media updated", "media_url": media_url, "homepage_media": dict(fetchone_dict(cursor))}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()