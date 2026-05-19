from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..database import get_db_connection, DB_PATH
import os
from ..core.security import decode_token
from ..schemas import UserLogin, UserCreate, Token, UserUpdate
from ..core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()
security = HTTPBearer()

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
        hashed_password = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (email, password, full_name, role, blood_type) VALUES (?, ?, ?, ?, ?)",
            (user.email, hashed_password, user.full_name, user.role, user.blood_type)
        )
        conn.commit()
        return {"id": cursor.lastrowid}
    except Exception as e:
        conn.rollback()
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (credentials.email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_dict = dict(user)
    del user_dict["password"]
    
    token = create_access_token(data={"id": user["id"], "role": user["role"], "email": user["email"]})
    return {"token": token, "user": user_dict}

@router.patch("/profile")
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Build dynamic update query
        update_data = data.dict(exclude_unset=True)
        if not update_data:
            return {"message": "No changes provided"}
            
        fields = []
        values = []
        for key, value in update_data.items():
            fields.append(f"{key} = ?")
            values.append(value)
        
        values.append(current_user["id"])
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(query, tuple(values))
        conn.commit()
        
        # Get updated user
        cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
        user = cursor.fetchone()
        user_dict = dict(user)
        del user_dict["password"]
        
        return {"message": "Profile updated", "user": user_dict}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
