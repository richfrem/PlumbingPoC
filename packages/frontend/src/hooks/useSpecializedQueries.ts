// packages/frontend/src/hooks/useSpecializedQueries.ts

/**
 * =============================================================================
 * useSpecializedQueries.ts - Specialized Data Query Hooks
 * =============================================================================
 *
 * WHAT IS THIS FILE?
 * ------------------
 * This file contains specialized query hooks that build on top of the core
 * useTableQuery hook. These hooks provide convenient, pre-configured interfaces
 * for common data access patterns in the plumbing application.
 *
 * WHY SPECIALIZED HOOKS?
 * ----------------------
 * - Provides semantic, business-logic-focused APIs
 * - Handles complex relationships between tables
 * - Includes user role-based access control
 * - Combines multiple queries for dashboard views
 * - Abstracts away technical query configuration
 *
 * HOOK CATEGORIES:
 * ----------------
 * 1. USER & PROFILE QUERIES - User management and profiles
 * 2. REQUEST & QUOTE QUERIES - Core business data (plumbing requests)
 * 3. ADMIN DASHBOARD QUERIES - Combined views for administrators
 * 4. UTILITY HOOKS - Statistics and computed data
 *
 * REAL-TIME FEATURES:
 * -------------------
 * All hooks automatically include real-time updates via useTableQuery
 * - User requests update when new quotes are added
 * - Admin dashboards update when users create requests
 * - Statistics update in real-time as data changes
 *
 * USAGE PATTERNS:
 * ---------------
 * - Admin Dashboard: useAdminDashboard() - All admin data in one hook
 * - User Profile: useUserRequests(userId) - User's plumbing requests
 * - Statistics: useStatistics() - Real-time business metrics
 * - Quotes: useRequestQuotes(requestId) - Quotes for specific request
 *
 * DEPENDENCIES:
 * -------------
 * - useTableQuery: Core query functionality with real-time
 * - QuoteRequest, Quote, etc.: TypeScript interfaces from types/
 */

import { useTableQuery } from './useTableQuery';

/**
 * Specialized query hooks for all database tables
 * These hooks provide real-time updates and standardized patterns
 */

// ========== USER & PROFILE QUERIES ==========

interface UserProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  name?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

/**
 * Get current user's profile with real-time updates
 */
export function useUserProfile(userId: string) {
  return useTableQuery<UserProfile>('user_profiles', {
    userId,
    endpoint: '/user/profile',
    queryKey: ['profile', userId],
    additionalTables: ['users'], // Listen for user table changes too
  });
}

/**
 * Get all users (admin only) with real-time updates
 */
export function useAllUsers() {
  return useTableQuery<User>('users', {
    endpoint: '/admin/users',
    additionalTables: ['user_profiles'], // Listen for profile changes
  });
}

/**
 * Get all user profiles (admin only) with real-time updates
 */
export function useAllUserProfiles() {
  return useTableQuery<UserProfile>('user_profiles', {
    endpoint: '/admin/user-profiles',
    additionalTables: ['users'],
  });
}

// ========== REQUEST & QUOTE QUERIES ==========

// Import the correct types from the main types file
import { QuoteRequest, RequestNote, Quote, QuoteAttachment } from '../features/requests/types';

/**
 * Get user's requests with real-time updates
 */
export function useUserRequests(userId: string) {
  return useTableQuery<QuoteRequest>('requests', {
    userId,
    endpoint: '/requests',
    queryKey: ['requests', userId],
    additionalTables: ['quotes', 'request_notes', 'quote_attachments'],
  });
}

/**
 * Get all requests (admin only) with real-time updates
 */
export function useAllRequests() {
  return useTableQuery<QuoteRequest>('requests', {
    endpoint: '/requests', // Backend handles admin vs user filtering
    queryKey: ['requests'], // No userId for admin
    additionalTables: ['quotes', 'request_notes', 'quote_attachments', 'user_profiles'],
  });
}

/**
 * Get specific request by ID with real-time updates
 */
export function useRequestById(requestId: string, options?: { enabled?: boolean }) {
  return useTableQuery<QuoteRequest>('requests', {
    endpoint: `/requests/${requestId}`,
    queryKey: ['request', requestId],
    additionalTables: ['quotes', 'request_notes', 'quote_attachments'],
    enableRealtime: true,
    enabled: options?.enabled,
  });
}

/**
 * Get quotes for a specific request with real-time updates
 */
export function useRequestQuotes(requestId: string) {
  return useTableQuery<Quote>('quotes', {
    endpoint: `/requests/${requestId}/quotes`,
    queryKey: ['quotes', requestId],
    additionalTables: ['quote_attachments', 'requests'],
  });
}

/**
 * Get all quotes (admin only) with real-time updates
 */
export function useAllQuotes() {
  return useTableQuery<Quote>('quotes', {
    endpoint: '/admin/quotes',
    queryKey: ['quotes'],
    additionalTables: ['quote_attachments', 'requests'],
  });
}

/**
 * Get notes for a specific request with real-time updates
 */
export function useRequestNotes(requestId: string) {
  return useTableQuery<RequestNote>('request_notes', {
    endpoint: `/requests/${requestId}/notes`,
    queryKey: ['notes', requestId],
    additionalTables: ['requests'], // Listen for request changes
  });
}

/**
 * Get attachments for a specific quote with real-time updates
 */
export function useQuoteAttachments(quoteId: string) {
  return useTableQuery<QuoteAttachment>('quote_attachments', {
    endpoint: `/quotes/${quoteId}/attachments`,
    queryKey: ['attachments', quoteId],
    additionalTables: ['quotes'], // Listen for quote changes
  });
}

// ========== ADMIN DASHBOARD QUERIES ==========

/**
 * Get dashboard data for admin with real-time updates
 * This combines multiple queries for the admin dashboard
 */
export function useAdminDashboard() {
  const requests = useAllRequests();
  const users = useAllUsers();
  const quotes = useAllQuotes();

  return {
    requests: requests.data,
    users: users.data,
    quotes: quotes.data,
    loading: requests.loading || users.loading || quotes.loading,
    error: requests.error || users.error || quotes.error,
    refetch: () => {
      requests.refetch();
      users.refetch();
      quotes.refetch();
    }
  };
}

// ========== UTILITY HOOKS ==========

/**
 * Get real-time statistics with automatic updates
 */
export function useStatistics() {
  const requests = useAllRequests();
  
  const stats = {
    totalRequests: requests.data.length,
    newRequests: requests.data.filter(r => r.status === 'new').length,
    quotedRequests: requests.data.filter(r => r.status === 'quoted').length,
    completedRequests: requests.data.filter(r => r.status === 'completed').length,
    emergencyRequests: requests.data.filter(r => r.is_emergency).length,
  };

  return {
    stats,
    loading: requests.loading,
    error: requests.error,
    refetch: requests.refetch
  };
}