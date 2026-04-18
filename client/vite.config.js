import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api and /auth to the Express server so the client can make same-origin calls in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001',
    },
  },
});
