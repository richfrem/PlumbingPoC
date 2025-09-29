// packages/backend/api/routes/triageRoutes.js
//
// TRIAGE ROUTES - AI-Powered Request Analysis
//
// This file defines routes for AI-powered triage functionality that analyzes
// plumbing requests to generate priority scores and profitability assessments.
//
// ARCHITECTURE:
// - Single POST endpoint for request triage
// - Admin-only access to prevent abuse
// - Calls OpenAI API for intelligent analysis
// - Updates request records with AI-generated scores
//
// DEPLOYMENT:
// - In development: runs as Express server at http://localhost:3000/api/triage/*
// - In production: deployed as Netlify Function via /.netlify/functions/api/*
// - Mounted at '/api/triage' in server.js
//
// AI ANALYSIS:
// - Analyzes problem descriptions, categories, and customer info
// - Generates priority scores (1-10) for urgency ranking
// - Provides profitability assessments for business decisions
// - Stores results in request.triage_summary, priority_score, profitability_score
//
// SECURITY:
// - Requires admin authentication
// - Rate limiting should be considered for production use
// - OpenAI API key required in environment variables

import express from 'express';
import { triageRequest } from '../controllers/triageController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/triage/:requestId
// @desc    Perform AI-powered triage on a request
// @access  Admin
router.post('/:requestId', authenticate, isAdmin, triageRequest);

export default router;
