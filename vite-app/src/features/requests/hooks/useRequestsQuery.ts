// vite-app/src/features/requests/hooks/useRequestsQuery.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types';

const fetchRequests = async (userId?: string): Promise<QuoteRequest[]> => {
  console.log('🔍 Fetching requests with userId:', userId);

  let query = supabase
    .from('requests')
    .select(`*, user_profiles(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
    .order('created_at', { ascending: false });

  if (userId) {
    console.log('🔍 Filtering by user_id:', userId);
    query = query.eq('user_id', userId);
  } else {
    console.log('🔍 Fetching ALL requests (admin mode)');
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Admin Dashboard Fetch Error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('✅ Admin Dashboard Fetched Data:', data?.length || 0, 'requests for userId:', userId);

  if (data && data.length > 0) {
    console.log('📋 First request sample:', {
      id: data[0].id,
      user_id: data[0].user_id,
      status: data[0].status,
      has_user_profile: !!data[0].user_profiles,
      created_at: data[0].created_at
    });
  } else {
    console.log('📋 No requests found in database');
  }

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