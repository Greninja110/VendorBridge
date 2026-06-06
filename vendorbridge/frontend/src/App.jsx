import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import VendorDashboard from './pages/dashboards/VendorDashboard';
import ProcurementDashboard from './pages/dashboards/ProcurementDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    admin: '/dashboard/admin',
    vendor: '/dashboard/vendor',
    procurement_officer: '/dashboard/procurement',
    manager: '/dashboard/manager',
  };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/vendor" element={
            <ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/procurement" element={
            <ProtectedRoute allowedRoles={['procurement_officer']}><ProcurementDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/manager" element={
            <ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
