import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import './EMSDashboard.css';

const EMSDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (newAlert) => {
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
    };

    const handleAlertUpdate = (updatedAlert) => {
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert._id === updatedAlert._id ? updatedAlert : alert
        )
      );
    };

    socket.on('new-alert', handleNewAlert);
    socket.on('alert-status-update', handleAlertUpdate);

    return () => {
      socket.off('new-alert', handleNewAlert);
      socket.off('alert-status-update', handleAlertUpdate);
    };
  }, [socket]);

  const handleAlertClick = (alertId) => {
    navigate(`/alert/${alertId}`);
  };

  if (loading) return <div className="dashboard-loading">Loading alerts...</div>;
  if (error) return <div className="dashboard-error">Error: {error}</div>;

  return (
    <div className="ems-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
            <h1>EMS Control Tower</h1>
        </div>
        <nav className="dashboard-nav">
            <Link to="/reports" className="nav-link">View Reports</Link>
            <button onClick={logout} className="nav-link logout-btn">Logout</button>
        </nav>
      </header>
      <div className="dashboard-content">
        <div className="alerts-list-panel">
            <h2 className="panel-header">Incoming Alerts ({alerts.length})</h2>
            <ul className="alerts-list">
                {alerts.map((alert) => (
                    <li key={alert._id}
                        className={`alert-item status-${alert.status.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleAlertClick(alert._id)}>
                        <div className="alert-item-header">
                            <span className="incident-type">{alert.incidentType}</span>
                            <span className="status-badge">{alert.status}</span>
                        </div>
                        <div className="alert-item-body">
                            <p><strong>Reporter:</strong> {alert.reporterName}</p>
                        </div>
                        <div className="alert-item-footer">
                            <small>{new Date(alert.createdAt).toLocaleString()}</small>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
        <div className="map-panel">
          <MapView alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export default EMSDashboard;
