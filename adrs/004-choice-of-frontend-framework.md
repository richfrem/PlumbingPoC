# ADR-004: Choice of Frontend Framework

**Date:** 2025-09-02

**Status:** Decided & Implemented

## Context

The PlumbingPOC platform requires a modern, interactive, and responsive user interface to serve both customers and administrators. The application must function as a Single Page Application (SPA) to handle complex state management for authentication, modals, real-time data updates, and dynamic forms.

## Decision

We will use **React (with TypeScript)** as the frontend framework, powered by the **Vite** build tool.

## Consequences

*   **Pros:**
    *   **Massive Ecosystem:** React has the largest ecosystem of libraries and tools, which accelerated development. We leveraged this for UI components (`@mui/material`), icons (`lucide-react`), and routing.
    *   **Component-Based Architecture:** This paradigm allows for the creation of reusable and encapsulated UI components, a practice excellently demonstrated by the feature-based structure in `vite-app/src/features/`.
    *   **Strong Talent Pool:** React is the most popular frontend framework, making it easy to find developers and community support.
    *   **Exceptional Developer Experience:** Vite provides near-instant Hot Module Replacement (HMR) and a simplified configuration, which was critical for the rapid prototyping of the "Genesis Cycle".

*   **Cons:**
    *   **State Management Complexity:** React's built-in state management can become complex in large applications. This was mitigated by using a combination of React Context (`AuthContext.tsx`) for global state and custom hooks (`useRequests.ts`) for encapsulating server state and business logic, which is a solid and modern pattern.
    *   **Performance:** Can suffer from unnecessary re-renders if not optimized. The use of `useCallback` in the `useRequests` hook shows an awareness of this and a proactive approach to optimization.

*   **Alternatives Considered:**
    *   **Vue.js:** Another excellent component-based framework. The choice of React was primarily driven by developer familiarity and the breadth of the existing library ecosystem.
    *   **Svelte/SvelteKit:** Offers potentially better performance by compiling away the framework at build time. It was considered a higher risk for a rapid POC due to its smaller ecosystem.
    *   **Angular:** A more opinionated, all-in-one framework. It was deemed too heavyweight and complex for the project's goal of high-speed prototyping.