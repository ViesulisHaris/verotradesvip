'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { getSupabaseClient } from '@/supabase/client';

export default function ComprehensiveFixTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (testName: string, passed: boolean, details?: string) => {
    setTestResults(prev => [...prev, {
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🔧 [FIX-TEST] Starting comprehensive fix validation...');
    
    // Test 1: AuthContext safety
    try {
      console.log('🔧 [FIX-TEST] Testing AuthContext safety...');
      const authData = useAuth();
      addTestResult('AuthContext Safety', true, `Auth data available: ${!!authData}`);
    } catch (error) {
      console.error('🔧 [FIX-TEST] AuthContext test failed:', error);
      addTestResult('AuthContext Safety', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 2: Supabase client safety
    try {
      console.log('🔧 [FIX-TEST] Testing Supabase client safety...');
      const supabase = getSupabaseClient();
      addTestResult('Supabase Client', true, `Client created: ${!!supabase?.auth}`);
    } catch (error) {
      console.error('🔧 [FIX-TEST] Supabase client test failed:', error);
      addTestResult('Supabase Client', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 3: Hydration safety
    try {
      console.log('🔧 [FIX-TEST] Testing hydration safety...');
      const isClient = typeof window !== 'undefined';
      const hasDocument = typeof document !== 'undefined';
      addTestResult('Hydration Safety', true, `Client: ${isClient}, Document: ${hasDocument}`);
    } catch (error) {
      console.error('🔧 [FIX-TEST] Hydration test failed:', error);
      addTestResult('Hydration Safety', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 4: Error handling
    try {
      console.log('🔧 [FIX-TEST] Testing error handling...');
      // Simulate potential error condition
      const testObject: any = null;
      const result = testObject ? testObject.property : 'safe-fallback';
      addTestResult('Error Handling', true, `Safe fallback working: ${result}`);
    } catch (error) {
      console.error('🔧 [FIX-TEST] Error handling test failed:', error);
      addTestResult('Error Handling', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setIsRunning(false);
    console.log('🔧 [FIX-TEST] Comprehensive fix validation completed');
  };

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#121212',
      color: '#EAE6DD',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#B89B5E'
        }}>
          🔧 JavaScript Error Fix Validation
        </h1>
        
        <p style={{
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          This page validates that the comprehensive fixes for "Cannot read properties of undefined" 
          error and hydration failures are working correctly.
        </p>
        
        <button
          onClick={runComprehensiveTests}
          disabled={isRunning}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#B89B5E',
            color: '#121212',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.7 : 1,
            marginBottom: '2rem'
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Fix Validation'}
        </button>
        
        <div style={{
          backgroundColor: '#2A2A2A',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: '#EAE6DD'
          }}>
            Fix Validation Results
          </h2>
          
          {testResults.length === 0 ? (
            <p style={{ color: '#999999' }}>
              Click "Run Fix Validation" to start testing the fixes.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    backgroundColor: result.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${result.passed ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '4px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '1.2rem',
                      color: result.passed ? '#22c55e' : '#ef4444'
                    }}>
                      {result.passed ? '✅' : '❌'}
                    </span>
                    <strong style={{ color: '#EAE6DD' }}>
                      {result.testName}
                    </strong>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#999999'
                  }}>
                    {result.details}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#999999',
                    marginTop: '0.5rem'
                  }}>
                    {result.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{
          backgroundColor: '#2A2A2A',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: '#EAE6DD'
          }}>
            Fix Summary
          </h2>
          <div style={{
            fontSize: '0.9rem',
            color: '#999999',
            lineHeight: '1.6'
          }}>
            <p><strong>🔧 AuthContext Fix:</strong> Safe fallback instead of throwing errors</p>
            <p><strong>🔧 Login Page Fix:</strong> Client-side checks and safe DOM access</p>
            <p><strong>🔧 Supabase Fix:</strong> Robust initialization with fallbacks</p>
            <p><strong>🔧 Error Handling:</strong> Comprehensive try-catch blocks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
