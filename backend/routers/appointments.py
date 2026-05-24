from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta, timezone

from ..database import get_db_connection
from ..db_helpers import get_cursor, fetchone_dict, fetchall_dict, DEFAULT_HOSPITAL_ID
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import AppointmentCreate, AppointmentUpdateStatus

router = APIRouter()
MIN_DONATION_INTERVAL_DAYS = 84


def _parse_dt(value: str | None) -> datetime | None:
    """Parse common frontend/SQLite datetime strings safely."""
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    # SQLite CURRENT_TIMESTAMP format
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d",
    ]
    try:
        # Browser datetime-local usually sends YYYY-MM-DDTHH:mm
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        pass
    for fmt in formats:
        try:
            return datetime.strptime(raw[:19], fmt)
        except Exception:
            continue
    return None


def _fmt_date(dt: datetime | None) -> str | None:
    return dt.strftime("%d/%m/%Y") if dt else None


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat(timespec="seconds") if dt else None


def _get_latest_completed(cursor, donor_id: int, exclude_appointment_id: int | None = None):
    if exclude_appointment_id:
        cursor.execute(
            """
            SELECT * FROM appointments
            WHERE donor_id = %s AND status = 'COMPLETED' AND id <> %s
            ORDER BY appointment_date DESC
            LIMIT 1
            """,
            (donor_id, exclude_appointment_id),
        )
    else:
        cursor.execute(
            """
            SELECT * FROM appointments
            WHERE donor_id = %s AND status = 'COMPLETED'
            ORDER BY appointment_date DESC
            LIMIT 1
            """,
            (donor_id,),
        )
    return fetchone_dict(cursor)


def _build_eligibility(cursor, donor_id: int, reference_dt: datetime | None = None):
    reference_dt = reference_dt or datetime.now()
    last = _get_latest_completed(cursor, donor_id)
    last_dt = _parse_dt(last["appointment_date"] if last else None)

    # Fallback for old databases where only users.last_donation_date was updated.
    if not last_dt:
        cursor.execute("SELECT last_donation_date FROM users WHERE id = %s", (donor_id,))
        row = fetchone_dict(cursor)
        last_dt = _parse_dt(row["last_donation_date"] if row else None)

    if not last_dt:
        return {
            "eligible": True,
            "first_time_donor": True,
            "last_donation_date": None,
            "last_donation_display": "Chưa có lần hiến trước",
            "next_eligible_date": None,
            "next_eligible_display": "Có thể đăng ký ngay",
            "days_remaining": 0,
            "min_interval_days": MIN_DONATION_INTERVAL_DAYS,
            "message": "Bạn chưa có lần hiến máu hoàn tất trước đó, có thể đăng ký nếu đạt sàng lọc sức khỏe.",
        }

    next_dt = last_dt + timedelta(days=MIN_DONATION_INTERVAL_DAYS)
    days_remaining = max(0, (next_dt.date() - reference_dt.date()).days)
    eligible = reference_dt >= next_dt
    return {
        "eligible": eligible,
        "first_time_donor": False,
        "last_donation_date": _iso(last_dt),
        "last_donation_display": _fmt_date(last_dt),
        "next_eligible_date": _iso(next_dt),
        "next_eligible_display": _fmt_date(next_dt),
        "days_remaining": days_remaining,
        "min_interval_days": MIN_DONATION_INTERVAL_DAYS,
        "message": "Bạn đã đủ 84 ngày từ lần hiến gần nhất." if eligible else f"Bạn chưa đủ điều kiện hiến máu. Có thể đăng ký lại từ ngày {_fmt_date(next_dt)}.",
    }


def _assert_can_book(cursor, donor_id: int, requested_dt: datetime):
    eligibility = _build_eligibility(cursor, donor_id, requested_dt)
    if not eligibility["eligible"]:
        raise HTTPException(status_code=400, detail=eligibility["message"])
    return eligibility


def _assert_can_mark_completed(cursor, appointment_id: int, donor_id: int, completed_dt: datetime):
    """Prevent two completed donations within the 84-day safety interval."""
    cursor.execute(
        """
        SELECT id, appointment_date
        FROM appointments
        WHERE donor_id = %s AND status = 'COMPLETED' AND id <> %s
        """,
        (donor_id, appointment_id),
    )
    conflicts = []
    for row in fetchall_dict(cursor):
        other_dt = _parse_dt(row["appointment_date"])
        if not other_dt:
            continue
        diff = abs((completed_dt.date() - other_dt.date()).days)
        if diff < MIN_DONATION_INTERVAL_DAYS:
            conflicts.append((row["id"], other_dt, diff))
    if conflicts:
        _, other_dt, diff = sorted(conflicts, key=lambda x: x[2])[0]
        next_dt = other_dt + timedelta(days=MIN_DONATION_INTERVAL_DAYS)
        raise HTTPException(
            status_code=400,
            detail=f"Không thể chuyển COMPLETED: donor đã có lần hiến gần nhất ngày {_fmt_date(other_dt)}. Cần đủ {MIN_DONATION_INTERVAL_DAYS} ngày, có thể hoàn tất lần tiếp theo từ {_fmt_date(next_dt)}.",
        )


