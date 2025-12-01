'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient, clearCorruptedAuthData } from '@/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authInitialized: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Provide safe fallback instead of throwing error to prevent gray screen
  if (context === undefined) {
    console.error('🚨 AuthContext is undefined - providing safe fallback to prevent gray screen');
    console.trace('AuthContext undefined stack trace');
    return {
      user: null,
      session: null,
      loading: false,
      authInitialized: true,
      logout: async () => {}
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
  
  console.log('🔍 [AUTH_DEBUG] AuthContextProviderSimple rendering', {
    providerId: providerId.current,
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined',
    loading,
    authInitialized,
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email
  });

  // Simplified logout function
  const logout = async (): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
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

  // CRITICAL FIX: Completely rewritten initialization logic to prevent race conditions
  useEffect(() => {
    console.log('🔧 [SESSION_PERSISTENCE_FIX] AuthContext useEffect starting', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined',
      currentStates: { loading, authInitialized, hasUser: !!user, hasSession: !!session }
    });

    // CRITICAL FIX: Skip on server side - immediately mark as initialized
    if (typeof window === 'undefined') {
      console.log('🔧 [SESSION_PERSISTENCE_FIX] Server-side detected - marking as initialized');
      setAuthInitialized(true);
      setLoading(false);
      return;
    }
    
    // CRITICAL FIX: Use a ref to track initialization state and prevent multiple calls
    const initializationRef = React.useRef(false);
    
    // CRITICAL FIX: If already initialized, don't run again
    if (authInitialized || initializationRef.current) {
      console.log('🔧 [SESSION_PERSISTENCE_FIX] Already initialized - skipping');
      return;
    }
    
    let isComponentMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let initializationTimeout: NodeJS.Timeout | null = null;
    
    const initializeAuth = async () => {
      // CRITICAL FIX: Prevent multiple initialization attempts using ref
      if (initializationRef.current) {
        console.log('🔧 [SESSION_PERSISTENCE_FIX] Already initializing - skipping duplicate call');
        return;
      }
      
      initializationRef.current = true;
      console.log('🔧 [SESSION_PERSISTENCE_FIX] Starting auth initialization');
      
      try {
        // CRITICAL FIX: Force completion after 5 seconds to prevent hanging
        initializationTimeout = setTimeout(() => {
          if (isComponentMounted && !authInitialized) {
            console.warn('🚨 [SESSION_PERSISTENCE_FIX] Auth initialization timeout - forcing completion');
            setAuthInitialized(true);
            setLoading(false);
          }
        }, 5000);
        
        // Get Supabase client
        const supabase = getSupabaseClient();
        
        if (!supabase || !supabase.auth) {
          console.error('🔧 [SESSION_PERSISTENCE_FIX] Supabase client not properly initialized');
          throw new Error('Supabase client not properly initialized');
        }
        
        // CRITICAL FIX: Check localStorage first for existing session data
        let existingSessionData = null;
        try {
          const storageKey = 'sb-bzmixuxautbmqbrqtufx-auth-token';
          const storedData = localStorage.getItem(storageKey);
          if (storedData) {
            existingSessionData = JSON.parse(storedData);
            console.log('🔧 [SESSION_PERSISTENCE_FIX] Found existing session data in localStorage:', !!existingSessionData);
          }
        } catch (storageError) {
          console.warn('🔧 [SESSION_PERSISTENCE_FIX] Failed to read from localStorage:', storageError);
        }
        
        // CRITICAL FIX: Get current session with better error handling
        let session: Session | null = null;
        let error: any = null;
        
        try {
          const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
          session = fetchedSession;
          error = sessionError;
          
          console.log('🔧 [SESSION_PERSISTENCE_FIX] Session fetch result:', {
            hasSession: !!session,
            hasError: !!error,
            error: error?.message,
            userEmail: session?.user?.email
          });
        } catch (sessionFetchError) {
          console.warn('🔧 [SESSION_PERSISTENCE_FIX] Session fetch failed:', sessionFetchError);
          error = sessionFetchError;
          session = null;
        }
        
        if (!isComponentMounted) return;
        
        // CRITICAL FIX: Set auth state immediately
        if (error) {
          console.log('🔧 [SESSION_PERSISTENCE_FIX] Session error - using null session:', error?.message);
          setSession(null);
          setUser(null);
        } else {
          console.log('🔧 [SESSION_PERSISTENCE_FIX] Session found:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // CRITICAL FIX: Set up auth state listener BEFORE marking as initialized
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          (event: string, newSession: Session | null) => {
            if (!isComponentMounted) return;
              
            console.log('🔍 [SESSION_PERSISTENCE_FIX] Auth state changed', {
              providerId: providerId.current,
              event,
              hasNewSession: !!newSession,
              userEmail: newSession?.user?.email,
              timestamp: new Date().toISOString()
            });
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
          }
        );

        subscription = authSubscription;
        
        // CRITICAL FIX: Mark as initialized AFTER setting up listener and session
        console.log('✅ [SESSION_PERSISTENCE_FIX] Auth initialization completed successfully');
        setAuthInitialized(true);
        setLoading(false);
        
        // Clear timeout since we completed successfully
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
          initializationTimeout = null;
        }
        
      } catch (error) {
        console.error('🚨 [SESSION_PERSISTENCE_FIX] Auth initialization error:', error);
        if (isComponentMounted) {
          setInitError(error instanceof Error ? error.message : 'Unknown error');
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // Initialize auth immediately with a small delay to ensure DOM is ready
    const initDelay = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => {
      isComponentMounted = false;
      clearTimeout(initDelay);
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // CRITICAL FIX: Empty dependency array to prevent re-initialization

  // Simplified value - remove complex client checks
  const value: AuthContextType = {
    user,
    session,
    loading,
    authInitialized,
    logout,
  };

  // If there's an initialization error, still render children with safe fallback state
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}