import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Droplets,
  Phone,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Mail,
  Lock,
  HeartPulse,
  CalendarCheck,
  Users,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Login() {
  const [mode, setMode] = useState('DONOR');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const stats = useMemo(() => [
    { label: 'Active donors', value: '120+', icon: Users },
    { label: 'Successful donations', value: '420+', icon: Droplets },
    { label: 'Lives supported', value: '1,200+', icon: HeartPulse },
  ], []);

  const processSteps = [
    { title: 'Đăng nhập nhanh', desc: 'Donor chỉ cần số điện thoại để bắt đầu.', icon: Phone },
    { title: 'Khai báo sức khỏe', desc: 'Trả lời sàng lọc cơ bản trước khi đặt lịch.', icon: Activity },
    { title: 'Đặt lịch hiến', desc: 'Chọn thời gian phù hợp và theo dõi trạng thái.', icon: CalendarCheck },
    { title: 'Lan tỏa hy vọng', desc: 'Nhận điểm nhân đạo và thông điệp cảm ơn.', icon: HeartHandshake },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'DONOR') {
        await authService.login({ login_type: 'DONOR', phone });
      } else {
        await authService.login({ login_type: 'HOSPITAL_ADMIN', identifier, password });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-200">
            <Droplets className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">SBDCs</h1>
            <p className="text-sm leading-tight text-slate-500">Single Hospital Blood Donation System</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <a href="#process" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-red-600">Quy trình</a>
          <a href="#impact" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-red-600">Ý nghĩa</a>
          <button onClick={() => setMode('HOSPITAL_ADMIN')} className="rounded-full border border-red-100 bg-white px-5 py-2.5 text-sm font-black text-red-600 shadow-sm hover:bg-red-50">
            Hospital Login
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pt-10">
        <section className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Giảm thủ tục, tăng cơ hội cứu người
          </div>

          <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            Một giọt máu cho đi,
            <span className="block text-red-600">một cuộc đời ở lại.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            SBDCs giúp người hiến máu đăng nhập nhanh, đặt lịch dễ dàng và theo dõi hành trình nhân đạo của mình. Mỗi lần hiến máu là một cơ hội mang lại hy vọng cho người cần được cứu chữa.
          </p>

          <div id="impact" className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black">{item.value}</p>
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-red-100 bg-red-600 p-6 text-white shadow-xl shadow-red-100">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/15 p-3">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black">Emergency Blood Support</h3>
                <p className="mt-2 text-sm leading-6 text-red-50">
                  Khi kho máu xuống thấp, hệ thống sẽ kích hoạt Emergency Mode để ưu tiên huy động những donor phù hợp nhất theo nhóm máu, điều kiện sức khỏe và độ tin cậy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:pl-4">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl shadow-red-100/60 md:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
                <Droplets className="h-9 w-9 text-white" />
              </div>
              <h3 className="text-3xl font-black tracking-tight">Bắt đầu hành trình hiến máu</h3>
              <p className="mt-2 text-slate-500">Donor đăng nhập nhanh. Hospital dùng tài khoản bảo mật.</p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setMode('DONOR'); setError(''); }}
                className={`rounded-xl py-3 text-sm font-black transition ${mode === 'DONOR' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => { setMode('HOSPITAL_ADMIN'); setError(''); }}
                className={`rounded-xl py-3 text-sm font-black transition ${mode === 'HOSPITAL_ADMIN' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Hospital
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {mode === 'DONOR' ? (
                <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  <HeartHandshake className="h-5 w-5 shrink-0" />
                  Donor chỉ cần số điện thoại để giảm rào cản và khuyến khích hành động hiến máu.
                </div>
              ) : (
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-red-600" />
                  Hospital quản lý dữ liệu nhạy cảm nên cần email/số điện thoại và mật khẩu đã mã hóa.
                </div>
              )}

              {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}

              {mode === 'DONOR' ? (
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">Số điện thoại Donor</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      placeholder="0900000002"
                      required={mode === 'DONOR'}
                    />
                  </div>
                  <p className="ml-1 text-xs text-slate-400">Demo Donor: 0900000002 · Số mới sẽ tự tạo tài khoản Donor.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">Email hoặc số điện thoại Hospital</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        placeholder="hospital@sbdcs.com hoặc 0900000001"
                        required={mode === 'HOSPITAL_ADMIN'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        placeholder="Admin@123"
                        required={mode === 'HOSPITAL_ADMIN'}
                      />
                    </div>
                    <p className="ml-1 text-xs text-slate-400">Demo Hospital: hospital@sbdcs.com / Admin@123</p>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-black text-white shadow-xl shadow-red-200 transition hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Đang đăng nhập...' : mode === 'DONOR' ? 'Become a Donor' : 'Đăng nhập Hospital'}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
            </form>

            <div className="pt-6 text-center">
              <p className="text-sm text-slate-500">Muốn nhập đầy đủ thông tin Donor? <Link to="/register" className="font-black text-red-600 hover:underline">Đăng ký hồ sơ</Link></p>
            </div>
          </div>
        </section>
      </main>

      <section id="process" className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h3 className="text-3xl font-black tracking-tight">Quy trình hiến máu đơn giản</h3>
              <p className="mt-2 text-slate-500">Từ đăng nhập đến hoàn tất, hệ thống luôn hướng người hiến đi qua từng bước rõ ràng.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Một lần hiến máu có thể cứu tới 3 người
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="relative rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                </div>
                <h4 className="font-black text-slate-950">{step.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
