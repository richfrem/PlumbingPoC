// packages/backend/api/routes/followUpRoutes.js

import express from 'express';
import { sendFollowUpEmails } from '../controllers/followUpController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/follow-up/send
// @desc    Send follow-up emails to customers with quoted requests
// @access  Admin
router.post('/send', authenticate, isAdmin, sendFollowUpEmails);

export default router;
