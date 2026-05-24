from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import unicodedata

from ..database import get_db_connection
from ..db_helpers import get_cursor, fetchone_dict, fetchall_dict
from .auth import get_current_user

router = APIRouter()

DONATION_INTERVAL_DAYS = 84

class ChatbotAsk(BaseModel):
    message: str


def normalize_text(text: str) -> str:
    """Lowercase, strip accents, and map Vietnamese đ/Đ -> d for intent matching."""
    text = (text or '').strip().lower()
    # đ is not decomposed by NFD; without this, "điều kiện" never matches "dieu kien".
    text = text.replace('đ', 'd').replace('Đ', 'd')
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    # Ignore trailing punctuation so "không?" still matches "khong".
    text = ''.join(ch if ch.isalnum() or ch.isspace() else ' ' for ch in text)
    return ' '.join(text.split())




def is_eligibility_question(text: str) -> bool:
    """Robust detector for donor eligibility questions.

    Handles common Vietnamese phrasing such as:
    - Tôi có đủ điều kiện hiến máu không?
    - Tôi hiến máu được không?
    - Tôi có thể hiến máu không?
    - Điều kiện hiến máu của tôi thế nào?
    """
    msg = normalize_text(text)
    compact = ' '.join(msg.split())

    strong_phrases = [
        'toi co du dieu kien hien mau khong',
        'co du dieu kien hien mau khong',
        'du dieu kien hien mau',
        'du dieu kien khong',
        'dieu kien hien mau',
        'hien mau duoc khong',
        'co hien mau duoc khong',
        'co duoc hien mau khong',
        'toi co the hien mau khong',
        'toi hien mau duoc khong',
        'kiem tra dieu kien',
        'kiem tra suc khoe',
        'eligible',
        'eligibility',
    ]
    if any(p in compact for p in strong_phrases):
        return True

    # More flexible fallback: contains blood donation + eligibility markers.
    has_blood = ('hien mau' in compact) or ('donate blood' in compact)
    has_condition = (
        ('du dieu kien' in compact)
        or ('dieu kien' in compact)
        or ('duoc khong' in compact)
        or ('co the' in compact)
        or ('suc khoe' in compact)
    )
    return has_blood and has_condition


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
    cur.execute("SELECT MAX(appointment_date) AS last_date FROM appointments WHERE donor_id=%s AND status='COMPLETED'", (user_id,))
    row = fetchone_dict(cur)
    return (row['last_date'] if row else None) or fallback


