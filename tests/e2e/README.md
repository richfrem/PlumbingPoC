# PlumbingPOC E2E Testing Roadmap

## Overview
This document outlines the strategy for implementing automated End-to-End (E2E) testing with Playwright to replace manual testing and ensure continuous quality.

## Current Status & Testing Roadmap

### ✅ **Foundation Layer (Basic Building Blocks)**
These must work before any complex features can be tested:

| Test | Status | Purpose | Dependencies | Notes |
|------|--------|---------|--------------|-------|
| **Authentication** | ✅ **8/8 PASSED** | Login/logout flows | None | ✅ **COMPLETE** |
| **User Registration** | ⏭️ **SKIP** | Account creation | N/A | Requires email confirmation - use existing test users |
| **Profile Management** | 🚧 Ready | User profile updates | Auth working | Next priority |
| **Basic Navigation** | 🚧 Ready | Page routing | Auth working | Next priority |

### 🚧 **Feature Layer (Core Functionality)**
Builds on foundation - requires basic auth to work:

| Test | Status | Purpose | Dependencies |
|------|--------|---------|--------------|
| **Quote Request Creation** | ✅ **AI-Enhanced Complete** | Submit service requests with AI conversations | Auth + Navigation |
| **My Requests Dashboard** | 🚧 Ready | View user's requests | Auth + Quote creation |
| **Request Status Tracking** | 🚧 Ready | Monitor request progress | My Requests working |
| **Real-time Updates** | ✅ **System ready** | Live data sync | Any data display |

### 🚧 **Integration Layer (Cross-System Features)**
Requires multiple features working together:

| Test | Status | Purpose | Dependencies |
|------|--------|---------|--------------|
| **Admin Dashboard** | 🚧 Ready | Admin request management | Auth + Quote creation |
| **Admin ↔ User Workflow** | 🚧 Ready | Complete request lifecycle | Admin + User dashboards |
| **Real-time Admin Updates** | 🚧 Ready | Admin sees new requests | Admin dashboard + Realtime |
| **Communication System** | 🚧 Ready | Notes & messaging | Request details working |

### 🚧 **Advanced Layer (Complex Scenarios)**
End-to-end business processes:

| Test | Status | Purpose | Dependencies |
|------|--------|---------|--------------|
| **Complete Quote Flow** | 🚧 Ready | Request → Quote → Acceptance | All core features |
| **Emergency Requests** | 🚧 Ready | Priority handling | Quote creation + Admin |
| **Multi-user Scenarios** | 🚧 Ready | Concurrent usage | All features stable |
| **Performance & Load** | 🚧 Ready | System scalability | All features working |

## 🎯 **Testing Sequence (Dependency Chain)**

### **Phase 1: Foundation (Start Here)**
```bash
# 1. Basic authentication (currently 7/8 passing)
npx playwright test tests/e2e/specs/auth/authentication.spec.ts

# 2. Profile management (SKIP: User registration requires email confirmation)
npx playwright test tests/e2e/specs/user-journeys/profile-management.spec.ts

# 3. Basic navigation (when implemented)
npx playwright test tests/e2e/specs/user-journeys/navigation.spec.ts
```

### **Phase 2: Core Features (Requires Auth Working)**
```bash
# 4. Quote request creation (basic working)
npx playwright test tests/e2e/specs/user-journeys/basic-quote-request.spec.ts

# 5. My requests dashboard (when implemented)
npx playwright test tests/e2e/specs/user-journeys/dashboard-interactions.spec.ts

# 6. Request details & status (when implemented)
npx playwright test tests/e2e/specs/user-journeys/request-details.spec.ts
```

### **Phase 3: Admin Features (Requires User Features)**
```bash
# 7. Admin dashboard (when implemented)
npx playwright test tests/e2e/specs/admin-journeys/admin-dashboard.spec.ts

# 8. Admin quote management (when implemented)
npx playwright test tests/e2e/specs/admin-journeys/admin-quote-management.spec.ts
```

### **Phase 4: Integration & End-to-End (Requires All Above)**
```bash
# 9. Complete user-admin workflows (when implemented)
npx playwright test tests/e2e/specs/integration/complete-user-admin-journey.spec.ts

# 10. Real-time synchronization (when implemented)
npx playwright test tests/e2e/specs/integration/realtime-sync.spec.ts
```

