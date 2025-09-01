// vite-app/src/features/requests/hooks/useRequests.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types';

export function useRequests(userId?: string) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    // Only show initial loading spinner, not for every background refresh
    if (requests.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('requests')
        .select(`*, user_profiles!inner(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRequests((data as QuoteRequest[]) || []);
    } catch (err: any) {
      console.error("useRequests hook error:", err);
      setError("Failed to fetch requests.");
    } finally {
      setLoading(false);
    }
  }, [userId, requests.length]); // requests.length is intentionally included for the initial load logic

  // Effect for the initial data fetch.
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // *** THE DEFINITIVE FIX: Use a separate, dedicated channel for each table. ***
  // This is the most robust real-time pattern. It ensures that both the admin (who can see all requests)
  // and the user (who can only see their own via RLS) are listening on the exact same broadcast channels.
  useEffect(() => {
    const handleUpdate = (payload: any) => {
      console.log('Realtime update received, re-fetching data:', payload);
      fetchRequests();
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

    // Cleanup function to remove all subscriptions when the component unmounts
    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(quotesChannel);
      supabase.removeChannel(attachmentsChannel);
    };
  }, [fetchRequests]); // The dependency on the stable fetchRequests function is correct.

  return { requests, loading, error, refreshRequests: fetchRequests };
}