# Task 0055: Setup GitHub Branches and Deployment Pipeline

**Status:** In Progress
**Priority:** High
**Created:** 2025-10-20
**Assignee:** Richard Fremmerlid

## Current Status: Development Mode Workaround

**Branch Protection Issue:** GitHub Free doesn't enforce branch protection on private repos. Need GitHub Pro ($4/month) for full enforcement.

**Temporary Solution:** Set up pipeline structure without strict enforcement. Add branch protection later when upgrading to Pro.

**Important Context:** Existing Netlify site already deploys from main branch automatically. Will keep as production site and create separate sites for dev/test.

## Overview
Set up a proper Git branching strategy and CI/CD pipeline for the PlumbingPOC project with dev/test/production environments.

## Requirements

### Branch Structure
- `main` - Production branch (protected, only accepts PRs from test)
- `test` - Staging/testing branch (protected, only accepts PRs from dev)
- `dev` - Development branch (accepts direct pushes for rapid development)

### Deployment Pipeline
1. **Dev Environment**: Automatic deployment on every push to `dev` branch
2. **Test Environment**: Deploy via PR from `dev` → `test`
3. **Production Environment**: Deploy via PR from `test` → `main`

### GitHub Actions Workflow
- Automated testing on all branches
- Build verification before deployment
- Environment-specific configurations
- Rollback capabilities

### Environment Setup
- **Dev**: `dev.copilotfortrades.com` (Netlify)
- **Test**: `test.copilotfortrades.com` (Netlify)
- **Prod**: `copilotfortrades.com` (Netlify)

## Acceptance Criteria
- [x] Dev branch created and configured
- [x] Test branch created and configured
- [x] Main branch protection rules updated
- [x] GitHub Actions workflow created for CI/CD
- [ ] Netlify dev site created and configured
- [ ] Netlify test site created and configured
- [ ] Netlify production site created and configured
- [ ] Environment variables configured for all Netlify sites
- [ ] Custom domains set up for dev/test/prod environments
- [ ] Build settings configured for each Netlify site
- [ ] Dev environment deploys automatically
- [ ] Test environment deploys via PR approval
- [ ] Production environment deploys via PR approval
- [ ] All environments have proper domain configuration
- [ ] Rollback procedures documented

## Technical Details

### Branch Protection Rules
**Test Branch:**
- Require PR reviews (1 reviewer)
- Require status checks to pass
- Restrict pushes to maintainers only

**Main Branch:**
- Require PR reviews (2 reviewers)
- Require status checks to pass
- Require branch to be up to date
- Restrict pushes to maintainers only

### Environment Variables
Each environment needs specific configuration:
- Database URLs
- API keys (different for each env)
- Domain configurations
- Feature flags

### Testing Strategy
- Unit tests run on every push
- Integration tests run on dev/test branches
- E2E tests run on test branch before production

## Dependencies
- Netlify accounts configured for multiple sites
- Domain setup for subdomains
- Environment-specific secrets configured in GitHub

## Estimated Effort
- Setup: 4-6 hours
- Testing: 2-3 hours
- Documentation: 1-2 hours
- **Total: 7-11 hours**

## Notes
This is my first time setting up a full CI/CD pipeline, so I'll need detailed guidance on:
- GitHub Actions workflow syntax
- Netlify deployment configuration for multiple environments
- Branch protection rule setup
- Environment variable management across branches

## Related Tasks
- Task 0054: Enhanced Status Lifecycle (dependency)
- Future: Environment-specific database setup
