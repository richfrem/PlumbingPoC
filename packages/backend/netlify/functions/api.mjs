// packages/backend/netlify/functions/api.mjs

// Use dynamic import to load the Express app
const appPromise = import('../../api/server.js');

export async function handler(event, context) {
  try {
    // Load the app dynamically
    const { default: app } = await appPromise;

    // Import serverless-http dynamically to avoid ESM issues
    const { default: serverless } = await import('serverless-http');

    // Create the handler
    const serverlessHandler = serverless(app);

    // Call the handler
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('Function initialization error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
}
