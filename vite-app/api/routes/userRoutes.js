// vite-app/api/routes/userRoutes.js

const express = require('express');
const { updateUserProfile, createUserProfile, getUserProfile } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
// We don't need a specific Zod schema here because the `update` is flexible,
// but for production, you would add one to validate the incoming fields.

const router = express.Router();

// Get the profile for the authenticated user
router.get('/profile', authenticate, getUserProfile);

// Create a new profile for the authenticated user
router.post('/profile', authenticate, createUserProfile);

// Update an existing profile for the authenticated user
router.put('/profile', authenticate, updateUserProfile);

module.exports = router;