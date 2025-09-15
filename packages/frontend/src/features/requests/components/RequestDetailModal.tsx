// packages/frontend/src/features/requests/components/RequestDetailModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Paper, Button } from '@mui/material';
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
import { useUpdateRequestStatus, useAcceptQuote, useTriageRequest } from '../hooks/useRequestMutations';
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
  const queryClient = useQueryClient();

  const completeJobMutation = useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: { actual_cost: number; completion_notes: string } }) => {
      const response = await apiClient.patch(`/requests/${requestId}/complete`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setCompleteModalOpen(false);
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
    await completeJobMutation.mutateAsync({ requestId: request.id, data });
  }, [request, completeJobMutation]);

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
            <CustomerInfoSection
              request={request}
              isAdmin={isAdmin}
              isDateEditable={true}
              scheduledStartDate={scheduledStartDate}
              setScheduledStartDate={setScheduledStartDate}
              currentStatus={request.status}
              setCurrentStatus={(newStatus) => handleStatusUpdate(newStatus)}
              isUpdating={updateStatusMutation.isPending}
              onDateChange={handleDateChange}
            />
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
    </div>
  );
};

export default RequestDetailModal;