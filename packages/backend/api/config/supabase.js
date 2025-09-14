// packages/backend/api/config/supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// THE FIX: Just like in server.js, we simplify the dotenv configuration.
// We remove the complex pathing logic that relies on import.meta.url,
// as this is what crashes the Netlify function.
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing. Check your .env file and Netlify environment variables.");
}

// Create and export a single, shared Supabase client instance
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;