from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection
from ..db_helpers import get_cursor, fetchone_dict, fetchall_dict, DEFAULT_HOSPITAL_ID
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import BloodInventoryBase, InventoryTransactionCreate

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
    conn = get_db_connection(); cursor = get_cursor(conn)
    cursor.execute("SELECT blood_type, quantity, safety_threshold, updated_at FROM blood_inventory WHERE hospital_id = 1 ORDER BY blood_type")
    rows = []
    for row in fetchall_dict(cursor):
        item = dict(row)
        item["status"] = status_for(item["quantity"], item["safety_threshold"])
        item["emergency_mode"] = item["status"] == "EMERGENCY"
        rows.append(item)
    conn.close(); return rows

@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = get_cursor(conn)
    cursor.execute("SELECT blood_type, quantity, safety_threshold, updated_at FROM blood_inventory WHERE hospital_id = 1 AND quantity < safety_threshold ORDER BY quantity ASC")
    alerts = []
    for row in fetchall_dict(cursor):
        item = dict(row)
        item["status"] = status_for(item["quantity"], item["safety_threshold"])
        item["emergency_mode"] = item["status"] == "EMERGENCY"
        alerts.append(item)
    conn.close(); return alerts

@router.put("/inventory")
async def update_inventory(data: BloodInventoryBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = get_cursor(conn)
    try:
        cursor.execute("SELECT quantity, safety_threshold FROM blood_inventory WHERE hospital_id = 1 AND blood_type = %s", (data.blood_type,))
        old = fetchone_dict(cursor)
        old_qty = old["quantity"] if old else 0
        old_threshold = old["safety_threshold"] if old else 0
        cursor.execute("""
            INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold)
            VALUES (1, %s, %s, %s)
            ON CONFLICT (hospital_id, blood_type) DO UPDATE SET
                quantity = excluded.quantity,
                safety_threshold = excluded.safety_threshold,
                updated_at = CURRENT_TIMESTAMP
        """, (data.blood_type, data.quantity, data.safety_threshold))
        diff = data.quantity - old_qty
        if diff != 0:
            cursor.execute(
                "INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note) VALUES (1, %s, %s, %s, %s)",
                (data.blood_type, abs(diff), "IN" if diff > 0 else "OUT", f"Manual update by {current_user['full_name']}")
            )
        cursor.execute(
            "INSERT INTO audit_logs (user_id, action, target_type, target_id, old_value, new_value) VALUES (%s, 'UPDATE_INVENTORY', 'blood_inventory', 1, %s, %s)",
            (current_user["id"], f"Qty: {old_qty}, Threshold: {old_threshold}", f"Qty: {data.quantity}, Threshold: {data.safety_threshold}")
        )
        conn.commit(); return {"message": "Inventory updated"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.get("/transactions")
async def get_transactions(limit: int = 80, blood_type: str | None = None, current_user: dict = Depends(get_current_user)):
    """Return recent blood bank IN/OUT transaction history for Hospital Admin."""
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    limit = max(1, min(int(limit or 80), 200))
    conn = get_db_connection(); cursor = get_cursor(conn)
    if blood_type:
        cursor.execute("""
            SELECT id, blood_type, quantity, transaction_type, note, created_at
            FROM inventory_transactions
            WHERE hospital_id = 1 AND blood_type = %s
            ORDER BY created_at DESC, id DESC
            LIMIT %s
        """, (blood_type, limit))
    else:
        cursor.execute("""
            SELECT id, blood_type, quantity, transaction_type, note, created_at
            FROM inventory_transactions
            WHERE hospital_id = 1
            ORDER BY created_at DESC, id DESC
            LIMIT %s
        """, (limit,))
    rows = [dict(r) for r in fetchall_dict(cursor)]
    conn.close()
    return rows


@router.post("/transactions")
async def create_transaction(data: InventoryTransactionCreate, current_user: dict = Depends(get_current_user)):
    """Create an inventory IN/OUT transaction and update blood stock consistently."""
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    tx_type = (data.transaction_type or "").upper().strip()
    if tx_type not in {"IN", "OUT"}:
        raise HTTPException(status_code=400, detail="transaction_type must be IN or OUT")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be greater than 0")

    conn = get_db_connection(); cursor = get_cursor(conn)
    try:
        cursor.execute("SELECT quantity, safety_threshold FROM blood_inventory WHERE hospital_id=1 AND blood_type=%s", (data.blood_type,))
        row = fetchone_dict(cursor)
        current_qty = float(row["quantity"] or 0) if row else 0.0
        threshold = float(row["safety_threshold"] or 10) if row else 10.0
        new_qty = current_qty + data.quantity if tx_type == "IN" else current_qty - data.quantity
        if new_qty < 0:
            raise HTTPException(status_code=400, detail=f"Không thể xuất {data.quantity}L vì kho {data.blood_type} chỉ còn {current_qty}L")

        cursor.execute("""
            INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold)
            VALUES (1, %s, %s, %s)
            ON CONFLICT (hospital_id, blood_type) DO UPDATE SET
                quantity = excluded.quantity,
                updated_at = CURRENT_TIMESTAMP
        """, (data.blood_type, new_qty, threshold))
        cursor.execute("""
            INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note)
            VALUES (1, %s, %s, %s, %s)
            RETURNING id
        """, (data.blood_type, data.quantity, tx_type, data.note or ("Nhập kho" if tx_type == "IN" else "Xuất kho")))
        tx_id = fetchone_dict(cursor)["id"]
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, target_type, target_id, old_value, new_value)
            VALUES (%s, 'CREATE_INVENTORY_TRANSACTION', 'inventory_transactions', %s, %s, %s)
        """, (current_user["id"], tx_id, f"{data.blood_type}: {current_qty}L", f"{data.blood_type}: {new_qty}L via {tx_type} {data.quantity}L"))
        conn.commit()
        return {"message": "Transaction recorded", "blood_type": data.blood_type, "old_quantity": current_qty, "new_quantity": new_qty, "status": status_for(new_qty, threshold)}
    except HTTPException:
        conn.rollback(); raise
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()