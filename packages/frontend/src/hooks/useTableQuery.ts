// packages/frontend/src/hooks/useTableQuery.ts

/**
 * =============================================================================
 * useTableQuery.ts - Advanced Database Query Hook with Real-Time Updates
 * =============================================================================
 *
 * WHAT IS A HOOK?
 * ---------------
 * In React, a "hook" is a special function that lets you use React features
 * (like state, lifecycle methods, and context) in functional components.
 * Hooks are the modern way to manage component logic and side effects.
 *
 * WHAT DOES THIS HOOK DO?
 * -----------------------
 * This is an advanced, reusable hook that combines:
 * 1. Data fetching from database tables via REST API
 * 2. Automatic real-time updates via Supabase WebSocket subscriptions
 * 3. Smart query caching and invalidation using TanStack Query
 * 4. Cross-component synchronization for multi-user applications
 *
 * KEY FEATURES:
 * - Generic: Works with any database table
 * - Real-time: Automatically updates UI when database changes
 * - Cached: Prevents unnecessary API calls
 * - User-aware: Supports user-specific data filtering
 * - Type-safe: Full TypeScript support
 * - Optimized: Smart invalidation prevents unnecessary refetches
 *
 * HOW IT WORKS:
 * -------------
 * 1. FETCH: Makes HTTP request to API endpoint (e.g., /requests)
 * 2. CACHE: Stores data in TanStack Query cache with unique key
 * 3. SUBSCRIBE: Sets up WebSocket listeners for database changes
 * 4. INVALIDATE: When DB changes occur, invalidates relevant cache entries
 * 5. REFRESH: Automatically refetches fresh data and updates UI
 *
 * REAL-TIME SYNCHRONIZATION:
 * --------------------------
 * - Listens for INSERT/UPDATE/DELETE events on specified tables
 * - Invalidates TanStack Query cache when changes detected
 * - Triggers automatic UI updates across all components using same data
 * - Supports cross-user synchronization (admin ↔ user updates)
 *
 * ARCHITECTURE BENEFITS:
 * ----------------------
 * - Eliminates manual refresh buttons
 * - Prevents stale data issues
 * - Enables instant collaboration features
 * - Reduces server load through smart caching
 * - Provides consistent UX across different user roles
 *
 * USAGE PATTERNS:
 * ---------------
 * - Admin dashboards (see all requests)
 * - User-specific lists (my requests only)
 * - Detail views with related data
 * - Real-time collaborative features
 *
 * DEPENDENCIES:
 * -------------
 * - @tanstack/react-query: For caching and query management
 * - Supabase: For real-time database subscriptions
 * - Custom API client: For HTTP requests
 */

import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import apiClient from '../lib/apiClient';
import { useSupabaseRealtimeV3 } from './useSupabaseRealtimeV3';

interface TableQueryOptions<T> extends Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'> {
  // Real-time subscription options
  enableRealtime?: boolean;
  additionalTables?: string[]; // Additional tables to subscribe to for updates
  userId?: string; // For user-specific queries
  
  // Query customization
  endpoint?: string; // Custom API endpoint (defaults to table name)
  queryKey?: (string | undefined)[]; // Custom query key parts
}

/**
 * Generic hook for querying database tables with automatic real-time updates
 * 
 * @param table - Primary table name
 * @param options - Configuration options
 * 
 * @example
 * // Basic usage for requests
 * const { data: requests, loading, error } = useTableQuery<QuoteRequest>('requests');
 * 
 * @example
 * // User-specific requests with real-time updates
 * const { data: requests, loading, error } = useTableQuery<QuoteRequest>('requests', {
 *   userId,
 *   enableRealtime: true,
 *   additionalTables: ['quotes', 'request_notes'] // Also listen for quote/note changes
 * });
 * 
 * @example
 * // Admin view with custom endpoint
 * const { data: allRequests } = useTableQuery<QuoteRequest>('requests', {
 *   endpoint: '/admin/requests',
 *   enableRealtime: true,
 *   additionalTables: ['quotes', 'users']
 * });
 */
