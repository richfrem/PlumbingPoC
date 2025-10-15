# AI Unit Tests

## Local-Only Tests

Files ending in `.local.test.ts` contain heavy integration tests (e.g., OpenAI API calls) that are intended for local development verification only. These are excluded from CI/CD builds in `netlify.toml` to prevent deployment failures due to mocking or environment compatibility issues.

**Note:** The OpenAI integration tests (`openai-integration.local.test.ts`) were moved to local-only status to resolve Netlify deployment pipeline issues. These tests verify GPT-5 integration functionality but are excluded from CI builds.

To run these tests locally:
```bash
npx vitest run tests/unit/ai/openai-integration.local.test.ts
```
