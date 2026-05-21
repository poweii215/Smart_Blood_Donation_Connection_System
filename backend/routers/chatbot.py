from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import unicodedata

from ..database import get_db_connection
from .auth import get_current_user

router = APIRouter()

DONATION_INTERVAL_DAYS = 84

class ChatbotAsk(BaseModel):
    message: str


def normalize_text(text: str) -> str:
    text = (text or '').strip().lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    return text


def parse_datetime(value):
    if not value:
        return None
    raw = str(value).replace('Z', '').replace('T', ' ')
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            return datetime.strptime(raw[:len(fmt)], fmt)
        except Exception:
            pass
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return None


def fmt_dt(value):
    dt = parse_datetime(value)
    if not dt:
        return value or 'chưa có dữ liệu'
    return dt.strftime('%d/%m/%Y lúc %H:%M')


def days_until_eligible(last_donation_date):
    last_dt = parse_datetime(last_donation_date)
    if not last_dt:
        return 0, None
    next_dt = last_dt + timedelta(days=DONATION_INTERVAL_DAYS)
    remaining = max(0, (next_dt.date() - datetime.utcnow().date()).days)
    return remaining, next_dt


def get_latest_completed_date(cur, user_id, fallback=None):
    cur.execute("SELECT MAX(appointment_date) AS last_date FROM appointments WHERE donor_id=? AND status='COMPLETED'", (user_id,))
    row = cur.fetchone()
    return (row['last_date'] if row else None) or fallback


def intent_from_message(text: str) -> str:
    msg = normalize_text(text)
    if any(k in msg for k in ['lich hen', 'dat lich', 'appointment', 'trang thai lich', 'hom nay toi co lich']):
        return 'appointment_status'
    if any(k in msg for k in ['khi nao', 'bao lau', 'hien lai', 'du dieu kien lai', 'countdown']):
        return 'next_donation_date'
    if any(k in msg for k in ['du dieu kien', 'dieu kien hien', 'co hien duoc', 'screening', 'suc khoe']):
        return 'eligibility'
    if any(k in msg for k in ['can mau', 'thieu mau', 'emergency', 'khan cap', 'nhom mau nao', 'chien dich']):
        return 'emergency_campaign'
    if any(k in msg for k in ['diem', 'huy hieu', 'achievement', 'cap bac', 'reliability', 'tin cay']):
        return 'donor_stats'
    return 'general_help'


def answer_appointment(cur, user_id):
    cur.execute("""
        SELECT * FROM appointments
        WHERE donor_id=? AND status NOT IN ('COMPLETED','CANCELLED')
        ORDER BY appointment_date ASC
        LIMIT 1
    """, (user_id,))
    app = cur.fetchone()
    if not app:
        cur.execute("""
            SELECT * FROM appointments
            WHERE donor_id=?
            ORDER BY appointment_date DESC
            LIMIT 1
        """, (user_id,))
        app = cur.fetchone()
    if not app:
        return "Bạn hiện chưa có lịch hẹn hiến máu. Bạn có thể vào mục Appointments để đặt lịch mới."

    status_map = {
        'PENDING': 'đang chờ Hospital duyệt',
        'APPROVED': 'đã được duyệt',
        'CHECKED_IN': 'đã check-in tại bệnh viện',
        'IN_PROGRESS': 'đang trong quá trình hiến máu',
        'COMPLETED': 'đã hoàn tất hiến máu',
        'CANCELLED': 'đã bị hủy',
    }
    status = app['status']
    return (
        f"Lịch hẹn gần nhất của bạn là {fmt_dt(app['appointment_date'])}. "
        f"Trạng thái hiện tại: {status} - {status_map.get(status, status)}."
    )


def answer_next_donation(cur, user):
    last_date = get_latest_completed_date(cur, user['id'], user['last_donation_date'])
    if not last_date:
        return "Hệ thống chưa ghi nhận lần hiến máu hoàn tất nào của bạn. Nếu sức khỏe ổn định, bạn có thể đặt lịch hiến máu mới."
    remaining, next_dt = days_until_eligible(last_date)
    if remaining <= 0:
        return f"Lần hiến gần nhất của bạn là {fmt_dt(last_date)}. Bạn hiện đã đủ thời gian để đăng ký hiến máu lại."
    return (
        f"Lần hiến gần nhất của bạn là {fmt_dt(last_date)}. "
        f"Theo quy tắc demo của hệ thống, bạn cần chờ đủ {DONATION_INTERVAL_DAYS} ngày. "
        f"Bạn còn khoảng {remaining} ngày nữa, dự kiến có thể hiến lại từ {next_dt.strftime('%d/%m/%Y')}."
    )


def answer_eligibility(cur, user):
    last_date = get_latest_completed_date(cur, user['id'], user['last_donation_date'])
    remaining, next_dt = days_until_eligible(last_date)
    cur.execute("""
        SELECT pre_screening_result, status, appointment_date
        FROM appointments
        WHERE donor_id=?
        ORDER BY created_at DESC
        LIMIT 1
    """, (user['id'],))
    app = cur.fetchone()
    if remaining > 0:
        return (
            f"Bạn chưa đủ thời gian hiến lại. Còn khoảng {remaining} ngày nữa, "
            f"dự kiến từ {next_dt.strftime('%d/%m/%Y')}. "
            "Bạn vẫn nên duy trì sức khỏe tốt và đặt lịch khi đủ điều kiện."
        )
    if app and app['pre_screening_result']:
        return (
            "Dựa trên dữ liệu sàng lọc gần nhất, bạn không bị hệ thống chặn điều kiện thời gian hiến lại. "
            f"Thông tin sàng lọc gần nhất: {app['pre_screening_result']}. "
            "Kết quả cuối cùng vẫn cần nhân viên y tế xác nhận tại bệnh viện."
        )
    return (
        "Bạn hiện không bị giới hạn bởi thời gian hiến lại trong hệ thống. "
        "Khi đặt lịch, hãy khai báo sàng lọc sức khỏe đầy đủ. Kết quả cuối cùng sẽ được xác nhận tại bệnh viện."
    )


