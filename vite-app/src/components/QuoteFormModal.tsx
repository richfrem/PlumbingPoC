
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Divider, IconButton, InputAdornment } from '@mui/material';
import Grid from '@mui/material/Grid';
import { X as XIcon, CalendarDays, Paperclip } from 'lucide-react';
import apiClient from '../lib/apiClient';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: any; // Replace with your Quote type
  editable: boolean;
  request?: any; // Should be the full request object with user_profiles, answers, etc.
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

  useEffect(() => {
    if (!initialRequest && requestId) {
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
    } else {
      setRequest(initialRequest);
    }
  }, [initialRequest, requestId]);
  const [goodUntil, setGoodUntil] = useState(quote?.goodUntil || '');
  const [laborItems, setLaborItems] = useState<Item[]>(quote?.laborItems || [{ description: '', price: '' }]);
  const [materialItems, setMaterialItems] = useState<Item[]>(quote?.materialItems || [{ description: '', price: '' }]);
  const [tax, setTax] = useState(quote?.tax || '');
  const [notes, setNotes] = useState(quote?.notes || '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  
  useEffect(() => {
    if (requestId && isOpen) {
      (async () => {
        try {
          const res = await apiClient.get(`/requests/${requestId}`);
          setRequestInfo(res.data);
        } catch (err: any) {
          setRequestInfo(null);
        }
      })();
    }
  }, [requestId, isOpen]);

  // Lookup job type and description from request
  const jobType = request?.problem_category || 'N/A';
  const problemDescription = request?.answers?.find((a: any) => a.question.toLowerCase().includes('describe the general problem'))?.answer || 'N/A';

  // BC tax rates
  const GST_RATE = 0.05;
  const PST_RATE = 0.07;

  // Calculate totals
  const laborTotal = laborItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const materialTotal = materialItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  // requestId is already in props
  // GST applies to both labor and materials
  const gst = (laborTotal + materialTotal) * GST_RATE;
  // PST logic
  const pst = jobType === 'commercial'
    ? (laborTotal + materialTotal) * PST_RATE
    : materialTotal * PST_RATE;

  const totalPrice = (laborTotal + materialTotal + gst + pst).toFixed(2);


  // Validation: At least one cost item
  const hasValidCostItem =
    laborItems.some(item => item.description && parseFloat(item.price) > 0) ||
    materialItems.some(item => item.description && parseFloat(item.price) > 0);

  const handleAddLabor = () => setLaborItems([...laborItems, { description: '', price: '' }]);
  const handleAddMaterial = () => setMaterialItems([...materialItems, { description: '', price: '' }]);

  // Save Quote handler
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const handleSaveQuote = async () => {
    setSaveError(null);
    if (!hasValidCostItem) {
      setSaveError('Please add at least one labor or material item with a non-zero price.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        goodUntil,
        laborItems: laborItems.filter(item => item.description && parseFloat(item.price) > 0),
        materialItems: materialItems.filter(item => item.description && parseFloat(item.price) > 0),
        tax,
        notes,
        attachments: [], // TODO: handle attachments if needed
        total: totalPrice,
      };
      await apiClient.post(`/requests/${requestId}/quotes`, payload);
      onClose();
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || err.message || 'Failed to save quote.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <Paper elevation={24} sx={{ width: '95%', maxWidth: '700px', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', maxHeight: '90vh', overflow: 'hidden' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 3, py: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {request?.problem_category ? `Quote for ${request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}` : 'Create Quote'}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
        </Box>

        {/* --- Request Info Section --- */}
        <Box sx={{ mb: 2, mx: 3, mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9', position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: 120 }}>
          {loadingRequest ? (
            <Box sx={{ fontSize: 16, color: 'text.primary', lineHeight: 1.7, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              Loading request info...
            </Box>
          ) : errorRequest ? (
            <Box sx={{ fontSize: 16, color: 'error.main', lineHeight: 1.7, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              Error: {errorRequest}
            </Box>
          ) : (
            <Box sx={{ fontSize: 16, color: 'text.primary', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span role="img" aria-label="user" style={{ fontSize: 18 }}>👤</span>
                <span>{request?.user_profiles?.name || 'N/A'}</span>
                {request?.user_profiles?.phone && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml: 2, minWidth: 0, px: 1, fontSize: 14 }}
                    component="a"
                    href={`tel:${request.user_profiles.phone}`}
                    startIcon={<span role="img" aria-label="phone" style={{ fontSize: 18 }}>📞</span>}
                  >
                    {request.user_profiles.phone}
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span role="img" aria-label="location" style={{ fontSize: 18 }}>📍</span>
                <span>{request?.user_profiles?.address || ''}{request?.user_profiles?.address ? ', ' : ''}{request?.user_profiles?.city || ''}{request?.user_profiles?.city ? ', ' : ''}{request?.user_profiles?.province || ''}{request?.user_profiles?.province ? ' ' : ''}{request?.user_profiles?.postal_code || ''}</span>
              </Box>
              <Box>
                <span>
                  {request?.answers?.find((a: any) => a.question.toLowerCase().includes('describe the general problem'))?.answer || 'N/A'}
                </span>
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <TextField
              label="Good Until"
              type="date"
              value={goodUntil}
              onChange={e => setGoodUntil(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={!editable}
              sx={{ minWidth: 160, mb: 1, bgcolor: '#fff', borderRadius: 1 }}
            />
            <Button variant="outlined" color="primary" onClick={onClose}>Return to Request</Button>
          </Box>
        </Box>
  <Box sx={{ flex: '1 1 auto', overflowY: 'auto', pr: 1, mb: 2, px: 3 }}>
          {/* ...existing code... */}
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Labor</Typography>
          {laborItems.map((item, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
              <Grid item xs={8}>
                <TextField
                  label="Description"
                  value={item.description}
                  onChange={e => {
                    const newItems = [...laborItems];
                    if (newItems[idx]) newItems[idx].description = e.target.value;
                    setLaborItems(newItems);
                  }}
                  fullWidth
                  disabled={!editable}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Price"
                  value={item.price}
                  onChange={e => {
                    const newItems = [...laborItems];
                    if (newItems[idx]) newItems[idx].price = e.target.value;
                    setLaborItems(newItems);
                  }}
                  fullWidth
                  disabled={!editable}
                />
              </Grid>
            </Grid>
          ))}
          {editable && <Button onClick={handleAddLabor} sx={{ mb: 2 }}>Add Labor Item</Button>}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Itemized Materials</Typography>
          {materialItems.map((item, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
              <Grid item xs={8}>
                <TextField
                  label="Description"
                  value={item.description}
                  onChange={e => {
                    const newItems = [...materialItems];
                    if (newItems[idx]) newItems[idx].description = e.target.value;
                    setMaterialItems(newItems);
                  }}
                  fullWidth
                  disabled={!editable}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Price"
                  value={item.price}
                  onChange={e => {
                    const newItems = [...materialItems];
                    if (newItems[idx]) newItems[idx].price = e.target.value;
                    setMaterialItems(newItems);
                  }}
                  fullWidth
                  disabled={!editable}
                />
              </Grid>
            </Grid>
          ))}
          {editable && <Button onClick={handleAddMaterial} sx={{ mb: 2 }}>Add Material Item</Button>}
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Notes / Clarifications"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  fullWidth
                  multiline
                  disabled={!editable}
                />
              </Grid>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Attachments / Screenshots</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Display uploaded attachments here */}
          </Box>
          {editable && (
            <Button component="label" startIcon={<Paperclip />} sx={{ mb: 2 }}>
              Upload Attachment
              <input type="file" hidden multiple onChange={e => setAttachments(Array.from(e.target.files || []))} />
            </Button>
          )}
          <Divider sx={{ my: 2 }} />
          {/* Cost Section at Bottom with GST/PST breakdown */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Cost</Typography>
            <Typography variant="h5" color="primary">${totalPrice}</Typography>
            <Typography variant="body2" color="text.secondary">
              (Labor: ${laborTotal.toFixed(2)} + Materials: ${materialTotal.toFixed(2)})<br/>
              GST (5%): ${gst.toFixed(2)}<br/>
              PST (7%): ${pst.toFixed(2)}<br/>
              <span style={{fontWeight:'bold'}}>Job Type: {jobType.charAt(0).toUpperCase() + jobType.slice(1)}</span>
            </Typography>
          </Box>
        </Box>
        {editable && (
          <Box sx={{ position: 'sticky', bottom: 0, left: 0, bgcolor: '#f4f6f8', pt: 2, pb: 1, zIndex: 10 }}>
            {saveError && <Typography color="error" sx={{ mb: 1 }}>{saveError}</Typography>}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSaveQuote}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Quote'}
            </Button>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default QuoteFormModal;
