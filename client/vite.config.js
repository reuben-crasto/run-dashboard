import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For local dev, run `vercel dev` (port 3000) alongside `npm run dev:client`.
// All /api calls are proxied to vercel dev which serves the serverless functions.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
