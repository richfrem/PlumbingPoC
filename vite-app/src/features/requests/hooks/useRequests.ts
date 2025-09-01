// vite-app/src/features/requests/hooks/useRequests.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types';

export function useRequests(userId?: string) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ** THE FIX: Create a STABLE fetch function using useCallback **
  // We remove `requests.length` from the dependency array and fix the loading logic.
  const fetchRequests = useCallback(async () => {
    setLoading(true); // Always set loading to true when a fetch starts
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
  }, [userId]); // The only dependency is userId, which is stable.

  // Effect for the initial data fetch. Runs only once when the component mounts or userId changes.
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Effect for the real-time subscriptions. Also runs only once.
  useEffect(() => {
    const channelId = userId ? `user-requests-${userId}` : 'admin-dashboard';
    const channel = supabase.channel(channelId);

    const handleUpdate = (payload: any) => {
      console.log(`Realtime update on channel ${channelId}:`, payload);
      // When an update comes in, we call the stable fetch function.
      fetchRequests();
    };

    //these are associated with publications in supabase .  see also supabase/SUPABASE_DATABASE_AND_AUTH_SETUP.md
    const subscriptions = [
        { table: 'requests' },
        { table: 'request_notes' },
        { table: 'quotes' },
        { table: 'quote_attachments' }
    ];

    subscriptions.forEach(({ table }) => {
        channel.on(
            'postgres_changes', 
            { event: '*', schema: 'public', table: table }, 
            handleUpdate
        ).subscribe();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRequests]); // Dependencies are stable.

  return { requests, loading, error, refreshRequests: fetchRequests };
}