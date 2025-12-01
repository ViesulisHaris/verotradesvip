'use client';

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, parameters?: Record<string, any>) => void;
  }
}

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error for debugging
    console.error('🚨 [Error Boundary] Caught error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Also log to external service if needed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'error', {
        error_message: error.message,
        error_digest: error.digest
      });
    }
  }, [error]);

  const handleReset = () => {
    console.log('🔄 [Error Boundary] Attempting to reset...');
    reset();
  };

  const handleGoHome = () => {
    console.log('🏠 [Error Boundary] Navigating to home...');
    router.push('/');
  };

  const handleReload = () => {
    console.log('🔄 [Error Boundary] Reloading page...');
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--deep-charcoal, #121212)',
      color: 'var(--warm-off-white, #EAE6DD)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'var(--font-family-primary, Inter, system-ui, sans-serif)'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'var(--soft-graphite, #202020)',
        border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))',
        borderRadius: 'var(--radius-card, 0.75rem)',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card, 0 4px 6px -1px rgba(0, 0, 0, 0.1))'
      }}>
        {/* Error Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'rgba(184, 155, 94, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--dusty-gold, #B89B5E)" 
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.932 2.5z" />
          </svg>
        </div>

        {/* Error Title */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--warm-off-white, #EAE6DD)',
          marginBottom: '1rem',
          marginTop: '0'
        }}>
          Application Error
        </h1>

        {/* Error Message */}
        <p style={{
          fontSize: '1rem',
          color: 'var(--muted-gray, #9A9A9A)',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          {error.message || 'An unexpected error occurred while loading the application.'}
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error.stack && (
          <details style={{
            marginBottom: '1.5rem',
            textAlign: 'left',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <summary style={{
              cursor: 'pointer',
              color: 'var(--dusty-gold, #B89B5E)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              Error Details (Development)
            </summary>
            <pre style={{
              margin: '0',
              whiteSpace: 'pre-wrap',
              color: 'var(--warm-off-white, #EAE6DD)',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <button
            onClick={handleReset}
            style={{
              backgroundColor: 'var(--dusty-gold, #B89B5E)',
              color: 'var(--deep-charcoal, #121212)',
              border: 'none',
              borderRadius: 'var(--radius-button, 0.5rem)',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: '200px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dusty-gold-hover, #9B8049)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dusty-gold, #B89B5E)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Try Again
          </button>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '300px'
          }}>
            <button
              onClick={handleGoHome}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--dusty-gold, #B89B5E)',
                border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))',
                borderRadius: 'var(--radius-button, 0.5rem)',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)';
                e.currentTarget.style.borderColor = 'var(--dusty-gold, #B89B5E)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-primary, rgba(184, 155, 94, 0.3))';
              }}
            >
              Go Home
            </button>

            <button
              onClick={handleReload}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--warm-off-white, #EAE6DD)',
                border: '1px solid var(--border-primary, rgba(184, 155, 94, 0.3))',
                borderRadius: 'var(--radius-button, 0.5rem)',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)';
                e.currentTarget.style.color = 'var(--dusty-gold, #B89B5E)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--warm-off-white, #EAE6DD)';
              }}
            >
              Reload Page
            </button>
          </div>
        </div>

        {/* Error Reference */}
        {error.digest && (
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--muted-gray, #9A9A9A)',
            marginTop: '1.5rem',
            opacity: '0.7'
          }}>
            Error Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}