// server.js (v2.4 - Final version for Netlify)
const express = require('express');
const cors = require('cors');
const path = require('path');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
// const followUpRoutes = require('./routes/followUpRoutes');
const triageRoutes = require('./routes/triageRoutes');

// --- Basic Setup ---
const app = express();
// Load .env file from the 'vite-app' directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const PORT = process.env.BACKEND_PORT || 3000;

// --- Core Middleware ---

// 1. CORS Middleware
const corsOptions = {
  // Use Netlify's URL in production, or your local .env variable for development
  origin: process.env.URL || process.env.FRONTEND_BASE_URL,
};
app.use(cors(corsOptions));

// 2. Body Parser for JSON payloads
app.use(express.json());

// --- API Routing ---
app.use('/api/requests', requestRoutes);
// app.use('/api/follow-up', followUpRoutes);
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

// Export the app for serverless environments
module.exports = app;

// Start the server only if the file is run directly (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API server running on ${process.env.BACKEND_BASE_URL || `http://localhost:${PORT}`}`);
  });
}