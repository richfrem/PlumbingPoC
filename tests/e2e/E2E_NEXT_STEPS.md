# E2E Testing Next Steps

## Current Status

✅ **Completed:**
- Basic quote request creation (perimeter drains)
- Quote request with file attachment
- Clean options object API for extensibility
- Reusable component architecture (AttachmentSection, ServiceLocationManager)
- Communication guidelines established
- Comprehensive test spec with 4 scenarios (perimeter-drain-quote-comprehensive.spec.ts)

⚠️ **Known Issues:**
- Service location tests timeout at final submission step
- ServiceLocationManager component methods are called but submit button may not work after location changes
- Attachment verification selector needs fixing

## Where We Left Off

The `createQuoteRequest` method now supports an options object with:
- `attachmentPath?: string` - File to upload
- `serviceLocation?: { address: string; city: string; postalCode: string }` - Service location with automatic geocoding

Current test: `perimeter-drain-quote-with-attachment.spec.ts` (attachment only)

## Next Steps

### 1. **High Priority: Fix Service Location Submission Issue**
**Problem:** Tests with service location timeout at final submission step
**Root Cause:** Submit button/API call not working after location form changes
**Solution:** Debug why `confirmAndSubmitRequest()` fails when location is modified

### 2. **Medium Priority: Complete ServiceLocationManager Implementation**
The component skeleton exists but methods need proper implementation:
- `fillAddressForm()` - Fill address fields with proper selectors
- `verifyAddressGeocoding()` - Verify geocoding API responses
- `toggleAddressMode()` - Switch between profile/custom address modes

### 3. **Medium Priority: Fix Attachment Verification**
`AttachmentSection.verifyAttachmentExists()` selector doesn't find uploaded files in UI

### 4. **Low Priority: Additional Test Scenarios**
Once core functionality works:
- Different service categories with various option combinations
- Error handling (invalid addresses, failed geocoding)
- Profile address vs custom address scenarios
- Edge cases and validation testing

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