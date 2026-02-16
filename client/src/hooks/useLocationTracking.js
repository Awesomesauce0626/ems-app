import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Capacitor } from '@capacitor/core';
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';

const useLocationTracking = (user) => {
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('isOnDuty') === 'true');
  const [error, setError] = useState(null);
  const socket = useSocket();
  const watcherId = useRef(null);

  useEffect(() => {
    localStorage.setItem('isOnDuty', isTracking);

    if (isTracking && user) {
      if (Capacitor.isNativePlatform()) {
        // Use the community plugin for native background tracking
        configureAndStartNativeTracking();
      } else {
        // Fallback for web browsers
        startWebTracking();
      }
    } else {
      if (Capacitor.isNativePlatform()) {
        stopNativeTracking();
      } else {
        stopWebTracking();
      }
    }

    return () => {
        // Cleanup function
        if (Capacitor.isNativePlatform()) {
            stopNativeTracking();
        } else {
            stopWebTracking();
        }
    };
  }, [isTracking, socket, user]);

  const configureAndStartNativeTracking = async () => {
    try {
        await BackgroundGeolocation.addWatcher(
            {
                backgroundMessage: "PRC-EMS is tracking your location to respond to emergencies.",
                backgroundTitle: "On Duty",
                requestPermissions: true,
                stale: false,
                distanceFilter: 10 // In meters
            },
            (location, error) => {
                if (error) {
                    console.error("[ERROR] BackgroundGeolocation: ", error);
                    setError(error.message);
                    return;
                }
                if (location) {
                    sendLocation(location);
                }
            }
        ).then(id => {
            watcherId.current = id;
            console.log("Started background location watcher.");
        });
    } catch (e) {
        console.error("[ERROR] Starting background watcher failed: ", e);
        setError(e.message);
    }
  };

  const stopNativeTracking = () => {
    if (watcherId.current) {
        BackgroundGeolocation.removeWatcher({ id: watcherId.current });
        watcherId.current = null;
        console.log("Stopped background location watcher.");
    }
  };

  const startWebTracking = () => {
      if (!navigator.geolocation || !socket) return;
      sendWebLocation(); // Send immediately
      watcherId.current = setInterval(sendWebLocation, 15000); // 15 seconds
  };

  const stopWebTracking = () => {
      if(watcherId.current) {
          clearInterval(watcherId.current)
      }
  }

  const sendWebLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => sendLocation(position.coords),
      (err) => console.error('Could not get web location:', err.message),
      { enableHighAccuracy: true }
    );
  };


  const sendLocation = (coords) => {
    const { latitude, longitude } = coords;
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
      console.log("Sent location update via socket: ", locationData);
    } else {
        console.error("Socket not connected. Cannot send location.");
    }
  };

  const startTracking = () => setIsTracking(true);
  const stopTracking = () => setIsTracking(false);

  return { isTracking, startTracking, stopTracking, error };
};

export default useLocationTracking;
