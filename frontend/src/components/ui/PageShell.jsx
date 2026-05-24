import React from 'react';

export function PageShell({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ badge, title, subtitle, action, children }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {badge && (
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">{badge}</p>
        )}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          {title && <h2 className="text-lg font-black text-slate-950 dark:text-slate-50">{title}</h2>}
          {action && (
            typeof action === 'string'
              ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">{action}</span>
              : action
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function StatCard({ icon: Icon, color = 'red', title, value, note, onClick }) {
  const colors = {
    red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300',
  };
  const Tag = onClick ? 'button' : 'article';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${onClick ? 'cursor-pointer hover:border-red-200' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colors[color] || colors.red}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
          {note && <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">{note}</p>}
        </div>
      </div>
    </Tag>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="mb-4 h-14 w-14 text-slate-200 dark:text-slate-700" />}
      <p className="text-base font-black text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PrimaryButton({ children, className = '', variant = 'red', ...props }) {
  const variants = {
    red: 'bg-red-600 shadow-red-200 hover:bg-red-700 dark:shadow-red-950/30',
    dark: 'bg-slate-950 shadow-slate-200 hover:bg-black dark:bg-red-600',
    outline: 'border-2 border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.red} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertBanner({ tone = 'info', children }) {
  const tones = {
    info: 'border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    warning: 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    danger: 'border-red-100 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  };
  return <div className={`rounded-2xl border p-4 text-sm font-semibold leading-6 ${tones[tone]}`}>{children}</div>;
}
