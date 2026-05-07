/**
 * App.jsx — Route configuration and layout wrapper.
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import Landing      from './pages/Landing.jsx';
import Login        from './pages/Login.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Simulations  from './pages/Simulations.jsx';
import AlertsPage   from './pages/AlertsPage.jsx';
import Prevention   from './pages/Prevention.jsx';
import LogsPage     from './pages/LogsPage.jsx';
import AdminPanel   from './pages/AdminPanel.jsx';
import AppLayout    from './components/common/AppLayout.jsx';
import MatrixRain   from './components/common/MatrixRain.jsx';

/* ── Guard: requires authentication ── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

/* ── Guard: requires admin role ── */
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading)   return <FullScreenLoader />;
  if (!user)     return <Navigate to="/login" replace />;
  if (!isAdmin)  return <Navigate to="/dashboard" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-cyber-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyber-green border-t-transparent rounded-full spin mx-auto mb-4" />
        <p className="font-mono text-cyber-dim text-sm">INITIALIZING SVDF...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <MatrixRain />
      <Routes>
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />

        {/* ── Protected routes inside app shell ── */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/simulations" element={<Simulations />} />
          <Route path="/alerts"      element={<AlertsPage />} />
          <Route path="/prevention"  element={<Prevention />} />
          <Route path="/logs"        element={<LogsPage />} />
          <Route path="/admin"       element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
