import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import path module

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file based on the current mode
  const env = loadEnv(mode, path.resolve(process.cwd(), 'vite-app'), ''); // Load all env variables from vite-app directory

  // Check if we're running under Netlify dev (which handles API routing itself)
  const isNetlifyDev = process.env.NETLIFY_DEV || process.env.NETLIFY;

  return {
    plugins: [react()],
    server: {
      proxy: isNetlifyDev ? undefined : {
        '/api': (env.VITE_BACKEND_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
      }
    }
  };
});