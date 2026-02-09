// --- PUSH NOTIFICATIONS: Custom Hook for managing notifications (Hybrid Approach) ---

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import API_BASE_URL from '../api';

const usePushNotifications = (token) => {
  const [notificationStatus, setNotificationStatus] = useState('default');

  // This effect now simply checks the initial permission status for web.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const registerForPushNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
      // --- NATIVE MOBILE LOGIC ---
      await registerNative();
    } else {
      // --- WEB BROWSER LOGIC ---
      await registerWeb();
    }
  };

  const registerNative = async () => {
    // Request permission to use push notifications
    let permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') {
      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();
    } else {
      alert('Push notification permission was denied.');
    }

    // Add listeners
    PushNotifications.addListener('registration', async (fcmToken) => {
      console.log('Push registration success, token: ', fcmToken.value);
      await sendTokenToServer(fcmToken.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ', JSON.stringify(error));
    });
  };

  const registerWeb = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === 'granted') {
        const vapidKey = "BLcbvR8NhergoDnenCdDvLYaUjAwGAH7K8fjWRnldVFmn-FfZD-oxcEexoGzr8AWD6g1wh5n0DGtZ9k0NFurSKU"; // Replace with your actual VAPID key
        const fcmToken = await getToken(messaging, { vapidKey });

        if (fcmToken) {
          await sendTokenToServer(fcmToken);
        } else {
          console.log('No registration token available.');
        }
      }
    } catch (error) {
      console.error('An error occurred while getting web token. ', error);
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
      alert('Push notifications enabled successfully!');
    } catch (error) {
      console.error('Error sending FCM token to server:', error);
    }
  };

  // Return a single registration function
  return { registerForPushNotifications, notificationStatus };
};

export default usePushNotifications;
