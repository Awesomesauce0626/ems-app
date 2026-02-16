// --- PUSH NOTIFICATIONS: Service Worker ---
// This file runs in the background and is responsible for handling incoming push messages.

// Import the Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// IMPORTANT: You must copy your firebaseConfig object here from your firebase.js file
// It cannot use ES6 modules, so we must define it manually.
const firebaseConfig = {
  apiKey: "AIzaSyAkMBS4lrDemRL1n1rjdkjdmQBLePyrnFQ",
  authDomain: "ems-app-1cb0c.firebaseapp.com",
  projectId: "ems-app-1cb0c",
  storageBucket: "ems-app-1cb0c.firebasestorage.app",
  messagingSenderId: "328469662054",
  appId: "1:328469662054:web:bd539624b2a31048bfa0a7"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Check for our custom sound data
  const isAlarm = payload.data && payload.data.sound === 'alarm';

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/prc-logo.png', // The icon to display in the notification
    // --- FINAL ENHANCEMENT: Make notification more persistent ---
    requireInteraction: true, // Requires user to interact to dismiss
    renotify: true,           // Notifies user even if a notification is already visible
    tag: 'ems-alert'          // Groups notifications together
  };

  if (isAlarm) {
    // This is a crude way to play a sound in a service worker.
    // A more robust solution might use a dedicated audio file.
    // NOTE: Autoplay policies might prevent this from working on all browsers/devices.
    const audio = new Audio('/sounds/alarm.mp3'); // ASSUMES you have alarm.mp3 in /public/sounds/
    audio.play().catch(e => console.error("Error playing sound:", e));
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
