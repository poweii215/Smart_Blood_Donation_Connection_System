from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db_connection
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import RecommendationRequest

router = APIRouter()

COMPATIBLE = {
    "O-": {"O-"}, "O+": {"O-", "O+"},
    "A-": {"O-", "A-"}, "A+": {"O-", "O+", "A-", "A+"},
    "B-": {"O-", "B-"}, "B+": {"O-", "O+", "B-", "B+"},
    "AB-": {"O-", "A-", "B-", "AB-"},
    "AB+": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
}

def is_admin(user):
    return user.get("role") in ADMIN_ROLES

def status_for(quantity, threshold, forecast=0):
    if quantity <= threshold * 0.5 or quantity < forecast * 0.5:
        return "EMERGENCY"
    if quantity < threshold or quantity < forecast:
        return "CRITICAL"
    if quantity < threshold * 1.5:
        return "WARNING"
    return "SAFE"

def eligibility_score(last_donation_date):
    if not last_donation_date:
        return 1.0
    try:
        dt = datetime.fromisoformat(str(last_donation_date).replace('Z','').split('.')[0])
    except Exception:
        return 0.7
    days = (datetime.utcnow() - dt).days
    return max(0, min(1, days / 84))

def days_until_eligible(last_donation_date):
    if not last_donation_date:
        return 0
    try:
        dt = datetime.fromisoformat(str(last_donation_date).replace('Z','').split('.')[0])
    except Exception:
        return 0
    return max(0, 84 - (datetime.utcnow() - dt).days)

def achievement_level(points, total_donations):
    if points >= 1200 or total_donations >= 12:
        return {"level": "Platinum", "badge": "Life Guardian", "next_target": None}
    if points >= 600 or total_donations >= 6:
        return {"level": "Gold", "badge": "Life Saver", "next_target": 1200}
    if points >= 250 or total_donations >= 3:
        return {"level": "Silver", "badge": "Kind Heart", "next_target": 600}
    return {"level": "Bronze", "badge": "First Step Hero", "next_target": 250}

@router.get("/forecast")
async def forecast(months: int = 3, current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    months = max(1, min(months, 12))
    conn = get_db_connection(); cur = conn.cursor()
    since = (datetime.utcnow() - timedelta(days=31 * months)).strftime("%Y-%m-%d")
    cur.execute("""
        SELECT blood_type, strftime('%Y-%m', created_at) as month, SUM(ABS(quantity)) as used_quantity
        FROM inventory_transactions
        WHERE transaction_type = 'OUT' AND created_at >= ?
        GROUP BY blood_type, strftime('%Y-%m', created_at)
    """, (since,))
    rows = [dict(r) for r in cur.fetchall()]
    cur.execute("SELECT blood_type, quantity, safety_threshold FROM blood_inventory WHERE hospital_id = 1")
    inv = [dict(r) for r in cur.fetchall()]
    conn.close()
    results = []
    for item in inv:
        vals = [r["used_quantity"] for r in rows if r["blood_type"] == item["blood_type"]]
        forecast_qty = round(sum(vals) / months, 2) if vals else 0
        risk = status_for(item["quantity"], item["safety_threshold"], forecast_qty)
        results.append({**item, "forecast_next_month": forecast_qty, "risk": risk, "emergency_mode": risk == "EMERGENCY"})
    return results

@router.get("/summary")
async def summary(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection(); cur = conn.cursor()
    if is_admin(current_user):
        cur.execute("SELECT COUNT(*) as c FROM appointments WHERE date(appointment_date) = date('now')")
        today = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM blood_inventory WHERE hospital_id=1 AND quantity < safety_threshold")
        warning = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM blood_inventory WHERE hospital_id=1 AND quantity <= safety_threshold * 0.5")
        emergency = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM users WHERE role='DONOR'")
        donors = cur.fetchone()["c"]
        conn.close()
        return {"today_appointments": today, "warning_blood_types": warning, "emergency_blood_types": emergency, "potential_donors": donors}

    cur.execute("SELECT COUNT(*) as c FROM appointments WHERE donor_id=? AND status='COMPLETED'", (current_user["id"],))
    total = cur.fetchone()["c"]
    cur.execute("SELECT MAX(appointment_date) as d FROM appointments WHERE donor_id=? AND status='COMPLETED'", (current_user["id"],))
    last = cur.fetchone()["d"]
    cur.execute("SELECT humanitarian_points, reliability_score, total_donations, last_donation_date FROM users WHERE id=?", (current_user["id"],))
    u = dict(cur.fetchone())
    conn.close()
    achievements = achievement_level(u.get("humanitarian_points") or 0, u.get("total_donations") or total)
    return {
        "completed_donations": total,
        "last_donation_date": last or u.get("last_donation_date"),
        "days_until_eligible": days_until_eligible(last or u.get("last_donation_date")),
        "reliability_score": u.get("reliability_score") or 100,
        "humanitarian_points": u.get("humanitarian_points") or 0,
        "achievement": achievements,
        "impact_message": "Một lần hiến máu có thể giúp cứu sống tới 3 người. Cảm ơn bạn vì nghĩa cử nhân đạo này."
    }

@router.post("/recommendations")
async def recommendations(data: RecommendationRequest, current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cur = conn.cursor()
    compatible = COMPATIBLE.get(data.blood_type, {data.blood_type})
    placeholders = ','.join('?' for _ in compatible)
    cur.execute(f"""
        SELECT id, full_name, phone, blood_type, reliability_score, humanitarian_points, total_donations, last_donation_date
        FROM users
        WHERE role='DONOR' AND blood_type IN ({placeholders})
    """, tuple(compatible))
    donors = []
    for r in cur.fetchall():
        donor = dict(r)
        blood_score = 1.0 if donor["blood_type"] == data.blood_type else 0.8
        elig = eligibility_score(donor["last_donation_date"])
        rel = (donor["reliability_score"] or 80) / 100
        hum = min(1.0, (donor["humanitarian_points"] or 0) / 1000)
        score = data.w_blood*blood_score + data.w_eligibility*elig + data.w_reliability*rel + data.w_humanitarian*hum
        donor.update({
            "blood_match_score": round(blood_score, 2),
            "eligibility_score": round(elig, 2),
            "days_until_eligible": days_until_eligible(donor["last_donation_date"]),
            "score": round(score, 4),
            "achievement": achievement_level(donor.get("humanitarian_points") or 0, donor.get("total_donations") or 0),
        })
        donors.append(donor)
    donors.sort(key=lambda x: x["score"], reverse=True)
    top = donors[:data.top_n]
    for d in top:
        cur.execute("""
            INSERT INTO recommendation_results (hospital_id, blood_type, user_id, score, invitation_status)
            VALUES (1, ?, ?, ?, 'SENT')
        """, (data.blood_type, d["id"], d["score"]))
    conn.commit(); conn.close()
    return top
