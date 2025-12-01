'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestCalendarAuth() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults((prev: string[]) => {
      const isoString = new Date().toISOString();
      const timeParts = isoString.split('T');
      const timeString = timeParts[1] || '00:00:00.000Z';
      const timePart = timeString.split('.')[0] || '00:00:00';
      const currentPrev = prev || [];
      return [...currentPrev, `${timePart} - ${message}`];
    });
  };

  const runAuthTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('🔍 Starting calendar authentication diagnosis...');
    
    // Test 1: Check if Supabase client is available
    try {
      addResult(`🔍 Test 1: Supabase client available: ${!!supabase}`);
      
      // Test 2: Check environment variables
      addResult(`🔍 Test 2: Environment variables check:`);
      addResult(`   - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
      addResult(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
      
      // Test 3: Try to get session immediately (simulating calendar page behavior)
      addResult(`🔍 Test 3: Immediate session check (simulating calendar page)...`);
      const immediateSessionStart = performance.now();
      const { data: { session: immediateSession }, error: immediateError } = await supabase.auth.getSession();
      const immediateSessionEnd = performance.now();
      
      addResult(`   - Session check time: ${(immediateSessionEnd - immediateSessionStart).toFixed(2)}ms`);
      addResult(`   - Has session: ${!!immediateSession}`);
      addResult(`   - User ID: ${immediateSession?.user?.id || 'None'}`);
      addResult(`   - Error: ${immediateError?.message || 'None'}`);
      
      // Test 4: Wait for AuthProvider to initialize (simulating wait time)
      addResult(`🔍 Test 4: Waiting 500ms for AuthProvider initialization...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 5: Check session after wait
      addResult(`🔍 Test 5: Session check after wait...`);
      const waitedSessionStart = performance.now();
      const { data: { session: waitedSession }, error: waitedError } = await supabase.auth.getSession();
      const waitedSessionEnd = performance.now();
      
      addResult(`   - Session check time: ${(waitedSessionEnd - waitedSessionStart).toFixed(2)}ms`);
      addResult(`   - Has session: ${!!waitedSession}`);
      addResult(`   - User ID: ${waitedSession?.user?.id || 'None'}`);
      addResult(`   - Error: ${waitedError?.message || 'None'}`);
      
      // Test 6: Try getUser() immediately (this is where the error occurs)
      addResult(`🔍 Test 6: Immediate getUser() call (this is where AuthSessionMissingError occurs)...`);
      try {
        const getUserStart = performance.now();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const getUserEnd = performance.now();
        
        addResult(`   - getUser() time: ${(getUserEnd - getUserStart).toFixed(2)}ms`);
        addResult(`   - Has user: ${!!user}`);
        addResult(`   - User ID: ${user?.id || 'None'}`);
        addResult(`   - Error: ${userError?.message || 'None'}`);
        
        if (userError?.name === 'AuthSessionMissingError') {
          addResult(`🚨 CONFIRMED: AuthSessionMissingError detected!`);
          addResult(`   - Error details: ${JSON.stringify(userError, null, 2)}`);
        }
      } catch (error) {
        addResult(`🚨 Exception in getUser(): ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 7: Try getUser() after session is confirmed
      if (waitedSession) {
        addResult(`🔍 Test 7: getUser() call after confirmed session...`);
        try {
          const { data: { user: confirmedUser }, error: confirmedError } = await supabase.auth.getUser();
          
          addResult(`   - Has user: ${!!confirmedUser}`);
          addResult(`   - User ID: ${confirmedUser?.id || 'None'}`);
          addResult(`   - Error: ${confirmedError?.message || 'None'}`);
        } catch (error) {
          addResult(`🚨 Exception in confirmed getUser(): ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Test 8: Simulate calendar page fetchTrades behavior
      addResult(`🔍 Test 8: Simulating calendar page fetchTrades() behavior...`);
      try {
        // First getSession() (like calendar page does)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addResult(`   - Session error: ${sessionError.message}`);
          return;
        }
        
        if (!session) {
          addResult(`   - No session found, would skip fetch`);
          return;
        }
        
        // Then getUser() (like calendar page does)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          addResult(`   - User error: ${userError.message}`);
          if (userError.name === 'AuthSessionMissingError') {
            addResult(`🚨 CONFIRMED: Race condition detected! Session exists but getUser() fails.`);
          }
          return;
        }
        
        if (!user) {
          addResult(`   - No user found despite having session`);
          return;
        }
        
        addResult(`   - Successfully authenticated: ${user.id}`);
        
        // Try to fetch trades (like calendar page does)
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .limit(5);
          
        if (tradesError) {
          addResult(`   - Trades error: ${tradesError.message}`);
        } else {
          addResult(`   - Successfully fetched ${trades?.length || 0} trades`);
        }
        
      } catch (error) {
        addResult(`🚨 Exception in fetchTrades simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addResult('✅ Authentication diagnosis completed!');
      
    } catch (error) {
      addResult(`🚨 Test failed with exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Calendar Authentication Diagnosis
        </h1>
        
        <div className="mb-8 text-center">
          <button
            onClick={runAuthTest}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running Diagnosis...' : 'Run Authentication Diagnosis'}
          </button>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-white">Test Results:</h2>
          <div className="space-y-2 font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-white/60">Click the button above to run the diagnosis...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className={`p-2 rounded ${
                  result.includes('🚨') ? 'bg-red-900/30 text-red-300' :
                  result.includes('✅') ? 'bg-green-900/30 text-green-300' :
                  result.includes('⚠️') ? 'bg-yellow-900/30 text-yellow-300' :
                  'text-white/80'
                }`}>
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-8 glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-white">Expected Findings:</h2>
          <div className="space-y-2 text-white/80">
            <p>• If AuthSessionMissingError occurs, it will likely show up in Test 6 (immediate getUser() call)</p>
            <p>• The error should disappear in Test 7 (getUser() after confirmed session)</p>
            <p>• This confirms a race condition between AuthProvider initialization and calendar page rendering</p>
            <p>• The fix should involve ensuring the calendar page waits for AuthProvider to complete initialization</p>
          </div>
        </div>
      </div>
    </div>
  );
}