def intent_from_message(text: str) -> str:
    msg = normalize_text(text)

    # Ưu tiên bắt câu hỏi về điều kiện hiến máu trước mọi intent chung.
    # Nếu không đặt trước, câu như "Tôi có đủ điều kiện hiến máu không?"
    # có thể rơi vào GENERAL_HELP ở một số cách diễn đạt.
    if is_eligibility_question(text):
        return 'eligibility'

    # Quy trình / hướng dẫn chung mà Donor thường hỏi
    if any(k in msg for k in [
        'quy trinh', 'dang ky ra sao', 'dang ki ra sao', 'cach dang ky', 'cach dat lich',
        'cac buoc', 'bat dau nhu the nao', 'hien mau nhu the nao', 'huong dan dang ky',
        'toi muon hien mau', 'lam sao de hien mau'
    ]):
        return 'registration_process'
    if any(k in msg for k in [
        'can chuan bi gi', 'truoc khi hien', 'an gi', 'uong gi', 'ngu du', 'chuan bi',
        'nhin an', 'co duoc an sang', 'truoc ngay hien'
    ]):
        return 'preparation_guide'
    if any(k in msg for k in [
        'sau khi hien', 'sau hien mau', 'cham soc', 'nghi ngoi', 'an uong sau', 'luu y sau',
        'bi met', 'chong mat'
    ]):
        return 'after_donation_care'
    if any(k in msg for k in [
        'mang gi', 'giay to', 'cccd', 'cmnd', 'can cuoc', 'ho so', 'di hien can gi'
    ]):
        return 'required_documents'
    if any(k in msg for k in [
        'khong biet nhom mau', 'chua biet nhom mau', 'unknown', 'chua xac dinh', 'xet nghiem nhom mau'
    ]):
        return 'unknown_blood_type'
    if any(k in msg for k in [
        'trang thai la gi', 'pending la gi', 'approved la gi', 'checked in', 'in progress',
        'completed la gi', 'cac trang thai'
    ]):
        return 'status_explanation'
    if any(k in msg for k in [
        'gio lam viec', 'may gio', 'dia chi', 'o dau', 'lien he', 'thong tin benh vien', 'hospital info'
    ]):
        return 'hospital_info'

    # Câu hỏi dựa trên dữ liệu cá nhân / dữ liệu hospital
    if any(k in msg for k in ['lich hen', 'dat lich', 'appointment', 'trang thai lich', 'hom nay toi co lich']):
        return 'appointment_status'
    # Eligibility must be checked before broad "khi nào" questions to avoid falling back to general help.
    if any(k in msg for k in [
        'du dieu kien', 'dieu kien hien', 'co hien duoc', 'co duoc hien',
        'toi co du dieu kien', 'toi co hien mau duoc khong', 'hien mau duoc khong',
        'co du suc khoe', 'screening', 'suc khoe', 'eligible',
        'toi co du dieu kien hien mau khong', 'toi du dieu kien khong',
        'co du dieu kien hien mau khong', 'toi co the hien mau khong'
    ]):
        return 'eligibility'
    if any(k in msg for k in ['khi nao', 'bao lau', 'hien lai', 'du dieu kien lai', 'countdown']):
        return 'next_donation_date'
    if any(k in msg for k in ['can mau', 'thieu mau', 'emergency', 'khan cap', 'nhom mau nao', 'chien dich']):
        return 'emergency_campaign'
    if any(k in msg for k in ['diem', 'huy hieu', 'achievement', 'cap bac', 'reliability', 'tin cay']):
        return 'donor_stats'
    return 'general_help'



def answer_registration_process(cur, user):
    cur.execute("""
        SELECT id, appointment_date, status
        FROM appointments
        WHERE donor_id=%s AND status NOT IN ('COMPLETED','CANCELLED')
        ORDER BY appointment_date ASC
        LIMIT 1
    """, (user['id'],))
    active = fetchone_dict(cur)
    extra = ""
    if active:
        extra = f"\n\nHiện bạn đã có lịch hẹn {fmt_dt(active['appointment_date'])}, trạng thái {active['status']}. Bạn có thể theo dõi trong mục Appointments."
    return (
        "Quy trình đăng ký hiến máu trên hệ thống gồm 5 bước:\n"
        "1. Đăng nhập bằng số điện thoại.\n"
        "2. Cập nhật thông tin cá nhân trong Settings, đặc biệt là họ tên và nhóm máu nếu đã biết.\n"
        "3. Vào Appointments để chọn ngày giờ muốn hiến máu.\n"
        "4. Trả lời sàng lọc sức khỏe cơ bản trước khi gửi lịch.\n"
        "5. Chờ Hospital duyệt lịch. Khi đến bệnh viện, trạng thái sẽ lần lượt chuyển sang CHECKED_IN, IN_PROGRESS và COMPLETED."
        + extra
    )


def answer_preparation_guide():
    return (
        "Trước khi hiến máu, bạn nên chuẩn bị như sau:\n"
        "- Ngủ đủ giấc, hạn chế thức khuya.\n"
        "- Ăn nhẹ trước khi đến, không nên để bụng đói.\n"
        "- Uống đủ nước.\n"
        "- Tránh rượu bia trước ngày hiến.\n"
        "- Nếu đang dùng thuốc, đang sốt, cảm, hoặc vừa điều trị bệnh, hãy khai báo trong phần sàng lọc.\n"
        "- Mang giấy tờ tùy thân khi đến bệnh viện.\n\n"
        "Lưu ý: hệ thống chỉ hỗ trợ sàng lọc sơ bộ; quyết định cuối cùng do nhân viên y tế xác nhận."
    )


