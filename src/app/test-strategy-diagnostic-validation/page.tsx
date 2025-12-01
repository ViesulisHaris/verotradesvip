'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StrategyDiagnosticValidationPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const router = useRouter();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runDiagnosticTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    addTestResult('🔍 Starting comprehensive strategy diagnostic tests...');

    try {
      // Test 1: Check if user is authenticated
      addTestResult('📋 Test 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addTestResult(`❌ Authentication failed: ${authError.message}`);
        setIsRunningTests(false);
        return;
      }
      
      if (!user) {
        addTestResult('❌ No user found - please log in first');
        setIsRunningTests(false);
        return;
      }
      
      addTestResult(`✅ User authenticated: ${user.email}`);

      // Test 2: Try to fetch strategies to trigger potential errors
      addTestResult('📋 Test 2: Fetching strategies to check for query errors...');
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (strategiesError) {
        addTestResult(`❌ Strategies query error: ${JSON.stringify(strategiesError, null, 2)}`);
        addTestResult('🔍 This should help identify the "Strategy query error: {}" issue');
      } else {
        addTestResult(`✅ Strategies fetched successfully: ${strategies?.length || 0} strategies`);
      }

      // Test 3: Test edit button routing simulation
      addTestResult('📋 Test 3: Testing edit button routing logic...');
      
      if (strategies && strategies.length > 0) {
        const testStrategy = strategies[0];
        const editUrl = `/strategies/edit/${testStrategy.id}`;
        const performanceUrl = `/strategies/performance/${testStrategy.id}`;
        
        addTestResult(`🔍 Strategy ID: ${testStrategy.id}`);
        addTestResult(`🔍 Edit URL should be: ${editUrl}`);
        addTestResult(`🔍 Performance URL is: ${performanceUrl}`);
        addTestResult('🔍 If edit button goes to performance URL, routing issue confirmed');
      } else {
        addTestResult('⚠️ No strategies found to test routing');
      }

      // Test 4: Test strategy deletion with detailed logging
      addTestResult('📋 Test 4: Testing strategy deletion...');
      
      if (strategies && strategies.length > 0) {
        // Create a test strategy for deletion
        const { data: testStrategy, error: createError } = await supabase
          .from('strategies')
          .insert({
            user_id: user.id,
            name: 'DIAGNOSTIC TEST STRATEGY',
            description: 'This strategy was created for diagnostic testing and should be deleted',
            is_active: false
          })
          .select()
          .single();

        if (createError) {
          addTestResult(`❌ Failed to create test strategy: ${createError.message}`);
        } else if (testStrategy) {
          addTestResult(`✅ Created test strategy: ${testStrategy.id}`);
          
          // Now try to delete it
          addTestResult('🔍 Attempting to delete test strategy...');
          const { error: deleteError } = await supabase
            .from('strategies')
            .delete()
            .eq('id', testStrategy.id)
            .eq('user_id', user.id);

          if (deleteError) {
            addTestResult(`❌ Strategy deletion failed: ${JSON.stringify(deleteError, null, 2)}`);
            addTestResult('🔍 This should help identify deletion issues');
          } else {
            addTestResult('✅ Test strategy deleted successfully');
          }
        }
      } else {
        addTestResult('⚠️ No strategies available for deletion test');
      }

      // Test 5: Check for console error patterns
      addTestResult('📋 Test 5: Checking browser console for error patterns...');
      addTestResult('🔍 Look for "Strategy query error: {}" in console');
      addTestResult('🔍 Look for routing conflicts in console');
      addTestResult('🔍 Check network tab for failed requests');

      addTestResult('✅ All diagnostic tests completed!');
      addTestResult('');
      addTestResult('📝 NEXT STEPS:');
      addTestResult('1. Check console for diagnostic logs');
      addTestResult('2. Try clicking edit button on a strategy card');
      addTestResult('3. Try deleting a strategy');
      addTestResult('4. Navigate to strategy performance page');
      addTestResult('5. Review all logged error messages');

    } catch (error) {
      addTestResult(`❌ Diagnostic test suite error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Strategy Diagnostic Validation</h1>
        <p className="text-white/60">
          This page runs comprehensive tests to validate the root causes of strategy functionality issues.
        </p>
      </div>

      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Diagnostic Tests</h2>
        <p className="text-white/70 mb-4">
          Click the button below to run tests that will help identify:
        </p>
        <ul className="text-white/70 mb-4 space-y-2">
          <li>• Edit button routing conflicts</li>
          <li>• "Strategy query error: {}" console errors</li>
          <li>• Strategy deletion failures</li>
          <li>• Authentication and permission issues</li>
          <li>• Network and timing problems</li>
        </ul>
        
        <div className="flex gap-4">
          <button
            onClick={runDiagnosticTests}
            disabled={isRunningTests}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Running Diagnostic Tests...
              </>
            ) : (
              'Run Diagnostic Tests'
            )}
          </button>
          
          <button
            onClick={clearResults}
            className="px-6 py-3 glass text-white rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
              {testResults.join('\n')}
            </pre>
          </div>
          <div className="mt-4 text-white/60 text-sm">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="mt-2 space-y-1">
              <li>• Open browser DevTools (F12) to see detailed console logs</li>
              <li>• Check the Console tab for diagnostic messages</li>
              <li>• Check the Network tab for failed requests</li>
              <li>• Try the actual strategy functionality while tests run</li>
            </ul>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="glass p-6 rounded-xl mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/strategies"
            className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            <div className="font-semibold">Strategies Page</div>
            <div className="text-sm opacity-70">Test strategy cards and edit buttons</div>
          </Link>
          <Link
            href="/dashboard"
            className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-colors"
          >
            <div className="font-semibold">Dashboard</div>
            <div className="text-sm opacity-70">Return to main dashboard</div>
          </Link>
        </div>
      </div>
    </div>
  );
}