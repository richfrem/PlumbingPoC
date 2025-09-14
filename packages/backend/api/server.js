// packages/backend/api/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import triageRoutes from './routes/triageRoutes.js';

// --- Basic Setup ---
const app = express();

// Load environment variables
dotenv.config();

const PORT = process.env.BACKEND_PORT || 3000;

// --- Core Middleware ---
const corsOptions = {
  origin: process.env.VITE_FRONTEND_BASE_URL,
};
app.use(cors(corsOptions));
app.use(express.json());

// --- API Routing ---
app.use('/api/requests', requestRoutes);
app.use('/api/follow-up', followUpRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api', userRoutes);

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
export default app;

// Start the server only if the file is run directly (for local development)
if (import.meta.url.startsWith('file:')) {
  const modulePath = new URL(import.meta.url).pathname;
  if (process.argv[1] === modulePath) {
    app.listen(PORT, () => {
      console.log(`API server running on ${process.env.VITE_FRONTEND_BASE_URL || `http://localhost:${PORT}`}`);
    });
  }
}