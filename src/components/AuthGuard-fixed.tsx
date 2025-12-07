'use client';

import React, { useEffect } from 'react';
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
  
  // CRITICAL FIX: Move useRef to component top level (not inside useEffect)
  const hasRedirected = React.useRef(false);
  
  console.log('🔍 [AUTH_GUARD_DEBUG] AuthGuard rendering', {
    guardId: guardId.current,
    pathname,
    requireAuth,
    authState: {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      authInitialized,
      timestamp: new Date().toISOString()
    }
  });

  // CRITICAL FIX: Prevent infinite re-renders with proper dependency management
  const authCheckComplete = React.useMemo(() => {
    return authInitialized && (requireAuth ? !!user : true);
  }, [authInitialized, user, requireAuth]);

  // CRITICAL FIX: Simplified auth handling without invalid hook calls
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

    // CRITICAL FIX: Check auth immediately but prevent infinite loops
    // Only check if conditions are met and we haven't already redirected
    const checkAuthAndRedirect = () => {
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
        shouldRedirectToLogin: requireAuth && !user && authInitialized && !loading,
        shouldRedirectToLoginAlt: requireAuth && !user && authInitialized
      });
      
      // Check if authentication is required and user is not logged in
      if (requireAuth && !user && authInitialized && !loading) {
        console.log('🔍 [AUTH_GUARD_DEBUG] Redirecting to login - auth required and user not authenticated', {
          guardId: guardId.current,
          reason: 'requireAuth && !user && authInitialized && !loading'
        });
        hasRedirected.current = true;
        router.replace('/login');
        return;
      }
      
      // Additional check for when auth is initialized but user is null
      if (requireAuth && !user && authInitialized) {
        console.log('🔍 [AUTH_GUARD_DEBUG] Redirecting to login - auth initialized but no user', {
          guardId: guardId.current,
          reason: 'requireAuth && !user && authInitialized'
        });
        hasRedirected.current = true;
        router.replace('/login');
        return;
      }
    };

    // CRITICAL FIX: Check auth immediately without artificial delay
    // But prevent infinite loops with proper state tracking
    checkAuthAndRedirect();
  }, [authCheckComplete, pathname, router, user, loading, authInitialized]);

  // CRITICAL FIX: Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Immediate rendering for auth pages to prevent gray screen
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For protected pages that require auth, be more aggressive about redirecting
  if (requireAuth && !authCheckComplete) {
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

  // CRITICAL FIX: Always render children if auth is initialized and we're not requiring auth
  // This ensures strategies page shows even when user is not authenticated
  if (authInitialized && !requireAuth) {
    return <>{children}</>;
  }

  // Always render children when conditions are met
  return <>{children}</>;
}