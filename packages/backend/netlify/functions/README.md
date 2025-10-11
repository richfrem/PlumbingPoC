# Netlify Functions

This directory contains the serverless functions that power the PlumbingPOC application on Netlify.

## Overview

The application uses Netlify Functions to run the Express.js backend serverlessly. The main function is `api.mjs` which wraps the Express app using `serverless-http`. Additional specialized functions handle specific features like AI-powered quote assistance (`quote-agent.mjs`) and SMS notifications (`send-sms.mjs`).

## File Structure

- `api.mjs` - Main API function that handles all HTTP requests
- `quote-agent.mjs` - OpenAI Agent Toolkit function for intelligent quote assistance
- `send-sms.mjs` - SMS notification function for Twilio integration

## Module System

All functions use ES Modules (`.mjs` extension) to maintain consistency with the modern backend codebase. The functions are configured with external module dependencies to ensure proper serverless compatibility.

### Key Technical Decisions

1. **ESM Architecture**: Modern ES Modules throughout the entire backend for consistency and future-proofing.

2. **External Modules Configuration**: Netlify's bundler is configured via `netlify.toml` to treat complex Node.js packages (express, cors, serverless-http, etc.) as external dependencies rather than bundling them. This prevents bundling conflicts while maintaining runtime availability.

3. **AI Agent Functions**: Specialized functions like `quote-agent.mjs` use the OpenAI Agents SDK to execute YAML-defined agent workflows. These functions load agent configurations from the `agents/` directory and provide secure, server-side AI execution without exposing API keys to the frontend.

4. **Clean Function Wrappers**: Functions use standard ESM imports and exports, with the bundler configuration handling the complexity of external dependencies.

5. **Error Handling**: Functions include comprehensive error handling with proper HTTP status codes and JSON responses.

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

  "quote-agent-mjs" = {
    external_node_modules = [
      "@openai/agents",
      "yaml"
    ]
  }
```

This configuration tells the bundler to not bundle these packages but instead make them available as external dependencies at runtime, preventing bundling conflicts while maintaining functionality. The `quote-agent` function requires the OpenAI Agents SDK and YAML parser as external dependencies.

## Environment Variables

Functions access environment variables set in the Netlify dashboard:
- `VITE_FRONTEND_BASE_URL` - CORS origin
- Database credentials (Supabase)
- `OPENAI_API_KEY` - Required for AI agent functions
- API keys (Twilio, etc.)

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Usually indicates the function crashed during initialization. Check Netlify function logs for the exact error. Often related to bundling issues with external dependencies.

2. **Bundling Errors**: If you see errors about external modules, verify the `external_node_modules` configuration in `netlify.toml` includes all required packages.

3. **Agent Function Errors**: For `quote-agent.mjs`, ensure the `agents/quote-agent.yaml` file exists and is valid YAML. Check that `OPENAI_API_KEY` is properly set.

4. **ESM Import Errors**: Ensure all backend files use consistent ES Modules syntax. The functions expect the backend to be ESM-compatible.

5. **Environment Variables**: Verify all required environment variables are set in Netlify dashboard. Functions access variables injected by Netlify at runtime.

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