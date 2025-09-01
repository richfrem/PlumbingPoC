// vite-app/src/components/RequestDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel, TextField, IconButton, Button, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { X as XIcon, User, Phone, FilePlus, AlertTriangle, Zap } from 'lucide-react';
import { QuoteRequest } from './Dashboard';
import QuoteFormModal from './QuoteFormModal';
import AttachmentSection from './AttachmentSection';
import apiClient from '../lib/apiClient';
import { getRequestStatusChipColor, getQuoteStatusChipColor } from '../lib/statusColors';
import CustomerInfoSection from './CustomerInfoSection';
import CommunicationLog from './CommunicationLog';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null;
  onUpdateRequest: () => void;
}

const AnswerItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <Grid container spacing={1} sx={{ mb: 1 }}>
    <Grid item xs={12} sm={5}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{question}</Typography>
    </Grid>
    <Grid item xs={12} sm={7}>
      <Typography variant="body1">{answer || 'N/A'}</Typography>
    </Grid>
  </Grid>
);

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request, onUpdateRequest }) => {
  const { profile } = useAuth();
  const [currentStatus, setCurrentStatus] = useState(request?.status || 'new');
  const [scheduledStartDate, setScheduledStartDate] = useState(request?.scheduled_start_date || '');
  const [scheduledDateChanged, setScheduledDateChanged] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<'create' | 'update'>('create');
  const [selectedQuoteIdx, setSelectedQuoteIdx] = useState<number | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  // This effect ensures the modal's internal state is always in sync with the request prop
  useEffect(() => {
    if (request) {
      setCurrentStatus(request.status);
      setScheduledStartDate(request.scheduled_start_date ? new Date(request.scheduled_start_date).toISOString().split('T')[0] : '');
      setScheduledDateChanged(false);
    }
  }, [request]);

  // *** THE REAL-TIME UPGRADE FOR THE ENTIRE MODAL IS HERE ***
  useEffect(() => {
    if (!request?.id) return;

    const channel = supabase
      .channel(`request-details-${request.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests', filter: `id=eq.${request.id}` },
        (payload) => {
          console.log('Realtime change on REQUEST detected!', payload);
          onUpdateRequest(); // Tell the parent component to refetch all data
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes', filter: `request_id=eq.${request.id}` },
        (payload) => {
          console.log('Realtime change on QUOTES detected!', payload);
          onUpdateRequest();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quote_attachments', filter: `request_id=eq.${request.id}` },
        (payload) => {
          console.log('Realtime change on ATTACHMENTS detected!', payload);
          onUpdateRequest();
        }
      )
      .subscribe();

    // Cleanup function to remove the channel when the modal is closed
    return () => {
      supabase.removeChannel(channel);
    };
  }, [request?.id, onUpdateRequest]);

  const handleStatusUpdate = async (newStatus: string, date?: string | null) => {
    if (!request) return;
    setIsUpdating(true);
    try {
      const payload: { status: string; scheduled_start_date?: string | null } = { status: newStatus };
      if (date !== undefined) {
        payload.scheduled_start_date = date;
      }
      // This API call will trigger the 'requests' table subscription above
      await apiClient.patch(`/requests/${request.id}/status`, payload);
      // No need to call onUpdateRequest() here, the subscription will handle it.
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveScheduledDate = async () => {
    if (!request || !scheduledStartDate) return;
    const utcDate = new Date(scheduledStartDate);
    await handleStatusUpdate('scheduled', utcDate.toISOString());
    setScheduledDateChanged(false);
  };
  
  const handleAcceptQuote = async (quoteId: string) => {
    if (!request) return;
    setIsUpdating(true);
    try {
      // This API call triggers changes on both 'quotes' and 'requests' tables
      await apiClient.post(`/requests/${request.id}/quotes/${quoteId}/accept`);
    } catch (error) {
      console.error("Failed to accept quote:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuoteFormClose = (updated?: boolean) => {
    setShowQuoteForm(false);
    setSelectedQuoteIdx(null);
    if (updated) {
      onUpdateRequest();
    }
  };

  const handleTriageRequest = async () => {
    if (!request) return;
    setIsTriaging(true);
    try {
      // This API call triggers an update on the 'requests' table
      await apiClient.post(`/triage/${request.id}`);
    } catch (error) {
      console.error("Failed to triage request:", error);
    } finally {
      setIsTriaging(false);
    }
  };

  if (!isOpen || !request) return null;

  const isAdmin = profile?.role === 'admin';
  const isReadOnly = ['completed'].includes(request.status);
  const problemDescriptionAnswer = request.answers.find(a => a.question.toLowerCase().includes('describe the general problem'));
  const otherAnswers = request.answers.filter(a => !a.question.toLowerCase().includes('describe the general problem'));
  const allAttachments = request.quote_attachments || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '900px', height: '90vh', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', overflow: 'hidden' }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 3, py: 2, flexShrink: 0 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Job Docket: {request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              ID: {request.id} | Received: {new Date(request.created_at).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAdmin && !request.triage_summary && (
              <Button variant="contained" color="secondary" size="small" onClick={handleTriageRequest} disabled={isTriaging} sx={{ whiteSpace: 'nowrap' }} startIcon={<Zap />}>
                {isTriaging ? 'Triaging...' : 'AI Triage'}
              </Button>
            )}
            <IconButton onClick={onClose} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          <Grid container spacing={3}>
            {/* --- LEFT COLUMN --- */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <CustomerInfoSection
                  request={request}
                  isAdmin={isAdmin}
                  isDateEditable={true}
                  scheduledStartDate={scheduledStartDate}
                  setScheduledStartDate={(date) => {
                    setScheduledStartDate(date);
                    setScheduledDateChanged(true);
                  }}
                  currentStatus={currentStatus}
                  setCurrentStatus={setCurrentStatus}
                  isUpdating={isUpdating}
                  onSaveScheduledDate={handleSaveScheduledDate}
                  scheduledDateChanged={scheduledDateChanged}
                />
                
                {isAdmin && request.triage_summary && (
                  <Paper variant="outlined">
                    <Box sx={{ p: 2, borderLeft: 4, borderColor: 'secondary.main', bgcolor: '#f3e5f5' }}>
                      <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Zap size={16} /> AI Triage Summary</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{request.triage_summary}</Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>Priority Score: {request.priority_score}/10</Typography>
                      {request.priority_explanation && (<Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>Explanation: {request.priority_explanation}</Typography>)}
                      {request.profitability_score != null && (<Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>Profitability Score: {request.profitability_score}/10</Typography>)}
                      {request.profitability_explanation && (<Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>Explanation: {request.profitability_explanation}</Typography>)}
                    </Box>
                  </Paper>
                )}

                <Paper variant="outlined">
                  <Box sx={{ p: 2, borderLeft: 4, borderColor: 'warning.main', bgcolor: '#fff3e0' }}>
                    <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AlertTriangle size={16} /> Reported Problem</Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', mt: 1 }}>"{problemDescriptionAnswer?.answer || 'N/A'}"</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {otherAnswers.map(ans => (<AnswerItem key={ans.question} question={ans.question} answer={ans.answer} />))}
                    </Grid>
                  </Box>
                </Paper>
                
                <AttachmentSection
                  requestId={request.id}
                  attachments={allAttachments}
                  editable={!isReadOnly && (isAdmin || !request.quotes.some(q => q.status === 'accepted'))}
                  onUpdate={onUpdateRequest}
                />
              </Box>
            </Grid>

            {/* --- RIGHT COLUMN --- */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CommunicationLog requestId={request.id} />
            </Grid>
          </Grid>

          {/* --- QUOTES SECTION (Full Width Below Columns) --- */}
          <Box sx={{ mt: 3 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FilePlus size={16} /> Quotes</Typography>
              {request.quotes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No quotes yet.</Typography>
              ) : (
                <List>
                  {request.quotes.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((quote, idx) => (
                    <ListItem key={quote.id || idx} disablePadding secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isAdmin && quote.status !== 'accepted' && quote.status !== 'rejected' && request.status !== 'accepted' && (
                          <Button variant="contained" size="small" color="success" onClick={() => handleAcceptQuote(quote.id)} disabled={isUpdating}>
                            Accept
                          </Button>
                        )}
                        <Button variant="outlined" size="small" onClick={() => { setQuoteModalMode('update'); setSelectedQuoteIdx(request.quotes.findIndex(q => q.id === quote.id)); setShowQuoteForm(true); }}>
                          {isAdmin && !isReadOnly ? 'Update' : 'View Details'}
                        </Button>
                      </Box>
                    }>
                      <ListItemText
                        primary={`Quote - $${quote.quote_amount.toFixed(2)}`}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip label={quote.status || 'N/A'} color={getQuoteStatusChipColor(quote.status)} size="small" sx={{ textTransform: 'capitalize' }} />
                            <Typography variant="caption" color="text.secondary">| Created: {new Date(quote.created_at).toLocaleDateString()}</Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {isAdmin && !isReadOnly && (
                <Button variant="contained" startIcon={<FilePlus />} sx={{ mt: 2 }} onClick={() => { setQuoteModalMode('create'); setSelectedQuoteIdx(null); setShowQuoteForm(true); }}>Add New Quote</Button>
              )}
            </Paper>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 }, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Typography component="div" variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Status: <Chip label={currentStatus} color={getRequestStatusChipColor(currentStatus)} size="small" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}/>
          </Typography>
          
          {isAdmin && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Update Status</InputLabel>
                <Select value={currentStatus} label="Update Status" onChange={(e) => handleStatusUpdate(e.target.value as string)} disabled={isUpdating || request.status === 'completed'}>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="viewed">Viewed</MenuItem>
                  <MenuItem value="quoted">Quoted</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" component="a" href={`tel:${request.user_profiles?.phone}`} disabled={!request.user_profiles?.phone} startIcon={<Phone />}>
                Call Customer
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
      
      <QuoteFormModal
        isOpen={showQuoteForm}
        onClose={handleQuoteFormClose}
        quote={quoteModalMode === 'update' && selectedQuoteIdx !== null && request.quotes[selectedQuoteIdx] ? request.quotes[selectedQuoteIdx] : undefined}
        editable={isAdmin && !isReadOnly}
        requestId={request.id}
        request={request}
      />
    </div>
  );
};

export default RequestDetailModal;