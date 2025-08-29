// vite-app/api/routes/triageRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/triageController');
console.log('triageController export:', controller);
const { triageRequest } = controller;
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// @route   POST /api/triage/:requestId
// @desc    Perform AI-powered triage on a request
// @access  Admin
router.post('/:requestId', authenticate, isAdmin, triageRequest);

module.exports = router;
