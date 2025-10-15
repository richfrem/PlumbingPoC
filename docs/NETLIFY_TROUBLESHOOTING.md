# Netlify Deployment Troubleshooting Guide

This document chronicles the major issues encountered during Netlify deployment of the PlumbingPOC application and their solutions. It serves as a reference for future deployments and debugging.

## Overview

The PlumbingPOC application uses an npm workspaces monorepo structure with separate frontend and backend packages, deployed to Netlify with serverless functions. This architecture presents unique challenges for dependency resolution, build commands, and module loading in a CI/CD environment.

## Current Working Configuration

### Netlify Build Configuration (`netlify.toml`)

```toml
[build]
  base = "." # Repository root
  command = "npm install --include=dev && npx vitest run && npm --workspace=@plumbingpoc/frontend run build"
  publish = "packages/frontend/dist/"
  functions = "packages/backend/netlify/functions/"
  environment = { NPM_FLAGS = "--legacy-peer-deps" }

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[functions]
  [functions."api-mjs"]
    external_node_modules = ["express", "cors", "serverless-http", "dotenv", "supabase", "@supabase/supabase-js"]
  [functions."send-sms-mjs"]
    external_node_modules = ["twilio"]
```

**Key Configuration Elements:**
- **Base Directory**: Repository root (`.`) to access all workspace dependencies
- **Build Command**: Three-stage process ensuring all dependencies are available
- **Publish Directory**: Frontend build output (`packages/frontend/dist/`)
- **Functions Directory**: Backend serverless functions
- **External Node Modules**: Prevents bundling of specific dependencies in functions

### Package.json Structure & Dependencies

#### Root Package.json (`/package.json`)
**Purpose**: Centralized dependency management for the entire monorepo

```json
{
  "name": "plumbingpoc-root",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "npm-run-all --parallel dev:frontend dev:backend",
    "build": "npm install && npm --workspace=@plumbingpoc/frontend run build",
    "test": "vitest",
    "test:ci": "vitest run"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@supabase/supabase-js": "^2.44.4",
    "@tanstack/react-query": "^5.51.11",
    "react": "^18.3.1",
    "express": "^4.19.2",
    "twilio": "^5.2.2",
    // ... all production dependencies
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "typescript": "^5.5.4",
    "vite": "^5.3.4",
    "vitest": "^2.0.4",
    // ... all development tools
  }
}
```

**Key Patterns:**
- **All dependencies centralized**: Both production and dev dependencies in root
- **Workspace configuration**: `"workspaces": ["packages/*"]` enables npm workspaces
- **Cross-workspace scripts**: Orchestrate builds across multiple packages

#### Frontend Package.json (`/packages/frontend/package.json`)
**Purpose**: Minimal workspace-specific configuration