## 📊 **Current Test Results Summary**

| Category | Tests | Status | Notes |
|----------|-------|--------|-------|
| **Authentication** | 8 tests | ✅ **8/8 PASSING** | ✅ **COMPLETE** |
| **User Features** | 6 tests | 🟢 **2/6 IMPLEMENTED** | Comprehensive quote creation with AI conversations working |
| **Admin Features** | 4 tests | 🔴 **0/4 IMPLEMENTED** | Ready for development |
| **Integration** | 2 tests | 🔴 **0/2 IMPLEMENTED** | Ready for development |
| **Total** | **20 tests** | 🟢 **9/20 IMPLEMENTED** | AI-enhanced quote creation working |

## 🎯 **Next Priority Development**

### **Immediate (Fix Current Issues):**
1. ✅ **Comprehensive Quote Creation** - AI-enhanced testing working for all 8 categories
2. **Fix `getCurrentUser()` test** - Authentication test failing
3. **Implement user registration** - Foundation for all user features

### **Short-term (Build on Working Quote Creation):**
4. **My Requests dashboard** - Core user functionality
5. **Request status tracking** - Essential user feature
6. **Admin dashboard** - Complete the basic workflow

### **Medium-term (Integration):**
6. **Admin ↔ User communication** - Complete business process
7. **Real-time updates** - Enhanced user experience
8. **Complete quote lifecycle** - End-to-end business flow

## Testing Strategy

### Test Data Management
- **Test Users**: Use existing test credentials from `.env`
  - Admin: `TEST_ADMIN_USER_EMAIL` / `TEST_ADMIN_USER_PASSWORD`
  - User: `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`
- **Test Isolation**: Each test should clean up after itself
- **Data Fixtures**: Create reusable test data for consistent testing

### AI-Enhanced Testing Capabilities
The test suite includes advanced AI integration for realistic conversational testing:

#### **🤖 AI-Powered Quote Request Testing**
- **Dynamic Question Answering**: OpenAI generates contextually appropriate responses to AI-generated follow-up questions
- **Conversation Memory**: Maintains full conversation history for coherent responses
- **Realistic Scenarios**: Tests handle 3-5 dynamic AI follow-up questions per quote request
- **Multi-Category Support**: Works across all 8 plumbing service categories

#### **Example AI Interaction:**
```
Agent: "Can you specify the size and layout of the home brewery setup?"
AI Response: "The home brewery setup will be in the garage, requiring a dedicated water line, drainage system, and ventilation for a 5-gallon brewing system."
```

#### **Test Coverage:**
- ✅ **8 Service Categories**: Bathroom, Perimeter Drains, Water Heater, Leak Repair, Fixtures, Main Line, Emergency, Other
- ✅ **AI Conversations**: Dynamic follow-up question handling
- ✅ **API Integration**: Successful quote request submissions
- ✅ **UI Automation**: Complete conversational flow automation

### Page Object Model
Implement page objects for maintainable, readable tests:

```typescript
// tests/e2e/page-objects/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async navigateToRequest(requestId: string) {
    await this.page.click(`[data-testid="request-${requestId}"]`);
  }

  async uploadAttachment(filePath: string) {
    const fileInput = this.page.locator('[data-testid="attachment-upload"]');
    await fileInput.setInputFiles(filePath);
  }
}
```

## 🧪 Testing Roadmap & Dependencies

### **🎯 Testing Sequence (Run in This Order):**

