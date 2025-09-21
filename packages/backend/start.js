// packages/backend/start.js
import app from './api/server.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const PORT = process.env.BACKEND_PORT || 3000;

app.listen(PORT, () => {
  console.log(`LOCAL DEV: API server running on http://localhost:${PORT}`);
});