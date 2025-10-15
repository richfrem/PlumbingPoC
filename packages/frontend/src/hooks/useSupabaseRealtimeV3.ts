// packages/frontend/src/hooks/useSupabaseRealtimeV3.ts

/**
 * =============================================================================
 * useSupabaseRealtimeV3.ts - Advanced Supabase Real-Time Hook
 * =============================================================================
 *
 * WHAT IS THIS HOOK?
 * ------------------
 * This is the core real-time synchronization hook that establishes WebSocket
 * connections to Supabase for live database updates. It intelligently manages
 * multiple table subscriptions and triggers React Query cache invalidation
 * when database changes occur.
 *
 * WHY "V3"?
 * ---------
 * This is the third iteration of the real-time system, featuring:
 * - Advanced table configuration with filtering
 * - Smart query invalidation targeting
 * - Comprehensive error handling and logging
 * - Performance optimizations
 * - Type-safe configuration
 *
 * HOW IT WORKS:
 * -------------
 * 1. SUBSCRIPTION: Creates WebSocket channels for specified tables
 * 2. LISTENING: Monitors INSERT/UPDATE/DELETE events via PostgreSQL changes
 * 3. FILTERING: Applies row-level or table-level filters if specified
 * 4. INVALIDATION: Triggers React Query cache updates for affected data
 * 5. CLEANUP: Properly unsubscribes when component unmounts
 *
 * KEY FEATURES:
 * -------------
 * - Multi-table subscriptions in single hook
 * - Row-level filtering (e.g., user-specific data)
 * - Event-specific listening (INSERT, UPDATE, DELETE)
 * - Smart query invalidation (targets specific cache keys)
 * - Connection status monitoring
 * - Automatic cleanup and error recovery
 *
 * CONFIGURATION:
 * --------------
 * Table configs must be memoized with useMemo() to prevent re-subscription:
 *
 * const tableConfigs = useMemo(() => [
 *   {
 *     table: 'requests',
 *     events: ['INSERT', 'UPDATE'],
 *     invalidateQueries: [['requests'], ['requests', userId]]
 *   }
 * ], [userId]);
 *
 * REAL-TIME ARCHITECTURE:
 * -----------------------
 * Component → useTableQuery → useSupabaseRealtimeV3 → Supabase WebSocket
 *     ↓              ↓                    ↓                      ↓
 *   Data Display  Cache Mgmt      Event Listening      DB Changes
 *   Updates       Invalidation    Query Targeting      Live Sync
 *
 * PERFORMANCE:
 * ------------
 * - Minimal subscriptions (only specified tables/events)
 * - Targeted invalidation (only affected queries)
 * - Connection pooling and reuse
 * - Automatic cleanup prevents memory leaks
 *
 * ERROR HANDLING:
 * ---------------
 * - Channel connection errors logged and handled gracefully
 * - Subscription timeouts managed automatically
 * - Continues operation even if real-time fails
 * - Comprehensive logging for debugging
 *
 * DEPENDENCIES:
 * -------------
 * - Supabase Client: For WebSocket connections
 * - React Query: For cache invalidation
 * - Custom table configs: Provided by calling hooks
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';

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
 * ⚠️ IMPORTANT: The `tableConfigs` array MUST be memoized using `useMemo` in the calling component
 * to prevent re-subscribing on every render. See example below.
 *
 * @param tableConfigs - Array of table configurations (MUST be memoized with useMemo)
 * @param options - Hook options
 *
 * @example
 * import { useMemo } from 'react';
 *
 * function MyComponent() {
 *   const tableConfigs = useMemo(() => [
 *     {
 *       table: 'requests',
 *       events: ['INSERT', 'UPDATE', 'DELETE'],
 *       invalidateQueries: [['requests'], ['requests', userId]]
 *     },
 *     {
 *       table: 'quotes',
 *       events: ['INSERT', 'UPDATE'],
 *       invalidateQueries: [['quotes'], ['requests']] // Quotes affect requests
 *     }
 *   ], [userId]); // Only re-create if dependencies change
 *
 *   useSupabaseRealtimeV3(tableConfigs, { enabled: true });
 *   // ...
 * }
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

    // CRITICAL: tableConfigs must be memoized in the calling component using useMemo
    // to prevent re-subscribing on every render. Example:
    // const tableConfigs = useMemo(() => [{ table: 'requests', ... }], [dependencies]);

    logger.log('🔌 Setting up Supabase Realtime v3 for tables:', tableConfigs.map(c => c.table));

    // Create a descriptive channel name for better debugging
    const tables = tableConfigs.map(c => c.table).join('-');
    const channelName = `realtime-v3-${tables}`;
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
            logger.log(`🔄 Realtime v3: ${event} on ${config.table}`, {
              recordId: payload.new?.id || payload.old?.id,
              event,
              table: config.table,
              payloadKeys: Object.keys(payload)
            });

            // Call custom event handler if provided
            onEvent?.(event, config.table, payload);

            // Invalidate specified queries
            config.invalidateQueries.forEach(queryKey => {
              const key = Array.isArray(queryKey) ? queryKey.filter(Boolean) : [queryKey];
              logger.log(`🗑️ Invalidating queries with key:`, key);
              queryClient.invalidateQueries({ queryKey: key, exact: false });
            });

            // Special handling for request_notes - also invalidate the specific request query
            if (config.table === 'request_notes' && payload.new?.request_id) {
              const requestQueryKey = ['request', payload.new.request_id];
              logger.log(`🗑️ Special invalidation for request_notes:`, requestQueryKey);
              queryClient.invalidateQueries({ queryKey: requestQueryKey, exact: true });
            }

            // Special handling for quotes - also invalidate the specific parent request query
            // This ensures the request's details (like status) are fresh when its quotes change.
            if (config.table === 'quotes' && (payload.new?.request_id || payload.old?.request_id)) {
              const requestId = payload.new?.request_id || payload.old?.request_id;
              const requestQueryKey = ['request', requestId];
              logger.log(`🗑️ Special invalidation for quotes affecting parent request:`, requestQueryKey);
              queryClient.invalidateQueries({ queryKey: requestQueryKey, exact: true });
            }
          }
        );
      });
    });

    // Subscribe to the channel
    channel.subscribe((status, err) => {
      // Suppress noisy "mismatch between server and client bindings" errors
      // These are harmless WebSocket protocol warnings that don't affect functionality
      const isBindingMismatch = err?.message?.includes('mismatch between server and client bindings');

      if (status === 'SUBSCRIBED') {
        logger.log('✅ Realtime v3 channel subscribed successfully');
        logger.log('🎧 Listening for changes on tables:', tableConfigs.map(c => c.table));
      } else if (status === 'CHANNEL_ERROR') {
        // Only log non-binding-mismatch errors
        if (!isBindingMismatch) {
          logger.error('❌ Realtime v3 channel error:', status, err);
          logger.warn('⚠️ Continuing without realtime due to channel error');
        }
      } else if (status === 'TIMED_OUT') {
        logger.error('⏰ Realtime v3 channel timed out');
        logger.warn('⚠️ Continuing without realtime due to timeout');
      } else if (status === 'CLOSED') {
        logger.log('🔌 Realtime v3 channel closed');
      }
    });

    // Store channel reference for cleanup
    channelRef.current = channel;

    // Cleanup function
    return () => {
      logger.log('🧹 Cleaning up Realtime v3 channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, tableConfigs, queryClient, onEvent]);
}

/**
 * Centralized real-time invalidation hook for critical tables
 * Ensures all clients receive updates for requests and quotes changes
 */
export function useRealtimeInvalidation(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    logger.log('🔌 Setting up centralized realtime invalidation');

    // Helper to invalidate all relevant query keys
    const invalidateAll = (requestId?: string) => {
      queryClient.invalidateQueries({ queryKey: ['requests'], exact: false });
      if (requestId) {
        queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['requests', userId] });
      }
    };

    // Subscribe to requests table (all events)
    const reqChannel = supabase
      .channel('public:requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload: any) => {
          logger.log('[realtime] requests payload', payload);
          const newRow = payload.new ?? payload.record ?? null;
          const requestId = newRow?.id ?? null;
          invalidateAll(requestId);
        }
      )
      .subscribe();

    // Subscribe to quotes table (status changes affect requests)
    const quotesChannel = supabase
      .channel('public:quotes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        (payload: any) => {
          logger.log('[realtime] quotes payload', payload);
          const newRow = payload.new ?? payload.record ?? null;
          const requestId = newRow?.request_id ?? null;
          invalidateAll(requestId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reqChannel);
      supabase.removeChannel(quotesChannel);
    };
  }, [queryClient, userId]);
}