| Phase | Test Suite | Command | Dependencies | What It Tests |
|-------|------------|---------|--------------|---------------|
| **1** | **Authentication** | `npx playwright test specs/auth/` | None | Login/logout, session management |
| **2** | **User Core** | `npx playwright test specs/user-journeys/core-functionality.spec.ts` | Auth | Basic quote request workflow |
| **3** | **User Dashboard** | `npx playwright test specs/user-journeys/dashboard-interactions.spec.ts` | Auth | Dashboard navigation, filtering |
| **4** | **Quote Creation** | `npx playwright test specs/user-journeys/basic-quote-request.spec.ts` | Auth + Core | Different quote types (basic, emergency) |
| **5** | **User Profile** | `npx playwright test specs/user-journeys/profile-management.spec.ts` | Auth | Profile updates, settings |
| **6** | **Admin Auth** | `npx playwright test specs/admin-journeys/admin-dashboard.spec.ts` | Auth | Admin login, permissions |
| **7** | **Admin Quotes** | `npx playwright test specs/admin-journeys/admin-quote-management.spec.ts` | Admin Auth + Quotes | Quote management, status updates |
| **8** | **Realtime Sync** | `npx playwright test specs/integration/realtime-sync.spec.ts` | All above | Cross-user data synchronization |
| **9** | **Full Workflow** | `npx playwright test specs/integration/complete-user-admin-journey.spec.ts` | All above | End-to-end user-admin journey |

### **📋 Complete Test Inventory by Suite:**

#### **🔐 Authentication Tests** (`specs/auth/`)
| File | Command | Tests | Dependencies |
|------|---------|-------|--------------|
| `authentication.spec.ts` | `npx playwright test specs/auth/authentication.spec.ts` | Login/logout, session validation | None |

#### **👤 User Journey Tests** (`specs/user-journeys/`)
| File | Command | Tests | Dependencies |
|------|---------|-------|--------------|
| `core-functionality.spec.ts` | `npx playwright test specs/user-journeys/core-functionality.spec.ts` | Basic quote submission | Auth |
| `dashboard-interactions.spec.ts` | `npx playwright test specs/user-journeys/dashboard-interactions.spec.ts` | Dashboard filtering, navigation | Auth |
| `basic-quote-request.spec.ts` | `npx playwright test specs/user-journeys/basic-quote-request.spec.ts` | Standard plumbing requests | Auth + Core |
| `emergency-leak-scenario.spec.ts` | `npx playwright test specs/user-journeys/emergency-leak-scenario.spec.ts` | Emergency request flow | Auth + Core |
| `customer-quote-creation.spec.ts` | `npx playwright test specs/user-journeys/customer-quote-creation.spec.ts` | Customer-specific quotes | Auth + Core |
| `profile-management.spec.ts` | `npx playwright test specs/user-journeys/profile-management.spec.ts` | Profile updates | Auth |
| `quote-creation.spec.ts` | `npx playwright test specs/user-journeys/quote-creation.spec.ts` | Quote creation variations | Auth + Core |
| `standard-plumbing-workflow.spec.ts` | `npx playwright test specs/user-journeys/standard-plumbing-workflow.spec.ts` | Standard service workflows | Auth + Core |
| `standard-service-request.spec.ts` | `npx playwright test specs/user-journeys/standard-service-request.spec.ts` | Service request variations | Auth + Core |

#### **👑 Admin Journey Tests** (`specs/admin-journeys/`)
| File | Command | Tests | Dependencies |
|------|---------|-------|--------------|
| `admin-dashboard.spec.ts` | `npx playwright test specs/admin-journeys/admin-dashboard.spec.ts` | Admin login, dashboard access | Auth |
| `admin-quote-management.spec.ts` | `npx playwright test specs/admin-journeys/admin-quote-management.spec.ts` | Quote approval, status changes | Admin Auth + User Quotes |

#### **🔗 Integration Tests** (`specs/integration/`)
| File | Command | Tests | Dependencies |
|------|---------|-------|--------------|
| `realtime-sync.spec.ts` | `npx playwright test specs/integration/realtime-sync.spec.ts` | Cross-user realtime updates | All user + admin tests |
| `complete-user-admin-journey.spec.ts` | `npx playwright test specs/integration/complete-user-admin-journey.spec.ts` | Full user-admin workflow | All tests |

### **⚠️ Test Dependencies Explained:**

#### **🔑 Foundation (Required by All):**
- **Authentication**: Every test needs a logged-in user
- **Command**: `npx playwright test specs/auth/`

#### **🏗️ Core User Flow (Required by Most):**
- **Core Functionality**: Basic quote creation
- **Command**: `npx playwright test specs/user-journeys/core-functionality.spec.ts`
- **Why**: Most tests assume basic quote creation works

#### **👥 Multi-User Tests:**
- **Admin Tests**: Require admin login + user data
- **Realtime Tests**: Require both user and admin workflows
- **Integration Tests**: Require complete system functionality

