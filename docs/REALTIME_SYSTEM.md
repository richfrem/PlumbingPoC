# Real-Time Database Query System

This document explains the standardized real-time database query system that automatically refreshes UI components when database changes occur.

## Overview

The system provides:
- **Automatic real-time updates** for all database tables
- **Standardized query patterns** that work consistently across the app
- **Type-safe hooks** for all database operations
- **Admin/user role separation** built-in
- **Backward compatibility** with existing code

## Core Components

### 1. `useRealtimeSubscription` - Core Real-Time Hook

Sets up Supabase real-time subscriptions for any database tables.

```typescript
import { useRealtimeSubscription, createTableConfig } from './hooks';

// Basic usage
useRealtimeSubscription([
  { table: 'requests', queryKeys: [['requests']] },
  { table: 'quotes', queryKeys: [['quotes']] }
]);

// Advanced usage with user-specific queries
useRealtimeSubscription([
  createTableConfig.userSpecific('requests', userId),
  createTableConfig.general('users')
]);
```

### 2. `useTableQuery` - Generic Table Query Hook

Generic hook that works with any database table and includes real-time updates.

```typescript
import { useTableQuery } from './hooks';

// Basic table query
const { data, loading, error, refetch } = useTableQuery<MyType>('my_table');

// User-specific query with real-time updates
const { data: requests } = useTableQuery<QuoteRequest>('requests', {
  userId: user.id,
  additionalTables: ['quotes', 'notes'], // Also listen for changes to these
  enableRealtime: true
});

// Admin query (all records)
const { data: allRequests } = useTableQuery<QuoteRequest>('requests', {
  endpoint: '/admin/requests', // Custom endpoint
  additionalTables: ['quotes', 'users']
});
```

### 3. Specialized Hooks - Ready-to-Use Table Hooks

Pre-configured hooks for all database tables with optimal real-time settings.

```typescript
import {
  useUserRequests,
  useAllRequests,
  useRequestQuotes,
  useUserProfile,
  useAdminDashboard
} from './hooks';

// In a user component
function UserDashboard({ userId }) {
  const { data: requests, loading } = useUserRequests(userId);
  const { data: profile } = useUserProfile(userId);

  return (
    <div>
      <h1>Welcome {profile?.name}</h1>
      <p>You have {requests.length} requests</p>
      {/* Real-time updates automatically applied */}
    </div>
  );
}

// In an admin component
function AdminDashboard() {
  const { requests, users, quotes, loading } = useAdminDashboard();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Total Requests: {requests.length}</p>
      <p>Total Users: {users.length}</p>
      {/* Automatically updates when new requests/users are created */}
    </div>
  );
}
```

## Available Hooks

### User & Profile Hooks
- `useUserProfile(userId)` - Get current user's profile with real-time updates
- `useAllUsers()` - Get all users (admin only) with real-time updates
- `useAllUserProfiles()` - Get all user profiles (admin only) with real-time updates

### Request & Quote Hooks
- `useUserRequests(userId)` - Get user's requests with real-time updates
- `useAllRequests()` - Get all requests (admin only) with real-time updates
- `useRequestById(requestId)` - Get specific request by ID with real-time updates
- `useRequestQuotes(requestId)` - Get quotes for a specific request with real-time updates
- `useAllQuotes()` - Get all quotes (admin only) with real-time updates
- `useRequestNotes(requestId)` - Get notes for a specific request with real-time updates
- `useQuoteAttachments(quoteId)` - Get attachments for a specific quote with real-time updates

### Dashboard Hooks
- `useAdminDashboard()` - Get combined admin dashboard data with real-time updates
- `useStatistics()` - Get real-time statistics with automatic updates

## Migration Guide

### From Legacy `useRequestsQuery`

**Old way:**
```typescript
import { useRequestsQuery } from './features/requests/hooks/useRequestsQuery';

const { requests, loading, error } = useRequestsQuery(userId, user, { enabled: true });
```

**New way (Option 1 - Keep existing code):**
```typescript
// No changes needed! The legacy hook now uses the new system internally
import { useRequestsQuery } from './features/requests/hooks/useRequestsQuery';

const { requests, loading, error } = useRequestsQuery(userId, user, { enabled: true });
```

**New way (Option 2 - Use specialized hooks):**
```typescript
import { useUserRequests, useAllRequests } from './hooks';

// For users
const { data: requests, loading, error } = useUserRequests(userId);

// For admins
const { data: requests, loading, error } = useAllRequests();
```

