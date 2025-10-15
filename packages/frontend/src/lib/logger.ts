/**
 * Centralized logging utility with environment-based control
 * Only logs when VITE_ENABLE_CONSOLE_LOGGING is set to 'true'
 */

const isLoggingEnabled = import.meta.env.VITE_ENABLE_CONSOLE_LOGGING === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.error(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.warn(...args);
    }
  },

  info: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.debug(...args);
    }
  }
};

// Export individual functions for convenience
export const log = logger.log;
export const error = logger.error;
export const warn = logger.warn;
export const info = logger.info;
export const debug = logger.debug;
