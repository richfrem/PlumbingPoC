// packages/frontend/src/features/requests/components/QuoteFormModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, TextField, Button, Divider, InputAdornment, Chip, Grid } from '@mui/material';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../../lib/apiClient';
import { getQuoteStatusChipColor } from '../../../lib/statusColors';
import { QuoteRequest, QuoteAttachment } from '../types';

// Import all our reusable components
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import CustomerInfoSection from './CustomerInfoSection';
import AttachmentSection from './AttachmentSection';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  quote?: any;
  editable: boolean;
  request: QuoteRequest;
  requestId: string;
}

interface Item {
  description: string;
  price: string;
}

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ isOpen, onClose, quote, editable, request, requestId }) => {
   const { profile } = useAuth();
   const firstFieldRef = useRef<HTMLInputElement>(null);
   const [goodUntil, setGoodUntil] = useState('');
   const [laborItems, setLaborItems] = useState<Item[]>([{ description: '', price: '' }]);
   const [materialItems, setMaterialItems] = useState<Item[]>([{ description: '', price: '' }]);
   const [notes, setNotes] = useState('');
   const [newAttachments, setNewAttachments] = useState<File[]>([]);
   const [saving, setSaving] = useState(false);
   const [saveSuccess, setSaveSuccess] = useState(false);
   const [saveError, setSaveError] = useState<string | null>(null);

   const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      setNewAttachments([]);
      setSaveError(null);
      setSaveSuccess(false);

      if (quote) {
        let detailsObj: any = {};
        try {
          detailsObj = typeof quote.details === 'string' ? JSON.parse(quote.details) : (quote.details || {});
        } catch (e) {
          console.error("Failed to parse quote details:", e);
          detailsObj = {};
        }
        setLaborItems(detailsObj.labor_items?.length > 0 ? detailsObj.labor_items : [{ description: '', price: '' }]);
        setMaterialItems(detailsObj.material_items?.length > 0 ? detailsObj.material_items : [{ description: '', price: '' }]);
        setNotes(detailsObj.notes || '');
        setGoodUntil(detailsObj.good_until || '');
      } else {
        setLaborItems([{ description: '', price: '' }]);
        setMaterialItems([{ description: '', price: '' }]);
        setNotes('');
        setGoodUntil('');
      }

      // Auto-focus the first field when modal opens
      setTimeout(() => {
        if (firstFieldRef.current) {
          firstFieldRef.current.focus();
        }
      }, 100);
    }
  }, [quote, isOpen]);


  const handleSaveQuote = async () => {
    setSaveError(null);
    if (!laborItems.some(item => item.description && parseFloat(item.price) > 0) && !materialItems.some(item => item.description && parseFloat(item.price) > 0)) {
      setSaveError('Please add at least one labor or material item with a price.');
      return;
    }
    setSaving(true);

    const laborTotal = laborItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const materialTotal = materialItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const subtotal = laborTotal + materialTotal;
    const gst = subtotal * 0.05;
    const pst = subtotal * 0.07;
    const totalPrice = subtotal + gst + pst;

    try {
      const payload = {
        quote_amount: Number(totalPrice.toFixed(2)),
        details: JSON.stringify({
          labor_items: laborItems.filter(item => item.description),
          material_items: materialItems.filter(item => item.description),
          notes,
          good_until: goodUntil,
          tax_details: { gst: Number(gst.toFixed(2)), pst: Number(pst.toFixed(2)) },
        }),
      };

      const { data: savedQuote } = quote?.id
        ? await apiClient.put(`/requests/${requestId}/quotes/${quote.id}`, payload)
        : await apiClient.post(`/requests/${requestId}/quotes`, payload);

      // If admin created a new quote, reset request status to "quoted" to restart the lifecycle
      if (!quote?.id && isAdmin) {
        try {
          await apiClient.put(`/requests/${requestId}/status`, { status: 'quoted' });
        } catch (statusError) {
          console.error('Failed to update request status to quoted:', statusError);
          // Don't fail the quote creation if status update fails
        }
      }

      if (newAttachments.length > 0 && savedQuote?.id) {
        const formData = new FormData();
        formData.append('request_id', requestId);
        formData.append('quote_id', savedQuote.id);
        newAttachments.forEach(file => formData.append('attachment', file));
        await apiClient.post('/requests/attachments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose(true);
      }, 1200);

    } catch (err: any) {
      setSaveError(err?.response?.data?.error || err.message || 'Failed to save quote.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const laborTotal = laborItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const materialTotal = materialItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const subtotal = laborTotal + materialTotal;
  const gst = subtotal * 0.05;
  const pst = subtotal * 0.07;
  const totalPrice = subtotal + gst + pst;

  const quoteAttachments = request?.quote_attachments?.filter((att: QuoteAttachment) => att.quote_id === quote?.id) || [];
  const headerTitle = quote?.id
    ? `Update Quote #${quote.quote_number}`
    : `Create New Quote for ${request?.problem_category?.replace(/_/g, ' ')}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
      <Paper elevation={24} sx={{
        width: '100%',
        maxWidth: '700px',
        p: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f4f6f8',
        height: { xs: 'calc(100vh - 16px)', md: 'auto' },
        maxHeight: { xs: 'calc(100vh - 16px)', md: '90vh' },
        overflow: 'hidden'
      }}>

        <ModalHeader title={headerTitle} onClose={() => onClose()} />

        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            <CustomerInfoSection
              request={request}
              isAdmin={false}
              editable={editable}
              goodUntil={goodUntil}
              setGoodUntil={setGoodUntil}
            />

            <Paper variant="outlined" sx={{p: 2, bgcolor: 'grey.50'}}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Labor</Typography>
              {laborItems.map((item, idx) => (
                <Grid container spacing={1} key={`labor-${idx}`} sx={{ mb: 1 }}>
                  <Grid item xs={8}>
                    {idx === 0 ? (
                      <TextField inputRef={firstFieldRef} label="Description" value={item.description} onChange={e => { const newItems = [...laborItems]; newItems[idx].description = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" />
                    ) : (
                      <TextField label="Description" value={item.description} onChange={e => { const newItems = [...laborItems]; newItems[idx].description = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" />
                    )}
                  </Grid>
                  <Grid item xs={4}><TextField label="Price" value={item.price} onChange={e => { const newItems = [...laborItems]; newItems[idx].price = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
                </Grid>
              ))}
              {editable && <Button onClick={() => setLaborItems([...laborItems, { description: '', price: '' }])} sx={{ mb: 2, mt: 1 }}>Add Labor Item</Button>}
            </Paper>

            <Paper variant="outlined" sx={{p: 2, bgcolor: 'grey.50'}}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Materials</Typography>
              {materialItems.map((item, idx) => (
                <Grid container spacing={1} key={`material-${idx}`} sx={{ mb: 1 }}>
                  <Grid item xs={8}><TextField label="Description" value={item.description} onChange={e => { const newItems = [...materialItems]; newItems[idx].description = e.target.value; setMaterialItems(newItems); }} fullWidth disabled={!editable} size="small" /></Grid>
                  <Grid item xs={4}><TextField label="Price" value={item.price} onChange={e => { const newItems = [...materialItems]; newItems[idx].price = e.target.value; setMaterialItems(newItems); }} fullWidth disabled={!editable} size="small" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
                </Grid>
              ))}
              {editable && <Button onClick={() => setMaterialItems([...materialItems, { description: '', price: '' }])} sx={{ mb: 2, mt: 1 }}>Add Material Item</Button>}
            </Paper>

            <Paper variant="outlined" sx={{p: 2, bgcolor: 'grey.50'}}>
              <TextField label="Notes / Clarifications" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline rows={3} disabled={!editable} />
            </Paper>

            <AttachmentSection
              requestId={requestId}
              quoteId={quote?.id}
              attachments={quoteAttachments}
              pendingFiles={newAttachments}
              editable={editable}
              onUpdate={() => onClose(true)}
              onNewFiles={(files) => setNewAttachments(prev => [...prev, ...files])}
              onRemovePendingFile={(index) => setNewAttachments(prev => prev.filter((_, i) => i !== index))}
            />

            {/* Summary Bar - Always visible pricing breakdown */}
            <Box sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.200',
              mt: 2
            }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal: ${subtotal.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    GST (5%): ${gst.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PST (7%): ${pst.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Grand Total: ${totalPrice.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <ModalFooter>
          <Box>
            {quote?.status && <Chip label={`Status: ${quote.status}`} color={getQuoteStatusChipColor(quote.status)} sx={{ textTransform: 'capitalize' }} />}
          </Box>
          {editable && (
            <Box>
              {saveError && <Typography color="error" sx={{ display: 'inline', mr: 2 }}>{saveError}</Typography>}
              {saveSuccess && <Typography color="success.main" sx={{ display: 'inline', mr: 2 }}>Quote saved!</Typography>}
              <Button variant="contained" color="primary" onClick={handleSaveQuote} disabled={saving || saveSuccess}>
                {saving ? 'Saving...' : (quote?.id ? 'Update Quote' : 'Save Quote')}
              </Button>
            </Box>
          )}
        </ModalFooter>
      </Paper>
    </div>
  );
};

export default QuoteFormModal;