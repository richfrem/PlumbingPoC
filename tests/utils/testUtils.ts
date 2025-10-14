import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '555-0123',
  address: '123 Test St',
  city: 'Test City',
  province: 'BC',
  postal_code: 'V1V1V1',
  ...overrides
});

export const createMockRequest = (overrides = {}) => ({
  id: 'request-123',
  user_id: 'user-123',
  customer_name: 'Test Customer',
  service_address: '123 Test St, Test City BC V1V1V1',
  contact_info: 'test@example.com',
  problem_category: 'leak_repair',
  is_emergency: false,
  property_type: 'House',
  is_homeowner: true,
  problem_description: 'Leaking faucet in kitchen',
  preferred_timing: 'ASAP',
  additional_notes: 'Side door entrance',
  answers: [
    { question: 'Where is the leak?', answer: 'Kitchen sink' },
    { question: 'Is water actively leaking?', answer: 'Yes' }
  ],
  status: 'new',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

export const createMockQuote = (overrides = {}) => ({
  id: 'quote-123',
  request_id: 'request-123',
  user_id: 'user-123',
  quote_amount: 150.00,
  details: 'Fix leaking faucet and replace washer',
  status: 'sent',
  created_at: '2025-01-02T00:00:00Z',
  ...overrides
});

// Mock API responses
export const mockApiResponse = {
  success: (data: any) => ({ data, status: 200 }),
  error: (message: string, status = 400) => ({
    error: { message },
    status
  })
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export * from '@testing-library/react';
export { customRender as render };
