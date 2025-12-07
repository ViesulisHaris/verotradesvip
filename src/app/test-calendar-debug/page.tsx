'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/contexts/AuthContext-simple';

export default function CalendarDebugPage() {
  const { user, session, loading: authLoading, authInitialized } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test 1: Authentication Status
    addTestResult('Authentication Status', 'info', `Auth Loading: ${authLoading}, Auth Initialized: ${authInitialized}, User: ${!!user}`, {
      authLoading,
      authInitialized,
      hasUser: !!user,
      userId: user?.id,
      hasSession: !!session
    });

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.from('trades').select('count').single();
      if (error) {
        addTestResult('Supabase Connection', 'error', `Failed to connect to trades table: ${error.message}`, error);
      } else {
        addTestResult('Supabase Connection', 'success', 'Successfully connected to trades table', data);
      }
    } catch (error) {
      addTestResult('Supabase Connection', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    // Test 3: User's Trades Query (if authenticated)
    if (user && authInitialized) {
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .limit(5);

        if (error) {
          addTestResult('User Trades Query', 'error', `Failed to fetch user trades: ${error.message}`, error);
        } else {
          addTestResult('User Trades Query', 'success', `Successfully fetched ${data?.length || 0} trades`, data);
        }
      } catch (error) {
        addTestResult('User Trades Query', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
      }
    } else {
      addTestResult('User Trades Query', 'info', 'Skipped - User not authenticated');
    }

    // Test 4: Calendar Dependencies
    try {
      const { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } = await import('date-fns');
      const testDate = new Date();
      const monthStart = startOfMonth(testDate);
      const monthEnd = endOfMonth(testDate);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      addTestResult('Calendar Dependencies', 'success', `Date-fns functions working. Generated ${days.length} days for current month`, {
        testDate: testDate.toISOString(),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        daysCount: days.length
      });
    } catch (error) {
      addTestResult('Calendar Dependencies', 'error', `Failed to import or use date-fns: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    // Test 5: Environment Variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV
    };
    addTestResult('Environment Variables', 'info', 'Environment variables status', envVars);

    setIsLoading(false);
  };

  useEffect(() => {
    if (authInitialized) {
      runTests();
    }
  }, [authInitialized, user]);

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Calendar Debug Test</h1>
        
        <div className="mb-8">
          <button
            onClick={runTests}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success' ? 'bg-green-900/30 border-green-500/50' :
                result.status === 'error' ? 'bg-red-900/30 border-red-500/50' :
                'bg-blue-900/30 border-blue-500/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{result.test}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' ? 'bg-green-600 text-white' :
                  result.status === 'error' ? 'bg-red-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-300 mb-2">{result.message}</p>
              {result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Details</summary>
                  <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
              <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
            </div>
          ))}
        </div>

        {testResults.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            <p>Click "Run Tests" to start debugging the calendar functionality</p>
          </div>
        )}
      </div>
    </div>
  );
}