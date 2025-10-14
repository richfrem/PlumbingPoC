# ADR-031: Choice of Secrets Detection Implementation with Pre-commit Hooks

**Date:** 2025-10-13

**Status:** Decided & Implemented

## Context

The PlumbingPOC project handles sensitive data including API keys, database credentials, and user authentication tokens. During development, there was an incident where hardcoded secrets were nearly committed to the repository. We needed a robust, automated solution to prevent accidental secret leaks while allowing legitimate code patterns like environment variable references and variable assignments.

The initial implementation used a custom Python pre-commit hook, but this required ongoing maintenance of secret patterns and whitelisting logic. As a common security need, we sought a more professional, maintainable solution.

## Decision

We will use **detect-secrets** (by Yelp) integrated with the **pre-commit framework** for automated secrets detection. This replaces our custom Python hook with industry-standard tools that provide:

- Comprehensive secret pattern detection (20+ secret types)
- Regular updates for new secret patterns
- Sophisticated baseline management
- Integration with standard pre-commit workflows

## Implementation

The solution consists of:

1. **detect-secrets**: Scans for hardcoded secrets using entropy analysis and pattern matching
2. **pre-commit framework**: Manages hook execution and provides additional code quality checks
3. **Baseline file**: Documents existing "acceptable" secrets in the codebase
4. **Configuration**: YAML-based setup for easy maintenance

### Configuration Details

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: ^(package-lock\.json|\.secrets\.baseline)$

  - repo: local
    hooks:
      - id: block-env-files
        name: Block .env files (except .env.example)
        entry: python3
        files: ^\.env$
        exclude: ^\.env\.example$
        args: [-c, "import sys; filename = sys.argv[1]; ..."]
```

## Consequences

*   **Pros:**
    *   **Professional Security**: Industry-standard tool used by major companies (Yelp, GitHub, etc.)
    *   **Comprehensive Coverage**: Detects 20+ types of secrets including API keys, tokens, passwords, and private keys
    *   **Automatic Updates**: New secret patterns added as they're discovered in the wild
    *   **Baseline Management**: Tracks existing secrets to avoid false positives during refactoring
    *   **Performance**: Optimized scanning with baseline caching
    *   **Integration**: Works seamlessly with existing pre-commit workflows
    *   **Additional Checks**: Includes trailing whitespace, YAML validation, and large file detection

*   **Cons:**
    *   **Learning Curve**: Requires understanding of baseline management and configuration
    *   **Dependency**: Adds external tool dependencies to the development environment
    *   **False Positives**: May require baseline updates when legitimate code patterns change
    *   **Configuration Complexity**: YAML configuration can become complex for advanced use cases

*   **Security Benefits:**
    *   **Proactive Prevention**: Catches secrets before they reach the repository
    *   **Pattern Recognition**: Uses entropy analysis to detect obfuscated secrets
    *   **Comprehensive Scanning**: Checks all file types, not just code files
    *   **Audit Trail**: Baseline provides visibility into what secrets exist in the codebase

*   **Maintenance Benefits:**
    *   **Zero Custom Code**: No need to maintain custom regex patterns
    *   **Community Support**: Active development and security updates
    *   **Standard Tooling**: Familiar to security teams and auditors

## Alternatives Considered

*   **Custom Python Hook (Original Implementation)**:
    *   **Pros**: Full control, tailored to our specific patterns
    *   **Cons**: High maintenance burden, limited secret pattern coverage, manual updates required
    *   **Rejected**: Too much ongoing maintenance for a common security need

*   **GitLeaks**:
    *   **Pros**: Popular Go-based scanner, fast performance, extensive secret patterns
    *   **Cons**: More complex setup, less integration with pre-commit framework
    *   **Considered**: Strong alternative, but detect-secrets has better pre-commit integration

*   **TruffleHog**:
    *   **Pros**: Most comprehensive scanning, includes git history analysis
    *   **Cons**: Overkill for pre-commit use case, slower performance
    *   **Considered**: Better suited for CI/CD pipelines than pre-commit hooks

*   **Git-Secrets (AWS)**:
    *   **Pros**: AWS-backed, good pattern coverage
    *   **Cons**: Limited to git, fewer secret types than detect-secrets
    *   **Rejected**: Less comprehensive than detect-secrets

## Usage Guidelines

### For Developers:
- Run `pre-commit run --all-files` to test hooks locally
- Update baseline with `detect-secrets scan --baseline .secrets.baseline` after legitimate changes
- Use `<REDACTED>` in code when documenting secret usage

### For CI/CD:
- Include pre-commit checks in pipeline
- Monitor for new secret patterns requiring baseline updates
- Regular baseline audits to ensure no secrets have been inadvertently added

### For Security Team:
- Review baseline changes during code reviews
- Monitor detect-secrets releases for new capabilities
- Conduct periodic secret audits using the baseline as a reference

## Related Documentation

- [detect-secrets documentation](https://github.com/Yelp/detect-secrets)
- [pre-commit framework](https://pre-commit.com/)
- Project security guidelines in `docs/SECURITY.md`
