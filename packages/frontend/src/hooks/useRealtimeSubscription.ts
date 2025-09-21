// packages/frontend/src/hooks/useRealtimeSubscription.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface TableInvalidationConfig {
  table: string;
  queryKeys: string[]; // Query keys to invalidate when this table changes
}

interface RealtimeSubscriptionOptions {
  enabled?: boolean;
  onEvent?: (event: string, table: string, payload: any) => void;
}

/**
 * Reusable function to invalidate queries based on configuration
 */
function invalidateQueries(queryClient: any, queryKeys: string[]) {
  queryKeys.forEach(key => {
    console.log(`🔄 Attempting to invalidate query key pattern: ${key}`);
    
    // Get all queries that match this pattern
    const matchingQueries = queryClient.getQueryCache().getAll().filter((query: any) => {
      const queryKey = query.queryKey;
      const matches = Array.isArray(queryKey) && queryKey.length > 0 && queryKey[0] === key;
      if (matches) {
        console.log(`🎯 Found matching query to invalidate:`, queryKey);
      }
      return matches;
    });
    
    console.log(`📊 Found ${matchingQueries.length} queries matching pattern '${key}'`);
    
    // Invalidate and refetch queries that start with this key
    queryClient.invalidateQueries({ queryKey: [key], exact: false });
    queryClient.refetchQueries({ queryKey: [key], exact: false });
    
    console.log(`✅ Invalidated and refetched queries starting with: ${key}`);
  });
}

/**
 * Generic hook for setting up real-time subscriptions to Supabase tables
 * 
 * @param tableConfigs - Array of table configurations specifying what to invalidate
 * @param options - Optional configuration
 * 
 * @example
 * useRealtimeSubscription([
 *   { table: 'requests', queryKeys: ['requests'] },
 *   { table: 'quotes', queryKeys: ['requests', 'request'] },
 *   { table: 'request_notes', queryKeys: ['requests', 'request'] }
 * ]);
 */
export function useRealtimeSubscription(
  tableConfigs: TableInvalidationConfig[],
  options: RealtimeSubscriptionOptions = {}
) {
  const queryClient = useQueryClient();
  const { enabled = true, onEvent } = options;

  useEffect(() => {
    if (!enabled || tableConfigs.length === 0) {
      return;
    }

    console.log('🚀 MAIN SUBSCRIPTION: Setting up real-time subscriptions for tables:', tableConfigs.map(c => c.table));

    // Create invalidation handler
    const handleRealtimeEvent = (event: string, table: string, payload: any) => {
      console.log(`🔄 MAIN SUBSCRIPTION: Real-time event: ${event} on ${table}`, payload);
      
      // Call custom event handler if provided
      onEvent?.(event, table, payload);

      // Find config for this table and invalidate its specified queries
      const config = tableConfigs.find(c => c.table === table);
      if (config) {
        console.log(`🔄 Invalidating queries for ${table}:`, config.queryKeys);
        console.log(`🔍 Current React Query cache keys:`, queryClient.getQueryCache().getAll().map(q => q.queryKey));
        invalidateQueries(queryClient, config.queryKeys);
        console.log(`✅ Queries invalidated for: ${table}`);
      }
    };

    // Create a single channel for all table subscriptions
    const channelName = `realtime-${tableConfigs.map(c => c.table).join('-')}`;
    const channel = supabase.channel(channelName);

    // Subscribe to each table
    tableConfigs.forEach(({ table }) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => handleRealtimeEvent(payload.eventType, table, payload)
      );
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`📡 Real-time subscription status for ${channelName}:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to real-time channel: ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Real-time subscription error for ${channelName}`);
      } else if (status === 'TIMED_OUT') {
        console.error(`⏰ Real-time subscription timed out for ${channelName}`);
      }
    });

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up real-time subscription: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [queryClient, enabled, JSON.stringify(tableConfigs), onEvent]);
}

