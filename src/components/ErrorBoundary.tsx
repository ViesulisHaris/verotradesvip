'use client';

import React from 'react';
import { useEffect } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isHydrationError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: React.ErrorInfo; retry: () => void; isHydrationError?: boolean }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo, isHydrationError: boolean) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, isHydrationError: false };
    console.log('🔍 [HYDRATION_DEBUG] ErrorBoundary constructor', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined'
    });
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Check if this is a hydration error
    const isHydrationError = ErrorBoundary.isHydrationError(error);
    
    console.error('🔍 [HYDRATION_DEBUG] ErrorBoundary.getDerivedStateFromError', {
      timestamp: new Date().toISOString(),
      errorMessage: error.message,
      errorStack: error.stack,
      isHydrationError,
      isClient: typeof window !== 'undefined'
    });
    
    return {
      hasError: true,
      error,
      isHydrationError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isHydrationError = ErrorBoundary.isHydrationError(error);
    
    console.error('🔍 [HYDRATION_DEBUG] ErrorBoundary.componentDidCatch', {
      timestamp: new Date().toISOString(),
      error,
      errorInfo,
      isHydrationError,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      isClient: typeof window !== 'undefined',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });
    
    this.setState({
      error,
      errorInfo,
      isHydrationError
    });

    // Log error to external service if needed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        custom_map: { is_hydration_error: isHydrationError }
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, isHydrationError);
    }
  }

  static isHydrationError(error: Error): boolean {
    // Check for common hydration error patterns
    const hydrationErrorPatterns = [
      'Hydration failed',
      'Text content does not match',
      'Server-rendered HTML',
      'Client-rendered HTML',
      'hydration',
      'cannot read properties of undefined (reading \'call\')',
      'Cannot read properties of undefined',
      'Module not found',
      'webpack'
    ];

    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';

    return hydrationErrorPatterns.some(pattern => 
      errorMessage.includes(pattern.toLowerCase()) || 
      errorStack.includes(pattern.toLowerCase())
    );
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, isHydrationError: false });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          errorInfo={this.state.errorInfo} 
          retry={this.retry}
          isHydrationError={this.state.isHydrationError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  retry, 
  isHydrationError 
}: { 
  error?: Error; 
  errorInfo?: React.ErrorInfo; 
  retry: () => void;
  isHydrationError?: boolean;
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('🚨 Application Error:', {
      error,
      errorInfo,
      isHydrationError,
      timestamp: new Date().toISOString()
    });
  }, [error, errorInfo, isHydrationError]);

  const getErrorMessage = () => {
    if (isHydrationError) {
      return {
        title: '💧 Hydration Error',
        description: 'The application encountered a hydration error. This usually happens when the server-rendered content doesn\'t match the client-side rendering.',
        action: 'Try refreshing the page or click "Try Again" to recover.'
      };
    }
    
    return {
      title: '🚨 Application Error',
      description: 'The application encountered an unexpected error. This has been logged for investigation.',
      action: 'You can try again or reload the page to continue.'
    };
  };

  const errorMessages = getErrorMessage();

  return (
    <div style={{
      padding: '24px',
      margin: '20px auto',
      border: isHydrationError ? '2px solid #74b9ff' : '1px solid #ff6b6b',
      borderRadius: '12px',
      backgroundColor: isHydrationError ? '#e3f2fd' : '#ffe0e0',
      color: isHydrationError ? '#1976d2' : '#d63031',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '600px'
    }}>
      <h2 style={{ 
        margin: '0 0 16px 0', 
        color: isHydrationError ? '#1976d2' : '#d63031',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        {errorMessages.title}
      </h2>
      
      <p style={{ 
        margin: '0 0 20px 0',
        lineHeight: '1.5',
        fontSize: '14px'
      }}>
        {errorMessages.description}
      </p>
      
      <p style={{ 
        margin: '0 0 24px 0',
        fontSize: '13px',
        fontStyle: 'italic',
        color: isHydrationError ? '#1565c0' : '#c0392b'
      }}>
        {errorMessages.action}
      </p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ marginBottom: '24px' }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: 'bold',
            padding: '8px 0',
            fontSize: '14px'
          }}>
            Error Details (Development Only)
          </summary>
          <div style={{ marginTop: '12px' }}>
            {isHydrationError && (
              <div style={{
                padding: '8px',
                backgroundColor: '#e1f5fe',
                border: '1px solid #81d4fa',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '12px'
              }}>
                <strong>Hydration Error Detected</strong>
                <br />
                This error occurred during the hydration process.
                <br />
                Common causes: Server-client HTML mismatch, dynamic imports, or timing issues.
              </div>
            )}
            
            <pre style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap'
            }}>
              <strong>Error Message:</strong>
              {error.toString()}
              
              {errorInfo && (
                <>
                  <br /><br />
                  <strong>Component Stack:</strong>
                  {errorInfo.componentStack}
                </>
              )}
              
              {error.stack && (
                <>
                  <br /><br />
                  <strong>Full Stack:</strong>
                  {error.stack}
                </>
              )}
            </pre>
          </div>
        </details>
      )}
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={retry}
          style={{
            padding: '10px 20px',
            backgroundColor: isHydrationError ? '#2196f3' : '#0984e3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isHydrationError ? '#1976d2' : '#0770c4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isHydrationError ? '#2196f3' : '#0984e3';
          }}
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#636e72',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3436';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#636e72';
          }}
        >
          Reload Page
        </button>

        {isHydrationError && (
          <button
            onClick={() => {
              // Force a clean reload without cache for hydration errors
              window.location.href = window.location.href + '?t=' + Date.now();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff9f43',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f39c12';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff9f43';
            }}
          >
          Force Refresh
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;
