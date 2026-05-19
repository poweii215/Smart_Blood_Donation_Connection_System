import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Phone, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE');
  const [demoOtp, setDemoOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDemoOtp('');
    try {
      const result = await authService.requestOtp(phone);
      setStep('OTP');
      setMessage(result.message || 'Mã OTP đã được gửi đến số điện thoại.');
      if (result.otp_code) setDemoOtp(result.otp_code);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp({ phone, otp });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const resetPhone = () => {
    setStep('PHONE');
    setOtp('');
    setDemoOtp('');
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="p-8 pb-0 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 mb-6">
              <Droplets className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Đăng nhập OTP</h1>
            <p className="text-gray-500 mt-2 text-center">
              Nhập số điện thoại, sau đó xác thực bằng mã OTP gửi về số máy.
            </p>
          </div>

          {step === 'PHONE' ? (
            <form onSubmit={requestOtp} className="p-8 space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    placeholder="0900000002"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400 ml-1">Tài khoản mẫu: Hospital 0900000001 · Donor 0900000002</p>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="p-8 space-y-5">
              {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100 flex gap-2"><ShieldCheck className="w-5 h-5 shrink-0" />{message}</div>}
              {demoOtp && <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl text-sm font-medium border border-yellow-100">Demo local: mã OTP là <span className="font-black tracking-widest">{demoOtp}</span></div>}
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Mã OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="000000"
                  required
                />
                <p className="text-[11px] text-gray-400 ml-1">OTP có hiệu lực trong 5 phút cho số {phone}.</p>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                {loading ? 'Đang xác thực...' : 'Xác thực và đăng nhập'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button type="button" onClick={requestOtp} disabled={loading} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <RotateCcw className="w-4 h-4" /> Gửi lại OTP
              </button>
              <button type="button" onClick={resetPhone} className="w-full text-sm text-gray-500 hover:text-red-600 font-bold">Đổi số điện thoại</button>
            </form>
          )}

          <div className="p-8 pt-0 text-center">
            <p className="text-gray-500 text-sm">Chưa có tài khoản? <Link to="/register" className="text-red-600 font-bold hover:underline underline-offset-4">Đăng ký</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
