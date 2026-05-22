import React, { useEffect, useMemo, useState } from 'react';
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
import { applyAppearanceForUser, getScopedSetting, setScopedSetting, useI18n } from '../utils/userSettings';

const bloodTypes = ['UNKNOWN', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Settings() {
  const user = authService.getCurrentUser();
  const isHospital = user?.role === 'HOSPITAL_ADMIN';
  const tr = useI18n(user);

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
    emergencyAlerts: getScopedSetting('emergency_alerts', true, user) === true || getScopedSetting('emergency_alerts', true, user) === 'true',
    appointmentReminder: getScopedSetting('appointment_reminder', true, user) === true || getScopedSetting('appointment_reminder', true, user) === 'true',
    donationCampaigns: getScopedSetting('donation_campaigns', true, user) === true || getScopedSetting('donation_campaigns', true, user) === 'true',
  }));

  const [preferences, setPreferences] = useState(() => ({
    readyToDonate: getScopedSetting('ready_to_donate', true, user) === true || getScopedSetting('ready_to_donate', true, user) === 'true',
    reminderDays: getScopedSetting('reminder_days', '1', user),
    language: getScopedSetting('language', 'vi', user),
    appearance: getScopedSetting('appearance', 'light', user),
    exportFormat: getScopedSetting('export_format', 'xlsx', user),
  }));

  useEffect(() => {
    setScopedSetting('appearance', preferences.appearance, user);
    applyAppearanceForUser(user);
  }, [preferences.appearance]);

  useEffect(() => {
    setScopedSetting('language', preferences.language, user);
  }, [preferences.language]);

  const [hospitalConfig, setHospitalConfig] = useState(() => ({
    criticalThreshold: getScopedSetting('critical_threshold', '0.5', user),
    warningThreshold: getScopedSetting('warning_threshold', '0.8', user),
    bloodMatchWeight: getScopedSetting('weight_blood_match', '0.45', user),
    eligibilityWeight: getScopedSetting('weight_eligibility', '0.30', user),
    reliabilityWeight: getScopedSetting('weight_reliability', '0.15', user),
    humanitarianWeight: getScopedSetting('weight_humanitarian', '0.10', user),
  }));

  const [homepageMedia, setHomepageMedia] = useState({
    hospital_image_url: '/images/hospital-showcase.svg',
    donor_activity_image_url: '/images/donor-activity.svg',
  });
  const [homepageFiles, setHomepageFiles] = useState({ hospital: null, activity: null });
  const [homepagePreviews, setHomepagePreviews] = useState({ hospital: '', activity: '' });
  const [homepageLoading, setHomepageLoading] = useState({ hospital: false, activity: false });

  useEffect(() => {
    if (!isHospital) return;
    authService.getHomepageMedia()
      .then((data) => {
        setHomepageMedia((prev) => ({ ...prev, ...data }));
        setHomepagePreviews({
          hospital: data?.hospital_image_url || '/images/hospital-showcase.svg',
          activity: data?.donor_activity_image_url || '/images/donor-activity.svg',
        });
      })
      .catch(() => {});
  }, [isHospital]);

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
      setMessage({ type: 'error', text: tr('validImage') });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: tr('avatarTooLarge') });
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
      setMessage({ type: 'success', text: tr('avatarUpdated') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || tr('avatarFailed') });
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
      setMessage({ type: 'success', text: tr('profileUpdated') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || tr('profileFailed') });
    } finally {
      setLoading(false);
    }
  };

  const saveLocalSettings = () => {
    const commonSettings = {
      emergency_alerts: notifications.emergencyAlerts,
      appointment_reminder: notifications.appointmentReminder,
      donation_campaigns: notifications.donationCampaigns,
      ready_to_donate: preferences.readyToDonate,
      reminder_days: preferences.reminderDays,
      language: preferences.language,
      appearance: preferences.appearance,
      export_format: preferences.exportFormat,
    };

    Object.entries(commonSettings).forEach(([key, value]) => setScopedSetting(key, value, user));

    if (isHospital) {
      Object.entries({
        critical_threshold: hospitalConfig.criticalThreshold,
        warning_threshold: hospitalConfig.warningThreshold,
        weight_blood_match: hospitalConfig.bloodMatchWeight,
        weight_eligibility: hospitalConfig.eligibilityWeight,
        weight_reliability: hospitalConfig.reliabilityWeight,
        weight_humanitarian: hospitalConfig.humanitarianWeight,
      }).forEach(([key, value]) => setScopedSetting(key, value, user));
    }

    applyAppearanceForUser(user);
    setMessage({ type: 'success', text: isHospital ? tr('savedHospital') : tr('savedDonor') });
  };

  const handleHomepageImageChange = (mediaType, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh hợp lệ.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ảnh trang chủ không được vượt quá 5MB.' });
      return;
    }
    setHomepageFiles((prev) => ({ ...prev, [mediaType]: file }));
    setHomepagePreviews((prev) => ({ ...prev, [mediaType]: URL.createObjectURL(file) }));
    setMessage({ type: '', text: '' });
  };

  const handleHomepageUpload = async (mediaType) => {
    const file = homepageFiles[mediaType];
    if (!file) return;
    setHomepageLoading((prev) => ({ ...prev, [mediaType]: true }));
    setMessage({ type: '', text: '' });
    try {
      const res = await authService.uploadHomepageMedia(mediaType, file);
      const media = res.homepage_media || {};
      setHomepageMedia((prev) => ({ ...prev, ...media }));
      setHomepagePreviews({
        hospital: media.hospital_image_url || homepagePreviews.hospital,
        activity: media.donor_activity_image_url || homepagePreviews.activity,
      });
      setHomepageFiles((prev) => ({ ...prev, [mediaType]: null }));
      setMessage({ type: 'success', text: mediaType === 'hospital' ? 'Đã cập nhật ảnh bệnh viện trên trang chủ.' : 'Đã cập nhật ảnh hoạt động hiến máu trên trang chủ.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Không thể cập nhật ảnh trang chủ.' });
    } finally {
      setHomepageLoading((prev) => ({ ...prev, [mediaType]: false }));
    }
  };

  const displayAvatar = normalizeAvatarUrl(previewUrl || avatarUrl);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">{tr('settingsCenter')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{tr('systemSettings')}</h1>
          <p className="mt-1 text-slate-500">{tr('settingsIntro')}</p>
          <p className="mt-2 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">{tr('settingsScope', { role: isHospital ? tr('hospital') : tr('donor') })}</p>
        </div>
        <button
          type="button"
          onClick={saveLocalSettings}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-black"
        >
          <Save className="h-5 w-5" /> {tr('saveAllSettings')}
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
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><User className="h-5 w-5 text-red-600" /> {tr('personalInformation')}</h2>
            <p className="mt-1 text-sm text-slate-500">{tr('personalInfoDesc')}</p>
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
              <h3 className="text-lg font-black text-slate-950">{user?.full_name || tr('donor')}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500"><Phone className="h-4 w-4" /> {user?.phone}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-red-200 hover:text-red-600">
                  <Camera className="h-4 w-4" /> {tr('chooseImage')}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile || avatarLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" /> {avatarLoading ? tr('uploading') : tr('saveImage')}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">{tr('avatarHelp')}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="border-t border-slate-100 p-6 space-y-6">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 flex gap-2">
              <HeartHandshake className="h-5 w-5 shrink-0" /> {tr('phoneLoginReason')}
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field icon={User} label={tr('fullName')} value={formData.full_name} onChange={v => setFormData({ ...formData, full_name: v })} required />
              <Field icon={Phone} label={tr('phone')} value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} type="tel" required />
              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">{tr('bloodType')}</label>
                <div className="relative">
                  <Droplets className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  >
                    {bloodTypes.map(type => <option key={type} value={type}>{type === 'UNKNOWN' ? tr('unknown') : type}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50">
              <Save className="h-5 w-5" /> {loading ? tr('saving') : tr('savePersonalInfo')}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <SettingsCard icon={Bell} title={tr('notificationSettings')} desc={tr('notificationDesc')}>
            <ToggleRow label={tr('emergencyBloodAlerts')} checked={notifications.emergencyAlerts} onChange={() => setNotifications({ ...notifications, emergencyAlerts: !notifications.emergencyAlerts })} />
            <ToggleRow label={tr('appointmentReminders')} checked={notifications.appointmentReminder} onChange={() => setNotifications({ ...notifications, appointmentReminder: !notifications.appointmentReminder })} />
            <ToggleRow label={tr('donationCampaignMessages')} checked={notifications.donationCampaigns} onChange={() => setNotifications({ ...notifications, donationCampaigns: !notifications.donationCampaigns })} />
          </SettingsCard>

          <SettingsCard icon={HeartPulse} title={tr('donationPreferences')} desc={tr('donationPreferencesDesc')}>
            <ToggleRow label={tr('readyToDonate')} checked={preferences.readyToDonate} onChange={() => setPreferences({ ...preferences, readyToDonate: !preferences.readyToDonate })} />
            <SelectRow label={tr('reminderBeforeAppointment')} value={preferences.reminderDays} onChange={v => setPreferences({ ...preferences, reminderDays: v })} options={[['0', tr('noReminder')], ['1', tr('oneDayBefore')], ['2', tr('twoDaysBefore')], ['3', tr('threeDaysBefore')]]} />
          </SettingsCard>

          <SettingsCard icon={Moon} title={tr('systemPreferences')} desc={tr('systemPreferencesDesc')}>
            <SelectRow icon={Languages} label={tr('language')} value={preferences.language} onChange={v => setPreferences({ ...preferences, language: v })} options={[['vi', 'Tiếng Việt'], ['en', 'English']]} />
            <SelectRow label={tr('appearance')} value={preferences.appearance} onChange={v => setPreferences({ ...preferences, appearance: v })} options={[['light', tr('lightMode')], ['dark', tr('darkMode')], ['system', tr('systemDefault')]]} />
            <SelectRow icon={Download} label={tr('defaultExportFormat')} value={preferences.exportFormat} onChange={v => setPreferences({ ...preferences, exportFormat: v })} options={[['xlsx', 'Excel (.xlsx)'], ['csv', 'CSV']]} />
          </SettingsCard>
        </div>
      </section>

      {isHospital && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SettingsCard icon={Camera} title="Homepage Media" desc="Hospital Admin có quyền thay ảnh bệnh viện và ảnh hoạt động hiến máu hiển thị ở trang chủ.">
            <HomepageMediaRow
              title="Ảnh bệnh viện trên trang chủ"
              desc="Hiển thị ở khối hero của landing page."
              preview={homepagePreviews.hospital || homepageMedia.hospital_image_url || '/images/hospital-showcase.svg'}
              hasFile={Boolean(homepageFiles.hospital)}
              loading={homepageLoading.hospital}
              onChange={(file) => handleHomepageImageChange('hospital', file)}
              onUpload={() => handleHomepageUpload('hospital')}
            />
            <HomepageMediaRow
              title="Ảnh người đang hiến máu"
              desc="Hiển thị ở section People Donating Today."
              preview={homepagePreviews.activity || homepageMedia.donor_activity_image_url || '/images/donor-activity.svg'}
              hasFile={Boolean(homepageFiles.activity)}
              loading={homepageLoading.activity}
              onChange={(file) => handleHomepageImageChange('activity', file)}
              onUpload={() => handleHomepageUpload('activity')}
            />
            <p className="text-xs leading-5 text-slate-400">Ảnh sau khi lưu sẽ xuất hiện ở trang chủ cho tất cả người truy cập. Donor chỉ đổi được avatar cá nhân, không sửa được ảnh trang chủ.</p>
          </SettingsCard>

          <SettingsCard icon={ShieldAlert} title={tr('emergencyThreshold')} desc={tr('emergencyThresholdDesc')}>
            <NumberRow label={tr('criticalThresholdRatio')} value={hospitalConfig.criticalThreshold} onChange={v => setHospitalConfig({ ...hospitalConfig, criticalThreshold: v })} hint={tr('criticalHint')} />
            <NumberRow label={tr('warningThresholdRatio')} value={hospitalConfig.warningThreshold} onChange={v => setHospitalConfig({ ...hospitalConfig, warningThreshold: v })} hint={tr('warningHint')} />
          </SettingsCard>

          <SettingsCard icon={SlidersHorizontal} title={tr('recommendationWeights')} desc={tr('recommendationWeightsDesc')}>
            <div className={`rounded-2xl p-4 text-sm font-black ${Number(totalWeight) === 1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {tr('totalWeightNow', { total: totalWeight })}
            </div>
            <NumberRow label={tr('bloodMatch')} value={hospitalConfig.bloodMatchWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, bloodMatchWeight: v })} />
            <NumberRow label={tr('eligibility')} value={hospitalConfig.eligibilityWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, eligibilityWeight: v })} />
            <NumberRow label={tr('reliability')} value={hospitalConfig.reliabilityWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, reliabilityWeight: v })} />
            <NumberRow label={tr('humanitarianPointsLabel')} value={hospitalConfig.humanitarianWeight} onChange={v => setHospitalConfig({ ...hospitalConfig, humanitarianWeight: v })} />
            <p className="text-sm leading-6 text-slate-500">{tr('emergencyWeightHint')}</p>
          </SettingsCard>
        </section>
      )}
    </div>
  );
}



function HomepageMediaRow({ title, desc, preview, hasFile, loading, onChange, onUpload }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-[150px_1fr] md:items-center">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img src={preview} alt={title} className="h-28 w-full object-cover" />
        </div>
        <div>
          <p className="font-black text-slate-800">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-red-200 hover:text-red-600">
              <Camera className="h-4 w-4" /> Chọn ảnh
              <input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onUpload}
              disabled={!hasFile || loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" /> {loading ? 'Đang lưu...' : 'Lưu ảnh'}
            </button>
          </div>
        </div>
      </div>
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
