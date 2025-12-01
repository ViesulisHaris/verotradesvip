'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/supabase/client';
import Script from 'next/script';

export default function SessionPersistenceDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 [PAGE_DIAGNOSTIC] Starting session persistence diagnostics...');
      
      const results: any = {
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Check localStorage before any operations
      results.tests.localStorageBefore = {
        keys: Object.keys(localStorage),
        supabaseKeys: Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-') || key.includes('auth')
        ),
        totalKeys: Object.keys(localStorage).length
      };

      // Test 2: Check sessionStorage before any operations
      results.tests.sessionStorageBefore = {
        keys: Object.keys(sessionStorage),
        supabaseKeys: Object.keys(sessionStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-') || key.includes('auth')
        ),
        totalKeys: Object.keys(sessionStorage).length
      };

      // Test 3: Check Supabase client configuration
      try {
        const supabase = getSupabaseClient();
        results.tests.supabaseClient = {
          available: !!supabase,
          hasAuth: !!(supabase && supabase.auth),
          config: {
            // Note: We can't directly access the config, but we can test behavior
          }
        };

        // Test 4: Try to get current session
        if (supabase && supabase.auth) {
          const { data: { session }, error } = await supabase.auth.getSession();
          results.tests.currentSession = {
            hasSession: !!session,
            userEmail: session?.user?.email,
            error: error?.message,
            sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          };
        }
      } catch (error) {
        results.tests.supabaseClient = {
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 5: Monitor storage operations for the next 5 seconds
      const storageOperations: any[] = [];
      
      const originalRemoveItem = localStorage.removeItem;
      const originalSessionRemoveItem = sessionStorage.removeItem;
      
      localStorage.removeItem = function(key) {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
          storageOperations.push({
            type: 'localStorage',
            action: 'removeItem',
            key,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
          });
          console.warn('🚨 [DIAGNOSTIC] localStorage key removed:', key);
        }
        return originalRemoveItem.call(this, key);
      };
      
      sessionStorage.removeItem = function(key) {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
          storageOperations.push({
            type: 'sessionStorage',
            action: 'removeItem',
            key,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
          });
          console.warn('🚨 [DIAGNOSTIC] sessionStorage key removed:', key);
        }
        return originalSessionRemoveItem.call(this, key);
      };

      // Wait 5 seconds to catch any storage operations
      setTimeout(() => {
        results.tests.storageOperations = storageOperations;
        
        // Test 6: Check localStorage after monitoring
        results.tests.localStorageAfter = {
          keys: Object.keys(localStorage),
          supabaseKeys: Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('sb-') || key.includes('auth')
          ),
          totalKeys: Object.keys(localStorage).length
        };

        // Test 7: Check sessionStorage after monitoring
        results.tests.sessionStorageAfter = {
          keys: Object.keys(sessionStorage),
          supabaseKeys: Object.keys(sessionStorage).filter(key => 
            key.includes('supabase') || key.includes('sb-') || key.includes('auth')
          ),
          totalKeys: Object.keys(sessionStorage).length
        };

        // Calculate data loss
        results.tests.dataLoss = {
          localStorage: results.tests.localStorageBefore.supabaseKeys.length - results.tests.localStorageAfter.supabaseKeys.length,
          sessionStorage: results.tests.sessionStorageBefore.supabaseKeys.length - results.tests.sessionStorageAfter.supabaseKeys.length
        };

        setDiagnosticResults(results);
        setIsLoading(false);

        // Restore original functions
        localStorage.removeItem = originalRemoveItem;
        sessionStorage.removeItem = originalSessionRemoveItem;
        
        console.log('✅ [PAGE_DIAGNOSTIC] Diagnostics completed:', results);
      }, 5000);
    };

    runDiagnostics();
  }, []);

  const clearAllSupabaseData = () => {
    console.log('🧹 [MANUAL_TEST] Manually clearing all Supabase data...');
    const authKeys = Object.keys(localStorage).filter(key =>
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    );
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('🧹 [MANUAL_TEST] Removed localStorage key:', key);
      } catch (e) {
        console.warn('🧹 [MANUAL_TEST] Failed to remove localStorage key:', key, e);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
        try {
          sessionStorage.removeItem(key);
          console.log('🧹 [MANUAL_TEST] Removed sessionStorage key:', key);
        } catch (e) {
          console.warn('🧹 [MANUAL_TEST] Failed to remove sessionStorage key:', key, e);
        }
      }
    });
    
    alert('Cleared all Supabase data. Refresh the page to test session recovery.');
  };

  const testSessionRecovery = async () => {
    console.log('🔄 [MANUAL_TEST] Testing session recovery...');
    try {
      const supabase = getSupabaseClient();
      if (supabase && supabase.auth) {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔄 [MANUAL_TEST] Session recovery result:', { session: !!session, error: error?.message });
        alert(`Session recovery: ${session ? 'SUCCESS' : 'FAILED'}\nUser: ${session?.user?.email || 'None'}\nError: ${error?.message || 'None'}`);
      }
    } catch (error) {
      console.error('🔄 [MANUAL_TEST] Session recovery test failed:', error);
      alert(`Session recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Persistence Diagnostic</h1>
        
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Running diagnostics... Monitoring storage operations for 5 seconds...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(diagnosticResults, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={clearAllSupabaseData}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Clear All Supabase Data
              </button>
              <button
                onClick={testSessionRecovery}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Test Session Recovery
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Refresh Page
              </button>
            </div>

            <div className="bg-yellow-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Expected Issues:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Data loss should show {'>'} 0 for localStorage/sessionStorage</li>
                <li>Storage operations should show clearCorruptedAuthData() removing keys</li>
                <li>Session recovery should fail after page refresh</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}