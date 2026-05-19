from datetime import datetime, timedelta
from math import radians, sin, cos, asin, sqrt
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import RecommendationRequest

router = APIRouter()

def is_admin(user):
    return user.get("role") in ADMIN_ROLES

def haversine_km(lat1, lng1, lat2, lng2):
    if None in (lat1, lng1, lat2, lng2):
        return None
    r = 6371
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)**2
    return 2 * r * asin(sqrt(a))

COMPATIBLE = {
    "O-": {"O-"}, "O+": {"O-", "O+"},
    "A-": {"O-", "A-"}, "A+": {"O-", "O+", "A-", "A+"},
    "B-": {"O-", "B-"}, "B+": {"O-", "O+", "B-", "B+"},
    "AB-": {"O-", "A-", "B-", "AB-"},
    "AB+": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
}

def eligibility_score(last_donation_date):
    if not last_donation_date:
        return 1.0
    try:
        dt = datetime.fromisoformat(last_donation_date.replace('Z','').split('.')[0])
    except Exception:
        return 0.7
    days = (datetime.utcnow() - dt).days
    return max(0, min(1, days / 84))

@router.get("/forecast")
async def forecast(months: int = 3, current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    months = max(1, min(months, 12))
    conn = get_db_connection(); cur = conn.cursor()
    since = (datetime.utcnow() - timedelta(days=31 * months)).strftime("%Y-%m-%d")
    cur.execute("""
        SELECT hospital_id, blood_type, strftime('%Y-%m', created_at) as month, SUM(ABS(quantity)) as used_quantity
        FROM inventory_transactions
        WHERE transaction_type = 'OUT' AND created_at >= ?
        GROUP BY hospital_id, blood_type, strftime('%Y-%m', created_at)
    """, (since,))
    rows = [dict(r) for r in cur.fetchall()]
    cur.execute("SELECT hospital_id, blood_type, quantity, safety_threshold FROM blood_inventory")
    inv = [dict(r) for r in cur.fetchall()]
    conn.close()
    results = []
    for item in inv:
        vals = [r["used_quantity"] for r in rows if r["hospital_id"] == item["hospital_id"] and r["blood_type"] == item["blood_type"]]
        forecast_qty = round(sum(vals) / months, 2) if vals else 0
        risk = "LOW"
        if item["quantity"] < item["safety_threshold"] or item["quantity"] < forecast_qty:
            risk = "HIGH"
        elif item["quantity"] < item["safety_threshold"] * 1.5:
            risk = "MEDIUM"
        results.append({**item, "forecast_next_month": forecast_qty, "risk": risk})
    return results

@router.get("/summary")
async def summary(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection(); cur = conn.cursor()
    if is_admin(current_user):
        cur.execute("SELECT COUNT(*) as c FROM appointments WHERE date(appointment_date) = date('now')")
        today = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM blood_inventory WHERE quantity < safety_threshold")
        warning = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM users WHERE role IN ('DONOR')")
        donors = cur.fetchone()["c"]
        conn.close(); return {"today_appointments": today, "warning_blood_types": warning, "potential_donors": donors}
    cur.execute("SELECT COUNT(*) as c FROM appointments WHERE donor_id=? AND status='COMPLETED'", (current_user["id"],))
    total = cur.fetchone()["c"]
    cur.execute("SELECT MAX(appointment_date) as d FROM appointments WHERE donor_id=? AND status='COMPLETED'", (current_user["id"],))
    last = cur.fetchone()["d"]
    conn.close(); return {"completed_donations": total, "last_donation_date": last}

@router.post("/recommendations")
async def recommendations(data: RecommendationRequest, current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cur = conn.cursor()
    cur.execute("SELECT * FROM hospitals WHERE id=?", (data.hospital_id,))
    hospital = cur.fetchone()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    compatible = COMPATIBLE.get(data.blood_type, {data.blood_type})
    cur.execute("""
        SELECT id, full_name, phone, blood_type, lat, lng, reliability_score, humanitarian_points, last_donation_date
        FROM users
        WHERE role='DONOR' AND blood_type IN ({})
    """.format(','.join('?' for _ in compatible)), tuple(compatible))
    donors = []
    for r in cur.fetchall():
        donor = dict(r)
        distance = haversine_km(hospital["lat"], hospital["lng"], donor["lat"], donor["lng"])
        if distance is not None and distance > data.radius_km:
            continue
        distance_score = 0.5 if distance is None else max(0, 1 - distance / data.radius_km)
        blood_score = 1.0 if donor["blood_type"] == data.blood_type else 0.8
        elig = eligibility_score(donor["last_donation_date"])
        rel = (donor["reliability_score"] or 80) / 100
        score = data.w_blood*blood_score + data.w_distance*distance_score + data.w_eligibility*elig + data.w_reliability*rel
        donor.update({"distance_km": None if distance is None else round(distance, 2), "eligibility_score": round(elig, 2), "score": round(score, 4)})
        donors.append(donor)
    donors.sort(key=lambda x: x["score"], reverse=True)
    top = donors[:data.top_n]
    for d in top:
        cur.execute("""
            INSERT INTO recommendation_results (hospital_id, blood_type, user_id, score, invitation_status)
            VALUES (?, ?, ?, ?, 'SENT')
        """, (data.hospital_id, data.blood_type, d["id"], d["score"]))
    conn.commit(); conn.close()
    return top
