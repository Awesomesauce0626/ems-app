import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://ems-app-e26y.onrender.com',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
