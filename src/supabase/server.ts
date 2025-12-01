import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Debug logging for environment variables
console.log('🔍 [DEBUG] Server-side Supabase environment check:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  nodeEnv: process.env.NODE_ENV,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables before creating client
if (!supabaseUrl) {
  console.error('❌ [ERROR] NEXT_PUBLIC_SUPABASE_URL is missing on server side');
  console.error('❌ [ERROR] Please check your .env file contains NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required. Please check your .env file contains NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('❌ [ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing on server side');
  console.error('❌ [ERROR] Please check your .env file contains NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please check your .env file contains NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('✅ [DEBUG] Creating server-side Supabase client with valid credentials');

// CRITICAL FIX: Match client-side configuration to prevent conflicts
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // MATCH CLIENT: Disable auto-refresh to prevent infinite loops
    detectSessionInUrl: false, // MATCH CLIENT: Disable URL detection for form-based login
    flowType: 'implicit', // CRITICAL FIX: Match client-side implicit flow
  },
});

// AGGRESSIVE FIX: Log server-side configuration for debugging
console.log('✅ [AGGRESSIVE_FIX] Server-side Supabase client created with configuration:', {
  url: supabaseUrl,
  config: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  timestamp: new Date().toISOString()
});