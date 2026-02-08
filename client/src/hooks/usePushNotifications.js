// --- PUSH NOTIFICATIONS: Custom Hook for managing notifications ---

import { useState, useEffect } from 'react';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import API_BASE_URL from '../api';

const usePushNotifications = (token) => {
  const [notificationStatus, setNotificationStatus] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // This effect should only run once, so we check for permission status
      if (Notification.permission !== 'granted') {
        // If not granted, we don't do anything automatically.
        // We will wait for the user to click a button.
        setNotificationStatus(Notification.permission);
      }
    }
  }, []);

  const requestPermissionAndGetToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === 'granted') {
        // Get the token
        const vapidKey = "BLcbvR8NhergoDnenCdDvLYaUjAwGAH7K8fjWRnldVFmn-FfZD-oxcEexoGzr8AWD6g1wh5n0DGtZ9k0NFurSKU"; // Your VAPID key from Firebase
        const fcmToken = await getToken(messaging, { vapidKey });

        if (fcmToken) {
          // Send the token to the backend
          await sendTokenToServer(fcmToken);
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } else {
        console.log('Permission not granted for Notification');
      }
    } catch (error) {
      console.error('An error occurred while getting token. ', error);
    }
  };

  const sendTokenToServer = async (fcmToken) => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/save-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token: fcmToken }),
      });
    } catch (error) {
      console.error('Error sending FCM token to server:', error);
    }
  };

  return { requestPermissionAndGetToken, notificationStatus };
};

export default usePushNotifications;
