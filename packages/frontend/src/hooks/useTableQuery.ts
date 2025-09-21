// packages/frontend/src/hooks/useTableQuery.ts

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
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

  // Set up real-time subscriptions
  const allTables = [table, ...additionalTables];
  const tableConfigs = allTables.map(tableName => {
    // For shared data like attachments, notes, quotes - these affect all request queries
    if (['quote_attachments', 'request_notes', 'quotes'].includes(tableName)) {
      return {
        table: tableName,
        invalidateQueries: [[tableName], ['requests'], ['request']] // This will invalidate ALL queries starting with 'requests' or 'request'
      };
    }
    // For user-specific data, just invalidate the table's queries
    return {
      table: tableName,
      invalidateQueries: [[tableName]]
    };
  });

  // Set up real-time subscriptions using v3 system
  useSupabaseRealtimeV3(tableConfigs, {
    enabled: enableRealtime && !query.isLoading,
    onEvent: (event, tableName, payload) => {
      console.log(`🔄 Real-time v3 update for ${table} query due to ${event} on ${tableName}`);
    }
  });

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