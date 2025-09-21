// packages/frontend/src/features/requests/hooks/useRequestsQuery.ts

import { useRequestsQuery as useStandardRequestsQuery } from '../../../hooks/useTableQuery';
import { QuoteRequest } from '../types';

/**
 * Legacy wrapper for useRequestsQuery - now uses the standardized system
 * This maintains backward compatibility while using the new real-time system
 */
export function useRequestsQuery(userId?: string, user?: any, options?: { enabled?: boolean }) {
  console.log('🔧 useRequestsQuery CALLED with:', { userId, userFromProp: user?.id, enabled: options?.enabled ?? true });
  
  // Use the standardized hook
  console.log('🔧 Calling useStandardRequestsQuery with:', { userId, enableRealtime: true });
  const result = useStandardRequestsQuery(userId, {
    enabled: options?.enabled ?? true,
    enableRealtime: true
  });
  console.log('🔧 useStandardRequestsQuery result:', { dataLength: result.data?.length, loading: result.loading });

  // Return in the legacy format for backward compatibility
  return {
    requests: result.data as QuoteRequest[],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}