import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file based on the current mode
  const env = loadEnv(mode, process.cwd(), ''); // Load all env variables

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': env.BACKEND_BASE_URL.replace(/\/$/, '') // Use env.BACKEND_BASE_URL
      }
    }
  };
});
