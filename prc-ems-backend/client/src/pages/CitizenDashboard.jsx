import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AlertForm from '../components/AlertForm';
import './CitizenDashboard.css';

const CitizenDashboard = () => {
  const { user, token, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // Fetch user-specific alerts
    const fetchUserAlerts = async () => {
      try {
        // We need a new endpoint for this or filter on the client-side.
        // For now, let's fetch all and filter.
        const res = await fetch('/api/alerts', {
            headers: { Authorization: `Bearer ${token}` }
        });
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
  }, [token, user.id]);

  const openAlertModal = () => {
    setLocation(null);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsModalOpen(true);
      },
      () => {
        setLocationError('Could not get location. Please enable location services.');
        setIsModalOpen(true); // Still open modal to show the error
      }
    );
  };

  const handleAlertSubmit = async (data) => {
    setIsSubmitting(true);
    if (!location) {
        setError("Location is required to submit an alert.");
        setIsSubmitting(false);
        return;
    }

    try {
        const alertData = { ...data, location, reporterName: `${user.firstName} ${user.lastName}`, reporterPhone: user.phoneNumber };
        const res = await fetch('/api/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
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
        <div className="user-info">
          <h1>Welcome, {user.firstName}!</h1>
          <p>Your personal emergency hub.</p>
        </div>
        <button onClick={logout} className="logout-button">Logout</button>
      </header>

      <main className="cd-main">
        <div className="cd-actions">
          <h2>Dashboard</h2>
          <button onClick={openAlertModal} className="new-alert-button">Create New Alert</button>
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
                        <p><strong>Location:</strong> {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}</p>
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
        <h2>New Emergency Alert</h2>
        {locationError && <p className="error-message">{locationError}</p>}
        {!location && !locationError && <p>Getting your location...</p>}
        {location && <p className="location-info">Location captured successfully.</p>}
        <AlertForm onSubmit={handleAlertSubmit} isSubmitting={isSubmitting} />
      </Modal>
    </div>
  );
};

export default CitizenDashboard;
