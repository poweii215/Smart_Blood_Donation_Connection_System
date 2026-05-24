import React, { useState, useEffect } from 'react';
import { Droplets, Save, AlertCircle, Activity, Siren } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';

export default function Inventory() {
  const user = authService.getCurrentUser();
  const tr = useI18n(user);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState({ quantity: 0, safety_threshold: 0 });

  const fetchData = async () => {
    setLoading(true);
    try { setInventory(await bloodBankService.getInventory()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (bloodType) => {
    try {
      await bloodBankService.updateInventory({ blood_type: bloodType, quantity: editValue.quantity, safety_threshold: editValue.safety_threshold });
      setEditing(null); fetchData();
    } catch { alert(tr('updateFailed')); }
  };

  const emergencyCount = inventory.filter(i => i.emergency_mode).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tr('inventory')}</h1>
          <p className="text-gray-500 mt-1">{tr('inventoryDesc')}</p>
        </div>
        {emergencyCount > 0 && <div className="bg-red-600 text-white px-5 py-3 rounded-2xl font-black shadow-lg shadow-red-200 flex items-center gap-2 animate-pulse"><Siren className="w-5 h-5" /> {tr('emergencyModeCount', { count: emergencyCount })}</div>}
      </header>
      {loading ? <div className="py-20 flex flex-col items-center justify-center text-gray-400"><Activity className="w-12 h-12 mb-4 animate-spin opacity-20" /><p>{tr('loadingInventory')}</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {inventory.map((item) => <div key={item.blood_type} className={`bg-white rounded-3xl shadow-sm border overflow-hidden group ${item.emergency_mode ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-200'}`}>
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center font-black text-red-600 text-xl">{item.blood_type}</div>
              {item.emergency_mode ? <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center animate-pulse"><Siren className="w-5 h-5 text-white" /></div> : item.quantity < item.safety_threshold && <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-600" /></div>}
            </div>
            <div className="p-6 space-y-4">
              {editing === item.blood_type ? <div className="space-y-3">
                <NumberField label={tr('quantityL')} value={editValue.quantity} onChange={v => setEditValue({...editValue, quantity: v})} />
                <NumberField label={tr('safetyThresholdL')} value={editValue.safety_threshold} onChange={v => setEditValue({...editValue, safety_threshold: v})} />
                <button onClick={() => handleSave(item.blood_type)} className="w-full bg-red-600 text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {tr('saveChanges')}</button>
                <button onClick={() => setEditing(null)} className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl font-bold text-sm">{tr('cancel')}</button>
              </div> : <>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tr('currentQuantity')}</p><p className="text-3xl font-black text-gray-900 mt-1">{Number(item.quantity).toFixed(1)}L</p></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tr('safetyStock')}</p><p className="text-sm font-bold text-gray-500 mt-1">{Number(item.safety_threshold).toFixed(1)}L</p></div>
                <StatusPill status={item.status} />
                <button onClick={() => { setEditing(item.blood_type); setEditValue({ quantity: item.quantity, safety_threshold: item.safety_threshold }); }} className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm transition-colors">{tr('updateStock')}</button>
              </>}
            </div>
          </div>)}
        </div>
      )}
    </div>
  );
}
function NumberField({ label, value, onChange }) { return <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label><input type="number" step="0.1" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20" value={value} onChange={e => onChange(parseFloat(e.target.value || '0'))} /></div>; }
function StatusPill({ status }) { const map = { EMERGENCY:'bg-red-600 text-white', CRITICAL:'bg-red-100 text-red-700', WARNING:'bg-amber-100 text-amber-700', SAFE:'bg-green-100 text-green-700' }; return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${map[status] || map.SAFE}`}>{status}</span>; }
