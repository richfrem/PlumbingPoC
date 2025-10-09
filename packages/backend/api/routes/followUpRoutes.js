// packages/backend/api/routes/followUpRoutes.js
//
// FOLLOW-UP ROUTES - Automated Customer Communication
//
// This file defines routes for automated follow-up email campaigns to customers
// with outstanding quotes, helping improve response rates and conversion.
//
// ARCHITECTURE:
// - Single POST endpoint to trigger follow-up campaigns
// - Admin-only access for controlled execution
// - Processes all requests in 'quoted' status
// - Sends personalized emails via Resend service
//
// DEPLOYMENT:
// - In development: runs as Express server at http://localhost:3000/api/follow-up/*
// - In production: deployed as Netlify Function via /.netlify/functions/api/*
// - Mounted at '/api/follow-up' in server.js
//
// EMAIL CAMPAIGN LOGIC:
// - Finds all requests with status='quoted' (customer has quote but hasn't responded)
// - Sends follow-up emails with quote details and call-to-action
// - Tracks email delivery and engagement
// - Updates request records with follow-up timestamps
//
// INTEGRATIONS:
// - Resend API for email delivery (RESEND_API_KEY required)
// - Email templates defined in packages/backend/api/services/email/resend/client.js
// - SMS notifications may be sent alongside emails
//
// SECURITY:
// - Requires admin authentication
// - Should be rate-limited to prevent spam
// - Email content is templated and safe

import express from 'express';
import { sendFollowUpEmails } from '../controllers/followUpController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/follow-up/send
// @desc    Send follow-up emails to customers with quoted requests
// @access  Admin
router.post('/send', authenticate, isAdmin, sendFollowUpEmails);

export default router;
