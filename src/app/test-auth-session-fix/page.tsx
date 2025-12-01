'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { getSupabaseClient } from '@/supabase/client';

export default function TestAuthSessionFix() {
  const { user, session, loading, authInitialized } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // Check localStorage for session data
    if (typeof window !== 'undefined') {
      const storageKey = 'sb-bzmixuxautbmqbrqtufx-auth-token';
      const storedData = localStorage.getItem(storageKey);
      
      setLocalStorageData({
        hasData: !!storedData,
        dataLength: storedData?.length || 0,
        dataPreview: storedData ? `${storedData.substring(0, 50)}...` : 'null',
        storageKey
      });

      // Run comprehensive auth tests
      const results = [
        {
          name: 'Auth Context Initialized',
          status: authInitialized ? 'PASS' : 'FAIL',
          details: authInitialized ? 'Auth context has completed initialization' : 'Auth context still initializing'
        },
        {
          name: 'Auth Loading State',
          status: loading ? 'PASS' : 'FAIL',
          details: loading ? 'Auth context is in loading state' : 'Auth context is not loading'
        },
        {
          name: 'User Session Available',
          status: !!user ? 'PASS' : 'FAIL',
          details: !!user ? `User found: ${user.email}` : 'No user session found'
        },
        {
          name: 'Session Object Available',
          status: !!session ? 'PASS' : 'FAIL',
          details: !!session ? `Session valid until: ${new Date(session.expires_at!).toLocaleString()}` : 'No session object found'
        },
        {
          name: 'Supabase Client Available',
          status: !!getSupabaseClient() ? 'PASS' : 'FAIL',
          details: !!getSupabaseClient() ? 'Supabase client is properly initialized' : 'Supabase client not available'
        },
        {
          name: 'LocalStorage Session Data',
          status: !!storedData ? 'PASS' : 'FAIL',
          details: !!storedData ? `Found ${storedData.length} characters in localStorage` : 'No session data in localStorage'
        }
      ];

      setTestResults(results);
    }
  }, [user, session, loading, authInitialized]);

  const runManualTest = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        alert('Supabase client not available');
        return;
      }

      console.log('🔧 [MANUAL_TEST] Testing session persistence...');
      
      // Test session retrieval
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔧 [MANUAL_TEST] Session error:', error);
        alert(`Session retrieval error: ${error.message}`);
      } else {
        console.log('🔧 [MANUAL_TEST] Session retrieved:', !!currentSession);
        alert(`Session found: ${!!currentSession}`);
      }

      // Update test results
      setTestResults(prev => [
        ...prev,
        {
          name: 'Manual Session Test',
          status: !error ? 'PASS' : 'FAIL',
          details: !error ? `Manual test completed successfully` : `Error: ${error?.message}`
        }
      ]);
    } catch (error) {
      console.error('🔧 [MANUAL_TEST] Test error:', error);
      alert(`Test error: ${(error as Error).message}`);
    }
  };

  const clearSessionData = () => {
    if (typeof window !== 'undefined') {
      const storageKey = 'sb-bzmixuxautbmqbrqtufx-auth-token';
      localStorage.removeItem(storageKey);
      setLocalStorageData({
        hasData: false,
        dataLength: 0,
        dataPreview: 'null',
        storageKey
      });
      console.log('🔧 [MANUAL_TEST] Session data cleared from localStorage');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Authentication Session Fix Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Auth State Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Authentication State</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Loading:</span>
                <span className={`font-mono ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
                  {loading ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Initialized:</span>
                <span className={`font-mono ${authInitialized ? 'text-green-400' : 'text-yellow-400'}`}>
                  {authInitialized ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">User:</span>
                <span className={`font-mono ${user ? 'text-green-400' : 'text-red-400'}`}>
                  {user ? user.email : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Session:</span>
                <span className={`font-mono ${session ? 'text-green-400' : 'text-red-400'}`}>
                  {session ? 'VALID' : 'NONE'}
                </span>
              </div>
            </div>
          </div>

          {/* LocalStorage Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">LocalStorage Session Data</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Has Data:</span>
                <span className={`font-mono ${localStorageData.hasData ? 'text-green-400' : 'text-red-400'}`}>
                  {localStorageData.hasData ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Data Length:</span>
                <span className="font-mono text-blue-400">{localStorageData.dataLength}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Storage Key:</span>
                <span className="font-mono text-xs text-slate-400">{localStorageData.storageKey}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded bg-slate-900/50">
                <span className="text-slate-300">{result.name}</span>
                <span className={`font-mono px-3 py-1 rounded text-sm ${
                  result.status === 'PASS' ? 'bg-green-600/20 text-green-400' : 
                  result.status === 'FAIL' ? 'bg-red-600/20 text-red-400' : 
                  'bg-yellow-600/20 text-yellow-400'
                }`}>
                  {result.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Test Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Tests</h2>
          <div className="flex gap-4">
            <button
              onClick={runManualTest}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Test Session Retrieval
            </button>
            <button
              onClick={clearSessionData}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear LocalStorage
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Expected Results</h2>
          <div className="space-y-2 text-slate-300">
            <p>• <span className="text-green-400">Auth Context Initialized: TRUE</span> - Auth context should complete initialization</p>
            <p>• <span className="text-green-400">Auth Loading State: FALSE</span> - Should not be stuck in loading</p>
            <p>• <span className="text-yellow-400">User Session: DEPENDS</span> - User depends on whether logged in</p>
            <p>• <span className="text-yellow-400">Session Object: DEPENDS</span> - Session depends on whether logged in</p>
            <p>• <span className="text-green-400">Supabase Client: TRUE</span> - Client should be available</p>
            <p>• <span className="text-yellow-400">LocalStorage Data: DEPENDS</span> - Data depends on whether previously logged in</p>
          </div>
        </div>
      </div>
    </div>
  );
}