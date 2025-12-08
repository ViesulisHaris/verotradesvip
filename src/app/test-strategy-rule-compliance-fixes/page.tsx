'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { validateSchema, validateTable, safeQuery, clearSchemaCache } from '@/lib/schema-validation';
import DashboardCard from '@/components/ui/DashboardCard';

// Simple Card component for container usage
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass p-6 rounded-xl ${className || ''}`}>
      {children}
    </div>
  );
}

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  details?: any;
  duration?: number;
}

export default function TestStrategyRuleComplianceFixes() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          name: updated[index].name,
          status: updated[index].status,
          message: updated[index].message,
          details: updated[index].details,
          duration: updated[index].duration,
          ...result
        };
      }
      return updated;
    });
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setLogs([]);
    setTestResults([
      { name: 'Schema Validation', status: 'pending' },
      { name: 'Cache-Busting Client', status: 'pending' },
      { name: 'Safe Query Wrapper', status: 'pending' },
      { name: 'Strategies Query (Original)', status: 'pending' },
      { name: 'Strategies Query (Safe)', status: 'pending' },
      { name: 'Strategy Rules Query', status: 'pending' },
      { name: 'Complex Join Query', status: 'pending' },
      { name: 'Error Handling', status: 'pending' }
    ]);

    try {
      // Test 1: Schema Validation
      addLog('Testing schema validation...');
      const schemaStart = Date.now();
      const schemaValidation = await validateSchema();
      const schemaDuration = Date.now() - schemaStart;
      
      updateTestResult(0, {
        status: schemaValidation.isValid ? 'success' : 'error',
        message: schemaValidation.isValid ? 'Schema is consistent' : schemaValidation.error,
        duration: schemaDuration
      });
      
      addLog(`Schema validation: ${schemaValidation.isValid ? 'PASSED' : 'FAILED'}`);
      if (!schemaValidation.isValid) {
        addLog(`Schema error: ${schemaValidation.error}`);
      }

      // Test 2: Cache-Busting Client
      addLog('Testing cache-busting client...');
      const cacheStart = Date.now();
      
      try {
        const { data: cacheTestData, error: cacheTestError } = await supabase
          .from('strategies')
          .select('count(*)')
          .single();
        
        const cacheDuration = Date.now() - cacheStart;
        
        updateTestResult(1, {
          status: cacheTestError ? 'error' : 'success',
          message: cacheTestError ? cacheTestError.message : 'Cache-busting client working',
          details: { data: cacheTestData, error: cacheTestError },
          duration: cacheDuration
        });
        
        addLog(`Cache-busting client: ${cacheTestError ? 'FAILED' : 'PASSED'}`);
      } catch (err) {
        updateTestResult(1, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - cacheStart
        });
        addLog(`Cache-busting client: FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Test 3: Safe Query Wrapper
      addLog('Testing safe query wrapper...');
      const safeStart = Date.now();
      
      try {
        const { data: safeData, error: safeError, validationError } = await safeQuery(
          async () => supabase.from('strategies').select('*').limit(5),
          'strategies',
          'select'
        );
        
        const safeDuration = Date.now() - safeStart;
        
        updateTestResult(2, {
          status: safeError || validationError ? 'error' : 'success',
          message: validationError || (safeError ? safeError.message : 'Safe query wrapper working'),
          details: { data: safeData, error: safeError, validationError },
          duration: safeDuration
        });
        
        addLog(`Safe query wrapper: ${safeError || validationError ? 'FAILED' : 'PASSED'}`);
        if (validationError) {
          addLog(`Validation error: ${validationError}`);
        }
      } catch (err) {
        updateTestResult(2, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - safeStart
        });
        addLog(`Safe query wrapper: FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Test 4: Original Strategies Query
      addLog('Testing original strategies query...');
      const originalStart = Date.now();
      
      try {
        const { data: originalData, error: originalError } = await supabase
          .from('strategies')
          .select('*')
          .limit(5) as any;
        
        const originalDuration = Date.now() - originalStart;
        
        updateTestResult(3, {
          status: originalError ? 'error' : 'success',
          message: originalError ? originalError.message : 'Original client working',
          details: { data: originalData, error: originalError },
          duration: originalDuration
        });
        
        addLog(`Original strategies query: ${originalError ? 'FAILED' : 'PASSED'}`);
        if (originalError?.message?.includes('strategy_rule_compliance')) {
          addLog('⚠️ STRATEGY_RULE_COMPLIANCE ERROR DETECTED IN ORIGINAL CLIENT!');
        }
      } catch (err) {
        updateTestResult(3, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - originalStart
        });
        addLog(`Original strategies query: FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Test 5: Safe Strategies Query
      addLog('Testing safe strategies query...');
      const safeStrategiesStart = Date.now();
      
      try {
        const { data: safeStrategiesData, error: safeStrategiesError, validationError: safeValidationError } = await safeQuery(
          async () => supabase.from('strategies').select('*').limit(5),
          'strategies',
          'select'
        );
        
        const safeStrategiesDuration = Date.now() - safeStrategiesStart;
        
        updateTestResult(4, {
          status: safeStrategiesError || safeValidationError ? 'error' : 'success',
          message: safeValidationError || (safeStrategiesError ? safeStrategiesError.message : 'Safe strategies query working'),
          details: { data: safeStrategiesData, error: safeStrategiesError, validationError: safeValidationError },
          duration: safeStrategiesDuration
        });
        
        addLog(`Safe strategies query: ${safeStrategiesError || safeValidationError ? 'FAILED' : 'PASSED'}`);
      } catch (err) {
        updateTestResult(4, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - safeStrategiesStart
        });
        addLog(`Safe strategies query: FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Test 6: Strategy Rules Query
      addLog('Testing strategy rules query...');
      const rulesStart = Date.now();
      
      try {
        const { data: rulesData, error: rulesError } = await supabase
          .from('strategy_rules')
          .select('*')
          .limit(5) as any;
        
        const rulesDuration = Date.now() - rulesStart;
        
        updateTestResult(5, {
          status: rulesError ? 'error' : 'success',
          message: rulesError ? rulesError.message : 'Strategy rules query working',
          details: { data: rulesData, error: rulesError },
          duration: rulesDuration
        });
        
        addLog(`Strategy rules query: ${rulesError ? 'FAILED' : 'PASSED'}`);
      } catch (err) {
        updateTestResult(5, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - rulesStart
        });
        addLog(`Strategy rules query: FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Test 7: Complex Join Query
      addLog('Testing complex join query...');
      const complexStart = Date.now();
      
      try {
        const { data: complexData, error: complexError } = await supabase
          .from('strategies')
          .select(`
            *,
            trades:trades(count),
            strategy_rules:strategy_rules(count)
          `)
          .limit(5) as any;
        
        const complexDuration = Date.now() - complexStart;
        
        updateTestResult(6, {
          status: complexError ? 'error' : 'success',
          message: complexError ? complexError.message : 'Complex join query working',
          details: { data: complexData, error: complexError },
          duration: complexDuration
        });
        
        addLog(`Complex join query: ${complexError ? 'FAILED' : 'PASSED'}`);
        if (complexError?.message?.includes('strategy_rule_compliance')) {
          addLog('⚠️ STRATEGY_RULE_COMPLIANCE ERROR DETECTED IN COMPLEX QUERY!');
        }
      } catch (err) {
        updateTestResult(6, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - complexStart
        });
        addLog(`Complex join query: FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Test 8: Error Handling
      addLog('Testing error handling...');
      const errorStart = Date.now();
      
      try {
        // Test error handling with a non-existent table instead of the deleted one
        const { data: errorData, error: expectedError } = await supabase
          .from('non_existent_test_table')
          .select('*')
          .limit(1) as any;
        
        const errorDuration = Date.now() - errorStart;
        
        // This should fail, so if it succeeds, that's unexpected
        updateTestResult(7, {
          status: expectedError ? 'success' : 'error',
          message: expectedError ? 'Error handling working correctly' : 'Unexpected success - table should not exist',
          details: { data: errorData, error: expectedError },
          duration: errorDuration
        });
        
        addLog(`Error handling: ${expectedError ? 'PASSED' : 'FAILED (unexpected success)'}`);
      } catch (err) {
        updateTestResult(7, {
          status: 'success',
          message: 'Error handling working correctly',
          duration: Date.now() - errorStart
        });
        addLog(`Error handling: PASSED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      addLog('✅ All tests completed!');
      
    } catch (error) {
      addLog(`❌ Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCacheAndRetry = async () => {
    addLog('Clearing schema cache...');
    clearSchemaCache();
    addLog('Schema cache cleared');
    
    // Wait a moment and re-run tests
    setTimeout(() => {
      runComprehensiveTest();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            Strategy Rule Compliance Fixes Test
          </h1>
          <p className="text-gray-400">
            Comprehensive test of implemented fixes for strategy_rule_compliance schema cache errors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Control Panel</h2>
            <div className="space-y-4">
              <button
                onClick={runComprehensiveTest}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? 'Running Tests...' : 'Run Comprehensive Tests'}
              </button>
              
              <button
                onClick={clearCacheAndRetry}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear Cache & Retry
              </button>
            </div>
          </Card>

          {/* Test Results */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-300">{result.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'success' ? 'bg-green-900 text-green-300' :
                      result.status === 'error' ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  {result.message && (
                    <div className="text-gray-400 text-sm mt-2">
                      {result.message}
                    </div>
                  )}
                  {result.duration && (
                    <div className="text-gray-500 text-xs mt-1">
                      Duration: {result.duration}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Test Logs</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm text-gray-300 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}