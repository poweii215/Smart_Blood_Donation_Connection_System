import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Plus, X, Building2, Activity } from 'lucide-react';
import { hospitalService } from '../services/hospital.service';
import { authService } from '../services/auth.service';

export default function DonationCenters() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHosp, setNewHosp] = useState({ name: '', address: '', contact_phone: '', contact_email: '' });
  
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

  // Calculate map query based on user location
  const mapQuery = user?.lat && user?.lng 
    ? `${user.lat},${user.lng}` 
    : 'blood donation center';

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getAll();
      setHospitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await hospitalService.create(newHosp);
      setShowModal(false);
      setNewHosp({ name: '', address: '', contact_phone: '', contact_email: '' });
      fetchHospitals();
    } catch (err) {
      alert('Failed to add donation center');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Donation Centers</h1>
          <p className="text-gray-500 mt-1">View donation centers and manage hospital collection points.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Center
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {hospitals.map((h) => (
            <div key={h.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-red-600" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${h.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {h.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{h.name}</h3>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{h.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{h.contact_phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>{h.contact_email || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
          {hospitals.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Building2 className="w-12 h-12 mb-4 opacity-20" />
              <p>No donation centers registered yet.</p>
            </div>
          )}
        </div>

        {/* Map Sidebar */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-[600px] sticky top-24">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Live Map
            </h3>
            <span className="text-[10px] font-bold text-blue-600 uppercase">Nearby Centers</span>
          </div>
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight="0" 
            marginWidth="0" 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            className="grayscale contrast-125 opacity-80"
          />
        </div>
      </div>

      {/* Add Center Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Donation Center</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Center Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  required
                  placeholder="e.g. City Blood Bank"
                  value={newHosp.name}
                  onChange={e => setNewHosp({...newHosp, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Address</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  required
                  placeholder="Full street address"
                  value={newHosp.address}
                  onChange={e => setNewHosp({...newHosp, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Contact number"
                    value={newHosp.contact_phone}
                    onChange={e => setNewHosp({...newHosp, contact_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Contact email"
                    value={newHosp.contact_email}
                    onChange={e => setNewHosp({...newHosp, contact_email: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all mt-4"
              >
                Register Center
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
