import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AlertForm from '../components/AlertForm';
import LocationPickerMap from '../components/LocationPickerMap';
import API_BASE_URL from '../api';
import './CitizenDashboard.css';

// Helper function to convert Data URL to Blob for upload
const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

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

  const handleAlertSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = null;

      // Step 1: Check if an image was attached
      if (formData.image && formData.image.dataUrl) {
        // Step 2: Get a secure upload signature from our backend
        const signRes = await fetch(`${API_BASE_URL}/api/upload/sign`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!signRes.ok) throw new Error('Could not get upload signature from server');
        const signData = await signRes.json();

        // Step 3: Upload the image directly to Cloudinary
        const imageBlob = dataURLtoBlob(formData.image.dataUrl);
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageBlob);
        uploadFormData.append('api_key', signData.apikey);
        uploadFormData.append('timestamp', signData.timestamp);
        uploadFormData.append('signature', signData.signature);
        uploadFormData.append('folder', 'incidents');

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudname}/image/upload`;
        const cloudinaryRes = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: uploadFormData,
        });
        if (!cloudinaryRes.ok) throw new Error('Cloudinary upload failed');
        const cloudinaryData = await cloudinaryRes.json();
        imageUrl = cloudinaryData.secure_url;
      }

      // Step 4: Submit the alert with the image URL and user info
      const alertData = {
        ...formData,
        imageUrl,
        location,
        reporterName: `${user.firstName} ${user.lastName}`,
        reporterPhone: user.phoneNumber,
      };

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
      console.error("Alert Submission Error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.'
    );

    if (confirmation) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to delete account.');
        }

        alert('Your account has been successfully deleted.');
        logout();
      } catch (err) {
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="citizen-dashboard">
      <header className="cd-header">
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

      <footer className="cd-footer">
        <p>
          For account-related issues or to request account deletion, please contact support.
          <button onClick={handleAccountDeletion} className="delete-account-link">Delete My Account</button>
        </p>
      </footer>

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
