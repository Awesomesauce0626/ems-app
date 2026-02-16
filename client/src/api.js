// This file centralizes the API base URL for the entire application.

// Vite's `import.meta.env.DEV` is used to distinguish between development and production.
// In development (`npm run dev`), we use an empty string for relative paths to work with the Vite proxy.
// In production builds (for Vercel and Capacitor), we use the full, absolute URL of the Render backend.

const API_BASE_URL = import.meta.env.DEV
  ? '' // Use relative paths in development
  : 'https://ems-app-e26y.onrender.com'; // Use the full production URL otherwise

export default API_BASE_URL;
