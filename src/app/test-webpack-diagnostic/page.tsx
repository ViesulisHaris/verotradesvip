'use client';

import React, { useEffect } from 'react';

export default function WebpackDiagnosticPage() {
  useEffect(() => {
    // Inject the webpack diagnostic script
    const script = document.createElement('script');
    script.src = '/webpack-module-diagnostic.js';
    script.async = true;
    
    script.onload = () => {
      console.log('🔍 [WEBPACK_DIAGNOSTIC] Diagnostic script loaded successfully');
    };
    
    script.onerror = (error) => {
      console.error('🚨 [WEBPACK_DIAGNOSTIC] Failed to load diagnostic script:', error);
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#B89B5E',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '600',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #B89B5E, #D4AF37)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Webpack Module Diagnostic
        </h1>
        
        <div style={{
          backgroundColor: '#333',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Diagnostic Purpose</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            This page is designed to diagnose the webpack runtime error that's causing the gray screen issue.
          </p>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            <strong>Target Error:</strong> "Cannot read properties of undefined (reading 'call')" at module ID 242
          </p>
          <p style={{ lineHeight: '1.6' }}>
            <strong>What we're looking for:</strong>
          </p>
          <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Module ID 242 and its factory function status</li>
            <li>Chunk loading failures</li>
            <li>Async module loading issues</li>
            <li>Webpack runtime configuration problems</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#333',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Diagnostic Steps</h2>
          <ol style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Page loads and injects diagnostic script</li>
            <li>Script intercepts webpack module loading</li>
            <li>Monitors for module ID 242 specifically</li>
            <li>Logs chunk loading status and errors</li>
            <li>Identifies root cause of factory undefined error</li>
          </ol>
        </div>

        <div style={{
          backgroundColor: '#333',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Instructions</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            <strong>1. Open Browser Console:</strong> Press F12 and go to the Console tab
          </p>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            <strong>2. Look for Diagnostic Logs:</strong> Search for "[WEBPACK_DIAGNOSTIC]" messages
          </p>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            <strong>3. Check for Module 242:</strong> Look for "MODULE 242 DETECTED!" messages
          </p>
          <p style={{ lineHeight: '1.6' }}>
            <strong>4. Note Any Errors:</strong> Pay attention to chunk loading or factory errors
          </p>
        </div>

        <div style={{
          backgroundColor: '#333',
          padding: '1.5rem',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#B89B5E', marginBottom: '1rem' }}>Expected Findings</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            Based on our analysis, we expect to find one of these issues:
          </p>
          <div style={{ marginLeft: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#ff6b6b' }}>Most Likely:</strong>
              <p style={{ margin: '0.5rem 0' }}>Module 242 has an undefined factory function due to chunk loading failure</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#f39c12' }}>Secondary:</strong>
              <p style={{ margin: '0.5rem 0' }}>Async module loading failure in requireAsyncModule function</p>
            </div>
            <div>
              <strong style={{ color: '#74b9ff' }}>Less Likely:</strong>
              <p style={{ margin: '0.5rem 0' }}>Webpack runtime configuration issue or import/export syntax problem</p>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#B89B5E',
              color: '#121212',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginRight: '1rem'
            }}
          >
            Back to Home
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'transparent',
              color: '#B89B5E',
              border: '1px solid #B89B5E',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Reload Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}