'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import AuthGuard from '@/components/AuthGuard';

export default function DebugGrayScreenRootCause() {
  const [diagnosticData, setDiagnosticData] = useState<any>({});
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  const { user, loading, authInitialized } = useAuth();

  useEffect(() => {
    setIsClient(true);
    
    // Run comprehensive diagnostic tests
    const runDiagnostics = async () => {
      const results = [];
      
      // Test 1: Basic React rendering
      results.push({
        test: 'React Rendering',
        status: 'pass',
        message: 'React component mounted successfully',
        timestamp: new Date().toISOString()
      });

      // Test 2: Client-side detection
      results.push({
        test: 'Client-Side Detection',
        status: typeof window !== 'undefined' ? 'pass' : 'fail',
        message: typeof window !== 'undefined' ? 'Client-side detected' : 'Server-side only',
        timestamp: new Date().toISOString()
      });

      // Test 3: AuthContext availability
      try {
        const authData = useAuth();
        results.push({
          test: 'AuthContext Availability',
          status: 'pass',
          message: 'AuthContext is available',
          data: {
            loading: authData.loading,
            authInitialized: authData.authInitialized,
            hasUser: !!authData.user
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          test: 'AuthContext Availability',
          status: 'fail',
          message: `AuthContext error: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        });
      }

      // Test 4: DOM manipulation
      try {
        const testElement = document.createElement('div');
        testElement.innerHTML = 'Test';
        document.body.appendChild(testElement);
        document.body.removeChild(testElement);
        results.push({
          test: 'DOM Manipulation',
          status: 'pass',
          message: 'DOM manipulation works correctly',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          test: 'DOM Manipulation',
          status: 'fail',
          message: `DOM error: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        });
      }

      // Test 5: CSS rendering
      try {
        const testStyle = document.createElement('style');
        testStyle.innerHTML = '.test-class { color: red; }';
        document.head.appendChild(testStyle);
        results.push({
          test: 'CSS Rendering',
          status: 'pass',
          message: 'CSS can be applied correctly',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          test: 'CSS Rendering',
          status: 'fail',
          message: `CSS error: ${(error as Error).message}`,
          timestamp: new Date().toISOString()
        });
      }

      // Test 6: Browser console errors
      const originalError = console.error;
      const errors: string[] = [];
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      setTimeout(() => {
        console.error = originalError;
        results.push({
          test: 'Console Errors',
          status: errors.length === 0 ? 'pass' : 'warn',
          message: errors.length === 0 ? 'No console errors detected' : `${errors.length} console errors detected`,
          data: errors,
          timestamp: new Date().toISOString()
        });
      }, 1000);

      setTestResults(results);
    };

    if (typeof window !== 'undefined') {
      runDiagnostics();
    }
  }, []);

  useEffect(() => {
    setDiagnosticData({
      isClient,
      authState: {
        loading,
        authInitialized,
        hasUser: !!user,
        userEmail: user?.email
      },
      environment: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        timestamp: new Date().toISOString()
      }
    });
  }, [isClient, user, loading, authInitialized]);

  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '2rem'
      }}>
        <h1>🔍 Gray Screen Root Cause Analysis</h1>
        <p>Loading diagnostic tools...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '2rem',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#3b82f6' }}>
        🔍 Gray Screen Root Cause Analysis
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>
          Diagnostic Data
        </h2>
        <pre style={{
          backgroundColor: '#1f2937',
          padding: '1rem',
          borderRadius: '0.5rem',
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
          {JSON.stringify(diagnosticData, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>
          Test Results
        </h2>
        {testResults.map((result, index) => (
          <div key={index} style={{
            backgroundColor: result.status === 'pass' ? '#065f46' : result.status === 'fail' ? '#7f1d1d' : '#451a03',
            padding: '1rem',
            marginBottom: '0.5rem',
            borderRadius: '0.5rem',
            border: `1px solid ${result.status === 'pass' ? '#10b981' : result.status === 'fail' ? '#ef4444' : '#f59e0b'}`
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {result.test}: {result.status.toUpperCase()}
            </div>
            <div>{result.message}</div>
            {result.data && (
              <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>
          Authentication Flow Analysis
        </h2>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '1rem',
          borderRadius: '0.5rem'
        }}>
          <div>🔧 AuthContext State:</div>
          <ul>
            <li>Loading: {loading ? 'YES' : 'NO'}</li>
            <li>Auth Initialized: {authInitialized ? 'YES' : 'NO'}</li>
            <li>Has User: {user ? 'YES' : 'NO'}</li>
            <li>User Email: {user?.email || 'N/A'}</li>
          </ul>
          
          <div style={{ marginTop: '1rem' }}>🔧 Expected Behavior:</div>
          <ul>
            <li>If loading=true AND authInitialized=false: Should show loading spinner</li>
            <li>If loading=false AND authInitialized=true: Should show content</li>
            <li>If loading=true AND authInitialized=true: Should show brief loading</li>
          </ul>
          
          <div style={{ marginTop: '1rem' }}>🔧 Current Issue:</div>
          <div style={{ color: '#ef4444' }}>
            {loading && !authInitialized ? 
              "Auth is stuck in loading state - this causes gray screen" : 
              authInitialized && !loading ? 
              "Auth is properly initialized - should render content" : 
              "Unknown auth state"
            }
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>
          Recommended Actions
        </h2>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '1rem',
          borderRadius: '0.5rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>1. Check Browser Console:</strong>
            <div>Open browser dev tools (F12) and check for JavaScript errors</div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>2. Check Network Tab:</strong>
            <div>Verify all resources (CSS, JS, images) are loading correctly</div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>3. Check DOM Elements:</strong>
            <div>Use Elements tab to see if login elements exist but are hidden</div>
          </div>
          
          <div>
            <strong>4. Test Navigation:</strong>
            <div>Try navigating directly to /login to see if the issue persists</div>
          </div>
        </div>
      </div>
    </div>
  );
}