'use client';

import { useState, useEffect } from 'react';
import { createServerClient, getServerUser } from '@/lib/auth-server';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

export default function TestStrategyAuthFix() {
  const [clientUser, setClientUser] = useState<any>(null);
  const [serverUser, setServerUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string, success: boolean = true) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${message}`]);
  };

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test 1: Check client-side authentication
        const { data: { user: clientAuthUser } } = await supabase.auth.getUser();
        setClientUser(clientAuthUser);
        
        if (clientAuthUser) {
          addTestResult('Client-side authentication: User is logged in');
        } else {
          addTestResult('Client-side authentication: No user found', false);
        }

        // Test 2: Check server-side authentication
        const serverAuthUser = await getServerUser();
        setServerUser(serverAuthUser);
        
        if (serverAuthUser) {
          addTestResult('Server-side authentication: User is logged in');
        } else {
          addTestResult('Server-side authentication: No user found', false);
        }

        // Test 3: Check session consistency
        if (clientAuthUser && serverAuthUser) {
          if (clientAuthUser.id === serverAuthUser.id) {
            addTestResult('Session consistency: Client and server sessions match');
          } else {
            addTestResult('Session consistency: Client and server sessions do not match', false);
          }
        } else if (!clientAuthUser && !serverAuthUser) {
          addTestResult('Session consistency: Both client and server have no session');
        } else {
          addTestResult('Session consistency: Mismatch between client and server sessions', false);
        }

        // Test 4: Test strategies page access
        if (serverAuthUser) {
          try {
            const response = await fetch('/strategies');
            if (response.ok) {
              addTestResult('Strategies page access: Can access strategies page');
            } else {
              addTestResult(`Strategies page access: Failed with status ${response.status}`, false);
            }
          } catch (error) {
            addTestResult(`Strategies page access: Error - ${error}`, false);
          }
        } else {
          addTestResult('Strategies page access: Cannot test - no server user', false);
        }

      } catch (error) {
        addTestResult(`Test error: ${error}`, false);
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass p-6 rounded-xl">
          <h1 className="text-3xl font-bold mb-4">Strategy Access & Menu Fix Test</h1>
          <p className="text-white/70 mb-6">
            This page tests the fixes for strategy access authentication and menu highlight alignment.
          </p>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Client User:</span>
              <span className={clientUser ? 'text-green-400' : 'text-red-400'}>
                {clientUser ? `Logged in (${clientUser.email})` : 'Not logged in'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Server User:</span>
              <span className={serverUser ? 'text-green-400' : 'text-red-400'}>
                {serverUser ? `Logged in (${serverUser.email})` : 'Not logged in'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Running tests...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Menu Highlight Test:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                <li>Collapse the sidebar using the toggle button</li>
                <li>Navigate to different pages (Dashboard, Trades, Analytics, etc.)</li>
                <li>Verify that the highlight stays centered on the icon when collapsed</li>
                <li>Verify that the highlight is properly aligned and not shifted</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Strategy Access Test:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                <li>Click on the Strategies link in the sidebar</li>
                <li>Verify that you can access the strategies page without "need to login" message</li>
                <li>Verify that your strategies (if any) are displayed</li>
                <li>Verify that the Create Strategy button works</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/strategies"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Strategies
            </Link>
            <Link
              href="/trades"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Trades
            </Link>
            <Link
              href="/analytics"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}