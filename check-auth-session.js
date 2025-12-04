// Check authentication session status
console.log('🔍 [AUTH_SESSION_CHECK] Starting authentication session check...');

// Check localStorage for session data
const storageKeys = Object.keys(localStorage).filter(key => 
  key.includes('supabase') || key.includes('sb-') || key.includes('auth')
);

console.log('🔍 [AUTH_SESSION_CHECK] Storage keys found:', storageKeys);

storageKeys.forEach(key => {
  try {
    const value = localStorage.getItem(key);
    console.log(`🔍 [AUTH_SESSION_CHECK] ${key}:`, value ? 'PRESENT' : 'EMPTY', value?.substring(0, 50) + (value?.length > 50 ? '...' : ''));
  } catch (e) {
    console.warn(`🔍 [AUTH_SESSION_CHECK] Error reading ${key}:`, e);
  }
});

// Check sessionStorage
const sessionKeys = Object.keys(sessionStorage).filter(key => 
  key.includes('supabase') || key.includes('sb-') || key.includes('auth')
);

console.log('🔍 [AUTH_SESSION_CHECK] SessionStorage keys found:', sessionKeys);

sessionKeys.forEach(key => {
  try {
    const value = sessionStorage.getItem(key);
    console.log(`🔍 [AUTH_SESSION_CHECK] Session ${key}:`, value ? 'PRESENT' : 'EMPTY', value?.substring(0, 50) + (value?.length > 50 ? '...' : ''));
  } catch (e) {
    console.warn(`🔍 [AUTH_SESSION_CHECK] Error reading session ${key}:`, e);
  }
});

// Check if we can access Supabase client
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🔍 [AUTH_SESSION_CHECK] Supabase client available');
  
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('🔍 [AUTH_SESSION_CHECK] Session check result:', {
      hasSession: !!data.session,
      hasError: !!error,
      error: error?.message,
      userEmail: data.session?.user?.email,
      userId: data.session?.user?.id,
      timestamp: new Date().toISOString()
    });
    
    if (data.session?.user) {
      console.log('✅ [AUTH_SESSION_CHECK] User appears to be logged in');
    } else {
      console.log('❌ [AUTH_SESSION_CHECK] No active session found');
    }
  }).catch(err => {
    console.error('🔍 [AUTH_SESSION_CHECK] Session check failed:', err);
  });
} else {
  console.log('❌ [AUTH_SESSION_CHECK] Supabase client not available');
}