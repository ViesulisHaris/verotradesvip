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
    console.error('🚨 [DIAGNOSTIC] AuthContext is undefined - providing safe fallback to prevent gray screen');
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

export function AuthContextProviderDiagnostic({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const router = useRouter();

  // DIAGNOSTIC: Add provider instance ID to track double nesting
  const providerId = React.useRef(Math.random().toString(36).substr(2, 9));
  
  console.log('🔍 [DIAGNOSTIC] AuthContextProviderDiagnostic rendering', {
    providerId: providerId.current,
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined',
    loading,
    authInitialized,
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email
  });

  // DIAGNOSTIC: Check all possible localStorage keys Supabase might use
  const checkAllLocalStorageKeys = () => {
    if (typeof window !== 'undefined') {
      const allKeys = Object.keys(localStorage);
      const supabaseKeys = allKeys.filter(key => 
        key.includes('supabase') || key.includes('sb-') || key.includes('auth')
      );
      
      console.log('🔍 [DIAGNOSTIC] All localStorage keys:', {
        totalKeys: allKeys.length,
        allKeys: allKeys,
        supabaseKeys: supabaseKeys,
        supabaseKeyValues: supabaseKeys.reduce((acc, key) => {
          acc[key] = {
            hasValue: !!localStorage.getItem(key),
            valueLength: localStorage.getItem(key)?.length || 0,
            valuePreview: localStorage.getItem(key) ? `${localStorage.getItem(key)!.substring(0, 50)}...` : 'null'
          };
          return acc;
        }, {} as Record<string, any>)
      });
      
      return supabaseKeys;
    }
    return [];
  };

  // Simplified logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('🔍 [DIAGNOSTIC] Logout called');
      const supabase = getSupabaseClient();
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('🔍 [DIAGNOSTIC] Logout error:', error);
    } finally {
      console.log('🔍 [DIAGNOSTIC] Logout - clearing state');
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

  // DIAGNOSTIC: Simplified initialization logic to identify issues
  useEffect(() => {
    console.log('🔍 [DIAGNOSTIC] AuthContext useEffect starting', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined',
      currentStates: { loading, authInitialized, hasUser: !!user, hasSession: !!session }
    });

    // DIAGNOSTIC: Check localStorage first
    const localStorageKeys = checkAllLocalStorageKeys();

    // DIAGNOSTIC: Skip on server side - immediately mark as initialized
    if (typeof window === 'undefined') {
      console.log('🔍 [DIAGNOSTIC] Server-side detected - marking as initialized');
      setAuthInitialized(true);
      setLoading(false);
      return;
    }
    
    let isComponentMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initializeAuth = async () => {
      console.log('🔍 [DIAGNOSTIC] Starting auth initialization');
      
      try {
        // DIAGNOSTIC: Get Supabase client
        const supabase = getSupabaseClient();
        
        if (!supabase || !supabase.auth) {
          console.error('🔍 [DIAGNOSTIC] Supabase client not properly initialized');
          throw new Error('Supabase client not properly initialized');
        }
        
        console.log('🔍 [DIAGNOSTIC] Supabase client available:', {
          hasAuth: !!supabase.auth,
          clientUrl: supabase.supabaseUrl
        });
        
        // DIAGNOSTIC: Get current session with detailed logging
        console.log('🔍 [DIAGNOSTIC] Attempting to get session...');
        const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔍 [DIAGNOSTIC] Session fetch result:', {
          hasSession: !!fetchedSession,
          hasError: !!sessionError,
          error: sessionError?.message,
          sessionUser: fetchedSession?.user?.email,
          sessionExpiresAt: fetchedSession?.expires_at,
          timestamp: new Date().toISOString()
        });
        
        if (!isComponentMounted) return;
        
        // DIAGNOSTIC: Set auth state immediately
        if (sessionError) {
          console.log('🔍 [DIAGNOSTIC] Session error - using null session:', sessionError?.message);
          setSession(null);
          setUser(null);
        } else {
          console.log('🔍 [DIAGNOSTIC] Session found:', !!fetchedSession);
          setSession(fetchedSession);
          setUser(fetchedSession?.user ?? null);
        }
        
        // DIAGNOSTIC: Set up auth state listener
        console.log('🔍 [DIAGNOSTIC] Setting up auth state listener...');
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          (event: string, newSession: Session | null) => {
            console.log('🔍 [DIAGNOSTIC] Auth state changed', {
              providerId: providerId.current,
              event,
              hasNewSession: !!newSession,
              newUserEmail: newSession?.user?.email,
              timestamp: new Date().toISOString()
            });
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
          }
        );

        subscription = authSubscription;
        
        // DIAGNOSTIC: Mark as initialized
        console.log('✅ [DIAGNOSTIC] Auth initialization completed successfully');
        setAuthInitialized(true);
        setLoading(false);
        
      } catch (error) {
        console.error('🚨 [DIAGNOSTIC] Auth initialization error:', error);
        if (isComponentMounted) {
          setInitError(error instanceof Error ? error.message : 'Unknown error');
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // DIAGNOSTIC: Initialize auth immediately
    initializeAuth();

    return () => {
      console.log('🔍 [DIAGNOSTIC] AuthContext cleanup');
      isComponentMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // DIAGNOSTIC: Empty dependency array to prevent re-initialization
  
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