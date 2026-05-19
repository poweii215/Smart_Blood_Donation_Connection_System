from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection
from .auth import get_current_user
from ..schemas import BloodInventoryBase

router = APIRouter()

@router.get("/inventory")
async def get_inventory(hospital_id: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    if hospital_id:
        cursor.execute("SELECT * FROM blood_inventory WHERE hospital_id = ?", (hospital_id,))
    else:
        cursor.execute("""
            SELECT blood_type, SUM(quantity) as quantity, AVG(safety_threshold) as safety_threshold 
            FROM blood_inventory 
            GROUP BY blood_type
        """)
    inventory = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return inventory

@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT bi.*, h.name as hospital_name 
        FROM blood_inventory bi
        JOIN hospitals h ON bi.hospital_id = h.id
        WHERE bi.quantity < bi.safety_threshold
    """)
    alerts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return alerts

@router.put("/inventory")
async def update_inventory(data: BloodInventoryBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Get old quantity for transaction log
        cursor.execute(
            "SELECT quantity, safety_threshold FROM blood_inventory WHERE hospital_id = ? AND blood_type = ?",
            (data.hospital_id, data.blood_type)
        )
        old_row = cursor.fetchone()
        old_qty = old_row["quantity"] if old_row else 0
        old_threshold = old_row["safety_threshold"] if old_row else 0
        
        # Update inventory
        cursor.execute(
            "UPDATE blood_inventory SET quantity = ?, safety_threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = ? AND blood_type = ?",
            (data.quantity, data.safety_threshold, data.hospital_id, data.blood_type)
        )
        
        # Record transaction
        diff = data.quantity - old_qty
        if diff != 0:
            cursor.execute(
                "INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note) VALUES (?, ?, ?, ?, ?)",
                (data.hospital_id, data.blood_type, abs(diff), "IN" if diff > 0 else "OUT", f"Manual update by {current_user['full_name']}")
            )
            
        # Record Audit Log
        cursor.execute(
            "INSERT INTO audit_logs (user_id, action, target_type, target_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)",
            (current_user["id"], "UPDATE_INVENTORY", "blood_inventory", data.hospital_id, 
             f"Qty: {old_qty}, Threshold: {old_threshold}", 
             f"Qty: {data.quantity}, Threshold: {data.safety_threshold}")
        )
            
        conn.commit()
        return {"message": "Inventory updated"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
