'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import HooksErrorBoundary from '@/components/HooksErrorBoundary';
import ErrorBoundary from '@/components/ErrorBoundary';
import dynamic from 'next/dynamic';

// Dynamically import UnifiedSidebar to prevent SSR issues
const UnifiedSidebar = dynamic(() => import('@/components/navigation/UnifiedSidebar-original'), {
  ssr: false,
  loading: () => <div style={{ color: '#B89B5E' }}>Loading sidebar...</div>
});

export default function TestHooksFix() {
  const [testState, setTestState] = useState('initial');
  const [renderCount, setRenderCount] = useState(0);
  const [hookCallLog, setHookCallLog] = useState<string[]>([]);
  
  const auth = useAuth();
  
  // Test stable hook calls
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    setHookCallLog(prev => [...prev, `useEffect called at ${new Date().toISOString()}`]);
    
    // Test cleanup
    return () => {
      setHookCallLog(prev => [...prev, `useEffect cleanup at ${new Date().toISOString()}`]);
    };
  });
  
  // Test useCallback
  const testCallback = useCallback(() => {
    setTestState('callback triggered');
    setHookCallLog(prev => [...prev, `useCallback triggered at ${new Date().toISOString()}`]);
  }, []);
  
  // Test useMemo
  const memoizedValue = useMemo(() => {
    const result = `Memoized: ${renderCount} - ${Date.now()}`;
    setHookCallLog(prev => [...prev, `useMemo recalculated: ${result}`]);
    return result;
  }, [renderCount]);
  
  const addLog = (message: string) => {
    setHookCallLog(prev => [...prev, `${message} at ${new Date().toISOString()}`]);
  };
  
  const clearLogs = () => {
    setHookCallLog([]);
  };
  
  return (
    <HooksErrorBoundary
      onError={(error, errorInfo, isHooksError) => {
        console.error('🚨 TestHooksFix HooksErrorBoundary caught error:', {
          error: error.message,
          isHooksError,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <ErrorBoundary
        onError={(error, errorInfo, isHydrationError) => {
          console.error('🚨 TestHooksFix ErrorBoundary caught error:', {
            error: error.message,
            isHydrationError,
            componentStack: errorInfo.componentStack
          });
        }}
      >
        <div style={{
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            color: '#e0e0e0'
          }}>
            🪝 React Hooks Error Fix Test
          </h1>
          
          {/* Test Results Section */}
          <div style={{
            backgroundColor: 'rgba(18, 18, 18, 0.8)',
            border: '1px solid rgba(184, 155, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#B89B5E' }}>
              Test Results
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {/* Render Count */}
              <div style={{
                backgroundColor: 'rgba(184, 155, 94, 0.1)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(184, 155, 94, 0.2)'
              }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#B89B5E' }}>
                  Render Count
                </h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#e0e0e0' }}>
                  {renderCount}
                </p>
              </div>
              
              {/* Auth State */}
              <div style={{
                backgroundColor: 'rgba(184, 155, 94, 0.1)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(184, 155, 94, 0.2)'
              }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#B89B5E' }}>
                  Auth State
                </h3>
                <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
                  User: {auth.user ? auth.user.email : 'Not authenticated'}
                </p>
                <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
                  Loading: {auth.loading ? 'Yes' : 'No'}
                </p>
                <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
                  Initialized: {auth.authInitialized ? 'Yes' : 'No'}
                </p>
              </div>
              
              {/* Test State */}
              <div style={{
                backgroundColor: 'rgba(184, 155, 94, 0.1)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(184, 155, 94, 0.2)'
              }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#B89B5E' }}>
                  Test State
                </h3>
                <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
                  State: {testState}
                </p>
                <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
                  Memoized: {memoizedValue}
                </p>
              </div>
            </div>
          </div>
          
          {/* Test Controls */}
          <div style={{
            backgroundColor: 'rgba(18, 18, 18, 0.8)',
            border: '1px solid rgba(184, 155, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#B89B5E' }}>
              Test Controls
            </h2>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                onClick={testCallback}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#B89B5E',
                  color: '#121212',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Test Callback
              </button>
              
              <button
                onClick={() => {
                  setTestState(`State updated at ${Date.now()}`);
                  addLog('Manual state update');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0984e3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Update State
              </button>
              
              <button
                onClick={() => {
                  addLog('Force re-render');
                  setRenderCount(prev => prev + 1);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#00b894',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Force Re-render
              </button>
              
              <button
                onClick={clearLogs}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#636e72',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Clear Logs
              </button>
            </div>
          </div>
          
          {/* Sidebar Test */}
          <div style={{
            backgroundColor: 'rgba(18, 18, 18, 0.8)',
            border: '1px solid rgba(184, 155, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#B89B5E' }}>
              Sidebar Component Test
            </h2>
            
            <HooksErrorBoundary
              onError={(error, errorInfo, isHooksError) => {
                console.error('🚨 Sidebar HooksErrorBoundary caught error:', {
                  error: error.message,
                  isHooksError,
                  componentStack: errorInfo.componentStack
                });
                addLog(`Sidebar error: ${error.message} (Hooks: ${isHooksError})`);
              }}
            >
              <UnifiedSidebar />
            </HooksErrorBoundary>
          </div>
          
          {/* Hook Call Log */}
          <div style={{
            backgroundColor: 'rgba(18, 18, 18, 0.8)',
            border: '1px solid rgba(184, 155, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#B89B5E' }}>
              Hook Call Log
            </h2>
            
            <div style={{
              backgroundColor: '#121212',
              border: '1px solid rgba(184, 155, 94, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {hookCallLog.length === 0 ? (
                <p style={{ color: '#9A9A9A', fontStyle: 'italic' }}>
                  No hook calls logged yet. Interact with the controls above to see hook activity.
                </p>
              ) : (
                hookCallLog.map((log, index) => (
                  <div key={index} style={{
                    fontSize: '12px',
                    color: '#e0e0e0',
                    marginBottom: '4px',
                    fontFamily: 'monospace'
                  }}>
                    [{index + 1}] {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </HooksErrorBoundary>
  );
}