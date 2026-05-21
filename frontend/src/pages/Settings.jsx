import React, { useMemo, useState } from 'react';
import {
  User,
  Phone,
  Droplets,
  Save,
  CheckCircle2,
  HeartHandshake,
  Camera,
  UploadCloud,
  Bell,
  ShieldAlert,
  SlidersHorizontal,
  Download,
  Moon,
  Languages,
  HeartPulse,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { authService } from '../services/auth.service';

const bloodTypes = ['UNKNOWN', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Settings() {
  const user = authService.getCurrentUser();
  const isHospital = user?.role === 'HOSPITAL_ADMIN';

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    blood_type: user?.blood_type || 'UNKNOWN',
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [notifications, setNotifications] = useState(() => ({
    emergencyAlerts: JSON.parse(localStorage.getItem('setting_emergency_alerts') ?? 'true'),
    appointmentReminder: JSON.parse(localStorage.getItem('setting_appointment_reminder') ?? 'true'),
    donationCampaigns: JSON.parse(localStorage.getItem('setting_donation_campaigns') ?? 'true'),
  }));

  const [preferences, setPreferences] = useState(() => ({
    readyToDonate: JSON.parse(localStorage.getItem('setting_ready_to_donate') ?? 'true'),
    reminderDays: localStorage.getItem('setting_reminder_days') || '1',
    language: localStorage.getItem('setting_language') || 'vi',
    appearance: localStorage.getItem('setting_appearance') || 'light',
    exportFormat: localStorage.getItem('setting_export_format') || 'xlsx',
  }));

  const [hospitalConfig, setHospitalConfig] = useState(() => ({
    criticalThreshold: localStorage.getItem('setting_critical_threshold') || '0.5',
    warningThreshold: localStorage.getItem('setting_warning_threshold') || '0.8',
    bloodMatchWeight: localStorage.getItem('setting_weight_blood_match') || '0.45',
    eligibilityWeight: localStorage.getItem('setting_weight_eligibility') || '0.30',
    reliabilityWeight: localStorage.getItem('setting_weight_reliability') || '0.15',
    humanitarianWeight: localStorage.getItem('setting_weight_humanitarian') || '0.10',
  }));

  const totalWeight = useMemo(() => {
    return (
      Number(hospitalConfig.bloodMatchWeight || 0) +
      Number(hospitalConfig.eligibilityWeight || 0) +
      Number(hospitalConfig.reliabilityWeight || 0) +
      Number(hospitalConfig.humanitarianWeight || 0)
    ).toFixed(2);
  }, [hospitalConfig]);

  const normalizeAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh hợp lệ.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ảnh đại diện không được vượt quá 3MB.' });
      return;
    }
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: '', text: '' });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await authService.uploadAvatar(avatarFile);
      const nextUrl = res.user?.avatar_url || res.avatar_url || '';
      setAvatarUrl(nextUrl);
      setPreviewUrl(nextUrl);
      setAvatarFile(null);
      setMessage({ type: 'success', text: 'Đã cập nhật ảnh đại diện!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Không thể cập nhật ảnh đại diện.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await authService.updateProfile(formData);
      setMessage({ type: 'success', text: 'Đã cập nhật thông tin cá nhân!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Không thể cập nhật thông tin.' });
    } finally {
      setLoading(false);
    }
  };

  const saveLocalSettings = () => {
    Object.entries({
      setting_emergency_alerts: notifications.emergencyAlerts,
      setting_appointment_reminder: notifications.appointmentReminder,
      setting_donation_campaigns: notifications.donationCampaigns,
      setting_ready_to_donate: preferences.readyToDonate,
      setting_reminder_days: preferences.reminderDays,
      setting_language: preferences.language,
      setting_appearance: preferences.appearance,
      setting_export_format: preferences.exportFormat,
      setting_critical_threshold: hospitalConfig.criticalThreshold,
      setting_warning_threshold: hospitalConfig.warningThreshold,
      setting_weight_blood_match: hospitalConfig.bloodMatchWeight,
      setting_weight_eligibility: hospitalConfig.eligibilityWeight,
      setting_weight_reliability: hospitalConfig.reliabilityWeight,
      setting_weight_humanitarian: hospitalConfig.humanitarianWeight,
    }).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value).replace(/^"|"$/g, '')));

    setMessage({ type: 'success', text: 'Đã lưu cấu hình hệ thống!' });
  };

  const displayAvatar = normalizeAvatarUrl(previewUrl || avatarUrl);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">Settings Center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">System Settings</h1>
          <p className="mt-1 text-slate-500">Quản lý hồ sơ cá nhân, thông báo, ưu tiên hiến máu và cấu hình hệ thống.</p>
        </div>
        <button
          type="button"
          onClick={saveLocalSettings}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-black"
        >
          <Save className="h-5 w-5" /> Save All Settings
        </button>
      </header>

      {message.text && (
        <div className={`rounded-2xl border p-4 text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><User className="h-5 w-5 text-red-600" /> Personal Information</h2>
            <p className="mt-1 text-sm text-slate-500">Thông tin định danh cơ bản dùng trong quy trình hiến máu.</p>
          </div>

          <div className="p-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-lg" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-red-600 shadow-lg shadow-red-100">
                  <User className="h-11 w-11 text-white" />
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-950 text-white shadow-lg hover:bg-black">
                <Camera className="h-5 w-5" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-950">{user?.full_name || 'New Donor'}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500"><Phone className="h-4 w-4" /> {user?.phone}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-red-200 hover:text-red-600">
                  <Camera className="h-4 w-4" /> Chọn ảnh
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile || avatarLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" /> {avatarLoading ? 'Đang tải...' : 'Lưu ảnh'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 3MB.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="border-t border-slate-100 p-6 space-y-6">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 flex gap-2">
              <HeartHandshake className="h-5 w-5 shrink-0" /> Login chỉ dùng số điện thoại để giảm thủ tục và khuyến khích người hiến máu tham gia nhanh hơn.
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field icon={User} label="Full Name" value={formData.full_name} onChange={v => setFormData({ ...formData, full_name: v })} required />
              <Field icon={Phone} label="Phone" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} type="tel" required />
              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">Blood Type</label>
                <div className="relative">
                  <Droplets className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  >
                    {bloodTypes.map(type => <option key={type} value={type}>{type === 'UNKNOWN' ? 'Chưa xác định' : type}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50">
              <Save className="h-5 w-5" /> {loading ? 'Saving...' : 'Save Personal Information'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <SettingsCard icon={Bell} title="Notification Settings" desc="Kiểm soát các loại thông báo hệ thống.">
            <ToggleRow label="Emergency blood alerts" checked={notifications.emergencyAlerts} onChange={() => setNotifications({ ...notifications, emergencyAlerts: !notifications.emergencyAlerts })} />
            <ToggleRow label="Appointment reminders" checked={notifications.appointmentReminder} onChange={() => setNotifications({ ...notifications, appointmentReminder: !notifications.appointmentReminder })} />
            <ToggleRow label="Donation campaign messages" checked={notifications.donationCampaigns} onChange={() => setNotifications({ ...notifications, donationCampaigns: !notifications.donationCampaigns })} />
          </SettingsCard>

          <SettingsCard icon={HeartPulse} title="Donation Preferences" desc="Thiết lập mức sẵn sàng tham gia hiến máu.">
            <ToggleRow label="Ready to donate when needed" checked={preferences.readyToDonate} onChange={() => setPreferences({ ...preferences, readyToDonate: !preferences.readyToDonate })} />
            <SelectRow label="Reminder before appointment" value={preferences.reminderDays} onChange={v => setPreferences({ ...preferences, reminderDays: v })} options={[['0', 'Không nhắc'], ['1', 'Trước 1 ngày'], ['2', 'Trước 2 ngày'], ['3', 'Trước 3 ngày']]} />
          </SettingsCard>

          <SettingsCard icon={Moon} title="System Preferences" desc="Tùy chỉnh trải nghiệm sử dụng.">
            <SelectRow icon={Languages} label="Language" value={preferences.language} onChange={v => setPreferences({ ...preferences, language: v })} options={[['vi', 'Tiếng Việt'], ['en', 'English']]} />
            <SelectRow label="Appearance" value={preferences.appearance} onChange={v => setPreferences({ ...preferences, appearance: v })} options={[['light', 'Light'], ['dark', 'Dark'], ['system', 'System default']]} />
            <SelectRow icon={Download} label="Default export format" value={preferences.exportFormat} onChange={v => setPreferences({ ...preferences, exportFormat: v })} options={[['xlsx', 'Excel (.xlsx)'], ['csv', 'CSV']]} />
          </SettingsCard>
        </div>
      </section>

      {isHospital && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SettingsCard icon={ShieldAlert} title="Emergency Threshold" desc="Cấu hình ngưỡng kích hoạt cảnh báo thiếu máu.">
            <NumberRow label="Critical threshold ratio" value={hospitalConfig.criticalThreshold} onChange={v => setHospitalConfig({ ...hospitalConfig, criticalThreshold: v })} hint="Ví dụ 0.5 nghĩa là tồn kho dưới 50% safety stock sẽ Critical." />
            <NumberRow label="Warning threshold ratio" value={hospitalConfig.warningThreshold} onChange={v => setHospitalConfig({ ...hospitalConfig, warningThreshold: v })} hint="Ví dụ 0.8 nghĩa là tồn kho dưới 80% safety stock sẽ Warning." />
          </SettingsCard>

          <SettingsCard icon={SlidersHorizontal} title="Recommendation Weights" desc="Trọng số heuristic dùng để xếp hạng donor. Tổng nên xấp xỉ 1.00.">
            <div className={`rounded-2xl p-4 text-sm font-black ${Number(totalWeight) === 1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              Tổng trọng số hiện tại: {totalWeight}
            </div>
            <NumberRow label="BloodMatch" value={hospitalConfig.bloodMatchWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, bloodMatchWeight: v })} />
            <NumberRow label="Eligibility" value={hospitalConfig.eligibilityWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, eligibilityWeight: v })} />
            <NumberRow label="Reliability" value={hospitalConfig.reliabilityWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, reliabilityWeight: v })} />
            <NumberRow label="Humanitarian Points" value={hospitalConfig.humanitarianWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, humanitarianWeight: v })} />
            <p className="text-sm leading-6 text-slate-500">Khi Emergency Mode bật, hệ thống có thể tăng ưu tiên BloodMatch để huy động đúng nhóm máu đang thiếu.</p>
          </SettingsCard>
        </section>
      )}
    </div>
  );
}

function SettingsCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-red-100 hover:bg-red-50/40">
      <span className="text-sm font-black text-slate-700">{label}</span>
      {checked ? <ToggleRight className="h-7 w-7 text-red-600" /> : <ToggleLeft className="h-7 w-7 text-slate-400" />}
    </button>
  );
}

function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10">
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </div>
  );
}

function NumberRow({ label, value, onChange, hint }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
      <input type="number" step="0.01" min="0" value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10" />
      {hint && <p className="text-xs leading-5 text-slate-400">{hint}</p>}
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = 'text', required = false }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          required={required}
        />
      </div>
    </div>
  );
}
