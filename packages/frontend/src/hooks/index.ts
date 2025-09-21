// packages/frontend/src/hooks/index.ts

/**
 * Central export for all custom hooks
 * 
 * Import pattern examples:
 * import { useUserRequests, useAllRequests } from '../hooks';
 * import { useRealtimeSubscription } from '../hooks';
 * import { useTableQuery } from '../hooks';
 */

// Core real-time system
export { useRealtimeSubscription } from './useRealtimeSubscription';
export { useTableQuery, useRequestsQuery, useQuotesQuery, useProfileQuery, useUsersQuery } from './useTableQuery';

// Specialized queries for all tables
export {
  // User & Profile
  useUserProfile,
  useAllUsers,
  useAllUserProfiles,
  
  // Requests & Quotes
  useUserRequests,
  useAllRequests,
  useRequestById,
  useRequestQuotes,
  useAllQuotes,
  useRequestNotes,
  useQuoteAttachments,
  
  // Admin Dashboard
  useAdminDashboard,
  useStatistics,
} from './useSpecializedQueries';

// Legacy exports (for backward compatibility)
export { useRequestsQuery as useLegacyRequestsQuery } from '../features/requests/hooks/useRequestsQuery';