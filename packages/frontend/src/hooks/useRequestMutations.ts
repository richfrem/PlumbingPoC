// packages/frontend/src/hooks/useRequestMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { QuoteRequest } from '../features/requests/types';
import { useAuth } from '../features/auth/AuthContext';

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      scheduledStartDate,
    }: {
      requestId: string;
      status: string;
      scheduledStartDate?: string | null;
    }) => {
      const payload: { status: string; scheduled_start_date?: string | null } = {
        status,
      };
      if (scheduledStartDate !== undefined)
        payload.scheduled_start_date = scheduledStartDate;
      console.log('useUpdateRequestStatus: Calling API', {
        requestId,
        status,
        scheduledStartDate,
        payload,
      });
      await apiClient.patch(`/requests/${requestId}/status`, payload);
    },
    onSuccess: async (data, variables) => {
      console.log('useUpdateRequestStatus: Success', { data, variables });
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      await queryClient.invalidateQueries({
        queryKey: ['request', variables.requestId],
      });
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: `✅ Request status updated to ${variables.status}!`,
          severity: 'success',
        },
      });
      window.dispatchEvent(event);
    },
    onError: (error, variables) => {
      console.error('useUpdateRequestStatus: Error', { error, variables });
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to update request status. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId,
      quoteId,
    }: {
      requestId: string;
      quoteId: string;
    }) => {
      const response = await apiClient.post(
        `/requests/${requestId}/quotes/${quoteId}/accept`
      );
      return response.data;
    },
    onMutate: async (variables) => {
      const { requestId, quoteId } = variables;
      console.log('⚡ Optimistic Update: Starting for acceptQuote', {
        requestId,
        quoteId,
      });
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      await queryClient.cancelQueries({ queryKey: ['request', requestId] });

      const previousRequests = queryClient.getQueryData<QuoteRequest[]>(['requests']);
      const previousUserRequests = user ? queryClient.getQueryData<QuoteRequest[]>(['requests', user.id]) : null;
      const previousRequestDetail = queryClient.getQueryData<QuoteRequest[]>(['request', requestId]);
      console.log('📸 Snapshot created:', { hasAllRequests: !!previousRequests, hasUserRequests: !!previousUserRequests, hasDetail: !!previousRequestDetail });

      // Update admin's all requests query
      queryClient.setQueryData<QuoteRequest[]>(['requests'], (oldData = []) =>
        oldData.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: 'accepted',
                quotes: req.quotes.map(q =>
                  q.id === quoteId ? { ...q, status: 'accepted' } : { ...q, status: 'rejected' }
                ),
              }
            : req
        )
      );

      // Update user's requests query if user exists
      if (user) {
        queryClient.setQueryData<QuoteRequest[]>(['requests', user.id], (oldData = []) =>
          oldData.map(req =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'accepted',
                  quotes: req.quotes.map(q =>
                    q.id === quoteId ? { ...q, status: 'accepted' } : { ...q, status: 'rejected' }
                  ),
                }
              : req
          )
        );
      }

      if (previousRequestDetail) {
        queryClient.setQueryData<QuoteRequest[]>(['request', requestId], oldData => {
            if (!oldData || oldData.length === 0) return [];
            return [{
                ...oldData[0],
                status: 'accepted',
                quotes: oldData[0].quotes.map(q =>
                    q.id === quoteId ? { ...q, status: 'accepted' } : { ...q, status: 'rejected' }
                )
            }];
        });
      }

      console.log('✅ UI updated optimistically to "accepted" state.');
      return { previousRequests, previousUserRequests, previousRequestDetail };
    },
    onError: (err, variables, context) => {
      console.error('❌ Optimistic Update Failed. Rolling back.', { err });
      if (context?.previousRequests) {
        queryClient.setQueryData(['requests'], context.previousRequests);
      }
      if (context?.previousUserRequests && user) {
        queryClient.setQueryData(['requests', user.id], context.previousUserRequests);
      }
      if (context?.previousRequestDetail) {
        queryClient.setQueryData(['request', variables.requestId], context.previousRequestDetail);
      }
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to accept quote. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
    onSuccess: async (data, variables) => {
      console.log('useAcceptQuote: Success', { data, variables });
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      await queryClient.invalidateQueries({
        queryKey: ['request', variables.requestId],
      });
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Quote accepted!', severity: 'success' },
      });
      window.dispatchEvent(event);
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      quote,
    }: {
      requestId: string;
      quote: any;
    }) => {
      const response = await apiClient.post(
        `/requests/${requestId}/quotes`,
        quote
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      console.log('useCreateQuote: Success', { data, variables });
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      await queryClient.invalidateQueries({
        queryKey: ['request', variables.requestId],
      });
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Quote created!', severity: 'success' },
      });
      window.dispatchEvent(event);
    },
    onError: (error, variables) => {
      console.error('useCreateQuote: Error', error);
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to create quote. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      quoteId,
      quote,
    }: {
      requestId: string;
      quoteId: string;
      quote: any;
    }) => {
      const response = await apiClient.patch(
        `/requests/${requestId}/quotes/${quoteId}`,
        quote
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      console.log('useUpdateQuote: Success', { data, variables });
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      await queryClient.invalidateQueries({
        queryKey: ['request', variables.requestId],
      });
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Quote updated!', severity: 'success' },
      });
      window.dispatchEvent(event);
    },
    onError: (error, variables) => {
      console.error('useUpdateQuote: Error', error, variables);
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to update quote. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
  });
}

