import sqlite3
import os
import random
from datetime import datetime, timedelta
from backend.core.security import get_password_hash

DB_PATH = os.path.join(os.getcwd(), "database.sqlite")

def seed_data():
    if not os.path.exists(DB_PATH):
        print("Database not found. Please run the app first to initialize the DB.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    hospitals_data = [
        ("Cho Ray Hospital", "201B Nguyen Chi Thanh, District 5, HCMC", 10.7578, 106.6635),
        ("Tu Du Hospital", "284 Cong Quynh, District 1, HCMC", 10.7681, 106.6821),
        ("Blood Transfusion Hematology Hospital", "118 Hong Bang, District 5, HCMC", 10.7546, 106.6641),
        ("Gia Dinh People's Hospital", "1 No Trang Long, Binh Thanh, HCMC", 10.8035, 106.6942),
        ("115 People's Hospital", "527 Su Van Hanh, District 10, HCMC", 10.7758, 106.6668)
    ]

    # 1. Seed Hospitals
    hospital_ids = []
    for name, addr, lat, lng in hospitals_data:
        cursor.execute(
            "INSERT INTO hospitals (name, address, lat, lng, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?, ?)",
            (name, addr, lat, lng, f"028{random.randint(1000000, 9999999)}", f"contact@{name.lower().replace(' ', '')}.vn")
        )
        h_id = cursor.lastrowid
        hospital_ids.append(h_id)
        
        # Seed Inventory for each hospital
        for b_type in blood_types:
            qty = round(random.uniform(2.0, 25.0), 1)
            threshold = 10.0
            cursor.execute(
                "INSERT OR REPLACE INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold) VALUES (?, ?, ?, ?)",
                (h_id, b_type, qty, threshold)
            )

    # 2. Seed 50 Donors
    donor_ids = []
    names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Phan", "Vu", "Dang", "Bui"]
    m_names = ["Van", "Thi", "Minh", "Hoang", "Duc", "Anh", "Ngoc", "Quang"]
    l_names = ["An", "Binh", "Chinh", "Dung", "Em", "Giang", "Hung", "Kiet", "Linh", "Mai"]

    for i in range(50):
        full_name = f"{random.choice(names)} {random.choice(m_names)} {random.choice(l_names)}"
        email = f"donor{i+1}@example.com"
        pwd = get_password_hash("password123")
        b_type = random.choice(blood_types)
        points = random.randint(0, 1200)
        reliability = random.randint(80, 100)
        
        cursor.execute(
            "INSERT INTO users (email, password, full_name, role, blood_type, humanitarian_points, reliability_score) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (email, pwd, full_name, "DONOR", b_type, points, reliability)
        )
        donor_ids.append(cursor.lastrowid)

    # 3. Seed 50 Appointments
    statuses = ['PENDING', 'APPROVED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    for i in range(50):
        donor_id = random.choice(donor_ids)
        hosp_id = random.choice(hospital_ids)
        status = random.choice(statuses)
        
        # Random date in the last 30 days or next 30 days
        days_diff = random.randint(-30, 30)
        appt_date = (datetime.now() + timedelta(days=days_diff)).strftime("%Y-%m-%dT%H:%M")
        
        cursor.execute(
            "INSERT INTO appointments (donor_id, hospital_id, appointment_date, status, notes, pre_screening_result) VALUES (?, ?, ?, ?, ?, ?)",
            (donor_id, hosp_id, appt_date, status, "Seeded test appointment", "Weight: 65kg, Healthy: True")
        )

    conn.commit()
    conn.close()
    print("Successfully seeded 100+ realistic data records.")

if __name__ == "__main__":
    seed_data()
