import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Activity, LogOut, Siren, Clock, CheckCircle, AlertTriangle, Eye, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
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

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  useEffect(() => {
    if (socket && user) {
      const currentUserId = user.id || user._id;

      socket.on('new-alert', (newAlert) => {
          const alertUserId = newAlert.userId?._id || newAlert.userId;
          if (alertUserId === currentUserId) {
            setAlerts((prev) => [newAlert, ...prev]);
          }
      });

      socket.on('alert-status-update', (updatedAlert) => {
          setAlerts((prev) => prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a)));
      });

      socket.on('alert-archived', ({ alertId }) => {
          setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      });

      return () => {
        socket.off('new-alert');
        socket.off('alert-status-update');
        socket.off('alert-archived');
      };
    }
  }, [socket, user]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUserId = user.id || user._id;
      setAlerts(response.data.filter(alert => (alert.userId?._id || alert.userId) === currentUserId));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const defaultCenter = [14.1093, 122.9558];

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
              <h1 className="text-lg font-bold text-gray-900">Citizen Dashboard</h1>
              <p className="text-xs text-gray-600">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="rounded-full hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Alerts</h2>
              <Button
                onClick={() => navigate('/quick-alert')}
                className="rounded-full bg-[#EE3224] hover:bg-[#D92015] text-white"
              >
                <Siren className="w-4 h-4 mr-2" />
                New Alert
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No alerts yet</p>
                <Button variant="link" onClick={() => navigate('/quick-alert')} className="text-[#EE3224] font-bold">Create your first emergency alert</Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => navigate(`/alert/${alert._id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Siren className="w-5 h-5 text-[#EE3224]" />
                        <span className="font-bold text-gray-900">{alert.incidentType}</span>
                      </div>
                      <StatusBadge status={alert.status} />
                    </div>

                    {/* IMAGE THUMBNAIL */}
                    {alert.imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 h-32">
                            <img src={alert.imageUrl} alt="Incident" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                    )}

                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400"/>
                        {alert.location?.address}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Alert Locations</h2>
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-100" data-testid="map-container">
                <MapContainer
                  center={alerts.length > 0 ? [alerts[0].location.latitude, alerts[0].location.longitude] : defaultCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {alerts.map((alert) => (
                    <Marker
                      key={alert._id}
                      position={[alert.location.latitude, alert.location.longitude]}
                      icon={redIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold text-sm mb-1">{alert.incidentType}</p>
                          <p className="text-xs text-gray-700 mb-2">{alert.location.address}</p>
                          <StatusBadge status={alert.status} />
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
