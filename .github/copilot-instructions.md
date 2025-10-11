## PlumbingPOC - AI-Powered Client Management Platform

**Project Type:** Fullstack SaaS Application
**Tech Stack:** React/TypeScript + Node.js/Express + Supabase + OpenAI
**Architecture:** Monorepo with separate frontend/backend packages

## CRITICAL COMMUNICATION RULES

**ALWAYS confirm user intent before making code changes.** Never implement solutions without explicit approval. Ask clarifying questions and wait for confirmation before proceeding with any code modifications.

**ALWAYS follow documented architectural decisions in the `adrs/` folder.** If no ADR exists for a decision, ask the user for guidance before proceeding. Create a new ADR if a new architectural decision is made.

**WHY:** Prevents frustration and ensures collaborative development. Users need time to review, ask questions, and provide feedback on proposed changes.

**HOW TO:**
1. **Ask clarifying questions** to understand requirements fully
2. **Confirm assumptions** about implementation details
3. Present your understanding of the request
4. Ask for confirmation: "Does this match what you want?"
5. Wait for explicit approval before implementing
6. If unsure, ask: "Should I proceed with this approach?"

## DEVELOPMENT WORKFLOW

### Before Starting Work:
- Check existing ADRs in `adrs/` folder for relevant decisions
- Review `TASKS.md` for current project status
- Understand the monorepo structure (`packages/frontend/`, `packages/backend/`)

### Code Quality Standards:
- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Write comprehensive tests for new features
- Update documentation for architectural changes

### Testing Requirements:
- E2E tests in `tests/e2e/` using Playwright
- Unit tests using Vitest
- All tests must pass before merging

### Deployment Process:
- Follow `docs/NETLIFY_DEPLOYMENT.md` for frontend deployment
- Backend deploys via Netlify Functions
- Database changes require Supabase migrations

## ARCHITECTURAL CONSTRAINTS

- **Frontend:** React with TypeScript, Vite build system
- **Backend:** Node.js/Express with ESM modules (ADR-014)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + MUI components
- **State Management:** TanStack Query for server state
- **Authentication:** Supabase Auth with custom contexts

## COMMUNICATION PREFERENCES

- Keep responses concise and technical
- Use markdown formatting for code and file references
- Reference specific files with clickable links: [`filename.ext`](relative/path.ext:line)
- Ask for clarification when requirements are ambiguous
- Confirm understanding before implementing complex changes
