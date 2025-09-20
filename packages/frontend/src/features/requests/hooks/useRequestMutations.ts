// packages/frontend/src/features/requests/hooks/useRequestMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status, scheduledStartDate }: { requestId: string; status: string; scheduledStartDate?: string | null }) => {
      const payload: { status: string; scheduled_start_date?: string | null } = { status };
      if (scheduledStartDate !== undefined) payload.scheduled_start_date = scheduledStartDate;
      await apiClient.patch(`/requests/${requestId}/status`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, quoteId }: { requestId: string; quoteId: string }) => {
      console.log('useAcceptQuote: Calling API', { requestId, quoteId });
      const response = await apiClient.post(`/requests/${requestId}/quotes/${quoteId}/accept`);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('useAcceptQuote: Success', data);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      // Show success message
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Quote accepted successfully!', severity: 'success' }
      });
      window.dispatchEvent(event);
    },
    onError: (error) => {
      console.error('useAcceptQuote: Error', error);
      // Show error message
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '❌ Failed to accept quote. Please try again.', severity: 'error' }
      });
      window.dispatchEvent(event);
    },
  });
}

export function useTriageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await apiClient.post(`/triage/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, addressData }: { requestId: string; addressData: any }) => {
      console.log('useUpdateAddressMutation: Calling API', { requestId, addressData });
      return apiClient.patch(`/requests/${requestId}`, addressData);
    },
    onSuccess: (data) => {
      console.log('useUpdateAddressMutation: Success', data);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error('useUpdateAddressMutation: Error', error);
    },
  });
}