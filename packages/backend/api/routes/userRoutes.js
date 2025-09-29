// packages/backend/api/routes/userRoutes.js
//
// USER ROUTES - Customer Profile Management
//
// This file defines routes for managing user profiles in the plumbing quote system.
// Handles customer information storage, updates, and retrieval for personalized service.
//
// ARCHITECTURE:
// - RESTful CRUD operations for user profiles
// - User-scoped access (users can only manage their own profiles)
// - Flexible profile updates without strict schema validation
// - Integration with Supabase auth system
//
// DEPLOYMENT:
// - In development: runs as Express server at http://localhost:3000/api/users/*
// - In production: deployed as Netlify Function via /.netlify/functions/api/*
// - Mounted at '/api/users' in server.js
//
// PROFILE DATA:
// - Stores customer contact information (name, email, phone, address)
// - Geographic data for service area calculations
// - User preferences and account settings
// - Links to Supabase auth.users table via user_id
//
// SECURITY:
// - All routes require user authentication
// - Users can only access/modify their own profile data
// - No admin routes (self-service only)
// - Input validation recommended for production
//
// DATABASE:
// - user_profiles table in Supabase
// - Foreign key relationship to auth.users
// - Optional fields allow flexible profile completion

import express from 'express';
import { updateUserProfile, createUserProfile, getUserProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
// We don't need a specific Zod schema here because the `update` is flexible,
// but for production, you would add one to validate the incoming fields.

const router = express.Router();

// Get the profile for the authenticated user
router.get('/profile', authenticate, getUserProfile);

// Create a new profile for the authenticated user
router.post('/profile', authenticate, createUserProfile);

// Update an existing profile for the authenticated user
router.put('/profile', authenticate, updateUserProfile);

export default router;