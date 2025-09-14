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
      await apiClient.post(`/requests/${requestId}/quotes/${quoteId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
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