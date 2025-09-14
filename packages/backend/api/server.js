// packages/backend/api/server.js (v4.1 - Centralized Config)
import express from 'express';
import cors from 'cors';

// This is the ONLY place where we check the environment.
if (!process.env.NETLIFY) {
  // If we are NOT on Netlify, we are running locally.
  // Therefore, we need to load variables from the .env file.
  const dotenv = await import('dotenv');
  dotenv.config({ path: '../../.env' }); // Be explicit about the path from this file's location
}

// All subsequent imports will now have access to process.env variables,
// whether they were injected by Netlify or loaded by dotenv.
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import triageRoutes from './routes/triageRoutes.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

const corsOptions = {
  origin: process.env.VITE_FRONTEND_BASE_URL,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/requests', requestRoutes);
app.use('/api/follow-up', followUpRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({
    error: 'An unexpected error occurred on the server.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;

// The local startup block is now extremely simple.
if (import.meta.url.startsWith('file:')) {
  const modulePath = new URL(import.meta.url).pathname;
  if (process.argv[1] === modulePath) {
    app.listen(PORT, () => {
      console.log(`LOCAL DEV: API server running on http://localhost:${PORT}`);
    });
  }
}