// --- PUSH NOTIFICATIONS: Frontend Firebase Configuration ---

import { initializeApp } from 'firebase/app';

// IMPORTANT: Replace this with the actual firebaseConfig object from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyAkMBS4lrDemRL1n1rjdkjdmQBLePyrnFQ",
  authDomain: "ems-app-1cb0c.firebaseapp.com",
  projectId: "ems-app-1cb0c",
  storageBucket: "ems-app-1cb0c.firebasestorage.app",
  messagingSenderId: "328469662054",
  appId: "1:328469662054:web:bd539624b2a31048bfa0a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export only the core app instance. The Capacitor plugin will handle messaging.
export { app };
