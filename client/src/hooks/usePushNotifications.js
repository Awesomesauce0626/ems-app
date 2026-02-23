// --- PUSH NOTIFICATIONS: Custom Hook for managing notifications (Capacitor-only Approach) ---

import { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import API_BASE_URL from '../api';

const usePushNotifications = (token) => {
  const [notificationStatus, setNotificationStatus] = useState('default');
  const alarmSound = useMemo(() => new Audio('/alarm.mp3'), []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // For web, check initial permission status.
      // Modern browsers might not allow permission requests outside of a direct user action.
      setNotificationStatus(Notification.permission);
    }

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
  }, [token, alarmSound]); // Add dependencies

  const registerForPushNotifications = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
      }

      await PushNotifications.register();
      setNotificationStatus('granted'); // Update status on successful registration

    } catch (error) {
      console.error('Error during push notification registration:', error);
      alert('Error setting up push notifications. Please try again.');
      setNotificationStatus('denied');
    }
  };

  const sendTokenToServer = async (fcmToken) => {
    if (!token) return; // Ensure user token exists before sending
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/save-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token: fcmToken }),
      });

      if (!res.ok) {
          throw new Error('Failed to send FCM token to server');
      }

      console.log('FCM token sent to server successfully.');
      alert('Push notifications enabled successfully!');
    } catch (error) {
      console.error('Error sending FCM token to server:', error);
    }
  };

  return { requestPermissionAndGetToken: registerForPushNotifications, notificationStatus };
};

export default usePushNotifications;
