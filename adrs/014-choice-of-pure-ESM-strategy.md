### **ADR-014: Adopting a Pure ES Module Strategy for the Entire Codebase**

**Date:** 2025-09-14

**Status:** Decided

**Supersedes:** [ADR-013: Aligning Node.js Module Systems for Backend Compatibility](./013-choice-of-nodejs-module-system-alignment.md)

### **Context**

After implementing an NPM workspace (ADR-012), we faced a module system conflict between the ESM-first Vite/React frontend and the CJS-based Express backend. The initial solution (ADR-013) was to create a stable hybrid system by renaming all backend files to `.cjs` to force them to be treated as CommonJS.

While this solution was effective at resolving the immediate runtime errors, a re-evaluation was conducted based on the project's specific scale. The backend API is not a large, legacy system; it is a small, well-defined set of modern JavaScript files. The argument was made that the technical debt of maintaining a mixed-module system, while minor, was unnecessary given the manageable scope of a full migration.

### **Decision**

We will **migrate the entire Node.js/Express backend from CommonJS (CJS) to ES Modules (ESM)**. This supersedes the previous decision to use a hybrid `.cjs`/`.js` approach.

The implementation will involve:
1.  Renaming all backend files in `packages/backend/api/` back to the `.js` extension.
2.  Refactoring all backend files to use `import`/`export` syntax instead of `require()`/`module.exports`.
3.  Updating any code that relies on CJS-specific globals (like `__dirname`) to use their ESM equivalents (e.g., `import.meta.url`).
4.  Ensuring the `packages/frontend/package.json` retains its `"type": "module"` directive, making ESM the default for the entire frontend workspace.

### **Consequences**

*   **Pros:**
    *   **Architectural Purity & Consistency:** The entire project codebase (frontend and backend) will now use a single, modern module system. This eliminates the cognitive load of switching between CJS and ESM syntax.
    *   **Eliminates Technical Debt:** Instead of patching the module conflict, this decision resolves it at the root, creating a cleaner and more maintainable long-term foundation.
    *   **Future-Proofing:** Fully aligns the entire project with the official JavaScript standard, ensuring better compatibility with future tools and language features.
    *   **Improved Developer Experience (DX):** Creates a "best practice" environment from the outset, which is ideal for a project of this scale and modernity.

*   **Cons:**
    *   **Upfront Time Investment:** Requires a dedicated (though small, estimated at a few hours) refactoring effort compared to the quicker `.cjs` renaming fix.
    *   **Minor Interop Complexity:** May require minor workarounds for any legacy Express middleware that does not have first-class ESM support. This risk is deemed low for the libraries currently in use.

### **Alternatives Considered**

1.  **Maintain the Hybrid CJS/ESM System (ADR-013):** This was the previous, more conservative decision. It was rejected because the small size of the backend did not justify the long-term complexity of maintaining two different module systems. The benefit of architectural purity outweighed the small cost of the refactor.
2.  **Remove Dependencies Causing Conflicts:** This was rejected as it would mean sacrificing valuable functionality (`react-dropzone`) to avoid addressing the underlying architectural inconsistency.

This decision represents a commitment to a higher standard of code quality and long-term maintainability, which is appropriate and achievable for a project of this size.
