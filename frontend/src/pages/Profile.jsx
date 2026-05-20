import React, { useState } from 'react';
import { User, Phone, Droplets, Save, CheckCircle2, HeartHandshake } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Profile() {
  const user = authService.getCurrentUser();
  const [formData, setFormData] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', blood_type: user?.blood_type || 'UNKNOWN' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage({ type: '', text: '' });
    try { await authService.updateProfile(formData); setMessage({ type: 'success', text: 'Profile updated successfully!' }); }
    catch { setMessage({ type: 'error', text: 'Failed to update profile' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header><h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h1><p className="text-gray-500 mt-1">Manage only the information needed for blood donation.</p></header>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200"><User className="text-white w-10 h-10" /></div>
          <div><h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2><p className="text-gray-500 flex items-center gap-1.5 text-sm mt-1"><Phone className="w-4 h-4" />{user?.phone}</p></div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm font-medium flex gap-2"><HeartHandshake className="w-5 h-5 shrink-0" />Hệ thống đã bỏ vị trí/map để không tạo rào cản cho người hiến máu.</div>
          {message.text && <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}{message.text}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field icon={User} label="Full Name" value={formData.full_name} onChange={v => setFormData({...formData, full_name: v})} required />
            <Field icon={Phone} label="Phone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} type="tel" required />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Blood Type</label>
              <div className="relative"><Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><select value={formData.blood_type} onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none">{['UNKNOWN','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(type => <option key={type} value={type}>{type === 'UNKNOWN' ? 'Chưa xác định' : type}</option>)}</select></div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"><Save className="w-5 h-5" />{loading ? 'Saving Changes...' : 'Save Profile'}</button>
        </form>
      </div>
    </div>
  );
}
function Field({ icon: Icon, label, value, onChange, type='text', required=false }) { return <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">{label}</label><div className="relative"><Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" required={required} /></div></div>; }
