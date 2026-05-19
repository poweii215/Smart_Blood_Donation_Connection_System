import React, { useState, useEffect } from 'react';
import { Droplets, Save, AlertCircle, History, Building2, Filter, Activity } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { hospitalService } from '../services/hospital.service';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState({ quantity: 0, safety_threshold: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, hospData] = await Promise.all([
        bloodBankService.getInventory(selectedHospital || undefined),
        hospitalService.getAll()
      ]);
      setInventory(invData);
      setHospitals(hospData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedHospital]);

  const handleSave = async (bloodType) => {
    if (!selectedHospital) {
      alert('Please select a specific hospital to update inventory.');
      return;
    }
    try {
      await bloodBankService.updateInventory({
        blood_type: bloodType,
        quantity: editValue.quantity,
        safety_threshold: editValue.safety_threshold,
        hospital_id: parseInt(selectedHospital)
      });
      setEditing(null);
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blood Inventory</h1>
          <p className="text-gray-500 mt-1">Manage stock levels and safety thresholds.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none appearance-none pr-6"
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
            >
              <option value="">All Hospitals (Aggregated)</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="p-2 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Activity className="w-12 h-12 mb-4 animate-spin opacity-20" />
          <p>Loading inventory data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {inventory.map((item) => (
            <div key={item.blood_type} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center font-black text-red-600 text-xl">
                  {item.blood_type}
                </div>
                {item.quantity < item.safety_threshold && (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                {editing === item.blood_type ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Quantity (L)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        value={editValue.quantity}
                        onChange={e => setEditValue({...editValue, quantity: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Threshold (L)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        value={editValue.safety_threshold}
                        onChange={e => setEditValue({...editValue, safety_threshold: parseFloat(e.target.value)})}
                      />
                    </div>
                    <button 
                      onClick={() => handleSave(item.blood_type)}
                      className="w-full bg-red-600 text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button 
                      onClick={() => setEditing(null)}
                      className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Current Stock</p>
                        <p className="text-3xl font-bold text-gray-900">{item.quantity.toFixed(1)}L</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Threshold</p>
                        <p className="text-sm font-bold text-gray-600">{item.safety_threshold.toFixed(1)}L</p>
                      </div>
                    </div>
                    {selectedHospital && (
                      <button 
                        onClick={() => {
                          setEditing(item.blood_type);
                          setEditValue({ quantity: item.quantity, safety_threshold: item.safety_threshold });
                        }}
                        className="w-full py-2 border border-gray-100 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors"
                      >
                        Adjust Stock
                      </button>
                    )}
                  </>
                )}
              </div>
              
              <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2">
                <History className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-medium italic">
                  Updated {new Date(item.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
