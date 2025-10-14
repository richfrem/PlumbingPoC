import { describe, it, expect } from 'vitest';
import { services as SERVICE_QUOTE_CATEGORIES } from '../../../packages/frontend/src/lib/serviceDefinitions';

describe('Service Quote Categories', () => {
  it('should have all required plumbing categories', () => {
    const expectedCategories = [
      'leak_repair',
      'pipe_installation',
      'drain_cleaning',
      'water_heater',
      'fixture_install',
      'gas_line_services',
      'perimeter_drains',
      'bathroom_reno',
      'main_line_repair',
      'emergency_service',
      'other'
    ];

    const actualKeys = SERVICE_QUOTE_CATEGORIES.map(cat => cat.key);
    expect(actualKeys).toEqual(expectedCategories);
  });

  it('should have questions for each category', () => {
    SERVICE_QUOTE_CATEGORIES.forEach(category => {
      expect(category.questions).toBeDefined();
      expect(Array.isArray(category.questions)).toBe(true);
      expect(category.questions.length).toBeGreaterThan(0);
    });
  });

  it('should have unique category keys', () => {
    const keys = SERVICE_QUOTE_CATEGORIES.map(cat => cat.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should have descriptive titles', () => {
    SERVICE_QUOTE_CATEGORIES.forEach(category => {
      expect(category.title).toBeDefined();
      expect(typeof category.title).toBe('string');
      expect(category.title.length).toBeGreaterThan(0);
    });
  });
});

describe('Emergency Service Category', () => {
  it('should exist in the categories list', () => {
    const emergencyCategory = SERVICE_QUOTE_CATEGORIES.find(cat => cat.key === 'emergency_service');
    expect(emergencyCategory).toBeDefined();
    expect(emergencyCategory!.title).toBe('Emergency Service');
  });

  it('should have appropriate emergency questions', () => {
    const emergencyCategory = SERVICE_QUOTE_CATEGORIES.find(cat => cat.key === 'emergency_service');
    expect(emergencyCategory).toBeDefined();
    expect(emergencyCategory!.questions.length).toBeGreaterThan(0);
    expect(emergencyCategory!.questions[0]).toContain('emergency');
  });
});

describe('Leak Repair Category', () => {
  it('should have location-specific questions', () => {
    const leakCategory = SERVICE_QUOTE_CATEGORIES.find(cat => cat.key === 'leak_repair');
    expect(leakCategory).toBeDefined();

    const questions = leakCategory!.questions;

    // Check for "where" or "location" in questions
    const hasLocationQuestion = questions.some(q =>
      q.toLowerCase().includes('where') || q.toLowerCase().includes('location')
    );
    expect(hasLocationQuestion).toBe(true);

    // Check for "active" or "leaking" in questions
    const hasActiveQuestion = questions.some(q =>
      q.toLowerCase().includes('active') || q.toLowerCase().includes('leaking')
    );
    expect(hasActiveQuestion).toBe(true);
  });
});
