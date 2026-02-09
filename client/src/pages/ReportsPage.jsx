import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';
import './ReportsPage.css';

const ReportsPage = () => {
    const [completedAlerts, setCompletedAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCompletedAlerts = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/alerts/completed`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch completed alerts');
                }
                const data = await res.json();
                setCompletedAlerts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompletedAlerts();
    }, [token]);

    const handleDelete = async (alertId) => {
        if (!window.confirm('Are you sure you want to permanently delete this record?')) {
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/alerts/completed/${alertId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error('Failed to delete the alert record.');
            }
            setCompletedAlerts(completedAlerts.filter(alert => alert._id !== alertId));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="reports-loading">Loading reports...</div>;

    return (
        <div className="reports-container">
            <header className="universal-header">
                <Link to="/" className="header-logo-link">
                    <img src="/prc-logo.png" alt="PRC Logo" />
                    <span>Completed Reports</span>
                </Link>
                <button onClick={() => navigate(-1)} className="back-button">← Back</button>
            </header>

            {error && <div className="reports-error">Error: {error}</div>}

            <div className="reports-table-container">
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>Incident Type</th>
                            <th>Address</th>
                            <th>Reporter Name</th>
                            <th>Date Completed</th>
                            {user?.role === 'admin' && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {completedAlerts.map(alert => (
                            <tr key={alert._id}>
                                <td>{alert.incidentType}</td>
                                <td>{alert.location?.address || 'N/A'}</td>
                                <td>{alert.reporterName}</td>
                                <td>{new Date(alert.archivedAt).toLocaleString()}</td>
                                {user?.role === 'admin' && (
                                    <td>
                                        <button onClick={() => handleDelete(alert._id)} className="delete-btn">Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsPage;
