'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabase/client';

export default function AuthPersistenceTest() {
  const { user, session, loading, authInitialized, logout } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (testName: string, status: 'pass' | 'fail' | 'warning', details: string) => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runAuthPersistenceTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    console.log('🔍 Starting Authentication Persistence Tests...');
    
    // Test 1: Check AuthContext Initialization
    if (authInitialized) {
      addTestResult('AuthContext Initialization', 'pass', 'AuthContext properly initialized');
    } else {
      addTestResult('AuthContext Initialization', 'fail', 'AuthContext not initialized');
    }

    // Test 2: Check User Session
    if (user) {
      addTestResult('User Session', 'pass', `User authenticated: ${user.email}`);
    } else {
      addTestResult('User Session', 'fail', 'No user session found');
    }

    // Test 3: Check Session Object
    if (session) {
      addTestResult('Session Object', 'pass', `Valid session found, expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
    } else {
      addTestResult('Session Object', 'fail', 'No session object found');
    }

    // Test 4: Check LocalStorage for Auth Data
    try {
      const localStorageKeys = Object.keys(localStorage);
      const hasSupabaseData = localStorageKeys.some(key => 
        key.includes('supabase') || key.includes('auth')
      );
      
      if (hasSupabaseData) {
        const supabaseKeys = localStorageKeys.filter(key => 
          key.includes('supabase') || key.includes('auth')
        );
        addTestResult('LocalStorage Auth Data', 'pass', `Found auth data in localStorage: ${supabaseKeys.join(', ')}`);
      } else {
        addTestResult('LocalStorage Auth Data', 'fail', 'No auth data found in localStorage');
      }
    } catch (error) {
      addTestResult('LocalStorage Auth Data', 'fail', `Error checking localStorage: ${error}`);
    }

    // Test 5: Check SessionStorage for Auth Data
    try {
      const sessionStorageKeys = Object.keys(sessionStorage);
      const hasSessionAuthData = sessionStorageKeys.some(key => 
        key.includes('supabase') || key.includes('auth')
      );
      
      if (hasSessionAuthData) {
        const sessionKeys = sessionStorageKeys.filter(key => 
          key.includes('supabase') || key.includes('auth')
        );
        addTestResult('SessionStorage Auth Data', 'warning', `Found auth data in sessionStorage (won't persist): ${sessionKeys.join(', ')}`);
      } else {
        addTestResult('SessionStorage Auth Data', 'pass', 'No auth data in sessionStorage (good for security)');
      }
    } catch (error) {
      addTestResult('SessionStorage Auth Data', 'fail', `Error checking sessionStorage: ${error}`);
    }

    // Test 6: Check Supabase Client Configuration
    try {
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        addTestResult('Supabase Session Check', 'fail', `Error getting session: ${error.message}`);
      } else if (supabaseSession) {
        addTestResult('Supabase Session Check', 'pass', 'Supabase client has valid session');
      } else {
        addTestResult('Supabase Session Check', 'fail', 'Supabase client has no session');
      }
    } catch (error) {
      addTestResult('Supabase Session Check', 'fail', `Error checking Supabase session: ${error}`);
    }

    // Test 7: Check Token Refresh Configuration
    try {
      // Check if auto-refresh is working by examining the session
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
        
        if (hoursUntilExpiry > 0) {
          addTestResult('Token Expiry', 'pass', `Token valid for ${hoursUntilExpiry.toFixed(2)} hours`);
        } else {
          addTestResult('Token Expiry', 'fail', 'Token has expired');
        }
      } else {
        addTestResult('Token Expiry', 'fail', 'No token expiry information available');
      }
    } catch (error) {
      addTestResult('Token Expiry', 'fail', `Error checking token expiry: ${error}`);
    }

    // Test 8: Test Page Refresh Simulation
    try {
      // Store current state
      const currentState = {
        user: user?.id,
        session: session?.access_token ? 'present' : 'missing',
        timestamp: Date.now()
      };
      
      // Store in localStorage to simulate refresh
      localStorage.setItem('auth-test-state', JSON.stringify(currentState));
      addTestResult('Refresh Simulation', 'pass', 'Current auth state stored for refresh test');
    } catch (error) {
      addTestResult('Refresh Simulation', 'fail', `Error storing refresh test state: ${error}`);
    }

    setIsRunningTests(false);
  };

  const testLogin = async () => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: 'testuser1000@verotrade.com',
        password: 'TestPassword123!'
      });

      if (error) {
        addTestResult('Test Login', 'fail', `Login failed: ${error.message}`);
      } else if (data.user) {
        addTestResult('Test Login', 'pass', `Login successful for user: ${data.user.email}`);
        // Run tests again after login
        setTimeout(runAuthPersistenceTests, 1000);
      }
    } catch (error) {
      addTestResult('Test Login', 'fail', `Login error: ${error}`);
    }
  };

  const testLogout = async () => {
    try {
      await logout();
      addTestResult('Test Logout', 'pass', 'Logout successful');
      // Run tests again after logout
      setTimeout(runAuthPersistenceTests, 1000);
    } catch (error) {
      addTestResult('Test Logout', 'fail', `Logout error: ${error}`);
    }
  };

  const clearAllStorage = () => {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      addTestResult('Clear Storage', 'pass', 'All storage cleared');
      setTimeout(runAuthPersistenceTests, 1000);
    } catch (error) {
      addTestResult('Clear Storage', 'fail', `Error clearing storage: ${error}`);
    }
  };

  useEffect(() => {
    // Check for refresh test state
    const storedState = localStorage.getItem('auth-test-state');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        const timeSinceStorage = Date.now() - state.timestamp;
        
        if (timeSinceStorage > 5000) { // More than 5 seconds ago
          addTestResult('Page Refresh Test', 'pass', `Auth state persisted after ${timeSinceStorage}ms`);
        } else {
          addTestResult('Page Refresh Test', 'warning', 'Test state too recent, may not represent refresh');
        }
      } catch (error) {
        addTestResult('Page Refresh Test', 'fail', `Error parsing refresh test state: ${error}`);
      }
    }
    
    // Run initial tests
    if (authInitialized) {
      runAuthPersistenceTests();
    }
  }, [authInitialized]);

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#B89B5E', marginBottom: '2rem' }}>🔍 Authentication Persistence Diagnostic</h1>
      
      {/* Current Auth State */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #444'
      }}>
        <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Current Authentication State</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div>🔄 Loading: {loading ? 'Yes' : 'No'}</div>
          <div>✅ Auth Initialized: {authInitialized ? 'Yes' : 'No'}</div>
          <div>👤 User: {user ? `${user.email} (${user.id})` : 'Not logged in'}</div>
          <div>🔑 Session: {session ? `Present (expires: ${new Date(session.expires_at! * 1000).toLocaleString()})` : 'No session'}</div>
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #444'
      }}>
        <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Test Controls</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={runAuthPersistenceTests}
            disabled={isRunningTests}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#B89B5E',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunningTests ? 'not-allowed' : 'pointer',
              opacity: isRunningTests ? 0.6 : 1
            }}
          >
            {isRunningTests ? '⏳ Running Tests...' : '🧪 Run Tests'}
          </button>
          
          <button 
            onClick={testLogin}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔐 Test Login
          </button>
          
          <button 
            onClick={testLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🚪 Test Logout
          </button>
          
          <button 
            onClick={clearAllStorage}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear Storage
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1rem', 
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Test Results</h2>
        {testResults.length === 0 ? (
          <div style={{ color: '#888' }}>No tests run yet. Click "Run Tests" to start.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '0.75rem',
                  backgroundColor: result.status === 'pass' ? '#1a3d1a' : 
                                  result.status === 'warning' ? '#3d3d1a' : '#3d1a1a',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${
                    result.status === 'pass' ? '#28a745' : 
                    result.status === 'warning' ? '#ffc107' : '#dc3545'
                  }`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>
                    {result.status === 'pass' ? '✅' : 
                     result.status === 'warning' ? '⚠️' : '❌'}
                  </span>
                  <strong>{result.testName}:</strong>
                  <span>{result.details}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '1px solid #444'
      }}>
        <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>📋 Test Instructions</h2>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li>Click "Run Tests" to check current authentication state</li>
          <li>If not logged in, click "Test Login" to authenticate</li>
          <li>Run tests again after login to verify session creation</li>
          <li>Refresh the page (F5) and run tests again to check persistence</li>
          <li>Navigate to other pages and return to test navigation persistence</li>
          <li>Close and reopen browser to test session persistence</li>
        </ol>
      </div>
    </div>
  );
}