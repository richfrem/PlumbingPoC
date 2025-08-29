// vite-app/api/routes/followUpRoutes.js

const express = require('express');
const router = express.Router();
const { sendFollowUpEmails } = require('../controllers/followUpController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   POST /api/follow-up/send
// @desc    Send follow-up emails to customers with quoted requests
// @access  Admin
router.post('/send', authMiddleware, adminMiddleware, sendFollowUpEmails);

module.exports = router;
