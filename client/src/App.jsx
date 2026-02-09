import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Page Components
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import EMSDashboard from './pages/EMSDashboard';
import AlertDetails from './pages/AlertDetails';
import QuickAccessForm from './pages/QuickAccessForm';
import ReportsPage from './pages/ReportsPage';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallbackHandler from './pages/AuthCallbackHandler';
import ProtectedRoute from './components/ProtectedRoute';
// --- ENHANCEMENT: Import First-Aid Guide pages ---
import FirstAidMenu from './pages/FirstAidMenu';
import FirstAidTopic from './pages/FirstAidTopic';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quick-access" element={<QuickAccessForm />} />

        {/* --- ENHANCEMENT: Add routes for the First-Aid Guide --- */}
        <Route path="/first-aid" element={<FirstAidMenu />} />
        <Route path="/first-aid/:topicId" element={<FirstAidTopic />} />

        <Route path="/auth/callback" element={<AuthCallbackHandler />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/citizen"
          element={
            <ProtectedRoute role="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ems"
          element={
            <ProtectedRoute role="ems_personnel">
              <EMSDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alert/:id"
          element={
            <ProtectedRoute>
              <AlertDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute role={['admin', 'ems_personnel']}> {/* Allow both roles */}
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
