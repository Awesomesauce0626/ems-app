import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ReportsPage.css';

const ReportsPage = () => {
  const [allAlerts, setAllAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [alertsPerPage] = useState(10);

  useEffect(() => {
    const fetchAllAlerts = async () => {
      try {
        const res = await fetch('/api/alerts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        setAllAlerts(data);
        setFilteredAlerts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllAlerts();
  }, [token]);

  useEffect(() => {
    let result = allAlerts;

    if (statusFilter) {
      result = result.filter(alert => alert.status === statusFilter);
    }

    if (startDate) {
        result = result.filter(alert => new Date(alert.createdAt) >= new Date(startDate));
    }

    if (endDate) {
        // Add 1 day to the end date to include all alerts on that day
        const endOfDay = new Date(endDate);
        endOfDay.setDate(endOfDay.getDate() + 1);
        result = result.filter(alert => new Date(alert.createdAt) < endOfDay);
    }

    setFilteredAlerts(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [statusFilter, startDate, endDate, allAlerts]);

  const clearFilters = () => {
      setStatusFilter('');
      setStartDate('');
      setEndDate('');
  };

  // Pagination logic
  const indexOfLastAlert = currentPage * alertsPerPage;
  const indexOfFirstAlert = indexOfLastAlert - alertsPerPage;
  const currentAlerts = filteredAlerts.slice(indexOfFirstAlert, indexOfLastAlert);
  const totalPages = Math.ceil(filteredAlerts.length / alertsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const statusOptions = ['Pending', 'Responding', 'En-route', 'On Scene', 'Transporting', 'Completed', 'Cancelled'];

  if (loading) return <div className="reports-loading">Loading reports...</div>;
  if (error) return <div className="reports-error">Error: {error}</div>;

  return (
    <div className="reports-container">
      <header className="reports-header">
        <h1>Alert History & Reports</h1>
        <Link to="/dashboard/ems" className="back-link">← Back to Dashboard</Link>
      </header>

      <div className="filters-container">
        <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        <div className="filter-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Incident Type</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentAlerts.map(alert => (
              <tr key={alert._id}>
                <td>{alert.incidentType}</td>
                <td><span className={`status-badge status-${alert.status.toLowerCase().replace(/\s+/g, '-')}`}>{alert.status}</span></td>
                <td>{alert.reporterName}</td>
                <td>{new Date(alert.createdAt).toLocaleDateString()}</td>
                <td><Link to={`/alert/${alert._id}`} className="view-link">View</Link></td>
              </tr>
            ))}
             {currentAlerts.length === 0 && (
                <tr>
                    <td colSpan="5" className="no-results">No alerts found matching your criteria.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
