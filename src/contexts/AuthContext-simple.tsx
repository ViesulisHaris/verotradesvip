'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, clearCorruptedAuthData } from '../supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authInitialized: boolean;
  hasUser: boolean;
  hasSession: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  
  // CRITICAL FIX: Proper SSR handling - only check for undefined on client side
  const isClient = typeof window !== 'undefined';
  
  if (context === undefined) {
    // Only log error on client side to avoid SSR issues
    if (isClient) {
      console.error('🚨 AuthContext is undefined - providing safe fallback to prevent gray screen', {
        hasProvider: !!React.useContext(AuthContext),
        providerStack: new Error().stack,
        timestamp: new Date().toISOString()
      });
    }
    
    // CRITICAL FIX: Provide a working fallback that allows the app to function
    // This prevents the gray screen and allows basic functionality
    return {
      user: null,
      session: null,
      loading: false, // CRITICAL FIX: Don't show loading on fallback to prevent infinite loops
      authInitialized: isClient, // Mark as initialized on client side
      hasUser: false,
      hasSession: false,
      logout: async () => {
        // Try to redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    };
  }
  
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthContextProviderSimple({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const router = useRouter();

  // CRITICAL FIX: Use a stable provider ID to prevent hydration mismatches
  const providerId = React.useRef('auth-provider-simple');
  
  // CRITICAL FIX: Add isClient state to ensure proper SSR hydration
  const [isClient, setIsClient] = useState(false);
  
  console.log('🔍 [AUTH_DEBUG] AuthContextProviderSimple rendering - START', {
    providerId: providerId.current,
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined',
    isClientState: isClient,
    loading,
    authInitialized,
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email,
    hasChildren: !!children,
    // CRITICAL: Track if this is root or auth layout provider
    isRootLayout: typeof window !== 'undefined' && window.location.pathname === '/',
    isAuthLayout: typeof window !== 'undefined' && (window.location.pathname.includes('/login') || window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/trades'))
  });

  // Simplified logout function
  const logout = async (): Promise<void> => {
    try {
      let supabaseClient;
      try {
        supabaseClient = supabase;
      } catch (error) {
        console.error('🔧 [LOGOUT] Error getting Supabase client:', error);
        // Continue with logout even if Supabase client fails
      }
      
      if (supabase && supabase.auth) {
        await supabaseClient.auth.signOut();
      }
    } catch (error) {
      console.error('🔧 [LOGOUT] Logout error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setAuthInitialized(true);
      setLoading(false);
      
      // CRITICAL FIX: Use Next.js router instead of window.location to prevent location error
      if (typeof window !== 'undefined' && router && router.replace) {
        router.replace('/login');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  // CRITICAL FIX: Simplified and reliable initialization logic with stable hooks
  const isComponentMounted = React.useRef(true);
  const subscription = React.useRef<{ unsubscribe: () => void } | null>(null);
  const initTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = React.useRef(false);
  
  // CRITICAL FIX: Set isClient state immediately on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] AuthContext useEffect starting', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined',
      isClientState: isClient,
      currentStates: { loading, authInitialized, hasUser: !!user, hasSession: !!session },
      providerId: providerId.current,
      hasInitialized: hasInitialized.current
    });

    // CRITICAL FIX: Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Already initialized - skipping', {
        providerId: providerId.current
      });
      return;
    }

    // CRITICAL FIX: Wait for client-side hydration before initializing
    if (!isClient) {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Waiting for client-side hydration', {
        providerId: providerId.current,
        isClientState: isClient
      });
      return;
    }
    
    console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Client-side detected - proceeding with initialization', {
      providerId: providerId.current,
      isClientState: isClient
    });
    
    // CRITICAL DIAGNOSTIC: Check if we should skip initialization
    if (authInitialized) {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Already initialized - DIAGNOSTIC CHECK', {
        hasUser: !!user,
        hasSession: !!session,
        userEmail: user?.email,
        shouldForceReinit: !user && !session // Force re-init if no auth data
      });
      
      // CRITICAL FIX: Only skip if we actually have auth data, otherwise re-initialize
      if (user || session) {
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Skipping - has valid auth data');
        return;
      } else {
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Forcing re-initialization - no auth data found');
        // Reset state to force re-initialization
        setAuthInitialized(false);
        setLoading(true);
      }
    }

    // SIMPLIFIED FIX: Remove complex timeout logic that interferes with natural session restoration
    // Let Supabase handle session persistence naturally without forced timeouts
    console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Initialization setup complete - proceeding with natural auth flow');
    
    const initializeAuth = async () => {
      try {
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Starting auth initialization');
        
        // CRITICAL FIX: ONLY clear auth data if there's evidence of corruption
        // Don't clear valid sessions on every initialization
        try {
          const localStorageKeys = Object.keys(localStorage);
          const hasSupabaseData = localStorageKeys.some(key =>
            key.includes('supabase') || key.includes('sb-') || key.includes('auth')
          );
          
          // Only clear if we have data but it's causing issues (corrupted session detection)
          if (hasSupabaseData) {
            console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Found existing auth data - attempting to validate before clearing');
            
            // Try to get session first to see if data is valid
            const testSupabase = supabase;
            if (testSupabase && testSupabase.auth) {
              try {
                const { data: { session }, error } = await testSupabase.auth.getSession();
                if (error && error.message.includes('Invalid')) {
                  console.warn('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Detected corrupted session data - clearing');
                  clearCorruptedAuthData();
                } else {
                  console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Existing auth data appears valid - preserving');
                }
              } catch (testError) {
                console.warn('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Error testing existing auth data:', testError);
                // Only clear if we can't even test the data
                clearCorruptedAuthData();
              }
            }
          }
        } catch (clearError) {
          console.warn('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Error in auth data validation:', clearError);
        }
        
        // Get Supabase client
        const supabaseClient = supabase;
        
        if (!supabaseClient || !supabaseClient.auth) {
          console.error('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Supabase client not properly initialized');
          if (isComponentMounted.current) {
            setInitError('Supabase client initialization failed');
            setAuthInitialized(true);
            setLoading(false);
            hasInitialized.current = true;
          }
          return;
        }
        
        // CRITICAL FIX: Add retry logic for session fetching
        let retryCount = 0;
        const maxRetries = 3;
        let currentSession = null;
        let sessionError = null;
        
        while (retryCount < maxRetries) {
          try {
            console.log(`🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Fetching session attempt ${retryCount + 1}/${maxRetries}`, {
              providerId: providerId.current,
              hasSupabaseClient: !!supabaseClient,
              hasAuth: !!(supabaseClient && supabaseClient.auth)
            });
            
            const sessionFetchStart = Date.now();
            const result = await supabaseClient.auth.getSession();
            const sessionFetchTime = Date.now() - sessionFetchStart;
            
            currentSession = result.data.session;
            sessionError = result.error;
            
            console.log(`🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session fetch result ${retryCount + 1}/${maxRetries}`, {
              providerId: providerId.current,
              fetchTime: sessionFetchTime,
              hasSession: !!currentSession,
              hasError: !!sessionError,
              errorMessage: sessionError?.message
            });
            
            // If successful or error is not network-related, break
            if (currentSession || !sessionError || !sessionError.message.includes('network')) {
              break;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            }
          } catch (retryError) {
            console.warn(`🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session fetch attempt ${retryCount + 1} failed:`, retryError);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            }
          }
        }
        
        if (!isComponentMounted.current) return;
        
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session fetch result:', {
          hasSession: !!currentSession,
          hasError: !!sessionError,
          error: sessionError?.message,
          userEmail: currentSession?.user?.email,
          retryCount
        });
        
        // Set initial auth state
        if (sessionError) {
          console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session error - using null session:', sessionError?.message);
          setSession(null);
          setUser(null);
          setInitError(sessionError.message);
        } else {
          console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session found:', !!currentSession);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setInitError(null);
        }
        
        // Set up auth state listener with CRITICAL FIX for state synchronization
        const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(
          (event: string, newSession: Session | null) => {
            if (!isComponentMounted.current) return;
             
            console.log('🔍 [AUTH_CONTEXT_HYDRATION_DEBUG] Auth state changed', {
              providerId: providerId.current,
              event,
              hasNewSession: !!newSession,
              userEmail: newSession?.user?.email,
              timestamp: new Date().toISOString()
            });
             
            // CRITICAL FIX: Use setTimeout to ensure state updates are properly synchronized
            // This prevents race conditions with AuthGuard checks
            setTimeout(() => {
              if (!isComponentMounted.current) return;
              
              console.log('🔍 [AUTH_CONTEXT_HYDRATION_DEBUG] Updating auth state after delay', {
                providerId: providerId.current,
                event,
                hasNewSession: !!newSession,
                userEmail: newSession?.user?.email,
                timestamp: new Date().toISOString()
              });
              
              // CRITICAL FIX: Log session persistence details
              if (newSession) {
                console.log('✅ [SESSION_PERSISTENCE] Session restored successfully', {
                  providerId: providerId.current,
                  userId: newSession.user?.id,
                  userEmail: newSession.user?.email,
                  expiresAt: newSession.expires_at ? new Date(newSession.expires_at * 1000).toISOString() : null,
                  hasAccessToken: !!newSession.access_token,
                  hasRefreshToken: !!newSession.refresh_token,
                  timestamp: new Date().toISOString()
                });
                
                // CRITICAL FIX: Verify localStorage has session data
                if (typeof window !== 'undefined') {
                  const localStorageKeys = Object.keys(localStorage);
                  const supabaseKeys = localStorageKeys.filter(key =>
                    key.includes('supabase') || key.includes('sb-') || key.includes('auth')
                  );
                  console.log('🔍 [SESSION_PERSISTENCE] LocalStorage verification', {
                    totalKeys: localStorageKeys.length,
                    supabaseKeys: supabaseKeys.length,
                    supabaseKeyNames: supabaseKeys,
                    hasSessionData: supabaseKeys.length > 0,
                    timestamp: new Date().toISOString()
                  });
                }
              } else {
                console.log('❌ [SESSION_PERSISTENCE] Session lost or null', {
                  providerId: providerId.current,
                  event,
                  timestamp: new Date().toISOString()
                });
              }
              
              setSession(newSession);
              setUser(newSession?.user ?? null);
              setAuthInitialized(true);
              setLoading(false);
            }, 5); // Minimal delay for state synchronization
          }
        );

        subscription.current = authSubscription;
        
        // Mark as initialized
        console.log('✅ [AUTH_CONTEXT_HYDRATION_DEBUG] Auth initialization completed successfully', {
          providerId: providerId.current,
          hasSession: !!currentSession,
          userEmail: currentSession?.user?.email
        });
        setAuthInitialized(true);
        setLoading(false);
        hasInitialized.current = true;
        
      } catch (error) {
        console.error('🚨 [AUTH_CONTEXT_HYDRATION_DEBUG] Auth initialization error:', error);
        if (isComponentMounted.current) {
          setInitError(error instanceof Error ? error.message : 'Unknown error');
          setAuthInitialized(true);
          setLoading(false);
          hasInitialized.current = true;
        }
      }
    };

    // Initialize auth immediately
    initializeAuth();

    return () => {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Cleanup - unsubscribing from auth changes');
      isComponentMounted.current = false;
      if (subscription.current) {
        subscription.current.unsubscribe();
        subscription.current = null;
      }
      // Mark as not initialized for potential re-initialization
      hasInitialized.current = false;
    };
  }, [isClient]); // Only re-run when isClient state changes
  
  // Simplified value - remove complex client checks
  const value: AuthContextType = {
    user,
    session,
    loading,
    authInitialized,
    hasUser: !!user,
    hasSession: !!session,
    logout,
  };

  // If there's an initialization error, still render children with safe fallback state
  console.log('🔍 [AUTH_DEBUG] AuthContextProviderSimple rendering Provider', {
    providerId: providerId.current,
    timestamp: new Date().toISOString(),
    value: {
      hasUser: !!value.user,
      hasSession: !!value.session,
      loading: value.loading,
      authInitialized: value.authInitialized
    }
  });
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
