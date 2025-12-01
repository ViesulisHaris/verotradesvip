'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';

export default function DebugGrayScreen() {
  const { user, loading, authInitialized } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [cssVariables, setCssVariables] = useState<any>({});

  useEffect(() => {
    // Check CSS Variables
    const computedStyle = getComputedStyle(document.documentElement);
    const variables = {
      '--deep-charcoal': computedStyle.getPropertyValue('--deep-charcoal'),
      '--warm-off-white': computedStyle.getPropertyValue('--warm-off-white'),
      '--dusty-gold': computedStyle.getPropertyValue('--dusty-gold'),
      '--soft-graphite': computedStyle.getPropertyValue('--soft-graphite'),
      '--muted-gray': computedStyle.getPropertyValue('--muted-gray'),
    };

    setCssVariables(variables);

    // Check authentication state
    const authState = {
      user: user ? { id: user.id, email: user.email } : null,
      loading,
      authInitialized,
      timestamp: new Date().toISOString()
    };

    // Check DOM elements
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    
    const domState = {
      bodyStyles: {
        backgroundColor: getComputedStyle(bodyElement).backgroundColor,
        color: getComputedStyle(bodyElement).color,
        display: getComputedStyle(bodyElement).display,
        visibility: getComputedStyle(bodyElement).visibility,
        opacity: getComputedStyle(bodyElement).opacity,
      },
      htmlStyles: {
        backgroundColor: getComputedStyle(htmlElement).backgroundColor,
        color: getComputedStyle(htmlElement).color,
      },
      bodyClasses: bodyElement.className,
      htmlClasses: htmlElement.className,
    };

    // Check for any error boundaries or error messages
    const errorElements = document.querySelectorAll('[data-error-boundary="true"], .error, .error-message');
    const consoleErrors = console.error.toString();

    setDiagnostics({
      authState,
      domState,
      cssVariables: variables,
      errorElements: errorElements.length,
      hasConsoleErrors: consoleErrors !== 'function error() { [native code] }',
      timestamp: new Date().toISOString()
    });

    console.log('🔍 [GRAY-SCREEN-DEBUG] Diagnostics:', {
      authState,
      domState,
      cssVariables: variables,
      errorElements: errorElements.length
    });
  }, [user, loading, authInitialized]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      color: '#fff',
      zIndex: 9999,
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      overflow: 'auto',
    }}>
      <h1 style={{ color: '#ff6b6b', marginBottom: '20px' }}>🔍 Gray Screen Diagnostics</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#4ecdc4', marginBottom: '10px' }}>Authentication State:</h2>
        <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(diagnostics.authState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#4ecdc4', marginBottom: '10px' }}>CSS Variables:</h2>
        <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(cssVariables, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#4ecdc4', marginBottom: '10px' }}>DOM State:</h2>
        <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(diagnostics.domState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#4ecdc4', marginBottom: '10px' }}>Error Detection:</h2>
        <p>Error Elements Found: {diagnostics.errorElements}</p>
        <p>Console Errors: {diagnostics.hasConsoleErrors ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#4ecdc4', marginBottom: '10px' }}>Quick Tests:</h2>
        <button 
          onClick={() => {
            document.body.style.backgroundColor = '#121212';
            document.body.style.color = '#EAE6DD';
            console.log('🔧 Manual color override applied');
          }}
          style={{
            backgroundColor: '#B89B5E',
            color: '#121212',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Force Dark Theme
        </button>
        
        <button 
          onClick={() => {
            console.log('🔧 Current URL:', window.location.href);
            console.log('🔧 Pathname:', window.location.pathname);
            console.log('🔧 User Agent:', navigator.userAgent);
          }}
          style={{
            backgroundColor: '#4ecdc4',
            color: '#000',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Log Environment
        </button>
      </div>

      <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            backgroundColor: '#ff6b6b',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}