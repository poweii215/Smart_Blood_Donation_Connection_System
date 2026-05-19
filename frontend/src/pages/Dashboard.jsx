import React, { useState, useEffect } from 'react';
import { Droplets, AlertTriangle, TrendingUp, Users, Calendar, CheckCircle2, Clock, User, Shield } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { appointmentService } from '../services/appointment.service';
import { authService } from '../services/auth.service';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = ['HOSPITAL_ADMIN'].includes(user?.role);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invData = await bloodBankService.getInventory();
        setInventory(invData);
        
        if (isAdmin) {
          const appData = await appointmentService.getAllAppointments();
          setAppointments(appData);
        } else {
          const appData = await appointmentService.getMyAppointments();
          setAppointments(appData);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400 font-medium">Loading dashboard...</div>;

  const totalUnits = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const pendingApps = appointments.filter(a => a.status === 'PENDING').length;
  const criticalTypes = inventory.filter(item => item.quantity < item.safety_threshold);
  
  const getBadge = (points) => {
    if (points >= 1000) return { name: 'Platinum', color: 'text-blue-600', bg: 'bg-blue-50', icon: Shield };
    if (points >= 500) return { name: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Shield };
    if (points >= 200) return { name: 'Silver', color: 'text-gray-600', bg: 'bg-gray-50', icon: Shield };
    return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-50', icon: Shield };
  };

  const badge = getBadge(user?.humanitarian_points || 0);
  
  // Donor specific calculations
  const myCompletedDonations = appointments.filter(a => a.status === 'COMPLETED').length;
  const nextAppointment = appointments
    .filter(a => ['PENDING', 'APPROVED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status))
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isAdmin ? 'Hospital Dashboard' : `Hello, ${user.full_name.split(' ')[0]}!`}
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdmin 
              ? "Manage hospital blood inventory and donation appointments." 
              : "Your contribution saves lives. Track your impact here."}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border border-gray-100 ${badge.bg}`}>
              <badge.icon className={`w-4 h-4 ${badge.color}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rank</span>
                <span className={`text-sm font-bold ${badge.color}`}>{badge.name}</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reliability</span>
              <span className="text-sm font-bold text-blue-600">{user.reliability_score || 100}%</span>
            </div>
            <div className="flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-red-200">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Your Blood Type</span>
                <span className="text-2xl font-black">{user.blood_type || 'N/A'}</span>
              </div>
              <div className="w-px h-8 bg-white/20 mx-2" />
              <Droplets className="w-8 h-8 opacity-80" />
            </div>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          <>
            <StatCard 
              title="Total Blood Units" 
              value={`${totalUnits.toFixed(1)}L`} 
              icon={Droplets} 
              color="text-red-600" 
              bg="bg-red-50" 
            />
            <StatCard 
              title="Pending Requests" 
              value={pendingApps} 
              icon={Clock} 
              color="text-amber-600" 
              bg="bg-amber-50" 
            />
            <StatCard 
              title="Active Donors" 
              value="1,284" 
              icon={Users} 
              color="text-blue-600" 
              bg="bg-blue-50" 
            />
            <StatCard 
              title="Critical Shortages" 
              value={criticalTypes.length} 
              icon={AlertTriangle} 
              color={criticalTypes.length > 0 ? "text-red-600" : "text-green-600"} 
              bg={criticalTypes.length > 0 ? "bg-red-50" : "bg-green-50"} 
            />
          </>
        ) : (
          <>
            <StatCard 
              title="Humanitarian Points" 
              value={user.humanitarian_points || 0} 
              icon={CheckCircle2} 
              color="text-green-600" 
              bg="bg-green-50" 
            />
            <StatCard 
              title="Next Appointment" 
              value={nextAppointment ? new Date(nextAppointment.appointment_date).toLocaleDateString() : 'None'} 
              icon={Calendar} 
              color="text-blue-600" 
              bg="bg-blue-50" 
            />
            <StatCard 
              title="Last Donation" 
              value={user.last_donation_date ? new Date(user.last_donation_date).toLocaleDateString() : 'Never'} 
              icon={Clock} 
              color="text-purple-600" 
              bg="bg-purple-50" 
            />
            <StatCard 
              title="Lives Impacted" 
              value={myCompletedDonations * 3} 
              icon={TrendingUp} 
              color="text-red-600" 
              bg="bg-red-50" 
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Blood Inventory Table - Only show detailed for Admin, or summary for Donor */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-600" />
              {isAdmin ? 'Full Inventory Status' : 'Community Blood Supply'}
            </h2>
            {!isAdmin && (
              <span className="text-xs font-medium text-gray-500">Helping maintain a stable supply</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Blood Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {isAdmin ? 'Current Stock' : 'Availability'}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Threshold</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(isAdmin ? inventory : inventory.filter(i => i.quantity < i.safety_threshold || i.blood_type === user.blood_type)).map((item) => (
                  <tr key={item.blood_type} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${item.blood_type === user.blood_type ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {item.blood_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-700">
                      {isAdmin ? `${item.quantity.toFixed(1)}L` : (item.quantity < item.safety_threshold ? 'Low Supply' : 'Stable')}
                    </td>
                    <td className="px-6 py-4">
                      {item.quantity < item.safety_threshold ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> {isAdmin ? 'CRITICAL' : 'Urgent Need'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" /> STABLE
                        </span>
                      )}
                    </td>
                    {isAdmin && <td className="px-6 py-4 text-sm text-gray-400">{item.safety_threshold}L</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {isAdmin ? 'Recent Requests' : 'My Appointments'}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {appointments.slice(0, 5).map((app) => (
              <div key={app.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(app.appointment_date).toLocaleDateString()}
                  </span>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{isAdmin ? app.donor_name : app.location}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">{isAdmin ? app.location : 'Donation Center'}</p>
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic">No appointments found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
      <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${styles[status]}`}>
      {status}
    </span>
  );
}
