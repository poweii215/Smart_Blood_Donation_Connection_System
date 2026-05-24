import os
import time
import bcrypt
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv("DATABASE_URL", "")
DEFAULT_HOSPITAL_ID = 1

BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']


def _password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _is_bcrypt_hash(value: str) -> bool:
    return isinstance(value, str) and value.startswith(('$2a$', '$2b$', '$2y$'))


def get_db_connection():
    """Return a psycopg2 connection with RealDictCursor so rows behave like dicts."""
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def _table_columns(cursor, table: str) -> set:
    """Return set of column names for *table* (PostgreSQL version of PRAGMA table_info)."""
    cursor.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (table,),
    )
    return {row[0] for row in cursor.fetchall()}


def _fetchone_dict(cursor):
    """Fetch one row as a plain dict (works with any cursor)."""
    row = cursor.fetchone()
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))


def _fetchall_dict(cursor):
    """Fetch all rows as plain dicts."""
    rows = cursor.fetchall()
    if not rows:
        return []
    if isinstance(rows[0], dict):
        return rows
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


def init_db():
    """Create tables, run lightweight migrations, and seed demo data."""
    print("DEBUG: Initializing PostgreSQL database …")
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # ── Create tables ──────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id                  SERIAL PRIMARY KEY,
                phone               TEXT UNIQUE NOT NULL,
                email               TEXT UNIQUE,
                password            TEXT DEFAULT 'phone-login',
                full_name           TEXT NOT NULL DEFAULT 'New Donor',
                role                TEXT NOT NULL DEFAULT 'DONOR'
                                        CHECK (role IN ('DONOR', 'HOSPITAL_ADMIN')),
                blood_type          TEXT DEFAULT 'UNKNOWN',
                birth_date          TEXT,
                gender              TEXT,
                citizen_id          TEXT,
                weight              REAL,
                height              REAL,
                address             TEXT,
                occupation          TEXT,
                avatar_url          TEXT,
                lat                 REAL,
                lng                 REAL,
                reliability_score   REAL DEFAULT 100,
                total_donations     INTEGER DEFAULT 0,
                humanitarian_points INTEGER DEFAULT 0,
                last_donation_date  TEXT,
                created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS hospitals (
                id                    SERIAL PRIMARY KEY,
                name                  TEXT NOT NULL,
                address               TEXT NOT NULL,
                lat                   REAL,
                lng                   REAL,
                contact_phone         TEXT,
                contact_email         TEXT,
                hospital_code         TEXT,
                city                  TEXT,
                district              TEXT,
                contact_name          TEXT,
                contact_title         TEXT,
                contact_person_phone  TEXT,
                contact_person_email  TEXT,
                status                TEXT DEFAULT 'ACTIVE',
                created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS blood_inventory (
                id                SERIAL PRIMARY KEY,
                hospital_id       INTEGER DEFAULT 1,
                blood_type        TEXT NOT NULL,
                quantity          REAL DEFAULT 0,
                safety_threshold  REAL DEFAULT 10,
                updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (hospital_id, blood_type)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS inventory_transactions (
                id               SERIAL PRIMARY KEY,
                hospital_id      INTEGER DEFAULT 1,
                blood_type       TEXT NOT NULL,
                quantity         REAL NOT NULL,
                transaction_type TEXT CHECK (transaction_type IN ('IN', 'OUT')),
                note             TEXT,
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id                   SERIAL PRIMARY KEY,
                donor_id             INTEGER NOT NULL REFERENCES users(id),
                hospital_id          INTEGER DEFAULT 1,
                appointment_date     TEXT NOT NULL,
                status               TEXT NOT NULL DEFAULT 'PENDING'
                                         CHECK (status IN ('PENDING','APPROVED','CHECKED_IN',
                                                           'IN_PROGRESS','COMPLETED','CANCELLED')),
                pre_screening_result TEXT,
                notes                TEXT,
                created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER,
                action      TEXT NOT NULL,
                target_type TEXT,
                target_id   INTEGER,
                old_value   TEXT,
                new_value   TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS recommendation_results (
                id                SERIAL PRIMARY KEY,
                hospital_id       INTEGER DEFAULT 1,
                blood_type        TEXT NOT NULL,
                requested_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id           INTEGER NOT NULL REFERENCES users(id),
                score             REAL NOT NULL,
                invitation_status TEXT DEFAULT 'NO_RESPONSE'
                                      CHECK (invitation_status IN ('SENT','ACCEPTED','DECLINED','NO_RESPONSE')),
                email_status      TEXT DEFAULT 'NOT_SENT',
                email_sent_at     TIMESTAMP,
                email_error       TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS email_logs (
                id                        SERIAL PRIMARY KEY,
                recommendation_result_id  INTEGER REFERENCES recommendation_results(id),
                user_id                   INTEGER NOT NULL REFERENCES users(id),
                blood_type                TEXT,
                email_to                  TEXT,
                subject                   TEXT NOT NULL,
                message                   TEXT NOT NULL,
                status                    TEXT NOT NULL DEFAULT 'MOCK_SENT',
                provider                  TEXT DEFAULT 'mock',
                error                     TEXT,
                created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS recommendation_settings (
                id                        INTEGER PRIMARY KEY CHECK (id = 1),
                w_blood                   REAL DEFAULT 0.45,
                w_eligibility             REAL DEFAULT 0.30,
                w_reliability             REAL DEFAULT 0.15,
                w_humanitarian            REAL DEFAULT 0.10,
                emergency_w_blood         REAL DEFAULT 0.60,
                emergency_w_eligibility   REAL DEFAULT 0.25,
                emergency_w_reliability   REAL DEFAULT 0.10,
                emergency_w_humanitarian  REAL DEFAULT 0.05,
                emergency_auto_adjust     INTEGER DEFAULT 1,
                updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS homepage_media (
                id                      INTEGER PRIMARY KEY CHECK (id = 1),
                hospital_image_url      TEXT DEFAULT '/images/hospital-showcase.svg',
                donor_activity_image_url TEXT DEFAULT '/images/donor-activity.svg',
                hospital_title          TEXT DEFAULT 'Central Blood Donation Hospital',
                hospital_subtitle       TEXT DEFAULT 'SBDCs - Kết nối hiến máu nhân đạo',
                updated_by              INTEGER,
                updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                sender     TEXT NOT NULL CHECK (sender IN ('USER', 'BOT')),
                message    TEXT NOT NULL,
                intent     TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ── Lightweight column migrations (add missing columns on old DBs) ─────
        user_cols = _table_columns(cur, 'users')
        col_migrations = {
            'lat':                "ALTER TABLE users ADD COLUMN lat REAL",
            'lng':                "ALTER TABLE users ADD COLUMN lng REAL",
            'occupation':         "ALTER TABLE users ADD COLUMN occupation TEXT",
        }
        for col, sql in col_migrations.items():
            if col not in user_cols:
                cur.execute(sql)

        rec_cols = _table_columns(cur, 'recommendation_results')
        rec_migrations = {
            'email_status':   "ALTER TABLE recommendation_results ADD COLUMN email_status TEXT DEFAULT 'NOT_SENT'",
            'email_sent_at':  "ALTER TABLE recommendation_results ADD COLUMN email_sent_at TIMESTAMP",
            'email_error':    "ALTER TABLE recommendation_results ADD COLUMN email_error TEXT",
        }
        for col, sql in rec_migrations.items():
            if col not in rec_cols:
                cur.execute(sql)

        # ── Indexes ───────────────────────────────────────────────────────────
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone)")

        # ── Seed: single hospital ─────────────────────────────────────────────
        cur.execute("SELECT id FROM hospitals WHERE id = 1")
        if not cur.fetchone():
            cur.execute(
                """
                INSERT INTO hospitals (id, name, address, lat, lng, contact_phone, contact_email, status)
                VALUES (1, %s, %s, %s, %s, %s, %s, 'ACTIVE')
                ON CONFLICT (id) DO NOTHING
                """,
                ("Central Blood Donation Hospital",
                 "Thông tin cập nhật bởi bệnh viện trong phần cài đặt",
                 10.7572, 106.6590, "0900000001", "hospital@sbdcs.com"),
            )
        cur.execute(
            "UPDATE hospitals SET name=%s, address=%s, status='ACTIVE' WHERE id=1",
            ("Central Blood Donation Hospital",
             "Thông tin cập nhật bởi bệnh viện trong phần cài đặt"),
        )
        cur.execute("DELETE FROM hospitals WHERE id <> 1")

        # ── Seed: blood inventory ─────────────────────────────────────────────
        cur.execute("""
            SELECT blood_type, SUM(quantity) AS quantity, AVG(safety_threshold) AS safety_threshold
            FROM blood_inventory
            GROUP BY blood_type
        """)
        merged_inventory = {
            row[0]: (row[1] or 0, row[2] or 10)
            for row in cur.fetchall()
        }
        cur.execute("DELETE FROM blood_inventory")
        for b_type in BLOOD_TYPES:
            qty, threshold = merged_inventory.get(
                b_type, (8 if b_type in ('O-', 'A-') else 15, 10)
            )
            cur.execute(
                """
                INSERT INTO blood_inventory (hospital_id, blood_type, quantity, safety_threshold)
                VALUES (1, %s, %s, %s)
                ON CONFLICT (hospital_id, blood_type) DO UPDATE
                    SET quantity = EXCLUDED.quantity,
                        safety_threshold = EXCLUDED.safety_threshold
                """,
                (b_type, qty, threshold),
            )

        cur.execute("UPDATE appointments SET hospital_id = 1 WHERE hospital_id IS NULL OR hospital_id <> 1")
        cur.execute("UPDATE inventory_transactions SET hospital_id = 1 WHERE hospital_id IS NULL OR hospital_id <> 1")

        # ── Seed: recommendation settings ─────────────────────────────────────
        cur.execute("""
            INSERT INTO recommendation_settings
                (id, w_blood, w_eligibility, w_reliability, w_humanitarian,
                 emergency_w_blood, emergency_w_eligibility, emergency_w_reliability,
                 emergency_w_humanitarian, emergency_auto_adjust)
            VALUES (1, 0.45, 0.30, 0.15, 0.10, 0.60, 0.25, 0.10, 0.05, 1)
            ON CONFLICT (id) DO NOTHING
        """)

        # ── Seed: homepage media ──────────────────────────────────────────────
        cur.execute("""
            INSERT INTO homepage_media
                (id, hospital_image_url, donor_activity_image_url, hospital_title, hospital_subtitle)
            VALUES (1, '/images/hospital-showcase.svg', '/images/donor-activity.svg',
                    'Central Blood Donation Hospital', 'SBDCs - Kết nối hiến máu nhân đạo')
            ON CONFLICT (id) DO NOTHING
        """)
        cur.execute("""
            UPDATE homepage_media
            SET hospital_title    = 'Central Blood Donation Hospital',
                hospital_subtitle = 'SBDCs - Kết nối hiến máu nhân đạo'
            WHERE id = 1
              AND (hospital_title IS NULL
                   OR hospital_title LIKE '%Chợ Rẫy%'
                   OR hospital_title LIKE '%Choray%'
                   OR hospital_title = 'Central Blood Hospital')
        """)

        # ── Seed: Hospital Admin accounts ─────────────────────────────────────
        hospital_password_hash = _password_hash('Admin@123')
        cur.execute("SELECT id, password FROM users WHERE phone = '0900000001'")
        row = _fetchone_dict(cur)
        if not row:
            cur.execute(
                """
                INSERT INTO users (phone, email, password, full_name, role, blood_type,
                                   reliability_score, humanitarian_points)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (phone) DO NOTHING
                """,
                ('0900000001', 'hospital@sbdcs.com', hospital_password_hash,
                 'Hospital Admin', 'HOSPITAL_ADMIN', 'UNKNOWN', 100, 0),
            )
        elif not _is_bcrypt_hash(row['password']):
            cur.execute(
                "UPDATE users SET email=%s, password=%s, role='HOSPITAL_ADMIN', full_name='Hospital Admin' WHERE phone='0900000001'",
                ('hospital@sbdcs.com', hospital_password_hash),
            )

        second_admin_hash = _password_hash('Admin@123')
        cur.execute("SELECT id, password FROM users WHERE phone = '0900000099'")
        row2 = _fetchone_dict(cur)
        if not row2:
            cur.execute(
                """
                INSERT INTO users (phone, email, password, full_name, role, blood_type,
                                   reliability_score, humanitarian_points)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (phone) DO NOTHING
                """,
                ('0900000099', 'hospital2@sbdcs.com', second_admin_hash,
                 'Hospital Admin 2', 'HOSPITAL_ADMIN', 'UNKNOWN', 100, 0),
            )
        elif not _is_bcrypt_hash(row2['password']):
            cur.execute(
                "UPDATE users SET email=%s, password=%s, role='HOSPITAL_ADMIN', full_name='Hospital Admin 2' WHERE phone='0900000099'",
                ('hospital2@sbdcs.com', second_admin_hash),
            )

        cur.execute("DELETE FROM users WHERE role='HOSPITAL_ADMIN' AND phone NOT IN ('0900000001','0900000099')")

        # ── Seed: demo donor ──────────────────────────────────────────────────
        cur.execute("SELECT id FROM users WHERE phone = '0900000002'")
        if not cur.fetchone():
            cur.execute(
                """
                INSERT INTO users (phone, email, password, full_name, role, blood_type,
                                   reliability_score, humanitarian_points, total_donations)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (phone) DO NOTHING
                """,
                ('0900000002', 'donor@sbdcs.com', 'phone-login',
                 'Nguyen Van Donor', 'DONOR', 'O+', 95, 120, 2),
            )

        # ── Seed: sample donors ───────────────────────────────────────────────
        cur.execute("SELECT COUNT(*) AS c FROM users WHERE role='DONOR'")
        count_row = cur.fetchone()
        donor_count = count_row[0] if isinstance(count_row, tuple) else count_row['c']
        if donor_count < 12:
            sample_donors = [
                ('0910000001', 'Tran Minh Anh',       'tran.minh.anh@example.com',      'A+',      92,  240, 3, 120),
                ('0910000002', 'Le Hoang Nam',         'le.hoang.nam@example.com',        'O-',      98,  800, 9, 100),
                ('0910000003', 'Pham Ngoc Mai',        'pham.ngoc.mai@example.com',       'B+',      88,  160, 2,  40),
                ('0910000004', 'Hoang Duc Huy',        'hoang.duc.huy@example.com',       'AB+',     76,   60, 1, 200),
                ('0910000005', 'Bui Thanh Lam',        'bui.thanh.lam@example.com',       'A-',      99,  560, 6,  92),
                ('0910000006', 'Vu Quang Kiet',        'vu.quang.kiet@example.com',       'O+',      84,  320, 4,  10),
                ('0910000007', 'Dang Gia Han',         'dang.gia.han@example.com',        'B-',      90,  410, 5,  95),
                ('0910000008', 'Nguyen Phuong Linh',   'nguyen.phuong.linh@example.com',  'AB-',     96,  900,10, 130),
                ('0910000009', 'Tran Bao Chau',        'tran.bao.chau@example.com',       'UNKNOWN', 100,  30, 0, None),
                ('0910000010', 'Le Anh Tuan',          'le.anh.tuan@example.com',         'O+',      70,   50, 1, 160),
            ]
            for phone, name, email, blood_type, reliability, points, total, last_days in sample_donors:
                cur.execute("SELECT id FROM users WHERE phone=%s", (phone,))
                if cur.fetchone():
                    continue
                last_date = None
                if last_days is not None:
                    last_date = (datetime.utcnow() - timedelta(days=last_days)).isoformat()
                cur.execute(
                    """
                    INSERT INTO users (phone, email, password, full_name, role, blood_type,
                                       reliability_score, humanitarian_points, total_donations,
                                       last_donation_date)
                    VALUES (%s, %s, 'phone-login', %s, 'DONOR', %s, %s, %s, %s, %s)
                    ON CONFLICT (phone) DO NOTHING
                    """,
                    (phone, email, name, blood_type, reliability, points, total, last_date),
                )

        cur.execute("""
            UPDATE users
            SET email = LOWER(REPLACE(full_name, ' ', '.')) || '@example.com'
            WHERE role='DONOR' AND (email IS NULL OR email='')
        """)

        # ── Seed: forecast demo transactions ──────────────────────────────────
        cur.execute("SELECT COUNT(*) AS c FROM inventory_transactions")
        tx_row = cur.fetchone()
        tx_count = tx_row[0] if isinstance(tx_row, tuple) else tx_row['c']
        if tx_count == 0:
            for month_offset, qty in [(3, 4.5), (2, 7.0), (1, 6.0)]:
                created_at = (datetime.utcnow() - timedelta(days=31 * month_offset)).strftime('%Y-%m-%d %H:%M:%S')
                cur.execute(
                    """
                    INSERT INTO inventory_transactions
                        (hospital_id, blood_type, quantity, transaction_type, note, created_at)
                    VALUES (1, 'O-', %s, 'OUT', 'Treatment usage seed', %s)
                    """,
                    (qty, created_at),
                )

        conn.commit()
        print("DEBUG: PostgreSQL database initialization successful.")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: Database initialization failed: {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        if conn:
            conn.close()