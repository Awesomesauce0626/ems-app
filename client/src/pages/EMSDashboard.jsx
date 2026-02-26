import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Activity, LogOut, Phone, Clock, Eye, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext'; // Import useSocket
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ems-app-e26y.onrender.com';
const API = `${BACKEND_URL}/api`;

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const StatusBadge = ({ status }) => {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    responding: 'bg-blue-100 text-blue-800 border border-blue-200',
    en_route: 'bg-purple-100 text-purple-800 border border-purple-200',
    completed: 'bg-green-100 text-green-800 border border-green-200'
  };

  const labels = {
    pending: 'Pending',
    responding: 'Responding',
    en_route: 'En Route',
    completed: 'Completed'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[status] || variants.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function EMSDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = useSocket(); // Use the socket from context
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
    // No longer need setInterval, WebSocket will handle updates
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for new alerts
      socket.on('new-alert', (newAlert) => {
        setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
        fetchStats(); // Re-fetch stats when a new alert comes in
        toast.info(`New Alert: ${newAlert.incidentType}`);
      });

      // Listen for status updates
      socket.on('alert-status-update', (updatedAlert) => {
        setAlerts((prevAlerts) =>
          prevAlerts.map(a => a._id === updatedAlert._id ? updatedAlert : a)
        );
        fetchStats(); // Re-fetch stats on status change
      });

      // Listen for archived alerts
      socket.on('alert-archived', ({ alertId }) => {
        setAlerts((prevAlerts) => prevAlerts.filter(a => a._id !== alertId));
        fetchStats(); // Re-fetch stats on archive
      });

      // Clean up listeners
      return () => {
        socket.off('new-alert');
        socket.off('alert-status-update');
        socket.off('alert-archived');
      };
    }
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [alertsRes, statsRes] = await Promise.all([
        axios.get(`${API}/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/alerts/stats/summary`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAlerts(alertsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const statsRes = await axios.get(`${API}/alerts/stats/summary`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(statsRes.data);
  }

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/alerts/${alertId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Alert status updated');
      // No need to manually refetch, WebSocket will update the state
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const filteredAlerts = filterStatus === 'all'
    ? alerts
    : alerts.filter(alert => alert.status === filterStatus);

  const defaultCenter = [14.1093, 122.9558]; // Camarines Norte coordinates

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EE3224] rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">EMS Control Dashboard</h1>
              <p className="text-xs text-gray-600">{user?.name} - {user?.role}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="rounded-full hover:bg-gray-100"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" data-testid="stats-cards">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-700 mb-2">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Responding</p>
              <p className="text-2xl font-bold text-blue-900">{stats.responding}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">En Route</p>
              <p className="text-2xl font-bold text-purple-900">{stats.en_route}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Map */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Alert Map</h2>
              <div className="h-[500px] rounded-lg overflow-hidden" data-testid="map-container">
                <MapContainer
                  center={alerts.length > 0 ? [alerts[0].location.latitude, alerts[0].location.longitude] : defaultCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {alerts.filter(a => a.status !== 'completed').map((alert) => (
                    <Marker
                      key={alert._id}
                      position={[alert.location.latitude, alert.location.longitude]}
                      icon={redIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold text-sm mb-1">{alert.incidentType}</p>
                          <p className="text-xs text-gray-700 mb-1">{alert.reporterName}</p>
                          <p className="text-xs text-gray-700 mb-2">{alert.reporterPhone}</p>
                          <StatusBadge status={alert.status} />
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Right Column - Alerts Table */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">All Alerts</h2>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] rounded-full" data-testid="filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="responding">Responding</SelectItem>
                    <SelectItem value="en_route">En Route</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-12" data-testid="no-alerts-message">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No alerts found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto" data-testid="alerts-list">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      data-testid={`alert-item-${alert._id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{alert.reporterName}</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {alert.reporterPhone}
                          </p>
                        </div>
                        <StatusBadge status={alert.status} />
                      </div>
                      <p className="text-sm font-semibold text-[#EE3224] mb-2">{alert.incidentType}</p>
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{alert.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/alert/${alert._id}`)}
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full text-xs"
                          data-testid={`view-alert-${alert._id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {alert.status !== 'completed' && (
                          <Select
                            value={alert.status}
                            onValueChange={(value) => handleStatusUpdate(alert._id, value)}
                          >
                            <SelectTrigger className="flex-1 rounded-full text-xs" data-testid={`status-select-${alert._id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="responding">Responding</SelectItem>
                              <SelectItem value="en_route">En Route</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
