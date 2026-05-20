import React, { useState, useEffect } from 'react';
import { Droplets, AlertTriangle, TrendingUp, Users, Calendar, CheckCircle2, Clock, User, Shield, Siren, Award, HeartHandshake, Download } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { appointmentService } from '../services/appointment.service';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState('ALL');
  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10));
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

  const downloadExcel = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      if (exportStatus === 'DONORS') {
        const blob = await analyticsService.exportDonors();
        downloadExcel(blob, `donor_list_${new Date().toISOString().slice(0, 10)}.xlsx`);
        return;
      }
      const blob = await analyticsService.exportTodayAppointments({ status: exportStatus, report_date: exportDate });
      downloadExcel(blob, `appointments_${exportDate}_${exportStatus.toLowerCase()}.xlsx`);
    } catch (err) {
      console.error('Failed to export excel', err);
      alert('Không thể xuất file Excel. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, appData, summaryData] = await Promise.all([
          bloodBankService.getInventory(),
          isAdmin ? appointmentService.getAllAppointments() : appointmentService.getMyAppointments(),
          analyticsService.getSummary()
        ]);
        setInventory(invData); setAppointments(appData); setSummary(summaryData);
      } catch (err) { console.error('Failed to fetch dashboard data', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isAdmin]);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400 font-medium">Loading dashboard...</div>;

  const totalUnits = inventory.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const pendingApps = appointments.filter(a => a.status === 'PENDING').length;
  const emergencyTypes = inventory.filter(item => item.emergency_mode);
  const criticalTypes = inventory.filter(item => item.quantity < item.safety_threshold);
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const nextAppointment = appointments.filter(a => ['PENDING','APPROVED','CHECKED_IN','IN_PROGRESS'].includes(a.status)).sort((a,b)=>new Date(a.appointment_date)-new Date(b.appointment_date))[0];
  const achievement = summary?.achievement || getBadge(user?.humanitarian_points || 0, completed);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isAdmin && emergencyTypes.length > 0 && <div className="bg-red-600 text-white rounded-3xl p-6 shadow-lg shadow-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Siren className="w-8 h-8" /></div><div><h2 className="text-2xl font-black">Emergency Mode Activated</h2><p className="text-white/80 text-sm">Critical shortage detected: {emergencyTypes.map(i => i.blood_type).join(', ')}. Prioritize donor mobilization.</p></div></div></div>}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isAdmin ? 'Hospital Dashboard' : `Hello, ${user.full_name?.split(' ')[0] || 'Donor'}!`}</h1>
          <p className="text-gray-500 mt-1">{isAdmin ? 'Single hospital blood inventory, appointments and emergency monitoring.' : 'Your humanitarian journey and donation impact.'}</p>
        </div>
        {isAdmin ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <input
              type="date"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              disabled={exportStatus === 'DONORS'}
              className="min-w-[150px] rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-red-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
            <select
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value)}
              className="min-w-[240px] rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-red-400"
            >
              <option value="ALL">Tất cả lịch trong ngày</option>
              <option value="EXPECTED">Người dự kiến đến</option>
              <option value="ARRIVED">Người đã đến</option>
              <option value="ACTIVE">Đang ở bệnh viện</option>
              <option value="DONE">Đã hiến xong</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="CHECKED_IN">Đã check-in</option>
              <option value="IN_PROGRESS">Đang hiến</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="CANCELLED">Đã huỷ</option>
              <option value="DONORS">Danh sách người hiến</option>
            </select>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-100 hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        ) : <div className="flex items-center gap-4 flex-wrap"><BadgeCard achievement={achievement} /><InfoPill label="Reliability" value={`${Math.round(summary?.reliability_score ?? user?.reliability_score ?? 100)}%`} /><BloodPill bloodType={user?.blood_type || 'UNKNOWN'} /></div>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? <>
          <StatCard title="Total Blood Stock" value={`${totalUnits.toFixed(1)}L`} icon={Droplets} color="text-red-600" bg="bg-red-50" />
          <StatCard title="Pending Requests" value={pendingApps} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
          <StatCard title="Active Donors" value={summary?.potential_donors || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Emergency Types" value={emergencyTypes.length} icon={AlertTriangle} color={emergencyTypes.length ? 'text-red-600' : 'text-green-600'} bg={emergencyTypes.length ? 'bg-red-50' : 'bg-green-50'} />
        </> : <>
          <StatCard title="Humanitarian Points" value={summary?.humanitarian_points ?? user?.humanitarian_points ?? 0} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
          <StatCard title="Eligible Again In" value={`${summary?.days_until_eligible ?? 0} days`} icon={Clock} color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="Completed Donations" value={summary?.completed_donations ?? completed} icon={Calendar} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Lives Impacted" value={(summary?.completed_donations ?? completed) * 3} icon={TrendingUp} color="text-red-600" bg="bg-red-50" />
        </>}
      </div>

      {!isAdmin && <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center"><HeartHandshake className="w-6 h-6 text-red-600" /></div><div><h2 className="font-black text-gray-900">Donation Impact Message</h2><p className="text-gray-500 mt-1">{summary?.impact_message || 'Một lần hiến máu có thể giúp cứu sống tới 3 người. Cảm ơn bạn vì nghĩa cử nhân đạo này.'}</p></div></div>}

      {!isAdmin && <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6"><div className="flex items-center justify-between mb-3"><h2 className="font-black text-gray-900 flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" /> Eligibility Countdown</h2><span className="text-xs font-bold text-gray-400 uppercase">84-day donation cycle</span></div><div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-600 rounded-full" style={{ width: `${100 - Math.min(100, ((summary?.days_until_eligible ?? 0) / 84) * 100)}%` }} /></div><p className="text-sm text-gray-500 mt-3">{(summary?.days_until_eligible ?? 0) === 0 ? 'Bạn hiện đã đủ điều kiện thời gian để đăng ký hiến máu tiếp theo.' : `Còn ${summary?.days_until_eligible} ngày để đủ điều kiện thời gian hiến tiếp theo.`}</p></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="font-bold text-gray-900 flex items-center gap-2"><Droplets className="w-5 h-5 text-red-600" /> Blood Supply Status</h2></div>
          <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50/50"><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Blood Type</th><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Stock</th><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Safety Stock</th></tr></thead><tbody className="divide-y divide-gray-100">{inventory.map(item => <tr key={item.blood_type} className="hover:bg-gray-50/50"><td className="px-6 py-4"><span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${item.blood_type === user.blood_type ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'}`}>{item.blood_type}</span></td><td className="px-6 py-4 font-mono font-medium text-gray-700">{Number(item.quantity).toFixed(1)}L</td><td className="px-6 py-4"><SupplyBadge status={item.status} /></td><td className="px-6 py-4 text-sm text-gray-400">{item.safety_threshold}L</td></tr>)}</tbody></table></div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"><div className="p-6 border-b border-gray-100"><h2 className="font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> {isAdmin ? 'Recent Requests' : 'My Appointments'}</h2></div><div className="p-4 space-y-4">{appointments.slice(0,5).map(app => <div key={app.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2"><div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(app.appointment_date).toLocaleDateString()}</span><StatusBadge status={app.status} /></div><div className="flex items-center gap-3"><div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><User className="w-4 h-4 text-gray-400" /></div><div><p className="text-sm font-bold text-gray-900">{isAdmin ? app.donor_name : 'Central Blood Donation Hospital'}</p><p className="text-[10px] text-gray-500 uppercase font-medium">{isAdmin ? app.blood_type : 'Single Hospital'}</p></div></div></div>)}{appointments.length === 0 && <div className="text-center py-8 text-gray-400 text-sm italic">No appointments found.</div>}</div></div>
      </div>
    </div>
  );
}

