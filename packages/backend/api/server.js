// packages/backend/api/server.js (v4.3 - Serverless Clean)
import express from 'express';
import cors from 'cors';

// This is the ONLY place dotenv is configured. It is safe here.
// Netlify provides process.env, so this call is effectively ignored in production.
// Locally, it loads the .env file as needed.
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import triageRoutes from './routes/triageRoutes.js';

const app = express();

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

// The serverless wrapper will import this `app` object.
export default app;