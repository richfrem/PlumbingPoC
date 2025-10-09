// packages/backend/api/config/supabase/database.js
import { createClient } from '@supabase/supabase-js';

// Load environment variables early for development
// This is safe - in production (Netlify), env vars are injected automatically
import dotenv from 'dotenv';
dotenv.config({ path: '../../../../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing. Check Netlify environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;