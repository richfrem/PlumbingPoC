// packages/frontend/src/features/requests/components/RequestDetailModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import { useUpdateRequestStatus, useAcceptQuote, useTriageRequest, useUpdateAddressMutation } from '../hooks/useRequestMutations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequestById } from '../../../hooks/useSpecializedQueries';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null; // Used only for the requestId
  onUpdateRequest: () => void; // Kept for backward compatibility
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request: initialRequest, onUpdateRequest }) => {
  const { profile } = useAuth();
  
  // Use standardized real-time system to get fresh request data
  const requestId = initialRequest?.id;
  const { data: requestArray, loading, error, refetch } = useRequestById(requestId || '', {
    enabled: !!requestId && isOpen // Only fetch when modal is open and we have a requestId
  });
  const request = requestArray?.[0] || initialRequest; // Use real-time data if available, fallback to initial

  // Manual refresh function for immediate updates
  const refreshRequestData = () => {
    console.log('🔄 Manually refreshing request data for:', requestId);
    refetch();
  };

  // Auto-refresh every 30 seconds when modal is open to catch updates from other users
  useEffect(() => {
    if (!isOpen || !requestId) return;

    console.log('⏰ Setting up auto-refresh for request detail modal');
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing request data...');
      refetch();
    }, 30000); // 30 seconds

    return () => {
      console.log('⏰ Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [isOpen, requestId, refetch]);

  // Refresh when window gains focus to catch updates from other sessions
  useEffect(() => {
    if (!isOpen || !requestId) return;

    const handleFocus = () => {
      console.log('🎯 Window focused - refreshing request data');
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen, requestId, refetch]);
  
  console.log('🔍 RequestDetailModal using standardized real-time system:', {
    requestId,
    hasRealTimeData: !!requestArray?.[0],
    attachmentsLength: request?.quote_attachments?.length,
    notesLength: request?.request_notes?.length,
    loading,
    error
  });

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
  const [hasMarkedViewed, setHasMarkedViewed] = useState(false);

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
    console.log('handleAcceptQuote: Starting quote acceptance', { requestId: request.id, quoteId });
    acceptQuoteMutation.mutate(
      { requestId: request.id, quoteId },
      {
        onSuccess: (data) => {
          console.log('handleAcceptQuote: Quote accepted successfully', data);
          // Refresh the request detail after accepting a quote
          onUpdateRequest();
        },
        onError: (error) => {
          console.error('handleAcceptQuote: Quote acceptance failed', error);
        }
      }
    );
  };
  
  const handleTriageRequest = async () => {
    if (!request) return;
    triageMutation.mutate(request.id);
  };

  if (!isOpen || !request) return null;

  const isAdmin = profile?.role === 'admin';
  const isReadOnly = ['completed'].includes(request.status);
  const hasAcceptedQuotes = request.quotes?.some(q => q.status === 'accepted') || false;
  const isEditable = !isReadOnly && (isAdmin || !hasAcceptedQuotes);
  
  // For attachments, users should be able to upload even after quotes are accepted
  // Only restrict when job is completed
  const canEditAttachments = !isReadOnly;
  
  console.log('🔍 RequestDetailModal editable calculation:', {
    requestId: request.id,
    isAdmin,
    isReadOnly,
    requestStatus: request.status,
    quotesCount: request.quotes?.length || 0,
    hasAcceptedQuotes,
    isEditable,
    canEditAttachments,
    hasRealTimeData: !!requestArray?.[0]
  });

  // *** Auto-update status to "viewed" when non-admin user views request details ***
  // Guard: Only run once per modal open to prevent infinite PATCH calls
  useEffect(() => {
    if (
      isOpen &&
      request &&
      !isAdmin &&
      request.status === 'quoted' &&
      !hasMarkedViewed &&
      profile?.user_id // Only run if user is authenticated
    ) {
      markAsViewedMutation.mutate(request.id, {
        onSuccess: () => setHasMarkedViewed(true),
        onError: (error) => {
          console.error('Failed to mark as viewed:', error);
          setHasMarkedViewed(true); // Prevent infinite loop on error
        }
      });
    }
    if (!isOpen) setHasMarkedViewed(false);
  }, [isOpen, request?.id, request?.status, isAdmin, hasMarkedViewed, profile?.user_id, markAsViewedMutation]);


  const headerTitle = `Job Docket: ${request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const headerSubtitle = `ID: ${request.id} | Received: ${new Date(request.created_at).toLocaleString()}`;
  
  const headerActions = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <RefreshCw size={14} className="animate-spin" />
          <Typography variant="caption" color="text.secondary">Refreshing...</Typography>
        </Box>
      )}
      {isAdmin && !request.triage_summary && (
        <Button variant="contained" color="secondary" size="small" onClick={handleTriageRequest} disabled={triageMutation.isPending} sx={{ whiteSpace: 'nowrap' }} startIcon={<Zap />}>
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
                onModeChange={() => {}} // Not needed in view mode
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
              editable={canEditAttachments}
              onUpdate={refreshRequestData}
            />

            <CommunicationLog
              requestId={request.id}
              initialNotes={request.request_notes || []}
              onNoteAdded={refreshRequestData}
            />

            <QuoteList
              request={request}
              isReadOnly={isReadOnly}
              isUpdating={acceptQuoteMutation.isPending}
              onAcceptQuote={handleAcceptQuote}
              onUpdateRequest={refreshRequestData}
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

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default RequestDetailModal;