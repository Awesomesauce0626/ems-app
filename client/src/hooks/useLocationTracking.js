import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { useSocket } from '../context/SocketContext';

const useLocationTracking = (user) => {
  const [isTracking, setIsTracking] = useState(() => {
    // Initialize state from localStorage
    return localStorage.getItem('isTracking') === 'true';
  });
  const [error, setError] = useState(null);
  const watchId = useRef(null);
  const socket = useSocket();

  const sendLocation = useCallback(async () => {
    if (!socket || !user) return;

    try {
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const locationData = { userId: user._id, lat: latitude, lng: longitude };
      socket.emit('ems-location-update', locationData);
    } catch (e) {
      setError(e.message);
      console.error('Error getting location for sending:', e);
    }
  }, [socket, user]);

  const startTracking = useCallback(async () => {
    if (watchId.current !== null) return; // Already tracking

    try {
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('Location permission not granted.');
      }

      setIsTracking(true);
      localStorage.setItem('isTracking', 'true');
      sendLocation(); // Send initial location immediately

      watchId.current = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
        (position, err) => {
          if (err) {
            setError(err.message);
            console.error('Error watching position:', err);
            return;
          }
          if (socket && user && position) {
            const { latitude, longitude } = position.coords;
            socket.emit('ems-location-update', { userId: user._id, lat: latitude, lng: longitude });
          }
        }
      );
    } catch (e) {
      setError(e.message);
      console.error('Could not start location tracking:', e);
    }
  }, [sendLocation, socket, user]);

  const stopTracking = useCallback(async () => {
    if (watchId.current !== null) {
      await Geolocation.clearWatch({ id: watchId.current });
      watchId.current = null;
    }
    setIsTracking(false);
    localStorage.setItem('isTracking', 'false');
    if (socket && user) {
      socket.emit('ems-go-off-duty', { userId: user._id });
    }
  }, [socket, user]);

  // This effect will run once on component mount and handle the initial state.
  useEffect(() => {
    if (isTracking) {
      startTracking();
    }
    // This cleanup is important for when the component unmounts.
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch({ id: watchId.current });
      }
    };
  }, [isTracking, startTracking]);

  return { isTracking, error, startTracking, stopTracking };
};

export default useLocationTracking;
