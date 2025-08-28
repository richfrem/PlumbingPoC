// server.js (v2.1 - Refactored for Scalability with MVC Pattern)
/*
This is the new, streamlined main server file. Its only job is to configure 
the application, load the necessary middleware, and delegate routing to the 
dedicated route files.
*/
const express = require('express');
const cors = require('cors');
const path = require('path');
const requestRoutes = require('./routes/requestRoutes'); // <-- Import the new router
const userRoutes = require('./routes/userRoutes'); // <-- IMPORT THE NEW USER ROUTER

// --- Basic Setup ---
const app = express();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const PORT = process.env.BACKEND_PORT || 3000;

// --- Core Middleware ---

// 1. CORS Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-frontend-domain.com' // TODO: Replace with your actual frontend URL
    : `http://localhost:${process.env.FRONTEND_PORT || 5173}`,
};
app.use(cors(corsOptions));

// 2. Body Parser for JSON payloads
app.use(express.json());

// --- API Routing ---

// Delegate all routes starting with '/api/requests' to our new router file
app.use('/api/requests', requestRoutes);

// ***************************************************************
// ************************* THE FIX *****************************
// ***************************************************************
// Mount the user routes directly at /api, so that the paths become
// /api/profile instead of /api/users/profile. This matches the frontend.
app.use('/api', userRoutes); 
// ***************************************************************
// ***************************************************************

// A simple health check route to ensure the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

// --- Centralized Error Handler ---
// This should be the LAST piece of middleware.
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({
    error: 'An unexpected error occurred on the server.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`API server v2.1 running on http://localhost:${PORT}`);
});