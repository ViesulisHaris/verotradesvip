'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { AuthContextProviderSimple } from '@/contexts/AuthContext-simple';

function DebugGraySpaceContent() {
  const { user, loading: authLoading, authInitialized } = useAuth();
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  const [domElements, setDomElements] = useState<string[]>([]);

  useEffect(() => {
    // Check CSS custom properties
    const computedStyle = getComputedStyle(document.documentElement);
    const importantVars = [
      '--deep-charcoal',
      '--soft-graphite', 
      '--warm-off-white',
      '--muted-gray',
      '--dusty-gold',
      '--glass-morphism-bg',
      '--border-primary'
    ];
    
    const vars: Record<string, string> = {};
    importantVars.forEach(varName => {
      vars[varName] = computedStyle.getPropertyValue(varName);
    });
    setCssVars(vars);

    // Check DOM elements
    const body = document.body;
    const main = document.querySelector('main');
    const elements: string[] = [];
    
    elements.push(`Body background: ${getComputedStyle(body).backgroundColor}`);
    elements.push(`Body display: ${getComputedStyle(body).display}`);
    
    if (main) {
      elements.push(`Main background: ${getComputedStyle(main).backgroundColor}`);
      elements.push(`Main display: ${getComputedStyle(main).display}`);
      elements.push(`Main height: ${getComputedStyle(main).height}`);
    }
    
    setDomElements(elements);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#000', 
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      <h1 style={{ color: '#B89B5E', marginBottom: '20px' }}>Gray Space Diagnostic Tool</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#D4B87F', marginBottom: '10px' }}>Authentication State</h2>
        <div>Auth Loading: {authLoading ? 'YES' : 'NO'}</div>
        <div>Auth Initialized: {authInitialized ? 'YES' : 'NO'}</div>
        <div>User: {user ? user.email : 'NONE'}</div>
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: authLoading || !authInitialized ? '#ff000020' : '#00ff0020',
          border: '1px solid #666'
        }}>
          {authLoading || !authInitialized ? 
            '⚠️ AUTH STATE WOULD CAUSE GRAY SPACE' : 
            '✅ Auth state should allow content rendering'
          }
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#D4B87F', marginBottom: '10px' }}>CSS Custom Properties</h2>
        {Object.entries(cssVars).map(([varName, value]) => (
          <div key={varName} style={{ 
            marginBottom: '5px',
            padding: '5px',
            backgroundColor: value ? '#00ff0020' : '#ff000020',
            border: '1px solid #666'
          }}>
            {varName}: {value || 'NOT FOUND - This would cause gray space!'}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#D4B87F', marginBottom: '10px' }}>DOM Elements</h2>
        {domElements.map((element, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {element}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#D4B87F', marginBottom: '10px' }}>Test Links</h2>
        <div style={{ marginBottom: '10px' }}>
          <a href="/login" style={{ color: '#B89B5E', marginRight: '20px' }}>Test Login Page</a>
          <a href="/dashboard" style={{ color: '#B89B5E' }}>Test Dashboard</a>
        </div>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#333', 
        border: '1px solid #B89B5E',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#B89B5E', marginBottom: '10px' }}>Diagnostic Instructions</h3>
        <ol>
          <li>Check if CSS custom properties are loading (should NOT be "NOT FOUND")</li>
          <li>Check if auth state would cause gray space</li>
          <li>Click test links to visit actual pages</li>
          <li>If pages show gray space, check browser console for errors</li>
        </ol>
      </div>
    </div>
  );
}

export default function DebugGraySpace() {
  return (
    <AuthContextProviderSimple>
      <DebugGraySpaceContent />
    </AuthContextProviderSimple>
  );
}