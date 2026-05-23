import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Calendar, CheckCircle2, HeartPulse, Megaphone } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { useI18n } from '../utils/userSettings';

export default function Notifications() {
  const user = authService.getCurrentUser();
  const tr = useI18n(user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getNotifications()
      .then(data => setItems(data?.items || []))
      .catch(err => console.error('Failed to load notifications', err))
      .finally(() => setLoading(false));
  }, []);

  const unread = items.length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-red-600">{tr('notificationCenter')}</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">{tr('notificationIntroTitle')}</h1>
            <p className="mt-2 text-slate-600">{tr('notificationIntroDesc')}</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
            <Bell className="h-8 w-8" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard icon={Bell} title={tr('totalAlerts')} value={unread} />
        <SummaryCard icon={AlertTriangle} title={tr('highPriority')} value={items.filter(i => i.priority === 'HIGH').length} />
        <SummaryCard icon={CheckCircle2} title={tr('normalUpdates')} value={items.filter(i => i.priority !== 'HIGH').length} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-black text-slate-950">{tr('latestNotifications')}</h2>
        {loading ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">{tr('loadingNotifications')}</p>
        ) : items.length ? (
          <div className="space-y-4">
            {items.map((item, index) => <NotificationRow key={`${item.type}-${index}`} item={item} />)}
          </div>
        ) : (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">{tr('noActiveNotifications')}</p>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Icon className="h-7 w-7" /></div>
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <p className="text-3xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  </article>;
}

function NotificationRow({ item }) {
  const iconMap = {
    EMERGENCY: AlertTriangle,
    LOW_STOCK: HeartPulse,
    EMERGENCY_CAMPAIGN: Megaphone,
    UPCOMING_APPOINTMENT: Calendar,
    APPOINTMENT_APPROVED: CheckCircle2,
    ELIGIBLE_AGAIN: CheckCircle2,
    RECOVERY: HeartPulse,
  };
  const Icon = iconMap[item.type] || Bell;
  const style = item.priority === 'HIGH'
    ? 'border-red-100 bg-red-50 text-red-700'
    : item.priority === 'SUCCESS'
      ? 'border-green-100 bg-green-50 text-green-700'
      : 'border-blue-100 bg-blue-50 text-blue-700';
  return <div className={`rounded-3xl border p-5 ${style}`}>
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80"><Icon className="h-6 w-6" /></div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black">{item.title}</h3>
          <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-black uppercase">{item.priority || 'INFO'}</span>
        </div>
        <p className="mt-1 text-sm opacity-90">{item.message}</p>
        <p className="mt-2 text-xs font-semibold opacity-70">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
      </div>
    </div>
  </div>;
}
