// packages/backend/api/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// dotenv is NO LONGER needed. The variables are injected by the environment.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing. Check Netlify environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;