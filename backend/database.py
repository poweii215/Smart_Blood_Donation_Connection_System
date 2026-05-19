import sqlite3
import os
import time

DB_PATH = os.path.join(os.getcwd(), "database.sqlite")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(retry=True):
    print(f"DEBUG: Initializing database at {os.path.abspath(DB_PATH)}")
    
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check integrity first
        try:
            cursor.execute("PRAGMA integrity_check")
            res = cursor.fetchone()
            if res and res[0] != "ok":
                raise sqlite3.DatabaseError("Integrity check failed")
        except sqlite3.DatabaseError:
            raise sqlite3.DatabaseError("database disk image is malformed")

        # Create all tables in one go
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('DONOR', 'HOSPITAL_ADMIN')),
                blood_type TEXT DEFAULT 'UNKNOWN',
                lat REAL,
                lng REAL,
                reliability_score REAL DEFAULT 100,
                total_donations INTEGER DEFAULT 0,
                humanitarian_points INTEGER DEFAULT 0,
                last_donation_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS hospitals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                lat REAL,
                lng REAL,
                contact_phone TEXT,
                contact_email TEXT,
                status TEXT DEFAULT 'ACTIVE',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS blood_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hospital_id INTEGER,
                blood_type TEXT NOT NULL,
                quantity REAL DEFAULT 0,
                safety_threshold REAL DEFAULT 10,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
                UNIQUE(hospital_id, blood_type)
            );

            CREATE TABLE IF NOT EXISTS inventory_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hospital_id INTEGER NOT NULL,
                blood_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                transaction_type TEXT CHECK(transaction_type IN ('IN', 'OUT')),
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
            );

            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                donor_id INTEGER NOT NULL,
                hospital_id INTEGER NOT NULL,
                appointment_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
                pre_screening_result TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (donor_id) REFERENCES users(id),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                target_type TEXT,
                target_id INTEGER,
                old_value TEXT,
                new_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS login_otps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                otp_code TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_login_otps_phone ON login_otps(phone);

            CREATE TABLE IF NOT EXISTS recommendation_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hospital_id INTEGER NOT NULL,
                blood_type TEXT NOT NULL,
                requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER NOT NULL,
                score REAL NOT NULL,
                invitation_status TEXT DEFAULT 'SENT' CHECK(invitation_status IN ('SENT','ACCEPTED','DECLINED','NO_RESPONSE')),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)

        # Lightweight migrations for old SQLite files
        cursor.execute("PRAGMA table_info(users)")
        user_columns = {row[1] for row in cursor.fetchall()}
        if "phone" not in user_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        if "email" not in user_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        if "total_donations" not in user_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN total_donations INTEGER DEFAULT 0")
        if "updated_at" not in user_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")

        # Backfill phone for legacy email-based seed users, then keep phone unique with an index.
        cursor.execute("SELECT id, phone, email FROM users")
        for row in cursor.fetchall():
            if not row["phone"]:
                fallback_phone = f"090000{int(row['id']):04d}"
                cursor.execute("UPDATE users SET phone = ? WHERE id = ?", (fallback_phone, row["id"]))
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone)")

        # Seed initial hospital if empty
        cursor.execute("SELECT COUNT(*) as count FROM hospitals")
        if cursor.fetchone()["count"] == 0:
            print("DEBUG: Seeding initial hospital...")
            cursor.execute(
                "INSERT INTO hospitals (name, address, lat, lng, contact_phone) VALUES (?, ?, ?, ?, ?)",
                ("Central Blood Center", "123 Healthcare Ave", 10.762622, 106.660172, "0123456789")
            )
            hospital_id = cursor.lastrowid
            
            blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
            for b_type in blood_types:
                cursor.execute(
                    "INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold) VALUES (?, ?, ?, ?)", 
                    (hospital_id, b_type, 0, 10)
                )
        
        # Seed initial users if empty
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()["count"] <= 2: # Only if we only have the defaults
            print("DEBUG: Seeding extensive test data...")
            import random
            from datetime import datetime, timedelta
            from .core.security import get_password_hash
            
            # Ensure admin and donor exist
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE phone = ?", ("0900000001",))
            if cursor.fetchone()["count"] == 0:
                cursor.execute(
                    "INSERT INTO users (phone, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
                    ("0900000001", "admin@sbdcs.com", get_password_hash("admin123"), "Hospital Staff", "HOSPITAL_ADMIN")
                )
            
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE phone = ?", ("0900000002",))
            if cursor.fetchone()["count"] == 0:
                cursor.execute(
                    "INSERT INTO users (phone, email, password, full_name, role, blood_type, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    ("0900000002", "donor@sbdcs.com", get_password_hash("donor123"), "John Donor", "DONOR", "O+", 10.78, 106.68)
                )

            blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
            
            # 1. Seed more Hospitals
            hospitals_data = [
                ("Cho Ray Hospital", "201B Nguyen Chi Thanh, District 5, HCMC", 10.7578, 106.6635),
                ("Tu Du Hospital", "284 Cong Quynh, District 1, HCMC", 10.7681, 106.6821),
                ("Blood Transfusion Hematology Hospital", "118 Hong Bang, District 5, HCMC", 10.7546, 106.6641),
                ("Gia Dinh People's Hospital", "1 No Trang Long, Binh Thanh, HCMC", 10.8035, 106.6942),
                ("115 People's Hospital", "527 Su Van Hanh, District 10, HCMC", 10.7758, 106.6668)
            ]
            
            hospital_ids = []
            for name, addr, lat, lng in hospitals_data:
                cursor.execute("SELECT id FROM hospitals WHERE name = ?", (name,))
                existing = cursor.fetchone()
                if not existing:
                    cursor.execute(
                        "INSERT INTO hospitals (name, address, lat, lng, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?, ?)",
                        (name, addr, lat, lng, f"028{random.randint(1000000, 9999999)}", f"contact@{name.lower().replace(' ', '')}.vn")
                    )
                    h_id = cursor.lastrowid
                else:
                    h_id = existing["id"]
                hospital_ids.append(h_id)
                
                # Seed Inventory
                for b_type in blood_types:
                    qty = round(random.uniform(2.0, 25.0), 1)
                    cursor.execute(
                        "INSERT OR IGNORE INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold) VALUES (?, ?, ?, ?)",
                        (h_id, b_type, qty, 10.0)
                    )

            # 2. Seed 50 Donors
            donor_ids = []
            names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Phan", "Vu", "Dang", "Bui"]
            m_names = ["Van", "Thi", "Minh", "Hoang", "Duc", "Anh", "Ngoc", "Quang"]
            l_names = ["An", "Binh", "Chinh", "Dung", "Em", "Giang", "Hung", "Kiet", "Linh", "Mai"]

            for i in range(50):
                email = f"donor{i+1}@example.com"
                phone = f"091{(i+1):07d}"
                cursor.execute("SELECT id FROM users WHERE phone = ?", (phone,))
                if not cursor.fetchone():
                    full_name = f"{random.choice(names)} {random.choice(m_names)} {random.choice(l_names)}"
                    b_type = random.choice(blood_types)
                    cursor.execute(
                        "INSERT INTO users (phone, email, password, full_name, role, blood_type, humanitarian_points, reliability_score, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (phone, email, get_password_hash("password123"), full_name, "DONOR", b_type, random.randint(0, 1200), random.randint(80, 100), 10.70 + random.random()*0.15, 106.62 + random.random()*0.12)
                    )
                    donor_ids.append(cursor.lastrowid)

            # 3. Seed 50 Appointments
            cursor.execute("SELECT id FROM users WHERE role = 'DONOR'")
            all_donors = [r["id"] for r in cursor.fetchall()]
            cursor.execute("SELECT id FROM hospitals")
            all_hospitals = [r["id"] for r in cursor.fetchall()]
            
            statuses = ['PENDING', 'APPROVED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            for i in range(50):
                donor_id = random.choice(all_donors)
                hosp_id = random.choice(all_hospitals)
                status = random.choice(statuses)
                days_diff = random.randint(-30, 30)
                appt_date = (datetime.now() + timedelta(days=days_diff)).strftime("%Y-%m-%dT%H:%M")
                
                cursor.execute(
                    "INSERT INTO appointments (donor_id, hospital_id, appointment_date, status, notes, pre_screening_result) VALUES (?, ?, ?, ?, ?, ?)",
                    (donor_id, hosp_id, appt_date, status, "Seeded test appointment", "Weight: 65kg, Healthy: True")
                )
            print("DEBUG: Extensive seeding complete.")
        
        conn.commit()
        print("DEBUG: Database initialization successful.")
    except sqlite3.DatabaseError as e:
        if conn:
            try:
                conn.close()
            except:
                pass
            conn = None
            
        if "malformed" in str(e).lower() and retry:
            print(f"WARNING: Database is malformed. Attempting to recreate... Error: {e}")
            if os.path.exists(DB_PATH):
                try:
                    # Try renaming first (often works better on Windows if there's a soft lock)
                    bak_path = DB_PATH + f".bak.{int(time.time())}"
                    os.rename(DB_PATH, bak_path)
                    print(f"DEBUG: Malformed database renamed to {bak_path}")
                except:
                    try:
                        os.remove(DB_PATH)
                        print("DEBUG: Malformed database file removed.")
                    except Exception as del_err:
                        print(f"ERROR: Could not remove malformed database: {del_err}")
                
                # Also remove journal files if they exist
                for suffix in ["-journal", "-wal", "-shm"]:
                    journal_path = DB_PATH + suffix
                    if os.path.exists(journal_path):
                        try:
                            os.remove(journal_path)
                        except:
                            pass
            
            # Check if file still exists before retrying
            if os.path.exists(DB_PATH):
                print("ERROR: Malformed database file still exists. Cannot recover automatically.")
                return
                
            return init_db(retry=False)
        else:
            print(f"ERROR: Database initialization failed: {str(e)}")
            import traceback
            traceback.print_exc()
    except Exception as e:
        print(f"ERROR: Database initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass



