// vite-app/src/components/AttachmentSection.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadAttachments } from '../lib/apiClient';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { FileText as FileTextIcon, Paperclip } from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  quote_id?: string;
}

interface AttachmentSectionProps {
  requestId: string;
  quoteId?: string;
  attachments: Attachment[];
  editable: boolean;
  onUpdate: () => void;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({ requestId, quoteId, attachments, editable, onUpdate }) => {
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!attachments || attachments.length === 0) {
      setImageUrls({});
      return;
    }
    let isMounted = true;
    const fetchAttachments = async () => {
      setLoadingImages(true);
      const filePaths = attachments.map(att => {
        try {
          if (att.file_url.startsWith('http')) {
            const url = new URL(att.file_url);
            const pathSegments = url.pathname.split('/');
            const bucketIndex = pathSegments.indexOf('PlumbingPoCBucket');
            if (bucketIndex !== -1) {
              return pathSegments.slice(bucketIndex + 1).join('/');
            }
          }
        } catch (e) {
          console.error('Error parsing file_url:', e);
        }
        return att.file_url;
      });

      const { data: signedUrlsData, error } = await supabase.storage
        .from('PlumbingPoCBucket')
        .createSignedUrls(filePaths, 3600);

      if (error) {
        console.error("Error creating signed URLs:", error);
        setLoadingImages(false);
        return;
      }

      if (signedUrlsData && isMounted) {
        const newImageUrls: { [key: string]: string } = {};
        signedUrlsData.forEach((item, index) => {
          if (item.signedUrl) {
            const attachment = attachments[index];
            newImageUrls[attachment.id] = item.signedUrl;
          }
        });
        setImageUrls(newImageUrls);
      }
      setLoadingImages(false);
    };

    fetchAttachments();
    return () => { isMounted = false; };
  }, [attachments]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    try {
      await uploadAttachments(requestId, Array.from(files), quoteId);
      onUpdate(); // Trigger a refresh in the parent component
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || err.message || 'Failed to upload files.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Attachments</Typography>
      {loadingImages ? (
        <CircularProgress size={24} sx={{ mt: 1 }} />
      ) : (
        <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {attachments.map((att) => (
            <a href={imageUrls[att.id]} target="_blank" rel="noopener noreferrer" key={att.id} title={att.file_name}>
              {att.mime_type?.startsWith('image/') && imageUrls[att.id] ? (
                <img src={imageUrls[att.id]} alt={att.file_name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <Box sx={{ width: 100, height: 100, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                  <FileTextIcon size={24} />
                  <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>{att.file_name}</Typography>
                </Box>
              )}
            </a>
          ))}
        </Box>
      )}
      {attachments.length === 0 && !loadingImages && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No attachments yet.</Typography>
      )}
      
      {editable && (
        <Box sx={{ mt: 2 }}>
          <Button component="label" startIcon={<Paperclip />} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Add Attachment'}
            <input type="file" hidden multiple onChange={handleFileUpload} />
          </Button>
          {uploading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Box>
      )}
      {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
    </Paper>
  );
};

export default AttachmentSection;
