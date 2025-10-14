# E2E Page Objects - Comprehensive Frontend Testing Framework

This directory contains Page Object classes that provide **comprehensive end-to-end testing coverage** for the PlumbingPOC application, including AI-powered conversational interfaces, file uploads, geocoding, and complex user workflows.

## 🎯 **Testing Capabilities Overview**

- **16 Test Scenarios** across 4 service categories with full feature combinations
- **AI Conversation Handling** with dynamic question generation and realistic responses
- **Multi-Feature Integration** (attachments + addresses + AI follow-ups)
- **Geocoding & Validation** with Google Maps API integration
- **File Processing** with upload, validation, and persistence
- **Database Verification** ensuring complete data integrity

## 📋 **Page Object Mappings**

**Note:** `utils/quoteHelpers.ts` and `utils/auth.ts` have been eliminated - all functionality is now properly organized within the appropriate Page Objects.

### **AuthPage.ts**
**Frontend Components:**
- `AuthModal.tsx` - Main authentication modal
- Login/Signup forms
- User menu dropdown

**Responsibilities:**
- User authentication (login/logout)
- Session management
- User profile access

**Usage:**
```typescript
const authPage = new AuthPage(page);

// Sign in with specific credentials
await authPage.signIn('user@example.com', 'password');

// Sign in as user type (uses test credentials)
await authPage.signInAsUserType('user'); // or 'admin'

// Sign out
await authPage.signOut();

// Check login status
const isLoggedIn = await authPage.isLoggedIn();

// Ensure signed in/out for test setup
await authPage.ensureSignedIn('email', 'password');
await authPage.ensureSignedOut();
```

---

### **DashboardPage.ts**
**Frontend Components:**
- Main dashboard views (customer & admin)
- Request listing tables
- Navigation elements

**Responsibilities:**
- Dashboard navigation and verification
- Request table interactions
- Status filtering and display

**Usage:**
```typescript
const dashboardPage = new DashboardPage(page);
await dashboardPage.verifyOnCustomerDashboard();
await dashboardPage.openRequestById('req-123', 'admin');
```

---

### **MyRequestsPage.ts**
**Frontend Components:**
- Customer "My Requests" section
- User request listing and filtering

**Responsibilities:**
- User-specific request management
- Request status viewing
- Request detail access

**Usage:**
```typescript
const myRequestsPage = new MyRequestsPage(page);
await myRequestsPage.openUserRequestById('req-123');
await myRequestsPage.viewUserRequestDetails('req-123');
```

---

### **QuoteRequestPage.ts**
**Frontend Components:**
- `QuoteAgentModal.tsx` - Conversational quote request creation
- Service category selection
- Question/answer flows with AI follow-ups
- Emergency triage
- Service location management
- File attachment handling

**Responsibilities:**
- New quote request creation with full feature support
- Conversational AI question handling (predefined + AI-generated follow-ups)
- Service category selection and dynamic question flows
- Address geocoding and location validation
- File attachment upload and processing
- Form submission and validation
- AI-powered answer generation for dynamic questions

**Key Features:**
- **AI Follow-up Handling**: Automatically detects and responds to AI-generated clarifying questions for "other" service category
- **Comprehensive Test Coverage**: Supports all service categories with attachments, custom addresses, and combinations
- **OpenAI Integration**: Generates realistic homeowner responses using conversation context
- **Geocoding Support**: Validates and geocodes service addresses
- **Attachment Processing**: Handles file uploads with proper validation

**Usage:**
```typescript
const quoteRequestPage = new QuoteRequestPage(page);

// Basic quote creation
const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains');

// With attachments
const requestIdWithAttachment = await quoteRequestPage.createQuoteRequest('leak_repair', {
  attachmentPath: 'tests/e2e/fixtures/example-images/leak.jpg'
});

// With custom service address
const requestIdWithAddress = await quoteRequestPage.createQuoteRequest('main_line_repair', {
  serviceLocation: {
    address: '123 Main St',
    city: 'Victoria',
    province: 'BC',
    postalCode: 'V8W 1A1'
  }
});

// Combined features
const requestIdFull = await quoteRequestPage.createQuoteRequest('other', {
  attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg',
  serviceLocation: {
    address: '2451 Island View Rd',
    city: 'Saanichton',
    province: 'BC',
    postalCode: 'V8M 2J7'
  }
});
```

