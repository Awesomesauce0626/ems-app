import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import API_BASE_URL from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './AlertDetails.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'responding', label: 'Responding' },
  { value: 'en_route', label: 'En-route' },
  { value: 'on_scene', label: 'On Scene' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AlertDetails = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAlertDetails = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch alert details');
        const data = await res.json();
        setAlertData(data);
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
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, note }),
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to update status');
      }

      const updatedData = await res.json();

      if (updatedData.message && updatedData.message.includes('archived')) {
        window.alert('Alert completed and archived. Returning to dashboard.');
        navigate('/dashboard/ems', { replace: true });
      } else if (updatedData.alert) {
        setAlertData(updatedData.alert);
        setNote('');
      } else {
        throw new Error('An unexpected response was received from the server.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!alertData) return <div>Alert not found.</div>;

  const canUpdateStatus = user?.role === 'ems_personnel' || user?.role === 'admin';
  const currentStatusLabel = statusOptions.find(opt => opt.value === alertData.status)?.label || alertData.status;

  return (
    <div className="alert-details-container">
      <header className="universal-header">
          <Link to="/" className="header-logo-link">
              <img src="/prc-logo.png" alt="PRC Logo" />
              <span>Alert Details</span>
          </Link>
          <button onClick={() => navigate(-1)} className="back-button">← Back</button>
      </header>

      <div className="details-content-grid">
          <div className="details-info-panel">
            <h2>Incident Information</h2>
            <p><strong>Status:</strong> <span className={`status-badge-lg status-${alertData.status.toLowerCase().replace(/\s+/g, '-')}`}>{currentStatusLabel}</span></p>
            <p><strong>Type:</strong> {alertData.incidentType}</p>
            {alertData.location?.address && <p><strong>Address:</strong> {alertData.location.address}</p>}
            <p><strong>Description:</strong> {alertData.description}</p>
            <p><strong>Patients:</strong> {alertData.patientCount}</p>
            {alertData.imageUrl && (
              <>
                <hr />
                <h2>Incident Image</h2>
                <div className="incident-image-container">
                  <a href={alertData.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={alertData.imageUrl} alt="Incident" className="incident-image" />
                  </a>
                </div>
              </>
            )}
            <hr />
            <h2>Reporter Details</h2>
            <p><strong>Name:</strong> {alertData.reporterName}</p>
            <p><strong>Phone:</strong> {alertData.reporterPhone}</p>
            {alertData.userId && <p><strong>Account:</strong> Registered User ({alertData.userId.email})</p>}
            <hr />
            <h2>Timeline</h2>
            <ul className="status-history">
                {alertData.statusHistory.map((entry, index) => {
                    const entryStatusLabel = statusOptions.find(opt => opt.value === entry.status)?.label || entry.status;
                    return (
                        <li key={index}>
                            <strong>{entryStatusLabel}</strong> - <small>{new Date(entry.timestamp).toLocaleString()}</small>
                            {entry.note && <p className="note">Note: {entry.note}</p>}
                        </li>
                    )
                })}
            </ul>
          </div>

          <div className="details-action-panel">
              {alertData.location && alertData.location.latitude && alertData.location.longitude && (
                  <div className="details-map-container">
                      <MapContainer center={[alertData.location.latitude, alertData.location.longitude]} zoom={15} style={{ height: '300px', width: '100%' }}>
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                          <Marker position={[alertData.location.latitude, alertData.location.longitude]}>
                              <Popup>{alertData.incidentType}</Popup>
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
                      {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
