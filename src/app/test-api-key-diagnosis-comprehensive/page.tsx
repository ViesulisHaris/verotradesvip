'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

interface TestResults {
  keyFormat?: {
    length: number;
    startsWithEy: boolean;
    hasThreeParts: boolean;
  };
  clientCheck?: {
    exists: boolean;
    hasAuth: boolean;
    hasFunctions: boolean;
    hasStorage: boolean;
    hasFrom: boolean;
  };
  connectionTest?: {
    success: boolean;
    error?: string;
    code?: string;
    duration?: number;
  };
  authTest?: {
    success: boolean;
    error?: string;
    isApiKeyError?: boolean;
    unexpected?: boolean;
  };
  sessionTest?: {
    success: boolean;
    error?: string;
    hasSession?: boolean;
  };
  browserCheck?: {
    isClient: boolean;
    hasLocalStorage: boolean;
    hasSessionStorage: boolean;
    userAgent: string;
  };
}

export default function APIKeyDiagnosisPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResults>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[API Key Diagnosis] ${message}`);
  };

  const runComprehensiveDiagnosis = async () => {
    setIsLoading(true);
    setLogs([]);
    setTestResults({});

    addLog('🔍 Starting comprehensive API key diagnosis...');

    // Test 1: Environment Variables Check
    addLog('\n📋 Test 1: Environment Variables Check');
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV
    };

    addLog(`URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing'}`);
    addLog(`ANON_KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}`);
    addLog(`SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing'}`);
    
    if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === envVars.SUPABASE_SERVICE_ROLE_KEY) {
      addLog('⚠️  WARNING: ANON_KEY and SERVICE_ROLE_KEY are identical!');
    }

    // Test 2: API Key Format Validation
    addLog('\n🔑 Test 2: API Key Format Validation');
    if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const keyFormat = {
        length: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.length,
        startsWithEy: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ'),
        hasThreeParts: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.').length === 3
      };
      
      addLog(`Key length: ${keyFormat.length} characters`);
      addLog(`Starts with 'eyJ': ${keyFormat.startsWithEy ? '✅' : '❌'}`);
      addLog(`Has 3 parts (header.payload.signature): ${keyFormat.hasThreeParts ? '✅' : '❌'}`);
      
      setTestResults((prev: TestResults) => ({ ...prev, keyFormat }));
    }

    // Test 3: Supabase Client Initialization
    addLog('\n🔧 Test 3: Supabase Client Initialization');
    try {
      addLog('Checking supabase client...');
      const clientCheck = {
        exists: !!supabase,
        hasAuth: !!(supabase && supabase.auth),
        hasFunctions: !!(supabase && supabase.functions),
        hasStorage: !!(supabase && supabase.storage),
        hasFrom: typeof (supabase && supabase.from) === 'function'
      };
      
      addLog(`Client exists: ${clientCheck.exists ? '✅' : '❌'}`);
      addLog(`Has auth: ${clientCheck.hasAuth ? '✅' : '❌'}`);
      addLog(`Has functions: ${clientCheck.hasFunctions ? '✅' : '❌'}`);
      addLog(`Has storage: ${clientCheck.hasStorage ? '✅' : '❌'}`);
      addLog(`Has from method: ${clientCheck.hasFrom ? '✅' : '❌'}`);
      
      setTestResults((prev: TestResults) => ({ ...prev, clientCheck }));
    } catch (error) {
      addLog(`❌ Client check failed: ${error}`);
    }

    // Test 4: API Connectivity Test
    addLog('\n🌐 Test 4: API Connectivity Test');
    try {
      const startTime = performance.now();
      const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
      const endTime = performance.now();
      
      if (error) {
        addLog(`❌ API Connection failed: ${error.message}`);
        addLog(`Error code: ${error.code || 'No code'}`);
        addLog(`Error hint: ${JSON.stringify(error.hint || [])}`);
        
        // Check if it's an API key error
        if (error.message?.toLowerCase().includes('invalid api key') || 
            error.message?.toLowerCase().includes('api key')) {
          addLog('🚨 CONFIRMED: This is an API key validation error!');
        }
        
        setTestResults((prev: TestResults) => ({
          ...prev,
          connectionTest: { success: false, error: error.message, code: error.code }
        }));
      } else {
        addLog(`✅ API Connection successful (${(endTime - startTime).toFixed(2)}ms)`);
        setTestResults((prev: TestResults) => ({
          ...prev,
          connectionTest: { success: true, duration: endTime - startTime }
        }));
      }
    } catch (error) {
      addLog(`❌ Connection test exception: ${error}`);
      setTestResults((prev: TestResults) => ({
        ...prev,
        connectionTest: { success: false, error: String(error) }
      }));
    }

    // Test 5: Authentication Method Test
    addLog('\n🔐 Test 5: Authentication Method Test');
    try {
      addLog('Testing signInWithPassword method...');
      
      // Test with invalid credentials to check API key validation
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'invalid-password'
      });
      
      if (error) {
        addLog(`Auth method response: ${error.message}`);
        
        // Differentiate between API key errors and credential errors
        if (error.message?.toLowerCase().includes('invalid api key')) {
          addLog('🚨 API KEY ERROR: The API key itself is invalid');
        } else if (error.message?.toLowerCase().includes('invalid login')) {
          addLog('✅ API KEY VALID: Got expected credential error (key is valid)');
        } else {
          addLog(`⚠️  Unexpected error: ${error.message}`);
        }
        
        setTestResults((prev: TestResults) => ({
          ...prev,
          authTest: { success: false, error: error.message, isApiKeyError: error.message?.toLowerCase().includes('invalid api key') }
        }));
      } else {
        addLog('✅ Auth method works (unexpected success)');
        setTestResults((prev: TestResults) => ({
          ...prev,
          authTest: { success: true, unexpected: true }
        }));
      }
    } catch (error) {
      addLog(`❌ Auth test exception: ${error}`);
      setTestResults((prev: TestResults) => ({
        ...prev,
        authTest: { success: false, error: String(error) }
      }));
    }

    // Test 6: Session Test
    addLog('\n📝 Test 6: Session Test');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`❌ Session test failed: ${error.message}`);
        setTestResults((prev: TestResults) => ({
          ...prev,
          sessionTest: { success: false, error: error.message }
        }));
      } else {
        addLog(`✅ Session test successful: ${data.session ? 'Session exists' : 'No session'}`);
        setTestResults((prev: TestResults) => ({
          ...prev,
          sessionTest: { success: true, hasSession: !!data.session }
        }));
      }
    } catch (error) {
      addLog(`❌ Session test exception: ${error}`);
      setTestResults((prev: TestResults) => ({
        ...prev,
        sessionTest: { success: false, error: String(error) }
      }));
    }

    // Test 7: Browser Environment Check
    addLog('\n🌍 Test 7: Browser Environment Check');
    const browserCheck = {
      isClient: typeof window !== 'undefined',
      hasLocalStorage: typeof localStorage !== 'undefined',
      hasSessionStorage: typeof sessionStorage !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'
    };
    
    addLog(`Client-side: ${browserCheck.isClient ? '✅' : '❌'}`);
    addLog(`LocalStorage: ${browserCheck.hasLocalStorage ? '✅' : '❌'}`);
    addLog(`SessionStorage: ${browserCheck.hasSessionStorage ? '✅' : '❌'}`);
    addLog(`User Agent: ${browserCheck.userAgent}`);
    
    setTestResults((prev: TestResults) => ({ ...prev, browserCheck }));

    addLog('\n🏁 Diagnosis complete!');
    setIsLoading(false);
  };

  const getDiagnosis = () => {
    const { connectionTest, authTest, keyFormat, clientCheck } = testResults;
    
    if (authTest?.isApiKeyError) {
      return {
        severity: 'critical',
        title: '🚨 API Key Invalid',
        description: 'The Supabase API key is being rejected by the server. This is the root cause of the login issue.',
        solution: 'Check Supabase dashboard for correct API key and ensure it has proper permissions.'
      };
    }
    
    if (!clientCheck?.exists || !clientCheck?.hasAuth) {
      return {
        severity: 'critical',
        title: '🔧 Supabase Client Not Initialized',
        description: 'The Supabase client is not properly initialized.',
        solution: 'Check environment variables and client initialization code.'
      };
    }
    
    if (connectionTest?.error?.toLowerCase().includes('invalid api key')) {
      return {
        severity: 'critical',
        title: '🔑 API Key Validation Failed',
        description: 'The API key is being rejected during database operations.',
        solution: 'Verify the API key in Supabase dashboard and ensure it\'s not expired or revoked.'
      };
    }
    
    if (keyFormat && (!keyFormat.startsWithEy || !keyFormat.hasThreeParts)) {
      return {
        severity: 'high',
        title: '📝 API Key Format Issue',
        description: 'The API key format appears to be incorrect.',
        solution: 'Ensure you\'re using a valid JWT token from Supabase dashboard.'
      };
    }
    
    return {
      severity: 'info',
      title: '✅ No Critical Issues Found',
      description: 'The basic configuration appears correct. The issue might be elsewhere.',
      solution: 'Check network connectivity and Supabase project status.'
    };
  };

  const diagnosis = getDiagnosis();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#121212', 
      color: '#EAE6DD', 
      padding: '2rem',
      fontFamily: 'monospace'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#B89B5E' }}>
          🔍 Comprehensive API Key Diagnosis
        </h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={runComprehensiveDiagnosis}
            disabled={isLoading}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#B89B5E',
              color: '#121212',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '🔄 Running Diagnosis...' : '🔍 Start Diagnosis'}
          </button>
        </div>

        {testResults.connectionTest && (
          <div style={{
            backgroundColor: diagnosis.severity === 'critical' ? 'rgba(167, 53, 45, 0.1)' : 
                            diagnosis.severity === 'high' ? 'rgba(245, 158, 11, 0.1)' : 
                            'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${diagnosis.severity === 'critical' ? '#A7352D' : 
                                 diagnosis.severity === 'high' ? '#F59E0B' : '#22C55E'}`,
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: diagnosis.severity === 'critical' ? '#ff6b6b' : 
                                 diagnosis.severity === 'high' ? '#fbbf24' : '#4ade80' }}>
              {diagnosis.title}
            </h2>
            <p style={{ marginBottom: '1rem' }}>{diagnosis.description}</p>
            <p><strong>Solution:</strong> {diagnosis.solution}</p>
          </div>
        )}

        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '1rem',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#B89B5E', marginBottom: '1rem' }}>📋 Diagnostic Logs:</h3>
          {logs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {log}
            </div>
          ))}
        </div>

        {Object.keys(testResults).length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#B89B5E', marginBottom: '1rem' }}>📊 Test Results Summary:</h3>
            <pre style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '1rem',
              overflow: 'auto',
              fontSize: '0.9rem'
            }}>
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}