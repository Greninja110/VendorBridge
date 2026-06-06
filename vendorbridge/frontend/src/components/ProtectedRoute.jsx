import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASH = {
  admin:               '/dashboard/admin',
  vendor:              '/dashboard/vendor',
  procurement_officer: '/dashboard/procurement',
  manager:             '/dashboard/manager',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={ROLE_DASH[user.role] || '/login'} replace />;

  return children;
}
