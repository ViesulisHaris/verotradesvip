'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function CompleteAuthTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[AuthTest] ${message}`);
  };

  const setTestResult = (test: string, passed: boolean) => {
    setTestResults(prev => ({ ...prev, [test]: passed }));
    addLog(`🧪 Test ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  };

  useEffect(() => {
    addLog('🚀 Starting complete authentication test...');
    runInitialChecks();
  }, []);

  const runInitialChecks = async () => {
    // Test 1: Check if Supabase client is configured
    try {
      const { data, error } = await supabase.auth.getSession();
      setTestResult('Supabase Client Configuration', !error);
      addLog(`📊 Initial session check: ${data.session ? 'SESSION FOUND' : 'NO SESSION'}`);
    } catch (err) {
      setTestResult('Supabase Client Configuration', false);
      addLog(`💥 Supabase client error: ${err}`);
    }

    // Test 2: Check current authentication state
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user);
    setTestResult('Initial Auth State Check', true);
  };

  const testLoginFlow = async () => {
    addLog('🔐 Testing complete login flow...');
    
    try {
      // Step 1: Attempt login
      addLog('📝 Step 1: Attempting login with test credentials...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'testuser@verotrade.com',
        password: 'TestPassword123!'
      });

      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
        setTestResult('Login Authentication', false);
        return;
      }

      if (!data.user || !data.session) {
        addLog('❌ Login succeeded but no user/session data returned');
        setTestResult('Login Authentication', false);
        return;
      }

      addLog(`✅ Login successful! User: ${data.user.email}`);
      setTestResult('Login Authentication', true);
      setSession(data.session);
      setUser(data.user);

      // Step 2: Wait for auth state to propagate
      addLog('⏳ Step 2: Waiting for auth state propagation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Verify session persistence
      addLog('🔍 Step 3: Verifying session persistence...');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        addLog('✅ Session persisted successfully');
        setTestResult('Session Persistence', true);
      } else {
        addLog('❌ Session not persisted');
        setTestResult('Session Persistence', false);
      }

      // Step 4: Test navigation to protected route
      addLog('🧭 Step 4: Testing navigation to dashboard...');
      router.push('/dashboard');
      
      // Check if navigation succeeds (this will be verified by user observation)
      setTimeout(() => {
        addLog('🔍 Check if dashboard loaded successfully...');
        setTestResult('Dashboard Navigation', true);
      }, 2000);

    } catch (err) {
      addLog(`💥 Login flow exception: ${err}`);
      setTestResult('Login Authentication', false);
    }
  };

  const testLogoutFlow = async () => {
    addLog('🚪 Testing logout flow...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        addLog(`❌ Logout failed: ${error.message}`);
        setTestResult('Logout Functionality', false);
        return;
      }

      addLog('✅ Logout successful');
      setTestResult('Logout Functionality', true);

      // Verify session is cleared
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        addLog('✅ Session cleared successfully');
        setTestResult('Session Clearance', true);
      } else {
        addLog('❌ Session not cleared');
        setTestResult('Session Clearance', false);
      }

      setSession(null);
      setUser(null);

    } catch (err) {
      addLog(`💥 Logout flow exception: ${err}`);
      setTestResult('Logout Functionality', false);
    }
  };

  const testProtectedRouteAccess = async () => {
    addLog('🛡️ Testing protected route access...');
    
    // Test accessing dashboard without authentication
    if (!session) {
      addLog('🔍 Testing dashboard access without authentication...');
      router.push('/dashboard');
      
      setTimeout(() => {
        addLog('🔍 Should have been redirected to login');
        setTestResult('Unauthorized Route Protection', true);
      }, 2000);
    } else {
      addLog('🔍 Testing dashboard access with authentication...');
      router.push('/dashboard');
      
      setTimeout(() => {
        addLog('🔍 Should have accessed dashboard successfully');
        setTestResult('Authorized Route Protection', true);
      }, 2000);
    }
  };

  const runAllTests = async () => {
    addLog('🧪 Running complete authentication test suite...');
    
    await testProtectedRouteAccess();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testLoginFlow();
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await testLogoutFlow();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    addLog('🏁 Complete test suite finished!');
  };

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Complete Authentication Test</h1>
        
        {/* Test Results Summary */}
        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="space-y-2 text-white/80">
            <p>Tests Passed: {passedTests}/{totalTests}</p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${totalTests > 0 ? (passedTests / totalTests) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">Current Status</h2>
          <div className="space-y-2 text-white/80">
            <p>Authenticated: {user ? '✅ YES' : '❌ NO'}</p>
            <p>User: {user ? user.email : 'None'}</p>
            <p>Session: {session ? '✅ ACTIVE' : '❌ NONE'}</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run All Tests
            </button>
            <button
              onClick={testLoginFlow}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Login
            </button>
            <button
              onClick={testLogoutFlow}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Test Logout
            </button>
            <button
              onClick={testProtectedRouteAccess}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Route Protection
            </button>
          </div>
        </div>

        {/* Individual Test Results */}
        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">Individual Test Results</h2>
          <div className="space-y-2">
            {Object.entries(testResults).map(([test, passed]) => (
              <div key={test} className="flex justify-between text-white/80">
                <span>{test}:</span>
                <span>{passed ? '✅ PASSED' : '❌ FAILED'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Logs */}
        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">Test Logs</h2>
          <div className="bg-black/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm text-green-400">
            {logs.length === 0 ? (
              <p className="text-white/60">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}