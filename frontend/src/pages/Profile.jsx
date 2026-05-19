import React, { useState } from 'react';
import { User, Mail, Droplets, MapPin, Save, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Profile() {
  const user = authService.getCurrentUser();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    blood_type: user?.blood_type || '',
    lat: user?.lat || '',
    lng: user?.lng || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null
      };
      await authService.updateProfile(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and donation preferences.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <User className="text-white w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-gray-500 flex items-center gap-1.5 text-sm mt-1">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Blood Type</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.blood_type}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none"
                >
                  <option value="">Select Blood Type</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Location Coordinates</label>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                Get Current Location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400 italic ml-1">Coordinates are used to find the nearest donation centers.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
