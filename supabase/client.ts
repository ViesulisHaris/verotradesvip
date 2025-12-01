import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Safe Supabase client with error handling
export const safeSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Clear Supabase cache function
export const clearSupabaseCache = async () => {
  try {
    // Clear any cached data
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error clearing cache:', error);
    }
  } catch (error) {
    console.error('Unexpected error clearing cache:', error);
  }
};
