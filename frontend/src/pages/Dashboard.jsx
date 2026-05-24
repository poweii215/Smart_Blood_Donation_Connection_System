import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, Bell, Calendar, CheckCircle2, Clock, Droplets, HeartHandshake, TrendingUp, Users, Activity, Plus, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bloodBankService } from '../services/bloodbank.service';
import { appointmentService } from '../services/appointment.service';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';

const toLocalDateKey = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};


export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [hospitalAnalytics, setHospitalAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';
  const tr = useI18n(user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          bloodBankService.getInventory(),
          isAdmin ? appointmentService.getAllAppointments() : appointmentService.getMyAppointments(),
          analyticsService.getSummary(),
          analyticsService.getNotifications(),
        ];
        if (isAdmin) requests.push(analyticsService.getHospitalAnalytics());
        const results = await Promise.all(requests);
        setInventory(results[0] || []);
        setAppointments(results[1] || []);
        setSummary(results[2] || null);
        setNotifications(results[3]?.items || []);
        if (isAdmin) setHospitalAnalytics(results[4] || null);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const todayAppointments = useMemo(() => {
    const today = toLocalDateKey(new Date());
    return appointments.filter((app) => toLocalDateKey(app.appointment_date) === today);
  }, [appointments]);

  if (loading) return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">{tr('loadingDashboard')}</div>;

  if (!isAdmin) return <DonorDashboard user={user} summary={summary} appointments={appointments} notifications={notifications} tr={tr} />;

  const totalUnits = inventory.reduce((acc, item) => acc + Number(item.quantity || item.current_quantity || 0), 0);
  const completedToday = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const pendingToday = todayAppointments.filter((a) => a.status === 'PENDING').length;
  const activeDonors = summary?.potential_donors || summary?.active_donors || 0;
  const emergencyTypes = inventory.filter((item) => item.emergency_mode || item.status === 'EMERGENCY' || item.status === 'CRITICAL' || Number(item.quantity || 0) < Number(item.safety_threshold || item.safety_stock || 0));
  const topEmergency = emergencyTypes[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {topEmergency && (
        <section className="emergency-alert-card rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-100"><AlertTriangle className="h-9 w-9" /></div>
              <div>
                <p className="text-xl font-black uppercase tracking-wide text-red-600">{tr('emergencyAlert').toUpperCase()}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{tr('bloodTypeCritical', { bloodType: topEmergency.blood_type })}</h2>
                <p className="text-slate-600">{tr('emergencyHint', { bloodType: topEmergency.blood_type })}</p>
              </div>
            </div>
            <a href="/recommendation" className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700">{tr('emergencyOpenRecommendation')}</a>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} color="blue" title={tr('todayAppointments')} value={todayAppointments.length} note={tr('pendingToday', { count: pendingToday })} />
        <StatCard icon={Droplets} color="green" title="Lượt hiến hoàn tất (toàn hệ thống)" value={summary?.completed_donations || completedToday || appointments.filter(a => a.status === 'COMPLETED').length} note="Tính từ khi hệ thống bắt đầu ghi nhận" />
        <StatCard icon={Users} color="amber" title="Tổng người hiến (toàn hệ thống)" value={summary?.total_donors || activeDonors || 0} note="Tổng hồ sơ donor đã đăng ký" />
        <StatCard icon={Activity} color="purple" title={tr('emergencyTypes')} value={hospitalAnalytics?.emergency_blood_types ?? emergencyTypes.length} note={tr('needAttention')} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_.95fr_.9fr]">
        <Panel title={tr('todayAppointments')} action="Tóm tắt vận hành">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400"><th className="px-4 py-4">{tr('time')}</th><th className="px-4 py-4">{tr('donor')}</th><th className="px-4 py-4">{tr('bloodType')}</th><th className="px-4 py-4">{tr('status')}</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {todayAppointments.slice(0, 6).map((app) => (
                  <tr key={app.id} className="text-sm">
                    <td className="px-4 py-4 font-semibold text-slate-700">{formatTime(app.appointment_date)}</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{app.donor_name || app.user_name || tr('donor')}</td>
                    <td className="px-4 py-4"><span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-black text-red-600">{app.blood_type || 'UNKNOWN'}</span></td>
                    <td className="px-4 py-4"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
                {todayAppointments.length === 0 && <tr><td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-400">Không có lịch hẹn nào trong hôm nay.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={tr('inventoryStatus')} action="Theo ngưỡng an toàn">
          <div className="space-y-3">
            {inventory.slice(0, 8).map((item) => (
              <InventoryRow key={item.blood_type} item={item} tr={tr} />
            ))}
          </div>
        </Panel>

        <Panel title={tr('notificationCenter')} action="Cảnh báo tự động">
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n, idx) => <NotificationItem key={`${n.type}-${idx}`} item={n} />)}
            {!notifications.length && <p className="py-10 text-center text-sm text-slate-400">{tr('noNotifications')}</p>}
            <a href="/notifications" className="mt-3 inline-flex w-full justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">{tr('viewNotificationCenter')}</a>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={tr('monthlyDonationAnalytics')} action={tr('last12Months')}>
          <MonthlyChart data={hospitalAnalytics?.monthly_donations || []} />
        </Panel>
        <Panel title={tr('hospitalPerformance')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricTile label={tr('donorRetention')} value={`${hospitalAnalytics?.donor_retention_rate ?? 0}%`} />
            <MetricTile label={tr('completionRate')} value={`${hospitalAnalytics?.appointment_completion_rate ?? 0}%`} />
            <MetricTile label={tr('completedAppointments')} value={hospitalAnalytics?.completed_appointments ?? 0} />
            <MetricTile label={tr('totalAppointments')} value={hospitalAnalytics?.total_appointments ?? 0} />
          </div>
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-black text-red-700">{tr('mostNeededBloodTypes')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(hospitalAnalytics?.most_needed_blood_types || inventory).slice(0, 5).map((b) => (
                <span key={b.blood_type} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-red-600 shadow-sm">{b.blood_type}: {Number(b.quantity || 0).toFixed(1)}</span>
              ))}
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function DonorDashboard({ user, summary, appointments, notifications, tr }) {
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const latestActive = appointments.find(a => ['APPROVED','CHECKED_IN','IN_PROGRESS','COMPLETED'].includes(a.status)) || appointments[0];
  const days = summary?.days_until_eligible ?? 0;
  const points = summary?.humanitarian_points ?? user?.humanitarian_points ?? 0;
  const progress = 100 - Math.min(100, (days / 84) * 100);
  const upcoming = appointments.find(a => ['PENDING','APPROVED','CHECKED_IN','IN_PROGRESS'].includes(a.status));
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="donor-impact-card rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm dark:border-red-900/50 dark:from-red-950/30 dark:to-slate-900">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-100"><HeartHandshake className="h-8 w-8" /></div>
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-red-600">{tr('donationImpactMessage')}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{tr('helloUser', { name: user?.full_name || tr('donor') })}</h1>
            <p className="mt-1 text-slate-600">{summary?.impact_message || tr('defaultImpact')}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Award} color="amber" title={tr('humanitarianPoints')} value={points} note={tr('yourContribution')} />
        <StatCard icon={Clock} color="purple" title={tr('eligibleAgainIn')} value={`${days} ${tr('days')}`} note={tr('recoveryCycle')} />
        <StatCard icon={CheckCircle2} color="green" title={tr('completedDonationsTitle')} value={summary?.completed_donations ?? completed} note={tr('successfulDonationRecords')} />
        <StatCard icon={TrendingUp} color="blue" title={tr('reliability')} value={`${Math.round(summary?.reliability_score ?? user?.reliability_score ?? 100)}%`} note={tr('appointmentTrustScore')} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link to="/appointments" className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40"><Plus className="h-5 w-5" /></div>
          <div><p className="text-sm font-black text-slate-900 dark:text-slate-50">Đặt lịch hiến máu</p><p className="text-xs text-slate-500">{upcoming ? 'Bạn có lịch đang chờ' : 'Đăng ký lịch mới'}</p></div>
        </Link>
        <Link to="/assistant" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40"><Bot className="h-5 w-5" /></div>
          <div><p className="text-sm font-black text-slate-900 dark:text-slate-50">Trợ lý thông minh</p><p className="text-xs text-slate-500">Hỏi điều kiện, lịch hẹn</p></div>
        </Link>
        <Link to="/settings" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800"><Award className="h-5 w-5" /></div>
          <div><p className="text-sm font-black text-slate-900 dark:text-slate-50">Hồ sơ & cài đặt</p><p className="text-xs text-slate-500">Cập nhật nhóm máu, avatar</p></div>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title={tr('donorJourneyVisualization')} action={tr('yourCurrentPath')}>
          <JourneyTimeline currentStatus={latestActive?.status} daysUntilEligible={days} tr={tr} />
        </Panel>
        <Panel title={tr('notificationCenter')} action={tr('donor')}>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((n, idx) => <NotificationItem key={`${n.type}-${idx}`} item={n} />)}
            {!notifications.length && <p className="py-10 text-center text-sm text-slate-400">{tr('noNotifications')}</p>}
            <a href="/notifications" className="mt-3 inline-flex w-full justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">{tr('openNotificationCenter')}</a>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Panel title={tr('eligibilityCountdown')}>
          <div className="space-y-4">
            <div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600" style={{ width: `${progress}%` }} /></div>
            <p className="text-sm font-semibold text-slate-600">{days === 0 ? tr('eligibleNow') : tr('eligibleLater', { days })}</p>
          </div>
        </Panel>
        <Panel title={tr('recentAppointmentsTitle')}>
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 4).map((app) => (
              <div key={app.id} className="flex items-start justify-between gap-4 py-4 text-sm">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{formatDate(app.appointment_date)}</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-300">{getDonorAppointmentMessage(app, tr)}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
            {appointments.length === 0 && <p className="py-10 text-center text-sm text-slate-400">{tr('noAppointmentsYet')}</p>}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function getDonorAppointmentMessage(app, tr) {
  const status = String(app?.status || 'PENDING').toUpperCase();
  const hospitalName = app?.hospital_name || app?.hospital || 'Central Blood Donation Hospital';
  const screening = normalizeScreening(app?.pre_screening_result);

  if (status === 'COMPLETED') {
    return `Bạn đã hoàn tất hiến máu tại ${hospitalName}. Cảm ơn bạn vì nghĩa cử nhân đạo.`;
  }
  if (status === 'CANCELLED') {
    return 'Lịch hẹn này đã bị hủy. Bạn có thể đặt lại lịch mới khi phù hợp.';
  }
  if (status === 'APPROVED') {
    return `Lịch hẹn đã được bệnh viện duyệt. Vui lòng đến đúng giờ tại ${hospitalName}.`;
  }
  if (status === 'CHECKED_IN') {
    return 'Bạn đã check-in tại bệnh viện. Vui lòng làm theo hướng dẫn của nhân viên y tế.';
  }
  if (status === 'IN_PROGRESS') {
    return 'Bạn đang trong quy trình hiến máu. Vui lòng nghỉ ngơi và giữ tinh thần thoải mái.';
  }

  if (screening?.eligible === false) {
    return 'Sàng lọc: chưa đủ điều kiện. Vui lòng kiểm tra lại thông tin sức khỏe hoặc liên hệ bệnh viện để được tư vấn.';
  }
  if (screening?.eligible === true) {
    return 'Sàng lọc: đủ điều kiện sơ bộ. Lịch hẹn đang chờ bệnh viện xác nhận.';
  }
  return tr('screeningNotUpdated');
}

function normalizeScreening(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  const text = String(raw).trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const hasRisk = parsed.risks && Object.values(parsed.risks).some(Boolean);
      const eligible = parsed.eligible ?? (
        Number(parsed.weight || 0) >= 45 &&
        parsed.healthy !== false &&
        parsed.sleep !== false &&
        parsed.ateWell !== false &&
        parsed.age18to60 !== false &&
        !hasRisk
      );
      return { ...parsed, eligible };
    }
  } catch {
    // Support legacy stored screening text such as "Eligible: true; Weight: 56kg..."
  }

  const eligibleMatch = text.match(/Eligible:\s*(true|false)/i);
  if (eligibleMatch) return { eligible: eligibleMatch[1].toLowerCase() === 'true' };
  return null;
}

