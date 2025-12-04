'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/supabase/client';
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
  
  if (context === undefined) {
    console.error('🚨 AuthContext is undefined - providing safe fallback to prevent gray screen');
    return {
      user: null,
      session: null,
      loading: false,
      authInitialized: true,
      hasUser: false,
      hasSession: false,
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
  const router = useRouter();

  console.log('🔍 [AUTH_DEBUG] AuthContextProviderSimple rendering', {
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
      console.error('🔧 [LOGOUT] Logout error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setAuthInitialized(true);
      setLoading(false);
      
      if (typeof window !== 'undefined' && router && router.replace) {
        router.replace('/login');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  // Simplified authentication initialization
  useEffect(() => {
    console.log('🔧 [SIMPLIFIED_AUTH] AuthContext useEffect starting', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined',
      currentStates: { loading, authInitialized, hasUser: !!user, hasSession: !!session }
    });

    // Skip on server side - immediately mark as initialized
    if (typeof window === 'undefined') {
      console.log('🔧 [SIMPLIFIED_AUTH] Server-side detected - marking as initialized');
      setAuthInitialized(true);
      setLoading(false);
      return;
    }
    
    // If already initialized, don't run again
    if (authInitialized) {
      console.log('🔧 [SIMPLIFIED_AUTH] Already initialized - skipping');
      return;
    }
    
    let isComponentMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initializeAuth = async () => {
      console.log('🔧 [SIMPLIFIED_AUTH] Starting simplified auth initialization');
      
      try {
        // Get Supabase client
        const supabase = getSupabaseClient();
        
        if (!supabase || !supabase.auth) {
          console.error('🔧 [SIMPLIFIED_AUTH] Supabase client not properly initialized');
          setAuthInitialized(true);
          setLoading(false);
          return;
        }
        
        // Get current session
        console.log('🔧 [SIMPLIFIED_AUTH] Fetching current session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔧 [SIMPLIFIED_AUTH] Session fetch result:', {
          hasSession: !!session,
          hasError: !!error,
          error: error?.message,
          userEmail: session?.user?.email
        });
        
        if (!isComponentMounted) return;
        
        // Set auth state immediately
        if (error) {
          console.log('🔧 [SIMPLIFIED_AUTH] Session error - using null session:', error?.message);
          setSession(null);
          setUser(null);
        } else {
          console.log('🔧 [SIMPLIFIED_AUTH] Session found:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Set up auth state listener
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          (event: string, newSession: Session | null) => {
            if (!isComponentMounted) return;
             
            console.log('🔍 [SIMPLIFIED_AUTH] Auth state changed', {
              event,
              hasNewSession: !!newSession,
              userEmail: newSession?.user?.email,
              timestamp: new Date().toISOString()
            });
             
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        );

        subscription = authSubscription;
        
        // Mark as initialized
        console.log('✅ [SIMPLIFIED_AUTH] Auth initialization completed successfully');
        setAuthInitialized(true);
        setLoading(false);
        
      } catch (error) {
        console.error('🚨 [SIMPLIFIED_AUTH] Auth initialization error:', error);
        if (isComponentMounted) {
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
    };
  }, []); // Empty dependency array to prevent re-initialization
  
  const value: AuthContextType = {
    user,
    session,
    loading,
    authInitialized,
    hasUser: !!user,
    hasSession: !!session,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}