'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';

export default function AuthRenderingDiagnosisPage() {
  const { user, loading, authInitialized } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    // Load and run the diagnostic script
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = '/auth-rendering-diagnostic.js';
      script.async = true;
      
      script.onload = () => {
        console.log('🔧 [DIAGNOSTIC] Script loaded, running tests...');
        setTestRunning(true);
        
        // Wait for tests to complete
        setTimeout(() => {
          if ((window as any).authDiagnostic) {
            const results = (window as any).authDiagnostic.getResults();
            setDiagnosticResults(results);
            setTestRunning(false);
          }
        }, 7000); // Wait 7 seconds for all tests to complete
      };
      
      script.onerror = (error) => {
        console.error('🔧 [DIAGNOSTIC] Failed to load diagnostic script:', error);
        setTestRunning(false);
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
    return undefined;
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#EAE6DD',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #B89B5E 0%, #D6C7B2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Authentication & Rendering Diagnosis
        </h1>

        {/* Current Auth State */}
        <div style={{
          backgroundColor: 'rgba(184, 155, 94, 0.1)',
          border: '1px solid rgba(184, 155, 94, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#B89B5E'
          }}>
            Current Authentication State
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <strong>User:</strong> {user ? user.email : 'Not authenticated'}
            </div>
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Auth Initialized:</strong> {authInitialized ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Has Session:</strong> {user ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Test Status */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Diagnostic Test Status
          </h2>
          {testRunning ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: '#B89B5E'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #B89B5E',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Running diagnostic tests... Please wait 7 seconds.
            </div>
          ) : (
            <div>
              {diagnosticResults ? (
                <div>
                  <div style={{
                    backgroundColor: 'rgba(46, 213, 115, 0.1)',
                    border: '1px solid rgba(46, 213, 115, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    ✅ Diagnostic tests completed
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#9A9A9A'
                  }}>
                    Check browser console for detailed results
                  </div>
                </div>
              ) : (
                <div style={{
                  color: '#9A9A9A'
                }}>
                  Tests not yet run. Loading diagnostic script...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Test Buttons */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Manual Tests
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => {
                if ((window as any).authDiagnostic) {
                  (window as any).authDiagnostic.runAllTests();
                }
              }}
              style={{
                padding: '12px 20px',
                backgroundColor: '#B89B5E',
                color: '#121212',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D6C7B2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#B89B5E';
              }}
            >
              Run All Tests
            </button>
            
            <button
              onClick={() => {
                if ((window as any).authDiagnostic) {
                  const results = (window as any).authDiagnostic.getResults();
                  console.log('📊 Current Diagnostic Results:', results);
                  alert('Results logged to console');
                }
              }}
              style={{
                padding: '12px 20px',
                backgroundColor: '#636e72',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Get Results
            </button>
          </div>
        </div>

        {/* Expected Issues */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Expected Issues Based on Analysis
          </h2>
          <div style={{
            marginBottom: '1rem'
          }}>
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              borderRadius: '8px'
            }}>
              <strong>Primary Issue (Likely):</strong> Session persistence failure - Supabase session data not found in storage
            </div>
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(241, 196, 15, 0.1)',
              border: '1px solid rgba(241, 196, 15, 0.3)',
              borderRadius: '8px'
            }}>
              <strong>Secondary Issue:</strong> Continuous re-rendering loop - Excessive DOM updates detected
            </div>
          </div>
        </div>
      </div>

      {/* Add spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}