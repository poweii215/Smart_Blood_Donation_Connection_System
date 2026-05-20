from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..database import get_db_connection
from ..core.security import decode_token, create_access_token
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
        cursor.execute(
            """
            INSERT INTO users (phone, email, password, full_name, role, blood_type)
            VALUES (?, ?, 'phone-login', ?, ?, ?)
            """,
            (phone, user.email, user.full_name or "New Donor", role, user.blood_type or "UNKNOWN")
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


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Phone-only login for low-friction blood donation demo.

    Demo accounts:
    - 0900000001: Hospital Admin
    - 0900000002: Donor
    Unknown phone numbers are welcomed as new DONOR accounts.
    """
    phone = normalize_phone(credentials.phone)
    if len(phone) < 9:
        raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
        user = cursor.fetchone()
        if not user:
            full_name = f"Donor {phone[-4:]}"
            role = "HOSPITAL_ADMIN" if phone == "0900000001" else "DONOR"
            cursor.execute(
                "INSERT INTO users (phone, password, full_name, role, blood_type) VALUES (?, 'phone-login', ?, ?, 'UNKNOWN')",
                (phone, full_name, role)
            )
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
            user = cursor.fetchone()

        user_dict = public_user(user)
        token = create_access_token(data={
            "id": user["id"],
            "role": user["role"],
            "phone": user["phone"],
            "full_name": user["full_name"],
            "blood_type": user["blood_type"],
            "reliability_score": user["reliability_score"],
            "humanitarian_points": user["humanitarian_points"],
            "total_donations": user["total_donations"],
            "last_donation_date": user["last_donation_date"],
        })
        return {"token": token, "user": user_dict}
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
