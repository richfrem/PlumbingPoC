// server.js (v2.4 - Final version for Netlify)
import express from 'express';
import cors from 'cors';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import triageRoutes from './routes/triageRoutes.js';

// --- Basic Setup ---
const app = express();

// Load environment variables
// In serverless environments, env vars are set externally, so we don't need to load .env files
// Only load .env in local development
if (process.env.NODE_ENV !== 'production') {
  import('dotenv').then(dotenv => {
    // Try to load .env from project root
    try {
      const envPath = path.resolve(process.cwd(), '../../../.env');
      dotenv.config({ path: envPath });
    } catch (error) {
      // Fallback: just load default .env
      dotenv.config();
    }
  }).catch(() => {
    // dotenv not available, continue without it
  });
}

const PORT = process.env.BACKEND_PORT || 3000;

// --- Core Middleware ---

// 1. CORS Middleware
const corsOptions = {
  // Use Netlify's URL in production, or your local .env variable for development
  origin: process.env.VITE_FRONTEND_BASE_URL,
};
app.use(cors(corsOptions));

// 2. Body Parser for JSON payloads
app.use(express.json());

// --- API Routing ---
app.use('/api/requests', requestRoutes);
app.use('/api/follow-up', followUpRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api', userRoutes);


// A simple health check route to ensure the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

// --- Centralized Error Handler ---
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({
    error: 'An unexpected error occurred on the server.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// --- Server Start & Export ---

// Add a simple test route to verify the server is working
app.get('/api/test-server', (req, res) => {
  console.log('🧪 SERVER TEST: /api/test-server endpoint called');
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Export the app for serverless environments
export default app;

// Start the server only if the file is run directly (for local development)
// In ESM, we check if this file is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`API server running on ${process.env.VITE_BACKEND_BASE_URL || `http://localhost:${process.env.BACKEND_PORT}`}`);
  });
}