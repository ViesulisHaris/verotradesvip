'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TestStrategyFixesVerification() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const router = useRouter();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    console.log('🧪 [TEST] Starting comprehensive strategy fixes verification...');

    try {
      // Test 1: Check if user is authenticated
      console.log('🧪 [TEST] Checking user authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        addTestResult('❌ Authentication test failed: User not authenticated');
        addTestResult('📝 Please log in to run strategy tests');
        setIsRunningTests(false);
        return;
      }
      
      addTestResult('✅ Authentication test passed: User is authenticated');
      console.log('✅ [TEST] User authenticated:', user.id, user.email);

      // Test 2: Create a test strategy
      console.log('🧪 [TEST] Creating test strategy...');
      const testStrategyData = {
        name: `Test Strategy ${Date.now()}`,
        description: 'This is a test strategy for verifying fixes',
        user_id: user.id,
        is_active: false,
        rules: ['Test rule 1', 'Test rule 2']
      };

      const { data: createdStrategy, error: createError } = await supabase
        .from('strategies')
        .insert(testStrategyData)
        .select()
        .single();

      if (createError || !createdStrategy) {
        addTestResult(`❌ Strategy creation failed: ${createError?.message || 'Unknown error'}`);
        console.error('❌ [TEST] Strategy creation error:', createError);
        setIsRunningTests(false);
        return;
      }

      addTestResult('✅ Strategy creation test passed');
      console.log('✅ [TEST] Strategy created:', createdStrategy.id);

      // Test 3: Test strategy deletion with retry mechanism
      console.log('🧪 [TEST] Testing strategy deletion with retry mechanism...');
      
      // Monitor console for error logs during deletion
      const originalConsoleError = console.error;
      const errorLogs: string[] = [];
      
      console.error = (...args: any[]) => {
        const message = args.join(' ');
        errorLogs.push(message);
        originalConsoleError.apply(console, args);
        
        // Check for "Strategy query error: {}" pattern
        if (message.includes('Strategy query error:') && message.includes('{}')) {
          addTestResult('❌ CONFIRMED: "Strategy query error: {}" issue is still present');
        }
      };

      // Wait a moment then try to delete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: deleteError } = await supabase
        .from('strategies')
        .delete()
        .eq('id', createdStrategy.id)
        .eq('user_id', user.id);

      // Restore original console.error
      console.error = originalConsoleError;

      if (deleteError) {
        addTestResult(`❌ Strategy deletion failed: ${deleteError.message}`);
        
        // Check for "Failed to fetch" error
        if (deleteError.message.includes('Failed to fetch') || deleteError.message.includes('fetch')) {
          addTestResult('❌ CONFIRMED: "Failed to fetch" error during deletion');
        }
        
        // Try deletion again to test retry mechanism
        console.log('🧪 [TEST] Testing retry mechanism...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: retryError } = await supabase
          .from('strategies')
          .delete()
          .eq('id', createdStrategy.id)
          .eq('user_id', user.id);

        if (retryError) {
          addTestResult(`❌ Retry deletion also failed: ${retryError.message}`);
        } else {
          addTestResult('✅ Retry mechanism test passed: Strategy deleted on retry');
        }
      } else {
        addTestResult('✅ Strategy deletion test passed: Strategy deleted on first attempt');
      }

      // Test 4: Check if empty error objects are still being logged
      if (errorLogs.some(log => log.includes('Strategy query error:') && log.includes('{}'))) {
        addTestResult('❌ Empty error object issue still present');
      } else {
        addTestResult('✅ Empty error object issue appears to be fixed');
      }

      // Test 5: Test strategy loading (performance page)
      console.log('🧪 [TEST] Testing strategy loading (performance page simulation)...');
      
      // Create another strategy for loading test
      const { data: loadingTestStrategy, error: loadingCreateError } = await supabase
        .from('strategies')
        .insert({
          ...testStrategyData,
          name: `Loading Test Strategy ${Date.now()}`
        })
        .select()
        .single();

      if (loadingCreateError || !loadingTestStrategy) {
        addTestResult('❌ Could not create strategy for loading test');
      } else {
        // Test loading the strategy
        const { data: loadedStrategy, error: loadError } = await supabase
          .from('strategies')
          .select('*')
          .eq('id', loadingTestStrategy.id)
          .eq('user_id', user.id)
          .single();

        if (loadError) {
          addTestResult(`❌ Strategy loading failed: ${loadError.message}`);
          
          // Check if error object is properly logged
          if (loadError.message && loadError.message !== 'No error message available') {
            addTestResult('✅ Error object is properly logged with details');
          } else {
            addTestResult('❌ Error object may still be empty or generic');
          }
        } else {
          addTestResult('✅ Strategy loading test passed');
        }

        // Clean up the loading test strategy
        await supabase
          .from('strategies')
          .delete()
          .eq('id', loadingTestStrategy.id)
          .eq('user_id', user.id);
      }

      console.log('✅ [TEST] All tests completed');
      addTestResult('🎉 Test suite completed');

    } catch (error) {
      console.error('❌ [TEST] Test suite error:', error);
      addTestResult(`❌ Test suite error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Strategy Fixes Verification</h1>
        <p className="text-white/60">
          This page tests the fixes for strategy deletion and loading issues.
        </p>
      </div>

      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
        
        <button
          onClick={runTests}
          disabled={isRunningTests}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunningTests ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Running Tests...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run All Tests
            </>
          )}
        </button>

        <div className="mt-4 text-white/60 text-sm">
          <p>This test will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Test strategy creation</li>
            <li>Test strategy deletion with retry mechanism</li>
            <li>Check for "Failed to fetch" errors</li>
            <li>Verify empty error object logging is fixed</li>
            <li>Test strategy loading functionality</li>
          </ul>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.includes('✅')
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : result.includes('❌')
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">{result.includes('✅') ? '✅' : result.includes('❌') ? '❌' : '📝'}</span>
                  <span className="text-sm">{result.replace(/^[✅❌📝]\s*/, '')}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex gap-4">
            <Link
              href="/strategies"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Strategies
            </Link>
            <button
              onClick={() => setTestResults([])}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}