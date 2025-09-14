// packages/frontend/src/features/requests/hooks/useRequestsQuery.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import apiClient from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types';

const fetchRequests = async (userId?: string): Promise<QuoteRequest[]> => {
  // The userId parameter is now handled by the backend based on the authenticated user's token.
  console.log(`🔍 Fetching requests for authenticated user (ID: ${userId || 'admin'})`);

  try {
    // Use apiClient.get() instead of fetch() - this ensures JWT token is automatically included
    const response = await apiClient.get<QuoteRequest[]>('/requests');

    // The response data is directly available on response.data (already parsed JSON)
    const data = response.data;
    console.log(`✅ API Fetched Data: ${data?.length || 0} requests.`);
    return data || [];

  } catch (error) {
    console.error('❌ API Fetch Error:', error);
    // Re-throw the error so React Query can handle it
    throw error;
  }

  // This will be replaced by the API call above
  // For now, return empty array until API endpoint is created
  console.log('⚠️ API endpoint not yet implemented, returning empty array');
  return [];
};

export function useRequestsQuery(userId?: string, user?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    // THE FIX: Include user?.id in queryKey for proper cache invalidation
    // This tells TanStack Query that the identity of the user is fundamental to this data request
    // When a user logs in, user.id changes from null to a UUID, forcing automatic refetch
    queryKey: ['requests', userId, user?.id],
    queryFn: () => fetchRequests(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Set up real-time subscriptions to invalidate the query on changes
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['requests', userId] });
    };

    const requestsChannel = supabase.channel('public:requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, handleUpdate)
      .subscribe();

    const notesChannel = supabase.channel('public:request_notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_notes' }, handleUpdate)
      .subscribe();

    const quotesChannel = supabase.channel('public:quotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, handleUpdate)
      .subscribe();

    const attachmentsChannel = supabase.channel('public:quote_attachments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_attachments' }, handleUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(quotesChannel);
      supabase.removeChannel(attachmentsChannel);
    };
  }, [queryClient, userId]);

  return {
    requests: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}