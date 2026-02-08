import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This is so we can send them along to that page after
    // they log in, which is a nicer user experience than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a role is required and the user doesn't have that role, redirect them
  if (role && user.role !== role) {
    // You might want to redirect to a generic 'unauthorized' page
    // or back to the home page.
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
