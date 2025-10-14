# ADR 017: Options Object Pattern for Test Method Parameters

## Status
Accepted

## Context
When implementing the `createQuoteRequest` method in our Playwright Page Object Model, we needed to handle multiple optional parameters:

- `attachmentPath` - File to upload with the quote
- `serviceLocation` - Custom service address with geocoding
- Future parameters (emergency priority, special instructions, etc.)

## Decision
We chose the **Options Object Pattern** over alternative approaches for handling multiple optional parameters.

## Considered Alternatives

### 1. Multiple Optional Parameters
```typescript
async createQuoteRequest(
  categoryKey: string,
  attachmentPath?: string,
  serviceLocation?: LocationData,
  emergency?: boolean,
  // ...more parameters
)
```

**Cons:**
- Parameter list becomes unwieldy
- Hard to remember parameter order
- Breaking changes when adding new options
- Poor IDE support for optional parameters

### 2. Separate Specialized Methods
```typescript
createQuoteRequestBasic(category)
createQuoteRequestWithAttachment(category, attachment)
createQuoteRequestWithLocation(category, location)
createQuoteRequestWithAttachmentAndLocation(category, attachment, location)
// ...exponential growth
```

**Cons:**
- Method explosion
- Code duplication
- Hard to maintain
- Difficult to test combinations

### 3. Builder Pattern
```typescript
new QuoteRequestBuilder()
  .category('perimeter_drains')
  .attachment('file.jpg')
  .location(address)
  .build()
```

**Cons:**
- More complex for simple cases
- Additional abstraction layer
- Overkill for most test scenarios

## Chosen Solution: Options Object Pattern

```typescript
interface QuoteRequestOptions {
  attachmentPath?: string;
  serviceLocation?: {
    address: string;
    city: string;
    postalCode: string;
  };
}

async createQuoteRequest(categoryKey: string, options?: QuoteRequestOptions)
```

## Benefits

### 1. **Clean API**
```typescript
// Simple case
await createQuoteRequest('perimeter_drains');

// With attachment
await createQuoteRequest('perimeter_drains', {
  attachmentPath: 'leak.jpg'
});

// With location
await createQuoteRequest('perimeter_drains', {
  serviceLocation: { address: '123 Main St', city: 'Vancouver' }
});

// With both
await createQuoteRequest('perimeter_drains', {
  attachmentPath: 'leak.jpg',
  serviceLocation: { address: '123 Main St', city: 'Vancouver' }
});
```

### 2. **Type Safety**
- Full TypeScript support
- IDE autocompletion
- Compile-time error checking
- Self-documenting interface

### 3. **Extensibility**
- Easy to add new options without breaking changes
- Backward compatible
- Future-proof API design

### 4. **Testability**
- Easy to test different combinations
- Clear parameter grouping
- Mock-friendly structure

### 5. **Developer Experience**
- Self-documenting method calls
- Consistent with modern JavaScript patterns
- Used by major libraries (Playwright, Jest, etc.)

## Implementation Details

### Interface Definition
```typescript
export interface QuoteRequestOptions {
  /** Path to file to attach */
  attachmentPath?: string;
  /** Service location details */
  serviceLocation?: {
    address: string;
    city: string;
    postalCode: string;
  };
}
```

### Method Implementation
```typescript
async createQuoteRequest(categoryKey: string, options?: QuoteRequestOptions): Promise<string> {
  // Open modal, answer questions...

  // Conditional logic based on options
  if (options?.attachmentPath) {
    await attachmentSection.uploadFile(options.attachmentPath);
  }

  if (options?.serviceLocation) {
    await locationManager.fillAddressForm(options.serviceLocation);
  }

  // Submit and return request ID
}
```

## Consequences

### Positive
- ✅ Clean, maintainable API
- ✅ Type-safe and extensible
- ✅ Easy to test and debug
- ✅ Consistent with industry standards
- ✅ Future-proof design

### Negative
- ❌ Slightly more verbose than simple parameters
- ❌ Requires interface definition
- ❌ Options object can become large if overused

## Mitigation
- Keep options focused on related functionality
- Use clear, descriptive property names
- Provide good TypeScript documentation
- Consider splitting into sub-interfaces if options grow too large

## Related Decisions
- ADR 016: E2E Testing Architecture
- ADR 015: Monorepo Structure

## Date
2025-09-24

## Author
Kilo Code (AI Assistant)
