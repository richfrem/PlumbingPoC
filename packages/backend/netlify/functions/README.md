# Netlify Functions

This directory contains the serverless functions that power the PlumbingPOC application on Netlify.

## Overview

The application uses Netlify Functions to run the Express.js backend serverlessly. The main function is `api.mjs` which wraps the Express app using `serverless-http`.

## File Structure

- `api.mjs` - Main API function that handles all HTTP requests
- `send-sms.mjs` - SMS notification function for Twilio integration

## Module System

All functions use ES Modules (`.mjs` extension) to maintain consistency with the backend codebase. This was chosen after extensive troubleshooting with CommonJS/ESM interoperability issues.

### Key Technical Decisions

1. **ESM over CommonJS**: Despite Netlify's CommonJS preference, we use ESM to avoid module system conflicts between the Express server (ESM) and serverless functions.

2. **Dynamic Imports**: The `api.mjs` uses dynamic imports to load the Express app and `serverless-http` at runtime, preventing bundling issues.

3. **Error Handling**: Functions include comprehensive error handling with proper HTTP status codes and JSON responses.

## Deployment

Functions are automatically deployed when code is pushed to the main branch. Netlify detects `.mjs` files in this directory and deploys them as serverless functions.

## Environment Variables

Functions access environment variables set in the Netlify dashboard:
- `VITE_FRONTEND_BASE_URL` - CORS origin
- Database credentials (Supabase)
- API keys (OpenAI, Twilio, etc.)

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Usually indicates the function crashed during initialization. Check Netlify function logs for the exact error.

2. **ESM/CommonJS Conflicts**: If you encounter module loading errors, ensure all backend files use consistent import/export syntax.

3. **Environment Variables**: Verify all required environment variables are set in Netlify dashboard.

### Function Logs

To debug issues:
1. Go to Netlify dashboard → Functions
2. Click on the function (api-mjs)
3. View the "Function log" panel
4. Trigger requests to see real-time logs

### Local Development

Use `netlify dev` for local testing:
```bash
npm install -g netlify-cli
netlify dev
```

Functions will be available at `http://localhost:8888/.netlify/functions/api`

## Maintenance

When modifying functions:
1. Test locally with `netlify dev`
2. Check function logs after deployment
3. Ensure all imports work in the serverless environment
4. Keep error handling comprehensive

## Related Documentation

- `docs/NETLIFY_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- `docs/SMS_TROUBLESHOOTING.md` - SMS-specific issues
- Netlify Functions documentation: https://docs.netlify.com/functions/overview/