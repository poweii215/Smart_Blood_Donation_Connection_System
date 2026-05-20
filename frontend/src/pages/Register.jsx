import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Lock, Phone, User, ArrowRight, Shield, Mail } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Register() {
  const [formData, setFormData] = useState({ phone: '', email: '', full_name: '', role: 'DONOR', blood_type: 'UNKNOWN', admin_key: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === 'HOSPITAL_ADMIN' && formData.admin_key !== 'SBDCS_ADMIN_2026') {
      setError('Hospital Key không hợp lệ. Vui lòng liên hệ đơn vị tiếp nhận.');
      return;
    }
    setLoading(true); setError('');
    try {
      const { admin_key, ...submitData } = formData;
      await authService.register({ ...submitData, email: submitData.email || null });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="p-8 pb-0 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 mb-6"><Droplets className="text-white w-10 h-10" /></div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Đăng ký SBDCs</h1>
            <p className="text-gray-500 mt-2 text-center">Tạo hồ sơ bằng số điện thoại. Khi đăng nhập chỉ cần nhập số điện thoại.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {error && <div className="col-span-full bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
            <Field icon={User} label="Họ tên" value={formData.full_name} onChange={v => setFormData({...formData, full_name: v})} placeholder="Nguyen Van A" required />
            <Field icon={Phone} label="Số điện thoại" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="0900000000" required />
            <Field icon={Mail} label="Email tùy chọn" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="name@example.com" />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nhóm máu</label>
              <select value={formData.blood_type} onChange={(e) => setFormData({...formData, blood_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none">
                {['UNKNOWN','A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <option key={type} value={type}>{type === 'UNKNOWN' ? 'Chưa xác định' : type}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-full">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Loại tài khoản</label>
              <div className="grid grid-cols-2 gap-3">
                <RoleButton active={formData.role === 'DONOR'} onClick={() => setFormData({...formData, role: 'DONOR'})}>Donor</RoleButton>
                <RoleButton active={formData.role === 'HOSPITAL_ADMIN'} onClick={() => setFormData({...formData, role: 'HOSPITAL_ADMIN'})}><Shield className="w-4 h-4" /> Hospital</RoleButton>
              </div>
            </div>
            {formData.role === 'HOSPITAL_ADMIN' && <Field icon={Lock} label="Hospital Secret Key" type="password" value={formData.admin_key} onChange={v => setFormData({...formData, admin_key: v})} placeholder="SBDCS_ADMIN_2026" required />}
            <button type="submit" disabled={loading} className="col-span-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
          </form>
          <div className="p-8 pt-0 text-center"><p className="text-gray-500 text-sm">Đã có tài khoản? <Link to="/login" className="text-red-600 font-bold hover:underline underline-offset-4">Đăng nhập</Link></p></div>
        </div>
      </div>
    </div>
  );
}
function Field({ icon: Icon, label, value, onChange, placeholder, type='text', required=false }) { return <div className="space-y-2 col-span-full md:col-span-1"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">{label}</label><div className="relative"><Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" placeholder={placeholder} required={required} /></div></div> }
function RoleButton({active,onClick,children}) { return <button type="button" onClick={onClick} className={`py-3 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2 ${active ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>{children}</button> }
