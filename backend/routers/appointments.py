from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection, DEFAULT_HOSPITAL_ID
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import AppointmentCreate, AppointmentUpdateStatus

router = APIRouter()

@router.post("")
async def create_appointment(data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "DONOR":
        raise HTTPException(status_code=403, detail="Only donors can book appointments")
    conn = get_db_connection(); cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO appointments (donor_id, hospital_id, appointment_date, notes, pre_screening_result) VALUES (?, ?, ?, ?, ?)",
        (current_user["id"], DEFAULT_HOSPITAL_ID, data.appointment_date, data.notes, data.pre_screening_result)
    )
    conn.commit(); conn.close()
    return {"message": "Appointment created"}

@router.get("/my")
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection(); cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, 'Central Blood Donation Hospital' as hospital_name, 'Main Blood Donation Center' as hospital_address
        FROM appointments a
        WHERE a.donor_id = ?
        ORDER BY a.created_at DESC
    """, (current_user["id"],))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close(); return rows

@router.get("/all")
async def get_all_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, u.full_name as donor_name, u.phone as donor_phone, u.blood_type,
               u.reliability_score, u.humanitarian_points,
               'Central Blood Donation Hospital' as hospital_name
        FROM appointments a
        JOIN users u ON a.donor_id = u.id
        ORDER BY a.created_at DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close(); return rows

@router.patch("/{id}/status")
async def update_status(id: int, data: AppointmentUpdateStatus, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT a.*, u.blood_type, u.id as user_id
            FROM appointments a
            JOIN users u ON a.donor_id = u.id
            WHERE a.id = ?
        """, (id,))
        app = cursor.fetchone()
        if not app:
            raise HTTPException(status_code=404, detail="Appointment not found")

        cursor.execute("UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (data.status, id))

        if data.status == "COMPLETED":
            qty = 0.45
            blood_type = app["blood_type"] if app["blood_type"] != "UNKNOWN" else "O+"
            cursor.execute(
                "UPDATE blood_inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = 1 AND blood_type = ?",
                (qty, blood_type)
            )
            cursor.execute(
                "INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note) VALUES (1, ?, ?, 'IN', ?)",
                (blood_type, qty, f"Donation completed from user #{app['user_id']} appointment #{id}")
            )
            cursor.execute("""
                UPDATE users
                SET humanitarian_points = humanitarian_points + 50,
                    reliability_score = MIN(COALESCE(reliability_score, 80) + 5, 100),
                    total_donations = COALESCE(total_donations, 0) + 1,
                    last_donation_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (app["user_id"],))
        elif data.status == "CANCELLED":
            cursor.execute("""
                UPDATE users
                SET reliability_score = MAX(COALESCE(reliability_score, 80) - 8, 0),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (app["user_id"],))

        conn.commit()
        return {"message": "Status updated", "status": data.status}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
