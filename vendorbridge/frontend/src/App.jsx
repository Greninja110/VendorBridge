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
import VendorsPage from './pages/VendorsPage';
import RFQsPage from './pages/RFQsPage';
import QuotationsPage from './pages/QuotationsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import InvoicesPage from './pages/InvoicesPage';
import UsersPage from './pages/UsersPage';

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
          <Route path="/vendors" element={
            <ProtectedRoute allowedRoles={['admin','procurement_officer','manager','vendor']}><VendorsPage /></ProtectedRoute>
          } />
          <Route path="/rfqs" element={
            <ProtectedRoute allowedRoles={['admin','procurement_officer','manager','vendor']}><RFQsPage /></ProtectedRoute>
          } />
          <Route path="/quotations" element={
            <ProtectedRoute allowedRoles={['admin','procurement_officer','manager','vendor']}><QuotationsPage /></ProtectedRoute>
          } />
          <Route path="/approvals" element={
            <ProtectedRoute allowedRoles={['admin','manager','procurement_officer']}><ApprovalsPage /></ProtectedRoute>
          } />
          <Route path="/purchase-orders" element={
            <ProtectedRoute allowedRoles={['admin','procurement_officer','manager']}><PurchaseOrdersPage /></ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute allowedRoles={['admin','procurement_officer','manager']}><InvoicesPage /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
