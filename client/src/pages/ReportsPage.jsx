import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../api';
import './ReportsPage.css';

const ReportsPage = () => {
    const [completedAlerts, setCompletedAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

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

    if (loading) return <div className="reports-loading">Loading reports...</div>;

    return (
        <div className="reports-container">
            <header className="reports-header">
                <h1>Completed Alerts Report</h1>
                <p>A historical record of all resolved alerts.</p>
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
                        </tr>
                    </thead>
                    <tbody>
                        {completedAlerts.map(alert => (
                            <tr key={alert._id}>
                                <td>{alert.incidentType}</td>
                                <td>{alert.location?.address || 'N/A'}</td>
                                <td>{alert.reporterName}</td>
                                <td>{new Date(alert.archivedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsPage;
