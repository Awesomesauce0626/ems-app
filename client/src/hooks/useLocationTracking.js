// --- LIVE TRACKING: Custom Hook for tracking and sending location (Hybrid Approach) ---

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Capacitor } from '@capacitor/core';

// Import the custom plugin bridge
import { registerPlugin } from '@capacitor/core';
const LocationService = registerPlugin('LocationService');

const useLocationTracking = (user) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();
  const trackingIntervalRef = useRef(null);

  const startTracking = () => {
    if (Capacitor.isNativePlatform()) {
      // --- NATIVE MOBILE LOGIC ---
      LocationService.startService();
    } else {
      // --- WEB BROWSER LOGIC ---
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
      }
      if (!socket) {
          setError('Real-time connection not available.');
          return;
      }
      sendLocation();
      trackingIntervalRef.current = setInterval(sendLocation, 15000);
    }
    setIsTracking(true);
    setError(null);
  };

  const stopTracking = () => {
    if (Capacitor.isNativePlatform()) {
      // --- NATIVE MOBILE LOGIC ---
      LocationService.stopService();
    } else {
      // --- WEB BROWSER LOGIC ---
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    }
    setIsTracking(false);
  };

  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = {
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
          },
          location: {
            lat: latitude,
            lng: longitude,
          },
        };
        socket.emit('ems-location-update', locationData);
      },
      (err) => {
        console.error('Could not get location:', err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  return { isTracking, startTracking, stopTracking, error };
};

export default useLocationTracking;
