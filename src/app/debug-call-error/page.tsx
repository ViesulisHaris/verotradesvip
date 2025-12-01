'use client';

import { useEffect } from 'react';
import Head from 'next/head';

export default function DebugCallErrorPage() {
  useEffect(() => {
    // Load the diagnostic script
    const script = document.createElement('script');
    script.src = '/debug-call-error-diagnostic.js';
    script.async = true;
    
    script.onload = () => {
      console.log('🔍 [DEBUG PAGE] Diagnostic script loaded successfully');
      
      // Wait a moment for initialization
      setTimeout(() => {
        console.log('🔍 [DEBUG PAGE] Running manual tests...');
        
        // Test navigation safety
        if ((window as any).diagnosticHelper) {
          (window as any).diagnosticHelper.testNavigationSafety();
          (window as any).diagnosticHelper.testAuthContext();
          
          const stats = (window as any).diagnosticHelper.getStats();
          console.log('🔍 [DEBUG PAGE] Current diagnostic stats:', stats);
        } else {
          console.error('🚨 [DEBUG PAGE] Diagnostic helper not available');
        }
      }, 1000);
    };
    
    script.onerror = (error) => {
      console.error('🚨 [DEBUG PAGE] Failed to load diagnostic script:', error);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>Debug Call Error - VeroTrade</title>
        <meta name="description" content="Diagnostic page for 'Cannot read properties of undefined (reading 'call')' error" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#EAE6DD',
        fontFamily: 'Inter, sans-serif',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          backgroundColor: '#1a1a1a',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid rgba(184, 155, 94, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#B89B5E',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            🔍 Debug Call Error Diagnostic
          </h1>
          
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '18px',
              color: '#EAE6DD',
              marginBottom: '15px'
            }}>
              Diagnostic Purpose
            </h2>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#b0b0b0',
              marginBottom: '15px'
            }}>
              This page loads a diagnostic script to identify the source of the 
              <strong>"Cannot read properties of undefined (reading 'call')"</strong> error 
              that's causing the gray screen issue.
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '18px',
              color: '#EAE6DD',
              marginBottom: '15px'
            }}>
              Instructions
            </h2>
            <ol style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#b0b0b0',
              paddingLeft: '20px'
            }}>
              <li style={{ marginBottom: '10px' }}>
                Open the browser console to see diagnostic output
              </li>
              <li style={{ marginBottom: '10px' }}>
                Navigate to different pages to trigger the error
              </li>
              <li style={{ marginBottom: '10px' }}>
                Check console logs for "🚨 [DIAGNOSTIC] TARGET ERROR DETECTED!" messages
              </li>
              <li style={{ marginBottom: '10px' }}>
                Run <code>window.diagnosticHelper.getStats()</code> for current stats
              </li>
            </ol>
          </div>
          
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2 style={{
              fontSize: '18px',
              color: '#EAE6DD',
              marginBottom: '15px'
            }}>
              Test Navigation
            </h2>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: '#B89B5E',
                  color: '#121212',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4af37';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#B89B5E';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🏠 Home
              </button>
              
              <button
                onClick={() => window.location.href = '/login'}
                style={{
                  backgroundColor: '#B89B5E',
                  color: '#121212',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4af37';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#B89B5E';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔐 Login
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  backgroundColor: '#B89B5E',
                  color: '#121212',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4af37';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#B89B5E';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                📊 Dashboard
              </button>
            </div>
          </div>
          
          <div style={{
            marginTop: '30px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#666'
          }}>
            <p>Check the browser console for detailed diagnostic information</p>
          </div>
        </div>
      </div>
    </>
  );
}