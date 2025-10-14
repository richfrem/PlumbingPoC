// packages/backend/api/controllers/invoiceController.js

import { database as supabase } from '../config/supabase/index.js';

/**
 * Create a new invoice for a completed request
 */
export async function createInvoice(req, res) {
  try {
    const { requestId } = req.params;
    const { line_items, subtotal, tax_amount, total, due_date, notes, payment_method } = req.body;

    console.log('📄 Creating invoice for request:', requestId);

    // Verify request exists and is completed
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('id, status, user_id, invoice_id')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ error: 'Can only create invoice for completed requests' });
    }

    if (request.invoice_id) {
      return res.status(400).json({ error: 'Invoice already exists for this request' });
    }

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        request_id: requestId,
        user_id: request.user_id,
        line_items: line_items,
        subtotal: subtotal,
        tax_amount: tax_amount,
        total: total,
        due_date: due_date,
        notes: notes,
        status: 'sent', // Invoices start as 'sent' (not draft)
        payment_method: payment_method || null
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ Error creating invoice:', invoiceError);
      return res.status(500).json({ error: 'Failed to create invoice' });
    }

    // Update request with invoice_id and change status to 'invoiced'
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        invoice_id: invoice.id,
        status: 'invoiced'
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating request with invoice_id:', updateError);
      // Rollback: delete the invoice
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return res.status(500).json({ error: 'Failed to link invoice to request' });
    }

    console.log('✅ Invoice created successfully:', invoice.id);
    res.status(201).json(invoice);

  } catch (error) {
    console.error('❌ Error in createInvoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a specific invoice
 */
export async function getInvoice(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is admin (same pattern as getRequestById)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // Build query - use explicit FK join like requests do
    let query = supabase
      .from('invoices')
      .select('*');

    const { data: invoices, error } = await query.eq('id', id);

    if (error || !invoices || invoices.length === 0) {
      console.error('❌ Error fetching invoice:', error);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Fetch related request data separately (more reliable than join)
    if (invoice.request_id) {
      const { data: request } = await supabase
        .from('requests')
        .select('customer_name, service_address, user_id')
        .eq('id', invoice.request_id)
        .single();

      if (request) {
        invoice.requests = request;

        // Check permissions: admin or customer who owns the request
        if (!isAdmin && request.user_id !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
    }

    res.json(invoice);

  } catch (error) {
    console.error('❌ Error in getInvoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update an invoice (only if not paid)
 */
export async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const { line_items, subtotal, tax_amount, total, due_date, notes, payment_method } = req.body;

    // Check current invoice status
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !currentInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (currentInvoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot modify a paid invoice' });
    }

    // Update the invoice
    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        line_items: line_items,
        subtotal: subtotal,
        tax_amount: tax_amount,
        total: total,
        due_date: due_date,
        notes: notes,
        payment_method: payment_method || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating invoice:', updateError);
      return res.status(500).json({ error: 'Failed to update invoice' });
    }

    console.log('✅ Invoice updated successfully:', id);
    res.json(invoice);

  } catch (error) {
    console.error('❌ Error in updateInvoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mark an invoice as paid
 */
export async function markInvoiceAsPaid(req, res) {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    if (!payment_method) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    // Get current invoice and request
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, requests(id)')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Update invoice to paid
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error marking invoice as paid:', updateError);
      return res.status(500).json({ error: 'Failed to mark invoice as paid' });
    }

    // Update request status to 'paid'
    const { error: requestUpdateError } = await supabase
      .from('requests')
      .update({ status: 'paid' })
      .eq('id', invoice.request_id);

    if (requestUpdateError) {
      console.error('❌ Error updating request status to paid:', requestUpdateError);
    }

    console.log('✅ Invoice marked as paid:', id);
    res.json(updatedInvoice);

  } catch (error) {
    console.error('❌ Error in markInvoiceAsPaid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * List invoices (admin sees all, customers see their own)
 */
export async function listInvoices(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = supabase
      .from('invoices')
      .select('*, requests(customer_name, problem_category)')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error('❌ Error fetching invoices:', error);
      return res.status(500).json({ error: 'Failed to fetch invoices' });
    }

    res.json(invoices);

  } catch (error) {
    console.error('❌ Error in listInvoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
