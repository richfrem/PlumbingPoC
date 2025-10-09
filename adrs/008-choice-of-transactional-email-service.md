# ADR-008: Choice of Transactional Email Service

**Date:** 2025-09-02

**Status:** Decided & Implemented

## Context

The application needs to send transactional emails to users for critical events, such as confirming a quote request submission, notifying of a status update, and sending new quotes. A reliable third-party service is required to ensure high deliverability.

## Decision

We will use **Resend** as our transactional email service provider, integrated via its official `resend` npm package in `packages/backend/api/email/resend/index.js`.

## Consequences

*   **Pros:**
    *   **Developer-Focused API:** Resend offers a clean, modern, and simple API, which makes sending emails from our Node.js backend straightforward.
    *   **React Email Integration:** While not currently used, Resend's strong integration with the React Email library provides a powerful future path for creating beautiful, component-based email templates.
    *   **Simple Setup:** The setup is minimal, requiring only an API key and a verified domain, which aligns with our goal of rapid development.

*   **Cons:**
    *   **Third-Party Dependency:** This adds another external service to our stack, with its own potential points of failure and cost model.
    *   **Deliverability Management:** As with any email service, we are responsible for maintaining a good sender reputation to avoid being marked as spam.

*   **Alternatives Considered:**
    *   **SendGrid / Mailgun:** These are larger, more established players in the space. Resend was chosen for its modern API and strong focus on the developer experience.
    *   **AWS Simple Email Service (SES):** A very powerful and cost-effective solution. It was rejected for this project due to its significantly more complex setup and configuration process, which would have slowed down development.