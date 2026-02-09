// --- PUSH NOTIFICATIONS: Custom Hook for managing notifications ---

import { useState, useEffect } from 'react';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import API_BASE_URL from '../api';

const usePushNotifications = (token) => {
  const [notificationStatus, setNotificationStatus] = useState('default');

  useEffect(() => {
    // --- MOBILE FIX: Add more robust check for Notification API support ---
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.Notification
    ) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const requestPermissionAndGetToken = async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support desktop notification');
      alert('This browser does not support desktop notification');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // TODO: Get the VAPID key from Firebase Console.
        const vapidKey = "YOUR_VAPID_KEY_HERE";
        const fcmToken = await getToken(messaging, { vapidKey });

        if (fcmToken) {
          console.log('FCM Token:', fcmToken);
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
      console.log('FCM token sent to server successfully.');
    } catch (error) {
      console.error('Error sending FCM token to server:', error);
    }
  };

  return { requestPermissionAndGetToken, notificationStatus };
};

export default usePushNotifications;
