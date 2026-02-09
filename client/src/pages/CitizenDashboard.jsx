import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AlertForm from '../components/AlertForm';
import LocationPickerMap from '../components/LocationPickerMap';
import API_BASE_URL from '../api';
import './CitizenDashboard.css';

const CitizenDashboard = () => {
  const { user, token, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [initialCenter, setInitialCenter] = useState([14.113, 122.95]);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    const fetchUserAlerts = async () => {
      if (!token || !user) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const allAlerts = await res.json();
        const userAlerts = allAlerts.filter(a => a.userId?._id === user.id);
        setAlerts(userAlerts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAlerts();
  }, [token, user]);

  const openAlertModal = () => {
    setLocation(null);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setInitialCenter([initialPos.lat, initialPos.lng]);
        setLocation(initialPos);
        setIsModalOpen(true);
      },
      () => {
        setLocationError('Could not get GPS. The map is optional.');
        setLocation(null);
        setIsModalOpen(true);
      }
    );
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const handleAlertSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const alertData = { ...data, location, reporterName: `${user.firstName} ${user.lastName}`, reporterPhone: user.phoneNumber };
      const res = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(alertData),
      });
      if (!res.ok) throw new Error('Failed to submit alert');
      const newAlert = await res.json();
      setAlerts(prev => [newAlert.alert, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="citizen-dashboard">
      <header className="cd-header">
        {/* --- UX ENHANCEMENT: Universal Home Button --- */}
        <Link to="/" className="header-logo-link">
            <img src="/prc-logo.png" alt="PRC Logo" />
            <span>PRC-CN EMS</span>
        </Link>
        <div className="user-info">
          <h1>Welcome, {user.firstName}!</h1>
          <p>Your personal emergency hub.</p>
        </div>
        <nav className="cd-nav">
            {user?.role === 'admin' && (
                <Link to="/dashboard/admin" className="nav-link admin-link">Return to Admin</Link>
            )}
            <button onClick={logout} className="logout-button">Logout</button>
        </nav>
      </header>

      <main className="cd-main">
        <div className="cd-actions">
          <h2>Dashboard</h2>
          <button onClick={openAlertModal} className="new-alert-button">Create New Alert</button>
          <Link to="/first-aid" className="first-aid-button">View First-Aid Guide</Link>
        </div>

        <div className="alert-history">
          <h3>Your Alert History</h3>
          {loading && <p>Loading your alerts...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && alerts.length === 0 && <p>You haven't submitted any alerts yet.</p>}
          <ul className="alerts-list">
            {alerts.map(alert => (
              <li key={alert._id} className={`alert-item status-${alert.status.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="alert-item-header">
                  <span className="incident-type">{alert.incidentType}</span>
                  <span className="status-badge">{alert.status}</span>
                </div>
                <div className="alert-item-body">
                  <p><strong>Description:</strong> {alert.description}</p>
                </div>
                <div className="alert-item-footer">
                  <small>{new Date(alert.createdAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-map-wrapper">
          <p className="map-optional-text">Optional: Drag the pin to the exact incident location.</p>
          <LocationPickerMap center={initialCenter} onLocationChange={handleLocationChange} />
        </div>
        {locationError && <p className="location-error">{error}</p>}
        <h2 style={{ marginTop: '1.5rem' }}>Alert Details</h2>
        <AlertForm onSubmit={handleAlertSubmit} isSubmitting={isSubmitting} />
      </Modal>
    </div>
  );
};

export default CitizenDashboard;