def answer_emergency(cur, user):
    cur.execute("""
        SELECT blood_type, quantity, safety_threshold,
               CASE
                 WHEN quantity <= safety_threshold * 0.5 THEN 'CRITICAL'
                 WHEN quantity < safety_threshold THEN 'WARNING'
                 ELSE 'SAFE'
               END AS level
        FROM blood_inventory
        WHERE hospital_id=1
        ORDER BY level='CRITICAL' DESC, level='WARNING' DESC, blood_type ASC
    """)
    rows = [dict(r) for r in cur.fetchall()]
    critical = [r for r in rows if r['level'] == 'CRITICAL']
    warning = [r for r in rows if r['level'] == 'WARNING']
    if not critical and not warning:
        return "Hiện tại kho máu đang ở mức an toàn. Cảm ơn bạn đã luôn sẵn sàng đồng hành cùng bệnh viện."
    parts = []
    if critical:
        parts.append("khẩn cấp: " + ', '.join(f"{r['blood_type']} ({r['quantity']} đơn vị)" for r in critical))
    if warning:
        parts.append("cần chú ý: " + ', '.join(f"{r['blood_type']} ({r['quantity']} đơn vị)" for r in warning))
    user_blood = user.get('blood_type') or 'UNKNOWN'
    match_msg = ""
    urgent_types = {r['blood_type'] for r in critical + warning}
    if user_blood in urgent_types:
        match_msg = f" Bạn thuộc nhóm máu {user_blood}, đang nằm trong nhóm bệnh viện cần ưu tiên. Bạn có thể đặt lịch nếu đủ điều kiện sức khỏe."
    elif user_blood == 'UNKNOWN':
        match_msg = " Nhóm máu của bạn đang là Chưa xác định, bạn có thể cập nhật trong Settings hoặc kiểm tra tại bệnh viện."
    return "Hiện bệnh viện đang có nhóm máu " + '; '.join(parts) + "." + match_msg


def answer_stats(user):
    points = user.get('humanitarian_points') or 0
    total = user.get('total_donations') or 0
    reliability = user.get('reliability_score') or 100
    if points >= 1000 or total >= 10:
        badge = 'Platinum Donor'
    elif points >= 500 or total >= 5:
        badge = 'Gold Donor'
    elif points >= 200 or total >= 2:
        badge = 'Silver Donor'
    else:
        badge = 'Bronze Donor'
    return (
        f"Thông tin đóng góp của bạn: {total} lần hiến, {points} điểm nhân đạo, "
        f"độ tin cậy {round(reliability, 1)}%. Huy hiệu hiện tại: {badge}."
    )


def answer_general():
    return (
        "Mình có thể hỗ trợ bạn dựa trên dữ liệu của bệnh viện. Bạn có thể hỏi: "
        "'Lịch hẹn của tôi khi nào?', 'Tôi có đủ điều kiện hiến không?', "
        "'Khi nào tôi được hiến lại?', hoặc 'Bệnh viện đang cần nhóm máu nào?'."
    )


@router.post('/ask')
async def ask_chatbot(data: ChatbotAsk, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'DONOR':
        raise HTTPException(status_code=403, detail='Smart Assistant hiện dành cho Donor')
    message = (data.message or '').strip()
    if not message:
        raise HTTPException(status_code=400, detail='Vui lòng nhập câu hỏi')

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('SELECT * FROM users WHERE id=?', (current_user['id'],))
        user_row = cur.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail='User not found')
        user = dict(user_row)

        intent = intent_from_message(message)
        if intent == 'appointment_status':
            answer = answer_appointment(cur, user['id'])
        elif intent == 'next_donation_date':
            answer = answer_next_donation(cur, user)
        elif intent == 'eligibility':
            answer = answer_eligibility(cur, user)
        elif intent == 'emergency_campaign':
            answer = answer_emergency(cur, user)
        elif intent == 'donor_stats':
            answer = answer_stats(user)
        else:
            answer = answer_general()

        try:
            cur.execute(
                "INSERT INTO chat_messages (user_id, sender, message, intent) VALUES (?, 'USER', ?, ?)",
                (user['id'], message, intent)
            )
            cur.execute(
                "INSERT INTO chat_messages (user_id, sender, message, intent) VALUES (?, 'BOT', ?, ?)",
                (user['id'], answer, intent)
            )
            conn.commit()
        except Exception:
            conn.rollback()
        return {'intent': intent, 'answer': answer}
    finally:
        conn.close()


@router.get('/history')
async def history(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'DONOR':
        raise HTTPException(status_code=403, detail='Smart Assistant hiện dành cho Donor')
    conn = get_db_connection(); cur = conn.cursor()
    cur.execute("""
        SELECT sender, message, intent, created_at
        FROM chat_messages
        WHERE user_id=?
        ORDER BY created_at ASC, id ASC
        LIMIT 80
    """, (current_user['id'],))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


@router.get('/suggestions')
async def suggestions(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'DONOR':
        raise HTTPException(status_code=403, detail='Smart Assistant hiện dành cho Donor')
    return [
        'Lịch hẹn của tôi khi nào?',
        'Tôi có đủ điều kiện hiến máu không?',
        'Khi nào tôi được hiến lại?',
        'Bệnh viện đang cần nhóm máu nào?',
        'Điểm nhân đạo và huy hiệu của tôi?'
    ]