### Adding New Tables

To add real-time support for a new table:

1. **Add to specialized hooks:**
```typescript
// In useSpecializedQueries.ts
export function useMyNewTable(userId?: string) {
  return useTableQuery<MyTableType>('my_new_table', {
    userId,
    endpoint: '/my-new-table',
    additionalTables: ['related_table1', 'related_table2'],
  });
}
```

2. **Export in index.ts:**
```typescript
export { useMyNewTable } from './useSpecializedQueries';
```

3. **Use in components:**
```typescript
import { useMyNewTable } from './hooks';

function MyComponent() {
  const { data, loading } = useMyNewTable(userId);
  // Automatic real-time updates included!
}
```

## Real-Time Behavior

### What Triggers Updates

The system automatically invalidates and refetches queries when:

- **INSERT** - New records added to subscribed tables
- **UPDATE** - Existing records modified in subscribed tables
- **DELETE** - Records removed from subscribed tables

### Smart Query Invalidation

The system uses intelligent query invalidation:

```typescript
// If listening to 'requests' table with userId='123'
// These query keys get invalidated:
['requests'] // All requests queries
['requests', '123'] // User-specific requests queries

// If listening to 'quotes' table for requestId='456'
// These query keys get invalidated:
['quotes'] // All quotes queries
['quotes', '456'] // Request-specific quotes queries
['requests'] // Also invalidates requests (since quotes affect request status)
```

### Performance Optimizations

- **Debounced invalidation** - Multiple rapid changes trigger only one refetch
- **Stale time = 0** - Ensures immediate updates for real-time data
- **Background refetching** - Updates happen without loading states
- **Query deduplication** - Identical queries share the same cache

## Debugging Real-Time Issues

### Enable Debug Logging

The system includes comprehensive logging:

```javascript
// Check browser console for these logs:
🚀 Setting up real-time subscriptions for tables: ['requests', 'quotes']
📡 Real-time subscription status: SUBSCRIBED
🔄 Real-time event: INSERT on requests
🔄 Invalidating query key: ['requests']
✅ Fetched 5 requests records
```

### Common Issues & Solutions

**Problem: Real-time updates not working**
- Check browser console for subscription status
- Verify RLS policies allow the user to see changes
- Ensure backend API endpoints are working (no 500 errors)

**Problem: Too many refetches**
- Check if multiple components are using the same hook
- Verify `additionalTables` aren't causing circular updates

**Problem: Admin not seeing user changes**
- Ensure admin hooks use `useAllRequests()` not `useUserRequests()`
- Check that query keys are correctly set up for admin vs user

### Testing Real-Time Updates

1. **Open two browser windows** - one as admin, one as user
2. **Create a new request** as user
3. **Verify admin dashboard updates** immediately
4. **Add a quote** as admin
5. **Verify user sees the quote** immediately

## Best Practices

### 1. Use Specialized Hooks When Possible
```typescript
// Good
const { data: requests } = useUserRequests(userId);

// Less optimal
const { data: requests } = useTableQuery('requests', { userId });
```

### 2. Include Related Tables
```typescript
// Good - includes related data that might affect the UI
const { data: requests } = useUserRequests(userId); // Automatically includes quotes, notes

// Less optimal - might miss related updates
const { data: requests } = useTableQuery('requests', { userId, additionalTables: [] });
```

### 3. Handle Loading States
```typescript
function MyComponent() {
  const { data: requests, loading, error } = useUserRequests(userId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <RequestsList requests={requests} />;
}
```

### 4. Use Admin Hooks for Admin Views
```typescript
// In admin components
const { data: allRequests } = useAllRequests(); // ✅ Sees all requests

// Don't do this in admin components
const { data: requests } = useUserRequests(adminUserId); // ❌ Only sees admin's own requests
```

## Performance Considerations

- **Query sharing** - Multiple components using the same hook share one query
- **Automatic cleanup** - Real-time subscriptions are cleaned up when components unmount
- **Optimistic updates** - Consider implementing optimistic updates for better UX
- **Error boundaries** - Wrap components in error boundaries to handle query failures gracefully

## Future Enhancements

Planned improvements:
- **Optimistic updates** for instant UI feedback
- **Offline support** with query synchronization
- **Query retry strategies** for better error handling
- **Real-time presence indicators** (who's online)
- **Real-time notifications** system integration
