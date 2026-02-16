import { Capacitor } from '@capacitor/core';

// This file centralizes the API base URL for the entire application.

// Use Capacitor's platform check to determine the correct URL.
// On native mobile, we need the full, absolute URL.
// On the web, we use a relative path to leverage the Vite proxy for development.

const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://ems-app-e26y.onrender.com'
  : '/api';

export default API_BASE_URL;
