import React, { useState } from 'react';
import { User, Phone, Droplets, Save, CheckCircle2, HeartHandshake, Camera, UploadCloud } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Profile() {
  const user = authService.getCurrentUser();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    blood_type: user?.blood_type || 'UNKNOWN',
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const normalizeAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh hợp lệ.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ảnh đại diện không được vượt quá 3MB.' });
      return;
    }
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: '', text: '' });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await authService.uploadAvatar(avatarFile);
      const nextUrl = res.user?.avatar_url || res.avatar_url || '';
      setAvatarUrl(nextUrl);
      setPreviewUrl(nextUrl);
      setAvatarFile(null);
      setMessage({ type: 'success', text: 'Đã cập nhật ảnh đại diện!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Không thể cập nhật ảnh đại diện.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await authService.updateProfile(formData);
      setMessage({ type: 'success', text: 'Đã cập nhật thông tin cá nhân!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Không thể cập nhật thông tin.' });
    } finally {
      setLoading(false);
    }
  };

  const displayAvatar = normalizeAvatarUrl(previewUrl || avatarUrl);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h1>
        <p className="text-gray-500 mt-1">Manage only the information needed for blood donation.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white" />
            ) : (
              <div className="w-24 h-24 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                <User className="text-white w-11 h-11" />
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-black transition-colors">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-gray-500 flex items-center gap-1.5 text-sm mt-1"><Phone className="w-4 h-4" />{user?.phone}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold cursor-pointer hover:border-red-300 hover:text-red-600 transition-colors flex items-center gap-2">
                <Camera className="w-4 h-4" /> Chọn ảnh
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={!avatarFile || avatarLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" /> {avatarLoading ? 'Đang tải...' : 'Lưu ảnh đại diện'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 3MB.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm font-medium flex gap-2">
            <HeartHandshake className="w-5 h-5 shrink-0" />
            Hệ thống đã bỏ vị trí/map để không tạo rào cản cho người hiến máu.
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field icon={User} label="Full Name" value={formData.full_name} onChange={v => setFormData({ ...formData, full_name: v })} required />
            <Field icon={Phone} label="Phone" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} type="tel" required />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Blood Type</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.blood_type}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none"
                >
                  {['UNKNOWN', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type === 'UNKNOWN' ? 'Chưa xác định' : type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
            <Save className="w-5 h-5" />{loading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = 'text', required = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          required={required}
        />
      </div>
    </div>
  );
}
