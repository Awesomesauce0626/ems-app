// This file centralizes the API base URL for the entire application.

// During the build process, Vite will replace `import.meta.env.VITE_API_BASE_URL`
// with the value you set in your Vercel environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default API_BASE_URL;
