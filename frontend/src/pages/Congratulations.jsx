import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Calendar, CheckCircle2, Droplets, Gift, Heart, Home, Share2, Sparkles, Star } from 'lucide-react';
import { appointmentService } from '../services/appointment.service';
import { authService } from '../services/auth.service';

export default function Congratulations() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const loadCompletedAppointment = async () => {
      setLoading(true);
      try {
        const apps = await appointmentService.getMyAppointments();
        const completed = apps.filter(app => app.status === 'COMPLETED');
        const selected = appointmentId
          ? completed.find(app => String(app.id) === String(appointmentId))
          : completed[0];
        setAppointment(selected || null);
      } catch (err) {
        console.error('Failed to load completed appointment:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCompletedAppointment();
  }, [appointmentId]);

  const donationDate = useMemo(() => {
    if (!appointment?.appointment_date) return 'Recently';
    return new Date(appointment.appointment_date).toLocaleDateString();
  }, [appointment]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Preparing your celebration...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-lg text-center">
          <AlertIcon />
          <h1 className="text-2xl font-black text-gray-900 mt-4">No completed donation yet</h1>
          <p className="text-gray-500 mt-2">The congratulations screen will appear after your donation appointment is marked as completed.</p>
          <Link to="/appointments" className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">
            View Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-600 via-rose-500 to-pink-500 text-white shadow-2xl shadow-red-200">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white blur-2xl" />
          <div className="absolute bottom-12 right-16 w-32 h-32 rounded-full bg-white blur-3xl" />
          <Sparkles className="absolute top-8 right-10 w-10 h-10" />
          <Star className="absolute bottom-10 left-16 w-8 h-8" />
        </div>

        <div className="relative px-6 py-12 md:px-14 md:py-16 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 shadow-xl">
            <Heart className="w-12 h-12 fill-white" />
          </div>
          <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-white/80">Donation Completed</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tight">Congratulations!</h1>
          <p className="mt-5 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Thank you, {user?.full_name?.split(' ')[0] || 'Donor'}! Your blood donation has been recorded successfully.
            One donation can help save up to 3 lives.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <CongratsStat icon={Droplets} label="Blood Type" value={user?.blood_type || 'Unknown'} />
            <CongratsStat icon={Gift} label="Points Earned" value="+50" />
            <CongratsStat icon={Calendar} label="Donation Date" value={donationDate} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Your impact has been updated</h2>
              <p className="text-gray-500 mt-2 leading-relaxed">
                The system has added humanitarian points, updated your donation history, and refreshed your health dashboard. Please rest, drink enough water, and avoid heavy exercise today.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImpactItem title="Appointment" value={`#${appointment.id}`} />
            <ImpactItem title="Donation Center" value={appointment.hospital_name || 'Donation center'} />
            <ImpactItem title="Status" value="COMPLETED" />
            <ImpactItem title="Estimated lives helped" value="Up to 3" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Award className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mt-5">Keep going!</h2>
            <p className="text-gray-500 text-sm mt-2">Continue donating when you are eligible again to unlock higher badges and rewards.</p>
          </div>
          <div className="mt-8 space-y-3">
            <Link to="/" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors">
              <Home className="w-4 h-4" /> Back to Dashboard
            </Link>
            <Link to="/appointments" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors">
              <Share2 className="w-4 h-4" /> View Donation History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CongratsStat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-3xl p-5 border border-white/20">
      <Icon className="w-7 h-7 mx-auto text-white/90" />
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ImpactItem({ title, value }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</p>
      <p className="mt-1 font-bold text-gray-900">{value}</p>
    </div>
  );
}

function AlertIcon() {
  return (
    <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
      <Calendar className="w-8 h-8 text-gray-400" />
    </div>
  );
}
