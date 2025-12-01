'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-diagnostic';
import { getSupabaseClient } from '@/supabase/client';

export default function TestAuthDiagnostic() {
  const { user, session, loading, authInitialized } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [supabaseClientStatus, setSupabaseClientStatus] = useState<any>({});

  useEffect(() => {
    // Check localStorage for session data
    if (typeof window !== 'undefined') {
      // DIAGNOSTIC: Check ALL possible Supabase keys
      const allKeys = Object.keys(localStorage);
      const supabaseKeys = allKeys.filter(key => 
        key.includes('supabase') || key.includes('sb-') || key.includes('auth')
      );
      
      const localStorageInfo = {
        totalKeys: allKeys.length,
        allKeys: allKeys,
        supabaseKeys: supabaseKeys,
        supabaseKeyValues: supabaseKeys.reduce((acc, key) => {
          acc[key] = {
            hasValue: !!localStorage.getItem(key),
            valueLength: localStorage.getItem(key)?.length || 0,
            valuePreview: localStorage.getItem(key) ? `${localStorage.getItem(key)!.substring(0, 50)}...` : 'null'
          };
          return acc;
        }, {} as Record<string, any>)
      };
      
      setLocalStorageData(localStorageInfo);

      // DIAGNOSTIC: Check Supabase client status
      try {
        const supabase = getSupabaseClient();
        setSupabaseClientStatus({
          hasClient: !!supabase,
          hasAuth: !!supabase?.auth,
          clientUrl: supabase?.supabaseUrl,
          canGetSession: !!supabase?.auth?.getSession
        });
      } catch (error) {
        setSupabaseClientStatus({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Run comprehensive auth tests
      const results = [
        {
          name: 'Auth Context Initialized',
          status: authInitialized ? 'PASS' : 'FAIL',
          details: authInitialized ? 'Auth context has completed initialization' : 'Auth context still initializing'
        },
        {
          name: 'Auth Loading State',
          status: !loading ? 'PASS' : 'FAIL',
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
          status: supabaseKeys.length > 0 ? 'PASS' : 'FAIL',
          details: supabaseKeys.length > 0 ? `Found ${supabaseKeys.length} Supabase-related keys` : 'No Supabase session data in localStorage'
        },
        {
          name: 'Expected Storage Key Found',
          status: supabaseKeys.includes('sb-bzmixuxautbmqbrqtufx-auth-token') ? 'PASS' : 'FAIL',
          details: supabaseKeys.includes('sb-bzmixuxautbmqbrqtufx-auth-token') ? 
            'Expected storage key found' : 'Expected storage key not found - checking alternative keys'
        }
      ];

      setTestResults(results);
    }
  }, [user, session, loading, authInitialized]);

  const runManualTest = async () => {
    try {
      console.log('🔧 [DIAGNOSTIC_TEST] Testing session persistence...');
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        alert('Supabase client not available');
        return;
      }
      
      // Test session retrieval
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔧 [DIAGNOSTIC_TEST] Session error:', error);
        alert(`Session retrieval error: ${error.message}`);
      } else {
        console.log('🔧 [DIAGNOSTIC_TEST] Session retrieved:', !!currentSession);
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
      console.error('🔧 [DIAGNOSTIC_TEST] Test error:', error);
      alert(`Test error: ${(error as Error).message}`);
    }
  };

  const clearAllSessionData = () => {
    if (typeof window !== 'undefined') {
      // Clear ALL Supabase-related keys
      const allKeys = Object.keys(localStorage);
      const supabaseKeys = allKeys.filter(key => 
        key.includes('supabase') || key.includes('sb-') || key.includes('auth')
      );
      
      console.log('🔧 [DIAGNOSTIC_TEST] Clearing all auth data keys:', supabaseKeys);
      
      supabaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('🔧 [DIAGNOSTIC_TEST] Failed to remove key:', key, e);
        }
      });
      
      // Also clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn('🔧 [DIAGNOSTIC_TEST] Failed to remove sessionStorage key:', key, e);
          }
        }
      });
      
      // Refresh the page to see changes
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Authentication Diagnostic Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

          {/* Supabase Client Status Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Supabase Client Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Client Available:</span>
                <span className={`font-mono ${supabaseClientStatus.hasClient ? 'text-green-400' : 'text-red-400'}`}>
                  {supabaseClientStatus.hasClient ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Auth Available:</span>
                <span className={`font-mono ${supabaseClientStatus.hasAuth ? 'text-green-400' : 'text-red-400'}`}>
                  {supabaseClientStatus.hasAuth ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Can Get Session:</span>
                <span className={`font-mono ${supabaseClientStatus.canGetSession ? 'text-green-400' : 'text-red-400'}`}>
                  {supabaseClientStatus.canGetSession ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              {supabaseClientStatus.error && (
                <div className="text-red-400 text-xs mt-2">
                  Error: {supabaseClientStatus.error}
                </div>
              )}
            </div>
          </div>

          {/* LocalStorage Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">LocalStorage Analysis</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Keys:</span>
                <span className="font-mono text-blue-400">{localStorageData.totalKeys}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Supabase Keys:</span>
                <span className={`font-mono ${localStorageData.supabaseKeys?.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {localStorageData.supabaseKeys?.length || 0}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-slate-300 text-sm">Found Keys:</span>
                <div className="mt-2 space-y-1">
                  {localStorageData.supabaseKeys?.map((key: string) => (
                    <div key={key} className="text-xs text-slate-400 font-mono break-all">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Diagnostic Test Results</h2>
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
          <h2 className="text-xl font-semibold text-white mb-4">Manual Diagnostic Tests</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={runManualTest}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Test Session Retrieval
            </button>
            <button
              onClick={clearAllSessionData}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All Auth Data
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Diagnostic Information</h2>
          <div className="space-y-2 text-slate-300">
            <p>• This diagnostic page uses enhanced logging to identify authentication issues</p>
            <p>• Check the browser console for detailed diagnostic messages</p>
            <p>• The LocalStorage Analysis shows all Supabase-related keys found</p>
            <p>• Expected key: <code className="bg-slate-700 px-2 py-1 rounded">sb-bzmixuxautbmqbrqtufx-auth-token</code></p>
            <p>• If the expected key is not found, Supabase may be using a different key format</p>
          </div>
        </div>
      </div>
    </div>
  );
}