import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplets, Calendar, LayoutDashboard, LogOut, User, Building2 } from 'lucide-react';
import { authService } from '../services/auth.service';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['HOSPITAL_ADMIN','DONOR'] },
    { name: 'Appointments', path: '/appointments', icon: Calendar, roles: ['HOSPITAL_ADMIN','DONOR'] },
    { name: 'Donation Centers', path: '/centers', icon: Building2, roles: ['HOSPITAL_ADMIN','DONOR'] },
    { name: 'Profile', path: '/profile', icon: User, roles: ['HOSPITAL_ADMIN','DONOR'] },
    { name: 'Inventory', path: '/inventory', icon: Droplets, roles: ['HOSPITAL_ADMIN'] },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <Droplets className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-gray-900 leading-none">SBDCs</span>
            <span className="text-[10px] text-gray-500 font-medium hidden sm:block">Smart Blood Donation Connection system</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {user?.role === 'HOSPITAL_ADMIN' ? 'HOSPITAL' : 'DONOR'}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
          <nav className="space-y-1">
            {navItems.filter(item => item.roles.includes(user?.role)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-red-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
