// packages/frontend/src/features/requests/components/InvoiceFormModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Divider, InputAdornment, Grid, MenuItem, Chip } from '@mui/material';
import { useAuth } from '../../auth/AuthContext';
import { QuoteRequest } from '../types';
import apiClient from '../../../lib/apiClient';

// Import reusable components
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import CustomerInfoSection from './CustomerInfoSection';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  invoice?: any;
  mode: 'create' | 'edit' | 'view';
  request: QuoteRequest;
  requestId: string;
}

interface LineItem {
  description: string;
  quantity: string;
  unit_price: string;
  total: number;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  invoice,
  mode,
  request,
  requestId
}) => {
  const { profile } = useAuth();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [laborItems, setLaborItems] = useState<LineItem[]>([{ description: '', quantity: '1', unit_price: '', total: 0 }]);
  const [materialItems, setMaterialItems] = useState<LineItem[]>([{ description: '', quantity: '1', unit_price: '', total: 0 }]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const editable = mode !== 'view' && isAdmin;
  const isReadOnly = mode === 'view' || !isAdmin || request.status === 'paid';

  useEffect(() => {
    if (isOpen) {
      if (invoice) {
        // Load existing invoice data
        const lineItems = invoice.line_items || [];
        const labor = lineItems.filter((item: any) => item.type === 'labor');
        const materials = lineItems.filter((item: any) => item.type === 'material');

        setLaborItems(labor.length > 0 ? labor : [{ description: '', quantity: '1', unit_price: '', total: 0 }]);
        setMaterialItems(materials.length > 0 ? materials : [{ description: '', quantity: '1', unit_price: '', total: 0 }]);
        setNotes(invoice.notes || '');
        setDueDate(invoice.due_date?.split('T')[0] || '');
        setPaymentMethod(invoice.payment_method || '');
      } else if (mode === 'create' && request.accepted_quote_id) {
        // Pre-populate from accepted quote
        loadQuoteData(request.accepted_quote_id);
      } else {
        // New invoice with defaults
        setLaborItems([{ description: '', quantity: '1', unit_price: '', total: 0 }]);
        setMaterialItems([{ description: '', quantity: '1', unit_price: '', total: 0 }]);
        setNotes('');
        setPaymentMethod('');

        // Default due date to 30 days from now
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        setDueDate(thirtyDaysFromNow.toISOString().split('T')[0]);
      }

      // Auto-focus first field
      setTimeout(() => {
        if (firstFieldRef.current && editable) {
          firstFieldRef.current.focus();
        }
      }, 100);
    }
  }, [invoice, isOpen, mode, request.accepted_quote_id]);

  const loadQuoteData = async (quoteId: string) => {
    try {
      // Fetch the accepted quote to pre-populate invoice
      const response = await apiClient.get(`/quotes/${quoteId}`);
      const quote = response.data;

      if (quote.details) {
        const details = typeof quote.details === 'string' ? JSON.parse(quote.details) : quote.details;

        // Convert quote items to invoice line items
        const laborLineItems = (details.labor_items || []).map((item: any) => ({
          description: item.description,
          quantity: '1',
          unit_price: item.price,
          total: parseFloat(item.price) || 0,
          type: 'labor'
        }));

        const materialLineItems = (details.material_items || []).map((item: any) => ({
          description: item.description,
          quantity: '1',
          unit_price: item.price,
          total: parseFloat(item.price) || 0,
          type: 'material'
        }));

        setLaborItems(laborLineItems.length > 0 ? laborLineItems : [{ description: '', quantity: '1', unit_price: '', total: 0 }]);
        setMaterialItems(materialLineItems.length > 0 ? materialLineItems : [{ description: '', quantity: '1', unit_price: '', total: 0 }]);

        if (details.notes) {
          setNotes(`Based on Quote #${quoteId.slice(0, 8)}\n\n${details.notes}`);
        }
      }
    } catch (error) {
      console.error('Error loading quote data:', error);
    }
  };

  const handleLineItemChange = (
    items: LineItem[],
    setItems: React.Dispatch<React.SetStateAction<LineItem[]>>,
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this line
    if (field === 'quantity' || field === 'unit_price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total = qty * price;
    }

    setItems(newItems);
  };

  const addLineItem = (items: LineItem[], setItems: React.Dispatch<React.SetStateAction<LineItem[]>>) => {
    setItems([...items, { description: '', quantity: '1', unit_price: '', total: 0 }]);
  };

  const removeLineItem = (items: LineItem[], setItems: React.Dispatch<React.SetStateAction<LineItem[]>>, index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const materialTotal = materialItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const subtotal = laborTotal + materialTotal;

    // BC Tax Rules:
    // GST (5%): Applied to ALL labor + materials
    // PST (7%): Applied to materials ONLY (labor is PST exempt in BC)
    const gst = subtotal * 0.05;
    const pst = materialTotal * 0.07;
    const totalTax = gst + pst;
    const total = subtotal + totalTax;

    return {
      laborTotal,
      materialTotal,
      subtotal,
      gst,
      pst,
      totalTax,
      total
    };
  };

  const handleSaveInvoice = async () => {
    const totals = calculateTotals();

    // Validation
    if (totals.subtotal === 0) {
      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: { message: 'Please add at least one line item with a price.', severity: 'error' }
      }));
      return;
    }

    setIsSaving(true);

    try {
      // Prepare line items with type tags
      const allLineItems = [
        ...laborItems.filter(item => item.description && parseFloat(item.unit_price) > 0).map(item => ({ ...item, type: 'labor' })),
        ...materialItems.filter(item => item.description && parseFloat(item.unit_price) > 0).map(item => ({ ...item, type: 'material' }))
      ];

      const invoiceData = {
        request_id: requestId,
        line_items: allLineItems,
        subtotal: totals.subtotal,
        tax_amount: totals.totalTax,
        total: totals.total,
        due_date: dueDate,
        notes: notes,
        status: mode === 'create' ? 'sent' : invoice?.status || 'sent',
        payment_method: paymentMethod || null
      };

      let response;
      if (mode === 'create') {
        response = await apiClient.post(`/requests/${requestId}/invoices`, invoiceData);
      } else {
        response = await apiClient.patch(`/invoices/${invoice.id}`, invoiceData);
      }

      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: {
          message: mode === 'create' ? 'Invoice created successfully!' : 'Invoice updated successfully!',
          severity: 'success'
        }
      }));

      onClose(true);
    } catch (error) {
      console.error('Error saving invoice:', error);
      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: { message: 'Failed to save invoice. Please try again.', severity: 'error' }
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice || !paymentMethod) {
      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: { message: 'Please select a payment method before marking as paid.', severity: 'error' }
      }));
      return;
    }

    setIsSaving(true);

    try {
      await apiClient.post(`/invoices/${invoice.id}/mark-paid`, {
        payment_method: paymentMethod
      });

      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: { message: 'Invoice marked as paid!', severity: 'success' }
      }));

      onClose(true);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: { message: 'Failed to mark invoice as paid. Please try again.', severity: 'error' }
      }));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const totals = calculateTotals();
  const invoiceNumber = invoice?.id ? `INV-${invoice.id.slice(0, 8).toUpperCase()}` : 'New Invoice';

  // Chip color for status badge
  const chipColor = invoice?.status === 'paid' ? 'success' : invoice?.status === 'overdue' ? 'error' : 'warning';

  // Header background color - always use default grey for consistency
  const headerBgColor = undefined; // Let ModalHeader use its default

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        p: 2
      }}
      onClick={() => onClose()}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 24
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title={invoiceNumber}
          onClose={onClose}
          statusColor={headerBgColor}
          actions={
            invoice?.status && (
              <Chip
                label={invoice.status.toUpperCase()}
                color={chipColor}
                size="small"
              />
            )
          }
        />

        <Box sx={{ p: 3, maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>
          <CustomerInfoSection
            mode="view"
            showCustomerInfo={true}
            request={request}
            initialAddress={request.service_address}
            isAdmin={false}
            onSave={async () => {}}
            onModeChange={() => {}}
          />

          <Divider sx={{ my: 3 }} />

          {/* Labor Items */}
          <Typography variant="h6" gutterBottom>
            Labor
          </Typography>
          {laborItems.map((item, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(laborItems, setLaborItems, index, 'description', e.target.value)}
                  disabled={isReadOnly}
                  inputRef={index === 0 ? firstFieldRef : undefined}
                />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(laborItems, setLaborItems, index, 'quantity', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unit Price"
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleLineItemChange(laborItems, setLaborItems, index, 'unit_price', e.target.value)}
                  disabled={isReadOnly}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={3} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total"
                  value={item.total.toFixed(2)}
                  disabled
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={1} sm={1}>
                {!isReadOnly && laborItems.length > 1 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeLineItem(laborItems, setLaborItems, index)}
                  >
                    ✕
                  </Button>
                )}
              </Grid>
            </Grid>
          ))}
          {!isReadOnly && (
            <Button size="small" onClick={() => addLineItem(laborItems, setLaborItems)}>
              + Add Labor Item
            </Button>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Material Items */}
          <Typography variant="h6" gutterBottom>
            Materials
          </Typography>
          {materialItems.map((item, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(materialItems, setMaterialItems, index, 'description', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(materialItems, setMaterialItems, index, 'quantity', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unit Price"
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleLineItemChange(materialItems, setMaterialItems, index, 'unit_price', e.target.value)}
                  disabled={isReadOnly}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={3} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total"
                  value={item.total.toFixed(2)}
                  disabled
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={1} sm={1}>
                {!isReadOnly && materialItems.length > 1 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeLineItem(materialItems, setMaterialItems, index)}
                  >
                    ✕
                  </Button>
                )}
              </Grid>
            </Grid>
          ))}
          {!isReadOnly && (
            <Button size="small" onClick={() => addLineItem(materialItems, setMaterialItems)}>
              + Add Material Item
            </Button>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Totals Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ minWidth: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Labor Subtotal:</Typography>
                <Typography>${totals.laborTotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Materials Subtotal:</Typography>
                <Typography>${totals.materialTotal.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography fontWeight="bold">${totals.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">GST (5% on all):</Typography>
                <Typography variant="caption">${totals.gst.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">PST (7% on materials):</Typography>
                <Typography variant="caption">${totals.pst.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">${totals.total.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Due Date and Payment */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isReadOnly && invoice?.status === 'paid'}
              >
                <MenuItem value="">Not specified</MenuItem>
                <MenuItem value="stripe">Stripe (Online)</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="etransfer">E-Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Notes */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isReadOnly}
            placeholder="Add any notes or payment instructions for the customer..."
          />
        </Box>

        <ModalFooter>
          <Button onClick={() => onClose(false)}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>

          {!isReadOnly && (
            <Button
              variant="contained"
              onClick={handleSaveInvoice}
              disabled={isSaving || totals.subtotal === 0}
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Invoice' : 'Save Changes'}
            </Button>
          )}

          {isAdmin && invoice?.status === 'sent' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkAsPaid}
              disabled={isSaving || !paymentMethod}
            >
              {isSaving ? 'Processing...' : 'Mark as Paid'}
            </Button>
          )}
        </ModalFooter>
      </Box>
    </Box>
  );
};

export default InvoiceFormModal;
