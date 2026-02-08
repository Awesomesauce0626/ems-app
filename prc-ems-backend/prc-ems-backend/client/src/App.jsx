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
import ReportsPage from './pages/ReportsPage'; // Import the new page
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quick-access" element={<QuickAccessForm />} />

        {/* Protected Routes */}
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
            <ProtectedRoute role="ems_personnel">
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
