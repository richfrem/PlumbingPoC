// vite-app/src/components/RequestDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel, TextField, IconButton, Button, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { X as XIcon, User, Phone, MessageSquare, FilePlus, AlertTriangle } from 'lucide-react';
import { QuoteRequest } from './Dashboard';
import QuoteFormModal from './QuoteFormModal';
import AttachmentSection from './AttachmentSection';
import apiClient from '../lib/apiClient';
import { getRequestStatusChipColor, getQuoteStatusChipColor } from '../lib/statusColors';
import CustomerInfoSection from './CustomerInfoSection';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null;
  onUpdateRequest: () => void;
}

const AnswerItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <Grid container spacing={1} sx={{ mb: 1 }}>
    <Grid item xs={12} sm={5}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
        {question}
      </Typography>
    </Grid>
    <Grid item xs={12} sm={7}>
      <Typography variant="body1">
        {answer || 'N/A'}
      </Typography>
    </Grid>
  </Grid>
);

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request, onUpdateRequest }) => {
  const { profile } = useAuth();
  const [currentStatus, setCurrentStatus] = useState(request?.status || 'new');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<'create' | 'update'>('create');
  const [selectedQuoteIdx, setSelectedQuoteIdx] = useState<number | null>(null);
  const [scheduledStartDate, setScheduledStartDate] = useState(request?.scheduled_start_date || '');
  const [isTriaging, setIsTriaging] = useState(false);

  useEffect(() => {
    if (request) {
      setCurrentStatus(request.status);
      setScheduledStartDate(request.scheduled_start_date || '');
    }
  }, [request]);

  const handleStatusChange = async (newStatus: string) => {
    if (!request || newStatus === currentStatus) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', request.id);
      if (error) throw error;
      onUpdateRequest(); // Refresh data from parent
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    if (!request) return;
    setIsUpdating(true);
    try {
      await apiClient.post(`/requests/${request.id}/quotes/${quoteId}/accept`);
      onUpdateRequest();
    } catch (error) {
      console.error("Failed to accept quote:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !request) return;
    setIsUpdating(true);
    try {
      await apiClient.post(`/requests/${request.id}/notes`, { note: newNote });
      setNewNote("");
      onUpdateRequest();
    } catch (error) {
      console.error("Failed to add note:", error);
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
      await apiClient.post(`/triage/${request.id}`);
      onUpdateRequest(); // Refresh data to show triage results
    } catch (error) {
      console.error("Failed to triage request:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsTriaging(false);
    }
  };

  if (!isOpen || !request) return null;

  const isAdmin = profile?.role === 'admin';
  const isReadOnly = ['accepted', 'scheduled', 'completed'].includes(request.status);
  const problemDescriptionAnswer = request.answers.find(a => a.question.toLowerCase().includes('describe the general problem'));
  const otherAnswers = request.answers.filter(a => !a.question.toLowerCase().includes('describe the general problem'));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '900px', height: '90vh', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', overflow: 'hidden' }}>
        
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: '#fff',
          px: 3,
          py: 2,
          flexShrink: 0
        }}>
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
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={handleTriageRequest}
                disabled={isTriaging}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {isTriaging ? 'Triaging...' : 'Triage Request'}
              </Button>
            )}
            <IconButton onClick={onClose} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CustomerInfoSection
              request={request}
              isAdmin={isAdmin}
              isDateEditable={!isReadOnly}
              scheduledStartDate={scheduledStartDate}
              setScheduledStartDate={setScheduledStartDate}
              currentStatus={currentStatus}
              setCurrentStatus={setCurrentStatus}
              isUpdating={isUpdating}
            />
            {isAdmin && request.triage_summary && (
              <Paper variant="outlined">
                <Box sx={{ p: 2, borderLeft: 4, borderColor: 'info.main', bgcolor: '#e3f2fd' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AlertTriangle size={16} /> Triage Summary</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{request.triage_summary}</Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>Priority Score: {request.priority_score}/10</Typography>
                  {request.priority_explanation && (
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>Explanation: {request.priority_explanation}</Typography>
                  )}
                  {request.profitability_score != null && (
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>Profitability Score: {request.profitability_score}/10</Typography>
                  )}
                  {request.profitability_explanation && (
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>Explanation: {request.profitability_explanation}</Typography>
                  )}
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
              attachments={request.quote_attachments}
              editable={isAdmin && !isReadOnly}
              onUpdate={onUpdateRequest}
            />

            <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography variant="overline" sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', gap: 1 }}><MessageSquare size={16} /> Communication Log</Typography>
              <Box sx={{ overflowY: 'auto', p: 2, height: '250px' }}>
                {request.request_notes.length > 0 ? request.request_notes.map(note => (<Box key={note.id} sx={{ mb: 1.5, display: 'flex', justifyContent: note.author_role === 'admin' ? 'flex-start' : 'flex-end' }}><Box><Paper elevation={0} sx={{ p: 1.5, bgcolor: note.author_role === 'admin' ? '#e3f2fd' : '#ede7f6', borderRadius: 2 }}><Typography variant="body2">{note.note}</Typography></Paper><Typography variant="caption" display="block" sx={{ px: 1, color: 'text.secondary', textAlign: note.author_role === 'admin' ? 'left' : 'right' }}>{note.author_role === 'admin' ? 'You' : 'Customer'} - {new Date(note.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Typography></Box></Box>)) : <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No notes yet.</Typography>}
              </Box>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', gap: 1 }}><TextField label="Add a note or message..." value={newNote} onChange={(e) => setNewNote(e.target.value)} fullWidth multiline maxRows={3} size="small" /><Button variant="contained" onClick={handleAddNote} disabled={isUpdating || !newNote.trim()}>Send</Button></Box>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FilePlus size={16} /> Quotes</Typography>
              {request.quotes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No quotes yet.</Typography>
              ) : (
                <List>
                  {request.quotes.map((quote, idx) => (
                    <ListItem key={quote.id || idx} disablePadding secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isReadOnly && quote.status !== 'accepted' && (
                          <Button variant="contained" size="small" color="success" onClick={() => handleAcceptQuote(quote.id)} disabled={isUpdating}>
                            Accept
                          </Button>
                        )}
                        <Button variant="outlined" size="small" onClick={() => { setQuoteModalMode('update'); setSelectedQuoteIdx(idx); setShowQuoteForm(true); }}>
                          {isAdmin && !isReadOnly ? 'Update' : 'View Details'}
                        </Button>
                      </Box>
                    }>
                      <ListItemText
                        primary={`Quote #${idx + 1} - ${quote.quote_amount}`}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={quote.status || 'N/A'}
                              color={getQuoteStatusChipColor(quote.status)}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              | Created: {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                            </Typography>
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
                <Select value={currentStatus} label="Update Status" onChange={(e) => handleStatusChange(e.target.value as string)} disabled={isUpdating || isReadOnly}>
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
        quote={quoteModalMode === 'update' && selectedQuoteIdx !== null ? request.quotes[selectedQuoteIdx] : undefined}
        editable={isAdmin && !isReadOnly}
        requestId={request.id}
        request={request}
      />
    </div>
  );
};

export default RequestDetailModal;