function getBadge(points, total) { if (points >= 1200 || total >= 12) return { level:'Platinum', badge:'Life Guardian' }; if (points >= 600 || total >= 6) return { level:'Gold', badge:'Life Saver' }; if (points >= 250 || total >= 3) return { level:'Silver', badge:'Kind Heart' }; return { level:'Bronze', badge:'First Step Hero' }; }
function BadgeCard({ achievement }) { return <div className="px-4 py-2 rounded-2xl flex items-center gap-2 border border-gray-100 bg-amber-50"><Shield className="w-4 h-4 text-amber-600" /><div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Achievement</span><span className="text-sm font-bold text-amber-700">{achievement.level} · {achievement.badge}</span></div></div>; }
function InfoPill({ label, value }) { return <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl flex flex-col items-center"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span><span className="text-sm font-bold text-blue-600">{value}</span></div>; }
function BloodPill({ bloodType }) { return <div className="flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-red-200"><div className="flex flex-col"><span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Blood Type</span><span className="text-2xl font-black">{bloodType}</span></div><Droplets className="w-8 h-8 opacity-80" /></div>; }
function StatCard({ title, value, icon: Icon, color, bg }) { return <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4"><div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}><Icon className={`w-6 h-6 ${color}`} /></div><div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p><p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p></div></div>; }
function SupplyBadge({ status }) { const map = { EMERGENCY:'bg-red-600 text-white', CRITICAL:'bg-red-100 text-red-700', WARNING:'bg-amber-100 text-amber-700', SAFE:'bg-green-100 text-green-700' }; return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${map[status] || map.SAFE}`}>{status === 'EMERGENCY' && <Siren className="w-3 h-3" />}{status}</span>; }
function StatusBadge({ status }) { const styles = { PENDING:'bg-amber-100 text-amber-700', APPROVED:'bg-blue-100 text-blue-700', CHECKED_IN:'bg-indigo-100 text-indigo-700', IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-green-100 text-green-700', CANCELLED:'bg-gray-100 text-gray-700' }; return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${styles[status] || styles.PENDING}`}>{status?.replace('_',' ')}</span>; }
