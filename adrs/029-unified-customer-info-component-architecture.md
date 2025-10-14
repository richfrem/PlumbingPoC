# ADR 029: Unified Customer Info Component Architecture

## Status
Accepted

## Date
2025-10-12

## Context
We had two separate components handling customer information display:
1. **CustomerInfoSection** - Displayed customer name, phone, email, and optionally service address (read-only)
2. **ServiceLocationManager** - Handled service address with create/view/edit modes, including geocoding and Google Maps integration

This led to:
- **Code duplication**: Similar UI patterns repeated across components
- **Inconsistent UX**: Different components had different capabilities (one editable, one not)
- **Maintenance burden**: Changes to customer info display required updates in multiple places
- **Confusing architecture**: Unclear which component to use in which context

Four different modals needed customer information display:
1. **QuoteAgentModal** - Create new requests (address entry)
2. **QuoteFormModal** - View/edit quotes (customer info + address, admin can edit address)
3. **RequestDetailModal** - View job details (customer name separate, address editable)
4. **InvoiceFormModal** - Create/edit invoices (customer info + address, read-only)

## Decision
We will **merge CustomerInfoSection and ServiceLocationManager into a single unified component** that handles both customer information display and service location management with optional sections controlled by props.

**Final Component Name: CustomerInfoSection** (reusing the original name for the unified component)

### Component Design: CustomerInfoSection (Unified)

**Props:**
- `mode`: 'create' | 'view' | 'edit' - Controls editing capability
- `showCustomerInfo`: boolean - When true, displays customer name/phone/email in addition to service address
- `request`: QuoteRequest - Provides customer data when showCustomerInfo=true
- `isAdmin`: boolean - Controls edit permissions
- `onSave`: callback - Handles address updates
- Other existing props: initialAddress, latitude, longitude, etc.

**Rendering Modes:**

1. **Unified View (showCustomerInfo=true)**
   - Renders as single Paper component with "CUSTOMER INFO" header
   - Displays customer name, phone (tel: link), email (mailto: link)
   - Shows service address with Google Maps link
   - Edit pencil icon (admins only) for address editing
   - Used by: QuoteFormModal, InvoiceFormModal

2. **Address-Only View (showCustomerInfo=false/undefined)**
   - Renders as Grid item (backward compatible)
   - Shows only service address with edit capability
   - Used by: RequestDetailModal (customer name shown separately)

3. **Create Mode**
   - Address entry form with Street/City/Province/Postal Code fields
   - Google Maps autocomplete integration
   - Geocoding validation
   - Used by: QuoteAgentModal

4. **Edit Mode**
   - Inline editing triggered by pencil icon
   - Pre-populates current address (parses "Street, City, Province PostalCode")
   - Save/Cancel buttons
   - Used by: All admin contexts

### Migration Plan

**Phase 1: Core Unification (Completed)**
- ✅ Enhanced ServiceLocationManager with showCustomerInfo prop
- ✅ Added customer info rendering (name, phone, email) when showCustomerInfo=true
- ✅ Migrated QuoteFormModal to use unified component

**Phase 2: Complete Migration (Completed)**
- ✅ Migrated InvoiceFormModal from old CustomerInfoSection to unified component
- ✅ Migrated RequestDetailModal to use unified display
- ✅ Verified all four modals use unified component consistently
- ✅ Deprecated and removed old CustomerInfoSection component

**Phase 3: Refinement (Completed)**
- ✅ Renamed ServiceLocationManager to CustomerInfoSection (reusing original name)
- ✅ Updated all imports across 5 component files
- ✅ Updated documentation and ADR

### Usage Examples

```typescript
// QuoteFormModal - Unified customer info + address
<CustomerInfoSection
  mode="view"
  showCustomerInfo={true}
  request={request}
  isAdmin={isAdmin}
  onSave={handleAddressUpdate}
/>

// RequestDetailModal - NOW USING UNIFIED COMPONENT
<CustomerInfoSection
  mode="view"
  showCustomerInfo={true}
  request={request}
  initialAddress={request.service_address}
  isAdmin={isAdmin}
  onSave={handleAddressUpdate}
  isUpdating={updateAddressMutation.isPending}
/>

// QuoteAgentModal - Create new request
<CustomerInfoSection
  mode="create"
  onSave={handleAddressSet}
/>

// InvoiceFormModal - Migrated to unified component
<CustomerInfoSection
  mode="view"
  showCustomerInfo={true}
  request={request}
  initialAddress={request.service_address}
  isAdmin={false}
  onSave={async () => {}}
  onModeChange={() => {}}
/>
```

## Consequences

### Positive
- **Single source of truth**: One component for all customer info + location needs
- **DRY principle**: No code duplication between components
- **Consistent UX**: Same display and editing behavior across all forms
- **Easier maintenance**: Changes in one place affect all uses
- **Flexible architecture**: Optional sections via props enable different contexts
- **Backward compatible**: Grid mode preserved for RequestDetailModal
- **Better testing**: One component to test thoroughly instead of two

### Negative
- **Component complexity**: Single component has more responsibilities
- **Migration effort**: Need to update InvoiceFormModal and test all contexts
- **Prop proliferation**: More optional props to control behavior
- **Breaking change**: Requires updates to all consuming components (mitigated by migration plan)

### Neutral
- **Component size**: Larger single component vs multiple smaller ones (acceptable tradeoff)
- **Naming**: May want to rename to reflect unified purpose (optional)

## Implementation Details

### Address Parsing
Component handles format: `"Street, City, Province PostalCode"`
- Splits on commas: ["Street", "City", "Province PostalCode"]
- Province: 3rd word from end (before postal code)
- Postal Code: Last 2 words
- Pre-populates all fields when entering edit mode

### Feature Flags
- `showCustomerInfo`: Enables customer name/phone/email display
- `isAdmin`: Controls edit pencil visibility
- `mode`: Controls create/view/edit rendering

### Dependencies
- Material-UI: Paper, Grid, Typography components
- Google Maps API: Geocoding and address autocomplete
- lucide-react: User and Pencil icons
- apiClient: Axios instance for API calls

## Related ADRs
- [ADR-015: Choice of Monorepo Structure](015-choice-of-monorepo-structure.md) - Shared component architecture
- [ADR-006: Choice of UI Component Library](006-choice-of-ui-component-library.md) - Material-UI usage

## Notes
- Address editing requires admin role (controlled by isAdmin prop)
- Geocoding validation ensures address accuracy
- Province field added to match create mode functionality
- Component serves both customer info display AND service location management
- **Component renamed from ServiceLocationManager to CustomerInfoSection** to better reflect unified purpose
- Final name reuses the original CustomerInfoSection name, making the evolution feel intentional

## References
- CustomerInfoSection: `/packages/frontend/src/features/requests/components/CustomerInfoSection.tsx`
- QuoteFormModal: `/packages/frontend/src/features/requests/components/QuoteFormModal.tsx`
- InvoiceFormModal: `/packages/frontend/src/features/requests/components/InvoiceFormModal.tsx`
- RequestDetailModal: `/packages/frontend/src/features/requests/components/RequestDetailModal.tsx`
- QuoteAgentModal: `/packages/frontend/src/features/requests/components/QuoteAgentModal.tsx`
