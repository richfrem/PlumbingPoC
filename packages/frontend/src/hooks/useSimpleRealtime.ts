// packages/frontend/src/hooks/useSimpleRealtime.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

/**
 * Simple, reliable real-time hook that just invalidates ALL queries when ANY table changes
 * This ensures everything stays in sync without complex configuration
 */
export function useSimpleRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase.channel('realtime_changes');

    const handleAnyChange = (payload: any) => {
      // Refetch all queries when any database change occurs
      queryClient.refetchQueries({ queryKey: ['requests'], exact: false });
      // Also refetch all queries as fallback
      queryClient.refetchQueries();
    };

    // Listen to all the tables we care about
    const tables = ['requests', 'quotes', 'request_notes', 'quote_attachments'];

    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        handleAnyChange
      );
    });

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Real-time channel error:', status);
      } else if (status === 'TIMED_OUT') {
        console.error('Real-time channel timeout:', status);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, enabled]);
};
