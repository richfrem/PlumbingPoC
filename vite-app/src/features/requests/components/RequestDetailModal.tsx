// vite-app/src/features/requests/components/RequestDetailModal.tsx

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

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest | null;
  onUpdateRequest: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request, onUpdateRequest }) => {
  const { profile } = useAuth();
  
  // Local state is ONLY for UI interactions that are not driven by props.
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledDateChanged, setScheduledDateChanged] = useState(false);
  
  // *** THE DEFINITIVE FIX: State Synchronization Effect ***
  // This hook ensures that whenever the parent passes a new `request` object,
  // we update the local state for controlled inputs like the date picker.
  // This is the correct way to handle "props driving state" without causing loops.
  useEffect(() => {
    if (request) {
      setScheduledStartDate(request.scheduled_start_date ? new Date(request.scheduled_start_date).toISOString().split('T')[0] : '');
      setScheduledDateChanged(false); // Reset tracking when new data arrives
    }
  }, [request]); // This effect ONLY runs when the `request` prop itself changes.

  const handleStatusUpdate = async (newStatus: string, date?: string | null) => {
    if (!request) return;
    setIsUpdating(true);
    try {
      const payload: { status: string; scheduled_start_date?: string | null } = { status: newStatus };
      if (date !== undefined) payload.scheduled_start_date = date;
      await apiClient.patch(`/requests/${request.id}/status`, payload);
      onUpdateRequest(); // Signal to the parent to refresh its data
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveScheduledDate = async () => {
    if (!request || !scheduledStartDate) return;
    const utcDate = new Date(scheduledStartDate);
    await handleStatusUpdate('scheduled', utcDate.toISOString());
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
  
  const handleTriageRequest = async () => {
    if (!request) return;
    setIsTriaging(true);
    try {
      await apiClient.post(`/triage/${request.id}`);
      onUpdateRequest();
    } catch (error) {
      console.error("Failed to triage request:", error);
    } finally {
      setIsTriaging(false);
    }
  };

  if (!isOpen || !request) return null;

  const isAdmin = profile?.role === 'admin';
  const isReadOnly = ['completed'].includes(request.status);

  const headerTitle = `Job Docket: ${request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const headerSubtitle = `ID: ${request.id} | Received: ${new Date(request.created_at).toLocaleString()}`;
  
  const headerActions = (
    isAdmin && !request.triage_summary ? (
      <Button variant="contained" color="secondary" size="small" onClick={handleTriageRequest} disabled={isTriaging} sx={{ whiteSpace: 'nowrap' }} startIcon={<Zap />}>
        {isTriaging ? 'Triaging...' : 'AI Triage'}
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
              setScheduledStartDate={(date) => { setScheduledStartDate(date); setScheduledDateChanged(true); }}
              currentStatus={request.status} 
              setCurrentStatus={(newStatus) => handleStatusUpdate(newStatus)}
              isUpdating={isUpdating} 
              onSaveScheduledDate={handleSaveScheduledDate} 
              scheduledDateChanged={scheduledDateChanged} 
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
              isUpdating={isUpdating}
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
            isUpdating={isUpdating} 
            onStatusChange={(newStatus) => handleStatusUpdate(newStatus)} 
          />
        </ModalFooter>
      </Paper>
    </div>
  );
};

export default RequestDetailModal;