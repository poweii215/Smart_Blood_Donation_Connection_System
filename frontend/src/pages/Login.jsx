import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Phone, ArrowRight, HeartHandshake } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.login({ phone });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể đăng nhập bằng số điện thoại này');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="p-8 pb-0 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 mb-6"><Droplets className="text-white w-10 h-10" /></div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Đăng nhập nhanh</h1>
            <p className="text-gray-500 mt-2 text-center">Nhập số điện thoại để vào hệ thống. Không cần mật khẩu, không cần OTP.</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100 flex gap-2">
              <HeartHandshake className="w-5 h-5 shrink-0" />
              Giảm thủ tục rườm rà để chào đón người hiến máu dễ dàng hơn.
            </div>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" placeholder="0900000002" required />
              </div>
              <p className="text-[11px] text-gray-400 ml-1">Demo: Hospital 0900000001 · Donor 0900000002 · Số mới sẽ tự tạo Donor.</p>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          <div className="p-8 pt-0 text-center"><p className="text-gray-500 text-sm">Muốn nhập đầy đủ thông tin? <Link to="/register" className="text-red-600 font-bold hover:underline underline-offset-4">Đăng ký hồ sơ</Link></p></div>
        </div>
      </div>
    </div>
  );
}
