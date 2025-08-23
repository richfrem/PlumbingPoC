// RequestDetailModal.tsx (v6.6 - Final Polished UI Spec Implementation)

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import { Box, Typography, Paper, Grid, Chip, Select, MenuItem, FormControl, InputLabel, TextField, IconButton, Button, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { X as XIcon, User, Phone, Mail, MapPin, MessageSquare, FilePlus, Image as ImageIcon, FileText as FileTextIcon, HelpCircle, AlertTriangle } from 'lucide-react';
import { QuoteRequest } from './Dashboard';
import QuoteFormModal from './QuoteFormModal';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null;
  onUpdateRequest: (updatedRequest: QuoteRequest) => void;
}

// Reusable component for consistent key-value pair display in the Q&A section
const AnswerItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
    <Grid container item xs={12} spacing={1} sx={{ mb: 1 }}>
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
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(request?.status || 'new');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDetails, setQuoteDetails] = useState('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<'create'|'update'>('create');

  useEffect(() => {
    if (request) {
      setCurrentStatus(request.status);
      setShowQuoteForm(false);
      setQuoteAmount('');
      setQuoteDetails('');
    }
  }, [request]);

  useEffect(() => {
    if (!request?.quote_attachments?.length) {
      setImageUrls({}); return;
    }
    let isMounted = true;
    const fetchAttachments = async () => {
      setLoadingImages(true);
      const newImageUrls: { [key: string]: string } = {};
      for (const att of request.quote_attachments) {
        if (att.mime_type?.startsWith('image/')) {
          try {
            const response = await apiClient.get(`/requests/storage-object/${request.id}/${att.file_name}`, { responseType: 'blob' });
            if (response.data && isMounted) newImageUrls[att.file_name] = URL.createObjectURL(response.data);
          } catch (error) { console.error(`Failed to fetch attachment blob:`, error); }
        }
      }
      if (isMounted) { setImageUrls(newImageUrls); setLoadingImages(false); }
    };
    fetchAttachments();
    return () => { isMounted = false; Object.values(imageUrls).forEach(URL.revokeObjectURL); };
  }, [request]);

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    setIsUpdating(true);
    setCurrentStatus(newStatus);
    try {
      await supabase.from('requests').update({ status: newStatus }).eq('id', request.id);
      onUpdateRequest({ ...request, status: newStatus });
    } catch (error) { console.error("Failed to update status:", error); setCurrentStatus(request.status); }
    setIsUpdating(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !request) return;
    setIsUpdating(true);
    try {
      const { data: addedNote } = await apiClient.post(`/requests/${request.id}/notes`, { note: newNote });
      const updatedNotes = [...request.request_notes, addedNote].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      onUpdateRequest({ ...request, request_notes: updatedNotes });
      setNewNote("");
    } catch (error) { console.error("Failed to add note:", error); } 
    finally { setIsUpdating(false); }
  };

  const handleCreateQuote = async () => {
    if (!quoteAmount || !quoteDetails || !request) return;
    setIsUpdating(true);
    try {
      const payload = { quote_amount: parseFloat(quoteAmount), details: quoteDetails };
      const { data: newQuote } = await apiClient.post(`/requests/${request.id}/quotes`, payload);
      const updatedQuotes = [...request.quotes, newQuote];
      onUpdateRequest({ ...request, quotes: updatedQuotes, status: 'quoted' });
      setCurrentStatus('quoted');
    } catch (error) { console.error("Failed to create quote:", error); } 
    finally { setIsUpdating(false); }
  };

  if (!isOpen || !request) return null;
  const isAdmin = profile?.role === 'admin';
  const getStatusChipColor = (status: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const colorMap = { new: 'primary', viewed: 'info', quoted: 'warning', scheduled: 'success', completed: 'default' };
    return colorMap[status as keyof typeof colorMap] || 'default';
  };

  const problemDescriptionAnswer = request.answers.find(a => a.question.toLowerCase().includes('describe the general problem'));
  const otherAnswers = request.answers.filter(a => !a.question.toLowerCase().includes('describe the general problem'));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '900px', height: '90vh', p: { xs: 2, md: 3 }, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8' }}>
        
        <Box sx={{ flexShrink: 0, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>Job Docket: {request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {request.id} | Received: {new Date(request.created_at).toLocaleString()}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}><XIcon size={24} /></IconButton>
        </Box>
        <Divider sx={{ mb: 2, flexShrink: 0 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1}}><User size={16}/> Customer Info</Typography>
              <Grid container spacing={2} sx={{mt: 0.5}}>
                {/* Re-using DetailItem for consistency was a good idea, but here we need more control */}
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Name</Typography>
                    <Typography variant="body1">{request.user_profiles?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Phone</Typography>
                    <Button component="a" href={`tel:${request.user_profiles?.phone}`} size="small" sx={{p:0, justifyContent: 'flex-start'}}>{request.user_profiles?.phone}</Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</Typography>
                    <Button component="a" href={`mailto:${request.user_profiles?.email}`} size="small" sx={{p:0, justifyContent: 'flex-start', textTransform: 'none'}}>{request.user_profiles?.email}</Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Service Address</Typography>
                    <Button component="a" href={`https://maps.google.com/?q=${encodeURIComponent(request.service_address)}`} target="_blank" size="small" sx={{p:0, justifyContent: 'flex-start', textAlign: 'left'}}>{request.service_address}</Button>
                </Grid>
              </Grid>
            </Paper>

            <Paper variant="outlined">
              <Box sx={{ p: 2, borderLeft: 4, borderColor: 'warning.main', bgcolor: '#fff3e0' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1}}><AlertTriangle size={16}/> Reported Problem</Typography>
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mt: 1 }}>"{problemDescriptionAnswer?.answer || 'N/A'}"</Typography>
              </Box>
              <Divider />
              <Box sx={{p: 2}}>
                <Grid container spacing={2}>
                    {otherAnswers.map(ans => (<AnswerItem key={ans.question} question={ans.question} answer={ans.answer} />))}
                </Grid>
              </Box>
            </Paper>
            
            {request.quote_attachments.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="overline" color="text.secondary">Attachments</Typography>
                {loadingImages ? <CircularProgress size={24} sx={{mt:1}}/> : (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {request.quote_attachments.map((att) => (<a href={imageUrls[att.file_name]} target="_blank" rel="noopener noreferrer" key={att.file_name} title={att.file_name}>{att.mime_type?.startsWith('image/') && imageUrls[att.file_name] ? <img src={imageUrls[att.file_name]} alt={att.file_name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} /> : <Box sx={{width: 100, height: 100, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200'}}><FileTextIcon size={24} /><Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>{att.file_name}</Typography></Box>}</a>))}
                  </Box>
                )}
              </Paper>
            )}

            <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography variant="overline" sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', gap: 1 }}><MessageSquare size={16}/> Communication Log</Typography>
              <Box sx={{ overflowY: 'auto', p: 2, height: '250px' }}>
                {request.request_notes.length > 0 ? request.request_notes.map(note => (<Box key={note.id} sx={{ mb: 1.5, display: 'flex', justifyContent: note.author_role === 'admin' ? 'flex-start' : 'flex-end' }}><Box><Paper elevation={0} sx={{ p: 1.5, bgcolor: note.author_role === 'admin' ? '#e3f2fd' : '#ede7f6', borderRadius: 2 }}><Typography variant="body2">{note.note}</Typography></Paper><Typography variant="caption" display="block" sx={{ px: 1, color: 'text.secondary', textAlign: note.author_role === 'admin' ? 'left' : 'right' }}>{note.author_role === 'admin' ? 'You' : 'Customer'} - {new Date(note.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Typography></Box></Box>)) : <Typography variant="body2" color="text.secondary" sx={{p:2, textAlign:'center'}}>No notes yet.</Typography>}
              </Box>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', gap: 1 }}><TextField label="Add a note or log a call..." value={newNote} onChange={(e) => setNewNote(e.target.value)} fullWidth multiline maxRows={3} size="small" /><Button variant="contained" onClick={handleAddNote} disabled={isUpdating || !newNote.trim()}>Save Note</Button></Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          {isAdmin && (
            <Box>
      {request.quotes.length > 0 ? (
        <Button variant="outlined" color="success" startIcon={<FilePlus/>} onClick={() => { setQuoteModalMode('update'); setShowQuoteForm(true); }}>Update Quote</Button>
      ) : (
        <Button variant="contained" startIcon={<FilePlus />} onClick={() => { setQuoteModalMode('create'); setShowQuoteForm(true); }}>Create Quote</Button>
      )}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Update Status</InputLabel><Select value={currentStatus} label="Update Status" onChange={(e) => handleStatusChange(e.target.value)} disabled={isUpdating}><MenuItem value="new">New</MenuItem><MenuItem value="viewed">Viewed</MenuItem><MenuItem value="quoted">Quoted</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
            <Button variant="outlined" component="a" href={`tel:${request.user_profiles?.phone}`} disabled={!request.user_profiles?.phone} startIcon={<Phone />}>Call Customer</Button>
          </Box>
        </Box>
      </Paper>
      <QuoteFormModal
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
        quote={quoteModalMode === 'update' ? request.quotes[0] : undefined}
        editable={isAdmin}
        address={request?.address || ''}
        requestId={request.id}
      />
    </div>
  );
};

export default RequestDetailModal;