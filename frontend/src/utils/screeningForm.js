/** Normalize and display donor pre-screening data (JSON or legacy text). */

export const RISK_FIELD_KEYS = [
  'medication', 'tattoo', 'surgery', 'pregnant', 'fever', 'chronic',
  'faint', 'hepatitisExposure', 'unsafeSex', 'prescription', 'travelRisk', 'otherHealthIssue',
];

export const SAFE_FIELD_KEYS = ['healthy', 'ageEligible'];

export function parseScreeningRaw(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return normalizeScreeningObject(raw);
  const text = String(raw).trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return normalizeScreeningObject(parsed);
  } catch {
    // legacy text
  }

  const obj = {};
  text.split(';').forEach((part) => {
    const [k, ...rest] = part.split(':');
    if (!k || !rest.length) return;
    const key = k.trim();
    const value = rest.join(':').trim();
    obj[key] = value;
  });

  if (!Object.keys(obj).length) return { raw: text };

  const eligibleRaw = obj.eligible ?? obj.Eligible ?? obj['Eligible '];
  let eligible;
  if (typeof eligibleRaw === 'boolean') eligible = eligibleRaw;
  else if (typeof eligibleRaw === 'string') {
    const lower = eligibleRaw.toLowerCase();
    if (lower === 'true' || lower === 'yes') eligible = true;
    else if (lower === 'false' || lower === 'no') eligible = false;
  }

  const weightRaw = obj.weight ?? obj.Weight;
  let weight = null;
  if (weightRaw != null && weightRaw !== '') {
    const n = parseFloat(String(weightRaw).replace(/[^\d.]/g, ''));
    if (!Number.isNaN(n)) weight = n;
  }

  return normalizeScreeningObject({
    eligible,
    weight,
    lastDonation: obj.lastDonation ?? obj['Last donation'] ?? obj.last_donation,
    nextEligible: obj.nextEligible ?? obj['Next eligible'] ?? obj.next_eligible,
    healthy: parseBool(obj.healthy ?? obj.Healthy),
    age18to60: parseBool(obj.age18to60 ?? obj['Age 18-60'] ?? obj.ageEligible),
    risks: obj.risks,
    note: obj.note ?? obj.Note,
    raw: text,
  });
}

function parseBool(value) {
  if (value === true || value === false) return value;
  if (value == null || value === '') return null;
  const s = String(value).toLowerCase();
  if (['true', 'yes', 'có', 'co', 'đúng', 'dung', '1'].includes(s)) return true;
  if (['false', 'no', 'không', 'khong', '0'].includes(s)) return false;
  return null;
}

function normalizeScreeningObject(data) {
  if (!data || typeof data !== 'object') return null;

  let eligible = data.eligible;
  if (eligible === undefined && data.Eligible !== undefined) eligible = parseBool(data.Eligible);

  let weight = data.weight;
  if (weight != null && weight !== '') {
    const n = Number(weight);
    weight = Number.isNaN(n) ? null : n;
  } else {
    weight = null;
  }

  const risks = data.risks && typeof data.risks === 'object' ? { ...data.risks } : {};
  RISK_FIELD_KEYS.forEach((key) => {
    if (risks[key] === undefined && data[key] !== undefined) {
      const parsed = parseBool(data[key]);
      risks[key] = parsed != null ? parsed : Boolean(data[key]);
    }
  });

  return {
    eligible: typeof eligible === 'boolean' ? eligible : null,
    weight,
    lastDonation: data.lastDonation ?? data.last_donation ?? null,
    nextEligible: data.nextEligible ?? data.next_eligible ?? null,
    healthy: parseBool(data.healthy),
    age18to60: parseBool(data.age18to60 ?? data.ageEligible),
    risks,
    note: data.note ?? null,
    raw: data.raw ?? null,
  };
}

export function buildScreeningViewModel(data, tr) {
  if (!data) return null;

  const activeRisks = RISK_FIELD_KEYS.filter((key) => data.risks?.[key] === true).map((key) => ({
    key,
    label: tr(`screeningRisk_${key}`),
  }));

  const safeItems = SAFE_FIELD_KEYS.map((key) => {
    const value = key === 'ageEligible' ? (data.age18to60 ?? data.ageEligible) : data.healthy;
    return {
      key,
      label: tr(`screeningSafe_${key}`),
      value,
      display: formatBool(value, tr),
    };
  });

  let eligibilityLabel = tr('screeningEligibleUnknown');
  let eligibilityTone = 'unknown';
  if (data.eligible === true) {
    eligibilityLabel = tr('screeningEligibleYes');
    eligibilityTone = 'success';
  } else if (data.eligible === false) {
    eligibilityLabel = tr('screeningEligibleNo');
    eligibilityTone = 'danger';
  }

  return {
    eligibilityLabel,
    eligibilityTone,
    weightDisplay: data.weight != null && data.weight > 0 ? `${data.weight} kg` : tr('screeningNotProvided'),
    lastDonationDisplay: localizeStoredText(data.lastDonation, tr, 'screeningNoPriorDonation'),
    nextEligibleDisplay: localizeStoredText(data.nextEligible, tr, 'screeningEligibleNow'),
    safeItems,
    activeRisks,
    hasRisks: activeRisks.length > 0,
    note: tr('screeningDisclaimer'),
    isLegacyOnly: Boolean(data.raw && data.eligible == null && data.weight == null),
    legacyRaw: data.raw || null,
  };
}

const STORED_TEXT_KEYS = {
  'Chưa có lần hiến trước': 'screeningNoPriorDonation',
  'No prior donation on record': 'screeningNoPriorDonation',
  'Có thể đăng ký ngay': 'screeningEligibleNow',
  'Eligible to register now': 'screeningEligibleNow',
  'Chưa có': 'screeningNotProvided',
  'Not provided': 'screeningNotProvided',
  'Chưa xác định': 'screeningEligibleUnknown',
  'Unknown / legacy data': 'screeningEligibleUnknown',
};

function localizeStoredText(value, tr, fallbackKey) {
  if (!value) return tr(fallbackKey);
  const key = STORED_TEXT_KEYS[value];
  return key ? tr(key) : value;
}

function formatBool(value, tr) {
  if (value === true) return tr('screeningAnswerYes');
  if (value === false) return tr('screeningAnswerNo');
  return tr('screeningNotProvided');
}

export function formatAppointmentDateTime(value, locale = 'vi-VN') {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(value);
  }
}