@router.get("/eligibility")
async def get_donation_eligibility(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "DONOR":
        raise HTTPException(status_code=403, detail="Only donors can view donation eligibility")
    conn = get_db_connection(); cursor = get_cursor(conn)
    try:
        return _build_eligibility(cursor, current_user["id"])
    finally:
        conn.close()


@router.post("")
async def create_appointment(data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "DONOR":
        raise HTTPException(status_code=403, detail="Only donors can book appointments")
    requested_dt = _parse_dt(data.appointment_date)
    if not requested_dt:
        raise HTTPException(status_code=400, detail="Ngày giờ hẹn không hợp lệ")
    if requested_dt < datetime.now().replace(second=0, microsecond=0):
        raise HTTPException(status_code=400, detail="Không thể đặt lịch trong quá khứ. Vui lòng chọn ngày giờ từ hiện tại trở về sau.")
    max_advance_days = 7
    if requested_dt > datetime.now() + timedelta(days=max_advance_days):
        raise HTTPException(status_code=400, detail=f"Chỉ được đặt lịch trước tối đa {max_advance_days} ngày.")

    conn = get_db_connection(); cursor = get_cursor(conn)
    try:
        _assert_can_book(cursor, current_user["id"], requested_dt)
        cursor.execute(
            "INSERT INTO appointments (donor_id, hospital_id, appointment_date, notes, pre_screening_result) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], DEFAULT_HOSPITAL_ID, data.appointment_date, data.notes, data.pre_screening_result)
        )
        conn.commit()
        return {"message": "Appointment created"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.get("/my")
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection(); cursor = get_cursor(conn)
    cursor.execute("""
        SELECT a.*, 'Central Blood Donation Hospital' as hospital_name, 'Thông tin cập nhật bởi bệnh viện trong phần cài đặt' as hospital_address
        FROM appointments a
        WHERE a.donor_id = %s
        ORDER BY a.appointment_date DESC, a.created_at DESC
    """, (current_user["id"],))
    rows = [dict(row) for row in fetchall_dict(cursor)]
    conn.close(); return rows


@router.get("/all")
async def get_all_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = get_cursor(conn)
    cursor.execute("""
        SELECT a.*, u.full_name as donor_name, u.phone as donor_phone, u.blood_type,
               u.reliability_score, u.humanitarian_points,
               'Central Blood Donation Hospital' as hospital_name
        FROM appointments a
        JOIN users u ON a.donor_id = u.id
        ORDER BY a.appointment_date DESC, a.created_at DESC
    """)
    rows = [dict(row) for row in fetchall_dict(cursor)]
    conn.close(); return rows


@router.patch("/{id}/cancel")
async def cancel_my_appointment(id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "DONOR":
        raise HTTPException(status_code=403, detail="Only donors can cancel their own appointments")
    conn = get_db_connection(); cursor = get_cursor(conn)
    try:
        cursor.execute("SELECT * FROM appointments WHERE id = %s AND donor_id = %s", (id, current_user["id"]))
        app = fetchone_dict(cursor)
        if not app:
            raise HTTPException(status_code=404, detail="Appointment not found")
        if app["status"] not in ("PENDING", "APPROVED"):
            raise HTTPException(status_code=400, detail="Chỉ có thể hủy lịch đang chờ duyệt hoặc đã được duyệt.")
        cursor.execute("UPDATE appointments SET status='CANCELLED', notes = CASE WHEN COALESCE(notes, '') = '' THEN '[Donor cancelled]' ELSE notes || chr(10) || '[Donor cancelled]' END, updated_at=CURRENT_TIMESTAMP WHERE id=%s", (id,))
        cursor.execute("""
            UPDATE users
            SET reliability_score = GREATEST(COALESCE(reliability_score, 80) - 5, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (current_user["id"],))
        conn.commit()
        return {"message": "Appointment cancelled", "status": "CANCELLED", "reliability_penalty": -5}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.patch("/{id}/status")
async def update_status(id: int, data: AppointmentUpdateStatus, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cursor = get_cursor(conn)
    try:
        cursor.execute("""
            SELECT a.*, u.blood_type, u.id as user_id
            FROM appointments a
            JOIN users u ON a.donor_id = u.id
            WHERE a.id = %s
        """, (id,))
        app = fetchone_dict(cursor)
        if not app:
            raise HTTPException(status_code=404, detail="Appointment not found")

        completed_dt = _parse_dt(app["appointment_date"])
        if data.status == "COMPLETED":
            if not completed_dt:
                raise HTTPException(status_code=400, detail="Ngày giờ lịch hẹn không hợp lệ")
            _assert_can_mark_completed(cursor, id, app["user_id"], completed_dt)

        cursor.execute("UPDATE appointments SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (data.status, id))

        if data.status == "COMPLETED":
            qty = 0.45
            blood_type = app["blood_type"] if app["blood_type"] != "UNKNOWN" else "O+"
            cursor.execute(
                "UPDATE blood_inventory SET quantity = quantity + %s, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = 1 AND blood_type = %s",
                (qty, blood_type)
            )
            cursor.execute(
                "INSERT INTO inventory_transactions (hospital_id, blood_type, quantity, transaction_type, note) VALUES (1, %s, %s, 'IN', %s)",
                (blood_type, qty, f"Donation completed from user #{app['user_id']} appointment #{id}")
            )
            cursor.execute("""
                UPDATE users
                SET humanitarian_points = humanitarian_points + 50,
                    reliability_score = LEAST(COALESCE(reliability_score, 80) + 5, 100),
                    total_donations = COALESCE(total_donations, 0) + 1,
                    last_donation_date = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (completed_dt.isoformat(timespec="seconds"), app["user_id"]))
        elif data.status == "CANCELLED":
            # Hospital-side cancellation does not penalize donor reliability; donor-initiated cancellation has its own endpoint.
            pass

        conn.commit()
        return {"message": "Status updated", "status": data.status}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()