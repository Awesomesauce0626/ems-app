import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallbackHandler = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs when the component mounts and whenever the auth state changes.
    if (!isAuthenticated) {
      // If auth state is not ready, we wait. It will re-run when it changes.
      return;
    }

    // Once authenticated, redirect to the correct dashboard.
    const targetDashboard = user?.role === 'ems_personnel' ? '/dashboard/ems' : '/dashboard/citizen';
    navigate(targetDashboard, { replace: true });

  }, [isAuthenticated, user, navigate]);

  // Display a loading message to the user while we wait for the redirect.
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Authenticating...</h2>
      <p>Please wait, you are being redirected.</p>
    </div>
  );
};

export default AuthCallbackHandler;
