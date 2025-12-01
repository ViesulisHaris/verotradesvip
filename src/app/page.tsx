'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import AuthGuard from '@/components/AuthGuard';
import ErrorBoundary from '@/components/ErrorBoundary';
// REMOVED: Problematic import '../types/webpack' that was causing "Module not found" error

// Type declaration for webpack globals (moved to top level)
declare global {
  interface WebpackModule {
    factory?: (...args: any[]) => any;
    exports?: any;
    hot?: any;
  }
  
  interface WebpackRequire {
    (moduleId: number | string): any;
    cache: Record<number | string, WebpackModule>;
  }
  
  var __webpack_require__: WebpackRequire;
}

console.log('🔍 [GRAY_SCREEN_DEBUG] Home page module loading - START');
console.log('🔍 [WEBPACK_DEBUG] Module loading context:', {
  timestamp: new Date().toISOString(),
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  isClient: typeof window !== 'undefined',
  moduleLoaded: true
});

// CRITICAL FIX: Add webpack module factory debugging
if (typeof window !== 'undefined') {
  console.log('🔍 [WEBPACK_DEBUG] Adding webpack module factory debugging...');
  
  // Intercept webpack require to catch module 242
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check for the specific webpack error
    if (message.includes('Cannot read properties of undefined') &&
        message.includes('reading \'call\'') &&
        message.includes('242')) {
      console.error('🚨 [WEBPACK_DEBUG] MODULE 242 FACTORY ERROR DETECTED!', {
        message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      
      // Try to identify what module 242 is
      if ((window as any).__webpack_require__ && (window as any).__webpack_require__.cache) {
        console.log('🔍 [WEBPACK_DEBUG] Webpack cache analysis:', {
          cacheKeys: Object.keys((window as any).__webpack_require__.cache),
          module242: (window as any).__webpack_require__.cache[242],
          hasModule242: !!(window as any).__webpack_require__.cache[242],
          module242Factory: (window as any).__webpack_require__.cache[242]?.factory,
          factoryType: typeof (window as any).__webpack_require__.cache[242]?.factory
        });
      }
    }
    
    originalConsoleError.apply(console, args);
  };
  
  // Monitor for chunk loading errors
  window.addEventListener('error', function(event: any) {
    if (event.filename && event.filename.includes('chunk')) {
      console.error('🚨 [WEBPACK_DEBUG] Chunk loading error detected:', {
        filename: event.filename,
        message: event.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Monitor for unhandled promise rejections (often chunk loading)
  window.addEventListener('unhandledrejection', function(event: any) {
    if (event.reason &&
        (event.reason.message?.includes('ChunkLoadError') ||
         event.reason.message?.includes('Loading chunk'))) {
      console.error('🚨 [WEBPACK_DEBUG] Async chunk loading error:', {
        reason: event.reason,
        timestamp: new Date().toISOString()
      });
    }
  });
}

function HomePageContent() {
  console.log('🔧 [GRAY_SCREEN_FIX] HomePageContent component rendering', {
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    isClient: typeof window !== 'undefined'
  });
  const router = useRouter();
  const { user, loading, authInitialized } = useAuth();
  const [isClient, setIsClient] = React.useState(false);

  // CRITICAL FIX: Improved hydration detection
  React.useEffect(() => {
    console.log('🔧 [GRAY_SCREEN_FIX] Client-side detected, setting isClient to true', {
      timestamp: new Date().toISOString(),
      authState: { user: !!user, loading, authInitialized }
    });
    setIsClient(true);
  }, []);
  
  console.log('🔧 [GRAY_SCREEN_FIX] HomePageContent state:', {
    user: user ? { id: user.id, email: user.email } : null,
    loading,
    authInitialized,
    isClient,
    timestamp: new Date().toISOString()
  });

  // CRITICAL FIX: Redirect to dashboard if already logged in (only on client side and auth initialized)
  React.useEffect(() => {
    if (isClient && authInitialized && user && !loading) {
      console.log('🔧 [GRAY_SCREEN_FIX] User already logged in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router, isClient, authInitialized]);

  // CRITICAL FIX: Redirect to login if user is not authenticated (only on client side and auth initialized)
  React.useEffect(() => {
    if (isClient && authInitialized && !user && !loading) {
      console.log('🔧 [AUTH_ROUTING_FIX] User not authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [user, loading, router, isClient, authInitialized]);

  // CRITICAL FIX: Prevent gray screen with better loading logic
  if (!isClient) {
    console.log('🔧 [GRAY_SCREEN_FIX] Server-side rendering - showing minimal loader');
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: '#B89B5E',
          fontSize: '16px'
        }}>Loading...</div>
      </div>
    );
  }

  // CRITICAL FIX: Only show loading spinner when auth is initialized but still loading
  if (authInitialized && loading) {
    console.log('🔧 [GRAY_SCREEN_FIX] Auth initialized but loading - showing spinner');
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '3rem',
          width: '3rem',
          borderBottom: '2px solid #B89B5E'
        }}></div>
      </div>
    );
  }

  // CRITICAL FIX: If auth is not initialized, show a brief loading state
  if (!authInitialized) {
    console.log('🔧 [GRAY_SCREEN_FIX] Auth not initialized - showing initialization loader');
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '600',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #B89B5E, #D4AF37)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem'
        }}>
          VeroTrade
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.8, marginTop: '1rem' }}>
          Professional Trading Journal Platform
        </p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              backgroundColor: '#B89B5E',
              color: '#121212',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => router.push('/register')}
            style={{
              backgroundColor: 'transparent',
              color: '#B89B5E',
              border: '1px solid #B89B5E',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Register
          </button>
        </div>
        
        <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#333', borderRadius: '8px' }}>
          <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>✅ Gray Screen Issue Fixed</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '0.5rem' }}>
            <strong>Root Cause Fixed:</strong> AuthContext initialization simplified to prevent silent failures
          </p>
          <p style={{ lineHeight: '1.6', marginBottom: '0.5rem' }}>
            <strong>Authentication:</strong> AuthGuard loading conditions simplified to prevent gray screen
          </p>
          <p style={{ lineHeight: '1.6', marginBottom: '0.5rem' }}>
            <strong>Error Handling:</strong> Error boundaries added to catch React mounting errors
          </p>
          <p style={{ lineHeight: '1.6' }}>
            <strong>Current Status:</strong> Application should now load properly without gray screen
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  console.log('🔍 [GRAY_SCREEN_DEBUG] HomePage wrapper rendering with AuthGuard');
  
  return (
    <ErrorBoundary
      onError={(error, errorInfo, isHydrationError) => {
        console.error('🚨 HomePage ErrorBoundary caught error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          isHydrationError,
          timestamp: new Date().toISOString()
        });
      }}
    >
      <AuthGuard requireAuth={true}>
        <ErrorBoundary
          onError={(error, errorInfo, isHydrationError) => {
            console.error('🚨 HomePageContent ErrorBoundary caught error:', {
              error: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
              isHydrationError,
              timestamp: new Date().toISOString()
            });
          }}
        >
          <HomePageContent />
        </ErrorBoundary>
      </AuthGuard>
    </ErrorBoundary>
  );
}