function JourneyTimeline({ currentStatus, daysUntilEligible, tr }) {
  const steps = [
    { key: 'REGISTERED', label: tr('registered'), hint: tr('registeredHint') },
    { key: 'APPROVED', label: tr('approved'), hint: tr('approvedHint') },
    { key: 'CHECKED_IN', label: tr('checkedIn'), hint: tr('checkedInHint') },
    { key: 'COMPLETED', label: tr('donated'), hint: tr('donatedHint') },
    { key: 'RECOVERY', label: tr('recovery'), hint: tr('recoveryHint') },
    { key: 'ELIGIBLE', label: tr('eligibleAgain'), hint: tr('eligibleAgainHint') },
  ];
  const statusIndex = { PENDING: 0, APPROVED: 1, CHECKED_IN: 2, IN_PROGRESS: 2, COMPLETED: daysUntilEligible === 0 ? 5 : 4, CANCELLED: 0 };
  const activeIndex = statusIndex[currentStatus] ?? 0;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {steps.map((step, idx) => {
        const active = idx <= activeIndex;
        return <div key={step.key} className={`rounded-2xl border p-4 ${active ? 'border-red-100 bg-red-50' : 'border-slate-200 bg-white'}`}>
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${active ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
          <p className={`text-sm font-black ${active ? 'text-red-700' : 'text-slate-500'}`}>{step.label}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{step.hint}</p>
        </div>;
      })}
    </div>
  );
}

