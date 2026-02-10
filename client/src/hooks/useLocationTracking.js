// --- LIVE TRACKING: Custom Hook for tracking and sending location (Hybrid & Persistent) ---

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Capacitor } from '@capacitor/core';

import { registerPlugin } from '@capacitor/core';
const LocationService = registerPlugin('LocationService');

const useLocationTracking = (user) => {
  // --- PERSISTENCE FIX: Initialize state from localStorage ---
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('isOnDuty') === 'true');
  const [error, setError] = useState(null);
  const socket = useSocket();
  const trackingIntervalRef = useRef(null);

  // --- PERSISTENCE FIX: Sync state to localStorage whenever it changes ---
  useEffect(() => {
    localStorage.setItem('isOnDuty', isTracking);

    if (isTracking) {
      if (Capacitor.isNativePlatform()) {
        LocationService.startService();
      } else {
        if (!navigator.geolocation || !socket) return;
        sendLocation(); // Send immediately
        trackingIntervalRef.current = setInterval(sendLocation, 15000);
      }
    } else {
      if (Capacitor.isNativePlatform()) {
        LocationService.stopService();
      } else {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
        }
      }
    }

    // Cleanup interval on component unmount
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking, socket, user]);

  // The public functions to be called by the button
  const startTracking = () => setIsTracking(true);
  const stopTracking = () => setIsTracking(false);

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
        if(socket?.connected) {
            socket.emit('ems-location-update', locationData);
        }
      },
      (err) => {
        console.error('Could not get location:', err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  return { isTracking, startTracking, stopTracking, error };
};

export default useLocationTracking;
