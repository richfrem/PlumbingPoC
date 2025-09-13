// vite-app/netlify/functions/api.js

const serverless = require('serverless-http');
// This line imports the Express app you just refactored.
const app = require('../../../vite-app/api/server');

// This wraps your Express app for Netlify and exports it as a handler.
module.exports.handler = serverless(app);