def answer_after_donation_care(user):
    points = user.get('humanitarian_points') or 0
    return (
        "Sau khi hiến máu, bạn nên:\n"
        "- Nghỉ tại điểm hiến theo hướng dẫn của nhân viên y tế.\n"
        "- Uống nước và ăn nhẹ.\n"
        "- Tránh vận động mạnh trong ngày.\n"
        "- Nếu chóng mặt, mệt hoặc khó chịu, báo ngay cho nhân viên y tế.\n"
        "- Theo dõi thời gian đủ điều kiện hiến lại trong Dashboard.\n\n"
        f"Hiện bạn đang có {points} điểm nhân đạo. Cảm ơn bạn vì nghĩa cử hiến máu cứu người."
    )


def answer_required_documents():
    return (
        "Khi đến hiến máu, bạn nên mang:\n"
        "- CCCD/CMND hoặc giấy tờ tùy thân hợp lệ.\n"
        "- Số điện thoại đã dùng để đăng nhập hệ thống.\n"
        "- Thông tin nhóm máu nếu bạn đã biết.\n"
        "- Thông tin thuốc đang dùng hoặc bệnh nền nếu có.\n\n"
        "Nếu chưa biết nhóm máu, bạn vẫn có thể đăng ký và cập nhật là Chưa xác định."
    )


def answer_unknown_blood_type(user):
    current = user.get('blood_type') or 'UNKNOWN'
    if current != 'UNKNOWN':
        return f"Hồ sơ của bạn hiện ghi nhận nhóm máu {current}. Nếu thông tin này sai, bạn có thể cập nhật lại trong Settings."
    return (
        "Nếu bạn chưa biết nhóm máu, hãy chọn 'Chưa xác định/UNKNOWN' trong hồ sơ. "
        "Bạn vẫn có thể đặt lịch hiến máu. Khi đến bệnh viện, nhân viên y tế có thể kiểm tra và cập nhật nhóm máu chính xác cho bạn."
    )


def answer_status_explanation():
    return (
        "Ý nghĩa các trạng thái lịch hẹn:\n"
        "- PENDING: bạn đã gửi lịch, đang chờ Hospital duyệt.\n"
        "- APPROVED: lịch đã được Hospital chấp nhận.\n"
        "- CHECKED_IN: bạn đã đến bệnh viện và được ghi nhận.\n"
        "- IN_PROGRESS: đang trong quy trình hiến máu.\n"
        "- COMPLETED: đã hoàn tất hiến máu.\n"
        "- CANCELLED: lịch đã bị hủy.\n\n"
        "Khi trạng thái COMPLETED, hệ thống sẽ cập nhật điểm nhân đạo, số lần hiến và màn hình Congratulations."
    )


def answer_hospital_info(cur):
    cur.execute("SELECT name, address, contact_phone, contact_email FROM hospitals WHERE id=1")
    row = fetchone_dict(cur)
    if not row:
        return "Hiện hệ thống chưa có thông tin bệnh viện. Bạn có thể liên hệ trực tiếp Hospital Admin."
    return (
        f"Thông tin điểm tiếp nhận hiến máu:\n"
        f"- Tên: {row['name']}\n"
        f"- Địa chỉ: {row['address']}\n"
        f"- Điện thoại: {row['contact_phone'] or 'chưa cập nhật'}\n"
        f"- Email: {row['contact_email'] or 'chưa cập nhật'}\n\n"
        "Bạn có thể đặt lịch trong mục Appointments và theo dõi trạng thái trên hệ thống."
    )
def answer_appointment(cur, user_id):
    cur.execute("""
        SELECT * FROM appointments
        WHERE donor_id=%s AND status NOT IN ('COMPLETED','CANCELLED')
        ORDER BY appointment_date ASC
        LIMIT 1
    """, (user_id,))
    app = fetchone_dict(cur)
    if not app:
        cur.execute("""
            SELECT * FROM appointments
            WHERE donor_id=%s
            ORDER BY appointment_date DESC
            LIMIT 1
        """, (user_id,))
        app = fetchone_dict(cur)
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
        f"Theo quy định 84 ngày của hệ thống, bạn cần chờ đủ {DONATION_INTERVAL_DAYS} ngày. "
        f"Bạn còn khoảng {remaining} ngày nữa, dự kiến có thể hiến lại từ {next_dt.strftime('%d/%m/%Y')}."
    )


