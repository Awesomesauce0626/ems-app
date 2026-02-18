import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const useLocationTracking = (user) => {
  // Initialize state from localStorage or default to false
  const [isTracking, setIsTracking] = useState(() => {
    const savedIsTracking = localStorage.getItem('isTracking');
    return savedIsTracking ? JSON.parse(savedIsTracking) : false;
  });

  const socket = useSocket();
  const trackingIntervalRef = useRef(null);

  useEffect(() => {
    // Save state to localStorage whenever it changes
    localStorage.setItem('isTracking', JSON.stringify(isTracking));

    if (isTracking) {
      if (!navigator.geolocation || !socket) {
        return;
      }
      sendLocation();
      trackingIntervalRef.current = setInterval(sendLocation, 15000); // 15 seconds
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    }

    // Cleanup function to clear interval on component unmount or when tracking stops
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
        if (!user || !socket?.connected) return;
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

  return { isTracking, startTracking, stopTracking };
};

export default useLocationTracking;
