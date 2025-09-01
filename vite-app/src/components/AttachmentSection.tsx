// vite-app/src/components/AttachmentSection.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadAttachments } from '../lib/apiClient';
import { Box, Typography, Paper, Button, CircularProgress, Alert, IconButton, Divider } from '@mui/material';
import { FileText as FileTextIcon, Paperclip, X as XIcon } from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  quote_id?: string | null;
}

interface AttachmentSectionProps {
  requestId: string;
  attachments: Attachment[];
  pendingFiles?: File[];
  editable: boolean;
  onUpdate: () => void;
  onNewFiles?: (files: File[], quoteId?: string | null) => void;
  onRemovePendingFile?: (index: number) => void;
  // Specific quoteId for filtering when this component is used in a quote context
  quoteId?: string | null;
}

const AttachmentGroup: React.FC<{ title: string; attachments: (Attachment | File)[]; imageUrls: { [key: string]: string }; onRemove?: (index: number) => void; editable?: boolean }> = ({ title, attachments, imageUrls, onRemove, editable }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>{title}</Typography>
    <Divider sx={{ mb: 1.5 }} />
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {attachments.map((att, index) => {
        const isFile = att instanceof File;
        const key = isFile ? `pending-${index}` : att.id;
        const name = isFile ? att.name : att.file_name;
        const type = isFile ? att.type : att.mime_type;
        const url = isFile ? imageUrls[key] : imageUrls[att.id];
        
        return (
          <Box key={key} sx={{ position: 'relative', width: 100, height: 100 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" title={name}>
              {type?.startsWith('image/') && url ? (
                <img src={url} alt={name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <Box sx={{ width: 100, height: 100, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                  <FileTextIcon size={24} />
                  <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-all' }}>{name}</Typography>
                </Box>
              )}
            </a>
            {isFile && editable && onRemove && (
              <IconButton size="small" onClick={() => onRemove(index)} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}>
                <XIcon size={14} />
              </IconButton>
            )}
          </Box>
        );
      })}
    </Box>
  </Box>
);


const AttachmentSection: React.FC<AttachmentSectionProps> = ({ requestId, attachments, pendingFiles = [], editable, onUpdate, onNewFiles, onRemovePendingFile, quoteId = null }) => {
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [pendingImageUrls, setPendingImageUrls] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create stable dependencies from props that are arrays of objects
  const attachmentIds = attachments.map(att => att.id).join(',');
  const pendingFileNames = pendingFiles.map(file => file.name).join(',');

  useEffect(() => {
    // Generate signed URLs for existing attachments
    if (attachments && attachments.length > 0) {
      setLoading(true);
      const filePaths = attachments.map(att => att.file_url);
      supabase.storage.from('PlumbingPoCBucket').createSignedUrls(filePaths, 3600)
        .then(({ data, error }) => {
          if (error) throw error;
          if (data) {
            const urlMap = attachments.reduce((acc, att, index) => {
              acc[att.id] = data[index].signedUrl;
              return acc;
            }, {} as { [key: string]: string });
            setSignedUrls(urlMap);
          }
        })
        .catch(err => setError("Failed to load attachments."))
        .finally(() => setLoading(false));
    }
  }, [attachmentIds]); // Use stable dependency

  useEffect(() => {
    // Generate preview URLs for pending files
    if (pendingFiles.length > 0) {
      const objectUrls = pendingFiles.reduce((acc, file, index) => {
        acc[`pending-${index}`] = URL.createObjectURL(file);
        return acc;
      }, {} as { [key: string]: string });
      setPendingImageUrls(objectUrls);
      return () => {
        Object.values(objectUrls).forEach(url => URL.revokeObjectURL(url));
      };
    } else {
      setPendingImageUrls({});
    }
  }, [pendingFileNames]); // Use stable dependency

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (onNewFiles) {
      onNewFiles(Array.from(files), quoteId);
      event.target.value = '';
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await uploadAttachments(requestId, Array.from(files), quoteId);
      onUpdate();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to upload files.');
    } finally {
      setLoading(false);
    }
  };

  const allUrls = { ...signedUrls, ...pendingImageUrls };

  // *** THE CORE FIX IS HERE: Grouping Logic ***
  const requestAttachments = attachments.filter(att => !att.quote_id);
  const quotesWithAttachments = attachments
    .filter(att => att.quote_id)
    .reduce((acc, att) => {
      const qId = att.quote_id!;
      if (!acc[qId]) acc[qId] = [];
      acc[qId].push(att);
      return acc;
    }, {} as { [key: string]: Attachment[] });
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Attachments</Typography>
      
      {loading && <CircularProgress size={24} sx={{ mt: 1 }} />}

      {requestAttachments.length > 0 && (
        <AttachmentGroup title="Customer Uploads (Request)" attachments={requestAttachments} imageUrls={allUrls} />
      )}
      
      {Object.entries(quotesWithAttachments).map(([qId, quoteAtts]) => (
        <AttachmentGroup key={qId} title={`Attachments for Quote #${qId.substring(0, 4)}`} attachments={quoteAtts} imageUrls={allUrls} />
      ))}
      
      {pendingFiles.length > 0 && (
        <AttachmentGroup title="New Pending Uploads" attachments={pendingFiles} imageUrls={allUrls} onRemove={onRemovePendingFile} editable={editable} />
      )}
      
      {attachments.length === 0 && pendingFiles.length === 0 && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No attachments yet.</Typography>
      )}
      
      {editable && (
        <Box sx={{ mt: 2 }}>
          <Button component="label" startIcon={<Paperclip />} disabled={loading}>
            {loading ? 'Processing...' : 'Add Attachment'}
            <input type="file" hidden multiple onChange={handleFileUpload} />
          </Button>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
};

export default AttachmentSection;