// packages/backend/api/routes/requestRoutes.js

import express from 'express';
import multer from 'multer';
import {
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
} from '../controllers/requestController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  gptRequestSchema,
  submitQuoteSchema,
  addNoteSchema,
  createQuoteSchema,
  updateQuoteSchema,
  getObjectSchema,
  updateStatusSchema,
} from '../validation/schemas.js';

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

export default router;