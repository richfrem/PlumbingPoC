import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 20 // Further increased for reliable real-time updates
    },
    heartbeatIntervalMs: 15000, // Reduced to 15 seconds for better connection
    reconnectAfterMs: (tries: number) => Math.min(tries * 500, 10000) // Faster reconnection
  }
});
