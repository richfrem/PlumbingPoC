# ADR-032: Choice of Environment-Controlled Logging System

**Date:** 2025-01-15

**Status:** Decided & Implemented

## Context

The PlumbingPOC application requires comprehensive debugging capabilities during development while maintaining clean production deployments. The initial implementation used scattered `logger.log` statements throughout the codebase, which provided debugging visibility but created challenges for production environments where console output should be minimized or disabled entirely. The authentication system, in particular, needed enhanced logging to debug JWT token corruption issues and session management problems.

## Decision

We will implement a centralized logging utility (`packages/frontend/src/lib/logger.ts`) that provides environment-controlled logging capabilities. All console output will be routed through this utility, which can be toggled via the `VITE_ENABLE_CONSOLE_LOGGING` environment variable. This allows full debugging visibility in development while maintaining clean production deployments.

## Consequences

*   **Pros:**
    *   **Environment Flexibility:** Single environment variable controls all application logging, enabling different logging levels for development vs production
    *   **Centralized Control:** All logging goes through a single utility, making it easy to modify logging behavior globally
    *   **Debugging Effectiveness:** Enhanced authentication logging helped resolve JWT token corruption issues and session management problems
    *   **Production Cleanliness:** Console output can be completely disabled in production environments
    *   **Maintainability:** Consistent logging interface across the entire frontend codebase

*   **Cons:**
    *   **Migration Effort:** Requires systematic replacement of all existing `logger.log` statements throughout the codebase
    *   **Performance Impact:** Even when disabled, logger method calls still execute (though console output is suppressed)
    *   **Environment Dependency:** Logging behavior now depends on environment variable configuration

*   **Alternatives Considered:**
    *   **Conditional logger.log:** Wrapping individual `logger.log` calls with environment checks - rejected due to code duplication and maintenance overhead
    *   **Third-party Logging Libraries:** Libraries like Winston or Pino - rejected due to added complexity and dependencies for a frontend application
    *   **Build-time Logging Removal:** Using build tools to strip logging in production - rejected due to need for runtime logging control and debugging capabilities