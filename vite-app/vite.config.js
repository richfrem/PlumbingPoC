import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import path module

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file based on the current mode
  const env = loadEnv(mode, path.resolve(process.cwd(), 'vite-app'), ''); // Load all env variables from vite-app directory

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': (env.VITE_BACKEND_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
      }
    }
  };
});