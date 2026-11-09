import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: /api is proxied to the local API. Builds set VITE_API_BASE to the API's absolute origin instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      '/api': 'http://localhost:5003',
    },
  },
});
