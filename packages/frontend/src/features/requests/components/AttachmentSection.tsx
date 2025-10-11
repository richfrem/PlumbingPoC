// packages/frontend/src/features/requests/components/AttachmentSection.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import apiClient from '../../../lib/apiClient';
import { Box, Typography, Paper, Button, CircularProgress, Alert, IconButton, Divider } from '@mui/material';
import { FileText as FileTextIcon, Paperclip, X as XIcon, UploadCloud } from 'lucide-react';
import { QuoteAttachment } from '../types';
import { useRequestById } from '../../../hooks';

interface AttachmentSectionProps {
  requestId: string;
  attachments?: QuoteAttachment[]; // Made optional since we'll use the hook
  pendingFiles?: File[];
  editable: boolean;
  onUpdate?: () => void; // Made optional since real-time handles updates
  onNewFiles?: (files: File[]) => void;
  onRemovePendingFile?: (index: number) => void;
  quoteId?: string | null;
}

const AttachmentGroup: React.FC<{ title: string; attachments: (QuoteAttachment | File)[]; imageUrls: { [key: string]: string }; onRemove?: ((index: number) => void) | undefined; editable?: boolean }> = ({ title, attachments, imageUrls, onRemove, editable }) => {
  if (attachments.length === 0) return null;
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {attachments.map((att, index) => {
          const isFile = att instanceof File;
          const key = isFile ? `pending-${index}` : att.id;
          const name = isFile ? att.name : att.file_name;
          const type = isFile ? att.type : att.mime_type;
          const urlKey = isFile ? `pending-${index}` : att.id;
          const url = imageUrls[urlKey];

          return (
            <Box key={key} sx={{ position: 'relative', width: 100, height: 100 }}>
              <a href={url} target="_blank" rel="noopener noreferrer" title={name}>
                {type?.startsWith('image/') && url ? (
                  <img src={url} alt={name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <Box sx={{ width: 100, height: 100, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                    <FileTextIcon size={24} />
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-all', p: '0 4px' }}>{name}</Typography>
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
};


const AttachmentSection: React.FC<AttachmentSectionProps> = ({ requestId, attachments: initialAttachments, pendingFiles = [], editable, onUpdate, onNewFiles, onRemovePendingFile, quoteId = null }) => {
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [pendingImageUrls, setPendingImageUrls] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  console.log('🔧 AttachmentSection DEBUG:', {
    requestId,
    editable,
    typeof_editable: typeof editable,
    pendingFiles_length: pendingFiles.length,
    quoteId
  });

  // For new requests (requestId === "new-request"), don't fetch existing data
  // Only fetch for existing requests that have real IDs
  const isNewRequest = requestId === 'new-request';
  const { data: requestArray, loading: requestLoading, error: requestError } = useRequestById(requestId, {
    enabled: !!requestId && !isNewRequest // Only fetch for real request IDs, not "new-request"
  });
  const request = requestArray?.[0];
  const attachments = isNewRequest ? [] : (request?.quote_attachments || initialAttachments || []);

  // Clear signed URLs and pending images when requestId changes to prevent showing old attachments
  useEffect(() => {
    setSignedUrls({});
    setPendingImageUrls({});
    setError(null);
    // Also clear any existing object URLs to prevent memory leaks
    Object.values(pendingImageUrls).forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }, [requestId]);
  
  console.log('🔍 AttachmentSection using standardized real-time system:', {
    requestId,
    attachmentsLength: attachments?.length,
    attachmentIds: attachments?.map(a => a.id) || [],
    pendingFilesLength: pendingFiles?.length,
    pendingFileNames: pendingFiles?.map(f => f.name) || [],
    requestLoading,
    requestError,
    hasRealTimeData: !!request,
    signedUrlsCount: Object.keys(signedUrls).length,
    pendingUrlsCount: Object.keys(pendingImageUrls).length,
    timestamp: new Date().toISOString()
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      console.log('🔧 AttachmentSection onDrop triggered:', {
        filesCount: acceptedFiles.length,
        hasOnNewFiles: !!onNewFiles,
        requestId,
        editable
      });
      
      if (onNewFiles) {
        onNewFiles(acceptedFiles);
      } else {
        // For direct upload
        uploadFiles(acceptedFiles);
      }
    }
  });

  const stableAttachmentKey = useMemo(() => {
    return attachments.map(att => att.id).sort().join(',');
  }, [attachments]);

  // *** THE DEFINITIVE FIX: Create a stable key for the pendingFiles prop as well. ***
  // This uses the file name and size to create a unique, primitive key that is immune
  // to the parent passing a new array instance.
  const stablePendingFileKey = useMemo(() => {
    return pendingFiles.map(f => `${f.name}-${f.size}`).join(',');
  }, [pendingFiles]);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setLoading(true);
      const filePaths = attachments.map(att => att.file_url);
      supabase.storage.from('PlumbingPoCBucket').createSignedUrls(filePaths, 3600)
        .then(({ data, error }) => {
          if (error) throw error;
          if (data) {
           const urlMap = attachments.reduce((acc, att, index) => {
             if (data[index] && data[index].signedUrl) {
               acc[att.id] = data[index].signedUrl;
             }
             return acc;
           }, {} as { [key: string]: string });
           setSignedUrls(urlMap);
         }
        })
        .catch(err => setError("Failed to load attachments."))
        .finally(() => setLoading(false));
    } else {
        setSignedUrls({});
    }
  }, [stableAttachmentKey]);

  useEffect(() => {
    const objectUrls: { [key: string]: string } = {};
    if (pendingFiles.length > 0) {
      pendingFiles.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          objectUrls[`pending-${index}`] = URL.createObjectURL(file);
        }
      });
      setPendingImageUrls(objectUrls);
    } else {
      setPendingImageUrls({});
    }

    return () => {
      // Clean up object URLs when the effect runs again or component unmounts
      Object.values(objectUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [stablePendingFileKey]); // Use the new stable key here.

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any remaining object URLs
      Object.values(pendingImageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    console.log('🚀 AttachmentSection uploadFiles called:', {
      filesCount: files.length,
      requestId,
      quoteId,
      fileNames: files.map(f => f.name)
    });

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('request_id', requestId);
      if (quoteId) {
        formData.append('quote_id', quoteId);
      }
      files.forEach(file => {
        formData.append('attachment', file);
      });

      const response = await apiClient.post('/requests/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('✅ Attachment uploaded successfully:', response.data);
      console.log('✅ Attachment upload complete, real-time system will handle updates automatically');
      
      // Call onUpdate callback if parent component needs additional side effects
      onUpdate?.();
    } catch (err: any) {
      console.error('❌ Attachment upload failed:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to upload files.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('🔧 AttachmentSection handleFileUpload:', {
      filesCount: files.length,
      hasOnNewFiles: !!onNewFiles,
      requestId,
      editable
    });

    if (onNewFiles) {
      onNewFiles(Array.from(files));
      event.target.value = '';
      return;
    }

    await uploadFiles(Array.from(files));
    event.target.value = '';
  };

  const allUrls = { ...signedUrls, ...pendingImageUrls };
  const requestAttachments = attachments.filter(att => !att.quote_id);
  const quotesWithAttachments = attachments
    .filter(att => att.quote_id)
    .reduce((acc, att) => {
      const qId = att.quote_id!;
      if (!acc[qId]) acc[qId] = [];
      acc[qId].push(att);
      return acc;
    }, {} as { [key: string]: QuoteAttachment[] });
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paperclip size={16} /> Attachments
      </Typography>
      {loading && <CircularProgress size={24} sx={{ mt: 1 }} />}
      <AttachmentGroup title="Customer Uploads (Request)" attachments={requestAttachments} imageUrls={allUrls} />
      {Object.entries(quotesWithAttachments).map(([qId, quoteAtts]) => (
        <AttachmentGroup key={qId} title={`Attachments for Quote #${qId.substring(0, 4)}`} attachments={quoteAtts} imageUrls={allUrls} />
      ))}
      {pendingFiles.length > 0 && (
        <AttachmentGroup title="New Pending Uploads" attachments={pendingFiles} imageUrls={allUrls} onRemove={onRemovePendingFile ? onRemovePendingFile : undefined} editable={editable} />
      )}
      {attachments.length === 0 && pendingFiles.length === 0 && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No attachments yet.</Typography>
      )}
      {editable && (
        <Box sx={{ mt: 2 }}>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            }}
          >
            <input {...getInputProps()} />
            <UploadCloud size={32} style={{ margin: '0 auto', color: '#9e9e9e' }} />
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>
              {isDragActive ? 'Drop the files here...' : "Drag 'n' drop files here, or click to select"}
            </Typography>
          </Box>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
};

export default AttachmentSection;