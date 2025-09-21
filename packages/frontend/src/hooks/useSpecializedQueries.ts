// packages/frontend/src/hooks/useSpecializedQueries.ts

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
    endpoint: '/admin/requests',
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