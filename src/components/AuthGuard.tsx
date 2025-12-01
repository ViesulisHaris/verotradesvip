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

  // Simplified auth handling with immediate rendering for auth pages
  useEffect(() => {
    // Skip all logic for auth pages - render immediately
    const isAuthPage = pathname === '/login' || pathname === '/register';
    if (isAuthPage) {
      console.log('🔍 [AUTH_GUARD_DEBUG] Auth page detected - skipping auth checks', {
        guardId: guardId.current,
        pathname,
        isAuthPage
      });
      return;
    }

    // CRITICAL FIX: Remove artificial delay - check auth immediately
    // The auth state change listener in login page will handle proper timing
    const checkAuthAndRedirect = () => {
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
      // CRITICAL FIX: Be more permissive during auth transitions to prevent sidebar disappearing
      if (requireAuth && !user && authInitialized && !loading) {
        console.log('🔍 [AUTH_GUARD_DEBUG] Redirecting to login - auth required and user not authenticated', {
          guardId: guardId.current,
          reason: 'requireAuth && !user && authInitialized && !loading'
        });
        router.replace('/login');
        return;
      }
  
      // Additional check for when auth is initialized but user is null
      // CRITICAL FIX: Only redirect if we're not on a protected route
      if (requireAuth && !user && authInitialized) {
        console.log('🔍 [AUTH_GUARD_DEBUG] Redirecting to login - auth initialized but no user', {
          guardId: guardId.current,
          reason: 'requireAuth && !user && authInitialized'
        });
        router.replace('/login');
        return;
      }
    };

    // CRITICAL FIX: Check auth immediately without artificial delay
    // Auth state changes will trigger re-render, so no need for setTimeout
    console.log('🔍 [AUTH_GUARD_DEBUG] Checking auth immediately (no delay)', {
      guardId: guardId.current,
      reason: 'Auth state changes trigger re-renders automatically'
    });
    checkAuthAndRedirect();

    // Only wait for auth initialization if we're not in a clear unauthenticated state
    if (!authInitialized && requireAuth) {
      console.log('🔍 [AUTH_GUARD_DEBUG] Waiting for auth initialization', {
        guardId: guardId.current,
        authInitialized,
        requireAuth
      });
      return;
    }

    // If user is logged in and trying to access auth pages, redirect to dashboard
    if (user && isAuthPage) {
      console.log('🔍 [AUTH_GUARD_DEBUG] Redirecting to dashboard - user authenticated on auth page', {
        guardId: guardId.current,
        userEmail: user?.email,
        pathname
      });
      router.replace('/dashboard');
      return;
    }
  }, [user, loading, authInitialized, requireAuth, pathname, router]);

  // Immediate rendering for auth pages to prevent gray screen
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // For protected pages that require auth, be more aggressive about redirecting
  // If auth is not initialized and we're on a protected page, show loader but also set up redirect
  if (requireAuth && !authInitialized) {
    // Only set up timeout redirect on client-side to prevent location error
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (!authInitialized && requireAuth) {
          router.replace('/login');
        }
      }, 2000); // 2 second timeout
    }
    
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
  
  // For protected pages, check if auth is required and user is not logged in
  if (requireAuth && !user && loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '2rem',
          width: '2rem',
          borderBottom: '2px solid #B89B5E'
        }}></div>
      </div>
    );
  }

  // CRITICAL FIX: Always render children if auth is initialized and we're not requiring auth
  // This ensures the strategies page shows even when user is not authenticated
  if (authInitialized && !requireAuth) {
    return <>{children}</>;
  }

  // Always render children when conditions are met
  return <>{children}</>;
}