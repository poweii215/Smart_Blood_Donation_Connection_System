import React, { useState, useEffect } from 'react';
import { Droplets, Save, AlertCircle, Activity, Siren, PlusCircle, MinusCircle, History, TrendingUp, RefreshCw, Package } from 'lucide-react';
import { bloodBankService } from '../services/bloodbank.service';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';
import { PageShell, Panel, StatCard, PrimaryButton, AlertBanner } from '../components/ui/PageShell';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Inventory() {
  const user = authService.getCurrentUser();
  const tr = useI18n(user);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState({ quantity: 0, safety_threshold: 0 });
  const [txForm, setTxForm] = useState({ blood_type: 'O-', transaction_type: 'IN', quantity: 1, note: '' });
  const [txMessage, setTxMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, txs, fc] = await Promise.all([
        bloodBankService.getInventory(),
        bloodBankService.getTransactions({ limit: 80 }),
        analyticsService.getForecast(6),
      ]);
      setInventory(inv);
      setTransactions(txs);
      setForecast(fc);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (bloodType) => {
    try {
      await bloodBankService.updateInventory({ blood_type: bloodType, quantity: Number(editValue.quantity), safety_threshold: Number(editValue.safety_threshold) });
      setEditing(null); fetchData();
    } catch { alert(tr('updateFailed')); }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setTxMessage('');
    try {
      const res = await bloodBankService.createTransaction({ ...txForm, quantity: Number(txForm.quantity) });
      setTxMessage(`${txForm.transaction_type === 'IN' ? 'Đã nhập' : 'Đã xuất'} ${txForm.quantity}L nhóm ${txForm.blood_type}. Tồn kho mới: ${Number(res.new_quantity).toFixed(1)}L.`);
      setTxForm({ ...txForm, quantity: 1, note: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Không thể ghi giao dịch kho máu');
    }
  };

  const emergencyCount = inventory.filter(i => i.emergency_mode).length;
  const totalUnits = inventory.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const lowCount = inventory.filter(i => Number(i.quantity) < Number(i.safety_threshold)).length;

  return (
    <PageShell>
      {emergencyCount > 0 && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-200 animate-pulse">
            <Siren className="h-5 w-5" /> {tr('emergencyModeCount', { count: emergencyCount })}
          </div>
        </div>
      )}

      {loading ? (
        <Panel><div className="flex flex-col items-center py-16 text-slate-400"><Activity className="mb-4 h-12 w-12 animate-spin opacity-30" /><p>{tr('loadingInventory')}</p></div></Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Package} color="blue" title="Tổng tồn kho" value={`${totalUnits.toFixed(1)}L`} note="8 nhóm máu" />
            <StatCard icon={AlertCircle} color="amber" title="Dưới ngưỡng an toàn" value={lowCount} note="Cần bổ sung" />
            <StatCard icon={Siren} color="red" title="Khẩn cấp" value={emergencyCount} note="Emergency mode" />
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {inventory.map((item) => (
              <BloodTypeCard
                key={item.blood_type}
                item={item}
                tr={tr}
                editing={editing}
                editValue={editValue}
                setEditing={setEditing}
                setEditValue={setEditValue}
                onSave={handleSave}
              />
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Dự báo kho máu tháng tới" action="WMA">
              <p className="mb-4 text-sm text-slate-500">Weighted Moving Average dựa trên lịch sử xuất máu.</p>
              <ForecastChart data={forecast} />
            </Panel>

            <Panel title="Ghi nhận nhập/xuất kho máu">
              <form onSubmit={handleTransaction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField label="Nhóm máu" value={txForm.blood_type} onChange={v => setTxForm({...txForm, blood_type: v})} options={BLOOD_TYPES} />
                <SelectField label="Loại giao dịch" value={txForm.transaction_type} onChange={v => setTxForm({...txForm, transaction_type: v})} options={[{value:'IN', label:'Nhập kho'}, {value:'OUT', label:'Xuất kho'}]} />
                <NumberField label="Số lượng (L)" value={txForm.quantity} onChange={v => setTxForm({...txForm, quantity: v})} />
                <TextField label="Ghi chú" value={txForm.note} onChange={v => setTxForm({...txForm, note: v})} placeholder="VD: Hiến máu, điều trị..." />
                <PrimaryButton type="submit" className={`md:col-span-2 ${txForm.transaction_type === 'IN' ? '!bg-emerald-600 hover:!bg-emerald-700' : '!bg-orange-600 hover:!bg-orange-700'}`}>
                  {txForm.transaction_type === 'IN' ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
                  {txForm.transaction_type === 'IN' ? 'Ghi nhận nhập kho' : 'Ghi nhận xuất kho'}
                </PrimaryButton>
                {txMessage && <div className="md:col-span-2"><AlertBanner tone="success">{txMessage}</AlertBanner></div>}
              </form>
            </Panel>
          </div>

          <Panel
            title="Lịch sử xuất nhập kho"
            action={
              <button type="button" onClick={fetchData} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                <RefreshCw className="h-4 w-4" /> Làm mới
              </button>
            }
          >
            <TransactionTable rows={transactions} />
          </Panel>
        </>
      )}
    </PageShell>
  );
}

function BloodTypeCard({ item, tr, editing, editValue, setEditing, setEditValue, onSave }) {
  const isEmergency = item.emergency_mode;
  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-slate-900 ${isEmergency ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-950/50' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600 dark:bg-red-950/40 dark:text-red-300">{item.blood_type}</div>
        {isEmergency ? (
          <div className="flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-red-600"><Siren className="h-5 w-5 text-white" /></div>
        ) : Number(item.quantity) < Number(item.safety_threshold) ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : null}
      </div>
      <div className="space-y-4 p-5">
        {editing === item.blood_type ? (
          <>
            <NumberField label={tr('quantityL')} value={editValue.quantity} onChange={v => setEditValue({...editValue, quantity: v})} />
            <NumberField label={tr('safetyThresholdL')} value={editValue.safety_threshold} onChange={v => setEditValue({...editValue, safety_threshold: v})} />
            <PrimaryButton type="button" onClick={() => onSave(item.blood_type)} className="w-full"><Save className="h-4 w-4" /> {tr('saveChanges')}</PrimaryButton>
            <button type="button" onClick={() => setEditing(null)} className="w-full rounded-2xl bg-slate-100 py-2.5 text-sm font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{tr('cancel')}</button>
          </>
        ) : (
          <>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{tr('currentQuantity')}</p>
              <p className="mt-1 text-3xl font-black text-slate-950 dark:text-slate-50">{Number(item.quantity).toFixed(1)}<span className="text-lg text-slate-400">L</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{tr('safetyStock')}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{Number(item.safety_threshold).toFixed(1)}L</p>
            </div>
            <StatusPill status={item.status} />
            <button
              type="button"
              onClick={() => { setEditing(item.blood_type); setEditValue({ quantity: item.quantity, safety_threshold: item.safety_threshold }); }}
              className="w-full rounded-2xl bg-slate-50 py-3 text-sm font-black text-slate-700 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              {tr('updateStock')}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase text-slate-400">{label}</label>
      <input type="number" step="0.1" min="0" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" value={value} onChange={e => onChange(parseFloat(e.target.value || '0'))} />
    </div>
  );
}
function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase text-slate-400">{label}</label>
      <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase text-slate-400">{label}</label>
      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function StatusPill({ status }) {
  const map = { EMERGENCY:'bg-red-600 text-white', CRITICAL:'bg-red-100 text-red-700', WARNING:'bg-amber-100 text-amber-700', SAFE:'bg-emerald-100 text-emerald-700' };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${map[status] || map.SAFE}`}>{status}</span>;
}

function ForecastChart({ data }) {
  const maxVal = Math.max(1, ...data.map(d => Math.max(Number(d.forecast_next_month || 0), Number(d.quantity || 0))));
  return (
    <div className="space-y-3">
      {data.map(item => {
        const stockPct = Math.min(100, (Number(item.quantity || 0) / maxVal) * 100);
        const forecastPct = Math.min(100, (Number(item.forecast_next_month || 0) / maxVal) * 100);
        const riskColor = item.risk === 'EMERGENCY' ? 'text-red-600' : item.risk === 'CRITICAL' ? 'text-orange-600' : item.risk === 'WARNING' ? 'text-amber-600' : 'text-emerald-600';
        return (
          <div key={item.blood_type} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-slate-50">{item.blood_type}</span>
              <span className={`text-xs font-black ${riskColor}`}>{item.risk}</span>
            </div>
            <Bar label="Tồn kho" value={`${Number(item.quantity || 0).toFixed(1)}L`} pct={stockPct} color="bg-blue-500" />
            <Bar label="Dự báo xuất" value={`${Number(item.forecast_next_month || 0).toFixed(1)}L`} pct={forecastPct} color="bg-red-500" />
          </div>
        );
      })}
    </div>
  );
}
function Bar({ label, value, pct, color }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-500"><span>{label}</span><span>{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
function TransactionTable({ rows }) {
  if (!rows.length) return <p className="rounded-2xl bg-slate-50 py-8 text-center text-sm font-semibold text-slate-500 dark:bg-slate-800">Chưa có giao dịch xuất nhập kho.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:border-slate-800">
            <th className="py-3 pr-4">Thời gian</th><th className="py-3 pr-4">Nhóm máu</th><th className="py-3 pr-4">Loại</th><th className="py-3 pr-4">Số lượng</th><th className="py-3">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {rows.map(r => (
            <tr key={r.id} className="text-slate-700 dark:text-slate-200">
              <td className="py-3 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString('vi-VN')}</td>
              <td className="py-3 pr-4 font-black">{r.blood_type}</td>
              <td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${r.transaction_type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{r.transaction_type === 'IN' ? 'NHẬP' : 'XUẤT'}</span></td>
              <td className="py-3 pr-4 font-bold">{Number(r.quantity).toFixed(1)}L</td>
              <td className="py-3">{r.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