### **🚀 Recommended Testing Workflow:**

#### **Phase 1: Foundation (Start Here)**
```bash
# 1. Verify authentication works
npx playwright test specs/auth/

# 2. Test basic user flow
npx playwright test specs/user-journeys/core-functionality.spec.ts
```

#### **Phase 2: User Features**
```bash
# 3. Test dashboard interactions
npx playwright test specs/user-journeys/dashboard-interactions.spec.ts

# 4. Test quote variations
npx playwright test specs/user-journeys/basic-quote-request.spec.ts
npx playwright test specs/user-journeys/emergency-leak-scenario.spec.ts
```

#### **Phase 3: Admin Features**
```bash
# 5. Test admin authentication
npx playwright test specs/admin-journeys/admin-dashboard.spec.ts

# 6. Test admin quote management
npx playwright test specs/admin-journeys/admin-quote-management.spec.ts
```

#### **Phase 4: Integration**
```bash
# 7. Test realtime synchronization
npx playwright test specs/integration/realtime-sync.spec.ts

# 8. Test complete workflow
npx playwright test specs/integration/complete-user-admin-journey.spec.ts
```

#### **Phase 5: Full Regression**
```bash
# Run everything
npx playwright test
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2) ✅ **COMPLETED**
**Goal**: Basic test infrastructure and core authentication flows

#### 1.1 Setup & Infrastructure
- [ ] Configure test database/cleanup scripts
- [ ] Set up test data fixtures
- [ ] Create base page objects (LoginPage, DashboardPage)
- [ ] Implement test utilities and helpers

#### 1.2 Authentication Tests
```typescript
// tests/e2e/auth.spec.ts
test.describe('Authentication', () => {
  test('user can login and access dashboard', async ({ page }) => {
    // Test login flow
  });

  test('admin can access admin features', async ({ page }) => {
    // Test admin permissions
  });
});
```

#### 1.3 Basic Navigation
- [ ] Landing page accessibility
- [ ] Dashboard loading
- [ ] Modal interactions

### Phase 2: Core User Journeys (Week 3-4)
**Goal**: Automate the most critical user workflows

#### 2.1 Quote Request Lifecycle
```typescript
// tests/e2e/quote-lifecycle.spec.ts
test.describe('Quote Request to Completion', () => {
  test('complete quote request workflow', async ({ page }) => {
    // 1. User creates request with attachment
    // 2. Admin creates quote
    // 3. User accepts quote
    // 4. Admin schedules job
    // 5. Admin completes job
  });
});
```

#### 2.2 Admin Workflow
```typescript
// tests/e2e/admin-workflow.spec.ts
test.describe('Admin Functionality', () => {
  test('admin can upload attachments', async ({ page }) => {
    // Test drag-and-drop uploads
  });

  test('admin can create and modify quotes', async ({ page }) => {
    // Quote creation, updates, change orders
  });
});
```

#### 2.3 Communication Features
```typescript
// tests/e2e/communication.spec.ts
test.describe('Communication', () => {
  test('users and admins can exchange messages', async ({ page }) => {
    // Note creation and visibility
  });
});
```

### Phase 3: Edge Cases & Error Handling (Week 5-6)
**Goal**: Comprehensive coverage including error scenarios

#### 3.1 Error Scenarios
```typescript
// tests/e2e/error-handling.spec.ts
test.describe('Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    // Test offline scenarios
  });

  test('validates form inputs', async ({ page }) => {
    // Required field validation
  });
});
```

#### 3.2 Edge Cases
- [ ] Multiple quotes per request
- [ ] Status transitions
- [ ] Permission boundaries
- [ ] File upload limits

### Phase 4: Performance & Visual (Week 7-8)
**Goal**: Non-functional testing

#### 4.1 Performance Tests
```typescript
// tests/e2e/performance.spec.ts
test.describe('Performance', () => {
  test('dashboard loads within 3 seconds', async ({ page }) => {
    // Performance benchmarks
  });
});
```

#### 4.2 Visual Regression
```typescript
// tests/e2e/visual.spec.ts
test.describe('Visual Regression', () => {
  test('UI matches design specifications', async ({ page }) => {
    // Screenshot comparisons
  });
});
```

### Phase 5: CI/CD Integration (Week 9-10)
**Goal**: Automated testing in deployment pipeline

#### 5.1 CI/CD Setup
- [ ] GitHub Actions workflow
- [ ] Parallel test execution
- [ ] Test result reporting
- [ ] Deployment gates

#### 5.2 Monitoring & Maintenance
- [ ] Test flakiness detection
- [ ] Regular test maintenance
- [ ] Performance monitoring

## Test File Structure

```
tests/e2e/
├── README.md                    # This file
├── specs/                      # Test specifications (organized by domain)
│   ├── auth/                   # Authentication flows
│   │   └── authentication.spec.ts
│   ├── user-journeys/         # End-to-end user workflows
│   │   ├── basic-quote-request.spec.ts
│   │   ├── core-functionality.spec.ts
│   │   ├── customer-quote-creation.spec.ts
│   │   ├── dashboard-interactions.spec.ts
│   │   ├── emergency-leak-scenario.spec.ts
│   │   ├── profile-management.spec.ts
│   │   ├── quote-creation.spec.ts
│   │   ├── standard-plumbing-workflow.spec.ts
│   │   └── standard-service-request.spec.ts
│   ├── admin-journeys/        # Admin-specific workflows
│   │   ├── admin-dashboard.spec.ts
│   │   └── admin-quote-management.spec.ts
│   └── integration/           # Cross-component integration tests
│       ├── complete-user-admin-journey.spec.ts
│       └── realtime-sync.spec.ts
├── page-objects/               # Page Object Model
│   ├── BasePage.ts
│   ├── AuthPage.ts
│   ├── DashboardPage.ts
│   └── ...
├── fixtures/                   # Test data
│   ├── test-data.ts
│   └── test-users.ts
├── helpers/                    # Test utilities
│   ├── auth.ts
│   └── ...
└── utils/                      # Additional utilities
```

## 🚀 Getting Started

### **Quick Start: Run Your First Test**
```bash
# Run your specific sign-in/sign-out test
./test-e2e.sh --test-pattern single-auth

