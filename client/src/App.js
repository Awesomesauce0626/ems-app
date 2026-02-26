import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from './pages/LandingPage';
import QuickAlert from './pages/QuickAlert';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import EMSDashboard from './pages/EMSDashboard';
import AlertDetails from './pages/AlertDetails';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // Import SocketProvider
import './App.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quick-alert" element={<QuickAlert />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/citizen-dashboard" element={
            <ProtectedRoute requiredRole="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/ems-dashboard" element={
            <ProtectedRoute requiredRole="ems_personnel">
              <EMSDashboard />
            </ProtectedRoute>
          } />
          <Route path="/alert/:id" element={
            <ProtectedRoute>
              <AlertDetails />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider> {  /* Wrap AppContent with SocketProvider */}
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
