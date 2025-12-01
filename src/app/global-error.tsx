'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical global errors immediately
    console.error('🚨 [GLOBAL ERROR BOUNDARY] Critical error caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: 'CRITICAL'
    });

    // Send to error reporting service if available
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', 'global_error', {
          error_message: error.message,
          error_digest: error.digest,
          fatal: true
        });
      }

      // Could also send to Sentry, LogRocket, etc.
      // if (window.Sentry) {
      //   window.Sentry.captureException(error);
      // }
    }

    // In development, show more detailed error info
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 [GLOBAL ERROR] Detailed Error Information');
      console.error('Error:', error);
      console.error('Stack Trace:', error.stack);
      console.error('Component Stack:', React.version);
      console.groupEnd();
    }
  }, [error]);

  const handleEmergencyReset = () => {
    console.log('🚨 [GLOBAL ERROR] Emergency reset triggered');
    
    // Clear all possible caches and storage
    if (typeof window !== 'undefined') {
      try {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear any service worker caches
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          });
        }
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError);
      }
    }
    
    // Attempt to reset the error boundary
    reset();
  };

  const handleReload = () => {
    console.log('🔄 [GLOBAL ERROR] Force reloading application');
    
    // Force a hard reload with cache busting
    if (typeof window !== 'undefined') {
      const timestamp = new Date().getTime();
      window.location.href = `${window.location.origin}${window.location.pathname}?t=${timestamp}`;
    }
  };

  const handleGoHome = () => {
    console.log('🏠 [GLOBAL ERROR] Escaping to home page');
    
    // Navigate to home page with fresh state
    if (typeof window !== 'undefined') {
      window.location.href = '/?error_recovery=true';
    }
  };

  return (
    <html lang="en" style={{ backgroundColor: 'var(--deep-charcoal, #121212)' }}>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'var(--font-family-primary, Inter, system-ui, sans-serif)',
        backgroundColor: 'var(--deep-charcoal, #121212)',
        color: 'var(--warm-off-white, #EAE6DD)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          margin: '2rem',
          backgroundColor: 'var(--soft-graphite, #202020)',
          border: '2px solid var(--rust-red, #A7352D)',
          borderRadius: 'var(--radius-card, 0.75rem)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(167, 53, 45, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Critical Error Banner */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--rust-red, #A7352D)',
            color: 'var(--warm-off-white, #EAE6DD)',
            padding: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ⚠️ CRITICAL APPLICATION ERROR
          </div>

          {/* Error Icon with Animation */}
          <div style={{
            margin: '2rem auto 1.5rem',
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(167, 53, 45, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
            border: '2px solid var(--rust-red, #A7352D)'
          }}>
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="var(--rust-red, #A7352D)" 
              strokeWidth="2"
              style={{
                animation: 'spin 1s linear infinite'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M3 15l4-4m0 0l4 4m-4-4l4 4" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--warm-off-white, #EAE6DD)',
            marginBottom: '1rem',
            marginTop: '0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Critical System Error
          </h1>

          {/* Error Message */}
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-gray, #9A9A9A)',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            {error.message || 'A critical system error has occurred and the application cannot continue.'}
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              marginBottom: '1.5rem',
              textAlign: 'left',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              border: '1px solid var(--rust-red, #A7352D)'
            }}>
              <summary style={{
                cursor: 'pointer',
                color: 'var(--rust-red, #A7352D)',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                🔍 Technical Details (Development)
              </summary>
              <div style={{
                color: 'var(--warm-off-white, #EAE6DD)',
                fontSize: '0.75rem'
              }}>
                <p><strong>Error Message:</strong> {error.message}</p>
                {error.digest && <p><strong>Error Digest:</strong> {error.digest}</p>}
                {error.stack && (
                  <details>
                    <summary style={{ cursor: 'pointer', color: 'var(--dusty-gold, #B89B5E)' }}>
                      Stack Trace
                    </summary>
                    <pre style={{
                      margin: '0.5rem 0',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.7rem',
                      color: 'var(--muted-gray, #9A9A9A)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      overflow: 'auto',
                      maxHeight: '150px'
                    }}>
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </details>
          )}

          {/* Emergency Actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={handleEmergencyReset}
              style={{
                backgroundColor: 'var(--rust-red, #A7352D)',
                color: 'var(--warm-off-white, #EAE6DD)',
                border: 'none',
                borderRadius: 'var(--radius-button, 0.5rem)',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: '100%',
                maxWidth: '300px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#8B2A1F';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(167, 53, 45, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--rust-red, #A7352D)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(167, 53, 45, 0.3)';
              }}
            >
              🚨 Emergency Reset
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
                  e.currentTarget.style.borderColor = 'var(--dusty-gold, #B89B5E)';
                  e.currentTarget.style.color = 'var(--dusty-gold, #B89B5E)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-primary, rgba(184, 155, 94, 0.3))';
                  e.currentTarget.style.color = 'var(--warm-off-white, #EAE6DD)';
                }}
              >
                🏠 Go Home
              </button>

              <button
                onClick={handleReload}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--dusty-gold, #B89B5E)',
                  border: '1px solid var(--dusty-gold, #B89B5E)',
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
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔄 Reload
              </button>
            </div>
          </div>

          {/* Error Reference */}
          {error.digest && (
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--muted-gray, #9A9A9A)',
              marginTop: '1.5rem',
              opacity: '0.7',
              fontFamily: 'monospace'
            }}>
              Error ID: {error.digest}
            </p>
          )}

          {/* Support Info */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(184, 155, 94, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(184, 155, 94, 0.2)'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--muted-gray, #9A9A9A)',
              margin: '0'
            }}>
              If this error persists, please contact support or check the console for more details.
            </p>
          </div>
        </div>

        {/* Add CSS animations */}
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </body>
    </html>
  );
}