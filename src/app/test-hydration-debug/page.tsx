'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import AuthGuard from '@/components/AuthGuard';
import ErrorBoundary from '@/components/ErrorBoundary';

console.log('🔍 [HYDRATION_TEST] Test page module loading - START');

function TestPageContent() {
  console.log('🔍 [HYDRATION_TEST] TestPageContent component rendering');
  const router = useRouter();
  const { user, loading } = useAuth();
  
  console.log('🔍 [HYDRATION_TEST] TestPageContent auth state:', {
    user: user ? { id: user.id, email: user.email } : null,
    loading,
    timestamp: new Date().toISOString()
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Loading auth state...</div>
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#B89B5E'
        }}>
          Hydration Debug Test Page
        </h1>
        
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#333', borderRadius: '8px' }}>
          <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>🔍 Debug Information</h2>
          <div style={{ lineHeight: '1.6' }}>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            <p><strong>User Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}</p>
            <p><strong>Loading State:</strong> {loading ? 'Loading' : 'Complete'}</p>
            <p><strong>Environment:</strong> {typeof window !== 'undefined' ? 'Client' : 'Server'}</p>
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/')}
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
            Go to Home
          </button>
          
          <button
            onClick={() => router.push(user ? '/dashboard' : '/login')}
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
            {user ? 'Dashboard' : 'Login'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Reload Page
          </button>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#444', borderRadius: '8px' }}>
          <h3 style={{ color: '#B89B5E', marginBottom: '1rem' }}>📋 Console Logs</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Check the browser console for detailed hydration debug information.
            Look for logs starting with 🔍 [HYDRATION_DEBUG] and 🔍 [WEBPACK_DEBUG].
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HydrationTestPage() {
  console.log('🔍 [HYDRATION_TEST] HydrationTestPage wrapper rendering');
  
  return (
    <ErrorBoundary
      onError={(error, errorInfo, isHydrationError) => {
        console.error('🔍 [HYDRATION_TEST] TestPage ErrorBoundary caught error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          isHydrationError,
          timestamp: new Date().toISOString()
        });
      }}
    >
      <AuthGuard requireAuth={false}>
        <TestPageContent />
      </AuthGuard>
    </ErrorBoundary>
  );
}