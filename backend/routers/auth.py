from datetime import datetime, timedelta
import random

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..database import get_db_connection
from ..core.security import decode_token, get_password_hash, create_access_token
from ..schemas import UserLogin, UserCreate, Token, UserUpdate, OTPRequest, OTPVerify

router = APIRouter()
security = HTTPBearer()

ADMIN_ROLES = {"HOSPITAL_ADMIN"}
OTP_EXPIRE_MINUTES = 5


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
            INSERT INTO users (phone, email, password, full_name, role, blood_type, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (phone, user.email, get_password_hash(user.password or "otp-login"), user.full_name, role, user.blood_type or "UNKNOWN", user.lat, user.lng)
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


@router.post("/request-otp")
async def request_otp(data: OTPRequest):
    phone = normalize_phone(data.phone)
    if len(phone) < 9:
        raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE phone = ?", (phone,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Số điện thoại chưa được đăng ký")

        otp = f"{random.randint(0, 999999):06d}"
        expires_at = (datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)).isoformat()

        cursor.execute("UPDATE login_otps SET used = 1 WHERE phone = ? AND used = 0", (phone,))
        cursor.execute(
            "INSERT INTO login_otps (phone, otp_code, expires_at, used) VALUES (?, ?, ?, 0)",
            (phone, otp, expires_at)
        )
        conn.commit()

        # Demo/local mode: return OTP so the app can be tested without paid SMS provider.
        # Production: replace this block with Twilio/Firebase/Zalo SMS and do not return otp_code.
        print(f"[SBDCs OTP] Phone={phone} OTP={otp} expires={expires_at}")
        return {
            "message": "Mã OTP đã được gửi đến số điện thoại.",
            "phone": phone,
            "expires_in_minutes": OTP_EXPIRE_MINUTES,
            "otp_code": otp
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.post("/verify-otp", response_model=Token)
async def verify_otp(data: OTPVerify):
    phone = normalize_phone(data.phone)
    otp = data.otp.strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Số điện thoại chưa được đăng ký")

        cursor.execute(
            """
            SELECT * FROM login_otps
            WHERE phone = ? AND otp_code = ? AND used = 0
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (phone, otp)
        )
        otp_row = cursor.fetchone()
        if not otp_row:
            raise HTTPException(status_code=401, detail="Mã OTP không đúng hoặc đã được sử dụng")

        expires_at = datetime.fromisoformat(otp_row["expires_at"])
        if datetime.utcnow() > expires_at:
            cursor.execute("UPDATE login_otps SET used = 1 WHERE id = ?", (otp_row["id"],))
            conn.commit()
            raise HTTPException(status_code=401, detail="Mã OTP đã hết hạn")

        cursor.execute("UPDATE login_otps SET used = 1 WHERE id = ?", (otp_row["id"],))
        conn.commit()

        user_dict = public_user(user)
        token = create_access_token(data={
            "id": user["id"],
            "role": user["role"],
            "phone": user["phone"],
            "full_name": user["full_name"]
        })
        return {"token": token, "user": user_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Backward-compatible alias for old clients. Use /request-otp + /verify-otp in the UI."""
    raise HTTPException(status_code=400, detail="Vui lòng đăng nhập bằng OTP: gửi /request-otp rồi xác thực /verify-otp")


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
