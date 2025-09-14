// packages/backend/netlify/functions/api.cjs

const serverless = require('serverless-http');
// This line imports the Express app you just refactored.
const app = require('../../api/server.js');

// This wraps your Express app for Netlify and exports it as a handler.
module.exports.handler = serverless(app);
