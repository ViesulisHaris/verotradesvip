'use client';

import React, { useState } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error to verify ErrorBoundary functionality');
  }
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
      <h3>✅ Component is working correctly</h3>
      <p>This component will throw an error when the button below is clicked.</p>
    </div>
  );
}

export default function TestErrorBoundaryPage() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [hasRecovered, setHasRecovered] = useState(false);

  const handleError = (error: Error, errorInfo: React.ErrorInfo, isHydrationError: boolean) => {
    console.log('Custom error handler called:', { error, errorInfo, isHydrationError });
    setHasRecovered(true);
  };

  const triggerError = () => {
    setShouldThrow(true);
    setHasRecovered(false);
  };

  const recover = () => {
    setShouldThrow(false);
    setHasRecovered(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🧪 ErrorBoundary Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>This page tests the ErrorBoundary component functionality.</p>
        <p>Click the button below to trigger an error and see how the ErrorBoundary handles it.</p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={triggerError}
          disabled={shouldThrow}
          style={{
            padding: '10px 20px',
            backgroundColor: shouldThrow ? '#ccc' : '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: shouldThrow ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🚨 Trigger Test Error
        </button>
        
        <button
          onClick={recover}
          style={{
            padding: '10px 20px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Recover Component
        </button>
      </div>

      {hasRecovered && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#155724'
        }}>
          ✅ Error was caught and handled by the ErrorBoundary! Custom error handler was called.
        </div>
      )}

      <div style={{
        border: '2px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>🛡️ Protected by ErrorBoundary:</h3>
        <ErrorBoundary onError={handleError}>
          <ErrorThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4>📋 Test Instructions:</h4>
        <ol>
          <li>Click "🚨 Trigger Test Error" to throw an error</li>
          <li>Observe the ErrorBoundary fallback UI</li>
          <li>Click "Try Again" in the error boundary to attempt recovery</li>
          <li>Click "🔄 Recover Component" to reset the test</li>
          <li>Check browser console for error logs</li>
        </ol>
      </div>
    </div>
  );
}