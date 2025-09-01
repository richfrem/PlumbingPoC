// vite-app/src/components/QuoteFormModal.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Divider, IconButton, InputAdornment, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { X as XIcon } from 'lucide-react';
import apiClient, { uploadAttachments } from '../lib/apiClient';
import AttachmentSection from './AttachmentSection';
import { getQuoteStatusChipColor } from '../lib/statusColors';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  quote?: any;
  editable: boolean;
  request?: any;
  requestId?: string;
}

interface Item {
  description: string;
  price: string;
}

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ isOpen, onClose, quote, editable, request: initialRequest, requestId }) => {
  const [request, setRequest] = useState<any>(initialRequest);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [errorRequest, setErrorRequest] = useState<string | null>(null);
  const [goodUntil, setGoodUntil] = useState('');
  const [laborItems, setLaborItems] = useState<Item[]>([{ description: '', price: '' }]);
  const [materialItems, setMaterialItems] = useState<Item[]>([{ description: '', price: '' }]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending');
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewAttachments([]);
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
        setStatus(quote.status || 'pending');
      } else {
        setLaborItems([{ description: '', price: '' }]);
        setMaterialItems([{ description: '', price: '' }]);
        setNotes('');
        setGoodUntil('');
        setStatus('sent');
      }
    }
  }, [quote, isOpen]);

  useEffect(() => {
    if (isOpen && !initialRequest && requestId) {
      setLoadingRequest(true);
      setErrorRequest(null);
      apiClient.get(`/requests/${requestId}`)
        .then(res => setRequest(res.data))
        .catch(err => setErrorRequest(err?.response?.data?.error || err.message || 'Unknown error'))
        .finally(() => setLoadingRequest(false));
    } else if (initialRequest) {
      setRequest(initialRequest);
    }
  }, [initialRequest, requestId, isOpen]);

  const handleRefresh = () => onClose(true);

  const handleSaveQuote = async () => {
    setSaveError(null);
    const hasValidCostItem = laborItems.some(item => item.description && parseFloat(item.price) > 0) || materialItems.some(item => item.description && parseFloat(item.price) > 0);
    if (!hasValidCostItem) {
      setSaveError('Please add at least one labor or material item with a non-zero price.');
      return;
    }
    setSaving(true);

    const laborTotal = laborItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const materialTotal = materialItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const subtotal = laborTotal + materialTotal;
    const gst = subtotal * 0.05;
    const pst = (request?.problem_category?.toLowerCase().includes('commercial') ? subtotal : materialTotal) * 0.07;
    const totalPrice = subtotal + gst + pst;

    try {
      const payload = {
        quote_amount: Number(totalPrice.toFixed(2)),
        details: JSON.stringify({
          labor_items: laborItems.filter(item => item.description && parseFloat(item.price) > 0),
          material_items: materialItems.filter(item => item.description && parseFloat(item.price) > 0),
          notes,
          good_until: goodUntil,
          tax_details: { gst: Number(gst.toFixed(2)), pst: Number(pst.toFixed(2)) },
          status,
        }),
      };

      const { data: savedQuote } = quote?.id
        ? await apiClient.put(`/requests/${requestId}/quotes/${quote.id}`, payload)
        : await apiClient.post(`/requests/${requestId}/quotes`, payload);

      if (newAttachments.length > 0 && savedQuote?.id) {
        await uploadAttachments(requestId!, newAttachments, savedQuote.id);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        handleRefresh();
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
  const pst = (request?.problem_category?.toLowerCase().includes('commercial') ? subtotal : materialTotal) * 0.07;
  const totalPrice = subtotal + gst + pst;

  // *** THE CORE FIX IS HERE ***
  // Filter attachments to show ONLY those associated with THIS specific quote.
  const quoteAttachments = request?.quote_attachments?.filter((att: any) => att.quote_id === quote?.id) || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '700px', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', maxHeight: '90vh', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 3, py: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {quote?.id ? 'Update Quote' : 'Create Quote'} for {request?.problem_category?.replace(/_/g, ' ')}
          </Typography>
          <IconButton onClick={() => onClose()} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
        </Box>

        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', p: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {loadingRequest ? <Typography>Loading...</Typography> : errorRequest ? <Typography color="error">{errorRequest}</Typography> : (
                  <Box>
                      <Typography variant="body1"><strong>Client:</strong> {request?.user_profiles?.name || 'N/A'}</Typography>
                      <Typography variant="body2" color="text.secondary"><strong>Address:</strong> {request?.service_address || 'N/A'}</Typography>
                  </Box>
              )}
              <TextField label="Good Until" type="date" value={goodUntil} onChange={e => setGoodUntil(e.target.value)} size="small" InputLabelProps={{ shrink: true }} disabled={!editable} sx={{ bgcolor: '#fff', borderRadius: 1 }} />
            </Paper>

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Labor</Typography>
            {laborItems.map((item, idx) => (
              <Grid container spacing={1} key={`labor-${idx}`} sx={{ mb: 1 }}>
                <Grid item xs={8}><TextField label="Description" value={item.description} onChange={e => { const newItems = [...laborItems]; newItems[idx].description = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" /></Grid>
                <Grid item xs={4}><TextField label="Price" value={item.price} onChange={e => { const newItems = [...laborItems]; newItems[idx].price = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              </Grid>
            ))}
            {editable && <Button onClick={() => setLaborItems([...laborItems, { description: '', price: '' }])} sx={{ mb: 2 }}>Add Labor Item</Button>}

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Materials</Typography>
            {materialItems.map((item, idx) => (
              <Grid container spacing={1} key={`material-${idx}`} sx={{ mb: 1 }}>
                <Grid item xs={8}><TextField label="Description" value={item.description} onChange={e => { const newItems = [...materialItems]; newItems[idx].description = e.target.value; setMaterialItems(newItems); }} fullWidth disabled={!editable} size="small" /></Grid>
                <Grid item xs={4}><TextField label="Price" value={item.price} onChange={e => { const newItems = [...materialItems]; newItems[idx].price = e.target.value; setMaterialItems(newItems); }} fullWidth disabled={!editable} size="small" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              </Grid>
            ))}
            {editable && <Button onClick={() => setMaterialItems([...materialItems, { description: '', price: '' }])} sx={{ mb: 2 }}>Add Material Item</Button>}

            <Divider sx={{ my: 2 }} />
            <TextField label="Notes / Clarifications" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline rows={3} disabled={!editable} />
            <Divider sx={{ my: 2 }} />
            
            <AttachmentSection 
              requestId={requestId!}
              quoteId={quote?.id}
              attachments={quoteAttachments}
              pendingFiles={newAttachments}
              editable={editable}
              onUpdate={handleRefresh}
              onNewFiles={(files) => setNewAttachments(prev => [...prev, ...files])}
              onRemovePendingFile={(index) => setNewAttachments(prev => prev.filter((_, i) => i !== index))}
            />

            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Subtotal: ${subtotal.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">GST (5%): ${gst.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">PST (7%): ${pst.toFixed(2)}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>Total: ${totalPrice.toFixed(2)}</Typography>
            </Box>
        </Box>

        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        </Box>
      </Paper>
    </div>
  );
};

export default QuoteFormModal;