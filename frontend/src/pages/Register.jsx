import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Phone, User, ArrowRight, Mail, Calendar, Briefcase, Scale, Ruler, IdCard, MapPin, HeartHandshake } from 'lucide-react';
import { authService } from '../services/auth.service';

const bloodTypes = ['UNKNOWN', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const initialDonor = {
  full_name: '', birth_date: '', gender: '', phone: '', email: '', citizen_id: '',
  blood_type: 'UNKNOWN', weight: '', height: '', address: '', occupation: '',
};

export default function Register() {
  const [form, setForm] = useState(initialDonor);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!agree) return 'Vui lòng đồng ý với điều khoản sử dụng và chính sách bảo mật.';
    if (!form.full_name.trim()) return 'Vui lòng nhập họ tên người hiến.';
    if (!form.phone.trim()) return 'Vui lòng nhập số điện thoại.';
    if (!form.email.trim()) return 'Vui lòng nhập email.';
    if (!form.birth_date) return 'Vui lòng nhập ngày sinh.';
    if (!form.gender) return 'Vui lòng chọn giới tính.';
    if (!form.citizen_id.trim()) return 'Vui lòng nhập số CMND/CCCD.';
    if (!form.weight) return 'Vui lòng nhập cân nặng.';
    if (!form.address.trim()) return 'Vui lòng nhập địa chỉ thường trú.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setLoading(true); setError('');
    try {
      await authService.register({
        phone: form.phone,
        email: form.email,
        full_name: form.full_name,
        role: 'DONOR',
        blood_type: form.blood_type,
        birth_date: form.birth_date,
        gender: form.gender,
        citizen_id: form.citizen_id,
        weight: form.weight ? Number(form.weight) : null,
        height: form.height ? Number(form.height) : null,
        address: form.address,
        occupation: form.occupation,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] font-sans text-slate-950">
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-100">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">SBDCs</p>
              <p className="text-[10px] font-bold text-slate-400">Single Hospital Blood Donation</p>
            </div>
          </Link>
          <p className="text-sm font-semibold text-slate-600">
            Đã có tài khoản? <Link to="/login" className="font-black text-red-600 hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 via-white to-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Đăng ký người hiến</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Tạo hồ sơ hiến máu</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Điền đầy đủ thông tin để bệnh viện sàng lọc nhanh hơn khi bạn đến hiến máu.
                Hospital Admin không tự đăng ký công khai — tài khoản do hệ thống cấp.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-red-600">
                <User className="h-4 w-4" /> Thông tin cá nhân
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={User} label="Họ tên" value={form.full_name} onChange={(v) => update('full_name', v)} placeholder="Nguyen Van A" required />
                <Field icon={Phone} label="Số điện thoại" value={form.phone} onChange={(v) => update('phone', v)} placeholder="0900000000" required />
                <Field icon={Mail} label="Email" value={form.email} onChange={(v) => update('email', v)} placeholder="donor@example.com" required />
                <Field icon={IdCard} label="CMND/CCCD" value={form.citizen_id} onChange={(v) => update('citizen_id', v)} placeholder="012345678901" required />
                <Field icon={Calendar} type="date" label="Ngày sinh" value={form.birth_date} onChange={(v) => update('birth_date', v)} required />
                <Select label="Giới tính" value={form.gender} onChange={(v) => update('gender', v)} options={[['', 'Chọn giới tính'], ['MALE', 'Nam'], ['FEMALE', 'Nữ'], ['OTHER', 'Khác']]} />
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-red-600">
                <Droplets className="h-4 w-4" /> Thông tin hiến máu
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Nhóm máu" value={form.blood_type} onChange={(v) => update('blood_type', v)} options={bloodTypes.map(b => [b, b === 'UNKNOWN' ? 'Chưa xác định' : b])} />
                <Field icon={Scale} type="number" label="Cân nặng (kg)" value={form.weight} onChange={(v) => update('weight', v)} placeholder="56" required />
                <Field icon={Ruler} type="number" label="Chiều cao (cm)" value={form.height} onChange={(v) => update('height', v)} placeholder="170" />
                <Field icon={Briefcase} label="Nghề nghiệp" value={form.occupation} onChange={(v) => update('occupation', v)} placeholder="Sinh viên" />
                <div className="md:col-span-2">
                  <Field icon={MapPin} label="Địa chỉ thường trú" value={form.address} onChange={(v) => update('address', v)} placeholder="Quận/Huyện, Tỉnh/Thành phố" required />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 rounded text-red-600" />
              Tôi xác nhận thông tin đã cung cấp là chính xác và đồng ý cho bệnh viện sử dụng dữ liệu này để phục vụ quy trình hiến máu.
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-red-200 transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Đang đăng ký...' : 'Tạo hồ sơ người hiến'} <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <label className="block space-y-2">
      <span className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block space-y-2">
      <span className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
      >
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}
