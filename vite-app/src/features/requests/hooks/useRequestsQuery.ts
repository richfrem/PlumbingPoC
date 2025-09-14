// vite-app/src/features/requests/hooks/useRequestsQuery.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types';

const fetchRequests = async (userId?: string): Promise<QuoteRequest[]> => {
  console.log('🔍 Fetching requests with userId:', userId);

  // Use API endpoint instead of direct Supabase query for proper permission handling
  const apiUrl = '/api/requests';  // API handles user filtering based on authentication

  console.log('🔍 API URL:', apiUrl, 'for userId:', userId);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Auth headers are handled by the browser for same-origin requests
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Fetched Data:', data?.length || 0, 'requests for userId:', userId);
    return data || [];
  } catch (error) {
    console.error('❌ API Fetch Error:', error);
    throw error;
  }

  // This will be replaced by the API call above
  // For now, return empty array until API endpoint is created
  console.log('⚠️ API endpoint not yet implemented, returning empty array');
  return [];
};

export function useRequestsQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['requests', userId],
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