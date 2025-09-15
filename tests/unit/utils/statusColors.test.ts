import { describe, it, expect } from 'vitest';
import { getRequestStatusChipColor, getQuoteStatusChipColor } from '../../../packages/frontend/src/lib/statusColors';

describe('Request Status Colors', () => {
  it('should return correct color for "new" status', () => {
    expect(getRequestStatusChipColor('new')).toBe('info');
  });

  it('should return correct color for "viewed" status', () => {
    expect(getRequestStatusChipColor('viewed')).toBe('warning');
  });

  it('should return correct color for "quoted" status', () => {
    expect(getRequestStatusChipColor('quoted')).toBe('primary');
  });

  it('should return correct color for "accepted" status', () => {
    expect(getRequestStatusChipColor('accepted')).toBe('success');
  });

  it('should return correct color for "scheduled" status', () => {
    expect(getRequestStatusChipColor('scheduled')).toBe('success');
  });

  it('should return correct color for "completed" status', () => {
    expect(getRequestStatusChipColor('completed')).toBe('default');
  });

  it('should return default color for unknown status', () => {
    expect(getRequestStatusChipColor('unknown')).toBe('default');
    expect(getRequestStatusChipColor('')).toBe('default');
    expect(getRequestStatusChipColor('random_status')).toBe('default');
  });
});

describe('Quote Status Colors', () => {
  it('should return correct color for "accepted" status', () => {
    expect(getQuoteStatusChipColor('accepted')).toBe('success');
  });

  it('should return correct color for "rejected" status', () => {
    expect(getQuoteStatusChipColor('rejected')).toBe('error');
  });

  it('should return correct color for "sent" status', () => {
    expect(getQuoteStatusChipColor('sent')).toBe('default');
  });

  it('should return default color for unknown status', () => {
    expect(getQuoteStatusChipColor('unknown')).toBe('default');
    expect(getQuoteStatusChipColor('')).toBe('default');
    expect(getQuoteStatusChipColor('pending')).toBe('default');
  });
});

describe('Status Color Functions - Edge Cases', () => {
  it('should handle undefined input', () => {
    expect(getRequestStatusChipColor(undefined as any)).toBe('default');
    expect(getQuoteStatusChipColor(undefined as any)).toBe('default');
  });

  it('should handle null input', () => {
    expect(getRequestStatusChipColor(null as any)).toBe('default');
    expect(getQuoteStatusChipColor(null as any)).toBe('default');
  });

  it('should handle case sensitivity', () => {
    expect(getRequestStatusChipColor('NEW')).toBe('default');
    expect(getRequestStatusChipColor('New')).toBe('default');
    expect(getQuoteStatusChipColor('ACCEPTED')).toBe('default');
  });
});