// packages/backend/api/routes/invoiceRoutes.js

import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import {
  createInvoice,
  getInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  listInvoices
} from '../controllers/invoiceController.js';

const router = Router();

/**
 * @route   POST /api/requests/:requestId/invoices
 * @desc    Create a new invoice for a completed request
 * @access  Admin only
 */
router.post('/requests/:requestId/invoices', authenticate, isAdmin, createInvoice);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get a specific invoice
 * @access  Admin or customer who owns the request
 */
router.get('/invoices/:id', authenticate, getInvoice);

/**
 * @route   PATCH /api/invoices/:id
 * @desc    Update an invoice (only if status is not 'paid')
 * @access  Admin only
 */
router.patch('/invoices/:id', authenticate, isAdmin, updateInvoice);

/**
 * @route   POST /api/invoices/:id/mark-paid
 * @desc    Mark an invoice as paid
 * @access  Admin only
 */
router.post('/invoices/:id/mark-paid', authenticate, isAdmin, markInvoiceAsPaid);

/**
 * @route   GET /api/invoices
 * @desc    List all invoices (admin sees all, customers see their own)
 * @access  Authenticated users
 */
router.get('/invoices', authenticate, listInvoices);

export default router;
