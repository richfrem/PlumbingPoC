# Plumbing Quote Agent Project Tracker

This file tracks all major requirements, tasks, and progress for the Plumbing Quote Agent project. Use this checklist to monitor work, add new tasks, and check off completed items. Agents and team members should update this file regularly.

## Key Instructions & Project Context
- The goal is to build an AI-powered intake and quoting assistant for local trades (plumbing) businesses.
- Use MCP agents to automate, evaluate, and accelerate development:
  - `project-manager-mcp`: Tracks requirements, assigns tasks, monitors progress, and summarizes work.
  - `ui-designer-mcp`: Evaluates UI/UX and suggests improvements.
  - `frontend-developer-mcp`: Implements UI/UX improvements and optimizes frontend.
  - `backend-architect-mcp`: Reviews backend, APIs, and database models.
- Start with the project manager agent to organize and track all work.
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
- [x] Pull profile info into quote requests

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
- [ ] Evaluate UI/UX at http://localhost:5173/ (agent-driven)
- [ ] Implement prioritized improvements
- [x] Modular frontend structure with forms, modals, dashboard
- [x] File upload for quote attachments
- [ ] Optimize for performance, accessibility, and responsiveness

### Backend & API
- [x] MVC pattern with controllers, routes, middleware, validation
- [x] Supabase integration for data storage and authentication
- [x] API endpoints for requests, profiles, notes, attachments
- [ ] Review backend for scalability, security, and maintainability (agent-driven)

### Iteration & Progress Tracking
- [x] Checklist created and updated for baseline
- [ ] Regularly update this checklist and agent assignments
- [ ] Add new tasks as needed
- [x] Check off completed items
## Baseline Notes (for GitHub Copilot)


## Progress Summary (August 28, 2025)

**Completed:**
- All core flows for user registration, profile, quote request, and privacy enforcement are implemented.
- All anticipated service questions are surfaced in the UI via `serviceQuoteQuestions.ts` and dynamic modal logic.
- Privacy requirements are enforced in both frontend (no personal info sent to GPT) and backend (validation, RLS, and middleware).
- Summary and confirmation flows are present and tested.
- Modular frontend and backend structure is in place.

**Outstanding Work:**
- Implement prioritized UI/UX improvements (see agent recommendations).
- Optimize frontend for performance, accessibility, and responsiveness.
- Review backend for scalability, security, and maintainability.
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
