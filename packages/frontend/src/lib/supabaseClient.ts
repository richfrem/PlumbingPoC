import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

logger.log('🔧 SupabaseClient: Initializing client...');
logger.log('🌐 Supabase URL:', supabaseUrl);
logger.log('🔑 Supabase Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

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

logger.log('✅ SupabaseClient: Client initialized successfully');
