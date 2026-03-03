import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Activity, LogOut, Phone, Clock, Eye, AlertTriangle, TrendingUp, UserCheck, Volume2, VolumeX, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ems-app-e26y.onrender.com';
const API = `${BACKEND_URL}/api`;

// --- Icon Definitions ---
// ... (redIcon, blueIcon definitions remain the same)

export default function EMSDashboard() {
  const navigate = useNavigate();
  const { user, logout, toggleOnDuty } = useAuth();
  const socket = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [responders, setResponders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = useRef(new Audio('/alarm.mp3'));

  useEffect(() => {
    fetchData();
    audioRef.current.loop = false;
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewAlert = (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev]);
        fetchStats();
        if (user?.isOnDuty) {
            toast.info(`New Alert: ${newAlert.incidentType}`, {
                duration: 10000,
                action: { label: 'Stop Alarm', onClick: () => audioRef.current.pause() }
            });
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.warn("Audio blocked", err));
        }
      };

      socket.on('new-alert', handleNewAlert);
      // ... other socket listeners

      return () => socket.off('new-alert', handleNewAlert);
    }
  }, [socket, user?.isOnDuty]);

  // --- Data Fetching & Handlers ---
  // ... (fetchData, fetchStats, etc. remain the same)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-red-50">
      <header> ... </header>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Map */}
          <div className="lg:col-span-7"> ... </div>

          {/* Right Column - Alerts List */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* ... Header and filter */}
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-12">No alerts found</div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredAlerts.map((alert) => (
                    <div key={alert._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      {/* ... Alert details (reporter, phone, etc) */}

                      {/* --- FIX: Display Image Thumbnail --- */}
                      {alert.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                  src={alert.imageUrl}
                                  alt="Incident"
                                  className="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => navigate(`/alert/${alert._id}`)}
                              />
                          </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 my-3">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>

                      {/* ... Action buttons */}
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
