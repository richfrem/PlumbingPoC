// packages/frontend/src/features/requests/hooks/useRequests.ts

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // DISABLED: This hook is no longer used - useRequestsQuery is used instead
  // Keeping real-time subscriptions disabled to prevent infinite loops
  useEffect(() => {
    console.log('useRequests hook: DISABLED - useRequestsQuery is used instead');
    // Real-time subscriptions removed to prevent conflicts with useRequestsQuery
    return () => {
      // No cleanup needed since no subscriptions are created
    };
  }, []);

  return { requests, loading, error, refreshRequests: fetchRequests };
}