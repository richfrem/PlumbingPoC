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

// Changed from `upload.single('attachment')` to `upload.array('attachments', 10)`
// This allows up to 10 files to be uploaded under the 'attachments' field name.
router.post('/attachments', authenticate, upload.array('attachments', 10), uploadAttachment);

router.get('/storage-object/*', authenticate, validate(getObjectSchema), getStorageObject);

// --- Client Portal & Admin Routes ---
router.post('/:requestId/notes', authenticate, validate(addNoteSchema), addRequestNote);
router.patch('/:requestId/status', authenticate, isAdmin, validate(updateStatusSchema), updateRequestStatus);
router.post('/:requestId/quotes', authenticate, isAdmin, validate(createQuoteSchema), createQuoteForRequest);
router.put('/:requestId/quotes/:quoteId', authenticate, isAdmin, validate(updateQuoteSchema), updateQuote);
router.post('/:requestId/quotes/:quoteId/accept', authenticate, isAdmin, acceptQuote);
router.get('/:requestId', authenticate, getRequestById);

module.exports = router;