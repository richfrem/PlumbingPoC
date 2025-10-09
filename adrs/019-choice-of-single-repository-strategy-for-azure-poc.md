# ADR-019: Choice of Single Repository Strategy for Azure POC

**Date:** 2025-10-09

**Status:** Accepted

## Context

The PlumbingPOC project requires an Azure migration proof-of-concept (POC) to validate the technical feasibility and cost benefits of moving from the current Netlify/Supabase architecture to Azure cloud services. The codebase consists of approximately 80-90% shared code (React components, business logic, API controllers, tests) with only 10-20% being platform-specific (database connections, authentication, real-time services).

Initial planning considered a separate repository approach for the Azure POC, but this would create synchronization challenges for the large shared codebase. The single repository strategy offers better code management while maintaining clear separation between environments.

## Decision

We will use a **single repository with environment-specific configurations** for the Azure POC. This approach includes:

1. **Single Git Repository**: Maintain all code in the existing `PlumbingPOC` repository
2. **Branch-Based Development**: Use `azure-poc` branch for Azure-specific development
3. **Environment-Specific Configurations**: Separate config files for Netlify vs Azure deployments
4. **Build Script Separation**: Different build and deployment scripts for each platform
5. **Shared Code Synchronization**: Automatic sync of 80-90% shared codebase

## Implementation Details

### Repository Structure

```
PlumbingPOC/ (single repository)
├── packages/
│   ├── frontend/
│   │   ├── src/           # Shared React components (80-90%)
│   │   ├── config/        # Environment-specific configs
│   │   │   ├── netlify/   # Netlify build configs
│   │   │   └── azure/     # Azure build configs
│   │   └── build-scripts/ # Platform-specific build scripts
│   └── backend/
│       ├── api/           # Shared API logic (80-90%)
│       ├── config/        # Environment-specific configs
│       │   ├── supabase/  # Supabase database/auth configs
│       │   └── azure/     # Azure database/auth configs
│       └── deploy/        # Platform deployment scripts
├── environments/
│   ├── netlify.env         # Netlify environment variables
│   └── azure.env           # Azure environment variables
├── .github/workflows/
│   ├── netlify-deploy.yml  # Netlify CI/CD
│   └── azure-deploy.yml    # Azure CI/CD
└── scripts/
    ├── build-netlify.sh    # Netlify build script
    └── build-azure.sh      # Azure build script
```

### Branch Strategy

- **`main`**: Production Netlify/Supabase deployment
- **`azure-poc`**: Azure migration development and testing
- **Feature branches**: Created from appropriate base branch

### Configuration Management

**Environment-Specific Files:**
- Database connection strings
- Authentication service configurations
- Real-time service endpoints
- Build and deployment configurations
- Environment variables

**Shared Files (80-90%):**
- React components and hooks
- Business logic and API controllers
- Test suites and documentation
- Utility functions and helpers

### Build Process

**Netlify Build:**
```bash
# Copy Netlify-specific configs
cp packages/frontend/config/netlify/vite.config.js packages/frontend/
cp packages/backend/config/supabase/database.js packages/backend/api/config/

# Build for Netlify
npm run build:netlify
```

**Azure Build:**
```bash
# Copy Azure-specific configs
cp packages/frontend/config/azure/vite.config.js packages/frontend/
cp packages/backend/config/azure/database.js packages/backend/api/config/

# Build for Azure
npm run build:azure
```

## Consequences

### Positive

*   **Code Synchronization**: Eliminates sync issues for 80-90% shared codebase
*   **Simplified Development**: Single repository reduces management overhead
*   **Unified Testing**: Test both environments from same codebase
*   **Shared Git History**: Easy to track changes across environments
*   **Easier Collaboration**: No confusion about which repository to use
*   **Unified Documentation**: Single source for all environment docs

### Negative

*   **Build Complexity**: Requires different build scripts for each platform
*   **Configuration Management**: Need to maintain environment-specific files
*   **Git History Clarity**: Mixed commits may be harder to categorize
*   **Risk Management**: Azure changes could potentially affect production branch
*   **Testing Complexity**: Must ensure proper environment isolation

### Mitigation Strategies

**Build Complexity:**
- Clear naming conventions for build scripts
- Documentation for each environment's build process
- Automated build validation

**Configuration Management:**
- Environment-specific config directories
- Clear naming conventions (netlify/ vs azure/)
- Version control for all configuration files

**Risk Management:**
- Use feature flags for Azure-specific functionality
- Regular code reviews for azure-poc branch changes
- Clear commit message conventions ("Azure: ..." prefix)

**Testing:**
- Environment-specific test configurations
- Parallel testing of both environments
- Automated validation of environment isolation

## Alternatives Considered

### Separate Repository Approach

**Pros:**
- Complete isolation between environments
- No risk of cross-contamination
- Clear separation of concerns

**Cons:**
- Code synchronization challenges for 80-90% shared code
- Dual repository management overhead
- More complex development workflow
- Harder to maintain shared components

**Decision:** Rejected due to synchronization overhead with large shared codebase

### Git Worktree Approach

**Pros:**
- Shared git history with separate working directories
- Independent development branches
- Easy to sync shared changes

**Cons:**
- More complex git workflow
- Requires understanding of worktree concepts
- Still requires manual synchronization

**Decision:** Considered but single repo with branches is simpler for POC

## Related Decisions

- ADR-015: Choice of Monorepo Structure
- ADR-016: Choice of E2E Testing Architecture
- ADR-018: Choice of SEO Implementation Strategy

## Success Metrics

### Technical Metrics
- [ ] Both environments build and deploy successfully
- [ ] Shared components work identically across platforms
- [ ] Environment-specific configurations are properly isolated
- [ ] Build scripts execute without manual intervention

### Process Metrics
- [ ] Development workflow remains efficient
- [ ] Code reviews can easily distinguish environment changes
- [ ] Testing covers both environments adequately
- [ ] Documentation clearly explains environment differences

### Quality Metrics
- [ ] No cross-contamination between environments
- [ ] Clear separation of shared vs environment-specific code
- [ ] Easy to maintain and extend configurations
- [ ] Rollback procedures are well-defined

## Future Considerations

**Post-POC Evaluation:**
- If Azure POC proves successful, consider maintaining dual deployments from single repo
- If separate repositories prove necessary, can split at that time
- Consider infrastructure-as-code for environment management

**Scaling Considerations:**
- For multiple developers, may need stricter branch protection rules
- Consider automated testing across both environments
- May need more sophisticated configuration management

---

**Note:** This ADR reflects the decision to use a single repository strategy specifically for the Azure POC phase. The approach may be re-evaluated based on POC results and long-term maintenance requirements.