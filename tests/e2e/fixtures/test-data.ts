/**
 * Test data fixtures for E2E tests
 */

export const TEST_USERS = {
  customer: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  },
  admin: {
    email: process.env.TEST_ADMIN_USER_EMAIL,
    password: process.env.TEST_ADMIN_USER_PASSWORD
  }
};

export const QUOTE_REQUEST_DATA = {
  basicLeakRepair: {
    isEmergency: false,
    category: 'leak_repair' as const,
    formData: {
      propertyType: 'Residential' as const,
      isHomeowner: true,
      problemDescription: 'Kitchen sink leak under the cabinet',
      preferredTiming: 'This week',
      additionalNotes: 'Access available during business hours'
    }
  },
  emergencyLeakRepair: {
    isEmergency: true,
    category: 'leak_repair' as const,
    formData: {
      propertyType: 'Residential' as const,
      isHomeowner: true,
      problemDescription: 'EMERGENCY: Water flooding kitchen floor from burst pipe!',
      preferredTiming: 'EMERGENCY - Immediate response needed',
      additionalNotes: 'Water is actively flooding. Emergency shutoff valve location needed.'
    }
  },
  bathroomRenovation: {
    isEmergency: false,
    category: 'bathroom_renovation' as const,
    formData: {
      propertyType: 'Residential' as const,
      isHomeowner: true,
      problemDescription: 'Complete bathroom renovation needed',
      preferredTiming: 'Within 2 weeks',
      additionalNotes: 'Keep existing layout, upgrade fixtures'
    }
  }
};

export const EXPECTED_RESPONSES = {
  quoteSubmission: {
    successMessage: 'Quote request submitted successfully',
    hasRequestId: true,
    hasRequestObject: true
  }
};

export const PROFILE_UPDATE_DATA = {
  testProfile: {
    name: 'Test User Updated',
    email: 'test-updated@example.com',
    phone: '555-123-4567',
    address: '123 Test Street',
    city: 'Test City',
    province: 'BC',
    postalCode: 'V1V1V1'
  },
  originalProfile: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1-555-0124',
    address: '456 Original Street',
    city: 'Original City',
    province: 'BC',
    postalCode: 'V2V2V2'
  }
};

export const TIMEOUTS = {
  api: 30000,
  modal: 10000,
  navigation: 5000,
  element: 10000
};