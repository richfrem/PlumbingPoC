// vite-app/api/routes/userRoutes.js

const express = require('express');
const { updateUserProfile } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
// We don't need a specific Zod schema here because the `update` is flexible,
// but for production, you would add one to validate the incoming fields.

const router = express.Router();

// A user can update their own profile. The `authenticate` middleware provides the user context.
// We use PUT because we are replacing/updating the entire profile resource from the user's perspective.
router.put('/profile', authenticate, updateUserProfile);

module.exports = router;