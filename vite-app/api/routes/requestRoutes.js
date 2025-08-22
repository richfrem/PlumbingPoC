// /routes/requestRoutes.js
/*
This file defines all your API endpoints. Notice how clean it is. 
Each route clearly states its path, any middleware it needs 
(like authenticate or isAdmin), and which controller function 
will handle the request.
*/
const express = require('express');
const multer = require('multer');
const {
  getGptFollowUp,
  submitQuoteRequest,
  uploadAttachment,
  getStorageObject,
  addRequestNote,
  createQuoteForRequest,
} = require('../controllers/requestController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware'); // We will create this next
const {
  gptRequestSchema,
  submitQuoteSchema,
  addNoteSchema,
  createQuoteSchema,
  getObjectSchema,
} = require('../validation/schemas');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Core Quote Intake Routes ---

// Get AI follow-up questions
router.post('/gpt-follow-up', authenticate, validate(gptRequestSchema), getGptFollowUp);

// Submit the final, completed quote request form
router.post('/submit', authenticate, validate(submitQuoteSchema), submitQuoteRequest);

// Upload a file attachment for a request
router.post('/attachments', authenticate, upload.single('attachment'), uploadAttachment);

// Get a storage object (for admins to view attachments)
router.get('/storage-object/*', authenticate, isAdmin, validate(getObjectSchema), getStorageObject);


// --- Client Portal & Admin Routes ---

// Add a note to a specific request
router.post('/:requestId/notes', authenticate, validate(addNoteSchema), addRequestNote);

// Create a formal quote for a request (admin only)
router.post('/:requestId/quotes', authenticate, isAdmin, validate(createQuoteSchema), createQuoteForRequest);


module.exports = router;