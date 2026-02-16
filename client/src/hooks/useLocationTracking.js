import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

// A simple, web-only location tracking hook. THIS DOES NOT USE NATIVE PLUGINS.
const useLocationTracking = (user) => {
  const [isTracking, setIsTracking] = useState(false);
  const socket = useSocket();
  const trackingIntervalRef = useRef(null);

  useEffect(() => {
    if (isTracking) {
      if (!navigator.geolocation || !socket) {
        return;
      }
      sendLocation();
      trackingIntervalRef.current = setInterval(sendLocation, 15000);
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking, socket, user]);

  const startTracking = () => setIsTracking(true);
  const stopTracking = () => setIsTracking(false);

  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!user) return;
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
        if (socket?.connected) {
          socket.emit('ems-location-update', locationData);
        }
      },
      (err) => {
        console.error('Could not get location:', err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  return { isTracking, startTracking, stopTracking };
};

export default useLocationTracking;
