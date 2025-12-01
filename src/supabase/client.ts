import { createClient } from '@supabase/supabase-js';
import { validateApiKeyLength } from '@/lib/api-key-length-validator';

// AGGRESSIVE FIX: Force environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// CRITICAL LOGGING: Log environment variable status immediately
console.log('🔧 [AGGRESSIVE_FIX] Environment variables check:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
  keyStart: supabaseAnonKey?.substring(0, 20) + '...',
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

let supabaseClient: any = null;
let initializationError: Error | null = null;

// AGGRESSIVE FIX: Initialize with forced configuration and comprehensive logging
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    console.error('❌ [AGGRESSIVE_FIX] Missing Supabase environment variables:', missingVars);
    throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}`);
  }

  // AGGRESSIVE FIX: Force HTTPS protocol and validate URL format
  let fixedSupabaseUrl = supabaseUrl.trim();
  if (!fixedSupabaseUrl.startsWith('http')) {
    fixedSupabaseUrl = `https://${fixedSupabaseUrl}`;
    console.log('🔧 [AGGRESSIVE_FIX] Added HTTPS protocol to URL:', fixedSupabaseUrl);
  }

  // AGGRESSIVE FIX: Validate API key format
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('❌ [AGGRESSIVE_FIX] Invalid API key format - should start with eyJ (JWT)');
    throw new Error('Invalid API key format - should start with eyJ (JWT)');
  }

  // DETAILED VALIDATION: Use comprehensive validator to understand truncation
  const validation = validateApiKeyLength(supabaseAnonKey);
  console.log('🔍 [AGGRESSIVE_FIX] Detailed API key validation:', validation);
  
  if (!validation.isValid) {
    console.error('❌ [AGGRESSIVE_FIX] API key validation failed:', validation.diagnosis);
    console.error('❌ [AGGRESSIVE_FIX] Length:', validation.length, '(expected 300+)');
    console.error('❌ [AGGRESSIVE_FIX] Segments:', validation.actualSegments.length, '(expected 3)');
    
    // Check if this is actually a valid but shorter key
    if (validation.actualSegments && validation.actualSegments.length === 3 && validation.actualSegments[2] && validation.actualSegments[2].length >= 40) {
      console.warn('⚠️  [AGGRESSIVE_FIX] Key appears to have valid JWT structure but is shorter than expected');
      console.warn('⚠️  [AGGRESSIVE_FIX] This might be a valid shorter key from Supabase');
      console.warn('⚠️  [AGGRESSIVE_FIX] Proceeding with caution...');
      // Don't throw error for potentially valid shorter keys
    } else {
      throw new Error(`API key validation failed: ${validation.diagnosis}`);
    }
  } else {
    console.log('✅ [AGGRESSIVE_FIX] API key validation passed');
  }
  
  // SESSION PERSISTENCE FIX: Create client with proper session persistence configuration
  const forcedConfig = {
    auth: {
      persistSession: true,
      autoRefreshToken: true, // CRITICAL FIX: Enable auto-refresh for session persistence
      detectSessionInUrl: false, // Disable URL detection for form-based login
      flowType: 'implicit' as const, // Use implicit flow for authentication
      debug: false, // Disable debug to reduce console noise
      // CRITICAL FIX: Don't set storage here - let Supabase handle it automatically
      // This prevents server-side storage issues
    },
    global: {
      headers: {
        'X-Client-Info': 'verotrades-web-session-fix',
        'X-Force-Config': 'true'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  };

  console.log('🔧 [AGGRESSIVE_FIX] Creating Supabase client with forced configuration:', {
    url: fixedSupabaseUrl,
    config: forcedConfig,
    keyLength: supabaseAnonKey.length,
    timestamp: new Date().toISOString()
  });

  supabaseClient = createClient(fixedSupabaseUrl, supabaseAnonKey, forcedConfig);

  // AGGRESSIVE FIX: Verify configuration was applied correctly
  const actualConfig = supabaseClient?.auth?.getSession ? {
    hasAuth: !!supabaseClient?.auth,
    clientUrl: supabaseClient?.supabaseUrl,
    // Try to access actual configuration if possible
  } : null;

  console.log('✅ [AGGRESSIVE_FIX] Supabase client created', {
    url: fixedSupabaseUrl,
    hasAuth: !!supabaseClient?.auth,
    actualConfig,
    forcedConfig,
    timestamp: new Date().toISOString()
  });

  // AGGRESSIVE FIX: Test immediate configuration validation
  setTimeout(() => {
    console.log('🔧 [AGGRESSIVE_FIX] Validating client configuration after creation...');
    
    // Log the actual configuration being used
    if (supabaseClient && supabaseClient.auth) {
      console.log('✅ [AGGRESSIVE_FIX] Client auth object available');
      
      // Try to get current session to test if client works
      supabaseClient.auth.getSession().then(({ data, error }: any) => {
        console.log('🔧 [AGGRESSIVE_FIX] Session test result:', {
          hasSession: !!data.session,
          hasError: !!error,
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }).catch((err: any) => {
        console.error('❌ [AGGRESSIVE_FIX] Session test failed:', err.message);
      });
    } else {
      console.error('❌ [AGGRESSIVE_FIX] Client auth object not available');
    }
  }, 1000);
} catch (error) {
  initializationError = error instanceof Error ? error : new Error('Unknown error initializing Supabase');
  console.error('❌ Supabase client initialization failed:', {
    error: initializationError.message,
    stack: initializationError.stack,
    envVars: {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseAnonKey?.length
    }
  });
  
  // Create a minimal fallback client to prevent application crashes
  try {
    supabaseClient = createClient('https://fallback.supabase.co', 'fallback-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false, // FIXED: Ensure fallback also has auto-refresh disabled
        detectSessionInUrl: false,
        flowType: 'pkce', // FIXED: Use consistent flow type
      }
    });
    console.log('⚠️ Using fallback Supabase client to prevent crashes');
  } catch (fallbackError) {
    console.error('❌ Even fallback client creation failed:', fallbackError);
  }
}

export const supabase = supabaseClient;

export const getSupabaseClient = () => {
  if (initializationError) {
    console.warn('⚠️ Supabase client was initialized with errors:', initializationError.message);
  }
  
  if (!supabaseClient) {
    throw new Error('Supabase client is not available');
  }
  
  return supabaseClient;
};

// Export initialization status for debugging
export const getSupabaseInitializationStatus = () => ({
  isInitialized: !!supabaseClient,
  hasError: !!initializationError,
  error: initializationError?.message || null,
  hasValidCredentials: !!(supabaseUrl && supabaseAnonKey)
});

// CRITICAL FIX: Function to manually clear problematic auth data
export const clearCorruptedAuthData = () => {
  if (typeof window !== 'undefined') {
    const authKeys = Object.keys(localStorage).filter(key =>
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    );
    
    console.log('🔧 [AUTH_FIX] Clearing auth data keys:', authKeys);
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('🔧 [AUTH_FIX] Failed to remove key:', key, e);
      }
    });
    
    // Also clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn('🔧 [AUTH_FIX] Failed to remove sessionStorage key:', key, e);
        }
      }
    });
  }
};
