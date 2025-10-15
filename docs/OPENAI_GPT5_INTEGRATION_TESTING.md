# OpenAI GPT-5 Integration Testing Guide

## 1. Why This Document

This document captures the key learnings from implementing and fixing Vitest unit tests for Quote Agent and Triage Agent, which use the OpenAI GPT-5 Responses API. It also compares how integration testing differs from GPT-4 era patterns, ensuring future developers don't repeat the same pitfalls.

## 2. GPT-5 vs GPT-4 Integration Differences

### GPT-4 / Chat Completions
- Used `chat.completions.create()`
- Responses typically had `choices[0].message.function_call` or `choices[0].message.content`
- Mocking often meant returning a `choices` array

### GPT-5 / Responses API
- Uses `responses.create()`
- Responses structured as an `output[]` array
- `type: "function_call"` with `.arguments` JSON string
- `type: "output_text"` with `.text`
- No `choices` property — breaking older GPT-4 mocks/tests
- Multiple output items possible; agent code must parse accordingly

**Lesson**: Tests must mock `output[]` not `choices[]`.

## 3. Agent-Specific Behavior

### Quote Agent
- **Happy path**: Extracts `qa_pairs` from `function_call`
- **Fallback**: If only `output_text` exists, parses JSON there
- **Malformed JSON**: Does not throw — falls back to "chat" stage with assistant-driven flow
- **Empty qa_pairs**: Returns an empty array cleanly

### Triage Agent
- **Happy path**: Extracts structured triage data from `function_call`
- **Fallback**: Can parse `output_text` JSON, but requires full triage schema
- **Malformed JSON**: Throws error → handler returns 500
- **Empty output**: Treated as failure ("No parsable triage analysis")

## 4. Mocking Strategy for Vitest

### Problems We Faced
- Top-level `vi.mock` locked all tests into one behavior
- GPT-4 mocks didn't match GPT-5 shape (`choices` vs `output`)
- Resetting modules was necessary to reload agent handlers with fresh mocks

### Final Working Pattern

#### Global Variables
```typescript
let mockResponse = { output: [...] }
let shouldReject = false
```

These control what the OpenAI mock returns per test.

#### Mock OpenAI
```typescript
vi.mock("openai", () => ({
  default: class MockOpenAI {
    constructor() {
      this.responses = {
        create: vi.fn().mockImplementation(() =>
          shouldReject
            ? Promise.reject(new Error("API failure"))
            : Promise.resolve(mockResponse)
        )
      };
    }
  }
}));
```

#### Reset Before Each Test
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules(); // critical for clean handler re-imports
  shouldReject = false;
});
```

#### Per-Test Overrides
- Modify `mockResponse` to simulate `function_call`, `output_text`, malformed JSON, or empty outputs
- Set `shouldReject = true` to simulate API errors

## 5. Testing Patterns

### Function Call (happy path)
```typescript
mockResponse = {
  output: [{
    type: "function_call",
    name: "provide_quote_questions",
    arguments: JSON.stringify({
      qa_pairs: [{ question: "What is leaking?", answer: "Toilet" }]
    })
  }]
};
```

### Output Text (fallback)
```typescript
mockResponse = {
  output: [{
    type: "output_text",
    text: JSON.stringify({ triage_summary: "Bathroom renovation", priority_score: 5 })
  }]
};
```

### Malformed JSON
```typescript
mockResponse = {
  output: [{
    type: "output_text",
    text: "{ triage_summary: 'Bad JSON' " // invalid JSON
  }]
};
```

### API Failure
```typescript
shouldReject = true;
```

## 6. Error Handling Expectations

- **Quote Agent**: Returns 200 with "chat" fallback when parsing fails
- **Triage Agent**: Returns 500 with `{ error: ... }` when parsing fails
- **Controller**: Returns 500 if no DB row found or triage agent fails

**Lesson**: Tests must assert the actual observed behavior, not the assumed design.

## 7. Logging Verification

Both agents call:
```typescript
logger.log("[DEBUG] OpenAI raw response: ...")
```

Tests should spy on `logger.log` to verify this.

## 8. Checklist for New Tests

- [ ] Always reset modules and mocks in `beforeEach`
- [ ] Test `function_call` path
- [ ] Test `output_text` fallback path
- [ ] Test malformed JSON path
- [ ] Test API rejection path
- [ ] Test empty outputs
- [ ] Verify logging
- [ ] Verify controller error propagation

## 9. Running Tests

### Prerequisites
- Ensure you're in the project root directory
- All dependencies are installed: `npm install`
- Environment variables are configured for OpenAI API access

### Run All Tests
```bash
npm test
# or
npx vitest run
```

### Run Specific Test File
```bash
npx vitest run tests/unit/ai/openai-integration.test.ts
```

### Run Tests by Pattern (Isolate Test Suites)
```bash
# Run only Quote Agent tests
npx vitest run -t "Quote Agent"

# Run only Triage Agent tests
npx vitest run -t "Triage Agent"

# Run only malformed JSON tests
npx vitest run -t "handles malformed JSON"
```

### Run Individual Test Cases
```bash
# Run specific test by exact name
npx vitest run -t "parses Q/A correctly from GPT-5 function_call"

# Run all tests containing "fallback"
npx vitest run -t "fallback"
```

### Run Tests with Verbose Output
```bash
# Show detailed test execution with logs
npx vitest run --reporter=verbose

# Run specific test with verbose output
npx vitest run --reporter=verbose -t "Quote Agent"
```

### Run Tests in Watch Mode
```bash
# Watch for file changes and re-run tests
npx vitest

# Watch specific test file
npx vitest tests/unit/ai/openai-integration.test.ts
```

### Run Tests with Coverage
```bash
# Generate coverage report
npx vitest run --coverage

# Run specific tests with coverage
npx vitest run --coverage -t "Quote Agent"
```

### Debug Individual Tests
```bash
# Run with debugging enabled (add console.log statements to tests)
npx vitest run --reporter=verbose -t "handles malformed JSON in output_text gracefully"
```

### Common Patterns for Development

#### During Active Development
```bash
# Run tests in watch mode for the file you're working on
npx vitest tests/unit/ai/openai-integration.test.ts
```

#### Before Committing
```bash
# Run all tests to ensure nothing is broken
npm test
```

#### Debugging Failures
```bash
# Run with verbose output to see console logs and error details
npx vitest run --reporter=verbose -t "failing test name"
```

#### Testing Specific Scenarios
```bash
# Test all error handling
npx vitest run -t "malformed|error|API"

# Test all parsing scenarios
npx vitest run -t "parses|fallback"
```

## 10. Key Takeaways

- GPT-5 integration requires different test mocking than GPT-4
- `responses.create().output[]` replaces `chat.completions.create().choices[]`
- Quote vs Triage agents handle errors differently → tests must match behavior, not assumptions
- Global `mockResponse` + `shouldReject` pattern ensures simple, isolated test control
- Always reset modules to avoid stale mocks

✅ With this playbook, future developers can set up GPT-5 agent integration tests correctly on the first attempt.