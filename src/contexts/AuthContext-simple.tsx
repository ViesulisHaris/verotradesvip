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
      loading: !isClient, // Only show loading on server side
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

  // CRITICAL DIAGNOSTIC: Add provider instance ID to track double nesting
  const providerId = React.useRef(Math.random().toString(36).substr(2, 9));
  
  console.log('🔍 [AUTH_DEBUG] AuthContextProviderSimple rendering - START', {
    providerId: providerId.current,
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined',
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

  // CRITICAL FIX: Simplified and reliable initialization logic
  useEffect(() => {
    console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] AuthContext useEffect starting', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined',
      currentStates: { loading, authInitialized, hasUser: !!user, hasSession: !!session }
    });

    // CRITICAL FIX: Skip entirely on server side - mark as initialized immediately
    if (typeof window === 'undefined') {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Server-side detected - marking as initialized');
      setAuthInitialized(true);
      setLoading(false);
      return;
    }
    
    // CRITICAL FIX: If already initialized, don't run again
    if (authInitialized) {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Already initialized - skipping');
      return;
    }

    // CRITICAL FIX: Force initialization after a timeout to prevent hanging
    const initTimeout = setTimeout(() => {
      console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Forcing initialization due to timeout', {
        timestamp: new Date().toISOString(),
        currentStates: { loading, authInitialized, hasUser: !!user, hasSession: !!session }
      });
      
      if (isComponentMounted) {
        setAuthInitialized(true);
        setLoading(false);
      }
    }, 500); // CRITICAL FIX: Reduced timeout to 500ms for immediate form rendering
    
    let isComponentMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initializeAuth = async () => {
      try {
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Starting auth initialization');
        
        // CRITICAL FIX: Force immediate initialization to prevent hanging
        if (isComponentMounted) {
          setAuthInitialized(true);
          setLoading(false);
        }
        
        // Get Supabase client
        const supabaseClient = supabase;
        
        if (!supabaseClient || !supabaseClient.auth) {
          console.error('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Supabase client not properly initialized');
          if (isComponentMounted) {
            setAuthInitialized(true);
            setLoading(false);
          }
          return;
        }
        
        // Get current session
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Fetching current session...');
        const { data: { session: currentSession }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (!isComponentMounted) return;
        
        console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session fetch result:', {
          hasSession: !!currentSession,
          hasError: !!sessionError,
          error: sessionError?.message,
          userEmail: currentSession?.user?.email
        });
        
        // Set initial auth state
        if (sessionError) {
          console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session error - using null session:', sessionError?.message);
          setSession(null);
          setUser(null);
        } else {
          console.log('🔧 [AUTH_CONTEXT_HYDRATION_DEBUG] Session found:', !!currentSession);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
        
        // Set up auth state listener with CRITICAL FIX for state synchronization
        const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(
          (event: string, newSession: Session | null) => {
            if (!isComponentMounted) return;
             
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
              if (!isComponentMounted) return;
              
              console.log('🔍 [AUTH_CONTEXT_HYDRATION_DEBUG] Updating auth state after delay', {
                providerId: providerId.current,
                event,
                hasNewSession: !!newSession,
                userEmail: newSession?.user?.email,
                timestamp: new Date().toISOString()
              });
              
              setSession(newSession);
              setUser(newSession?.user ?? null);
              setAuthInitialized(true);
              setLoading(false);
            }, 10); // CRITICAL FIX: Reduced delay to 10ms for immediate form rendering
          }
        );

        subscription = authSubscription;
        
        // Mark as initialized
        console.log('✅ [AUTH_CONTEXT_HYDRATION_DEBUG] Auth initialization completed successfully');
        setAuthInitialized(true);
        setLoading(false);
        
      } catch (error) {
        console.error('🚨 [AUTH_CONTEXT_HYDRATION_DEBUG] Auth initialization error:', error);
        if (isComponentMounted) {
          setInitError(error instanceof Error ? error.message : 'Unknown error');
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // Initialize auth immediately
    initializeAuth();

    return () => {
      isComponentMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      // CRITICAL FIX: Clear initialization timeout
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, []); // Empty dependency array to prevent re-initialization
  
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
