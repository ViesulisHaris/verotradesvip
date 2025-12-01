// Diagnostic script to validate Supabase authentication infinite loop assumptions
// Run this in the browser console to gather diagnostic information

console.log('🔍 [AUTH_DEBUG] Starting authentication loop diagnosis...');

// 1. Check Supabase client configuration
try {
  const { getSupabaseClient } = await import('/src/supabase/client.js');
  const supabase = getSupabaseClient();
  
  console.log('🔍 [AUTH_DEBUG] Supabase client configuration:', {
    url: supabase.supabaseUrl,
    authConfig: supabase.auth.config,
    hasAuth: !!supabase.auth,
    autoRefreshToken: supabase.auth.config?.autoRefreshToken,
    flowType: supabase.auth.config?.flowType,
    detectSessionInUrl: supabase.auth.config?.detectSessionInUrl,
    persistSession: supabase.auth.config?.persistSession
  });
} catch (error) {
  console.error('🔍 [AUTH_DEBUG] Error checking Supabase client:', error);
}

// 2. Check current session state
try {
  const { getSupabaseClient } = await import('/src/supabase/client.js');
  const supabase = getSupabaseClient();
  
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  console.log('🔍 [AUTH_DEBUG] Current session state:', {
    hasSession: !!sessionData?.session,
    sessionError: sessionError?.message,
    sessionUser: sessionData?.session?.user?.email,
    sessionExpiresAt: sessionData?.session?.expires_at
  });
} catch (error) {
  console.error('🔍 [AUTH_DEBUG] Error checking session:', error);
}

// 3. Check localStorage for Supabase data
console.log('🔍 [AUTH_DEBUG] localStorage contents:', {
  supabaseAuthKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth')),
  supabaseData: Object.keys(localStorage).reduce((acc, key) => {
    if (key.includes('supabase') || key.includes('auth')) {
      try {
        acc[key] = localStorage.getItem(key);
      } catch (e) {
        acc[key] = '[Error reading value]';
      }
    }
    return acc;
  }, {})
});

// 4. Monitor auto-refresh behavior
let refreshCount = 0;
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (args[0] && args[0].includes && args[0].includes('_autoRefreshTokenTick')) {
    refreshCount++;
    console.log('🔍 [AUTH_DEBUG] Auto-refresh tick detected:', {
      count: refreshCount,
      timestamp: new Date().toISOString(),
      message: args.join(' ')
    });
  }
  originalConsoleLog.apply(console, args);
};

// 5. Check for multiple AuthContext instances
console.log('🔍 [AUTH_DEBUG] Checking for multiple auth providers...');
setTimeout(() => {
  const authProviders = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
  console.log('🔍 [AUTH_DEBUG] Found auth-related elements:', authProviders.length);
  
  // Check React DevTools if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔍 [AUTH_DEBUG] React DevTools available - check for multiple AuthContext providers');
  }
}, 2000);

console.log('🔍 [AUTH_DEBUG] Diagnostic setup complete. Monitor console for auto-refresh patterns.');