export function useTableQuery<T = any>(
  table: string,
  options: TableQueryOptions<T> = {}
) {
  const {
    enableRealtime = true,
    additionalTables = [],
    userId,
    endpoint,
    queryKey: customQueryKey,
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();

  // Build query key
  const queryKey = customQueryKey || [table, userId].filter(Boolean);
  
  // Build API endpoint
  const apiEndpoint = endpoint || `/${table}`;

  // Query function
  const queryFn = async (): Promise<T[]> => {
    console.log(`🔍 Fetching ${table} data from ${apiEndpoint}`);
    
    try {
      const response = await apiClient.get<T | T[]>(apiEndpoint);
      const responseData = response.data;
      
      // Handle both single object and array responses
      const data = Array.isArray(responseData) ? responseData : [responseData];
      console.log(`✅ Fetched ${data.length} ${table} records`);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching ${table}:`, error);
      throw error;
    }
  };

  // Set up the query
  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: 0, // Always fresh for real-time updates
    refetchOnWindowFocus: false,
    ...queryOptions
  });

  // --- START OF THE FIX ---

  // This logic is now simplified and more robust. It is no longer dependent on the specific `userId`,
  // ensuring that an invalidation event from any user will correctly refresh data for all other users.
  const tableConfigs = useMemo(() => {
    const allSubscribedTables = [table, ...additionalTables];
    return allSubscribedTables.map(tableName => {
        // Define the ROOT query keys to invalidate when this table changes.
        // By invalidating the root ['requests'], TanStack Query (with exact: false)
        // will correctly invalidate both the admin's ['requests'] query and the
        // user's ['requests', 'user-id-123'] query.
        let queriesToInvalidate: string[][] = [];

        // Any change on a critical table should invalidate all 'requests' queries.
        if (tableName === 'requests' || ['quotes', 'request_notes', 'quote_attachments'].includes(tableName)) {
            queriesToInvalidate.push(['requests']); // Root for all request lists.
            queriesToInvalidate.push(['request']);  // Root for all single request detail views.
            if (userId) {
                queriesToInvalidate.push(['requests', userId]); // Specific user requests
            }
        }

        // Always invalidate the queries for the table that actually changed (e.g., ['quotes']).
        queriesToInvalidate.push([tableName]);

        // Remove duplicates just in case
        queriesToInvalidate = queriesToInvalidate.filter((arr, index, self) =>
            index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(arr))
        );

        return {
            table: tableName,
            invalidateQueries: queriesToInvalidate
        };
    });
  }, [table, additionalTables]); // IMPORTANT: The `userId` dependency has been removed.

  // The `onEvent` handler has been removed. We now rely exclusively on the `invalidateQueries`
  // array passed to the hook, creating a single, clear source of truth for real-time logic.
  useSupabaseRealtimeV3(tableConfigs, {
    enabled: enableRealtime,
  });

  // --- END OF THE FIX ---

  return {
    data: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    isError: query.isError,
    isFetching: query.isFetching
  };
}

/**
 * Specialized hooks for common table patterns
 */

// Requests with related data
export function useRequestsQuery(userId?: string, options?: Omit<TableQueryOptions<any>, 'userId'>) {
  return useTableQuery('requests', {
    ...options,
    userId,
    additionalTables: ['quotes', 'request_notes', 'quote_attachments'],
    enableRealtime: true,
    queryKey: ['requests', userId].filter(Boolean)
  });
}

// Quotes for a specific request
export function useQuotesQuery(requestId: string, options?: TableQueryOptions<any>) {
  return useTableQuery('quotes', {
    ...options,
    endpoint: `/requests/${requestId}/quotes`,
    queryKey: ['quotes', requestId],
    additionalTables: ['quote_attachments', 'requests'] // Listen for request changes too
  });
}

// User profile data
export function useProfileQuery(userId: string, options?: TableQueryOptions<any>) {
  return useTableQuery('profiles', {
    ...options,
    endpoint: `/users/${userId}/profile`,
    queryKey: ['profile', userId],
    additionalTables: ['users']
  });
}

// All users (admin only)
export function useUsersQuery(options?: TableQueryOptions<any>) {
  return useTableQuery('users', {
    ...options,
    endpoint: '/admin/users',
    additionalTables: ['profiles']
  });
}