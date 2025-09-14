# Netlify Deployment Troubleshooting Guide

This document chronicles the major issues encountered during Netlify deployment of the PlumbingPOC application and their solutions. It serves as a reference for future deployments and debugging.

## Overview

The PlumbingPOC application uses a monorepo structure with separate frontend and backend packages, deployed to Netlify with serverless functions. This architecture presents unique challenges for dependency resolution and module loading.

## Major Issues & Solutions

### Issue 1: Frontend Build Failures - MUI Dependency Resolution

**Problem:** Vite bundler failed to resolve Material-UI dependencies in the CI environment with errors like:
```
[ERROR] Failed to resolve import "@mui/material" from "packages/frontend/src/main.tsx"
```

**Root Cause:** In a monorepo setup, Vite's dependency resolution was confused by the nested package structure and hoisted dependencies.

**Solutions Applied:**
1. **Added explicit dependencies** to `packages/frontend/package.json` (initially)
2. **Consolidated dependencies** to root `package.json` for proper monorepo structure
3. **Added optimizeDeps configuration** in `vite.config.js`:
```javascript
optimizeDeps: {
  include: ['@mui/material', '@mui/system'],
},
```

**Prevention:** Always use root-level dependency management in monorepos. Avoid nested package.json files with overlapping dependencies.

### Issue 2: Serverless Function Crashes - import.meta.url Undefined

**Problem:** Netlify functions crashed with:
```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined
at fileURLToPath (node:internal/url:1507:11)
```

**Root Cause:** The server.js file used `import.meta.url` to dynamically load .env files, but this value is undefined in Netlify's serverless environment.

**Solution:** Simplified environment variable loading:
```javascript
// Before (problematic)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// After (working)
dotenv.config();
```

**Prevention:** Avoid using `import.meta.url` in serverless environments. Let dotenv handle .env file discovery automatically.

### Issue 3: ESM vs CommonJS Module Conflicts

**Problem:** Netlify functions initially used CommonJS syntax but the backend code was ESM, causing import failures.

**Root Cause:** Mixed module systems - backend using ES modules while functions used CommonJS require().

**Solution:** Migrated all Netlify functions to ESM:
- Renamed `api.cjs` → `api.mjs` and `send-sms.cjs` → `send-sms.mjs`
- Updated syntax from `require()`/`module.exports` to `import`/`export`

**Prevention:** Maintain consistent module system across the entire backend. Use ESM for modern Node.js applications.

### Issue 4: Environment Variable Loading in Serverless

**Problem:** Environment variables not loading correctly in Netlify functions during local development.

**Root Cause:** Complex path resolution for .env files that didn't work in serverless context.

**Solution:** Simplified to `dotenv.config()` which automatically finds .env files in the project root.

**Prevention:** Trust dotenv's automatic discovery. Avoid manual path construction for .env files.

## Build Process Issues

### Issue 5: Incorrect Function Paths

**Problem:** After monorepo restructuring, serverless functions couldn't find the server.js file.

**Root Cause:** Relative paths became incorrect after moving files around.

**Solution:** Updated import path in `api.mjs`:
```javascript
// Before
const app = require('../../../packages/backend/api/server.js');

// After
const app = require('../../api/server.js');
```

**Prevention:** Use relative paths that are stable within the package structure, not dependent on the overall monorepo layout.

## Testing & Development Issues

### Issue 6: Local Development Environment Conflicts

**Problem:** Supabase authentication redirects causing issues between local and production environments.

**Root Cause:** Site URL configuration in Supabase switching between `localhost:8888` and production URL.

**Solution:** Always check and update Supabase Site URL when switching between local development and production testing.

**Prevention:** Document environment-specific configurations clearly.

## Deployment Checklist

Before deploying to Netlify:

1. ✅ All dependencies consolidated in root `package.json`
2. ✅ Frontend `package.json` contains only build scripts
3. ✅ Backend `package.json` is minimal (only scripts)
4. ✅ All Netlify functions use `.mjs` extension and ESM syntax
5. ✅ Environment variables configured in Netlify dashboard
6. ✅ Vite config includes `optimizeDeps` for MUI
7. ✅ No dynamic `import.meta.url` usage in serverless code
8. ✅ Relative paths in functions are correct

## Key Architectural Decisions

1. **Monorepo Structure:** Single source of truth for dependencies at root level
2. **ESM Only:** Consistent ES modules across entire backend
3. **Environment Variables:** Automatic loading via dotenv without manual paths
4. **Dependency Optimization:** Explicit pre-bundling of problematic packages

## Monitoring & Debugging

- Check Netlify function logs for runtime errors
- Use `console.log` in functions for debugging (appears in logs)
- Test locally with `netlify dev` before deploying
- Verify environment variables are set correctly

## Prevention Strategies

1. **Dependency Management:** Always consolidate dependencies at root level in monorepos
2. **Module Systems:** Choose one module system (ESM) and stick with it
3. **Environment Handling:** Avoid dynamic path construction for config files
4. **Testing:** Test serverless functions locally before deployment
5. **Documentation:** Keep this troubleshooting guide updated with new issues

## Success Metrics

- ✅ Frontend builds successfully in CI
- ✅ Serverless functions start without crashes
- ✅ API endpoints respond correctly
- ✅ Environment variables load properly
- ✅ No module resolution errors

This guide should prevent future deployment issues and serve as a reference for maintaining the Netlify deployment.