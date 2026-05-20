from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection, DEFAULT_HOSPITAL_ID
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import BloodInventoryBase

router = APIRouter()

def status_for(quantity, threshold):
    if quantity <= threshold * 0.5:
        return "EMERGENCY"
    if quantity < threshold:
        return "CRITICAL"
    if quantity < threshold * 1.5:
        return "WARNING"
    return "SAFE"

@router.get("/inventory")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection(); cursor = conn.cursor()
    cursor.execute("SELECT blood_type, quantity, safety_threshold, updated_at FROM blood_inventory WHERE hospital_id = 1 ORDER BY blood_type")
    rows = []
    for row in cursor.fetchall():
        item = dict(row)
        item["status"] = status_for(item["quantity"], item["safety_threshold"])
        item["emergency_mode"] = item["status"] == "EMERGENCY"
        rows.append(item)
    conn.close(); return rows

@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = conn.cursor()
    cursor.execute("SELECT blood_type, quantity, safety_threshold, updated_at FROM blood_inventory WHERE hospital_id = 1 AND quantity < safety_threshold ORDER BY quantity ASC")
    alerts = []
    for row in cursor.fetchall():
        item = dict(row)
        item["status"] = status_for(item["quantity"], item["safety_threshold"])
        item["emergency_mode"] = item["status"] == "EMERGENCY"
        alerts.append(item)
    conn.close(); return alerts

@router.put("/inventory")
async def update_inventory(data: BloodInventoryBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = conn.cursor()
    try:
        cursor.execute("SELECT quantity, safety_threshold FROM blood_inventory WHERE hospital_id = 1 AND blood_type = ?", (data.blood_type,))
        old = cursor.fetchone()
        old_qty = old["quantity"] if old else 0
        old_threshold = old["safety_threshold"] if old else 0
        cursor.execute("""
            INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(hospital_id, blood_type) DO UPDATE SET
                quantity = excluded.quantity,
                safety_threshold = excluded.safety_threshold,
                updated_at = CURRENT_TIMESTAMP
        """, (data.blood_type, data.quantity, data.safety_threshold))
        diff = data.quantity - old_qty
        if diff != 0:
            cursor.execute(
                "INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note) VALUES (1, ?, ?, ?, ?)",
                (data.blood_type, abs(diff), "IN" if diff > 0 else "OUT", f"Manual update by {current_user['full_name']}")
            )
        cursor.execute(
            "INSERT INTO audit_logs (user_id, action, target_type, target_id, old_value, new_value) VALUES (?, 'UPDATE_INVENTORY', 'blood_inventory', 1, ?, ?)",
            (current_user["id"], f"Qty: {old_qty}, Threshold: {old_threshold}", f"Qty: {data.quantity}, Threshold: {data.safety_threshold}")
        )
        conn.commit(); return {"message": "Inventory updated"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
