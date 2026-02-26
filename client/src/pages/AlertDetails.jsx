import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Phone, User, Calendar, MapPin, Activity, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${variants[status] || variants.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function AlertDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlert();
  }, [id]);

  const fetchAlert = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlert(response.data);
    } catch (error) {
      console.error('Error fetching alert:', error);
      toast.error('Failed to fetch alert details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (user?.role === 'ems_personnel' || user?.role === 'admin') {
      navigate('/ems-dashboard');
    } else {
      navigate('/citizen-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading alert details...</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Alert not found</p>
          <Button onClick={handleBack} className="rounded-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="mb-6 hover:bg-gray-100 rounded-full"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-8" data-testid="alert-details">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Alert Details</h1>
              <p className="text-gray-600">Alert ID: {alert._id}</p>
            </div>
            <StatusBadge status={alert.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-[#EE3224]" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Patient Name</p>
                        <p className="text-base text-gray-900 font-semibold">{alert.reporterName}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-[#EE3224]" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact Number</p>
                        <a href={`tel:${alert.reporterPhone}`} className="text-base text-[#EE3224] font-semibold hover:underline">{alert.reporterPhone}</a>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-[#EE3224]" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Time Reported</p>
                        <p className="text-base text-gray-900 font-semibold">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><Activity className="w-5 h-5 text-[#EE3224]" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Emergency Type</p>
                        <p className="text-base text-gray-900 font-semibold">{alert.incidentType}</p>
                        <p className="text-sm text-gray-700">Patients: {alert.patientCount}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-[#EE3224]" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Description</p>
                        <p className="text-base text-gray-900">{alert.description || 'None reported'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-[#EE3224]" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Location</p>
                        <p className="text-sm text-gray-700">{alert.location.address}</p>
                    </div>
                </div>
            </div>
          </div>

          {alert.imageUrl && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">Attached Incident Photo</p>
                <div className="relative">
                    <img src={alert.imageUrl} alt="Incident" className="rounded-lg max-w-full h-auto shadow-md" />
                    <a href={alert.imageUrl} target="_blank" rel="noopener noreferrer" download>
                      <Button size="sm" className="absolute top-2 right-2 rounded-full">
                        <Download className="w-4 h-4 mr-2"/> View Full Size
                      </Button>
                    </a>
                </div>
            </div>
          )}

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="h-[400px]" data-testid="alert-map">
              <MapContainer
                center={[alert.location.latitude, alert.location.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker
                  position={[alert.location.latitude, alert.location.longitude]}
                  icon={redIcon}
                />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
