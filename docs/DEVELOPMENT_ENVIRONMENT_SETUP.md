# Development Environment Setup & Troubleshooting

## Overview

This document explains how the PlumbingPOC development environment is configured, how API requests are routed, and common troubleshooting steps.

## Architecture

### Local Development Stack

- **Frontend (Vite)**: `http://localhost:5173`
- **Backend (Express/Node)**: `http://localhost:3000`
- **Database**: Supabase (remote)

### API Request Flow in Development

The frontend uses **direct API calls** to the backend server, bypassing Vite's proxy:

```typescript
// packages/frontend/src/api/apiClient.ts
const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:3000/api' : '/api',
  // ...
});
```

**Key Points:**
- ✅ In **development** (`import.meta.env.DEV === true`): Requests go directly to `http://localhost:3000/api`
- ✅ In **production**: Requests go to `/api` (same origin as frontend)
- ✅ Authentication tokens are automatically injected via axios interceptor
- ⚠️ The Vite proxy configuration exists but is **not used** in development due to the direct baseURL

### Why This Matters

When debugging API issues:
1. The **backend server must be running** on port 3000
2. Vite proxy configuration is irrelevant for apiClient requests in dev mode
3. Check backend logs, not Vite proxy logs

## Starting the Development Environment

### Quick Start

```bash
# From project root
./startup.sh
```

This script:
1. Cleans up existing processes on ports 3000 and 5173
2. Starts backend server on port 3000
3. Starts frontend dev server on port 5173
4. Waits for both services to be ready

### Stopping Services

```bash
./shutdown.sh
```

## Environment Variables

### Required Variables

The backend requires these environment variables to start:

```bash
# Supabase Configuration (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>

# Application Ports
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

### Loading Environment Variables

The project uses a **root-level `.env` file** that all services load from:

```
PlumbingPOC/
  .env                    ← Single source of truth
  packages/
    backend/
      api/
        config/
          supabase/
            database.js   ← Loads from ../../../../.env
    frontend/
      vite.config.js      ← Loads from ../../.env
```

**Important ESM Pattern:**

```javascript
// packages/backend/api/config/supabase/database.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM modules don't have __dirname, must create it
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use path.resolve for reliable relative path resolution
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
```

⚠️ **Common Mistake:** Using string-based relative paths like `'../../../../.env'` directly in `dotenv.config()` can fail in ESM modules. Always use `path.resolve()` with `__dirname`.

## Common Issues & Troubleshooting

### Issue: "Failed to load invoice" (404 errors)

**Symptoms:**
```
GET http://localhost:5173/api/invoices/xxx 404 (Not Found)
Failed to load invoice: AxiosError
```

**Diagnosis Steps:**

1. **Check if backend is running:**
   ```bash
   lsof -i :3000
   ```
   Should show a `node` process.

2. **Test backend directly:**
   ```bash
   curl -i http://localhost:3000/api/invoices/some-id
   ```
   Should return `401 Unauthorized` (auth required, but proves endpoint exists).

3. **Check backend logs for errors:**
   - Look for "LOCAL DEV: API server running on http://localhost:3000"
   - Look for errors about missing environment variables

**Common Causes:**

| Symptom | Cause | Solution |
|---------|-------|----------|
| `lsof -i :3000` returns nothing | Backend didn't start | Check backend logs for errors |
| "Supabase URL or Service Role Key is missing" | Environment variables not loaded | Verify `.env` file exists and has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| Backend starts but crashes immediately | Error in `database.js` or other startup code | Check terminal output from `./startup.sh` |
| 404 on specific endpoint | Route not registered | Check `packages/backend/api/server.js` and route files |

### Issue: Backend Won't Start - Missing Environment Variables

**Error:**
```
Error: Supabase URL or Service Role Key is missing. Check Netlify environment variables.
    at database.js:13
