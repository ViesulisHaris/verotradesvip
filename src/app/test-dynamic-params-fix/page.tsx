'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';

export default function TestDynamicParamsFix() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [strategies, setStrategies] = useState<any[]>([]);

  const addTestResult = (message: string, success: boolean = true) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Check if user is authenticated
      addTestResult('Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        addTestResult('User not authenticated - please log in first', false);
        setIsRunning(false);
        return;
      }
      addTestResult('User authenticated successfully');
      
      // Test 2: Fetch strategies to get a valid ID
      addTestResult('Fetching strategies...');
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(5);
        
      if (strategiesError) {
        addTestResult(`Error fetching strategies: ${strategiesError.message}`, false);
        setIsRunning(false);
        return;
      }
      
      if (!strategiesData || strategiesData.length === 0) {
        addTestResult('No strategies found - please create a strategy first', false);
        setIsRunning(false);
        return;
      }
      
      addTestResult(`Found ${strategiesData.length} strategies`);
      setStrategies(strategiesData);
      
      // Test 3: Test navigation to strategy performance page
      addTestResult('Testing navigation to strategy performance page...');
      const testStrategy = strategiesData[0];
      
      // Navigate to the performance page to test the fix
      router.push(`/strategies/performance/${testStrategy.id}`);
      
      addTestResult('Navigating to performance page - check console for errors');
      
    } catch (error) {
      addTestResult(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Test Dynamic Params Fix</h1>
        <p className="text-white/60">This page tests the Next.js dynamic params fix for strategy performance and edit pages.</p>
      </div>

      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
        
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isRunning ? 'Running Tests...' : 'Run Dynamic Params Test'}
        </button>
        
        <div className="space-y-2">
          {testResults.length === 0 ? (
            <p className="text-white/60">Click "Run Dynamic Params Test" to start testing.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-white/80 font-mono text-sm">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {strategies.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Available Strategies</h2>
          <div className="space-y-2">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/80">{strategy.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/strategies/performance/${strategy.id}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    View Performance
                  </button>
                  <button
                    onClick={() => router.push(`/strategies/edit/${strategy.id}`)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass p-6 rounded-xl mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">What to Check</h2>
        <ul className="text-white/80 space-y-2">
          <li>• No console errors when navigating to performance pages</li>
          <li>• No console errors when navigating to edit pages</li>
          <li>• Strategy data loads correctly on performance pages</li>
          <li>• Strategy data loads correctly on edit pages</li>
          <li>• No "params is a Promise" errors in console</li>
        </ul>
      </div>
    </div>
  );
}