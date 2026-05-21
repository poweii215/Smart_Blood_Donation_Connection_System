import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Droplets, HeartHandshake, TrendingUp, Users, Activity, Clock, Award } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { appointmentService } from '../services/appointment.service';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

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

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Loading dashboard...</div>;
  }

  const totalUnits = inventory.reduce((acc, item) => acc + Number(item.quantity || item.current_quantity || 0), 0);
  const completedToday = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const pendingToday = todayAppointments.filter((a) => a.status === 'PENDING').length;
  const activeDonors = summary?.potential_donors || summary?.active_donors || 0;
  const emergencyTypes = inventory.filter((item) => item.emergency_mode || item.status === 'EMERGENCY' || item.status === 'CRITICAL' || Number(item.quantity || 0) < Number(item.safety_threshold || item.safety_stock || 0));
  const topEmergency = emergencyTypes[0];

  if (!isAdmin) {
    return <DonorDashboard user={user} summary={summary} appointments={appointments} inventory={inventory} />;
  }

  return (
    <div className="space-y-6">
      {topEmergency && (
        <section className="rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-100">
                <AlertTriangle className="h-9 w-9" />
              </div>
              <div>
                <p className="text-xl font-black uppercase tracking-wide text-red-600">Emergency Alert</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Blood type {topEmergency.blood_type} is critically low!</h2>
                <p className="text-slate-600">Please prioritize {topEmergency.blood_type} donors and check Recommendation tab.</p>
              </div>
            </div>
            <a href="/recommendation" className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700">View Details</a>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} color="blue" title="Today Appointments" value={todayAppointments.length || appointments.length} note={`${pendingToday} pending today`} />
        <StatCard icon={Droplets} color="green" title="Total Donations" value={summary?.completed_donations || completedToday || appointments.filter(a => a.status === 'COMPLETED').length} note="completed records" />
        <StatCard icon={Users} color="amber" title="Total Donors" value={summary?.total_donors || activeDonors || 0} note="registered donors" />
        <StatCard icon={Activity} color="purple" title="Active Donors" value={activeDonors || 0} note="available for recommendation" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr_.85fr]">
        <Panel title="Today’s Appointments" action="View all">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-4">Time</th>
                  <th className="px-4 py-4">Donor</th>
                  <th className="px-4 py-4">Blood Type</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(todayAppointments.length ? todayAppointments : appointments).slice(0, 5).map((app) => (
                  <tr key={app.id} className="text-sm">
                    <td className="px-4 py-4 font-semibold text-slate-700">{formatTime(app.appointment_date)}</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{app.donor_name || app.user_name || 'Donor'}</td>
                    <td className="px-4 py-4"><span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-black text-red-600">{app.blood_type || 'UNKNOWN'}</span></td>
                    <td className="px-4 py-4"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
                {appointments.length === 0 && <tr><td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-400">No appointments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Blood Inventory Status" action="View all">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-4">Blood Type</th>
                  <th className="px-4 py-4">In Stock</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.slice(0, 8).map((item) => (
                  <tr key={item.blood_type} className="text-sm">
                    <td className="px-4 py-3 font-black text-slate-950">{item.blood_type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{Number(item.quantity || item.current_quantity || 0).toFixed(1)}</td>
                    <td className="px-4 py-3"><InventoryBadge item={item} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Inventory Overview">
          <div className="flex flex-col items-center justify-center py-3">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-[conic-gradient(#22c55e_0_62%,#f59e0b_62%_78%,#ef4444_78%_100%)]">
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-3xl font-black text-slate-950">{Math.round(totalUnits)}</span>
                <span className="text-sm text-slate-500">Units</span>
              </div>
            </div>
            <div className="mt-6 w-full space-y-3 text-sm">
              <Legend color="bg-green-500" label="Adequate" value={inventory.filter(i => !['CRITICAL','EMERGENCY','WARNING'].includes(i.status)).length} />
              <Legend color="bg-amber-500" label="Low" value={inventory.filter(i => i.status === 'WARNING').length} />
              <Legend color="bg-red-500" label="Critical" value={emergencyTypes.length} />
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function DonorDashboard({ user, summary, appointments }) {
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const days = summary?.days_until_eligible ?? 0;
  const points = summary?.humanitarian_points ?? user?.humanitarian_points ?? 0;
  const progress = 100 - Math.min(100, (days / 84) * 100);
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-100"><HeartHandshake className="h-8 w-8" /></div>
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-red-600">Donation Impact Message</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Hello, {user?.full_name || 'Donor'}!</h1>
            <p className="mt-1 text-slate-600">{summary?.impact_message || 'Một lần hiến máu có thể giúp cứu sống tới 3 người. Cảm ơn bạn vì nghĩa cử nhân đạo này.'}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Award} color="amber" title="Humanitarian Points" value={points} note="donor contribution" />
        <StatCard icon={Clock} color="purple" title="Eligible Again In" value={`${days} days`} note="84-day cycle" />
        <StatCard icon={CheckCircle2} color="green" title="Completed Donations" value={summary?.completed_donations ?? completed} note="successful donations" />
        <StatCard icon={TrendingUp} color="red" title="Lives Impacted" value={(summary?.completed_donations ?? completed) * 3} note="estimated impact" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Eligibility Countdown">
          <div className="py-4">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-600"><span>Recovery progress</span><span>{Math.round(progress)}%</span></div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600" style={{ width: `${progress}%` }} /></div>
            <p className="mt-4 text-sm text-slate-500">{days === 0 ? 'Bạn hiện đã đủ điều kiện thời gian để đăng ký hiến máu tiếp theo.' : `Còn ${days} ngày để đủ điều kiện thời gian hiến tiếp theo.`}</p>
          </div>
        </Panel>
        <Panel title="Recent Appointments">
          <div className="space-y-3">
            {appointments.slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="font-black text-slate-900">{new Date(app.appointment_date).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500">Single Hospital Blood Donation System</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
            {appointments.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No appointments found.</p>}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {action && <span className="text-sm font-bold text-blue-600">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function StatCard({ icon: Icon, color, title, value, note }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${colors[color] || colors.red}`}><Icon className="h-8 w-8" /></div>
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-semibold text-green-600">↑ {note}</p>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-blue-50 text-blue-700',
    CHECKED_IN: 'bg-indigo-50 text-indigo-700',
    IN_PROGRESS: 'bg-purple-50 text-purple-700',
    COMPLETED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
  };
  return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${styles[status] || styles.PENDING}`}>{String(status || 'PENDING').replace('_', ' ')}</span>;
}

function InventoryBadge({ item }) {
  const q = Number(item.quantity || item.current_quantity || 0);
  const threshold = Number(item.safety_threshold || item.safety_stock || 0);
  let label = item.status || 'Adequate';
  let cls = 'bg-green-50 text-green-700';
  if (item.emergency_mode || item.status === 'EMERGENCY' || item.status === 'CRITICAL' || q < threshold) { label = 'Critical'; cls = 'bg-red-50 text-red-700'; }
  else if (item.status === 'WARNING' || q < threshold * 1.5) { label = 'Low'; cls = 'bg-amber-50 text-amber-700'; }
  else { label = 'Adequate'; }
  return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${cls}`}>{label}</span>;
}

function Legend({ color, label, value }) {
  return <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} /><span className="text-slate-600">{label}</span></div><span className="font-black text-slate-900">{value}</span></div>;
}

function formatTime(date) {
  if (!date) return '--:--';
  try { return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--:--'; }
}
