import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Droplets,
  Phone,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Mail,
  Lock,
  Hospital,
  Users,
  CalendarCheck,
  Sparkles,
  Activity,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Login() {
  const [mode, setMode] = useState('DONOR');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [homepageMedia, setHomepageMedia] = useState({
    hospital_image_url: '/images/hospital-showcase.svg',
    donor_activity_image_url: '/images/donor-activity.svg',
    hospital_title: 'Central Blood Hospital',
    hospital_subtitle: 'Luôn sẵn sàng tiếp nhận người hiến máu',
  });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    authService.getHomepageMedia()
      .then((data) => { if (mounted && data) setHomepageMedia((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const heroStats = useMemo(
    () => [
      { label: 'Lượt hiến thành công', value: '420+', icon: Droplets },
      { label: 'Người hiến đang hoạt động', value: '120+', icon: Users },
      { label: 'Lịch hẹn hôm nay', value: '24', icon: CalendarCheck },
    ],
    []
  );

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
    <div className="public-login-page min-h-screen bg-gradient-to-br from-white via-red-50/40 to-slate-100 font-sans text-slate-950">
      <header className="public-login-header mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">SBDCs</h1>
            <p className="text-xs font-semibold text-slate-500">Single Hospital Blood Donation System</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
            Central Blood Hospital
          </span>
          <a href="#login" className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-700">
            Đăng nhập
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-4 lg:grid-cols-[1.18fr_0.82fr] lg:px-8 lg:pb-16">
        <section className="space-y-7">
          <div className="public-hero-card rounded-[2rem] border border-red-100 bg-white/75 p-6 shadow-xl shadow-red-100/40 backdrop-blur lg:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600 ring-1 ring-red-100">
              <HeartHandshake className="h-4 w-4" />
              Mỗi lần hiến máu là một cơ hội cứu người
            </div>
            <div className="grid gap-7 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <h2 className="public-hero-title max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
                  Một giọt máu cho đi,
                  <span className="public-hero-accent block text-red-600">một cuộc đời ở lại.</span>
                </h2>
                <p className="public-hero-copy mt-5 max-w-xl text-lg leading-8 text-slate-600">
                  SBDCs giúp bệnh viện quản lý hiến máu thông minh hơn và giúp người hiến máu đăng ký nhanh hơn, nhẹ nhàng hơn, đúng tinh thần nhân đạo.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href="#login" className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-700">
                    Tôi muốn hiến máu <ArrowRight className="h-5 w-5" />
                  </a>
                  <a href="#process" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                    Xem quy trình <ChevronRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div className="public-hospital-image relative overflow-hidden rounded-[1.8rem] bg-red-50 shadow-lg shadow-red-100">
                <img src={homepageMedia.hospital_image_url || "/images/hospital-showcase.svg"} alt="Hospital blood donation center" className="h-full w-full object-cover" />
                <div className="public-hospital-card absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                      <Hospital className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{homepageMedia.hospital_title || 'Central Blood Hospital'}</p>
                      <p className="text-sm font-medium text-slate-500">{homepageMedia.hospital_subtitle || 'Luôn sẵn sàng tiếp nhận người hiến máu'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="public-stat-card rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-red-100 bg-gradient-to-br from-red-600 to-red-700 p-6 text-white shadow-xl shadow-red-200">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Activity className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black">Emergency Blood Need</h3>
              <p className="mt-3 leading-7 text-red-50">
                Khi kho máu xuống thấp, hệ thống sẽ kích hoạt Emergency Mode để ưu tiên nhóm máu cần thiết và gợi ý người hiến phù hợp nhất.
              </p>
              <div className="mt-5 rounded-2xl bg-white/12 p-4 text-sm font-bold">
                Hôm nay bệnh viện đang ưu tiên: <span className="text-white">O- và A-</span>
              </div>
            </div>

            <div className="public-info-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                    <HeartPulse className="h-4 w-4" />
                    People Donating Today
                  </div>
                  <h3 className="mt-4 text-2xl font-black">Những người đang trao hy vọng hôm nay</h3>
                  <p className="mt-2 text-slate-500">Mỗi người hiến máu là một phần của cộng đồng nhân ái.</p>
                </div>
                <div className="hidden h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 md:flex">
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl bg-slate-50">
                <img src={homepageMedia.donor_activity_image_url || "/images/donor-activity.svg"} alt="People donating blood" className="h-56 w-full object-cover" />
              </div>
            </div>
          </div>

          <div id="process" className="public-info-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60">
            <h3 className="text-2xl font-black">Quy trình hiến máu đơn giản</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {[
                ['1', 'Đăng nhập', 'Nhập số điện thoại để bắt đầu nhanh.'],
                ['2', 'Khai báo', 'Cập nhật sức khỏe và thông tin cơ bản.'],
                ['3', 'Đặt lịch', 'Chọn khung giờ phù hợp để đến hiến.'],
                ['4', 'Hiến máu', 'Hoàn tất và nhận lời cảm ơn từ hệ thống.'],
              ].map(([step, title, desc]) => (
                <div key={step} className="rounded-3xl bg-slate-50 p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-sm font-black text-white">{step}</div>
                  <p className="font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="login" className="lg:sticky lg:top-6 lg:self-start">
          <div className="public-login-card overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-300/50">
            <div className="p-7 pb-0 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
                <Droplets className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Đăng nhập SBDCs</h2>
              <p className="mt-2 text-slate-500">Donor đăng nhập nhanh. Hospital dùng tài khoản bảo mật.</p>
            </div>

            <div className="px-7 pt-6">
              <div className="public-login-tabs grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
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
            </div>

            <form onSubmit={handleLogin} className="space-y-5 p-7">
              {mode === 'DONOR' ? (
                <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  <HeartHandshake className="h-5 w-5 shrink-0" />
                  Donor chỉ cần số điện thoại để giảm thủ tục và khuyến khích hành động hiến máu.
                </div>
              ) : (
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-red-600" />
                  Hospital quản lý dữ liệu nhạy cảm nên cần email/số điện thoại và mật khẩu đã mã hóa.
                </div>
              )}

              {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}

              {mode === 'DONOR' ? (
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">Số điện thoại Donor</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="0900000002"
                      required={mode === 'DONOR'}
                    />
                  </div>
                  <p className="ml-1 text-[11px] text-slate-400">Demo Donor: 0900000002 · Số mới sẽ tự tạo tài khoản Donor.</p>
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
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="Admin@123"
                        required={mode === 'HOSPITAL_ADMIN'}
                      />
                    </div>
                    <p className="ml-1 text-[11px] text-slate-400">Demo Hospital: hospital@sbdcs.com / Admin@123</p>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-black text-white shadow-xl shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
            <div className="px-7 pb-7 text-center">
              <p className="text-sm text-slate-500">Muốn nhập đầy đủ thông tin Donor? <Link to="/register" className="font-black text-red-600 underline-offset-4 hover:underline">Đăng ký hồ sơ</Link></p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