def answer_eligibility(cur, user):
    """Answer the question: "Tôi có đủ điều kiện hiến máu không?" using real donor data."""
    last_date = get_latest_completed_date(cur, user['id'], user.get('last_donation_date'))
    remaining, next_dt = days_until_eligible(last_date)

    weight = user.get('weight')
    blood_type = user.get('blood_type') or 'UNKNOWN'
    reasons = []

    if weight is not None:
        try:
            if float(weight) < 45:
                reasons.append(f"cân nặng hiện ghi nhận {weight}kg, thấp hơn mức tối thiểu 45kg trong hệ thống")
        except Exception:
            pass

    if remaining > 0:
        reasons.append(
            f"chưa đủ {DONATION_INTERVAL_DAYS} ngày từ lần hiến gần nhất; còn khoảng {remaining} ngày nữa"
        )

    # Check if donor already has an active future appointment.
    cur.execute("""
        SELECT appointment_date, status
        FROM appointments
        WHERE donor_id=%s
          AND status IN ('PENDING','APPROVED','CHECKED_IN','IN_PROGRESS')
        ORDER BY appointment_date ASC
        LIMIT 1
    """, (user['id'],))
    active = fetchone_dict(cur)

    if reasons:
        next_text = f"\nNgày có thể hiến lại dự kiến: {next_dt.strftime('%d/%m/%Y')}." if next_dt else ""
        booking_hint = (
            "\nBạn vẫn có thể đặt lịch trước nếu ngày hẹn được chọn nằm từ ngày đủ điều kiện trở về sau."
            if next_dt else ""
        )
        return (
            "Theo dữ liệu hiện tại trong hệ thống, bạn CHƯA đủ điều kiện để hiến máu ngay.\n\n"
            "Lý do:\n- " + "\n- ".join(reasons) +
            next_text +
            booking_hint +
            "\n\nLưu ý: phần này chỉ là sàng lọc sơ bộ; quyết định cuối cùng do nhân viên y tế xác nhận tại bệnh viện."
        )

    active_text = ""
    if active:
        active_text = f"\n\nBạn đang có lịch hẹn {fmt_dt(active['appointment_date'])}, trạng thái {active['status']}."

    return (
        "Theo dữ liệu hiện tại trong hệ thống, bạn CÓ THỂ đủ điều kiện đặt lịch hiến máu.\n\n"
        f"- Nhóm máu trong hồ sơ: {blood_type}.\n"
        f"- Cân nặng trong hồ sơ: {weight if weight is not None else 'chưa cập nhật'}kg.\n"
        "- Không bị hệ thống chặn bởi quy tắc 84 ngày.\n\n"
        "Khi đặt lịch, bạn vẫn cần khai báo sàng lọc sức khỏe đầy đủ. "
        "Các câu hỏi như rượu/bia 24h, ngủ đủ giấc, sốt/cảm... nên được kiểm tra sát ngày hiến máu."
        + active_text +
        "\n\nLưu ý: quyết định cuối cùng do nhân viên y tế xác nhận tại bệnh viện."
    )

def answer_emergency(cur, user):
    cur.execute("""
        SELECT blood_type, quantity, safety_threshold,
               CASE
                 WHEN quantity <= safety_threshold * 0.5 THEN 'CRITICAL'
                 WHEN quantity < safety_threshold THEN 'WARNING'
                 ELSE 'SAFE'
               END AS status_level
        FROM blood_inventory
        WHERE hospital_id=1
        ORDER BY CASE WHEN status_level='CRITICAL' THEN 1 WHEN status_level='WARNING' THEN 2 ELSE 3 END, blood_type ASC
    """)
    rows = [dict(r) for r in fetchall_dict(cur)]
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
        "Mình có thể hỗ trợ bạn về điều kiện hiến máu, lịch hẹn và dữ liệu cá nhân trong hệ thống. Bạn có thể hỏi:\n"
        "- Tôi có đủ điều kiện hiến máu không?\n"
        "- Khi nào tôi được hiến lại?\n"
        "- Lịch hẹn của tôi khi nào?\n"
        "- Quy trình đăng ký hiến máu ra sao?\n"
        "- Bệnh viện đang cần nhóm máu nào?\n"
        "- Tôi cần chuẩn bị gì trước khi hiến máu?"
    )


