import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Droplets, HeartHandshake, TrendingUp, Users, Activity, Clock, Award } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { appointmentService } from '../services/appointment.service';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';
  const tr = useI18n(user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, appData, summaryData] = await Promise.all([
          bloodBankService.getInventory(),
          isAdmin ? appointmentService.getAllAppointments() : appointmentService.getMyAppointments(),
          analyticsService.getSummary(),
        ]);
        setInventory(invData || []);
        setAppointments(appData || []);
        setSummary(summaryData || null);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.filter((app) => String(app.appointment_date || '').slice(0, 10) === today);
  }, [appointments]);

  if (loading) return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">{tr('loadingDashboard')}</div>;

  const totalUnits = inventory.reduce((acc, item) => acc + Number(item.quantity || item.current_quantity || 0), 0);
  const completedToday = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const pendingToday = todayAppointments.filter((a) => a.status === 'PENDING').length;
  const activeDonors = summary?.potential_donors || summary?.active_donors || 0;
  const emergencyTypes = inventory.filter((item) => item.emergency_mode || item.status === 'EMERGENCY' || item.status === 'CRITICAL' || Number(item.quantity || 0) < Number(item.safety_threshold || item.safety_stock || 0));
  const topEmergency = emergencyTypes[0];

  if (!isAdmin) return <DonorDashboard user={user} summary={summary} appointments={appointments} tr={tr} />;

  return (
    <div className="space-y-6">
      {topEmergency && (
        <section className="emergency-alert-card rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-100"><AlertTriangle className="h-9 w-9" /></div>
              <div>
                <p className="text-xl font-black uppercase tracking-wide text-red-600">{tr('emergencyAlert')}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{tr('bloodTypeCritical', { bloodType: topEmergency.blood_type })}</h2>
                <p className="text-slate-600">{tr('emergencyHint', { bloodType: topEmergency.blood_type })}</p>
              </div>
            </div>
            <a href="/recommendation" className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700">{tr('viewDetails')}</a>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} color="blue" title={tr('todayAppointments')} value={todayAppointments.length || appointments.length} note={tr('pendingToday', { count: pendingToday })} />
        <StatCard icon={Droplets} color="green" title={tr('totalDonations')} value={summary?.completed_donations || completedToday || appointments.filter(a => a.status === 'COMPLETED').length} note={tr('completedRecords')} />
        <StatCard icon={Users} color="amber" title={tr('totalDonors')} value={summary?.total_donors || activeDonors || 0} note={tr('registeredDonors')} />
        <StatCard icon={Activity} color="purple" title={tr('activeDonors')} value={activeDonors || 0} note={tr('availableRecommendation')} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr_.85fr]">
        <Panel title={tr('todayAppointments')} action={tr('viewDetails')}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400"><th className="px-4 py-4">{tr('time')}</th><th className="px-4 py-4">{tr('donor')}</th><th className="px-4 py-4">{tr('bloodType')}</th><th className="px-4 py-4">{tr('status')}</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {(todayAppointments.length ? todayAppointments : appointments).slice(0, 5).map((app) => (
                  <tr key={app.id} className="text-sm">
                    <td className="px-4 py-4 font-semibold text-slate-700">{formatTime(app.appointment_date)}</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{app.donor_name || app.user_name || tr('donor')}</td>
                    <td className="px-4 py-4"><span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-black text-red-600">{app.blood_type || 'UNKNOWN'}</span></td>
                    <td className="px-4 py-4"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
                {appointments.length === 0 && <tr><td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-400">{tr('noAppointments')}</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={tr('inventoryStatus')} action={tr('viewDetails')}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400"><th className="px-4 py-4">{tr('bloodType')}</th><th className="px-4 py-4">{tr('inStock')}</th><th className="px-4 py-4">{tr('status')}</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.slice(0, 8).map((item) => (
                  <tr key={item.blood_type} className="text-sm">
                    <td className="px-4 py-3 font-black text-slate-950">{item.blood_type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{Number(item.quantity || item.current_quantity || 0).toFixed(1)}</td>
                    <td className="px-4 py-3"><InventoryBadge item={item} tr={tr} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={tr('inventoryOverview')}>
          <div className="flex flex-col items-center justify-center py-3">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-[conic-gradient(#22c55e_0_62%,#f59e0b_62%_78%,#ef4444_78%_100%)]">
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner"><span className="text-sm text-slate-500">{tr('total')}</span><span className="text-3xl font-black text-slate-950">{Math.round(totalUnits)}</span><span className="text-sm text-slate-500">{tr('units')}</span></div>
            </div>
            <div className="mt-6 w-full space-y-3 text-sm">
              <Legend color="bg-green-500" label={tr('adequate')} value={inventory.filter(i => !['CRITICAL','EMERGENCY','WARNING'].includes(i.status)).length} />
              <Legend color="bg-amber-500" label={tr('low')} value={inventory.filter(i => i.status === 'WARNING').length} />
              <Legend color="bg-red-500" label={tr('critical')} value={emergencyTypes.length} />
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function DonorDashboard({ user, summary, appointments, tr }) {
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const days = summary?.days_until_eligible ?? 0;
  const points = summary?.humanitarian_points ?? user?.humanitarian_points ?? 0;
  const progress = 100 - Math.min(100, (days / 84) * 100);
  return (
    <div className="space-y-6">
      <section className="donor-impact-card rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm">
        <div className="flex items-start gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-100"><HeartHandshake className="h-8 w-8" /></div><div><p className="text-sm font-black uppercase tracking-wider text-red-600">{tr('donationImpactMessage')}</p><h1 className="mt-1 text-2xl font-black text-slate-950">{tr('helloUser', { name: user?.full_name || tr('donor') })}</h1><p className="mt-1 text-slate-600">{summary?.impact_message || tr('defaultImpact')}</p></div></div>
      </section>
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Award} color="amber" title={tr('humanitarianPoints')} value={points} note={tr('donorContribution')} />
        <StatCard icon={Clock} color="purple" title={tr('eligibleAgainIn')} value={`${days} ${tr('days')}`} note={tr('cycle84')} />
        <StatCard icon={CheckCircle2} color="green" title={tr('completedDonations')} value={summary?.completed_donations ?? completed} note={tr('successfulDonations')} />
        <StatCard icon={TrendingUp} color="red" title={tr('livesImpacted')} value={(summary?.completed_donations ?? completed) * 3} note={tr('estimatedImpact')} />
      </section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title={tr('eligibilityCountdown')}><div className="py-4"><div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-600"><span>{tr('recoveryProgress')}</span><span>{Math.round(progress)}%</span></div><div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600" style={{ width: `${progress}%` }} /></div><p className="mt-4 text-sm text-slate-500">{days === 0 ? tr('eligibleNow') : tr('eligibleLater', { days })}</p></div></Panel>
        <Panel title={tr('recentAppointments')}><div className="space-y-3">{appointments.slice(0, 5).map(app => (<div key={app.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"><div><p className="font-black text-slate-900">{new Date(app.appointment_date).toLocaleDateString()}</p><p className="text-sm text-slate-500">SBDCs</p></div><StatusBadge status={app.status} /></div>))}{appointments.length === 0 && <p className="py-10 text-center text-sm text-slate-400">{tr('noAppointments')}</p>}</div></Panel>
      </section>
    </div>
  );
}

function Panel({ title, action, children }) { return <section className="dashboard-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">{title}</h2>{action && <span className="text-sm font-bold text-blue-600">{action}</span>}</div>{children}</section>; }
function StatCard({ icon: Icon, color, title, value, note }) { const colors = { blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', amber:'bg-amber-50 text-amber-600', purple:'bg-purple-50 text-purple-600', red:'bg-red-50 text-red-600' }; return <article className="dashboard-stat-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-5"><div className={`flex h-16 w-16 items-center justify-center rounded-full ${colors[color] || colors.red}`}><Icon className="h-8 w-8" /></div><div><p className="text-sm font-bold text-slate-500">{title}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs font-semibold text-green-600">↑ {note}</p></div></div></article>; }
function StatusBadge({ status }) { const styles = { PENDING:'bg-amber-50 text-amber-700', APPROVED:'bg-blue-50 text-blue-700', CHECKED_IN:'bg-indigo-50 text-indigo-700', IN_PROGRESS:'bg-purple-50 text-purple-700', COMPLETED:'bg-green-50 text-green-700', CANCELLED:'bg-slate-100 text-slate-600' }; return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${styles[status] || styles.PENDING}`}>{String(status || 'PENDING').replace('_', ' ')}</span>; }
function InventoryBadge({ item, tr }) { const q = Number(item.quantity || item.current_quantity || 0); const threshold = Number(item.safety_threshold || item.safety_stock || 0); let label = item.status || tr('adequate'); let cls = 'bg-green-50 text-green-700'; if (item.emergency_mode || item.status === 'EMERGENCY' || item.status === 'CRITICAL' || q < threshold) { label = tr('critical'); cls = 'bg-red-50 text-red-700'; } else if (item.status === 'WARNING' || q < threshold * 1.5) { label = tr('low'); cls = 'bg-amber-50 text-amber-700'; } else { label = tr('adequate'); } return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${cls}`}>{label}</span>; }
function Legend({ color, label, value }) { return <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} /><span className="text-slate-600">{label}</span></div><span className="font-black text-slate-900">{value}</span></div>; }
function formatTime(date) { if (!date) return '--:--'; try { return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '--:--'; } }
