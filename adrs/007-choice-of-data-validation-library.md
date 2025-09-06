# ADR-007: Choice of Data Validation Library

**Date:** 2025-09-02

**Status:** Decided & Implemented

## Context

To ensure the integrity and security of our backend API, all incoming data from clients must be rigorously validated. This prevents malformed data from reaching our controllers and database, and serves as a hard contract for our API endpoints.

## Decision

We will use **Zod** as the data validation library for our Node.js/Express backend. All schemas will be defined in `vite-app/api/validation/schemas.js` and applied via a reusable middleware.

## Consequences

*   **Pros:**
    *   **TypeScript-First:** Zod is designed with TypeScript in mind. Its ability to infer static TypeScript types directly from validation schemas (`z.infer`) is a powerful feature for maintaining sync between runtime validation and compile-time type safety.
    *   **Simple, Chainable API:** Zod's API is fluent and easy to read, making complex schemas straightforward to define (e.g., `.string().uuid("Invalid ID format.")`).
    *   **Server/Client Portability:** Zod schemas can be used on both the server (for validation) and the client (for form validation), allowing for a single source of truth for data contracts.
    *   **Detailed Error Messages:** When validation fails, Zod provides rich, detailed error objects that can be sent directly to the client for clear feedback, as seen in `validationMiddleware.js`.

*   **Cons:**
    *   None of significant note for this project's scale. It is a modern and highly regarded library.

*   **Alternatives Considered:**
    *   **Joi:** An older, very popular validation library, particularly in the JavaScript ecosystem. Zod was chosen for its superior TypeScript integration.
    *   **Yup:** Often used for client-side form validation (especially with Formik). Zod was chosen for its versatility and strong server-side use case.
    *   **Manual Validation:** Writing custom validation logic in each controller was rejected as it is highly repetitive, error-prone, and difficult to maintain.