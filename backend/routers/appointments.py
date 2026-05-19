from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection
from .auth import get_current_user
from ..schemas import AppointmentCreate, AppointmentUpdateStatus

router = APIRouter()

@router.post("")
async def create_appointment(data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "DONOR":
        raise HTTPException(status_code=403, detail="Only donors can book appointments")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO appointments (donor_id, hospital_id, appointment_date, notes, pre_screening_result) VALUES (?, ?, ?, ?, ?)",
        (current_user["id"], data.hospital_id, data.appointment_date, data.notes, data.pre_screening_result)
    )
    conn.commit()
    conn.close()
    return {"message": "Appointment created"}

@router.get("/my")
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, h.name as hospital_name, h.address as hospital_address
        FROM appointments a
        JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.donor_id = ? 
        ORDER BY a.created_at DESC
    """, (current_user["id"],))
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return appointments

@router.get("/all")
async def get_all_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, u.full_name as donor_name, u.blood_type, h.name as hospital_name
        FROM appointments a
        JOIN users u ON a.donor_id = u.id
        JOIN hospitals h ON a.hospital_id = h.id
        ORDER BY a.created_at DESC
    """)
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return appointments

@router.patch("/{id}/status")
async def update_status(id: int, data: AppointmentUpdateStatus, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Get appointment details
        cursor.execute("""
            SELECT a.*, u.blood_type, u.id as user_id 
            FROM appointments a 
            JOIN users u ON a.donor_id = u.id 
            WHERE a.id = ?
        """, (id,))
        app = cursor.fetchone()
        if not app:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Update status
        cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (data.status, id))
        
        # If COMPLETED, update inventory and donor stats
        if data.status == "COMPLETED":
            # 1. Update Inventory (+0.45L standard donation)
            qty = 0.45
            cursor.execute(
                "UPDATE blood_inventory SET quantity = quantity + ? WHERE hospital_id = ? AND blood_type = ?",
                (qty, app["hospital_id"], app["blood_type"])
            )
            
            # 2. Record Transaction
            cursor.execute(
                "INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note) VALUES (?, ?, ?, ?, ?)",
                (app["hospital_id"], app["blood_type"], qty, "IN", f"Donation from {app['user_id']} (Appt #{id})")
            )
            
            # 3. Reward Donor (Points + Reliability)
            cursor.execute("""
                UPDATE users 
                SET humanitarian_points = humanitarian_points + 50,
                    reliability_score = MIN(reliability_score + 5, 100),
                    last_donation_date = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (app["user_id"],))

        # Record Audit Log
        cursor.execute(
            "INSERT INTO audit_logs (user_id, action, target_type, target_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)",
            (current_user["id"], "UPDATE_APPOINTMENT_STATUS", "appointments", id, app["status"], data.status)
        )

        conn.commit()
        return {"message": "Status updated"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