```

**Solution:**

1. Verify `.env` file exists in project root:
   ```bash
   ls -la .env
   ```

2. Verify it contains required variables:
   ```bash
   grep SUPABASE .env
   ```

3. Check `database.js` is using correct path resolution:
   ```javascript
   // ✅ CORRECT
   const __dirname = path.dirname(fileURLToPath(import.meta.url));
   dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

   // ❌ WRONG (can fail in ESM)
   dotenv.config({ path: '../../../../.env' });
   ```

4. Restart servers:
   ```bash
   ./shutdown.sh && ./startup.sh
   ```

### Issue: Requests Working But Invoices Failing

**Observation:**
- GET `/api/requests` works fine
- GET `/api/invoices/:id` returns 404 or "Invoice not found"

**Likely Causes:**

1. **Backend not running** (most common)
   - Solution: `./startup.sh`

2. **Invoice route not registered**
   - Check: `packages/backend/api/server.js` has `app.use('/api', invoiceRoutes)`
   - Check: `packages/backend/api/routes/invoiceRoutes.js` exists and has GET route

3. **Supabase JOIN syntax failing** ⚠️ **CRITICAL**
   - **Problem:** Using simple table name in `.select()` for foreign key joins can fail
   - **Bad:**
     ```javascript
     .select('*, requests(customer_name, service_address)')
     ```
   - **Better:** Fetch data separately (more reliable):
     ```javascript
     // Fetch invoice first
     const { data: invoices } = await supabase
       .from('invoices')
       .select('*')
       .eq('id', id);
     
     // Then fetch related request separately
     if (invoices[0].request_id) {
       const { data: request } = await supabase
         .from('requests')
         .select('customer_name, service_address, user_id')
         .eq('id', invoices[0].request_id)
         .single();
       
       invoices[0].requests = request;
     }
     ```
   - **Best:** Use explicit foreign key constraint names (like requests controller does):
     ```javascript
     .select('*, requests!fk_invoices_request(customer_name, service_address)')
     ```
   - **Why:** Supabase's automatic FK detection can be unreliable, especially with newer tables
   - **How to find FK name:**
     ```sql
     SELECT constraint_name, column_name, foreign_table_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu 
       ON tc.constraint_name = kcu.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' 
       AND tc.table_name = 'invoices';
     ```

4. **Authentication middleware blocking requests**
   - Check: apiClient is including JWT token in headers
   - Check: Token is valid and not expired

### Issue: Changes to Backend Not Reflecting

**Problem:** Made changes to backend code but behavior hasn't changed.

**Solutions:**

1. **Restart backend:**
   ```bash
   ./shutdown.sh && ./startup.sh
   ```

2. **Check if old process is still running:**
   ```bash
   ps aux | grep node
   pkill -f "node.*server"
   ```

3. **Clear Node module cache** (rare):
   ```bash
   rm -rf node_modules/.cache
   ```

### Issue: Port Already in Use

**Error:**
```
✗ Port 3000 is still in use. Please free it manually.
```

**Solution:**

1. **Find process using port:**
   ```bash
   lsof -i :3000
   ```

2. **Kill specific process:**
   ```bash
   kill -9 <PID>
   ```

3. **Nuclear option - kill all node processes:**
   ```bash
   pkill -9 node
   ```

## Verification Checklist

After starting the development environment, verify:

- [ ] Backend server running: `lsof -i :3000` shows node process
- [ ] Frontend server running: `lsof -i :5173` shows node process
- [ ] Backend responding: `curl http://localhost:3000/api/health` (if health endpoint exists)
- [ ] Frontend accessible: Open `http://localhost:5173` in browser
- [ ] API requests working: Check browser Network tab for successful API calls

## Architecture Decisions

Related ADRs:
- [ADR-014: Pure ESM Strategy](../adrs/014-choice-of-pure-ESM-strategy.md) - Why we use ESM modules
- [ADR-015: Monorepo Structure](../adrs/015-choice-of-monorepo-structure.md) - Package organization
- [ADR-023: Backend Config Architecture](../adrs/023-choice-of-backend-config-architecture.md) - How configuration is loaded

## Additional Resources

- [Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md)
- [Netlify Troubleshooting](./NETLIFY_TROUBLESHOOTING.md)
- [Twilio & Netlify Setup](./TWILIO_AND_NETLIFY_SETUP.md)
