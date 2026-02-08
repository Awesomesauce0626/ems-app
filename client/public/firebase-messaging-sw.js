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

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/prc-logo.png' // The icon to display in the notification
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
