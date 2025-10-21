// packages/backend/api/config/supabase/database.js
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// In Netlify/production the environment variables are injected by the platform.
// For local development we try to load a .env file from the repository root.
// Avoid using `import.meta.url` here because some bundlers or runtime
// environments (Netlify Lambda) may not expose it in the bundled lambda,
// which causes fileURLToPath(undefined) runtime errors.
try {
  // Only attempt to load .env when the key env vars are missing (local dev)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Try multiple likely .env locations so starting from different cwd works
    const candidatePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '..', '.env'),
      path.resolve(process.cwd(), '..', '..', '.env'),
    ];

    let loaded = false;
    for (const p of candidatePaths) {
      try {
        dotenv.config({ path: p });
        if (process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY) {
          loaded = true;
          break;
        }
      } catch (e) {
        // ignore and try next
      }
    }

    if (!loaded) {
      try {
        dotenv.config();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not load .env using default dotenv behaviour');
      }
    }
  }
} catch (err) {
  // If anything goes wrong, continue and let the missing env vars be handled later.
  // eslint-disable-next-line no-console
  console.warn('Could not load .env from candidate paths:', err && err.message);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing. Check Netlify environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
