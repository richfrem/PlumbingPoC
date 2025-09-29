// packages/frontend/src/features/requests/components/RequestDetailModal.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Paper, Button, Snackbar, Alert, Grid, Typography, CircularProgress } from '@mui/material';
import { Zap, RefreshCw } from 'lucide-react';
import { QuoteRequest } from '../types';
import AttachmentSection from './AttachmentSection';
import apiClient from '../../../lib/apiClient';
import CustomerInfoSection from './CustomerInfoSection';
import CommunicationLog from './CommunicationLog';
import QuoteList from './QuoteList';
import RequestProblemDetails from './RequestProblemDetails';
import AITriageSummary from './AITriageSummary';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import RequestActions from './RequestActions';
import CompleteJobModal from './CompleteJobModal';
import ServiceLocationManager from './ServiceLocationManager';
import ScheduleJobSection from './ScheduleJobSection';
import { useUpdateRequestStatus, useAcceptQuote, useTriageRequest, useUpdateAddressMutation, useMarkRequestAsViewed } from '../../../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequestById } from '../../../hooks';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null;
  onUpdateRequest: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request: initialRequest, onUpdateRequest }) => {
  const { profile } = useAuth();
  
  const requestId = initialRequest?.id;
  const { data: requestArray, loading, error, refetch } = useRequestById(requestId || '', {
    enabled: !!requestId && isOpen
  });
  const request = requestArray?.[0] || initialRequest;

  const refreshRequestData = () => {
    refetch();
  };

  useEffect(() => {
    if (!isOpen || !requestId) return;
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [isOpen, requestId, refetch]);

  useEffect(() => {
    if (!isOpen || !requestId) return;
    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen, requestId, refetch]);

  const updateStatusMutation = useUpdateRequestStatus();
  const acceptQuoteMutation = useAcceptQuote();
  const triageMutation = useTriageRequest();
  const updateAddressMutation = useUpdateAddressMutation();
  const markAsViewedMutation = useMarkRequestAsViewed();
  const queryClient = useQueryClient();

  const completeJobMutation = useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: { actual_cost: number; completion_notes: string } }) => {
      const response = await apiClient.patch(`/requests/${requestId}/complete`, data);
      return response.data;
    },
  });


  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledDateChanged, setScheduledDateChanged] = useState(false);
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const viewedMarker = useRef<string | null>(null);

  useEffect(() => {
    if (request) {
      setScheduledStartDate(request.scheduled_start_date ? new Date(request.scheduled_start_date).toISOString().split('T')[0] : '');
      setScheduledDateChanged(false);
    }
  }, [request?.scheduled_start_date]);

  useEffect(() => {
    const handleSnackbarEvent = (event: CustomEvent) => {
      setSnackbarMessage(event.detail.message);
      setSnackbarSeverity(event.detail.severity);
      setSnackbarOpen(true);
    };
    window.addEventListener('show-snackbar', handleSnackbarEvent as EventListener);
    return () => window.removeEventListener('show-snackbar', handleSnackbarEvent as EventListener);
  }, []);

  const handleStatusUpdate = async (newStatus: string, date?: string | null) => {
    if (!request) return;
    await updateStatusMutation.mutateAsync({ requestId: request.id, status: newStatus, scheduledStartDate: date ?? null });
  };
  
  const handleAcceptQuote = (quoteId: string) => {
    if (!request) return;
    acceptQuoteMutation.mutate({ requestId: request.id, quoteId });
  };
  
  const handleTriageRequest = async () => {
    if (!request) return;
    triageMutation.mutate({ requestId: request.id }, {
      onSuccess: () => {
        refreshRequestData();
      }
    });
  };
  
  const handleSaveScheduledDate = async () => {
    if (!request || !scheduledStartDate) return;
    const utcDate = new Date(scheduledStartDate);
    await handleStatusUpdate('scheduled', utcDate.toISOString());
  };

  const handleDateChange = useCallback((date: string) => {
    setScheduledStartDate(date);
    setScheduledDateChanged(true);
  }, []);

  const handleSaveAndSchedule = useCallback(async () => {
    if (!request || !scheduledStartDate) return;
    const utcDate = new Date(scheduledStartDate);
    try {
      await handleStatusUpdate('scheduled', utcDate.toISOString());
      setScheduledDateChanged(false);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      // Error handled by mutation hook
    }
  }, [request, scheduledStartDate, handleStatusUpdate, onClose]);

  const handleOpenCompleteModal = useCallback(() => setCompleteModalOpen(true), []);

  const handleConfirmCompletion = useCallback(async (data: { actual_cost: number; completion_notes: string }) => {
    if (!request) return;
    try {
      await updateStatusMutation.mutateAsync({ requestId: request.id, status: 'completed' });
      setSnackbarMessage('✅ Job successfully marked as completed!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      onClose();
      onUpdateRequest();
    } catch (error) {
      setSnackbarMessage('❌ Failed to complete job. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [request, updateStatusMutation, onClose, onUpdateRequest]);

  const handleAddressUpdate = useCallback(async (addressData: { service_address: string; latitude: number | null; longitude: number | null; geocoded_address: string | null }): Promise<void> => {
    if (!request) return;
    try {
      await apiClient.patch(`/requests/${request.id}`, addressData);
      queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      setSnackbarMessage('Service address updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to update service address:', error);
      setSnackbarMessage('Failed to update service address. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      throw error;
    }
  }, [request, queryClient]);

  useEffect(() => {
    // --- THE FIX: Use a ref to prevent re-firing the mutation ---
    if (isOpen && request && profile?.role !== 'admin' && request.status === 'quoted' && viewedMarker.current !== request.id) {
      viewedMarker.current = request.id; // Mark as viewed for this session
      markAsViewedMutation.mutate(request.id);
    }
    // Reset when modal closes
    if (!isOpen) {
      viewedMarker.current = null;
    }
  }, [isOpen, request, profile, markAsViewedMutation]);

  if (!isOpen || !request) return null;

  const isAdmin = profile?.role === 'admin';
  const isReadOnly = ['completed'].includes(request.status);
  const hasAcceptedQuotes = request.quotes?.some(q => q.status === 'accepted') || false;
  const isEditable = !isReadOnly && (isAdmin || !hasAcceptedQuotes);
  const canEditAttachments = !isReadOnly;

  const headerTitle = `Job Docket: ${request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const headerSubtitle = `ID: ${request.id} | Received: ${new Date(request.created_at).toLocaleString()}`;
  
  const headerActions = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {loading && <RefreshCw size={14} className="animate-spin" />}
      {isAdmin && !request.triage_summary && (
        <Button variant="contained" color="secondary" size="small" onClick={handleTriageRequest} disabled={triageMutation.isPending} startIcon={<Zap />}>
          {triageMutation.isPending ? 'Triaging...' : 'AI Triage'}
        </Button>
      )}
    </Box>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '800px', height: '90vh', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', overflow: 'hidden' }}>
        
        <ModalHeader title={headerTitle} subtitle={headerSubtitle} onClose={onClose} actions={headerActions} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Customer Name</Typography>
                  <Typography variant="body1">{request.user_profiles?.name || request.customer_name || 'N/A'}</Typography>
                </Box>
              </Grid>
              <ServiceLocationManager mode="view" initialAddress={request.service_address} isAdmin={isAdmin} onSave={handleAddressUpdate} onModeChange={() => {}} isUpdating={updateAddressMutation.isPending}/>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Status</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{request.status}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Service Type</Typography>
                  <Typography variant="body1">{request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                </Box>
              </Grid>
            </Grid>
            {isAdmin && <AITriageSummary request={request} />}
            <RequestProblemDetails request={request} />
            <AttachmentSection requestId={request.id} attachments={request.quote_attachments || []} editable={canEditAttachments} onUpdate={refreshRequestData} />
            <CommunicationLog requestId={request.id} onNoteAdded={refreshRequestData} />
            <QuoteList
              request={request}
              isReadOnly={isReadOnly}
              isUpdating={acceptQuoteMutation.isPending}
              onAcceptQuote={handleAcceptQuote}
              onUpdateRequest={refreshRequestData}
            />
            {isAdmin && request.status === 'accepted' && !request.scheduled_start_date && (
              <ScheduleJobSection scheduledDate={scheduledStartDate} onDateChange={setScheduledStartDate} onSaveSchedule={handleSaveAndSchedule} isUpdating={updateStatusMutation.isPending} dateChanged={scheduledDateChanged} />
            )}
          </Box>
        </Box>

        <ModalFooter>
          <RequestActions
            request={request}
            isAdmin={isAdmin}
            currentStatus={request.status}
            isUpdating={updateStatusMutation.isPending}
            onStatusChange={(newStatus) => handleStatusUpdate(newStatus)}
            scheduledDateChanged={scheduledDateChanged}
            onSaveAndSchedule={handleSaveAndSchedule}
            onMarkCompleted={handleOpenCompleteModal}
          />
        </ModalFooter>
      </Paper>

      <CompleteJobModal isOpen={isCompleteModalOpen} onClose={() => setCompleteModalOpen(false)} onConfirm={handleConfirmCompletion} isSubmitting={completeJobMutation.isPending} jobTitle={request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
      </Snackbar>
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RequestDetailModal;