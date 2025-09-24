# E2E Testing Next Steps

## Current Status

✅ **Completed:**
- Basic quote request creation (perimeter drains)
- Quote request with file attachment
- Clean options object API for extensibility
- Reusable component architecture (AttachmentSection, ServiceLocationManager)
- Communication guidelines established

## Where We Left Off

The `createQuoteRequest` method now supports an options object with:
- `attachmentPath?: string` - File to upload
- `serviceLocation?: { address: string; city: string; postalCode: string }` - Service location with automatic geocoding

Current test: `perimeter-drain-quote-with-attachment.spec.ts` (attachment only)

## Next Steps

### 1. **Immediate Next Test: Combined Features**
Create a new E2E test that exercises **both attachment AND service location**:

```typescript
// File: tests/e2e/specs/user-journeys/perimeter-drain-quote-with-attachment-and-location.spec.ts
test('should create perimeter drain quote with attachment and custom service location', async ({ page }) => {
  // Sign in
  await authPage.signInAsUserType('user');

  // Create quote with both options
  const requestId = await quoteRequestPage.createQuoteRequest('perimeter_drains', {
    attachmentPath: 'tests/e2e/fixtures/example-images/crawl-space-leak.jpg',
    serviceLocation: {
      address: '123 Main Street',
      city: 'Vancouver',
      postalCode: 'V6B 1A1'
    }
  });

  // Verify request created
  expect(requestId).toBeDefined();
  expect(typeof requestId).toBe('string');

  // Sign out
  await authPage.signOut();
});
```

### 2. **Service Location Component Implementation**
Complete the `ServiceLocationManager` component methods:
- `fillAddressForm()` - Fill address fields
- `verifyAddressGeocoding()` - Verify geocoding works
- `toggleAddressMode()` - Switch between profile/custom address

### 3. **Attachment Verification Fix**
Fix the `AttachmentSection.verifyAttachmentExists()` method to properly detect uploaded files in the UI.

### 4. **Additional Test Scenarios**
- Quote with service location only (no attachment)
- Different service categories with attachments
- Error handling (invalid addresses, failed geocoding)
- Profile address vs custom address scenarios

### 5. **Integration Testing**
- Test the full user journey from landing page to quote creation
- Verify data persistence in the backend
- Test email notifications and follow-ups

## Implementation Notes

- The `QuoteRequestOptions` interface is already defined and extensible
- `ServiceLocationManager` component is scaffolded but needs method implementations
- Geocoding verification should happen automatically when location is provided
- All new tests should follow the same pattern as existing tests

## Development Guidelines

### Debug Screenshots
- Debug screenshots are automatically saved to `tests/e2e/debug/` folder
- This folder is gitignored to prevent committing temporary debug files
- Clean up debug images after test development is complete
- Consider using Playwright's built-in screenshot capabilities for test failures

### File Organization
- Keep test fixtures in `tests/e2e/fixtures/`
- Debug artifacts go in `tests/e2e/debug/` (gitignored)
- Test results go in `test-results/` (gitignored)
- Playwright reports go in `playwright-report/` (gitignored)

## Priority Order
1. **High:** Combined attachment + location test
2. **Medium:** Complete ServiceLocationManager implementation
3. **Medium:** Fix attachment verification
4. **Low:** Additional edge case tests

---

*Last updated: 2025-09-24*
*Status: Ready for next phase of E2E testing*