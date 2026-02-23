// --- PUSH NOTIFICATIONS: Custom Hook for managing notifications (Hybrid Approach) ---

import { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import API_BASE_URL from '../api';

const usePushNotifications = (token) => {
  const [notificationStatus, setNotificationStatus] = useState('default');
  const alarmSound = useMemo(() => new Audio('/alarm.mp3'), []);

  // This effect now simply checks the initial permission status for web.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Add all the listeners within a single useEffect to avoid re-registering
      PushNotifications.addListener('registration', async (fcmToken) => {
        console.log('Push registration success, token: ', fcmToken.value);
        await sendTokenToServer(fcmToken.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', JSON.stringify(notification));
        // Play sound on receiving notification, especially when app is in foreground
        alarmSound.play().catch(e => console.error("Error playing sound:", e));
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', JSON.stringify(notification));
        // Here you might want to navigate to a specific screen
        // e.g., navigate(`/alert/${notification.data.alertId}`);
      });

      // Clean up listeners on component unmount
      return () => {
        PushNotifications.removeAllListeners();
      };
    } else {
      setNotificationStatus(Notification.permission);
    }
  }, [token, alarmSound]); // Add dependencies

  const registerForPushNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
      await registerNative();
    } else {
      await registerWeb();
    }
  };

  const registerNative = async () => {
    let permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    } else {
      alert('Push notification permission was denied.');
    }
  };

  const registerWeb = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        const vapidKey = "BLcbvR8NhergoDnenCdDvLYaUjAwGAH7K8fjWRnldVFmn-FfZD-oxcEexoGzr8AWD6g1wh5n0DGtZ9k0NFurSKU";
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
    if (!token) return; // Ensure user token exists before sending
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

  return { requestPermissionAndGetToken: registerForPushNotifications, notificationStatus };
};

export default usePushNotifications;
