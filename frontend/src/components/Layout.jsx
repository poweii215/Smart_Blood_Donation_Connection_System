import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplets, Calendar, LayoutDashboard, LogOut, User, Target, FileSpreadsheet, Settings, Bell, ChevronDown, Bot } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user && location.pathname !== '/login' && location.pathname !== '/register') return <>{children}</>;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['HOSPITAL_ADMIN', 'DONOR'] },
    { name: 'Appointments', path: '/appointments', icon: Calendar, roles: ['HOSPITAL_ADMIN', 'DONOR'] },
    { name: 'Blood Inventory', path: '/inventory', icon: Droplets, roles: ['HOSPITAL_ADMIN'] },
    { name: 'Recommendation', path: '/recommendation', icon: Target, roles: ['HOSPITAL_ADMIN'] },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet, roles: ['HOSPITAL_ADMIN'] },
    { name: 'Smart Assistant', path: '/assistant', icon: Bot, roles: ['DONOR'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['HOSPITAL_ADMIN', 'DONOR'] },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white md:flex">
        <div className="shrink-0 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-100">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">SBDCs</h1>
              <p className="text-sm leading-tight text-slate-500">Single Hospital<br />Blood Donation System</p>
            </div>
          </div>
        </div>

        <div className="mx-6 shrink-0 border-t border-slate-100" />

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-5 pr-3">
          {navItems.filter(item => item.roles.includes(user?.role)).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={`${item.name}-${item.path}`}
                to={item.path}
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-[15px] font-bold transition-all ${
                  active
                    ? 'bg-red-50 text-red-600 shadow-sm shadow-red-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 bg-white px-6 pb-5 pt-3">
          <div className="border-t border-slate-100 pt-5">
            <button onClick={handleLogout} className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-[15px] font-bold text-red-600 transition hover:bg-red-50">
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden md:ml-[280px]">
        <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:px-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden rounded-xl border border-slate-200 p-2 text-slate-600">☰</button>
            <div>
              <h2 className="text-xl font-black text-slate-950">{user?.role === 'HOSPITAL_ADMIN' ? 'Hospital Dashboard' : 'Donor Dashboard'}</h2>
              <p className="text-sm text-slate-500">{user?.role === 'HOSPITAL_ADMIN' ? 'Overview of today\'s operations' : 'Your donation journey'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-2xl border border-slate-100 bg-white p-3 text-slate-500 shadow-sm hover:text-red-600">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">3</span>
            </button>
            <div className="hidden items-center gap-3 md:flex">
              <div className="h-11 w-11 overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center">
                {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-slate-400" />}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-black text-slate-950">{user?.full_name || (user?.role === 'HOSPITAL_ADMIN' ? 'Hospital Admin' : 'Donor')}</p>
                <p className="text-sm text-slate-500">{user?.role === 'HOSPITAL_ADMIN' ? 'Hospital' : 'Donor'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </section>
    </div>
  );
}
