from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection
from .auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class HospitalBase(BaseModel):
    name: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

@router.get("")
async def get_hospitals():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospitals WHERE status = 'ACTIVE'")
    hospitals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return hospitals

@router.post("/")
async def create_hospital(data: HospitalBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO hospitals (name, address, lat, lng, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?, ?)",
            (data.name, data.address, data.lat, data.lng, data.contact_phone, data.contact_email)
        )
        hospital_id = cursor.lastrowid
        
        # Initialize inventory for new hospital
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        for b_type in blood_types:
            cursor.execute(
                "INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold) VALUES (?, ?, ?, ?)",
                (hospital_id, b_type, 0, 10)
            )
            
        conn.commit()
        return {"id": hospital_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
