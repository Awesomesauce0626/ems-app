import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, user: adminUser, logout } = useAuth(); // Get the logged-in admin's user object

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch users');
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [token]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error('Failed to update role');
            setUsers(users.map(user => user._id === userId ? { ...user, role: newRole } : user));
            alert('User role updated successfully!');
        } catch (err) {
            setError(err.message);
        }
    };

    // --- NEW FEATURE: Handle user deletion ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) {
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const resData = await res.json();
            if (!res.ok) {
                throw new Error(resData.message || 'Failed to delete user.');
            }

            // Remove user from the list to update UI
            setUsers(users.filter(user => user._id !== userId));
            alert(resData.message);

        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="admin-loading">Loading users...</div>;

    return (
        <div className="admin-dashboard-container">
            <header className="admin-header">
                <Link to="/" className="header-logo-link">
                    <img src="/prc-logo.png" alt="PRC Logo" />
                    <span>Admin Dashboard</span>
                </Link>
                <nav className="admin-nav">
                    <Link to="/dashboard/ems" className="nav-link">EMS Dashboard</Link>
                    <Link to="/dashboard/citizen" className="nav-link">Citizen Dashboard</Link>
                    <button onClick={logout} className="nav-link logout-btn">Logout</button>
                </nav>
            </header>

            {error && <div className="admin-error">Error: {error}</div>}

            <div className="user-table-container">
                <h2 className="table-header">User Management</h2>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Current Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td className="action-cell">
                                    <select
                                        defaultValue={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        className="role-select"
                                        disabled={user.email === 'i.am.sam052408@gmail.com'}
                                    >
                                        <option value="citizen">Citizen</option>
                                        <option value="ems_personnel">EMS Personnel</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {/* --- NEW FEATURE: Delete Button --- */}
                                    <button
                                        onClick={() => handleDeleteUser(user._id)}
                                        className="delete-user-btn"
                                        disabled={user._id === adminUser.id || user.email === 'i.am.sam052408@gmail.com'} // Disable for self and super admin
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
