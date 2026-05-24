import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, HeartHandshake, Mail, Save, Search, Send, Settings2, Shield, Siren, SlidersHorizontal, Zap } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';

const BLOOD_TYPES = ['O-','O+','A-','A+','B-','B+','AB-','AB+'];

export default function Recommendation() {
  const user = authService.getCurrentUser();
  const tr = useI18n(user);
  const [weightSettings, setWeightSettings] = useState(null);
  const [bloodType, setBloodType] = useState('O-');
  const [topN, setTopN] = useState(5);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedResultIds, setSelectedResultIds] = useState([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

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
      alert(tr('weightsSaved'));
    } catch (err) {
      console.error('Failed to save recommendation weights', err);
      alert(tr('weightsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const runRecommendation = async () => {
    try {
      setRunning(true);
      const result = await analyticsService.recommendDonors({ blood_type: bloodType, top_n: Number(topN) || 5 });
      setRecommendation(result);
      setSelectedResultIds([]);
      setEmailResult(null);
    } catch (err) {
      console.error('Failed to run recommendation', err);
      alert(tr('recommendationRunFailed'));
    } finally {
      setRunning(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedResultIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllRecommended = () => {
    const ids = recommendation?.items?.map(d => d.recommendation_result_id).filter(Boolean) || [];
    setSelectedResultIds(ids);
  };

  const clearSelected = () => setSelectedResultIds([]);

  const sendEmailsToSelected = async () => {
    if (!selectedResultIds.length) {
      alert('Vui lòng chọn ít nhất một người hiến để gửi email.');
      return;
    }
    try {
      setSendingEmails(true);
      const result = await analyticsService.sendRecommendationEmails({ recommendation_result_ids: selectedResultIds });
      setEmailResult(result);
      const statusById = Object.fromEntries((result.results || []).map(r => [r.recommendation_result_id, r.status]));
      setRecommendation(prev => prev ? {
        ...prev,
        items: (prev.items || []).map(item => ({
          ...item,
          email_status: statusById[item.recommendation_result_id] || item.email_status,
        }))
      } : prev);
    } catch (err) {
      console.error('Failed to send recommendation emails', err);
      alert('Không thể gửi email khuyến nghị.');
    } finally {
      setSendingEmails(false);
    }
  };

  if (loading) return <div className="font-semibold text-slate-400">{tr('loadingRecommendationSettings')}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-600 mb-3">
            <Zap className="w-4 h-4" /> {tr('smartModule')}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{tr('recommendationTitle')}</h1>
          <p className="text-gray-500 mt-1 max-w-3xl">
            {tr('recommendationPageDesc')}
          </p>
        </div>
        <button
          onClick={saveWeightSettings}
          disabled={saving || !weightSettings}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-black disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? tr('savingWeights') : tr('saveWeights')}
        </button>
      </header>

      {weightSettings && <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 recommendation-card bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-black text-gray-900 flex items-center gap-2"><Settings2 className="w-5 h-5 text-red-600" /> {tr('weightingBasis')}</h2>
              <p className="text-sm text-gray-500 mt-1">{tr('weightingBasisDesc')}</p>
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <input
                type="checkbox"
                checked={!!weightSettings.emergency_auto_adjust}
                onChange={(e) => setWeightSettings({ ...weightSettings, emergency_auto_adjust: e.target.checked })}
                className="accent-red-600"
              />
              {tr('autoAdjustEmergency')}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeightInput label="BloodMatch" value={weightSettings.w_blood} onChange={(v)=>updateWeight('w_blood', v)} note={tr('bloodMatchNote')} />
            <WeightInput label="Eligibility" value={weightSettings.w_eligibility} onChange={(v)=>updateWeight('w_eligibility', v)} note={tr('eligibilityNote')} />
            <WeightInput label="Reliability" value={weightSettings.w_reliability} onChange={(v)=>updateWeight('w_reliability', v)} note={tr('reliabilityNote')} />
            <WeightInput label="Humanitarian" value={weightSettings.w_humanitarian} onChange={(v)=>updateWeight('w_humanitarian', v)} note={tr('humanitarianNote')} />
          </div>

          <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <Siren className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-black text-red-700">{tr('emergencyAdaptiveWeights')}</h3>
                <p className="text-sm text-red-700/80 mt-1">{tr('emergencyAdaptiveWeightsDesc')}</p>
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

        <section className="recommendation-card bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-black text-gray-900 flex items-center gap-2"><Search className="w-5 h-5 text-blue-600" /> {tr('runRecommendation')}</h2>
          <p className="text-sm text-gray-500 mt-1">{tr('runRecommendationDesc')}</p>

          <label className="block mt-5 text-xs font-black text-gray-400 uppercase tracking-widest">{tr('bloodType')}</label>
          <select value={bloodType} onChange={(e)=>setBloodType(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black outline-none focus:border-red-400">
            {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label className="block mt-4 text-xs font-black text-gray-400 uppercase tracking-widest">{tr('topN')}</label>
          <input type="number" min="1" max="50" value={topN} onChange={(e)=>setTopN(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black outline-none focus:border-red-400" />

          <button onClick={runRecommendation} disabled={running} className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-60">
            {running ? tr('running') : tr('runRecommendation')}
          </button>

          {recommendation && <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-black text-blue-900 dark:text-blue-100">Gửi email có chọn lọc</h3>
                <p className="text-xs text-blue-700/80 dark:text-blue-200/80 mt-1 leading-relaxed">
                  Chỉ donor được chọn trong danh sách Top N mới nhận email. Hệ thống có chống gửi trùng trong 24 giờ để tránh spam.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={selectAllRecommended} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-200">Chọn tất cả</button>
                  <button type="button" onClick={clearSelected} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-200">Bỏ chọn</button>
                  <button type="button" onClick={sendEmailsToSelected} disabled={sendingEmails || !selectedResultIds.length} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                    <Send className="w-4 h-4" /> {sendingEmails ? 'Đang gửi...' : `Gửi email (${selectedResultIds.length})`}
                  </button>
                </div>
                {emailResult && <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Đã xử lý {emailResult.processed}/{emailResult.requested} người. Chế độ: {emailResult.mode || 'mock'}.
                  <div className="mt-2 space-y-1">
                    {(emailResult.results || []).map(r => <div key={r.recommendation_result_id} className="flex justify-between gap-3"><span>{r.donor_name}</span><span className={r.status === 'FAILED' ? 'text-red-600' : r.status === 'SKIPPED' ? 'text-amber-600' : 'text-green-600'}>{r.status}</span></div>)}
                  </div>
                </div>}
              </div>
            </div>
          </div>}

          {recommendation && <div className="mt-5 space-y-3">
            <div className={`rounded-2xl p-3 text-xs font-black ${recommendation.emergency_mode ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {tr('mode')}: {recommendation.weighting_mode} · Blood {Math.round((recommendation.weights_used?.w_blood || 0) * 100)}%
            </div>
            {recommendation.items?.length === 0 && <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900 text-sm text-gray-500">{tr('noSuitableDonor')}</div>}
            {recommendation.items?.map((d, idx) => <div key={d.recommendation_result_id || d.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedResultIds.includes(d.recommendation_result_id)}
                    onChange={() => toggleSelected(d.recommendation_result_id)}
                    className="mt-1 accent-blue-600"
                  />
                  <span>
                    <span className="block font-black text-sm text-gray-900 dark:text-slate-100">#{idx + 1} {d.full_name}</span>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">{d.phone} · {d.email || 'No email'} · {d.blood_type}</span>
                  </span>
                </label>
                <div className="text-right">
                  <span className="block text-xs font-black text-red-600">{Math.round(d.score * 100)}%</span>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-black ${d.email_status === 'SENT' || d.email_status === 'MOCK_SENT' ? 'bg-green-100 text-green-700' : d.email_status === 'FAILED' ? 'bg-red-100 text-red-700' : d.email_status === 'SKIPPED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{d.email_status || 'NOT_SENT'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 dark:text-slate-400">Reliability {Math.round((d.reliability_component || 0) * 100)}% · {tr('eligibleInDays', { days: d.days_until_eligible })}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500 dark:text-slate-300">
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
        <ExplainCard icon={CheckCircle2} title="BloodMatch" text={tr('correctBloodType')} />
        <ExplainCard icon={Shield} title="Eligibility" text={tr('enoughRecovery')} />
        <ExplainCard icon={SlidersHorizontal} title="Reliability" text={tr('reliableHistory')} />
        <ExplainCard icon={HeartHandshake} title="Humanitarian" text={tr('humanitarianHistory')} />
      </section>
    </div>
  );
}

function WeightInput({ label, value, onChange, note }) {
  return <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
    <div className="flex items-center justify-between"><label className="text-sm font-black text-gray-800">{label}</label><span className="text-xs font-black text-red-600">{Math.round((value || 0) * 100)}%</span></div>
    <input type="range" min="0" max="1" step="0.05" value={value || 0} onChange={(e)=>onChange(e.target.value)} className="w-full mt-3 accent-red-600" />
    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{note}</p>
  </div>;
}

function EmergencyBox({ label, value }) {
  return <div className="rounded-2xl bg-white/80 p-3 text-center dark:bg-slate-900/80"><div className="text-red-600">{Math.round((value || 0) * 100)}%</div><div className="text-gray-500 mt-1">{label}</div></div>;
}

function MiniScore({ label, value }) {
  return <div className="rounded-xl bg-white px-3 py-2 border border-gray-100 flex items-center justify-between dark:bg-slate-900 dark:border-slate-700"><span>{label}</span><span className="text-gray-900">{Math.round((value || 0) * 100)}%</span></div>;
}

function ExplainCard({ icon: Icon, title, text }) {
  return <div className="recommendation-card rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><Icon className="w-6 h-6 text-red-600" /><h3 className="font-black text-gray-900 mt-3">{title}</h3><p className="text-sm text-gray-500 mt-1 leading-relaxed">{text}</p></div>;
}
