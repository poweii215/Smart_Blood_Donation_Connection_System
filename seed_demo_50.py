"""Seed 50 realistic demo records for SBDCs.

Usage from project root:
    python seed_demo_50.py

The script is idempotent enough for demo: it recreates demo donors with phone range
0920000001-0920000050, adds realistic appointments, and fills blood-bank IN/OUT
transactions for forecasting charts.
"""
from __future__ import annotations

from datetime import datetime, timedelta
import random

from backend.database import init_db, get_db_connection, BLOOD_TYPES
from backend.db_helpers import get_cursor, fetchone_dict, fetchall_dict

random.seed(20260522)

FIRST = [
    "Nguyen", "Tran", "Le", "Pham", "Hoang", "Bui", "Dang", "Vu", "Do", "Phan",
    "Vo", "Huynh", "Ngo", "Duong", "Ly", "Truong", "Dinh", "Mai", "Ta", "Cao",
]
MIDDLE = [
    "Van", "Thi", "Minh", "Hoang", "Thanh", "Quang", "Gia", "Phuong", "Bao", "Anh",
    "Ngoc", "Duc", "Thu", "Khanh", "Huu", "My", "Hai", "Tien", "Quoc", "Nhat",
]
LAST = [
    "An", "Binh", "Chau", "Dung", "Giang", "Han", "Huy", "Kiet", "Lam", "Linh",
    "Mai", "Nam", "Nhi", "Phong", "Quan", "Son", "Thao", "Trang", "Tuan", "Vy",
]
BLOOD_WEIGHTS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
STATUSES = ["PENDING", "APPROVED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]


def clean_email(name: str, idx: int) -> str:
    slug = ".".join(name.lower().split())
    return f"{slug}{idx:02d}@demo.sbdcs.local"


def main() -> None:
    init_db()
    conn = get_db_connection()
    cur = get_cursor(conn)
    now = datetime.utcnow()

    # Baseline inventory so shortage and forecast visuals are meaningful.
    base_inventory = {
        "O+": (32, 18), "O-": (6, 12), "A+": (14, 16), "A-": (5, 10),
        "B+": (24, 14), "B-": (7, 10), "AB+": (18, 8), "AB-": (3, 8),
    }
    for blood_type, (qty, threshold) in base_inventory.items():
        cur.execute("""
            INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold)
            VALUES (1, %s, %s, %s)
            ON CONFLICT(hospital_id, blood_type) DO UPDATE SET
                quantity=excluded.quantity,
                safety_threshold=excluded.safety_threshold,
                updated_at=CURRENT_TIMESTAMP
        """, (blood_type, qty, threshold))

    # Clear previous demo-generated range to make reruns predictable.
    cur.execute("SELECT id FROM users WHERE phone BETWEEN '0920000001' AND '0920000050'")
    demo_ids = [row["id"] for row in fetchall_dict(cur)]
    if demo_ids:
        placeholders = ",".join("%s" for _ in demo_ids)
        cur.execute(f"DELETE FROM appointments WHERE donor_id IN ({placeholders})", demo_ids)
        cur.execute(f"DELETE FROM recommendation_results WHERE user_id IN ({placeholders})", demo_ids)
        cur.execute(f"DELETE FROM email_logs WHERE user_id IN ({placeholders})", demo_ids)
        cur.execute(f"DELETE FROM users WHERE id IN ({placeholders})", demo_ids)

    donor_ids = []
    for i in range(1, 51):
        name = f"{FIRST[(i-1) % len(FIRST)]} {MIDDLE[(i*3) % len(MIDDLE)]} {LAST[(i*7) % len(LAST)]}"
        phone = f"09200000{i:02d}"
        blood_type = BLOOD_WEIGHTS[(i * 5) % len(BLOOD_WEIGHTS)]
        reliability = random.randint(68, 99)
        total_donations = random.randint(0, 9)
        points = total_donations * 80 + random.randint(0, 120)
        last_days = random.choice([None, 20, 45, 70, 90, 120, 160, 220, 300]) if total_donations else None
        last_date = (now - timedelta(days=last_days)).isoformat(timespec="seconds") if last_days else None
        birth_year = random.randint(1978, 2005)
        birth_date = f"{birth_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        gender = random.choice(["MALE", "FEMALE", "OTHER"])
        weight = random.randint(48, 88)
        height = random.randint(155, 182)
        address = random.choice([
            "Quận 1, TP.HCM", "Bình Thạnh, TP.HCM", "Gò Vấp, TP.HCM", "Thủ Đức, TP.HCM",
            "Tân Bình, TP.HCM", "Quận 7, TP.HCM", "Phú Nhuận, TP.HCM", "Bình Tân, TP.HCM",
        ])
        occupation = random.choice(["Sinh viên", "Nhân viên văn phòng", "Kỹ sư", "Giáo viên", "Nhân viên y tế", "Kinh doanh", "Tài xế", "Freelancer"])
        cur.execute("""
            INSERT INTO users (
                phone, email, password, full_name, role, blood_type, birth_date, gender,
                weight, height, address, occupation, reliability_score, humanitarian_points,
                total_donations, last_donation_date
            ) VALUES (%s, %s, 'phone-login', %s, 'DONOR', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (phone, clean_email(name, i), name, blood_type, birth_date, gender, weight, height, address, occupation, reliability, points, total_donations, last_date))
        donor_ids.append((fetchone_dict(cur)["id"], blood_type, last_date, name))

    # Appointments: historical completed/cancelled plus upcoming records.
    for idx, (donor_id, blood_type, last_date, name) in enumerate(donor_ids, start=1):
        if last_date:
            cur.execute("""
                INSERT INTO appointments (donor_id, hospital_id, appointment_date, status, pre_screening_result, notes)
                VALUES (%s, 1, %s, 'COMPLETED', 'ELIGIBLE', %s)
            """, (donor_id, last_date, "Demo: đã hoàn tất hiến máu"))
        if idx % 3 == 0:
            future = now + timedelta(days=random.randint(1, 25), hours=random.randint(8, 16))
            status = random.choice(["PENDING", "APPROVED"])
            cur.execute("""
                INSERT INTO appointments (donor_id, hospital_id, appointment_date, status, pre_screening_result, notes)
                VALUES (%s, 1, %s, %s, 'ELIGIBLE', %s)
            """, (donor_id, future.isoformat(timespec="seconds"), status, "Demo: lịch hẹn sắp tới"))
        if idx % 11 == 0:
            old = now - timedelta(days=random.randint(10, 80))
            cur.execute("""
                INSERT INTO appointments (donor_id, hospital_id, appointment_date, status, pre_screening_result, notes)
                VALUES (%s, 1, %s, 'CANCELLED', 'ELIGIBLE', %s)
            """, (donor_id, old.isoformat(timespec="seconds"), "Demo: donor đã hủy lịch"))

    # Blood inventory transaction history for 9 months.
    cur.execute("DELETE FROM inventory_transactions WHERE note LIKE 'DEMO:%'")
    for month_offset in range(8, -1, -1):
        month_date = now - timedelta(days=30 * month_offset)
        for blood_type in BLOOD_TYPES:
            in_qty = round(random.uniform(6, 22), 1)
            out_qty = round(random.uniform(4, 20), 1)
            # Make rare blood look more pressured.
            if blood_type in {"O-", "AB-", "A-"}:
                out_qty += random.uniform(3, 8)
            cur.execute("""
                INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note, created_at)
                VALUES (1, %s, %s, 'IN', 'DEMO: tiếp nhận từ người hiến', %s)
            """, (blood_type, in_qty, (month_date + timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")))
            cur.execute("""
                INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note, created_at)
                VALUES (1, %s, %s, 'OUT', 'DEMO: sử dụng điều trị/thủ thuật', %s)
            """, (blood_type, round(out_qty, 1), (month_date + timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()
    print("Seeded 50 realistic donors, appointments, and blood inventory transactions for demo.")
    print("Demo donor phones: 0920000001 ... 0920000050")
    print("Hospital login: hospital@sbdcs.com / Admin@123")


if __name__ == "__main__":
    main()