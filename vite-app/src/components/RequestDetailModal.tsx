// RequestDetailModal.tsx (v3.3 - Final Polished UI)

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Button, CircularProgress, Grid, Chip, Select, MenuItem, FormControl, InputLabel, ListItemIcon } from '@mui/material';
import { X as XIcon, User, Phone, Mail, MapPin, Wrench, Clock, Image as ImageIcon, FileText as FileTextIcon } from 'lucide-react';

// --- Interfaces (no changes needed) ---
interface UserProfile { name: string; email: string; phone: string; }
interface Attachment { file_name: string; mime_type: string | null; }
interface Answer { question: string; answer: string; }
interface QuoteRequest {
  id: string; created_at: string; problem_category: string; status: string;
  answers: Answer[]; quote_attachments: Attachment[]; service_address: string;
  user_profiles: UserProfile | null;
}
interface RequestDetailModalProps { isOpen: boolean; onClose: () => void; request: QuoteRequest | null; }

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request }) => {
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(request?.status || 'new');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => { if (request) setCurrentStatus(request.status); }, [request]);

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    setIsUpdating(true);
    setCurrentStatus(newStatus);
    const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', request.id);
    if (error) { console.error("Failed to update status:", error); setCurrentStatus(request.status); }
    setIsUpdating(false);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAttachments = async () => {
      setImageUrls({});
      if (!request || !request.quote_attachments || request.quote_attachments.length === 0) return;
      
      setLoadingImages(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMounted) { setLoadingImages(false); return; }

      const urls: { [key: string]: string } = {};
      await Promise.all(
        request.quote_attachments.map(async (att) => {
          try {
            const encodedFileName = encodeURIComponent(att.file_name);
            const response = await fetch(`/api/storage/object/${request.id}/${encodedFileName}`, {
              method: 'GET', headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (response.ok) {
              const blob = await response.blob();
              if (isMounted) urls[att.file_name] = URL.createObjectURL(blob);
            }
          } catch (error) { console.error("Failed to fetch attachment blob:", error); }
        })
      );
      if (isMounted) { setImageUrls(urls); setLoadingImages(false); }
    };

    if (isOpen) fetchAttachments();
    return () => { isMounted = false; Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url)); };
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const getStatusChipColor = (status: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const colorMap = { new: 'primary', viewed: 'info', quoted: 'warning', scheduled: 'success', completed: 'default' };
    return colorMap[status as keyof typeof colorMap] || 'default';
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={12} sx={{ width: '90%', maxWidth: '900px', height: '90vh', p: { xs: 2, sm: 3, md: 4 }, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f7f9fc' }}>
        <Button onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16, minWidth: 'auto', p: 1, zIndex: 1 }}><XIcon size={24} /></Button>
        
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>Quote Request Details</Typography>
          <Typography variant="caption" color="text.secondary">Request ID: {request.id}</Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Wrench size={24} color="#1976d2" />
              <Typography variant="h6" component="h3" sx={{ fontWeight: 500 }}>
                {request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label={currentStatus} color={getStatusChipColor(currentStatus)} size="small" sx={{ textTransform: 'capitalize' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <Clock size={16} />
                  <Typography variant="body2">{new Date(request.created_at).toLocaleString()}</Typography>
              </Box>
            </Box>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><List dense><ListItem><ListItemIcon sx={{minWidth: 32}}><User size={18}/></ListItemIcon><ListItemText primary="Name" secondary={request.user_profiles?.name || 'N/A'} /></ListItem><ListItem><ListItemIcon sx={{minWidth: 32}}><Mail size={18}/></ListItemIcon><ListItemText primary="Email" secondary={request.user_profiles?.email || 'N/A'} /></ListItem></List></Grid>
            <Grid item xs={12} sm={6}><List dense><ListItem><ListItemIcon sx={{minWidth: 32}}><Phone size={18}/></ListItemIcon><ListItemText primary="Phone" secondary={request.user_profiles?.phone || 'N/A'} /></ListItem><ListItem><ListItemIcon sx={{minWidth: 32}}><MapPin size={18}/></ListItemIcon><ListItemText primary="Service Address" secondary={request.service_address || 'N/A'} /></ListItem></List></Grid>
          </Grid>
        </Paper>

        {/* --- MAIN SCROLLABLE CONTENT AREA --- */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white', mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Customer's Answers</Typography>
              <List dense>
                {request.answers.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                      <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{item.question}</Typography>} />
                      <ListItemText secondary={<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', pl: 2, color: 'text.secondary' }}>{item.answer}</Typography>} />
                    </ListItem>
                    {index < request.answers.length - 1 && <Divider component="li" light />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {request.quote_attachments && request.quote_attachments.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Attachments</Typography>
                {loadingImages ? <CircularProgress size={24} /> : (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {request.quote_attachments.map((att) => (
                      <a href={imageUrls[att.file_name]} target="_blank" rel="noopener noreferrer" key={att.file_name} title={`View ${att.file_name}`}>
                        {att.mime_type?.startsWith('image/') ? (
                           <img src={imageUrls[att.file_name]} alt={att.file_name} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }} />
                        ) : (
                          <Box sx={{width: 120, height: 120, border: '1px solid #ddd', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p:1}}>
                            <FileTextIcon size={24} />
                            <Typography variant="caption" sx={{ mt: 1, wordBreak: 'break-all' }}>{att.file_name}</Typography>
                          </Box>
                        )}
                      </a>
                    ))}
                  </Box>
                )}
              </Paper>
            )}
        </Box>

        {/* --- ACTION FOOTER --- */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Update Status</InputLabel><Select value={currentStatus} label="Update Status" onChange={(e) => handleStatusChange(e.target.value)} disabled={isUpdating}><MenuItem value="new">New</MenuItem><MenuItem value="viewed">Viewed</MenuItem><MenuItem value="quoted">Quoted</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
          <Button variant="outlined" startIcon={<Phone />}>Call Customer</Button>
          <Button variant="contained" onClick={onClose}>Close</Button>
        </Box>
      </Paper>
    </div>
  );
};

export default RequestDetailModal;