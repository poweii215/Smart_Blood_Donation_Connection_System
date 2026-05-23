import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Congratulations from './pages/Congratulations';
import Recommendation from './pages/Recommendation';
import Reports from './pages/Reports';
import SmartAssistant from './pages/SmartAssistant';
import Notifications from './pages/Notifications';
import { authService } from './services/auth.service';
import { applyAppearanceForUser } from './utils/userSettings';

function ProtectedRoute({ children, roles }) {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }) {
  const user = authService.getCurrentUser();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function DashboardShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  useEffect(() => {
    const applyStoredAppearance = () => applyAppearanceForUser(authService.getCurrentUser());
    applyStoredAppearance();
    const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    media?.addEventListener?.('change', applyStoredAppearance);
    window.addEventListener('sbdcs-settings-changed', applyStoredAppearance);
    window.addEventListener('storage', applyStoredAppearance);
    window.addEventListener('sbdcs-auth-changed', applyStoredAppearance);
    return () => {
      media?.removeEventListener?.('change', applyStoredAppearance);
      window.removeEventListener('sbdcs-settings-changed', applyStoredAppearance);
      window.removeEventListener('storage', applyStoredAppearance);
      window.removeEventListener('sbdcs-auth-changed', applyStoredAppearance);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public pages: no sidebar, no dashboard topbar */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* Authenticated app: sidebar/topbar only appears after login */}
        <Route element={<ProtectedRoute><DashboardShell /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/inventory" element={<ProtectedRoute roles={['HOSPITAL_ADMIN']}><Inventory /></ProtectedRoute>} />
          <Route path="/recommendation" element={<ProtectedRoute roles={['HOSPITAL_ADMIN']}><Recommendation /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['HOSPITAL_ADMIN']}><Reports /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute roles={['DONOR']}><SmartAssistant /></ProtectedRoute>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/congratulations" element={<ProtectedRoute roles={['DONOR']}><Congratulations /></ProtectedRoute>} />
          <Route path="/congratulations/:appointmentId" element={<ProtectedRoute roles={['DONOR']}><Congratulations /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
