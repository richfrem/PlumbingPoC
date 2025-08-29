// vite-app/src/components/QuoteFormModal.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Divider, IconButton, InputAdornment } from '@mui/material';
import Grid from '@mui/material/Grid';
import { X as XIcon, Paperclip } from 'lucide-react';
import apiClient, { uploadAttachments } from '../lib/apiClient';
import AttachmentSection from './AttachmentSection';

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
      setNewAttachments([]); // Reset on open
      if (quote) {
        let detailsObj: any = {};
        if (quote.details) {
          try {
            detailsObj = typeof quote.details === 'string' ? JSON.parse(quote.details) : quote.details;
          } catch (e) {
            console.error("Failed to parse quote details:", e);
            detailsObj = {};
          }
        } else {
          detailsObj = quote;
        }
        setLaborItems(detailsObj.labor_items?.length > 0 ? detailsObj.labor_items : [{ description: '', price: '' }]);
        setMaterialItems(detailsObj.material_items?.length > 0 ? detailsObj.material_items : [{ description: '', price: '' }]);
        setNotes(detailsObj.notes || '');
        setGoodUntil(detailsObj.good_until || '');
        setStatus(detailsObj.status || 'pending');
      } else {
        setLaborItems([{ description: '', price: '' }]);
        setMaterialItems([{ description: '', price: '' }]);
        setNotes('');
        setGoodUntil('');
        setStatus('pending');
      }
    }
  }, [quote, isOpen]);

  useEffect(() => {
    if (isOpen && !initialRequest && requestId) {
      setLoadingRequest(true);
      setErrorRequest(null);
      (async () => {
        try {
          const res = await apiClient.get(`/requests/${requestId}`);
          setRequest(res.data);
        } catch (err: any) {
          setErrorRequest(err?.response?.data?.error || err.message || 'Unknown error');
          setRequest(null);
        } finally {
          setLoadingRequest(false);
        }
      })();
    } else if (initialRequest) {
      setRequest(initialRequest);
    }
  }, [initialRequest, requestId, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    onClose();
  };

  const handleRefresh = () => {
    onClose(true); // This signals the parent to refresh
  }

  const jobType = request?.problem_category || 'N/A';
  const GST_RATE = 0.05;
  const PST_RATE = 0.07;
  const laborTotal = laborItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const materialTotal = materialItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const gst = (laborTotal + materialTotal) * GST_RATE;
  const pst = jobType.toLowerCase().includes('commercial') ? (laborTotal + materialTotal) * PST_RATE : materialTotal * PST_RATE;
  const totalPrice = laborTotal + materialTotal + gst + pst;
  const taxDetails = { gst: Number(gst.toFixed(2)), pst: Number(pst.toFixed(2)) };
  const hasValidCostItem = laborItems.some(item => item.description && parseFloat(item.price) > 0) || materialItems.some(item => item.description && parseFloat(item.price) > 0);
  const handleAddLabor = () => setLaborItems([...laborItems, { description: '', price: '' }]);
  const handleAddMaterial = () => setMaterialItems([...materialItems, { description: '', price: '' }]);

  const handleSaveQuote = async () => {
    setSaveError(null);
    if (!hasValidCostItem) {
      setSaveError('Please add at least one labor or material item with a non-zero price.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        quote_amount: Number(totalPrice.toFixed(2)),
        details: JSON.stringify({
          labor_items: laborItems.filter(item => item.description && parseFloat(item.price) > 0),
          material_items: materialItems.filter(item => item.description && parseFloat(item.price) > 0),
          notes,
          good_until: goodUntil,
          tax_details: taxDetails,
          status,
        }),
      };

      let savedQuote;
      if (quote && quote.id) {
        const { data } = await apiClient.put(`/requests/${requestId}/quotes/${quote.id}`, payload);
        savedQuote = data;
      } else {
        const { data } = await apiClient.post(`/requests/${requestId}/quotes`, payload);
        savedQuote = data;
      }
      
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

  const quoteAttachments = request?.quote_attachments?.filter((att: any) => att.quote_id === quote?.id) || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '700px', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', maxHeight: '90vh', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 3, py: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {request?.problem_category ? `${quote?.id ? 'Update Quote for' : 'Create Quote for'} ${request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}` : 'Create Quote'}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
        </Box>
        <Box sx={{ mb: 2, mx: 3, mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9', display: 'flex', justifyContent: 'space-between' }}>
          {loadingRequest ? ( <Typography>Loading request info...</Typography> ) : errorRequest ? ( <Typography color="error">Error: {errorRequest}</Typography> ) : (
            <Box>
              <Typography variant="body1"><strong>Client:</strong> {request?.user_profiles?.name || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Address:</strong> {request?.service_address || 'N/A'}</Typography>
            </Box>
          )}
          <Box><TextField label="Good Until" type="date" value={goodUntil} onChange={e => setGoodUntil(e.target.value)} size="small" InputLabelProps={{ shrink: true }} disabled={!editable} sx={{ bgcolor: '#fff', borderRadius: 1 }} /></Box>
        </Box>
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Labor</Typography>
          {laborItems.map((item, idx) => (
            <Grid container spacing={1} key={`labor-${idx}`} sx={{ mb: 1 }}>
              <Grid item xs={8}><TextField label="Description" value={item.description} onChange={e => { const newItems = [...laborItems]; newItems[idx].description = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" /></Grid>
              <Grid item xs={4}><TextField label="Price" value={item.price} onChange={e => { const newItems = [...laborItems]; newItems[idx].price = e.target.value; setLaborItems(newItems); }} fullWidth disabled={!editable} size="small" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
            </Grid>
          ))}
          {editable && <Button onClick={handleAddLabor} sx={{ mb: 2 }}>Add Labor Item</Button>}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Materials</Typography>
          {materialItems.map((item, idx) => (
            <Grid container spacing={1} key={`material-${idx}`} sx={{ mb: 1 }}>
              <Grid item xs={8}><TextField label="Description" value={item.description} onChange={e => { const newItems = [...materialItems]; newItems[idx].description = e.target.value; setMaterialItems(newItems); }} fullWidth disabled={!editable} size="small" /></Grid>
              <Grid item xs={4}><TextField label="Price" value={item.price} onChange={e => { const newItems = [...materialItems]; newItems[idx].price = e.target.value; setMaterialItems(newItems); }} fullWidth disabled={!editable} size="small" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
            </Grid>
          ))}
          {editable && <Button onClick={handleAddMaterial} sx={{ mb: 2 }}>Add Material Item</Button>}
          <Divider sx={{ my: 2 }} />
          <TextField label="Notes / Clarifications" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline rows={3} disabled={!editable} />
          <Divider sx={{ my: 2 }} />

          {/* New Attachment Section */}
          {quote && quote.id ? (
            <AttachmentSection 
              requestId={requestId!}
              quoteId={quote.id}
              attachments={quoteAttachments}
              editable={editable}
              onUpdate={handleRefresh}
            />
          ) : (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Attachments</Typography>
              <Button component="label" startIcon={<Paperclip />}>
                Add Quote Attachments
                <input type="file" hidden multiple onChange={e => setNewAttachments(Array.from(e.target.files || []))} />
              </Button>
              {newAttachments.length > 0 && (
                  <Box sx={{ my: 1 }}>
                      <Typography variant="caption">New files to upload:</Typography>
                      {newAttachments.map(file => <Typography key={file.name} variant="body2" sx={{ pl: 2 }}>- {file.name}</Typography>)}
                  </Box>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">Subtotal: ${ (laborTotal + materialTotal).toFixed(2) }</Typography>
            <Typography variant="body2" color="text.secondary">GST (5%): ${gst.toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary">PST (7%): ${pst.toFixed(2)}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>Total: ${totalPrice.toFixed(2)}</Typography>
          </Box>
        </Box>
        {editable && (
          <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
            {saveError && <Typography color="error" sx={{ mb: 1, textAlign: 'center' }}>{saveError}</Typography>}
            {saveSuccess && <Typography color="success.main" sx={{ mb: 1, textAlign: 'center' }}>Quote saved successfully!</Typography>}
            <Button variant="contained" color="primary" fullWidth onClick={handleSaveQuote} disabled={saving || saveSuccess}>
              {saving ? 'Saving...' : (quote?.id ? 'Update Quote' : 'Save Quote')}
            </Button>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default QuoteFormModal;