@router.post('/ask')
async def ask_chatbot(data: ChatbotAsk, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'DONOR':
        raise HTTPException(status_code=403, detail='Smart Assistant hiện dành cho Donor')
    message = (data.message or '').strip()
    if not message:
        raise HTTPException(status_code=400, detail='Vui lòng nhập câu hỏi')

    conn = get_db_connection()
    cur = get_cursor(conn)
    try:
        cur.execute('SELECT * FROM users WHERE id=%s', (current_user['id'],))
        user_row = fetchone_dict(cur)
        if not user_row:
            raise HTTPException(status_code=404, detail='User not found')
        user = dict(user_row)

        intent = intent_from_message(message)
        if intent == 'registration_process':
            answer = answer_registration_process(cur, user)
        elif intent == 'preparation_guide':
            answer = answer_preparation_guide()
        elif intent == 'after_donation_care':
            answer = answer_after_donation_care(user)
        elif intent == 'required_documents':
            answer = answer_required_documents()
        elif intent == 'unknown_blood_type':
            answer = answer_unknown_blood_type(user)
        elif intent == 'status_explanation':
            answer = answer_status_explanation()
        elif intent == 'hospital_info':
            answer = answer_hospital_info(cur)
        elif intent == 'appointment_status':
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
                "INSERT INTO chat_messages (user_id, sender, message, intent) VALUES (%s, 'USER', %s, %s)",
                (user['id'], message, intent)
            )
            cur.execute(
                "INSERT INTO chat_messages (user_id, sender, message, intent) VALUES (%s, 'BOT', %s, %s)",
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
    conn = get_db_connection(); cur = get_cursor(conn)
    cur.execute("""
        SELECT sender, message, intent, created_at
        FROM chat_messages
        WHERE user_id=%s
        ORDER BY created_at ASC, id ASC
        LIMIT 80
    """, (current_user['id'],))
    rows = [dict(r) for r in fetchall_dict(cur)]
    # Fix old chat history rows that were saved before eligibility intent was improved.
    # This prevents F5 from showing the old GENERAL_HELP answer under
    # "Tôi có đủ điều kiện hiến máu không?".
    cleaned = []
    previous_user_asked_eligibility = False
    for row in rows:
        item = dict(row)
        if item.get('sender') == 'USER':
            previous_user_asked_eligibility = is_eligibility_question(item.get('message') or '')
        elif item.get('sender') == 'BOT':
            if previous_user_asked_eligibility and item.get('intent') == 'general_help':
                item['intent'] = 'eligibility'
                item['message'] = (
                    "Câu hỏi này cần kiểm tra dữ liệu hồ sơ và lịch sử hiến máu của bạn. "
                    "Vui lòng bấm lại câu hỏi 'Tôi có đủ điều kiện hiến máu không?' để hệ thống cập nhật kết quả mới nhất."
                )
            previous_user_asked_eligibility = False
        cleaned.append(item)
    conn.close()
    return cleaned


@router.get('/suggestions')
async def suggestions(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'DONOR':
        raise HTTPException(status_code=403, detail='Smart Assistant hiện dành cho Donor')
    return [
        'Quy trình đăng ký hiến máu ra sao?',
        'Tôi cần chuẩn bị gì trước khi hiến máu?',
        'Khi đến hiến máu cần mang giấy tờ gì?',
        'Lịch hẹn của tôi khi nào?',
        'Tôi có đủ điều kiện hiến máu không?',
        'Khi nào tôi được hiến lại?',
        'Bệnh viện đang cần nhóm máu nào?',
        'Sau khi hiến máu cần lưu ý gì?',
        'Nếu chưa biết nhóm máu thì sao?',
        'Các trạng thái lịch hẹn có ý nghĩa gì?',
        'Thông tin bệnh viện ở đâu?',
        'Điểm nhân đạo và huy hiệu của tôi?'
    ]