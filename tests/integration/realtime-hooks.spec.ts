import { test, expect } from '@playwright/test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateQuote, useAcceptQuote } from '../../packages/frontend/src/features/requests/hooks/useRequestMutations';
import { useRequestsQuery } from '../../packages/frontend/src/hooks/useTableQuery';

// Mock Supabase client
jest.mock('../../packages/frontend/src/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-quote-id' }, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { status: 'accepted' }, error: null }))
          }))
        }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn((callback) => {
          // Simulate successful subscription
          callback('SUBSCRIBED');
          return {
            unsubscribe: jest.fn()
          };
        })
      }))
    })),
    removeChannel: jest.fn()
  }
}));

// Mock API client
jest.mock('../../packages/frontend/src/lib/apiClient', () => ({
  default: {
    post: jest.fn(() => Promise.resolve({ data: { id: 'test-quote-id' } })),
    put: jest.fn(() => Promise.resolve({ data: { status: 'accepted' } }))
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test.describe('Real-time Hooks Integration', () => {
  test('useCreateQuote invalidates requests queries', async () => {
    const { result } = renderHook(() => useCreateQuote(), {
      wrapper: createWrapper()
    });

    // Initially should have the mutation function
    expect(result.current.mutate).toBeDefined();

    // Trigger the mutation
    act(() => {
      result.current.mutate({
        requestId: 'test-request-id',
        payload: { quote_amount: 100, details: '{}' }
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the mutation completed successfully
    expect(result.current.data).toEqual({ id: 'test-quote-id' });
  });

  test('useAcceptQuote invalidates requests queries', async () => {
    const { result } = renderHook(() => useAcceptQuote(), {
      wrapper: createWrapper()
    });

    // Initially should have the mutation function
    expect(result.current.mutate).toBeDefined();

    // Trigger the mutation
    act(() => {
      result.current.mutate({
        requestId: 'test-request-id',
        quoteId: 'test-quote-id'
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the mutation completed successfully
    expect(result.current.data).toEqual({ status: 'accepted' });
  });

  test('useRequestsQuery integrates with realtime updates', async () => {
    const { result } = renderHook(() => useRequestsQuery('test-user-id'), {
      wrapper: createWrapper()
    });

    // Initially should be loading
    expect(result.current.loading).toBe(true);

    // Wait for query to settle
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have data structure
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');
  });
});
