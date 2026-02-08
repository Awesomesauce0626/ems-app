import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import API_BASE_URL from '../api'; // --- DEPLOYMENT FIX: Import the central API URL
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './AlertDetails.css';

// Fix for Vite with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const AlertDetails = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For the update form
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAlertDetails = async () => {
        if (!token) return;
      try {
        // --- DEPLOYMENT FIX: Use the central API URL ---
        const res = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch alert details');
        const data = await res.json();
        setAlert(data);
        setStatus(data.status);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlertDetails();
  }, [id, token]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // --- DEPLOYMENT FIX: Use the central API URL ---
      const res = await fetch(`${API_BASE_URL}/api/alerts/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedAlert = await res.json();
      setAlert(updatedAlert.alert);
      setNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!alert) return <div>Alert not found.</div>;

  const statusOptions = ['Pending', 'Responding', 'En-route', 'On Scene', 'Transporting', 'Completed', 'Cancelled'];
  const canUpdateStatus = user?.role === 'ems_personnel' || user?.role === 'admin';

  return (
    <div className="alert-details-container">
      <header className="details-header">
        <h1>Alert Details</h1>
        <span className={`status-badge-lg status-${alert.status.toLowerCase().replace(/\s+/g, '-')}`}>
          {alert.status}
        </span>
      </header>

      <div className="details-content-grid">
        <div className="details-info-panel">
          <h2>Incident Information</h2>
          <p><strong>Type:</strong> {alert.incidentType}</p>
          <p><strong>Description:</strong> {alert.description}</p>
          <p><strong>Patients:</strong> {alert.patientCount}</p>
          <hr />
          <h2>Reporter Details</h2>
          <p><strong>Name:</strong> {alert.reporterName}</p>
          <p><strong>Phone:</strong> {alert.reporterPhone}</p>
          {alert.userId && <p><strong>Account:</strong> Registered User ({alert.userId.email})</p>}
          <hr />
          <h2>Timeline</h2>
          <ul className="status-history">
            {alert.statusHistory.map((entry, index) => (
              <li key={index}>
                <strong>{entry.status}</strong> - <small>{new Date(entry.timestamp).toLocaleString()}</small>
                {entry.note && <p className="note">Note: {entry.note}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="details-action-panel">
            {alert.location && alert.location.latitude && alert.location.longitude && (
                <div className="details-map-container">
                    <MapContainer center={[alert.location.latitude, alert.location.longitude]} zoom={15} style={{ height: '300px', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={[alert.location.latitude, alert.location.longitude]}>
                            <Popup>{alert.incidentType}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            )}

          {canUpdateStatus && (
            <div className="status-update-form">
              <h3>Update Status</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label>New Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add relevant notes..."></textarea>
                </div>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Alert'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDetails;
