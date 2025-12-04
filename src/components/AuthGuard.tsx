'use client';

import React, { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const { user, loading, authInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // DIAGNOSTIC: Track AuthGuard instance and auth state
  const guardId = React.useRef(Math.random().toString(36).substr(2, 9));
  
  // CRITICAL FIX: Use refs to prevent infinite loops
  const hasRedirected = React.useRef(false);
  const lastAuthState = React.useRef({ user: null as any, loading: true, authInitialized: false });
  
  // CRITICAL FIX: Memoize auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    authInitialized,
    timestamp: new Date().toISOString()
  }), [user, loading, authInitialized]);
  
  console.log('🔍 [AUTH_GUARD_DEBUG] AuthGuard rendering', {
    guardId: guardId.current,
    pathname,
    requireAuth,
    authState
  });

  // CRITICAL FIX: Simplified auth handling with proper state tracking
  useEffect(() => {
    // Skip all logic for auth pages - handled in render logic below
    const isAuthPage = pathname === '/login' || pathname === '/register';
    if (isAuthPage) {
      console.log('🔍 [AUTH_GUARD_DEBUG] Auth page detected - skipping auth checks', {
        guardId: guardId.current,
        pathname,
        isAuthPage
      });
      return;
    }

    // CRITICAL FIX: Prevent infinite loops by checking if auth state actually changed
    const currentAuthState = { user, loading, authInitialized };
    const authStateChanged = JSON.stringify(currentAuthState) !== JSON.stringify(lastAuthState.current);
    
    if (!authStateChanged) {
      return;
    }
    
    // Update last auth state
    lastAuthState.current = currentAuthState;
    
    // CRITICAL FIX: Reset redirect flag when auth state changes significantly
    if (authInitialized && !loading) {
      hasRedirected.current = false;
    }

    const checkAuthAndRedirect = () => {
      // CRITICAL FIX: Prevent multiple redirects for the same auth state
      if (hasRedirected.current) {
        console.log('🔍 [AUTH_GUARD_DEBUG] Already redirected - preventing infinite loop', {
          guardId: guardId.current
        });
        return;
      }

      console.log('🔍 [AUTH_GUARD_DEBUG] Checking auth and redirecting', {
        guardId: guardId.current,
        requireAuth,
        hasUser: !!user,
        userEmail: user?.email,
        loading,
        authInitialized,
        shouldRedirectToLogin: requireAuth && !user && authInitialized && !loading
      });
      
      // CRITICAL FIX: Single, clear condition for redirecting to login
      // Only redirect if:
      // 1. Auth is required
      // 2. No user is authenticated
      // 3. Auth is initialized
      // 4. Not currently loading
      if (requireAuth && !user && authInitialized && !loading) {
        console.log('🔍 [AUTH_GUARD_DEBUG] Redirecting to login - auth required and user not authenticated', {
          guardId: guardId.current,
          reason: 'requireAuth && !user && authInitialized && !loading'
        });
        hasRedirected.current = true;
        router.replace('/login');
        return;
      }
    };

    // CRITICAL FIX: Only check auth if we're not in a loading state
    if (!loading || authInitialized) {
      checkAuthAndRedirect();
    }
  }, [user?.id, loading, authInitialized, requireAuth, pathname, router]); // Only depend on user.id to prevent unnecessary re-renders

  // CRITICAL FIX: Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Immediate rendering for auth pages to prevent gray screen
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) {
    return <>{children}</>;
  }

  // CRITICAL FIX: Simplified loading state logic
  // If auth is not initialized, show loader briefly
  if (requireAuth && !authInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '2rem',
          width: '2rem',
          borderBottom: '2px solid #B89B5E'
        }}></div>
        <div style={{ color: '#B89B5E', fontSize: '14px' }}>
          Initializing authentication...
        </div>
      </div>
    );
  }
  
  // CRITICAL FIX: Don't block rendering just because auth is loading
  // This prevents infinite loading states when authLoading gets stuck
  // We'll proceed with rendering and let the child components handle loading states

  // CRITICAL FIX: Clear rendering logic
  // 1. If auth is not required, always render children
  // 2. If auth is required and we have a user, render children
  // 3. If auth is required but we don't have a user, don't render (redirect will happen)
  if (!requireAuth || (requireAuth && user)) {
    return <>{children}</>;
  }

  // CRITICAL FIX: For the case where auth is required but user is null and we're still initializing
  // Return null to prevent rendering while redirect is being processed
  return null;
}