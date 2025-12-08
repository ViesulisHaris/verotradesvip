'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  error?: string;
  duration?: number;
}

export default function TestStrategyRuleComplianceFix() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([
    { testName: 'Test basic strategies query', status: 'pending' },
    { testName: 'Test strategies with filters', status: 'pending' },
    { testName: 'Test strategy rules query', status: 'pending' },
    { testName: 'Test TradeForm strategies loading', status: 'pending' },
    { testName: 'Test getStrategiesWithStats function', status: 'pending' },
    { testName: 'Test strategy creation', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          testName: updated[index].testName,
          status: updated[index].status,
          details: updated[index].details,
          error: updated[index].error,
          duration: updated[index].duration,
          ...result
        };
      }
      return updated;
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    try {
      // Test 1: Basic strategies query
      await runTest(0, async () => {
        const { data, error } = await supabase
          .from('strategies')
          .select('id, name, is_active')
          .limit(10);
        
        if (error) {
          if (error.message.includes('strategy_rule_compliance')) {
            throw new Error(`strategy_rule_compliance error detected: ${error.message}`);
          }
          throw new Error(error.message);
        }
        
        return `Successfully queried ${data.length} strategies`;
      });

      // Test 2: Strategies with filters
      await runTest(1, async () => {
        const { data, error } = await supabase
          .from('strategies')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          if (error.message.includes('strategy_rule_compliance')) {
            throw new Error(`strategy_rule_compliance error detected: ${error.message}`);
          }
          throw new Error(error.message);
        }
        
        return `Successfully queried ${data.length} active strategies`;
      });

      // Test 3: Strategy rules query
      await runTest(2, async () => {
        const { data, error } = await supabase
          .from('strategy_rules')
          .select('id, rule_type, rule_value')
          .limit(5);
        
        if (error) {
          if (error.message.includes('strategy_rule_compliance')) {
            throw new Error(`strategy_rule_compliance error detected: ${error.message}`);
          }
          throw new Error(error.message);
        }
        
        return `Successfully queried ${data.length} strategy rules`;
      });

      // Test 4: TradeForm-style strategies loading
      await runTest(3, async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('strategies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(100);
        
        if (error) {
          if (error.message.includes('strategy_rule_compliance')) {
            throw new Error(`strategy_rule_compliance error detected: ${error.message}`);
          }
          throw new Error(error.message);
        }
        
        return `Successfully loaded ${data.length} strategies for TradeForm`;
      });

      // Test 5: getStrategiesWithStats function
      await runTest(4, async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Import and test the function
        const { getStrategiesWithStats } = await import('@/lib/strategy-rules-engine');
        const strategies = await getStrategiesWithStats(user.id);
        
        return `Successfully loaded ${strategies.length} strategies with stats`;
      });

      // Test 6: Strategy creation
      await runTest(5, async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const testStrategy = {
          user_id: user.id,
          name: `Test Strategy ${Date.now()}`,
          description: 'Temporary test strategy for schema fix verification',
          rules: ['Test rule 1', 'Test rule 2'],
          is_active: true
        };

        const { data, error } = await supabase
          .from('strategies')
          .insert(testStrategy)
          .select('id')
          .single();
        
        if (error) {
          if (error.message.includes('strategy_rule_compliance')) {
            throw new Error(`strategy_rule_compliance error detected: ${error.message}`);
          }
          throw new Error(error.message);
        }

        // Clean up - delete the test strategy
        await supabase
          .from('strategies')
          .delete()
          .eq('id', data.id);
        
        return `Successfully created and deleted test strategy`;
      });

      // Check if all tests passed
      const allPassed = testResults.every(test => test.status === 'passed');
      setOverallStatus(allPassed ? 'success' : 'error');

    } catch (error) {
      console.error('Test suite error:', error);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const runTest = async (index: number, testFn: () => Promise<string>) => {
    const startTime = Date.now();
    updateTestResult(index, { status: 'running' });
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(index, { 
        status: 'passed', 
        details: result,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(index, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'running':
        return 'text-blue-400';
      case 'passed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Strategy Rule Compliance Fix Test</h1>
          <p className="text-gray-400 mb-6">
            This page tests whether the strategy_rule_compliance schema fix has resolved the database errors.
            It runs a series of tests to verify that strategies can be queried without errors.
          </p>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
            
            <button
              onClick={() => router.push('/strategies')}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Strategies Page
            </button>
            
            <button
              onClick={() => router.push('/log-trade')}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Trade Form
            </button>
          </div>

          {/* Overall Status */}
          {overallStatus !== 'idle' && (
            <div className={`p-4 rounded-lg mb-6 ${
              overallStatus === 'success' ? 'bg-green-900/50 border border-green-700' :
              overallStatus === 'error' ? 'bg-red-900/50 border border-red-700' :
              'bg-blue-900/50 border border-blue-700'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {overallStatus === 'success' ? '✅' :
                   overallStatus === 'error' ? '❌' : '🔄'}
                </span>
                <div>
                  <h3 className="font-semibold">
                    {overallStatus === 'success' ? 'All Tests Passed!' :
                     overallStatus === 'error' ? 'Some Tests Failed' : 'Running Tests...'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {overallStatus === 'success' ? 'The strategy_rule_compliance fix was successful.' :
                     overallStatus === 'error' ? 'There may still be schema issues to resolve.' :
                     'Please wait while tests complete...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.map((test, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${getStatusColor(test.status)}`}>
                    {test.testName}
                  </h3>
                  {test.details && (
                    <p className="text-sm text-gray-300 mt-1">{test.details}</p>
                  )}
                  {test.error && (
                    <p className="text-sm text-red-400 mt-1">{test.error}</p>
                  )}
                  {test.duration && (
                    <p className="text-xs text-gray-500 mt-1">Duration: {test.duration}ms</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">If Tests Fail</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Run the schema fix script: <code className="bg-gray-700 px-2 py-1 rounded">STRATEGY_RULE_COMPLIANCE_SCHEMA_FIX.sql</code></li>
            <li>Execute it in the Supabase SQL Editor or via the Node.js script</li>
            <li>Wait a few minutes for cache to clear</li>
            <li>Run these tests again</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">If Tests Pass</h3>
          <p className="text-gray-300">
            The strategy_rule_compliance schema issue has been resolved. You should now be able to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-300 mt-2">
            <li>View strategies in the TradeForm dropdown</li>
            <li>Access the Strategies page without errors</li>
            <li>Create and edit strategies normally</li>
          </ul>
        </div>
      </div>
    </div>
  );
}