# Run with visible browser to see what's happening
./test-e2e.sh --headed --test-pattern single-auth
```

### **1. Automated Test Runner (Recommended)**
The `test-e2e.sh` script provides intelligent, automated testing:

#### **Smart Features:**
- **Auto-detects running servers** - Only starts app if not already running
- **Preserves development workflow** - Doesn't interrupt your manually started servers
- **Waits for services** - Confirms backend (port 3000) and frontend (port 5173) are ready
- **Selective cleanup** - Only stops servers that the script started
- **Comprehensive reporting** - Generates HTML reports automatically

#### **Basic Usage:**
```bash
# Run all tests (intelligent startup)
./test-e2e.sh

# Run with visible browser
./test-e2e.sh --headed

# Run specific test suites
./test-e2e.sh --test-pattern auth              # Authentication tests
./test-e2e.sh --test-pattern single-auth       # Your specific sign-in test only
./test-e2e.sh --test-pattern user-journeys     # User journey tests
./test-e2e.sh --test-pattern admin-journeys    # Admin journey tests
./test-e2e.sh --test-pattern integration       # Integration tests
./test-e2e.sh --test-pattern core              # Core functionality test
./test-e2e.sh --headed --test-pattern realtime # Realtime tests with browser
```

#### **Advanced Options:**
```bash
# Serial execution (one test at a time)
./test-e2e.sh --serial --test-pattern auth

# Custom worker count
./test-e2e.sh --workers=2 --test-pattern user-journeys

# Custom grep patterns
./test-e2e.sh --test-pattern "should sign in, wait 10 seconds"
```

#### **Development Workflow:**
```bash
# Start app manually once
./startup.sh

# Now run tests repeatedly (much faster!)
./test-e2e.sh --test-pattern single-auth    # ~15 seconds
./test-e2e.sh --test-pattern auth           # ~30 seconds
./test-e2e.sh --test-pattern user-journeys  # ~60 seconds
```

### 2. Manual Test Execution
```bash
# First start the application manually
./startup.sh

# Then run tests
npm run test:e2e

# Run the basic sign in → wait → sign out test (recommended starting point)
npx playwright test specs/auth/authentication.spec.ts --grep "should sign in, wait 10 seconds, then sign out"

