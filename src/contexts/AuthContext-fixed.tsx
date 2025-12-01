'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthContextProviderFixed({ children }: AuthProviderProps) {
  console.log('🔧 [AuthContext-Fixed] Component mounting...');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('🔧 [AuthContext-Fixed] Starting logout...');
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAuthInitialized(true);
      setLoading(false);
      
      // Redirect to login page after successful logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('🔧 [AuthContext-Fixed] Logout error:', error);
    }
  };

  // Initialize authentication - FIXED VERSION
  useEffect(() => {
    console.log('🔧 [AuthContext-Fixed] useEffect triggered!');
    
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('🔧 [AuthContext-Fixed] Skipping auth initialization on server side');
      return;
    }
    
    console.log('🔧 [AuthContext-Fixed] Starting authentication initialization...');
    
    let isComponentMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initializeAuth = async () => {
      try {
        console.log('🔧 [AuthContext-Fixed] Getting Supabase client...');
        const supabase = getSupabaseClient();
        
        console.log('🔧 [AuthContext-Fixed] Getting current session...');
        // Get session without timeout to prevent race conditions
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isComponentMounted) {
          console.log('🔧 [AuthContext-Fixed] Component unmounted, stopping initialization');
          return;
        }
        
        console.log('🔧 [AuthContext-Fixed] Session result:', { session, error });
        
        // Direct state updates for better performance
        if (error) {
          console.error('🔧 [AuthContext-Fixed] Session error:', error);
          setSession(null);
          setUser(null);
        } else {
          console.log('🔧 [AuthContext-Fixed] Session found:', session ? 'Yes' : 'No');
          if (session) {
            console.log('🔧 [AuthContext-Fixed] User found:', session.user?.email);
          }
          setSession(session || null);
          setUser(session?.user ?? null);
        }
        
        // Mark auth as initialized immediately
        setAuthInitialized(true);
        setLoading(false);
        
        console.log('🔧 [AuthContext-Fixed] Setting up auth state listener...');
        // Set up auth listener with minimal updates
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          (event: string, session: Session | null) => {
            if (!isComponentMounted) {
              console.log('🔧 [AuthContext-Fixed] Auth state change ignored - component unmounted');
              return;
            }
             
            console.log('🔧 [AuthContext-Fixed] Auth state change:', event, 'Session:', session ? 'Present' : 'None');
           
            // Direct state updates
            setSession(session || null);
            setUser(session?.user ?? null);
            setAuthInitialized(true);
            setLoading(false);
          }
        );

        subscription = authSubscription;
        console.log('🔧 [AuthContext-Fixed] Authentication initialization completed successfully');
      } catch (error) {
        console.error('🔧 [AuthContext-Fixed] Auth initialization error:', error);
        // Ensure auth is marked as initialized even on error
        if (isComponentMounted) {
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // Initialize immediately without delay for better reliability
    initializeAuth();

    return () => {
      console.log('🔧 [AuthContext-Fixed] Cleaning up auth context...');
      isComponentMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // No dependencies - run once on mount
  
  const value: AuthContextType = {
    user,
    session,
    loading,
    authInitialized,
    logout,
  };

  console.log('🔧 [AuthContext-Fixed] Rendering AuthContext Provider with state:', { user: user?.email, session: !!session, loading, authInitialized });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}