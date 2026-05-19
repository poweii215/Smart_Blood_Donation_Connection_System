import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, Plus, Check, X, AlertCircle, ChevronRight, ChevronLeft, Shield, Activity, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services/appointment.service';
import { hospitalService } from '../services/hospital.service';
import { authService } from '../services/auth.service';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [newApp, setNewApp] = useState({ 
    hospital_id: '', 
    appointment_date: '', 
    notes: '',
    screening: {
      weight: '',
      lastDonation: '',
      healthy: true,
      medication: false,
      alcohol: false,
      sleep: true,
      tattoo: false
    }
  });
  
  const user = authService.getCurrentUser();
  const isAdmin = ['HOSPITAL_ADMIN'].includes(user?.role);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [appData, hospData] = await Promise.all([
        isAdmin ? appointmentService.getAllAppointments() : appointmentService.getMyAppointments(),
        hospitalService.getAll()
      ]);
      setAppointments(appData);
      setHospitals(hospData);
      if (hospData.length > 0) {
        setNewApp(prev => ({ ...prev, hospital_id: hospData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const hospitalId = parseInt(newApp.hospital_id);
    if (!hospitalId || isNaN(hospitalId)) {
      alert('Please select a valid donation center');
      return;
    }
    if (!newApp.appointment_date) {
      alert('Please select an appointment date and time');
      return;
    }
    try {
      const screeningResult = `Weight: ${newApp.screening.weight}kg, Healthy: ${newApp.screening.healthy}, Meds: ${newApp.screening.medication}`;
      const submitData = {
        hospital_id: hospitalId,
        appointment_date: newApp.appointment_date,
        notes: newApp.notes || '',
        pre_screening_result: screeningResult
      };
      await appointmentService.create(submitData);
      setShowModal(false);
      setStep(1);
      fetchAppointments();
    } catch (err) {
      console.error('Appointment creation error:', err.response?.data || err.message);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        alert(`Validation Error: ${detail.map(d => d.msg).join(', ')}`);
      } else {
        alert(detail || 'Failed to create appointment');
      }
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      fetchAppointments();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage donation schedules and requests.</p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Book Appointment
          </button>
        )}
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date & Time</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Donor</th>}
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Center</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      {new Date(app.appointment_date).toLocaleString()}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{app.donor_name}</span>
                        <span className="text-[10px] text-red-600 font-bold uppercase">{app.blood_type}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {app.hospital_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        {app.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(app.id, 'APPROVED')}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(app.id, 'CANCELLED')}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {app.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'CHECKED_IN')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {app.status === 'CHECKED_IN' && (
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'IN_PROGRESS')}
                            className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-xs font-bold transition-colors"
                          >
                            Start Donation
                          </button>
                        )}
                        {app.status === 'IN_PROGRESS' && (
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'COMPLETED')}
                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-xs font-bold transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    ) : (
                      app.status === 'COMPLETED' ? (
                        <Link
                          to={`/congratulations/${app.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-bold transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          Congratulations
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          {app.status === 'PENDING' ? 'Awaiting Approval' : 'No actions'}
                        </span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && !loading && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>No appointments scheduled yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Book Donation</h2>
                <p className="text-xs text-gray-500 font-medium">Step {step} of 2</p>
              </div>
              <button onClick={() => { setShowModal(false); setStep(1); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Health Pre-screening</p>
                      <p className="text-xs text-blue-700 mt-0.5">Please answer these questions honestly to ensure a safe donation.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="e.g. 70"
                        value={newApp.screening.weight}
                        onChange={e => setNewApp({...newApp, screening: {...newApp.screening, weight: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Last Donation</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        value={newApp.screening.lastDonation}
                        onChange={e => setNewApp({...newApp, screening: {...newApp.screening, lastDonation: e.target.value}})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500"
                        checked={newApp.screening.healthy}
                        onChange={e => setNewApp({...newApp, screening: {...newApp.screening, healthy: e.target.checked}})}
                      />
                      <span className="text-sm font-medium text-gray-700">I am currently feeling healthy and well.</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500"
                        checked={newApp.screening.sleep}
                        onChange={e => setNewApp({...newApp, screening: {...newApp.screening, sleep: e.target.checked}})}
                      />
                      <span className="text-sm font-medium text-gray-700">I had at least 6 hours of sleep last night.</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500"
                          checked={newApp.screening.medication}
                          onChange={e => setNewApp({...newApp, screening: {...newApp.screening, medication: e.target.checked}})}
                        />
                        <span className="text-sm font-medium text-gray-700">Taking antibiotics?</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500"
                          checked={newApp.screening.alcohol}
                          onChange={e => setNewApp({...newApp, screening: {...newApp.screening, alcohol: e.target.checked}})}
                        />
                        <span className="text-sm font-medium text-gray-700">Alcohol in last 24h?</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg text-red-600 focus:ring-red-500"
                          checked={newApp.screening.tattoo}
                          onChange={e => setNewApp({...newApp, screening: {...newApp.screening, tattoo: e.target.checked}})}
                        />
                        <span className="text-sm font-medium text-gray-700">Tattoo in last 6 months?</span>
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep(2)}
                    disabled={!newApp.screening.weight || !newApp.screening.healthy}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Donation Center</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
                        value={newApp.hospital_id}
                        onChange={e => setNewApp({...newApp, hospital_id: e.target.value})}
                      >
                        {hospitals.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Date & Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="datetime-local" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        required
                        value={newApp.appointment_date}
                        onChange={e => setNewApp({...newApp, appointment_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Notes (Optional)</label>
                    <textarea 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 h-24 resize-none"
                      placeholder="Any additional info?"
                      value={newApp.notes}
                      onChange={e => setNewApp({...newApp, notes: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-indigo-100 text-indigo-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
