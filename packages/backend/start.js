// packages/backend/start.js
import app from './api/server.js';
import dotenv from 'dotenv';
import { logger } from './src/lib/logger.js';

dotenv.config({ path: '../../.env' });

const PORT = process.env.BACKEND_PORT || 3000;

app.listen(PORT, () => {
  logger.log(`LOCAL DEV: API server running on http://localhost:${PORT}`);
});
