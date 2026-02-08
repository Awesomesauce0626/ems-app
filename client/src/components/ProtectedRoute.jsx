import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  const location = useLocation();

  // If the authentication state is still loading, don't render anything.
  // This prevents redirects before the user's role is known.
  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- SUPER-USER FIX: Admins can access everything ---
  if (role && user.role !== role && user.role !== 'admin') {
    // If a role is required, and the user doesn't have it, AND the user is not an admin,
    // then redirect them.
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
