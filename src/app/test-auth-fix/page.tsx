'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient, clearCorruptedAuthData, getSupabaseInitializationStatus } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestAuthFix() {
  const [status, setStatus] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    const runTest = async () => {
      addLog('Starting auth fix test...');
      
      try {
        // Step 1: Clear corrupted auth data
        addLog('Step 1: Clearing corrupted auth data...');
        clearCorruptedAuthData();
        
        // Step 2: Check initialization status
        addLog('Step 2: Checking initialization status...');
        const initStatus = getSupabaseInitializationStatus();
        setStatus(initStatus);
        addLog(`Init status: ${JSON.stringify(initStatus, null, 2)}`);
        
        // Step 3: Test session retrieval
        addLog('Step 3: Testing session retrieval...');
        const supabase = getSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        addLog(`Session result: ${!!session ? 'Found' : 'None'}`);
        if (error) {
          addLog(`Session error: ${error.message}`);
        }
        
        // Step 4: Monitor for auto-refresh (should be disabled)
        addLog('Step 4: Monitoring for auto-refresh...');
        let refreshCount = 0;
        const originalConsoleLog = console.log;
        
        console.log = function(...args: any[]) {
          if (args[0] && args[0].includes && args[0].includes('_autoRefreshTokenTick')) {
            refreshCount++;
            addLog(`❌ AUTO-REFRESH DETECTED #${refreshCount}: ${args.join(' ')}`);
          }
          originalConsoleLog.apply(console, args);
        };
        
        // Wait 10 seconds to check for auto-refresh
        setTimeout(() => {
          console.log = originalConsoleLog;
          
          if (refreshCount === 0) {
            addLog('✅ SUCCESS: No auto-refresh detected in 10 seconds!');
            setStatus((prev: any) => ({ ...prev, autoRefreshFixed: true }));
          } else {
            addLog(`❌ FAILURE: Auto-refresh still running (${refreshCount} times)`);
            setStatus((prev: any) => ({ ...prev, autoRefreshFixed: false }));
          }
        }, 10000);
        
      } catch (error: any) {
        addLog(`Test error: ${error.message}`);
        setStatus((prev: any) => ({ ...prev, error: error.message }));
      }
    };

    runTest();
  }, []);

  const testLogin = async () => {
    addLog('Testing login process...');
    try {
      const supabase = getSupabaseClient();
      
      // Test with dummy credentials (will fail but should show if auth works)
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email: 'test@example.com', 
        password: 'testpassword' 
      });
      
      if (error) {
        addLog(`Login test failed as expected: ${error.message}`);
      } else {
        addLog(`Login test succeeded unexpectedly: ${!!data?.user}`);
      }
    } catch (error: any) {
      addLog(`Login test exception: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <h1>🔧 Authentication Fix Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Initialization Status</h2>
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px' }}>
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>
        
        {status.autoRefreshFixed === true && (
          <div style={{ color: '#22c55e', marginTop: '10px', fontWeight: 'bold' }}>
            ✅ AUTO-REFRESH LOOP FIXED!
          </div>
        )}
        
        {status.autoRefreshFixed === false && (
          <div style={{ color: '#ef4444', marginTop: '10px', fontWeight: 'bold' }}>
            ❌ AUTO-REFRESH LOOP STILL ACTIVE
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>🧪 Test Actions</h2>
        <button 
          onClick={testLogin}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
            marginBottom: '10px'
          }}
        >
          🧪 Test Login Process
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Reload Page
        </button>
        
        <button 
          onClick={() => router.push('/login')}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔐 Go to Login
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📝 Test Logs</h2>
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>
          {logs.slice(-20).map((log, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '5px' }}>
        <h3>🎯 Expected Results</h3>
        <ul>
          <li>autoRefreshDisabled: true</li>
          <li>autoRefreshFixed: true (after 10 seconds)</li>
          <li>No auto-refresh logs in console</li>
          <li>Auth initialization completes without errors</li>
        </ul>
        
        <h3>🔧 What This Tests</h3>
        <ul>
          <li>CLEAR: Removes corrupted auth data causing loops</li>
          <li>INITIALIZE: Tests fixed Supabase client creation</li>
          <li>MONITOR: Watches for auto-refresh token activity</li>
          <li>LOGIN: Tests authentication flow works</li>
        </ul>
      </div>
    </div>
  );
}