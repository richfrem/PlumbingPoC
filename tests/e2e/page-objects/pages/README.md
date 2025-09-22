# E2E Page Objects - Frontend Component Mapping

This directory contains Page Object classes that correspond to specific frontend components and user workflows in the PlumbingPOC application.

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
- Question/answer flows
- Emergency triage

**Responsibilities:**
- New quote request creation
- Conversational AI question handling
- Service category selection
- Form submission and validation

**Usage:**
```typescript
const quoteRequestPage = new QuoteRequestPage(page);
const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains');
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

## 🔄 **Component Relationships**

```
Frontend Components → Page Objects → Test Usage
├── AuthModal.tsx → AuthPage.ts → Authentication tests
├── Dashboard → DashboardPage.ts → Navigation tests
├── My Requests → MyRequestsPage.ts → User request tests
├── QuoteAgentModal.tsx → QuoteRequestPage.ts → Quote creation tests
├── RequestDetailModal.tsx → QuotePage.ts + RequestDetailPage.ts → Quote/request management tests
└── ProfileModal.tsx → ProfilePage.ts → Profile management tests
```

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