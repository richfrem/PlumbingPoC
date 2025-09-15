# Netlify Functions

This directory contains the serverless functions that power the PlumbingPOC application on Netlify.

## Overview

The application uses Netlify Functions to run the Express.js backend serverlessly. The main function is `api.mjs` which wraps the Express app using `serverless-http`.

## File Structure

- `api.mjs` - Main API function that handles all HTTP requests
- `send-sms.mjs` - SMS notification function for Twilio integration

## Module System

All functions use ES Modules (`.mjs` extension) to maintain consistency with the modern backend codebase. The functions are configured with external module dependencies to ensure proper serverless compatibility.

### Key Technical Decisions

1. **ESM Architecture**: Modern ES Modules throughout the entire backend for consistency and future-proofing.

2. **External Modules Configuration**: Netlify's bundler is configured via `netlify.toml` to treat complex Node.js packages (express, cors, serverless-http, etc.) as external dependencies rather than bundling them. This prevents bundling conflicts while maintaining runtime availability.

3. **Clean Function Wrappers**: Functions use standard ESM imports and exports, with the bundler configuration handling the complexity of external dependencies.

4. **Error Handling**: Functions include comprehensive error handling with proper HTTP status codes and JSON responses.

## Deployment

Functions are automatically deployed when code is pushed to the main branch. Netlify detects `.mjs` files in this directory and deploys them as serverless functions.

### Bundler Configuration

The functions use Netlify's esbuild bundler with special configuration in `netlify.toml`:

```toml
[functions]
  "api-mjs" = {
    external_node_modules = [
      "express",
      "cors",
      "serverless-http",
      "dotenv",
      "supabase",
      "@supabase/supabase-js"
    ]
  }
```

This configuration tells the bundler to not bundle these packages but instead make them available as external dependencies at runtime, preventing bundling conflicts while maintaining functionality.

## Environment Variables

Functions access environment variables set in the Netlify dashboard:
- `VITE_FRONTEND_BASE_URL` - CORS origin
- Database credentials (Supabase)
- API keys (OpenAI, Twilio, etc.)

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Usually indicates the function crashed during initialization. Check Netlify function logs for the exact error. Often related to bundling issues with external dependencies.

2. **Bundling Errors**: If you see errors about external modules, verify the `external_node_modules` configuration in `netlify.toml` includes all required packages.

3. **ESM Import Errors**: Ensure all backend files use consistent ES Modules syntax. The functions expect the backend to be ESM-compatible.

4. **Environment Variables**: Verify all required environment variables are set in Netlify dashboard. Functions access variables injected by Netlify at runtime.

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