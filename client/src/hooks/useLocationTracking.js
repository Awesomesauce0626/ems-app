// --- LIVE TRACKING: Custom Hook for tracking and sending location ---

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const useLocationTracking = (user) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();
  const trackingIntervalRef = useRef(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if (!socket) {
        setError('Real-time connection not available.');
        return;
    }

    // Get location once immediately, then start interval
    sendLocation();
    trackingIntervalRef.current = setInterval(sendLocation, 15000); // Send update every 15 seconds
    setIsTracking(true);
    setError(null);
  };

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
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
        // Don't set a state error here as it could be noisy.
        // A dispatcher will simply see the user as offline.
        console.error('Could not get location:', err.message);
      },
      { enableHighAccuracy: true } // Request high accuracy for responders
    );
  };

  // Cleanup on unmount
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
