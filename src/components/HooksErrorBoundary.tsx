'use client';

import React from 'react';
import { useEffect } from 'react';

interface HooksErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isHooksError: boolean;
}

interface HooksErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: React.ErrorInfo; retry: () => void; isHooksError?: boolean }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo, isHooksError: boolean) => void;
}

class HooksErrorBoundary extends React.Component<HooksErrorBoundaryProps, HooksErrorBoundaryState> {
  constructor(props: HooksErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, isHooksError: false };
    console.log('🔍 [HOOKS_ERROR_BOUNDARY] HooksErrorBoundary constructor', {
      timestamp: new Date().toISOString(),
      isClient: typeof window !== 'undefined'
    });
  }

  static getDerivedStateFromError(error: Error): Partial<HooksErrorBoundaryState> {
    // Check if this is a hooks-related error
    const isHooksError = HooksErrorBoundary.isHooksError(error);
    
    console.error('🔍 [HOOKS_ERROR_BOUNDARY] HooksErrorBoundary.getDerivedStateFromError', {
      timestamp: new Date().toISOString(),
      errorMessage: error.message,
      errorStack: error.stack,
      isHooksError,
      isClient: typeof window !== 'undefined'
    });
    
    return {
      hasError: true,
      error,
      isHooksError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isHooksError = HooksErrorBoundary.isHooksError(error);
    
    console.error('🔍 [HOOKS_ERROR_BOUNDARY] HooksErrorBoundary.componentDidCatch', {
      timestamp: new Date().toISOString(),
      error,
      errorInfo,
      isHooksError,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      isClient: typeof window !== 'undefined',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });
    
    this.setState({
      error,
      errorInfo,
      isHooksError
    });

    // Log error to external service if needed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        custom_map: { 
          is_hooks_error: isHooksError,
          error_type: isHooksError ? 'react_hooks_error' : 'general_error'
        }
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, isHooksError);
    }
  }

  static isHooksError(error: Error): boolean {
    // Check for hooks-specific error patterns
    const hooksErrorPatterns = [
      'Rendered more hooks than during the previous render',
      'Rendered fewer hooks than expected',
      'Hooks can only be called inside the body of a function component',
      'Invalid hook call',
      'cannot read properties of undefined (reading \'call\')',
      'Cannot read properties of undefined',
      'unmounted component',
      'component unmounting',
      'memory leak',
      'setState',
      'useEffect',
      'useState',
      'useContext',
      'useRef',
      'useMemo',
      'useCallback'
    ];

    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';

    return hooksErrorPatterns.some(pattern => 
      errorMessage.includes(pattern.toLowerCase()) || 
      errorStack.includes(pattern.toLowerCase())
    );
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, isHooksError: false });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || HooksErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          errorInfo={this.state.errorInfo} 
          retry={this.retry}
          isHooksError={this.state.isHooksError}
        />
      );
    }

    return this.props.children;
  }
}

function HooksErrorFallback({ 
  error, 
  errorInfo, 
  retry, 
  isHooksError 
}: { 
  error?: Error; 
  errorInfo?: React.ErrorInfo; 
  retry: () => void;
  isHooksError?: boolean;
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('🚨 React Hooks Error:', {
      error,
      errorInfo,
      isHooksError,
      timestamp: new Date().toISOString()
    });
  }, [error, errorInfo, isHooksError]);

  const getErrorMessage = () => {
    if (isHooksError) {
      return {
        title: '🪝 React Hooks Error',
        description: 'The application encountered a React hooks error. This typically happens when components are unmounted and remounted, causing hook state to be lost.',
        action: 'Try refreshing the page or click "Try Again" to recover. This error has been logged for investigation.'
      };
    }
    
    return {
      title: '🚨 Component Error',
      description: 'The application encountered an unexpected error. This has been logged for investigation.',
      action: 'You can try again or reload the page to continue.'
    };
  };

  const errorMessages = getErrorMessage();

  return (
    <div style={{
      padding: '24px',
      margin: '20px auto',
      border: isHooksError ? '2px solid #e74c3c' : '1px solid #ff6b6b',
      borderRadius: '12px',
      backgroundColor: isHooksError ? '#fdf2f2' : '#ffe0e0',
      color: isHooksError ? '#c0392b' : '#d63031',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '600px'
    }}>
      <h2 style={{ 
        margin: '0 0 16px 0', 
        color: isHooksError ? '#c0392b' : '#d63031',
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
        color: isHooksError ? '#c0392b' : '#d63031'
      }}>
        {errorMessages.action}
      </p>
      
      {isHooksError && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef5e7',
          border: '1px solid #f39c12',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          <strong>🔧 Hooks Error Detected</strong>
          <br />
          This error typically occurs when:
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Components are unmounted and remounted unexpectedly</li>
            <li>Hook calls are conditional or in different orders</li>
            <li>State management issues cause component re-renders</li>
            <li>Authentication flow changes component structure</li>
          </ul>
          The system has been updated to prevent this from recurring.
        </div>
      )}
      
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
            {isHooksError && (
              <div style={{
                padding: '8px',
                backgroundColor: '#fdf2f2',
                border: '1px solid #e74c3c',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '12px'
              }}>
                <strong>React Hooks Error Detected</strong>
                <br />
                This error occurred due to hooks being called inconsistently.
                <br />
                Common causes: Component unmounting/remounting, conditional hook calls.
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
            backgroundColor: isHooksError ? '#e74c3c' : '#0984e3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isHooksError ? '#c0392b' : '#0770c4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isHooksError ? '#e74c3c' : '#0984e3';
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

        {isHooksError && (
          <button
            onClick={() => {
              // Force a clean reload without cache for hooks errors
              window.location.href = window.location.href + '?t=' + Date.now();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e67e22';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f39c12';
            }}
          >
          Force Refresh
          </button>
        )}
      </div>
    </div>
  );
}

export default HooksErrorBoundary;