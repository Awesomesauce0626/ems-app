import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import usePushNotifications from '../hooks/usePushNotifications';
import MapView from '../components/MapView';
import API_BASE_URL from '../api';
import './EMSDashboard.css';

const EMSDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const socket = useSocket();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const { requestPermissionAndGetToken, notificationStatus } = usePushNotifications(token);

  const alarmSound = useMemo(() => new Audio('/alarm.mp3'), []);

  useEffect(() => {
    if (token) {
      const fetchAlerts = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`${API_BASE_URL}/api/alerts`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to fetch alerts. Status: ${res.status}, Message: ${errorText}`);
          }
          const data = await res.json();
          setAlerts(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!socket || !isMonitoring) return;

    const handleNewAlert = (newAlert) => {
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
      alarmSound.play().catch(e => console.error("Error playing sound:", e));
    };

    const handleAlertUpdate = (updatedAlert) => {
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert._id === updatedAlert._id ? updatedAlert : alert
        )
      );
    };

    const handleAlertArchived = ({ alertId }) => {
        setAlerts((prevAlerts) => prevAlerts.filter(alert => alert._id !== alertId));
    };

    socket.on('new-alert', handleNewAlert);
    socket.on('alert-status-update', handleAlertUpdate);
    socket.on('alert-archived', handleAlertArchived);

    return () => {
      socket.off('new-alert', handleNewAlert);
      socket.off('alert-status-update', handleAlertUpdate);
      socket.off('alert-archived', handleAlertArchived);
    };
  }, [socket, isMonitoring, alarmSound]);

  const handleAlertClick = (alertId) => {
    navigate(`/alert/${alertId}`);
  };

  const startMonitoring = () => {
    alarmSound.play().then(() => alarmSound.pause());
    setIsMonitoring(true);
  };

  if (loading) return <div className="dashboard-loading">Loading alerts...</div>;

  return (
    <div className="ems-dashboard">
      <header className="dashboard-header">
        {/* --- UX ENHANCEMENT: Universal Home Button --- */}
        <Link to="/" className="header-logo-link">
            <img src="/prc-logo.png" alt="PRC Logo" />
            <span>EMS Control Tower</span>
        </Link>
        <nav className="dashboard-nav">
            {user?.role === 'admin' && (
                <Link to="/dashboard/admin" className="nav-link admin-link">Return to Admin</Link>
            )}
            <Link to="/reports" className="nav-link">View Reports</Link>
            <button onClick={logout} className="nav-link logout-btn">Logout</button>
        </nav>
      </header>

      {error && <div className="dashboard-error">Error: {error}</div>}

      {notificationStatus !== 'granted' && (
        <div className="notification-prompt">
          <p>Enable push notifications to receive alerts even when the app is in the background.</p>
          <button onClick={requestPermissionAndGetToken}>Enable Notifications</button>
        </div>
      )}

      {!isMonitoring ? (
        <div className="monitoring-gate">
            <h2>Ready to Monitor?</h2>
            <p>Click the button below to start receiving live alerts.</p>
            <button onClick={startMonitoring} className="start-monitoring-btn">Start Monitoring</button>
        </div>
      ) : (
        <div className="dashboard-content">
            <div className="alerts-list-panel">
                <h2 className="panel-header">Incoming Alerts ({alerts.length})</h2>
                <ul className="alerts-list">
                    {alerts.length > 0 ? alerts.map((alert) => (
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
                    )) : (
                        <div className="no-alerts-message">No active alerts. Waiting for new alerts...</div>
                    )}
                </ul>
            </div>
            <div className="map-panel">
            <MapView alerts={alerts} />
            </div>
        </div>
      )}
    </div>
  );
};

export default EMSDashboard;
