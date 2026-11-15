import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Node's env without @types/node (this project has none).
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

// Dev: /api is proxied to the local API (API_PROXY overrides it). Builds set VITE_API_BASE to the API's absolute origin instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      '/api': env.API_PROXY ?? 'http://localhost:5003',
    },
  },
});
