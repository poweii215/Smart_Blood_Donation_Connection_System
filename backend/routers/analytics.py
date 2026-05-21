from datetime import datetime, timedelta
from io import BytesIO
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from ..database import get_db_connection
from .auth import get_current_user, ADMIN_ROLES
from ..schemas import RecommendationRequest, RecommendationSettings

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
        dt = datetime.fromisoformat(str(last_donation_date).replace('Z', '').split('.')[0])
    except Exception:
        return 0.7
    days = (datetime.utcnow() - dt).days
    return max(0, min(1, days / 84))


def days_until_eligible(last_donation_date):
    if not last_donation_date:
        return 0
    try:
        dt = datetime.fromisoformat(str(last_donation_date).replace('Z', '').split('.')[0])
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



def normalize_weights(weights):
    total = sum(max(0, float(w)) for w in weights.values())
    if total <= 0:
        return weights
    return {k: round(max(0, float(v)) / total, 4) for k, v in weights.items()}

def get_recommendation_settings(cur):
    cur.execute("SELECT * FROM recommendation_settings WHERE id=1")
    row = cur.fetchone()
    if not row:
        return {
            "w_blood": 0.45, "w_eligibility": 0.30, "w_reliability": 0.15, "w_humanitarian": 0.10,
            "emergency_w_blood": 0.60, "emergency_w_eligibility": 0.25, "emergency_w_reliability": 0.10, "emergency_w_humanitarian": 0.05,
            "emergency_auto_adjust": True
        }
    data = dict(row)
    data["emergency_auto_adjust"] = bool(data.get("emergency_auto_adjust", 1))
    return data

def is_blood_type_emergency(cur, blood_type):
    cur.execute("SELECT quantity, safety_threshold FROM blood_inventory WHERE hospital_id=1 AND blood_type=?", (blood_type,))
    row = cur.fetchone()
    if not row:
        return False
    return float(row["quantity"] or 0) <= float(row["safety_threshold"] or 0) * 0.5

def weighted_moving_average(values):
    # Newer months receive higher weights. For 3 months: 0.2, 0.3, 0.5.
    if not values:
        return 0
    vals = list(values)[-6:]
    raw_weights = list(range(1, len(vals) + 1))
    total = sum(raw_weights)
    return sum(v * (w / total) for v, w in zip(vals, raw_weights))