export function useSubmitQuoteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: QuoteRequest) => {
      const response = await apiClient.post('/requests', request);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Request submitted!', severity: 'success' },
      });
      window.dispatchEvent(event);
    },
    onError: (error) => {
      console.error('useSubmitQuoteRequest: Error', error);
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to submit request. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
  });
}

export function useTriageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const response = await apiClient.post(`/requests/${requestId}/triage`);
      return response.data;
    },
    onSuccess: async (data, variables) => {
      console.log('useTriageRequest: Success', { data, variables });
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      await queryClient.invalidateQueries({
        queryKey: ['request', variables.requestId],
      });
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Request triaged!', severity: 'success' },
      });
      window.dispatchEvent(event);
    },
    onError: (error, variables) => {
      console.error('useTriageRequest: Error', { error, variables });
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to triage request. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
  });
}

/**
 * Centralized hook: mark a request as viewed (user opened the quoted modal).
 * - Optimistic update: only flip quoted -> viewed
 * - Rolls back on error
 * - Invalidates both the list(s) and the request detail
 */
export function useMarkRequestAsViewed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      // backend endpoint: PATCH /requests/:id/viewed
      const res = await apiClient.patch(`/requests/${requestId}/viewed`);
      return res.data;
    },
    onMutate: async (requestId: string) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      await queryClient.cancelQueries({ queryKey: ['request', requestId] });

      const previousAll = queryClient.getQueryData<QuoteRequest[]>(['requests']);
      const previousUser = user
        ? queryClient.getQueryData<QuoteRequest[]>(['requests', user.id])
        : null;
      const previousDetail = queryClient.getQueryData<QuoteRequest[]>(['request', requestId]);

      // optimistic: mark 'quoted' -> 'viewed' only
      queryClient.setQueryData<QuoteRequest[]>(
        ['requests'],
        (old = []) =>
          old.map((r) =>
            r.id === requestId ? { ...r, status: r.status === 'quoted' ? 'viewed' : r.status } : r
          )
      );

      if (user) {
        queryClient.setQueryData<QuoteRequest[]>(
          ['requests', user.id],
          (old = []) =>
            old.map((r) =>
              r.id === requestId ? { ...r, status: r.status === 'quoted' ? 'viewed' : r.status } : r
            )
        );
      }

      if (previousDetail) {
        queryClient.setQueryData(['request', requestId], (old: any) => {
          if (!old || old.length === 0) return old;
          const first = old[0];
          return [
            {
              ...first,
              status: first.status === 'quoted' ? 'viewed' : first.status,
            },
          ];
        });
      }

      return { previousAll, previousUser, previousDetail };
    },
    onError: (_err, requestId, context) => {
      if (context?.previousAll) queryClient.setQueryData(['requests'], context.previousAll);
      if (context?.previousUser && user) queryClient.setQueryData(['requests', user.id], context.previousUser);
      if (context?.previousDetail) queryClient.setQueryData(['request', requestId], context.previousDetail);
      window.dispatchEvent(
        new CustomEvent('show-snackbar', {
          detail: { message: '❌ Failed to mark viewed. Please refresh.', severity: 'error' },
        })
      );
    },
    onSettled: (_data, _err, requestId) => {
      // Ensure server truth overrides eventual state
      queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    },
    onSuccess: () => {
      // silent success is fine; invalidate already runs
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      address,
    }: {
      requestId: string;
      address: any;
    }) => {
      const response = await apiClient.patch(
        `/requests/${requestId}/address`,
        address
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      console.log('useUpdateAddressMutation: Success', { data, variables });
      await queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      await queryClient.invalidateQueries({
        queryKey: ['request', variables.requestId],
      });
      const event = new CustomEvent('show-snackbar', {
        detail: { message: '✅ Address updated!', severity: 'success' },
      });
      window.dispatchEvent(event);
    },
    onError: (error, variables) => {
      console.error('useUpdateAddressMutation: Error', { error, variables });
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: '❌ Failed to update address. Please try again.',
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    },
  });
}