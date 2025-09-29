// packages/frontend/src/hooks/index.ts

/**
 * =============================================================================
 * hooks/index.ts - Central Hook Exports & Documentation
 * =============================================================================
 *
 * WHAT IS THIS FILE?
 * ------------------
 * This is the central export file for all custom React hooks in the plumbing
 * application. It provides a clean, organized API for importing hooks throughout
 * the codebase, following a modular architecture pattern.
 *
 * HOOK ARCHITECTURE OVERVIEW:
 * ---------------------------
 * The hooks are organized in a layered architecture:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    SPECIALIZED HOOKS (High-Level)           │
 * │  useUserRequests, useAllRequests, useAdminDashboard, etc.  │
 * │  - Business logic focused                                    │
 * │  - User role aware                                           │
 * │  - Pre-configured for common use cases                      │
 * └─────────────────────────────────────────────────────────────┘
 *                                │
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    CORE HOOKS (Mid-Level)                    │
 * │  useTableQuery, useSupabaseRealtimeV3                       │
 * │  - Generic data fetching with real-time                     │
 * │  - Configurable for any table/query pattern                 │
 * │  - Handles caching, real-time, and invalidation            │
 * └─────────────────────────────────────────────────────────────┘
 *                                │
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    UTILITIES (Low-Level)                     │
 * │  Supabase client, API client, status colors, etc.           │
 * │  - Raw data access and utilities                            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * IMPORT PATTERNS:
 * ----------------
 *
 * // Recommended: Import specific hooks you need
 * import { useUserRequests, useAllRequests } from '../hooks';
 * import { useAdminDashboard, useStatistics } from '../hooks';
 *
 * // Advanced: Import core hooks for custom implementations
 * import { useTableQuery } from '../hooks';
 *
 * // Full API: Import everything (not recommended for production)
 * import * as Hooks from '../hooks';
 *
 * HOOK CATEGORIES:
 * ----------------
 *
 * 🔵 USER & PROFILE HOOKS:
 * - useUserProfile: Current user's profile data
 * - useAllUsers: All users (admin only)
 * - useAllUserProfiles: All user profiles (admin only)
 *
 * 🟢 REQUEST & QUOTE HOOKS:
 * - useUserRequests: Current user's plumbing requests
 * - useAllRequests: All requests (admin dashboard)
 * - useRequestById: Specific request details
 * - useRequestQuotes: Quotes for a specific request
 * - useAllQuotes: All quotes (admin only)
 * - useRequestNotes: Notes for a specific request
 * - useQuoteAttachments: Attachments for a specific quote
 *
 * 🟡 ADMIN DASHBOARD HOOKS:
 * - useAdminDashboard: Combined admin data (requests, users, quotes)
 * - useStatistics: Real-time business statistics
 *
 * 🔴 MUTATION HOOKS:
 * - useSubmitQuoteRequest: Submit new plumbing requests
 * - useUpdateRequestStatus: Change request status (admin)
 * - useAcceptQuote: Customer accepts quotes
 * - useCreateQuote: Create new quotes
 * - useUpdateQuote: Modify existing quotes
 * - useTriageRequest: AI analysis of requests
 * - useUpdateAddressMutation: Update service addresses
 *
 * � CORE SYSTEM HOOKS:
 * - useTableQuery: Generic table query with real-time (advanced)
 * - useSupabaseRealtimeV3: Real-time subscription management
 *
 * REAL-TIME FEATURES:
 * -------------------
 * All data hooks automatically include real-time updates:
 * - UI updates instantly when database changes
 * - Cross-user synchronization (admin ↔ user updates)
 * - No manual refresh needed
 * - Optimized for performance with smart caching
 *
 * USAGE GUIDELINES:
 * -----------------
 * 1. Use specialized hooks for common patterns (recommended)
 * 2. Use core hooks only for custom/advanced use cases
 * 3. All hooks handle loading states, errors, and real-time updates
 * 4. Import only what you need for better tree-shaking
 * 5. Hooks are memoized and optimized for performance
 *
 * MIGRATION NOTES:
 * ----------------
 * - All hooks now use the unified real-time system
 * - Legacy feature-specific hooks have been consolidated
 * - Real-time is automatic - no manual setup required
 */

// Core real-time system
export { useTableQuery, useQuotesQuery, useProfileQuery, useUsersQuery } from './useTableQuery';
export { useRealtimeInvalidation } from './useSupabaseRealtimeV3';

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

// Mutation hooks for write operations
export {
  useSubmitQuoteRequest,
  useUpdateRequestStatus,
  useMarkRequestAsViewed,
  useAcceptQuote,
  useCreateQuote,
  useUpdateQuote,
  useTriageRequest,
  useUpdateAddressMutation,
} from './useRequestMutations';
