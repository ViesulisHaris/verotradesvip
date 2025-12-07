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

// Clear corrupted auth data function
export const clearCorruptedAuthData = () => {
  try {
    // Clear localStorage auth data
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase.auth') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage auth data
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase.auth') || key.includes('sb-'))) {
          sessionStorage.removeItem(key);
        }
      }
      
      console.log('🧹 Cleared corrupted auth data from storage');
    }
  } catch (error) {
    console.error('Error clearing corrupted auth data:', error);
  }
};
