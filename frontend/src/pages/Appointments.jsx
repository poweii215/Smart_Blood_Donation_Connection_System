import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Check, X, AlertCircle, ChevronRight, ChevronLeft, Shield, Award, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services/appointment.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [newApp, setNewApp] = useState({
    appointment_date: '',
    notes: '',
    screening: { weight: '', lastDonation: '', healthy: true, medication: false, alcohol: false, sleep: true, tattoo: false }
  });
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';
  const tr = useI18n(user);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      setAppointments(isAdmin ? await appointmentService.getAllAppointments() : await appointmentService.getMyAppointments());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newApp.appointment_date) return alert(tr('selectDateAlert'));
    try {
      const screeningResult = `Weight: ${newApp.screening.weight}kg, Healthy: ${newApp.screening.healthy}, Sleep: ${newApp.screening.sleep}, Meds: ${newApp.screening.medication}, Alcohol: ${newApp.screening.alcohol}, Tattoo: ${newApp.screening.tattoo}`;
      await appointmentService.create({ appointment_date: newApp.appointment_date, notes: newApp.notes || '', pre_screening_result: screeningResult });
      setShowModal(false); setStep(1); fetchAppointments();
    } catch (err) { alert(err.response?.data?.detail || tr('createAppointmentFailed')); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { await appointmentService.updateStatus(id, status); fetchAppointments(); }
    catch { alert(tr('updateStatusFailed')); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tr('appointments')}</h1>
          <p className="text-gray-500 mt-1">{tr('scheduleDesc')}</p>
        </div>
        {!isAdmin && <button onClick={() => setShowModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center gap-2"><Plus className="w-5 h-5" /> {tr('bookAppointment')}</button>}
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50/50"><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{tr('dateTime')}</th>{isAdmin && <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{tr('donor')}</th>}<th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{tr('hospitalColumn')}</th><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{tr('status')}</th><th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">{tr('actions')}</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-700 font-medium"><CalendarIcon className="w-4 h-4 text-gray-400" />{new Date(app.appointment_date).toLocaleString()}</div></td>
                  {isAdmin && <td className="px-6 py-4"><div className="flex flex-col"><span className="font-bold text-gray-900">{app.donor_name}</span><span className="text-[10px] text-red-600 font-bold uppercase">{app.blood_type} · Reliability {Math.round(app.reliability_score || 100)}%</span></div></td>}
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-500"><HeartHandshake className="w-4 h-4" />Central Blood Donation Hospital</div></td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin ? <AdminActions app={app} onUpdate={handleStatusUpdate} tr={tr} /> : app.status === 'COMPLETED' ? <Link to={`/congratulations/${app.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-bold transition-colors"><Award className="w-4 h-4" /> {tr('congratulations')}</Link> : <span className="text-xs text-gray-400 italic">{app.status === 'PENDING' ? tr('awaitingApproval') : tr('noActions')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && !loading && <div className="py-20 flex flex-col items-center justify-center text-gray-400"><AlertCircle className="w-12 h-12 mb-4 opacity-20" /><p>{tr('noAppointments')}</p></div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-900">{tr('bookDonation')}</h2><p className="text-xs text-gray-500 font-medium">{tr('stepOf', { step })}</p></div><button onClick={() => { setShowModal(false); setStep(1); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="p-8">
              {step === 1 ? <ScreeningStep newApp={newApp} setNewApp={setNewApp} setStep={setStep} tr={tr} /> : (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-medium flex gap-3"><HeartHandshake className="w-5 h-5 shrink-0" />{tr('singleHospitalBookingNote')}</div>
                  <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">{tr('dateTime')}</label><div className="relative"><Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="datetime-local" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" required value={newApp.appointment_date} onChange={e => setNewApp({...newApp, appointment_date: e.target.value})} /></div></div>
                  <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">{tr('notesOptional')}</label><textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 h-24 resize-none" placeholder={tr('additionalInfo')} value={newApp.notes} onChange={e => setNewApp({...newApp, notes: e.target.value})} /></div>
                  <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"><ChevronLeft className="w-5 h-5" />{tr('back')}</button><button type="submit" className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all">{tr('confirmBooking')}</button></div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminActions({ app, onUpdate, tr }) {
  return <div className="flex items-center justify-end gap-2">
    {app.status === 'PENDING' && <><button onClick={() => onUpdate(app.id, 'APPROVED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title={tr('approve')}><Check className="w-4 h-4" /></button><button onClick={() => onUpdate(app.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={tr('cancel')}><X className="w-4 h-4" /></button></>}
    {app.status === 'APPROVED' && <button onClick={() => onUpdate(app.id, 'CHECKED_IN')} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold">{tr('checkIn')}</button>}
    {app.status === 'CHECKED_IN' && <button onClick={() => onUpdate(app.id, 'IN_PROGRESS')} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-xs font-bold">{tr('start')}</button>}
    {app.status === 'IN_PROGRESS' && <button onClick={() => onUpdate(app.id, 'COMPLETED')} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-xs font-bold">{tr('complete')}</button>}
  </div>;
}

function ScreeningStep({ newApp, setNewApp, setStep, tr }) {
  return <div className="space-y-6">
    <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3"><Shield className="w-5 h-5 text-blue-600 mt-0.5" /><div><p className="text-sm font-bold text-blue-900">{tr('healthPrescreening')}</p><p className="text-xs text-blue-700 mt-0.5">{tr('healthPrescreeningDesc')}</p></div></div>
    <div className="grid grid-cols-2 gap-4"><Input label={tr('weightKg')} type="number" value={newApp.screening.weight} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, weight: v}})} /><Input label={tr('lastDonation')} type="date" value={newApp.screening.lastDonation} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, lastDonation: v}})} /></div>
    <CheckLine label={tr('feelingHealthy')} checked={newApp.screening.healthy} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, healthy: v}})} />
    <CheckLine label={tr('sleptEnough')} checked={newApp.screening.sleep} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, sleep: v}})} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><CheckLine label={tr('takingAntibiotics')} checked={newApp.screening.medication} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, medication: v}})} /><CheckLine label={tr('alcoholLast24h')} checked={newApp.screening.alcohol} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, alcohol: v}})} /><CheckLine label={tr('tattooLast6m')} checked={newApp.screening.tattoo} onChange={v => setNewApp({...newApp, screening: {...newApp.screening, tattoo: v}})} /></div>
    <button onClick={() => setStep(2)} disabled={!newApp.screening.weight || !newApp.screening.healthy} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">{tr('nextStep')} <ChevronRight className="w-5 h-5" /></button>
  </div>;
}
function Input({ label, value, onChange, type='text' }) { return <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">{label}</label><input type={type} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" value={value} onChange={e => onChange(e.target.value)} /></div>; }
function CheckLine({ label, checked, onChange }) { return <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"><input type="checkbox" className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500" checked={checked} onChange={e => onChange(e.target.checked)} /><span className="text-sm font-medium text-gray-700">{label}</span></label>; }
function StatusBadge({ status }) { const styles = { PENDING:'bg-amber-100 text-amber-700', APPROVED:'bg-blue-100 text-blue-700', CHECKED_IN:'bg-indigo-100 text-indigo-700', IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-green-100 text-green-700', CANCELLED:'bg-gray-100 text-gray-700' }; return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${styles[status]}`}>{status.replace('_', ' ')}</span>; }