# Run all authentication tests
npx playwright test specs/auth/

# Run user journey tests
npx playwright test specs/user-journeys/

# Run integration tests (including realtime)
npx playwright test specs/integration/

# Run tests in debug mode
npx playwright test --debug specs/auth/authentication.spec.ts
```

### 3. Shell Scripts
The project includes automated shell scripts for testing:

#### `test-e2e.sh` - Smart Automated E2E Test Runner
- **Purpose**: Fully automated testing pipeline with intelligent server management
- **Smart Features**:
  - **Auto-detects running servers**: Checks if backend (port 3000) and frontend (port 5173) are already running
  - **Conditional startup**: Only runs `./startup.sh` if servers aren't already running
  - **Preserves development workflow**: Doesn't interrupt already running development servers
  - **Waits for services**: Only waits for startup when actually starting servers
  - **Selective cleanup**: Only stops servers that the script started
  - **Generates test reports**: HTML reports with `npx playwright show-report`
- **Usage**:
  ```bash
  ./test-e2e.sh                    # Run all tests headlessly
  ./test-e2e.sh --headed          # Run with visible browser
  ./test-e2e.sh --test-pattern auth  # Run specific test patterns
  ```

#### `startup.sh` - Application Startup
- **Purpose**: Start frontend and backend services
- **Usage**: `./startup.sh` or `./startup.sh --netlify`

### 4. Generate Test Code
```bash
# Record interactions and generate test code
npx playwright codegen http://localhost:5173
```

### 3. Debug Tests
```bash
# Run tests in debug mode
npx playwright test --debug
```

### 4. View Test Results
```bash
# Open test report
npx playwright show-report
```

## Best Practices

### Test Organization
- **One concept per test**: Each test should verify one specific behavior
- **Descriptive names**: Test names should explain what they're testing
- **Independent tests**: Tests should not depend on each other
- **Fast execution**: Keep tests focused and efficient

### Test Data
- **Realistic data**: Use data that represents actual usage
- **Cleanup**: Always clean up test data
- **Isolation**: Tests should not interfere with each other

### Maintenance
- **Regular updates**: Update tests when UI changes
- **Flaky test monitoring**: Identify and fix unreliable tests
- **Documentation**: Keep tests well-documented

## Success Metrics

### Coverage Goals
- **Critical paths**: 100% coverage of main user journeys
- **Error scenarios**: 90% coverage of error conditions
- **Edge cases**: 75% coverage of edge cases

### Quality Metrics
- **Test execution time**: < 5 minutes for full suite
- **Flaky tests**: < 5% failure rate
- **Maintenance time**: < 2 hours per week

## Integration with Development

### Pre-commit Hooks
- Run critical E2E tests before commits
- Block commits if core functionality is broken

### Pull Request Checks
- Run E2E tests on all PRs
- Require E2E test approval for UI changes

### Deployment Gates
- E2E tests must pass before deployment
- Rollback capability if production tests fail

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Visual Testing](https://playwright.dev/docs/test-screenshots)

## Next Steps

### Immediate (This Week)
1. ✅ **Run existing tests**: Execute `core-functionality.spec.ts` and `realtime-sync.spec.ts`
2. ✅ **Verify test stability**: Ensure tests pass consistently
3. ✅ **Fix any failing tests**: Debug and resolve issues

### Short Term (Next 1-2 Weeks)
1. **Implement page objects**: Create reusable page abstractions for maintainability
2. **Add admin workflow tests**: Automate admin quote creation and management
3. **Add file upload tests**: Test attachment functionality
4. **Add communication tests**: Test note/message exchanges

### Medium Term (Next 1 Month)
1. **Complete Phase 2**: Full quote lifecycle automation
2. **Add error handling tests**: Network failures, validation errors
3. **Implement visual regression**: Screenshot comparisons
4. **Add performance tests**: Load time benchmarks

### Long Term (2+ Months)
1. **CI/CD integration**: Automated testing in deployment pipeline
2. **Test monitoring**: Flakiness detection and reporting
3. **Comprehensive coverage**: 90%+ of user journeys automated

---

**Note**: This roadmap evolves based on project needs and team capacity. Start small and expand gradually for sustainable testing practices.