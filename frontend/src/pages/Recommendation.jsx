import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, HeartHandshake, Save, Search, Settings2, Shield, Siren, SlidersHorizontal, Zap } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';

const BLOOD_TYPES = ['O-','O+','A-','A+','B-','B+','AB-','AB+'];

export default function Recommendation() {
  const [weightSettings, setWeightSettings] = useState(null);
  const [bloodType, setBloodType] = useState('O-');
  const [topN, setTopN] = useState(5);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await analyticsService.getRecommendationSettings();
        setWeightSettings(settings);
      } catch (err) {
        console.error('Failed to load recommendation settings', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateWeight = (key, value) => {
    setWeightSettings(prev => ({ ...prev, [key]: Number(value) }));
  };

  const saveWeightSettings = async () => {
    try {
      setSaving(true);
      const saved = await analyticsService.updateRecommendationSettings(weightSettings);
      setWeightSettings(saved);
      alert('Đã lưu cấu hình trọng số recommendation.');
    } catch (err) {
      console.error('Failed to save recommendation weights', err);
      alert('Không thể lưu trọng số.');
    } finally {
      setSaving(false);
    }
  };

  const runRecommendation = async () => {
    try {
      setRunning(true);
      const result = await analyticsService.recommendDonors({ blood_type: bloodType, top_n: Number(topN) || 5 });
      setRecommendation(result);
    } catch (err) {
      console.error('Failed to run recommendation', err);
      alert('Không thể chạy recommendation.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="text-gray-400 font-semibold">Loading recommendation settings...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-600 mb-3">
            <Zap className="w-4 h-4" /> Smart Module
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Donor Recommendation</h1>
          <p className="text-gray-500 mt-1 max-w-3xl">
            Cấu hình trọng số heuristic/adaptive để hệ thống đề xuất người hiến phù hợp nhất khi bệnh viện cần huy động máu.
          </p>
        </div>
        <button
          onClick={saveWeightSettings}
          disabled={saving || !weightSettings}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-black disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Save Weights'}
        </button>
      </header>

      {weightSettings && <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-black text-gray-900 flex items-center gap-2"><Settings2 className="w-5 h-5 text-red-600" /> Recommendation Weighting Basis</h2>
              <p className="text-sm text-gray-500 mt-1">Trọng số được chuẩn hóa về tổng 1.0 và dựa trên nghiệp vụ hiến máu.</p>
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <input
                type="checkbox"
                checked={!!weightSettings.emergency_auto_adjust}
                onChange={(e) => setWeightSettings({ ...weightSettings, emergency_auto_adjust: e.target.checked })}
                className="accent-red-600"
              />
              Auto-adjust in Emergency Mode
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeightInput label="BloodMatch" value={weightSettings.w_blood} onChange={(v)=>updateWeight('w_blood', v)} note="Quan trọng nhất: donor phải tương thích nhóm máu đang cần." />
            <WeightInput label="Eligibility" value={weightSettings.w_eligibility} onChange={(v)=>updateWeight('w_eligibility', v)} note="Donor phải đủ điều kiện/thời gian hiến lại." />
            <WeightInput label="Reliability" value={weightSettings.w_reliability} onChange={(v)=>updateWeight('w_reliability', v)} note="Ưu tiên người ít huỷ lịch, có lịch sử hoàn thành tốt." />
            <WeightInput label="Humanitarian" value={weightSettings.w_humanitarian} onChange={(v)=>updateWeight('w_humanitarian', v)} note="Điểm nhân đạo/gamification, dùng để khuyến khích donor tích cực." />
          </div>

          <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <Siren className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-black text-red-700">Emergency Adaptive Weights</h3>
                <p className="text-sm text-red-700/80 mt-1">Khi kho máu dưới ngưỡng nguy hiểm, hệ thống ưu tiên BloodMatch cao hơn để huy động đúng nhóm máu cần gấp.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-black">
                  <EmergencyBox label="Blood" value={weightSettings.emergency_w_blood} />
                  <EmergencyBox label="Eligibility" value={weightSettings.emergency_w_eligibility} />
                  <EmergencyBox label="Reliability" value={weightSettings.emergency_w_reliability} />
                  <EmergencyBox label="Humanitarian" value={weightSettings.emergency_w_humanitarian} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-black text-gray-900 flex items-center gap-2"><Search className="w-5 h-5 text-blue-600" /> Run Recommendation</h2>
          <p className="text-sm text-gray-500 mt-1">Chọn nhóm máu cần huy động và số lượng donor muốn đề xuất.</p>

          <label className="block mt-5 text-xs font-black text-gray-400 uppercase tracking-widest">Blood Type</label>
          <select value={bloodType} onChange={(e)=>setBloodType(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black outline-none focus:border-red-400">
            {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label className="block mt-4 text-xs font-black text-gray-400 uppercase tracking-widest">Top N</label>
          <input type="number" min="1" max="50" value={topN} onChange={(e)=>setTopN(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black outline-none focus:border-red-400" />

          <button onClick={runRecommendation} disabled={running} className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-60">
            {running ? 'Đang chạy...' : 'Run Recommendation'}
          </button>

          {recommendation && <div className="mt-5 space-y-3">
            <div className={`rounded-2xl p-3 text-xs font-black ${recommendation.emergency_mode ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              Mode: {recommendation.weighting_mode} · Blood {Math.round((recommendation.weights_used?.w_blood || 0) * 100)}%
            </div>
            {recommendation.items?.length === 0 && <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">Chưa có donor phù hợp với nhóm máu này.</div>}
            {recommendation.items?.map((d, idx) => <div key={d.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-black text-sm text-gray-900">#{idx + 1} {d.full_name}</span>
                <span className="text-xs font-black text-red-600">{Math.round(d.score * 100)}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{d.phone} · {d.blood_type} · Reliability {Math.round((d.reliability_component || 0) * 100)}% · Eligible in {d.days_until_eligible} days</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500">
                <MiniScore label="Blood" value={d.blood_match_score} />
                <MiniScore label="Eligibility" value={d.eligibility_score} />
                <MiniScore label="Reliability" value={d.reliability_component} />
                <MiniScore label="Humanitarian" value={d.humanitarian_component} />
              </div>
            </div>)}
          </div>}
        </section>
      </div>}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ExplainCard icon={CheckCircle2} title="BloodMatch" text="Đúng nhóm máu hoặc tương thích truyền máu." />
        <ExplainCard icon={Shield} title="Eligibility" text="Đủ ngày nghỉ và đạt điều kiện sức khỏe." />
        <ExplainCard icon={SlidersHorizontal} title="Reliability" text="Dựa trên tỷ lệ đến đúng hẹn và hoàn thành." />
        <ExplainCard icon={HeartHandshake} title="Humanitarian" text="Dựa trên điểm nhân đạo, huy hiệu, lịch sử đóng góp." />
      </section>
    </div>
  );
}

function WeightInput({ label, value, onChange, note }) {
  return <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
    <div className="flex items-center justify-between"><label className="text-sm font-black text-gray-800">{label}</label><span className="text-xs font-black text-red-600">{Math.round((value || 0) * 100)}%</span></div>
    <input type="range" min="0" max="1" step="0.05" value={value || 0} onChange={(e)=>onChange(e.target.value)} className="w-full mt-3 accent-red-600" />
    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{note}</p>
  </div>;
}

function EmergencyBox({ label, value }) {
  return <div className="rounded-2xl bg-white/80 p-3 text-center"><div className="text-red-600">{Math.round((value || 0) * 100)}%</div><div className="text-gray-500 mt-1">{label}</div></div>;
}

function MiniScore({ label, value }) {
  return <div className="rounded-xl bg-white px-3 py-2 border border-gray-100 flex items-center justify-between"><span>{label}</span><span className="text-gray-900">{Math.round((value || 0) * 100)}%</span></div>;
}

function ExplainCard({ icon: Icon, title, text }) {
  return <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><Icon className="w-6 h-6 text-red-600" /><h3 className="font-black text-gray-900 mt-3">{title}</h3><p className="text-sm text-gray-500 mt-1 leading-relaxed">{text}</p></div>;
}
