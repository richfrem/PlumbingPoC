// packages/backend/src/lib/logger.js
// Simple logger for backend - uses console.log directly
// since backend doesn't need environment-controlled logging like frontend

const logger = {
  log: (...args) => console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  info: (...args) => console.info('[INFO]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args)
};

export { logger };