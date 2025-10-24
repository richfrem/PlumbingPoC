# Netlify Deployment Guide

This document explains how the PlumbingPOC application is deployed to Netlify and the key configuration decisions made for serverless deployment.

## Overview

The application uses Netlify for both frontend hosting and backend serverless functions. The frontend is built with Vite and served as static files, while the backend Express.js API runs as serverless functions.

## Architecture

### Frontend Deployment
- **Framework**: Vite + React (TypeScript)
- **Build Command**: `npm run build`
- **Publish Directory**: `packages/frontend/dist`
- **Features**: Automatic deployments on main branch pushes

### Backend Deployment
- **Framework**: Express.js with ES Modules
- **Serverless Wrapper**: `serverless-http`
- **Function Location**: `packages/backend/netlify/functions/`
- **Key Files**:
  - `api.mjs` - Main API function
  - `send-sms.mjs` - SMS notification function

## Configuration Files

### netlify.toml

The main configuration file that tells Netlify how to build and deploy the application:

```toml
[build]
  base = "." # Repository root
  command = "npm run build"
  publish = "packages/frontend/dist/"
  functions = "packages/backend/netlify/functions/"
  environment = { NPM_FLAGS = "--legacy-peer-deps" }

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[functions]
  [functions."api-mjs"]
    external_node_modules = [
      "express",
      "cors",
      "serverless-http",
      "dotenv",
      "supabase",
      "@supabase/supabase-js"
    ]

  [functions."send-sms-mjs"]
    external_node_modules = ["twilio"]
```

### Key Configuration Decisions

#### 1. External Node Modules
The `external_node_modules` configuration is critical for serverless compatibility. It tells Netlify's bundler to NOT bundle these packages but instead make them available as external dependencies at runtime:

- **express**: The web framework - too complex to bundle effectively
- **cors**: Cross-origin middleware
- **serverless-http**: The wrapper that makes Express work with serverless
- **dotenv**: Environment variable loading
- **supabase/@supabase/supabase-js**: Database client libraries

This prevents bundling conflicts while ensuring the packages are available when the function runs.

#### 2. API Routing
The redirect rule `from = "/api/*" to = "/.netlify/functions/api/:splat"` routes all `/api/*` requests to the serverless function, maintaining a clean API URL structure.

#### 3. Build Environment
- `NPM_FLAGS = "--legacy-peer-deps"`: Ensures npm installs work despite peer dependency conflicts
- Base directory set to repository root for monorepo structure

## Environment Variables

The application requires these environment variables to be set in the Netlify dashboard:

### Required Variables
- `VITE_FRONTEND_BASE_URL` - Frontend URL for CORS
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key
- `VITE_SUPABASE_URL` - Frontend Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Frontend Supabase anonymous key

### Optional Variables
- `BACKEND_PORT` - Port for local development (defaults to 3000)
- `RESEND_API_KEY` - For email notifications
- `TWILIO_*` - For SMS notifications

## Deployment Process

1. **Automatic Deployment**: Pushes to the main branch trigger automatic builds
2. **Build Steps**:
   - Install dependencies with `npm install`
   - Build frontend with `npm run build`
   - Bundle serverless functions
   - Deploy to CDN

3. **Function Deployment**: Netlify automatically detects `.mjs` files in the functions directory and deploys them as serverless functions

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Check function logs in Netlify dashboard. Often related to bundling or environment variable issues.

2. **Build Failures**: Verify all dependencies are listed in the correct package.json files.

3. **Function Timeouts**: Serverless functions have a 10-second timeout limit. Optimize database queries and API calls.

### Debugging

- **Function Logs**: Available in Netlify dashboard under Functions → [function-name] → Function log
- **Build Logs**: Available in Netlify dashboard under Deploys → [deploy-hash] → Deploy log
- **Local Testing**: Use `netlify dev` for local function testing

## Performance Considerations

- **Cold Starts**: Serverless functions may have cold start delays (typically 100-500ms)
- **Bundle Size**: External modules reduce bundle size but increase cold start time slightly
- **Caching**: Static assets are cached on Netlify's CDN for optimal performance

## Security

- Environment variables are encrypted and only available at runtime
- Functions run in isolated environments
- CORS is properly configured for the frontend domain

## Related Documentation

- `packages/backend/netlify/functions/README.md` - Function-specific documentation
- `docs/NETLIFY_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Netlify Build Configuration: https://docs.netlify.com/configure-builds/overview/
