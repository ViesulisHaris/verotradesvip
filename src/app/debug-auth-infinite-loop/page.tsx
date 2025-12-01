'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/supabase/client';

export default function DebugAuthInfiniteLoop() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    };

    const runDiagnostics = async () => {
      addLog('Starting authentication diagnostics...');
      
      try {
        // 1. Check Supabase client configuration
        const supabase = getSupabaseClient();
        
        const configDiagnostics = {
          url: supabase.supabaseUrl,
          hasAuth: !!supabase.auth,
          autoRefreshToken: supabase.auth?.config?.autoRefreshToken,
          flowType: supabase.auth?.config?.flowType,
          detectSessionInUrl: supabase.auth?.config?.detectSessionInUrl,
          persistSession: supabase.auth?.config?.persistSession
        };
        
        addLog(`Supabase config: ${JSON.stringify(configDiagnostics, null, 2)}`);
        
        // 2. Check current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        const sessionDiagnostics = {
          hasSession: !!sessionData?.session,
          sessionError: sessionError?.message,
          sessionUser: sessionData?.session?.user?.email,
          sessionExpiresAt: sessionData?.session?.expires_at
        };
        
        addLog(`Session state: ${JSON.stringify(sessionDiagnostics, null, 2)}`);
        
        // 3. Check localStorage
        const storageKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('auth')
        );
        
        const storageData = storageKeys.reduce((acc: any, key) => {
          try {
            acc[key] = localStorage.getItem(key);
          } catch (e) {
            acc[key] = '[Error reading value]';
          }
          return acc;
        }, {});
        
        addLog(`Storage keys: ${storageKeys.join(', ')}`);
        addLog(`Storage data: ${JSON.stringify(storageData, null, 2)}`);
        
        setDiagnostics({
          config: configDiagnostics,
          session: sessionDiagnostics,
          storage: {
            keys: storageKeys,
            data: storageData
          }
        });
        
      } catch (error: any) {
        addLog(`Error during diagnostics: ${error.message}`);
      }
    };

    // 4. Monitor auto-refresh behavior
    const originalConsoleLog = console.log;
    console.log = function(...args: any[]) {
      if (args[0] && args[0].includes && args[0].includes('_autoRefreshTokenTick')) {
        setRefreshCount(prev => prev + 1);
        addLog(`Auto-refresh tick #${refreshCount + 1}: ${args.join(' ')}`);
      }
      originalConsoleLog.apply(console, args);
    };

    runDiagnostics();
    
    // Run diagnostics every 5 seconds to monitor changes
    const interval = setInterval(runDiagnostics, 5000);

    return () => {
      console.log = originalConsoleLog;
      clearInterval(interval);
    };
  }, [refreshCount]);

  const clearStorage = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <h1>🔍 Authentication Infinite Loop Diagnostics</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Auto-Refresh Counter: {refreshCount}</h2>
        <p style={{ color: refreshCount > 10 ? '#ef4444' : '#22c55e' }}>
          {refreshCount > 10 ? '⚠️ High refresh count detected - infinite loop confirmed!' : '✅ Normal refresh behavior'}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>🔧 Configuration Issues</h2>
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px' }}>
          <pre>{JSON.stringify(diagnostics.config, null, 2)}</pre>
        </div>
        {diagnostics.config?.autoRefreshToken && !diagnostics.session?.hasSession && (
          <div style={{ color: '#f59e0b', marginTop: '10px' }}>
            ⚠️ ISSUE DETECTED: autoRefreshToken is true but no session exists - this causes infinite loops!
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Session State</h2>
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px' }}>
          <pre>{JSON.stringify(diagnostics.session, null, 2)}</pre>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>💾 Storage Analysis</h2>
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px' }}>
          <p>Keys found: {diagnostics.storage?.keys?.join(', ') || 'None'}</p>
          <pre>{JSON.stringify(diagnostics.storage?.data, null, 2)}</pre>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📝 Live Logs</h2>
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>
          {logs.slice(-20).map((log, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={clearStorage}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🗑️ Clear Auth Storage
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Reload Page
        </button>
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '5px' }}>
        <h3>🎯 Diagnosis Summary</h3>
        <ul>
          <li>Auto-refresh count: {refreshCount > 10 ? '❌ Too high (infinite loop)' : '✅ Normal'}</li>
          <li>Session exists: {diagnostics.session?.hasSession ? '✅ Yes' : '❌ No'}</li>
          <li>Auto-refresh enabled: {diagnostics.config?.autoRefreshToken ? '✅ Yes' : '❌ No'}</li>
          <li>Storage has data: {diagnostics.storage?.keys?.length > 0 ? '✅ Yes' : '❌ No'}</li>
        </ul>
        
        {diagnostics.config?.autoRefreshToken && !diagnostics.session?.hasSession && (
          <div style={{ color: '#ef4444', marginTop: '10px', fontWeight: 'bold' }}>
            🚨 ROOT CAUSE IDENTIFIED: autoRefreshToken is enabled but no session exists.
            This causes Supabase to continuously try refreshing non-existent tokens.
          </div>
        )}
      </div>
    </div>
  );
}