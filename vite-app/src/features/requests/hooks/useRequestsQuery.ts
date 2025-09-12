// vite-app/src/features/requests/hooks/useRequestsQuery.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types';

const fetchRequests = async (userId?: string): Promise<QuoteRequest[]> => {
  let query = supabase
    .from('requests')
    .select(`*, user_profiles!inner(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as QuoteRequest[]) || [];
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