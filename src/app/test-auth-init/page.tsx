'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';

export default function TestAuthInit() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  const { user, loading, authInitialized } = useAuth();

  useEffect(() => {
    setIsClient(true);
    
    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    };

    addLog('Component mounted');
    addLog(`Is client: ${typeof window !== 'undefined'}`);
    addLog(`Auth state: loading=${loading}, authInitialized=${authInitialized}, hasUser=${!!user}`);
    
    // Test auth context initialization over time
    let checkCount = 0;
    const interval = setInterval(() => {
      checkCount++;
      addLog(`Check ${checkCount}: loading=${loading}, authInitialized=${authInitialized}, hasUser=${!!user}`);
      
      if (checkCount >= 10 || authInitialized) {
        clearInterval(interval);
        addLog('Auth check completed');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, loading, authInitialized]);

  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        Loading...
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
        🔧 Auth Initialization Test
      </h1>

      <div style={{
        backgroundColor: '#1f2937',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Current Auth State</h2>
        <div>Loading: {loading ? 'YES' : 'NO'}</div>
        <div>Auth Initialized: {authInitialized ? 'YES' : 'NO'}</div>
        <div>Has User: {user ? 'YES' : 'NO'}</div>
        <div>User Email: {user?.email || 'N/A'}</div>
      </div>

      <div style={{
        backgroundColor: '#1f2937',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Diagnostic Logs</h2>
        <div style={{
          maxHeight: '300px',
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '0.25rem' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        backgroundColor: authInitialized ? '#065f46' : '#7f1d1d',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: `1px solid ${authInitialized ? '#10b981' : '#ef4444'}`
      }}>
        <h3 style={{ marginBottom: '0.5rem' }}>
          {authInitialized ? '✅ Auth Initialized Successfully' : '⚠️ Auth Not Initialized'}
        </h3>
        <div>
          {authInitialized 
            ? 'Authentication context has properly initialized. The gray screen issue should be resolved.'
            : 'Authentication context is still initializing. This may be causing the gray screen.'}
        </div>
      </div>
    </div>
  );
}