# Priority Action Plan: PlumbingPOC Refactoring

This plan outlines the highest-impact tasks to transition the PlumbingPOC application from a mature prototype to a robust, production-ready system.

1.  **Establish a Testing Foundation:**
    *   **Action:** Introduce `vitest` to the project for unit and integration testing.
    *   **Task:** Write initial unit tests for critical utility functions (e.g., `getRequestStatusChipColor`).
    *   **Task:** Write initial integration tests for the most critical, unauthenticated API endpoints to establish the testing pattern.
    *   **Justification:** This is the highest priority. No further refactoring should proceed without a safety net to prevent regressions.

2.  **Harden the AI Follow-Up Question Agent:**
    *   **Action:** Refactor the `getGptFollowUp` controller in `vite-app/api/controllers/requestController.js`.
    *   **Task:** Update the OpenAI prompt to request a structured JSON output (`{ "requiresFollowUp": boolean, "questions": [...] }`).
    *   **Task:** Use `response_format: { type: 'json_object' }` in the API call and replace the brittle string-splitting logic with `JSON.parse`.
    *   **Justification:** This fixes the most fragile component in the system and eliminates a likely source of production errors.

3.  **Implement Observability for AI Components:**
    *   **Action:** Add structured logging to the backend controllers that interact with OpenAI.
    *   **Task:** In `triageController.js` and `requestController.js`, log the "Golden Signals": latency (call duration) and cost (token usage from the API response).
    *   **Task:** Wrap `JSON.parse()` in a `try...catch` block and log any parsing failures as critical errors.
    *   **Justification:** Provides essential visibility into the cost and performance of the most expensive parts of the application.

4.  **Integrate Testing into the CI/CD Pipeline:**
    *   **Action:** Update the `netlify.toml` configuration file.
    *   **Task:** Modify the `build` command to `npm run test:ci && tsc --noEmit && npm run build`.
    *   **Task:** Add the `test:ci` script to `package.json` (e.g., `"test:ci": "vitest run"`).
    *   **Justification:** Automates quality control and ensures that no code that fails tests or type-checks can be deployed.

5.  **Formalize All Documentation:**
    *   **Action:** Populate the `adrs/` and `docs/` directories with the generated artifacts from the architectural review.
    *   **Task:** Create the new ADR files (`006`, `007`, `008`).
    *   **Task:** Overwrite `docs/DataContracts.md` with the new, comprehensive version.
    *   **Justification:** Ensures all team members (current and future) have a shared understanding of the system's architecture and data flows, reducing onboarding time and preventing architectural drift.