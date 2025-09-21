// packages/frontend/src/hooks/useSupabaseRealtimeV3.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface TableConfig {
  table: string;
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  schema?: string;
  filter?: string; // e.g., "id=eq.123" for row-level filtering
  invalidateQueries: (string | (string | undefined)[])[]; // Query keys to invalidate
}

interface RealtimeOptions {
  enabled?: boolean;
  onEvent?: (event: string, table: string, payload: any) => void;
}

/**
 * Advanced Supabase Realtime hook following official patterns
 * Handles specific table changes with targeted query invalidation
 *
 * @param tableConfigs - Array of table configurations
 * @param options - Hook options
 *
 * @example
 * const tableConfigs = [
 *   {
 *     table: 'requests',
 *     events: ['INSERT', 'UPDATE', 'DELETE'],
 *     invalidateQueries: [['requests'], ['requests', userId]]
 *   },
 *   {
 *     table: 'quotes',
 *     events: ['INSERT', 'UPDATE'],
 *     invalidateQueries: [['quotes'], ['requests']] // Quotes affect requests
 *   }
 * ];
 *
 * useSupabaseRealtimeV3(tableConfigs, { enabled: true });
 */
export function useSupabaseRealtimeV3(
  tableConfigs: TableConfig[],
  options: RealtimeOptions = {}
) {
  const { enabled = true, onEvent } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('🔌 Setting up Supabase Realtime v3 for tables:', tableConfigs.map(c => c.table));

    // Create a unique channel name
    const channelName = `realtime-v3-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Set up listeners for each table configuration
    tableConfigs.forEach(config => {
      const events = config.events || ['INSERT', 'UPDATE', 'DELETE'];
      const schema = config.schema || 'public';

      events.forEach(event => {
        channel.on(
          'postgres_changes',
          {
            event,
            schema,
            table: config.table,
            ...(config.filter && { filter: config.filter })
          } as any,
          (payload: any) => {
            console.log(`🔄 Realtime v3: ${event} on ${config.table}`, payload);

            // Call custom event handler if provided
            onEvent?.(event, config.table, payload);

            // Invalidate specified queries
            config.invalidateQueries.forEach(queryKey => {
              const key = Array.isArray(queryKey) ? queryKey.filter(Boolean) : [queryKey];
              console.log(`🗑️ Invalidating queries with key:`, key);
              queryClient.invalidateQueries({ queryKey: key, exact: false });
            });

            // Special handling for request_notes - also invalidate the specific request query
            if (config.table === 'request_notes' && payload.new?.request_id) {
              const requestQueryKey = ['request', payload.new.request_id];
              console.log(`🗑️ Special invalidation for request_notes:`, requestQueryKey);
              queryClient.invalidateQueries({ queryKey: requestQueryKey, exact: true });
            }
          }
        );
      });
    });

    // Subscribe to the channel
    channel.subscribe((status, err) => {
      console.log(`🔌 Realtime v3 channel status: ${status}`, err ? { error: err } : '');
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime v3 channel subscribed successfully');
        console.log('🎧 Listening for changes on tables:', tableConfigs.map(c => c.table));
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime v3 channel error:', status, err);
      } else if (status === 'TIMED_OUT') {
        console.error('⏰ Realtime v3 channel timed out');
      } else if (status === 'CLOSED') {
        console.log('🔌 Realtime v3 channel closed');
      }
    });

    // Store channel reference for cleanup
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Realtime v3 channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, tableConfigs, queryClient, onEvent]);
}