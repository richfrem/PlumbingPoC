// /config/supabase.js
const { createClient } = require('@supabase/supabase-js');

// Load environment variables immediately
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing. Check your .env file.");
}

// Create and export a single, shared Supabase client instance
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;