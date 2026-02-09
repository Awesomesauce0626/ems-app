import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // --- ENHANCEMENT: Import Link for back button
import API_BASE_URL from '../api';
import './ReportsPage.css';

const ReportsPage = () => {
    const [completedAlerts, setCompletedAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, user } = useAuth(); // --- ENHANCEMENT: Get user for role check

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

    // --- ENHANCEMENT: Function to handle alert deletion ---
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
            // Remove the alert from the state to update the UI immediately
            setCompletedAlerts(completedAlerts.filter(alert => alert._id !== alertId));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="reports-loading">Loading reports...</div>;

    return (
        <div className="reports-container">
            <header className="reports-header">
                <h1>Completed Alerts Report</h1>
                <p>A historical record of all resolved alerts.</p>
                {/* --- ENHANCEMENT: Add back button -- */}
                <Link to="/dashboard/ems" className="back-to-dashboard-link">← Back to EMS Dashboard</Link>
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
                            {/* --- ENHANCEMENT: Add Actions column for admins --- */}
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
                                {/* --- ENHANCEMENT: Show delete button only for admins --- */}
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
