import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { authService } from './services/auth.service';

function ProtectedRoute({ children, roles }) {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute roles={['HOSPITAL_ADMIN']}><Inventory /></ProtectedRoute>} />
          <Route path="/recommendation" element={<ProtectedRoute roles={['HOSPITAL_ADMIN']}><Recommendation /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['HOSPITAL_ADMIN']}><Reports /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute roles={['DONOR']}><SmartAssistant /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/congratulations" element={<ProtectedRoute roles={['DONOR']}><Congratulations /></ProtectedRoute>} />
          <Route path="/congratulations/:appointmentId" element={<ProtectedRoute roles={['DONOR']}><Congratulations /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
