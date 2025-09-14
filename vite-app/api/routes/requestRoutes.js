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
  getAllRequests,
  getRequestById,
  updateQuote,
  acceptQuote,
  updateRequestStatus,
} = require('../controllers/requestController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  gptRequestSchema,
  submitQuoteSchema,
  addNoteSchema,
  createQuoteSchema,
  updateQuoteSchema,
  getObjectSchema,
  updateStatusSchema,
} = require('../validation/schemas');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Core Quote Intake Routes ---

router.post('/gpt-follow-up', authenticate, validate(gptRequestSchema), getGptFollowUp);
router.post('/submit', authenticate, validate(submitQuoteSchema), submitQuoteRequest);

// --- SMS Test Route (moved to root level) ---
router.post('/attachments', authenticate, upload.array('attachment', 10), uploadAttachment);
router.get('/storage-object/*', authenticate, validate(getObjectSchema), getStorageObject);

// --- Client Portal & Admin Routes ---
router.get('/', authenticate, getAllRequests); // Get all requests for admin table
router.post('/:id/notes', authenticate, validate(addNoteSchema), addRequestNote);
router.patch('/:id/status', authenticate, isAdmin, validate(updateStatusSchema), updateRequestStatus);
router.post('/:id/quotes', authenticate, isAdmin, validate(createQuoteSchema), createQuoteForRequest);
router.put('/:id/quotes/:quoteId', authenticate, isAdmin, validate(updateQuoteSchema), updateQuote);
router.post('/:id/quotes/:quoteId/accept', authenticate, acceptQuote);
router.get('/:id', authenticate, getRequestById);

module.exports = router;