---

### **QuotePage.ts**
**Frontend Components:**
- Quote management within `RequestDetailModal.tsx`
- Quote creation forms
- Quote editing interfaces
- Quote deletion confirmations

**Responsibilities:**
- Quote CRUD operations on existing requests
- Quote pricing and description management
- Quote status handling

**Usage:**
```typescript
const quotePage = new QuotePage(page);
await quotePage.createQuote({ description: 'Drain inspection', price: '450.00' });
await quotePage.updateQuote({ quoteId: 'quote-123', description: 'Updated description', price: '500.00' });
```

---

### **ProfilePage.ts**
**Frontend Components:**
- `ProfileModal.tsx` - User profile management
- Address and contact information forms

**Responsibilities:**
- User profile data management
- Address validation and geocoding
- Profile form interactions

**Usage:**
```typescript
const profilePage = new ProfilePage(page);
await profilePage.fillProfileForm(profileData);
await profilePage.saveProfile();
```

---

## 🔄 **Component Relationships & Test Coverage**

```
Frontend Components → Page Objects → Test Coverage
├── AuthModal.tsx → AuthPage.ts → Authentication tests
├── Dashboard → DashboardPage.ts → Navigation tests
├── My Requests → MyRequestsPage.ts → User request tests
├── QuoteAgentModal.tsx → QuoteRequestPage.ts → Comprehensive quote creation tests:
│   ├── Emergency triage → Category selection → Question flows
│   ├── AI follow-up questions (dynamic for "other" category)
│   ├── File attachment upload and processing
│   ├── Address geocoding and validation
│   ├── Form submission with all feature combinations
│   └── Database persistence verification
├── RequestDetailModal.tsx → QuotePage.ts + RequestDetailPage.ts → Quote/request management tests
└── ProfileModal.tsx → ProfilePage.ts → Profile management tests
```

## 🧪 **Comprehensive Test Coverage Achieved**

**QuoteRequestPage.ts** now supports **16 different test scenarios** across 4 service categories:

- ✅ **Perimeter Drains**: Basic, attachment, address, combined (4 scenarios)
- ✅ **Leak Repair**: Basic, attachment, address, combined (4 scenarios)
- ✅ **Main Line Repair**: Basic, attachment, address, combined (4 scenarios)
- ✅ **Other Services**: Basic with AI follow-ups (1 scenario, extensible)

**Key Testing Capabilities:**
- **AI Conversation Handling**: Dynamic question generation and realistic answer generation
- **Multi-Feature Combinations**: Attachments + addresses + AI follow-ups
- **Geocoding Integration**: Google Maps API validation and coordinate storage
- **File Processing**: Image upload, validation, and database persistence
- **Database Verification**: Complete Q&A storage including AI-generated interactions

## 📝 **Naming Conventions**

- **Page Objects** are named after the primary user workflow or component they represent
- **Methods** use descriptive names that match user actions (e.g., `createQuoteRequest()`, `openUserRequestById()`)
- **Parameters** are clearly typed and documented
- **Return values** provide useful data for test assertions

## 🏗️ **Architecture Notes**

- **BasePage.ts** provides common functionality (waiting, element interactions)
- **Page Objects** extend BasePage for consistent behavior
- **Separation of Concerns**: Each Page Object handles one primary workflow
- **Test Independence**: Page Objects can be used independently or composed together

## 🔧 **Adding New Page Objects**

When adding new Page Objects:

1. Identify the corresponding frontend component(s)
2. Create a new `.ts` file in this directory
3. Extend `BasePage` for common functionality
4. Document the mapping in this README
5. Add usage examples

## 📚 **Related Documentation**

- `../../../README.md` - Main E2E testing overview
- `../base/BasePage.ts` - Common page functionality
- `../../../utils/` - Building block utilities