function MonthlyChart({ data }) {
  const safe = data.length ? data : [{ month: '—', completed: 0, total: 0 }];
  const maxVal = Math.max(1, ...safe.map(d => Number(d.completed || d.total || 0)));
  return <div className="space-y-3">
    {safe.slice(-12).map((d, idx) => {
      const value = Number(d.completed || 0);
      const width = Math.max(4, (value / maxVal) * 100);
      return <div key={`${d.month}-${idx}`} className="grid grid-cols-[80px_1fr_50px] items-center gap-3 text-sm">
        <span className="font-bold text-slate-500">{d.month}</span>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600" style={{ width: `${width}%` }} /></div>
        <span className="text-right font-black text-slate-800">{value}</span>
      </div>;
    })}
  </div>;
}

function InventoryRow({ item, tr }) {
  const q = Number(item.quantity || item.current_quantity || 0);
  const th = Number(item.safety_threshold || item.safety_stock || 1);
  const pct = Math.min(100, Math.max(4, (q / Math.max(th * 2, 1)) * 100));
  const critical = q < th;
  return <div className="rounded-2xl border border-slate-100 p-4">
    <div className="mb-2 flex items-center justify-between"><span className="font-black text-slate-950">{item.blood_type}</span><span className={`rounded-lg px-2 py-1 text-xs font-black ${critical ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{critical ? tr('criticalLabel') : tr('safeLabel')}</span></div>
    <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${critical ? 'bg-red-600' : 'bg-green-500'}`} style={{ width: `${pct}%` }} /></div>
    <p className="mt-2 text-xs font-semibold text-slate-500">{q.toFixed(1)} / safety {th.toFixed(1)}</p>
  </div>;
}

