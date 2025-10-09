# Plumbing Quote Agent Project Tracker

This file tracks all major requirements, tasks, and progress for the Plumbing Quote Agent project. Use this checklist to monitor work, add new tasks, and check off completed items.

## Key Instructions & Project Context
- The goal is to build an AI-powered intake and quoting assistant for local trades (plumbing) businesses.
- **Updated Approach**: Using MCP agents primarily for E2E testing automation
- Direct development workflow for core features and improvements
- MCP agents for test automation and quality assurance
- Update this checklist as tasks are completed or new ones are added.
- Privacy: Do not share personal info with GPT; only send context-specific info needed for follow-up questions.
- Minimize unnecessary GPT-4 API calls to reduce costs.

## Task Checklist

### User Registration & Profile
**User Registration & Profile (All Flows Working):**
- [x] Sign-in working
- [x] Sign-out working
- [x] Register new user with Google working
- [x] Register new user with Microsoft working
- [x] Create new profile with email/password working
- [x] Create new profile working
- [x] Update existing profile working
- [x] Ensure user profile includes contact info
- [x] Pull profile info into quote requests (Admins can now see all user profiles)

### Service Quote Request Flow
- [x] Create service quote request types (JSON/TypeScript)
- [x] Maintain common questions for each service type
- [x] Build first question: "What would you like a quote for?" (service type selection)
- [x] Ask questions one at a time in chat-style conversation
- [x] Use text box for user answers
- [x] Do not ask for info already known from profile
- [ ] Review UI to confirm all anticipated questions are surfaced for each service type

### Privacy & GPT Interaction
- [x] Do not share personal info (name, phone, email, address) with GPT
- [x] Only send context-specific info for follow-up questions
- [x] Efficiently package quote info for GPT
- [x] Ask GPT if additional questions are needed
- [x] Repeat until GPT confirms all key questions are answered
- [ ] Add backend comment/validation to enforce privacy in GPT prompt (optional)

### Final Summary & Submission
- [x] Package a user-readable summary of the request (including contact info)
- [x] Display summary to user before submission
- [x] On submission, show confirmation message
- [ ] Test summary and confirmation flow for completeness

