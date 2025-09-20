// packages/frontend/src/features/requests/components/RequestDetailModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Paper, Button, Snackbar, Alert, Grid, Typography } from '@mui/material';
import { Zap } from 'lucide-react';
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
import { useUpdateRequestStatus, useAcceptQuote, useTriageRequest, useUpdateAddressMutation } from '../hooks/useRequestMutations';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null;
  onUpdateRequest: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request, onUpdateRequest }) => {
  const { profile } = useAuth();

  // Mutations
  const updateStatusMutation = useUpdateRequestStatus();
  const acceptQuoteMutation = useAcceptQuote();
  const triageMutation = useTriageRequest();
  const updateAddressMutation = useUpdateAddressMutation();
  const queryClient = useQueryClient();

  const completeJobMutation = useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: { actual_cost: number; completion_notes: string } }) => {
      console.log('🔧 CompleteJob: Calling API with:', { requestId, data });
      const response = await apiClient.patch(`/requests/${requestId}/complete`, data);
      console.log('✅ CompleteJob: API response:', response);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('🎉 CompleteJob: Success, data:', data);
      // Note: Success handling is now done in handleConfirmCompletion
    },
    onError: (error) => {
      console.error('💥 CompleteJob: Mutation error:', error);
      // Note: Error handling is now done in handleConfirmCompletion
    },
  });


  const markAsViewedMutation = useMutation({
    mutationFn: (requestId: string) => apiClient.patch(`/requests/${requestId}/viewed`),
    onSuccess: () => {
      // Invalidate queries to get the fresh status update from the server
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  // Local state is ONLY for UI interactions that are not driven by props.
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledDateChanged, setScheduledDateChanged] = useState(false);
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);


  // Snackbar state for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // *** THE DEFINITIVE FIX: State Synchronization Effect ***
  // This hook ensures that whenever the parent passes a new `request` object,
  // we update the local state for controlled inputs like the date picker.
  // This is the correct way to handle "props driving state" without causing loops.
  useEffect(() => {
    if (request) {
      setScheduledStartDate(request.scheduled_start_date ? new Date(request.scheduled_start_date).toISOString().split('T')[0] : '');
      setScheduledDateChanged(false); // Reset tracking when new data arrives
    }
  }, [request?.scheduled_start_date]); // This effect ONLY runs when the `request` prop itself changes.

  // Listen for custom snackbar events
  useEffect(() => {
    const handleSnackbarEvent = (event: CustomEvent) => {
      setSnackbarMessage(event.detail.message);
      setSnackbarSeverity(event.detail.severity);
      setSnackbarOpen(true);
    };

    window.addEventListener('show-snackbar', handleSnackbarEvent as EventListener);

    return () => {
      window.removeEventListener('show-snackbar', handleSnackbarEvent as EventListener);
    };
  }, []);

  const handleStatusUpdate = async (newStatus: string, date?: string | null) => {
    if (!request) return;
    updateStatusMutation.mutate({ requestId: request.id, status: newStatus, scheduledStartDate: date ?? null });
  };

  const handleSaveScheduledDate = async () => {
    if (!request || !scheduledStartDate) return;
    const utcDate = new Date(scheduledStartDate);
    await handleStatusUpdate('scheduled', utcDate.toISOString());
  };

  const handleDateChange = useCallback((date: string) => {
    setScheduledDateChanged(true);
  }, []);

  const handleSaveAndSchedule = useCallback(async () => {
    if (!request || !scheduledStartDate) return;
    const utcDate = new Date(scheduledStartDate);
    await handleStatusUpdate('scheduled', utcDate.toISOString());
    setScheduledDateChanged(false); // Reset after successful save
  }, [request, scheduledStartDate, handleStatusUpdate]);

  const handleOpenCompleteModal = useCallback(() => {
    setCompleteModalOpen(true);
  }, []);

  const handleConfirmCompletion = useCallback(async (data: { actual_cost: number; completion_notes: string }) => {
    if (!request) return;

    try {
      // This is where you would call the REAL API endpoint.
      // For now, we'll simulate it and update the status.
      // await apiClient.patch(`/requests/${request.id}/complete`, data);

      // Simulate API delay for better UX testing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the status to 'completed' using the existing mutation
      await updateStatusMutation.mutateAsync({
        requestId: request.id,
        status: 'completed'
      });

      // On success:
      setSnackbarMessage('✅ Job successfully marked as completed!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      onClose(); // Close the main docket modal
      onUpdateRequest(); // Refresh the dashboard data

    } catch (error) {
      // On failure:
      setSnackbarMessage('❌ Failed to complete job. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [request, updateStatusMutation, onClose, onUpdateRequest]);

  const handleAddressUpdate = useCallback(async (addressData: { service_address: string; latitude: number | null; longitude: number | null; geocoded_address: string | null }): Promise<void> => {
    if (!request) return;

    try {
      await apiClient.patch(`/requests/${request.id}`, {
        service_address: addressData.service_address,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        geocoded_address: addressData.geocoded_address
      });

      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setSnackbarMessage('Service address updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to update service address:', error);
      setSnackbarMessage('Failed to update service address. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      throw error; // Re-throw so ServiceLocationManager knows it failed
    }
  }, [request, queryClient]);


  const handleAcceptQuote = async (quoteId: string) => {
    if (!request) return;
    acceptQuoteMutation.mutate({ requestId: request.id, quoteId });
  };
  
  const handleTriageRequest = async () => {
    if (!request) return;
    triageMutation.mutate(request.id);
  };

  if (!isOpen || !request) return null;

  const isAdmin = profile?.role === 'admin';
  const isReadOnly = ['completed'].includes(request.status);

  // *** Auto-update status to "viewed" when non-admin user views request details ***
  // This implements the workflow: Quoted --> Viewed when user views request details
  useEffect(() => {
    if (isOpen && request && !isAdmin && request.status === 'quoted') {
      // Non-admin user is viewing a quoted request - update status to viewed
      markAsViewedMutation.mutate(request.id);
    }
  }, [isOpen, request?.id, isAdmin, request?.status, markAsViewedMutation]);


  const headerTitle = `Job Docket: ${request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const headerSubtitle = `ID: ${request.id} | Received: ${new Date(request.created_at).toLocaleString()}`;
  
  const headerActions = (
    isAdmin && !request.triage_summary ? (
      <Button variant="contained" color="secondary" size="small" onClick={handleTriageRequest} disabled={triageMutation.isPending} sx={{ whiteSpace: 'nowrap' }} startIcon={<Zap />}>
        {triageMutation.isPending ? 'Triaging...' : 'AI Triage'}
      </Button>
    ) : null
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
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Customer Name
                  </Typography>
                  <Typography variant="body1">
                    {request.user_profiles?.name || request.customer_name || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <ServiceLocationManager
                mode="view"
                initialAddress={request.service_address}
                isAdmin={isAdmin}
                onSave={handleAddressUpdate}
                isUpdating={updateAddressMutation.isPending}
              />

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {request.status}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Service Type
                  </Typography>
                  <Typography variant="body1">
                    {request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {isAdmin && <AITriageSummary request={request} />}
            <RequestProblemDetails request={request} />
            
            <AttachmentSection
              requestId={request.id}
              attachments={request.quote_attachments || []}
              editable={!isReadOnly && (isAdmin || !request.quotes.some(q => q.status === 'accepted'))}
              onUpdate={onUpdateRequest}
            />

            <CommunicationLog
              requestId={request.id}
              initialNotes={request.request_notes || []}
              onNoteAdded={onUpdateRequest}
            />

            <QuoteList
              request={request}
              isReadOnly={isReadOnly}
              isUpdating={acceptQuoteMutation.isPending}
              onAcceptQuote={handleAcceptQuote}
              onUpdateRequest={onUpdateRequest}
            />
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

      <CompleteJobModal
        isOpen={isCompleteModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        isSubmitting={completeJobMutation.isPending}
        jobTitle={request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RequestDetailModal;