function NotificationItem({ item }) {
  const cls = item.priority === 'HIGH' ? 'border-red-100 bg-red-50 text-red-700' : item.priority === 'SUCCESS' ? 'border-green-100 bg-green-50 text-green-700' : 'border-blue-100 bg-blue-50 text-blue-700';
  return <div className={`rounded-2xl border p-4 ${cls}`}>
    <div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-sm opacity-90">{item.message}</p></div></div>
  </div>;
}

function Panel({ title, action, children }) { return <section className="dashboard-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">{title}</h2>{action && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{action}</span>}</div>{children}</section>; }
function StatCard({ icon: Icon, color, title, value, note }) { const colors = { blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', amber:'bg-amber-50 text-amber-600', purple:'bg-purple-50 text-purple-600', red:'bg-red-50 text-red-600' }; return <article className="dashboard-stat-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-5"><div className={`flex h-16 w-16 items-center justify-center rounded-full ${colors[color] || colors.red}`}><Icon className="h-8 w-8" /></div><div><p className="text-sm font-bold text-slate-500">{title}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs font-semibold text-green-600">↑ {note}</p></div></div></article>; }
function StatusBadge({ status }) { const styles = { PENDING:'bg-amber-50 text-amber-700', APPROVED:'bg-blue-50 text-blue-700', CHECKED_IN:'bg-indigo-50 text-indigo-700', IN_PROGRESS:'bg-purple-50 text-purple-700', COMPLETED:'bg-green-50 text-green-700', CANCELLED:'bg-slate-100 text-slate-600' }; return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${styles[status] || styles.PENDING}`}>{String(status || 'PENDING').replace('_', ' ')}</span>; }
function MetricTile({ label, value }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>; }
function formatTime(date) { if (!date) return '--:--'; try { return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '--:--'; } }
function formatDate(date) { if (!date) return '--'; try { return new Date(date).toLocaleString(); } catch { return String(date); } }