```json
{
  "name": "@plumbingpoc/frontend",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

**Key Patterns:**
- **No dependencies**: Relies entirely on root package.json
- **Build script**: Uses `tsc --noEmit` for type checking, then `vite build`
- **Workspace name**: `@plumbingpoc/frontend` for npm workspace targeting

#### Backend Package.json (`/packages/backend/package.json`)
**Purpose**: Development scripts and local server configuration

```json
{
  "name": "@plumbingpoc/backend",
  "type": "module",
  "scripts": {
    "start": "node server.mjs",
    "dev": "nodemon server.mjs"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

**Key Patterns:**
- **ESM configuration**: `"type": "module"` for ES modules
- **No dependencies**: Relies on root package.json
- **Local development**: Scripts for running backend server locally

## Official Netlify Documentation References

### Primary Documentation Sources
1. **[Manage Dependencies](https://docs.netlify.com/configure-builds/manage-dependencies/)** - Core dependency management patterns
2. **[Build Configuration Overview](https://docs.netlify.com/configure-builds/get-started/)** - Build settings and best practices
3. **[File-based Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)** - netlify.toml configuration options
4. **[Build Troubleshooting Tips](https://docs.netlify.com/configure-builds/troubleshooting-tips/)** - Common build issues and solutions

### Key Documentation Insights

#### NODE_ENV and devDependencies Behavior
From Netlify's dependency management documentation:
> "If you set the `NODE_ENV` to `production`, any `devDependencies` in your `package.json` file will not be installed for the build."

> "By default, Netlify's build system sets `NODE_ENV` to `development`."

**Critical Finding**: Netlify can set `NODE_ENV=production` in certain contexts, preventing `devDependencies` installation. Our solution uses `--include=dev` to force installation regardless of NODE_ENV.

#### npm Installation Patterns
From Netlify's npm documentation:
> "By default, if your site's repository does not include a `yarn.lock`, `pnpm-lock.yaml` or `bun.lockb` file, we will run `npm install` to install the dependencies listed in your `package.json`."

**Best Practice**: Explicit `npm install --include=dev` ensures all dependencies are available for testing and building.

#### Build Command Patterns
From Netlify's file-based configuration documentation:
> "The `[build]` command runs in the Bash shell, allowing you to add Bash-⁠compatible syntax to the command."

**Standard Pattern**: Command chaining with `&&` is officially supported and recommended.

## Major Issues & Solutions

### Issue 4: DevDependencies Not Installed - vitest Not Found

**Problem:** Netlify builds failed with `vitest: not found` despite vitest being listed in devDependencies:
```
sh: 1: vitest: not found
npm install && npm run test:ci && npm run build
```

**Root Cause:** Netlify set `NODE_ENV=production` which prevents `devDependencies` from being installed by default. Even though `npm install` ran, it only installed production dependencies (323 packages vs expected 578 packages).

**Solution:** Force installation of dev dependencies and use npx for reliable tool execution:
```toml
# netlify.toml
[build]
  command = "npm install --include=dev && npx vitest run && npm --workspace=@plumbingpoc/frontend run build"
```

**Key Changes:**
- `--include=dev`: Forces npm to install devDependencies regardless of NODE_ENV
- `npx vitest run`: Direct execution from node_modules/.bin (bypasses PATH issues)
- Direct workspace build: Eliminates redundant npm install operations

### Issue 5: TypeScript Compiler (`tsc`) Not Found in Workspace Build

**Problem:** After fixing vitest, the frontend build failed with `tsc: not found` during workspace build:
```
> @plumbingpoc/frontend@1.0.0 build
> tsc --noEmit && vite build
sh: 1: tsc: not found
```

**Root Cause:** The root build script triggered another `npm install` that didn't properly make TypeScript available to the workspace build context.

**Solution:** Streamlined build process with direct workspace targeting:
```toml
# Before (problematic)
command = "npm install --include=dev && npx vitest run && npm run build"

# After (working)
command = "npm install --include=dev && npx vitest run && npm --workspace=@plumbingpoc/frontend run build"
```

**Benefits:**
- Single dependency installation phase
- Direct workspace access to root dependencies
- Eliminates double npm install operations
- TypeScript accessible from root node_modules

### Issue 6: Frontend Build Failures - MUI Dependency Resolution

**Problem:** The Vite bundler failed to resolve Material-UI dependencies in the CI environment with errors like:
```
[ERROR] Failed to resolve import "@mui/material" from "packages/frontend/src/main.tsx"
```

**Root Cause:** In a monorepo setup, Vite's dependency resolution was confused by the nested package structure and hoisted dependencies at the root level.

**Solution:** Added an `optimizeDeps` configuration in `vite.config.js` to explicitly tell Vite to pre-bundle these packages:
```javascript
// vite.config.js
optimizeDeps: {
  include: ['@mui/material', '@mui/system'],
},
```

### Issue 7: Serverless Function Crashes - `import.meta.url` Undefined

**Problem:** Netlify functions crashed with a `TypeError` because `import.meta.url` was `undefined`:
```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined
    at fileURLToPath (node:internal/url:1507:11)
```

**Root Cause:** The `import.meta.url` property, used for resolving file paths relative to the current module, is not reliably available or defined in Netlify's serverless function runtime environment.

**Solution:** Simplified environment variable loading in all backend files by removing `import.meta.url` and relying on `dotenv`'s automatic discovery of the `.env` file from the project root:
```javascript
// Before (problematic)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// After (working)
import dotenv from 'dotenv';
dotenv.config();
```

### Issue 13: Supabase client init crash in Netlify Lambda (fileURLToPath on undefined)

**Problem:** After deployment the API functions were returning HTTP 502 (Bad Gateway). Netlify function logs showed repeated runtime crashes during function initialization with the following error:

```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined
    at fileURLToPath (node:internal/url:1606:11)
    at packages/backend/api/config/supabase/database.js (..):<line>
```

**Symptoms:**
- Frontend console: repeated 502 errors when calling `/api/requests`
- Netlify function logs: Unhandled Promise Rejection during init, pointing to `fileURLToPath(import.meta.url)` usage inside the Supabase client initializer

**Root Cause:**
- The Supabase client module (`packages/backend/api/config/supabase/database.js`) used `fileURLToPath(import.meta.url)` to resolve a `.env` file path. In Netlify's bundled Lambda environment `import.meta.url` can be undefined, causing `fileURLToPath(undefined)` and an immediate crash during module import — which prevents the function from starting and yields 502 responses.

**Fix Applied:**
- Replaced `import.meta.url` usage with a safe `.env` loading strategy that:
  - Only attempts to load a `.env` file when required (i.e., when `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are not present in process.env) to avoid unnecessary file I/O in production lambdas.
  - Uses `process.cwd()` as the path base to resolve `.env` (no reliance on `import.meta.url`).
  - Wraps `.env` loading in a try/catch so that failure to locate `.env` doesn't throw during lambda init.

Key change (conceptual):

```js
// Before: used fileURLToPath(import.meta.url) -> could be undefined in lambda
// After: try load .env from process.cwd() only when needed, fallback safely
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
```

**Commit:** 9170270 (fix(supabase): robust .env loading for Netlify lambdas (avoid import.meta.url))

**Verification steps performed:**
1. Locally imported the modified module to ensure it does not throw on startup:
   - `node -e "(async()=>{ await import('./packages/backend/api/config/supabase/database.js'); logger.log('ok'); })()"`
2. Pushed the fix and monitored Netlify function logs for the `api` function.
3. Confirmed Netlify no longer shows the `ERR_INVALID_ARG_TYPE` stack trace originating from `database.js`.
4. Exercised the endpoint (`GET /api/requests`) in the deployed site; 502s stopped and the endpoint returned expected responses (after ensuring required env vars were present in Netlify).

**Prevention & Recommendations:**
- Never rely on `import.meta.url` for path resolution inside serverless/bundled environments; use `process.cwd()` or explicit environment-driven paths instead.
- Always guard file-system operations with try/catch during module initialization so that missing local files do not crash lambdas.
- Ensure critical environment variables (e.g., `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are configured in Netlify UI — in production lambdas `.env` won't be available and the code must rely on env vars only.
- Add a short smoke-test in the deploy pipeline that calls a simple function endpoint after deployment (e.g., `/api/health` or `/api/requests?limit=1`) and fails the deploy if it returns 5xx.


### Issue 8: ESM vs CommonJS Module Conflicts

**Problem:** Netlify functions initially used CommonJS syntax (`.cjs`, `require()`) but the backend application code was written using ES Modules (`.js` with `"type": "module"`, `import`), causing module loading failures.

**Root Cause:** A mixed-module system within the same logical application (the backend).

**Solution:** Migrated all Netlify function handlers to be consistent with the ESM used by the application:
- Renamed `api.cjs` → `api.mjs` and `send-sms.cjs` → `send-sms.mjs`.
- Updated syntax from `require()`/`module.exports` to `import`/`export`.

### Issue 4: TypeScript Compiler (`tsc`) Not Found in CI/CD Build Environment

**Problem:** Netlify production builds consistently failed during the frontend build step with errors indicating the TypeScript compiler could not be found:
```
sh: 1: tsc: not found
```
Subsequent attempts using `npx tsc` led to a different, misleading error where `npx` tried to install a very old version of TypeScript:
```
npm warn exec The following package was not found and will be installed: tsc@2.0.4
This is not the tsc command you are looking for
```

**Root Cause:** This was a multi-faceted issue related to how `npm workspaces` and the Netlify build environment interact:
1.  The TypeScript compiler (`tsc`) is correctly listed as a `devDependency` and is not available in the global shell PATH of the Netlify build image.
2.  Simply calling `tsc` in a script fails because it's not in the PATH.
3.  Using `npx tsc` is the correct approach, but it failed because the initial `npm install` in the Netlify environment wasn't robust enough to make the local binary available to `npx` reliably before the build script ran. This caused `npx` to fall back to its "install-and-run" behavior, where it incorrectly resolved `tsc` to an old, unrelated package.

**The Definitive Solution:** A two-part configuration that ensures all dependencies are installed *before* the build script runs, allowing `npx` to correctly find the *local* `tsc` binary.

**1. Update the Root `package.json` Build Script:**
The main `build` command was modified to first run a full monorepo `npm install` and then trigger the frontend workspace's build script.

```json
// package.json (root)
"scripts": {
  "build": "npm install && npm --workspace=@plumbingpoc/frontend run build"
}
```
*   `npm install`: Ensures all dependencies for all workspaces are installed and linked correctly.
*   `npm --workspace=@plumbingpoc/frontend run build`: Executes the `build` script from within the context of the frontend package, after all dependencies are in place.

**2. Update the Frontend Workspace `package.json` Build Script:**
The frontend's build script was updated to use `npx` to reliably execute the now-installed `tsc` binary.

```json
// packages/frontend/package.json
"scripts": {
  "build": "npx tsc --noEmit && vite build"
}
```
*   `npx tsc`: Now correctly finds and uses the `typescript` version specified in `devDependencies` because the root `npm install` has already made it available.

This combination is the robust and correct pattern for building TypeScript-based monorepos on Netlify.

## Current Working Build Process

### Build Pipeline (32.6s total)
1. **Dependency Installation** (6s): `npm install --include=dev` ensures all 578 packages are available
2. **Testing** (2.8s): `npx vitest run` executes 21 tests across 2 test files
3. **Frontend Build** (5.7s): TypeScript compilation + Vite production build
4. **Function Bundling** (1.5s): Packages serverless functions with external dependencies
5. **Deployment** (7.1s): Uploads assets and functions to Netlify CDN

### Successful Build Metrics
- **Dependencies**: 578 packages audited (full dependency tree)
- **Tests**: 21 tests passed in 2.80s
- **Build Output**: 1.2MB main bundle (warning about chunk size > 500KB)
- **Functions**: 2 serverless functions (api.mjs, send-sms.mjs)
- **Secrets Scanning**: 246 files scanned, no secrets detected

## Monorepo Architecture Best Practices

### Dependency Strategy
- **Centralized Dependencies**: All packages (production + dev) in root package.json
- **Workspace Isolation**: Individual packages have minimal package.json files
- **Hoisting Benefits**: npm workspaces automatically hoists shared dependencies
- **Version Consistency**: Single source of truth for dependency versions

### Build Strategy
- **Root Orchestration**: Main build script coordinates workspace builds
- **Tool Access**: Use npx for dev tools to ensure correct versions
- **Single Install**: One npm install phase provides dependencies to all workspaces
- **Direct Targeting**: Use `npm --workspace=<name>` for specific package operations

### Environment Variable Strategy
- **Local Development**: .env file in repository root
- **Production Deployment**: Netlify environment variables (override local .env)
- **Precedence Order**: Netlify vars > .env file > default values in code
- **Consistency**: Same variable names across environments ensure compatibility

## Deployment Checklist

Before deploying to Netlify:

1. ✅ **Dependencies**: All shared dependencies consolidated in root `package.json`
2. ✅ **Build Command**: Uses `npm install --include=dev && npx vitest run && npm --workspace=@plumbingpoc/frontend run build`
3. ✅ **Frontend Build**: Uses `tsc --noEmit && vite build` for type checking + bundling
4. ✅ **Backend Functions**: All use `.mjs` extension with ESM syntax
5. ✅ **Environment Variables**: Configured in Netlify UI dashboard
6. ✅ **Vite Config**: Includes `optimizeDeps` for problematic packages like MUI
7. ✅ **Function Code**: No `import.meta.url` usage in serverless functions (use try-catch with process.cwd() fallback)
8. ✅ **Module System**: Consistent ESM usage across backend and functions
9. ✅ **External Modules**: Properly configured in netlify.toml functions section
10. ✅ **Function Names**: Match filenames exactly (api.mjs → [functions.api], not [functions."api-mjs"])
11. ✅ **Type Safety**: Component prop types match state variable types (no ServiceDefinition → string mismatches)
12. ✅ **Asset Files**: Non-code files (YAML, JSON) declared in `included_files` array
13. ✅ **Path Resolution**: Multiple fallback strategies for file loading in bundled environments
14. ✅ **Error Handling**: Comprehensive try-catch blocks for import.meta.url and file system operations

## Prevention Strategies

### Dependency Management
1. **Centralize Dependencies**: Keep all dependencies in root package.json for monorepos
2. **Use --include=dev**: Force dev dependency installation in CI environments
3. **Version Pinning**: Use exact versions for critical dependencies
4. **Regular Audits**: Monitor `npm audit` output and security vulnerabilities

### Build Reliability
1. **Explicit Tool Execution**: Use `npx` for dev tools rather than global installations
2. **Single Install Phase**: Avoid multiple npm install operations in build pipeline
3. **Workspace Targeting**: Use direct workspace commands to avoid script complexity
4. **Build Caching**: Leverage Netlify's dependency caching for faster builds

### Environment Consistency
1. **Environment Parity**: Match local NODE_ENV to production for testing
2. **Variable Documentation**: Document all required environment variables
3. **Fallback Handling**: Provide sensible defaults for optional variables
4. **Security**: Use Netlify UI for sensitive variables, not repository files

## Monitoring & Debugging

### Netlify Dashboard
- **Build Logs**: Check "Deploys" section for detailed build process
- **Function Logs**: Monitor "Functions" section for runtime issues
- **Performance**: Review build times and identify bottlenecks
- **Environment**: Verify all required variables are set

### Local Development
- **Netlify CLI**: Use `netlify dev` to test production environment locally
- **Build Testing**: Run exact build command locally before deploying
- **Function Testing**: Test serverless functions with `netlify functions:serve`
- **Environment Validation**: Verify .env file matches Netlify configuration

### Debug Techniques
- **Verbose Logging**: Add logger.log statements for debugging (appear in function logs)
- **Dependency Verification**: Check package count in build logs (should be ~578)
- **Build Timing**: Monitor build phases to identify performance issues
- **Cache Management**: Clear Netlify build cache if experiencing strange issues

### Issue 9: Webhook Not Triggering Automatic Deployments

**Problem:** GitHub commits were not triggering automatic deployments in Netlify, despite repository connection appearing fine in the UI.

**Symptoms:**
- Manual deployments worked perfectly
- Repository connection showed as "connected" in Netlify UI
- Commits pushed successfully to GitHub
- No automatic deployments triggered

**Root Cause:** Missing webhook in GitHub repository. The Netlify UI showed the repository as connected, but the underlying webhook that notifies Netlify of new commits was not created or was deleted.

**Timeline Analysis:**
- ✅ Commits worked until merge commit `26c6d39` ("Merge azure-poc: Move configs...")
- ❌ No deployments triggered after this merge
- ✅ Manual deployments continued to work perfectly

**Solution:** Repository disconnection and reconnection to recreate the missing webhook.

**Steps Taken:**
1. **Disconnected repository** in Netlify UI (Site Settings → Build & Deploy → Repository)
2. **Reconnected repository** with corrected settings:
   - Repository: `richfrem/PlumbingPoC`
   - Branch: `main`
   - **Base directory:** `.` (repository root)
   - **Package directory:** `Not set` (blank)
   - Build command: `npm install --include=dev && npx vitest run && npm --workspace=@plumbingpoc/frontend run build`
   - Publish directory: `./packages/frontend/dist/`
   - Functions directory: `./packages/backend/netlify/functions/`
3. **Verified environment variables** remained intact
4. **Tested with new commit** - automatic deployment triggered successfully

**Result:** ✅ Automatic deployments restored. Webhook recreated and functioning properly.

**Prevention:** When making significant repository changes (merges, branch restructuring), verify webhook functionality by checking GitHub repository webhooks or testing with a commit.

**Key Learning:** UI showing "connected" doesn't guarantee webhook exists. Repository reconnection is the reliable fix for webhook issues.

### Issue 10: TypeScript Error - Type Mismatch in Component Props

**Problem:** Production build failed with TypeScript error:
```
src/main.tsx(454,13): error TS2322: Type 'ServiceDefinition | null' is not assignable to type 'string | null | undefined'.
  Type 'ServiceDefinition' is not assignable to type 'string'.
```

**Root Cause:** State variable type mismatch between component and its props. The `preselectedService` state was typed as `ServiceDefinition | null` (an object), but the `QuoteAgentModal` component expected `string | null` (just the service key).

**Timeline:**
- ✅ Local development passed (type checking might be less strict)
- ❌ Production build failed during `tsc --noEmit` check
- 🔍 Error occurred at line 454 where `preselectedService` was passed to modal component

**Solution:** Changed state type and assignment to match component expectations:

```typescript
// Before (problematic)
const [preselectedService, setPreselectedService] = useState<ServiceDefinition | null>(null);
const handleServiceSelect = (service: ServiceDefinition) => {
  setPreselectedService(service); // Passing full object
};

// After (working)
const [preselectedService, setPreselectedService] = useState<string | null>(null);
const handleServiceSelect = (service: ServiceDefinition) => {
  setPreselectedService(service.key); // Passing just the key string
};
```

**Key Learning:** Always ensure state types match component prop expectations. Production builds enforce strict TypeScript checking that local dev might miss.

### Issue 11: Netlify Function Configuration Mismatch

**Problem:** All Netlify functions (api, send-sms, quote-agent) returned 502 errors in production despite successful builds.

**Symptoms:**
```
GET /api/requests 502 (Bad Gateway)
GET /.netlify/functions/quote-agent 502 (Bad Gateway)
```

**Root Cause:** Function names in `netlify.toml` didn't match actual filenames. Netlify derives function names from filenames (without extension), but configuration used incorrect names with `-mjs` suffix:

```toml
# Before (incorrect)
[functions."api-mjs"]  # File is api.mjs → function name should be "api"
[functions."send-sms-mjs"]  # File is send-sms.mjs → function name should be "send-sms"
```

**Solution:** Corrected function names to match actual filenames:

```toml
# After (correct)
[functions.api]
  external_node_modules = ["express", "cors", "serverless-http", "dotenv", "supabase", "@supabase/supabase-js"]

[functions.send-sms]
  external_node_modules = ["twilio"]

[functions."quote-agent"]
  external_node_modules = ["yaml", "openai"]
  included_files = ["agents/quote-agent.yaml"]
```

**Naming Rules:**
- Filename `api.mjs` → Function name: `api`
- Filename `send-sms.mjs` → Function name: `send-sms`
- Filename `quote-agent.mjs` → Function name: `quote-agent`

**Key Learning:** Netlify function names are derived from filenames (without extension). Configuration must use exact function names, not file extensions.

### Issue 12: YAML File Not Found in Netlify Function Bundle

**Problem:** Quote agent function crashed with 502 error immediately on invocation.

**Error in Netlify Logs:**
```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined
    at fileURLToPath (node:internal/url:1606:11)
    at Object.<anonymous> (/var/task/packages/backend/netlify/functions/quote-agent.mjs:43:47)
```

**Root Cause:** Multiple issues with file loading in Netlify's bundled environment:

1. **Missing YAML file**: The `quote-agent.yaml` file wasn't included in function bundle
2. **import.meta.url undefined**: `fileURLToPath(import.meta.url)` fails in Netlify's bundled functions
3. **Path resolution**: Relative paths don't work the same in bundled vs. unbundled environments

**Solution Part 1 - Include YAML File in Bundle:**

Added `included_files` configuration to ensure YAML is bundled with function:

```toml
[functions."quote-agent"]
  external_node_modules = ["yaml", "openai"]
  included_files = ["agents/quote-agent.yaml"]
```

**Solution Part 2 - Handle import.meta.url Safely:**

Wrapped `fileURLToPath` in try-catch with fallback for bundled environments:

```javascript
// Before (problematic)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// After (robust)
let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (error) {
  // Fallback for bundled/Netlify environment where import.meta.url might not work
  __dirname = process.cwd();
  logger.log('[QuoteAgent] Using process.cwd() as __dirname:', __dirname);
}
```

**Solution Part 3 - Multiple Path Resolution Strategies:**

Added comprehensive path fallbacks to find YAML file in any environment:

```javascript
let YAML_PATH = path.resolve(__dirname, '../../../../agents/quote-agent.yaml');
if (!fs.existsSync(YAML_PATH)) {
  YAML_PATH = path.resolve(process.cwd(), 'agents/quote-agent.yaml');
}
if (!fs.existsSync(YAML_PATH)) {
  YAML_PATH = path.resolve(__dirname, '../../../../../agents/quote-agent.yaml');
}
if (!fs.existsSync(YAML_PATH)) {
  YAML_PATH = path.resolve(process.cwd(), '../../../../agents/quote-agent.yaml');
}
```

**Key Learnings:**
- ✅ Always use `included_files` for non-code assets needed by functions
- ✅ Never rely on `import.meta.url` in Netlify functions - use try-catch with fallbacks
- ✅ Use `process.cwd()` as fallback for `__dirname` in bundled environments
- ✅ Implement multiple path resolution strategies for file loading
- ✅ Add comprehensive logging to debug path resolution issues

**External Dependencies for Functions:**

Functions that need non-standard packages must declare them:

```toml
[functions."quote-agent"]
  external_node_modules = [
    "yaml",      # For parsing YAML configuration
    "openai"     # For OpenAI API calls
  ]
  included_files = [
    "agents/quote-agent.yaml"  # Non-code asset
  ]
```

## How to Relink Repository in Netlify

If you need to relink your repository (e.g., after repository restructuring, webhook issues, or changing repository settings), follow these steps:

### Step-by-Step Repository Relinking Process

1. **Access Netlify Site Settings:**
   - Go to your Netlify dashboard
   - Select your PlumbingPOC site
   - Navigate to **Site settings** → **Build & deploy** → **Repository**

2. **Disconnect Current Repository:**
   - Click the **"Disconnect repository"** button
   - Confirm the disconnection when prompted
   - This removes the webhook from GitHub

3. **Reconnect Repository:**
   - Click **"Connect repository"**
   - Select **"Deploy with GitHub"**
   - Choose your repository: `richfrem/PlumbingPoC`
   - Select branch: `main`

4. **Configure Build Settings:**
   ```
   Build settings
   Runtime: Not set
   Base directory: /
   Package directory: packages/frontend
   Build command: npm install --include=dev && npx vitest run && npm --workspace=@plumbingpoc/frontend run build
   Publish directory: packages/frontend/dist/
   Functions directory: packages/backend/netlify/functions/
   Build status: Active
   ```

5. **Verify Environment Variables:**
   - Ensure all required environment variables are still configured
   - Check that sensitive variables (API keys, secrets) are intact

6. **Test Deployment:**
   - Push a small commit to trigger automatic deployment
   - Monitor the build logs for any issues
   - Verify the deployment completes successfully

### Common Reasons for Repository Relinking

- **Webhook Issues:** Automatic deployments not triggering
- **Repository Restructuring:** Major changes to repository structure
- **Branch Changes:** Switching deployment branches
- **Permission Issues:** Repository access problems
- **Configuration Reset:** Need to reset all build settings

### Prevention Tips

- **Regular Testing:** Periodically test automatic deployments with small commits
- **Webhook Monitoring:** Check GitHub repository webhooks if deployments stop
- **Documentation:** Keep build settings documented for quick reconfiguration
- **Backup Settings:** Screenshot or document current settings before major changes

## Links & References

### Official Netlify Documentation
- [Manage Dependencies](https://docs.netlify.com/configure-builds/manage-dependencies/) - Dependency installation patterns and NODE_ENV behavior
- [Build Configuration](https://docs.netlify.com/configure-builds/get-started/) - Build settings and directory configuration
- [File-based Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/) - netlify.toml syntax and options
- [Troubleshooting Tips](https://docs.netlify.com/configure-builds/troubleshooting-tips/) - Common build failures and solutions
- [Monorepos](https://docs.netlify.com/configure-builds/monorepos/) - Monorepo-specific configuration patterns
- [Serverless Functions](https://docs.netlify.com/functions/) - Function configuration and best practices

### npm Workspaces
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces) - Official npm workspaces guide
- [Workspace Commands](https://docs.npmjs.com/cli/v7/commands/npm-workspace) - npm workspace command reference

### Build Tools
- [Vite Configuration](https://vitejs.dev/config/) - Vite build configuration options
- [TypeScript Compiler](https://www.typescriptlang.org/docs/handbook/compiler-options.html) - tsc command line options
- [Vitest](https://vitest.dev/) - Testing framework configuration and usage
