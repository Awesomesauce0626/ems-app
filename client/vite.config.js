import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ems-app-e26y.onrender.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['@capacitor-community/background-geolocation'],
    },
  },
});
