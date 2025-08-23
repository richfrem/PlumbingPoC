// vite-app/api/routes/requestRoutes.js

const express = require('express');
const multer = require('multer');
const {
  getGptFollowUp,
  submitQuoteRequest,
  uploadAttachment,
  getStorageObject,
  addRequestNote,
  createQuoteForRequest,
  getRequestById,
  updateQuote, // <-- IMPORTED
} = require('../controllers/requestController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  gptRequestSchema,
  submitQuoteSchema,
  addNoteSchema,
  createQuoteSchema,
  updateQuoteSchema, // <-- IMPORTED
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

// [NEW] Update an existing formal quote for a request (admin only)
router.put('/:requestId/quotes/:quoteId', authenticate, isAdmin, validate(updateQuoteSchema), updateQuote);

// Get request details by ID (for quote modal)
router.get('/:requestId', authenticate, getRequestById);


module.exports = router;