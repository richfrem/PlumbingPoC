# ADR-023: Backend Configuration Architecture for Multi-Platform Support

**Date:** 2025-10-09

**Status:** Decided & Implemented

## Context

The PlumbingPOC backend needed a cleaner configuration architecture to support multiple deployment platforms (Netlify + Azure). The original structure had configuration files scattered across different locations with unclear separation of concerns.

This ADR documents the decision to organize platform-specific configurations in a structured way that supports future multi-platform deployments.

This structure creates maintenance challenges and makes it difficult to add new platforms or switch between existing ones.

## Decision

We will refactor the backend configuration architecture to use **Option A: Platform-Agnostic Config** with the following structure:

```
packages/backend/
├── api/                    # API logic with config
│   ├── config/             # Platform-specific configurations
│   │   ├── supabase/
│   │   │   ├── database.js # Supabase database client
│   │   │   └── index.js    # Exports all Supabase services
│   │   └── azure/          # Ready for Azure services
│   ├── controllers/        # ✅ Updated imports
│   ├── services/          # ✅ Updated imports
│   └── middleware/        # ✅ Updated imports
└── netlify/               # Platform-specific deployment
    └── functions/
```

### Key Principles

1. **Separation of Concerns**: API logic is completely separate from configuration
2. **Platform Agnosticism**: Core API doesn't know about specific platforms
3. **Clean Imports**: `import { database as supabase } from '../config/supabase/index.js'`
4. **Future-Proof**: Easy to add new platforms (AWS, GCP, etc.)
5. **Single Source of Truth**: No duplicate configuration files

## Implementation Plan

### Implementation
- Create `packages/backend/api/config/supabase/` directory structure
- Move Supabase client to `database.js` with clean exports via `index.js`
- Update all backend imports to use new structured approach
- Remove duplicate configuration files
- Organize for future multi-platform support

### Phase 4: Platform Abstraction
- Create environment-based config loading
- Implement platform-specific overrides
- Add configuration validation

## Consequences

### Positive
- **Clean Architecture**: Clear separation between API logic and configuration
- **Multi-Platform Ready**: Easy to add Azure, AWS, or other platforms
- **Maintainable**: No duplicate files, single source of truth
- **Testable**: Platform-specific configs can be easily mocked
- **Scalable**: New platforms don't require API logic changes

### Negative
- **Migration Effort**: Requires updating import paths across multiple files
- **Breaking Changes**: All existing imports need to be updated
- **Temporary Complexity**: Dual structure during migration period

### Implementation Timeline
- **Estimated Effort**: 2-3 hours
- **Files to Update**: ~6 controller files + services + tests
- **Risk Level**: Low (pure refactoring, no functional changes)

## Alternatives Considered

### Option B: Platform-Specific Config (Current Structure)
- **Pros**: Minimal changes to existing imports
- **Cons**: Mixed concerns, harder to add new platforms
- **Decision**: Rejected due to architectural limitations

### Option C: Environment-Based Config Loading
- **Pros**: Single config file with environment switching
- **Cons**: Runtime complexity, harder to test platform differences
- **Decision**: Rejected in favor of compile-time separation

## Related Decisions

- ADR-015: Choice of Monorepo Structure
- ADR-019: Azure Migration Strategy (upcoming)
- ADR-016: E2E Testing Architecture

## Success Criteria

- [ ] All imports updated and working
- [ ] No duplicate configuration files
- [ ] Clean directory structure
- [ ] Tests pass with new import paths
- [ ] Easy to add new platform configurations