// packages/backend/api/routes/triageRoutes.js

import express from 'express';
import { triageRequest } from '../controllers/triageController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/triage/:requestId
// @desc    Perform AI-powered triage on a request
// @access  Admin
router.post('/:requestId', authenticate, isAdmin, triageRequest);

export default router;
