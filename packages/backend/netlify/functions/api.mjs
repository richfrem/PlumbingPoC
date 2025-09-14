// packages/backend/netlify/functions/api.mjs

import serverless from 'serverless-http';
import app from '../../api/server.js';

// This wraps your Express app for Netlify and exports it as a handler.
export const handler = serverless(app);
