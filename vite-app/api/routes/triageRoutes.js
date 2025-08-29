// vite-app/api/routes/triageRoutes.js

const express = require('express');
const router = express.Router();
const { triageRequest } = require('../controllers/triageController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   POST /api/triage/:requestId
// @desc    Perform AI-powered triage on a request
// @access  Admin
router.post('/:requestId', authMiddleware, adminMiddleware, triageRequest);

module.exports = router;
