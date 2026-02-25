import { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import API_BASE_URL from '../api';

const usePushNotifications = (token) => {
  const [notificationStatus, setNotificationStatus] = useState(() => {
    // Check localStorage for the persistent status
    return localStorage.getItem('notificationStatus') || 'default';
  });
  const alarmSound = useMemo(() => new Audio('/alarm.mp3'), []);

  useEffect(() => {
    if (token) { // Only run if the user is logged in
      // Always try to register for push on app start if permission was previously granted.
      if (notificationStatus === 'granted') {
        registerForPushNotifications();
      }

      // Add listeners for foreground notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received in foreground: ', notification);
        alarmSound.play().catch(e => console.error("Error playing sound:", e));
      });

      // Clean up listeners on component unmount
      return () => {
        PushNotifications.removeAllListeners('pushNotificationReceived');
      };
    }
  }, [token, notificationStatus, alarmSound]); // Rerun if status changes

  const registerForPushNotifications = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
      }

      // On successful permission, register with FCM and get the token
      await PushNotifications.register();

      // Listen for the registration success event
      PushNotifications.addListener('registration', async (fcmToken) => {
        console.log('Push registration success, token: ', fcmToken.value);
        await sendTokenToServer(fcmToken.value);
        // Persist the granted status
        setNotificationStatus('granted');
        localStorage.setItem('notificationStatus', 'granted');
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', JSON.stringify(error));
        setNotificationStatus('denied');
        localStorage.setItem('notificationStatus', 'denied');
      });

    } catch (error) {
      console.error('Error during push notification registration:', error);
      alert('Error setting up push notifications. Please try again.');
      setNotificationStatus('denied');
      localStorage.setItem('notificationStatus', 'denied');
    }
  };

  const sendTokenToServer = async (fcmToken) => {
    if (!token) return;
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
    } catch (error) {
      console.error('Error sending FCM token to server:', error);
    }
  };

  return { requestPermissionAndGetToken: registerForPushNotifications, notificationStatus };
};

export default usePushNotifications;