### UI/UX & Frontend
- [ ] Update the frontend to use the deployed backend URL (http://your-local-frontend-url or https://plumbingpoc.netlify.app/)
- [ ] Implement prioritized improvements
- [x] Modular frontend structure with forms, modals, dashboard
- [x] File upload for quote attachments
- [x] Display quote status as colored chip in quote list (RequestDetailModal)
- [x] Display quote status as colored chip in QuoteFormModal header
- [x] Ensure status chip colors are consistent across all components
- [ ] Create a Kanban board view for the dashboard
- [ ] Optimize for performance, accessibility, and responsiveness

### Backend & API
- [x] MVC pattern with controllers, routes, middleware, validation
- [x] Supabase integration for data storage and authentication
- [x] API endpoints for requests, profiles, notes, attachments
- [x] Filter dashboard requests by user_id for regular users
- [x] Add 'Accepted' status to request workflow
- [x] Implement 'Accept Quote' functionality (marks specific quote as accepted, others as rejected, updates request status)
- [x] Make quotes read-only after request status is 'Accepted', 'Scheduled', or 'Completed'
- [x] Implement email notifications for request submission
- [x] Implement email notifications for status updates
- [x] Implement email notifications for quote additions
- [x] Implement email notifications for new notes in communication log
- [x] Add RESEND_ENABLED feature flag for email sending
- [x] Include link to request in notification emails
- [x] **NEW:** Implement SMS notifications for new quote requests (Twilio + Netlify Functions)
- [x] **NEW:** Implement SMS notifications for quote acceptances (Twilio + Netlify Functions)
- [x] **NEW:** Create secure Netlify Function for SMS delivery (`send-sms.js`)
- [x] **NEW:** Create SMS orchestration service (`packages/backend/api/services/sms/twilio/client.js`) with admin phone number retrieval
- [x] **NEW:** Integrate SMS notifications into request controller for real-time alerts
- [x] Correct RLS policies for `user_profiles` to allow admin access
- [x] **NEW:** Geocoding data persistence (latitude, longitude, geocoded_address in requests table)
- [x] **NEW:** Google Maps JavaScript API integration for map visualization
- [x] **NEW:** Address geocoding during quote submission with Google Geocoding API
- [ ] Implement automated follow-up emails for quoted requests
- [x] Add AI-powered triage summary and priority score to requests
- [x] Implement structured JSON output for AI responses
- [x] Add error handling for AI API failures
- [ ] Review backend for scalability, security, and maintainability (agent-driven)
- [ ] Configure Resend domain verification (manual step for user)

### Deployment
- [x] Setup hosting for the POC on Netlify
- [ ] Create a Netlify Scheduled Function for automated follow-ups
- [ ] Move the follow-up email logic from the Express controller to the new Netlify function
- [ ] Remove the old /api/follow-up route and controller
- [x] Publish the POC to Netlify

### Testing Infrastructure & Quality Assurance
- [x] Setup Vitest for unit and integration testing
- [x] Configure Playwright for E2E testing
- [x] Create test directory structure (unit/, integration/, e2e/)
- [x] Implement unit tests for utility functions (statusColors, serviceQuoteQuestions)
- [x] Implement integration tests for API endpoints
- [x] Implement E2E tests for critical user journeys
- [x] Add AI component testing (OpenAI mocking)
- [ ] Configure test coverage reporting
- [ ] Integrate testing into CI/CD pipeline
- [ ] Add performance testing for AI components
- [ ] Implement visual regression testing

### Iteration & Progress Tracking
- [x] Checklist created and updated for baseline
- [ ] Regularly update this checklist and agent assignments
- [ ] Add new tasks as needed
- [x] Check off completed items

## Baseline Notes (for GitHub Copilot)


## Progress Summary (August 29, 2025)

**Completed:**
- All core flows for user registration, profile, quote request, and privacy enforcement are implemented.
- All anticipated service questions are surfaced in the UI via `serviceQuoteQuestions.ts` and dynamic modal logic.
- Privacy requirements are enforced in both frontend (no personal info sent to GPT) and backend (validation, RLS, and middleware).
- Summary and confirmation flows are present and tested.
- Modular frontend and backend structure is in place.
- **New:** Comprehensive attachment management, including display, upload, and a reusable component.
- **New:** Robust status management for requests and quotes, including an "Accepted" status, automatic status updates, and quote locking.
- **New:** Full email notification system for key events (request submission, status changes, quote additions, new notes) with a feature flag and direct links.
- **New:** Dashboard now correctly filters requests for regular users.
- **New:** Corrected RLS policies to ensure admins can view all user profiles, resolving a critical data access issue.
- **NEW:** Interactive Map View for job location visualization and dispatch optimization with Google Maps integration.
- **NEW:** Address geocoding during quote submission with Google Geocoding API and data persistence.
- **NEW:** Status-based map markers with clustering, info windows, and Table/Map toggle in admin dashboard.
- **NEW:** Real-time SMS notifications for administrators on new quote requests and quote acceptances using Twilio + Netlify Functions.
- **NEW:** Secure serverless SMS delivery architecture with isolated credentials and non-blocking API calls.

**Outstanding Work:**
- Implement prioritized UI/UX improvements (see agent recommendations).
- Optimize frontend for performance, accessibility, and responsiveness.
- Review backend for scalability, security, and maintainability.
- Configure Resend domain verification (manual step for user).
- Implement automated follow-up emails.
- Implement AI-powered triage and priority scoring.
- Create a Kanban board view for the dashboard.
- Setup hosting for the POC on Netlify.
- Create a Netlify Scheduled Function for automated follow-ups.
- Move the follow-up email logic from the Express controller to the new Netlify function.
- Remove the old /api/follow-up route and controller.
- Publish the POC to Netlify.
- Add new tasks as requirements evolve.

**Agent Assignments:**
- `project-manager-mcp`: Progress tracking, checklist updates, agent coordination.
- `ui-designer-mcp`: UI/UX evaluation and improvement recommendations.
- `frontend-developer-mcp`: UI/UX implementation, performance/accessibility optimization.
- `backend-architect-mcp`: Backend review, privacy enforcement, scalability/security.

**Recommended Next Steps:**
1. Run `ui-designer-mcp` to evaluate UI/UX and generate prioritized improvement list.
2. Assign improvements to `frontend-developer-mcp` for implementation.
3. Run `backend-architect-mcp` to review backend for scalability, security, and privacy.
4. Continue regular updates to this checklist and agent assignments.

---

## How to Use This File
- Reference this file at the start of each session.
- Add new tasks as requirements evolve.
- Check off items as they are completed.
- Use agent prompts and CLI commands as documented in `agents/README.md`.