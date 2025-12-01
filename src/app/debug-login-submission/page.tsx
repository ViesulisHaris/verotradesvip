'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function DebugLoginSubmission() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addLog('🔍 Debug page loaded');
    
    // Check Supabase status
    try {
      const status = {
        supabaseExists: !!supabase,
        supabaseAuth: !!supabase?.auth,
        supabaseUrl: supabase?.supabaseUrl || 'Not available',
        envVars: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
        }
      };
      setSupabaseStatus(status);
      addLog(`Supabase status: ${JSON.stringify(status, null, 2)}`);
    } catch (error: any) {
      addLog(`❌ Error checking Supabase: ${error.message}`);
    }
  }, []);

  const testDirectSupabaseCall = async () => {
    addLog('🔍 Testing direct Supabase auth call...');
    
    try {
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      });
      
      addLog(`Direct call result: ${JSON.stringify({
        hasError: !!result.error,
        errorMessage: result.error?.message,
        hasData: !!result.data,
        hasUser: !!result.data?.user,
        hasSession: !!result.data?.session
      }, null, 2)}`);
      
    } catch (error: any) {
      addLog(`❌ Direct call exception: ${error.message}`);
      addLog(`Stack: ${error.stack}`);
    }
  };

  const testFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    addLog('🔍 Form submission started');
    addLog(`Email: ${email}`);
    addLog(`Password length: ${password.length}`);
    addLog(`Is submitting: ${isSubmitting}`);
    
    if (isSubmitting) {
      addLog('❌ Already submitting - blocking');
      return;
    }
    
    setIsSubmitting(true);
    addLog('✅ Set submitting to true');
    
    try {
      addLog('🔍 Calling supabase.auth.signInWithPassword...');
      
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      addLog(`🔍 Supabase response received`);
      addLog(`- Has error: ${!!error}`);
      addLog(`- Error message: ${error?.message || 'None'}`);
      addLog(`- Has data: ${!!data}`);
      addLog(`- Has user: ${!!data?.user}`);
      addLog(`- Has session: ${!!data?.session}`);
      
      if (error) {
        addLog(`❌ Authentication failed: ${error.message}`);
      } else if (data?.user) {
        addLog(`✅ Authentication successful for user: ${data.user.email}`);
        addLog(`🔍 User ID: ${data.user.id}`);
      } else {
        addLog(`❌ Unexpected response - no error but no user`);
      }
      
    } catch (error: any) {
      addLog(`❌ Exception during authentication: ${error.message}`);
      addLog(`Error name: ${error.name}`);
      addLog(`Error stack: ${error.stack}`);
    } finally {
      addLog('🔍 Setting submitting to false');
      setIsSubmitting(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🔍 Logs cleared');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '2rem',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '2rem' }}>
        🔍 Login Form Submission Debug
      </h1>

      {/* Supabase Status */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>Supabase Status</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(supabaseStatus, null, 2)}
        </pre>
      </div>

      {/* Test Form */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>Test Login Form</h2>
        <form onSubmit={testFormSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#1e3a8a',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                borderRadius: '4px'
              }}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#1e3a8a',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                borderRadius: '4px'
              }}
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem',
              backgroundColor: isSubmitting ? '#6b7280' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Test Login'}
          </button>
        </form>
        
        <button
          onClick={testDirectSupabaseCall}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Direct Supabase Call
        </button>
      </div>

      {/* Logs */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '1rem',
        borderRadius: '8px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Debug Logs</h2>
          <button
            onClick={clearLogs}
            style={{
              padding: '0.5rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Logs
          </button>
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '0.25rem' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}