def _xlsx_col(index):
    """Convert 1-based column index to Excel column letters."""
    letters = ""
    while index:
        index, rem = divmod(index - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def _cell_xml(row_idx, col_idx, value):
    ref = f"{_xlsx_col(col_idx)}{row_idx}"
    if value is None:
        value = ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{ref}"><v>{value}</v></c>'
    return f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'


def build_simple_xlsx(headers, rows, sheet_name="Donors"):
    """Build a lightweight .xlsx file without requiring openpyxl/xlsxwriter."""
    output = BytesIO()
    with ZipFile(output, "w", ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>""")
        zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>""")
        zf.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""")
        zf.writestr("xl/workbook.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="{escape(sheet_name)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>""")
        zf.writestr("xl/styles.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>""")
        zf.writestr("docProps/core.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Donor Export</dc:title><dc:creator>SBDCs</dc:creator><cp:lastModifiedBy>SBDCs</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{datetime.utcnow().isoformat()}Z</dcterms:created></cp:coreProperties>""")
        zf.writestr("docProps/app.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>SBDCs</Application></Properties>""")

        all_rows = [headers] + rows
        row_xml = []
        for r_idx, row in enumerate(all_rows, 1):
            cells = ''.join(_cell_xml(r_idx, c_idx, val) for c_idx, val in enumerate(row, 1))
            row_xml.append(f'<row r="{r_idx}">{cells}</row>')
        dimension = f"A1:{_xlsx_col(len(headers))}{len(all_rows)}"
        cols = ''.join(f'<col min="{i}" max="{i}" width="18" customWidth="1"/>' for i in range(1, len(headers) + 1))
        worksheet = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="{dimension}"/>
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>{cols}</cols>
<sheetData>{''.join(row_xml)}</sheetData>
<autoFilter ref="{dimension}"/>
</worksheet>"""
        zf.writestr("xl/worksheets/sheet1.xml", worksheet)
    output.seek(0)
    return output


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
        forecast_qty = round(weighted_moving_average(vals), 2) if vals else 0
        simple_avg = round(sum(vals) / len(vals), 2) if vals else 0
        risk = status_for(item["quantity"], item["safety_threshold"], forecast_qty)
        results.append({**item, "forecast_next_month": forecast_qty, "simple_average_forecast": simple_avg, "forecast_method": "Weighted Moving Average", "risk": risk, "emergency_mode": risk == "EMERGENCY"})
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


@router.get("/donors/export")
async def export_donors(current_user: dict = Depends(get_current_user)):
    """Export donor list to Excel for Hospital Admin."""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection(); cur = conn.cursor()
    cur.execute("""
        SELECT
            u.id,
            u.full_name,
            u.phone,
            u.blood_type,
            u.reliability_score,
            u.humanitarian_points,
            u.total_donations,
            u.last_donation_date,
            COALESCE(a.total_appointments, 0) AS total_appointments,
            COALESCE(a.completed_appointments, 0) AS completed_appointments,
            COALESCE(a.cancelled_appointments, 0) AS cancelled_appointments,
            u.created_at
        FROM users u
        LEFT JOIN (
            SELECT
                donor_id,
                COUNT(*) AS total_appointments,
                SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_appointments,
                SUM(CASE WHEN status='CANCELLED' THEN 1 ELSE 0 END) AS cancelled_appointments
            FROM appointments
            GROUP BY donor_id
        ) a ON a.donor_id = u.id
        WHERE u.role = 'DONOR'
        ORDER BY u.full_name ASC
    """)
    donor_rows = []
    for r in cur.fetchall():
        donor = dict(r)
        ach = achievement_level(donor.get("humanitarian_points") or 0, donor.get("total_donations") or 0)
        donor_rows.append([
            donor.get("id"),
            donor.get("full_name"),
            donor.get("phone"),
            donor.get("blood_type") or "UNKNOWN",
            round(float(donor.get("reliability_score") or 0), 2),
            donor.get("humanitarian_points") or 0,
            donor.get("total_donations") or 0,
            donor.get("last_donation_date") or "",
            donor.get("total_appointments") or 0,
            donor.get("completed_appointments") or 0,
            donor.get("cancelled_appointments") or 0,
            days_until_eligible(donor.get("last_donation_date")),
            ach.get("level"),
            ach.get("badge"),
            donor.get("created_at") or "",
        ])
    conn.close()

    headers = [
        "ID", "Full Name", "Phone", "Blood Type", "Reliability Score (%)",
        "Humanitarian Points", "Total Donations", "Last Donation Date",
        "Total Appointments", "Completed Appointments", "Cancelled Appointments",
        "Days Until Eligible", "Achievement Level", "Badge", "Created At"
    ]
    file_obj = build_simple_xlsx(headers, donor_rows, sheet_name="Donors")
    filename = f"donor_list_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        file_obj,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/appointments/today/export")
async def export_today_appointments(
    status: str = Query("ALL", description="ALL, EXPECTED, ARRIVED, ACTIVE, DONE, PENDING, APPROVED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED"),
    report_date: str = Query(None, description="YYYY-MM-DD. Default is today."),
    current_user: dict = Depends(get_current_user)
):
    """Export selected appointment attendance list to Excel for Hospital Admin."""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")

    selected_date = report_date or datetime.utcnow().strftime('%Y-%m-%d')
    status = (status or "ALL").upper().strip()

    status_groups = {
        "ALL": ["PENDING", "APPROVED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
        "EXPECTED": ["PENDING", "APPROVED"],
        "ARRIVED": ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"],
        "ACTIVE": ["CHECKED_IN", "IN_PROGRESS"],
        "DONE": ["COMPLETED"],
        "PENDING": ["PENDING"],
        "APPROVED": ["APPROVED"],
        "CHECKED_IN": ["CHECKED_IN"],
        "IN_PROGRESS": ["IN_PROGRESS"],
        "COMPLETED": ["COMPLETED"],
        "CANCELLED": ["CANCELLED"],
    }
    if status not in status_groups:
        raise HTTPException(status_code=400, detail="Invalid export filter")

    statuses = status_groups[status]
    placeholders = ",".join(["?"] * len(statuses))

    conn = get_db_connection(); cur = conn.cursor()
    cur.execute(f"""
        SELECT
            a.id,
            a.appointment_date,
            a.status,
            a.pre_screening_result,
            a.notes,
            a.created_at,
            a.updated_at,
            u.full_name AS donor_name,
            u.phone AS donor_phone,
            u.blood_type,
            u.reliability_score,
            u.humanitarian_points,
            u.total_donations
        FROM appointments a
        JOIN users u ON a.donor_id = u.id
        WHERE date(a.appointment_date) = date(?)
          AND a.status IN ({placeholders})
        ORDER BY
            CASE a.status
                WHEN 'CHECKED_IN' THEN 1
                WHEN 'IN_PROGRESS' THEN 2
                WHEN 'APPROVED' THEN 3
                WHEN 'PENDING' THEN 4
                WHEN 'COMPLETED' THEN 5
                WHEN 'CANCELLED' THEN 6
                ELSE 7
            END,
            a.appointment_date ASC
    """, [selected_date] + statuses)
    rows = []
    status_counts = {
        "PENDING": 0,
        "APPROVED": 0,
        "CHECKED_IN": 0,
        "IN_PROGRESS": 0,
        "COMPLETED": 0,
        "CANCELLED": 0,
    }
    for r in cur.fetchall():
        item = dict(r)
        row_status = item.get("status") or ""
        if row_status in status_counts:
            status_counts[row_status] += 1
        rows.append([
            item.get("id"),
            item.get("appointment_date") or "",
            item.get("donor_name") or "",
            item.get("donor_phone") or "",
            item.get("blood_type") or "UNKNOWN",
            row_status,
            round(float(item.get("reliability_score") or 0), 2),
            item.get("humanitarian_points") or 0,
            item.get("total_donations") or 0,
            item.get("pre_screening_result") or "",
            item.get("notes") or "",
            item.get("created_at") or "",
            item.get("updated_at") or "",
        ])
    conn.close()

    filter_labels = {
        "ALL": "All appointments",
        "EXPECTED": "Expected donors (Pending + Approved)",
        "ARRIVED": "Arrived donors (Checked-in/In progress/Completed)",
        "ACTIVE": "Currently at hospital (Checked-in + In progress)",
        "DONE": "Completed donations",
        "PENDING": "Pending",
        "APPROVED": "Approved",
        "CHECKED_IN": "Checked in",
        "IN_PROGRESS": "In progress",
        "COMPLETED": "Completed",
        "CANCELLED": "Cancelled",
    }
    summary_rows = [
        ["Report Date", selected_date, "", "", "", "", "", "", "", "", "", "", ""],
        ["Export Filter", filter_labels.get(status, status), "", "", "", "", "", "", "", "", "", "", ""],
        ["Total Exported", len(rows), "", "", "", "", "", "", "", "", "", "", ""],
        ["Pending", status_counts["PENDING"], "", "", "", "", "", "", "", "", "", "", ""],
        ["Approved", status_counts["APPROVED"], "", "", "", "", "", "", "", "", "", "", ""],
        ["Checked In", status_counts["CHECKED_IN"], "", "", "", "", "", "", "", "", "", "", ""],
        ["In Progress", status_counts["IN_PROGRESS"], "", "", "", "", "", "", "", "", "", "", ""],
        ["Completed", status_counts["COMPLETED"], "", "", "", "", "", "", "", "", "", "", ""],
        ["Cancelled", status_counts["CANCELLED"], "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ]

    headers = [
        "Appointment ID", "Appointment Time", "Donor Name", "Phone", "Blood Type",
        "Status", "Reliability Score (%)", "Humanitarian Points", "Total Donations",
        "Pre-screening Result", "Notes", "Created At", "Updated At"
    ]
    sheet_name = status[:25] if status else "Appointments"
    file_obj = build_simple_xlsx(headers, summary_rows + rows, sheet_name=sheet_name)
    filename = f"appointments_{selected_date}_{status.lower()}.xlsx"
    return StreamingResponse(
        file_obj,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/recommendation-settings")
async def recommendation_settings(current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cur = conn.cursor()
    settings = get_recommendation_settings(cur)
    conn.close()
    return settings


@router.put("/recommendation-settings")
async def update_recommendation_settings(data: RecommendationSettings, current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")

    normal = normalize_weights({
        "w_blood": data.w_blood,
        "w_eligibility": data.w_eligibility,
        "w_reliability": data.w_reliability,
        "w_humanitarian": data.w_humanitarian,
    })
    emergency = normalize_weights({
        "emergency_w_blood": data.emergency_w_blood,
        "emergency_w_eligibility": data.emergency_w_eligibility,
        "emergency_w_reliability": data.emergency_w_reliability,
        "emergency_w_humanitarian": data.emergency_w_humanitarian,
    })

    conn = get_db_connection(); cur = conn.cursor()
    cur.execute("""
        INSERT INTO recommendation_settings (
            id, w_blood, w_eligibility, w_reliability, w_humanitarian,
            emergency_w_blood, emergency_w_eligibility, emergency_w_reliability, emergency_w_humanitarian,
            emergency_auto_adjust, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            w_blood=excluded.w_blood,
            w_eligibility=excluded.w_eligibility,
            w_reliability=excluded.w_reliability,
            w_humanitarian=excluded.w_humanitarian,
            emergency_w_blood=excluded.emergency_w_blood,
            emergency_w_eligibility=excluded.emergency_w_eligibility,
            emergency_w_reliability=excluded.emergency_w_reliability,
            emergency_w_humanitarian=excluded.emergency_w_humanitarian,
            emergency_auto_adjust=excluded.emergency_auto_adjust,
            updated_at=CURRENT_TIMESTAMP
    """, (
        normal["w_blood"], normal["w_eligibility"], normal["w_reliability"], normal["w_humanitarian"],
        emergency["emergency_w_blood"], emergency["emergency_w_eligibility"], emergency["emergency_w_reliability"], emergency["emergency_w_humanitarian"],
        1 if data.emergency_auto_adjust else 0
    ))
    conn.commit()
    settings = get_recommendation_settings(cur)
    conn.close()
    return settings


@router.post("/recommendations")
async def recommendations(data: RecommendationRequest, current_user: dict = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection(); cur = conn.cursor()
    settings = get_recommendation_settings(cur)
    emergency_mode = settings.get("emergency_auto_adjust") and is_blood_type_emergency(cur, data.blood_type)

    if emergency_mode:
        weights = {
            "w_blood": settings.get("emergency_w_blood", 0.60),
            "w_eligibility": settings.get("emergency_w_eligibility", 0.25),
            "w_reliability": settings.get("emergency_w_reliability", 0.10),
            "w_humanitarian": settings.get("emergency_w_humanitarian", 0.05),
        }
    else:
        weights = {
            "w_blood": data.w_blood if data.w_blood is not None else settings.get("w_blood", 0.45),
            "w_eligibility": data.w_eligibility if data.w_eligibility is not None else settings.get("w_eligibility", 0.30),
            "w_reliability": data.w_reliability if data.w_reliability is not None else settings.get("w_reliability", 0.15),
            "w_humanitarian": data.w_humanitarian if data.w_humanitarian is not None else settings.get("w_humanitarian", 0.10),
        }
    weights = normalize_weights(weights)

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
        score = (
            weights["w_blood"] * blood_score
            + weights["w_eligibility"] * elig
            + weights["w_reliability"] * rel
            + weights["w_humanitarian"] * hum
        )
        donor.update({
            "blood_match_score": round(blood_score, 2),
            "eligibility_score": round(elig, 2),
            "reliability_component": round(rel, 2),
            "humanitarian_component": round(hum, 2),
            "days_until_eligible": days_until_eligible(donor["last_donation_date"]),
            "score": round(score, 4),
            "weights_used": weights,
            "weighting_mode": "EMERGENCY_ADAPTIVE" if emergency_mode else "NORMAL_HEURISTIC",
            "score_explanation": "Emergency Mode ưu tiên BloodMatch cao hơn vì kho máu đang dưới ngưỡng nguy hiểm." if emergency_mode else "Normal Mode dùng trọng số heuristic dựa trên nghiệp vụ: BloodMatch, Eligibility, Reliability, HumanitarianPoints.",
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
    return {
        "blood_type": data.blood_type,
        "emergency_mode": bool(emergency_mode),
        "weighting_mode": "EMERGENCY_ADAPTIVE" if emergency_mode else "NORMAL_HEURISTIC",
        "weights_used": weights,
        "basis": {
            "BloodMatch": "Ưu tiên đúng nhóm máu cần huy động.",
            "Eligibility": "Donor phải đủ thời gian/điều kiện mới có thể hiến.",
            "Reliability": "Ưu tiên người có lịch sử đến đúng hẹn, ít hủy.",
            "HumanitarianPoints": "Yếu tố gamification, khuyến khích donor tích cực."
        },
        "items": top
    }
