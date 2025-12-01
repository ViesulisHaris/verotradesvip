'use client';

import React, { useState, useEffect } from 'react';
import { comprehensiveSchemaRefresh } from '@/lib/comprehensive-schema-refresh';
import { schemaValidator } from '@/lib/schema-validation';
import { executeWithFallback, testAllTablesWithFallback, getFallbackStats, clearAllCaches } from '@/lib/schema-cache-fallback';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

interface SchemaInconsistency {
  type: string;
  tableName: string;
  details: string;
  severity: string;
  resolution?: string;
}

export default function ComprehensiveSchemaFixTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [inconsistencies, setInconsistencies] = useState<SchemaInconsistency[]>([]);
  const [fallbackStats, setFallbackStats] = useState<any>(null);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  const initializeTests = () => {
    setTestResults([
      { name: 'Schema Cache Clear', status: 'pending', message: 'Waiting to start...' },
      { name: 'Schema Refresh', status: 'pending', message: 'Waiting to start...' },
      { name: 'Schema Validation', status: 'pending', message: 'Waiting to start...' },
      { name: 'Inconsistency Detection', status: 'pending', message: 'Waiting to start...' },
      { name: 'Basic Queries Test', status: 'pending', message: 'Waiting to start...' },
      { name: 'Complex Queries Test', status: 'pending', message: 'Waiting to start...' },
      { name: 'Fallback Mechanism Test', status: 'pending', message: 'Waiting to start...' },
      { name: 'Strategies Table Access', status: 'pending', message: 'Waiting to start...' },
      { name: 'Core Tables Integration', status: 'pending', message: 'Waiting to start...' },
      { name: 'User Experience Simulation', status: 'pending', message: 'Waiting to start...' }
    ]);
  };

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const newResults = [...prev];
      // Ensure we have a valid result at the index
      if (index < 0 || index >= newResults.length || !newResults[index]) {
        return newResults;
      }
      
      // Create a properly typed result object
      const existingResult = newResults[index] as TestResult;
      const updatedResult: TestResult = {
        name: updates.name || existingResult.name,
        status: updates.status || existingResult.status,
        message: updates.message || existingResult.message,
        details: updates.details !== undefined ? updates.details : existingResult.details,
        duration: updates.duration !== undefined ? updates.duration : existingResult.duration
      };
      
      newResults[index] = updatedResult;
      return newResults;
    });
  };

  const runTest = async (testIndex: number, testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(testIndex, { status: 'running', message: 'Running...' });
    setCurrentStep(testName);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      updateTestResult(testIndex, {
        status: 'success',
        message: 'Completed successfully',
        details: result,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      updateTestResult(testIndex, {
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        duration
      });
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    initializeTests();
    setInconsistencies([]);
    setFallbackStats(null);
    setRefreshResult(null);

    try {
      // Test 1: Schema Cache Clear
      await runTest(0, 'Schema Cache Clear', async () => {
        await clearAllCaches();
        return { message: 'All caches cleared successfully' };
      });

      // Test 2: Schema Refresh
      await runTest(1, 'Schema Refresh', async () => {
        const result = await comprehensiveSchemaRefresh.refreshSchema();
        setRefreshResult(result);
        return result;
      });

      // Test 3: Schema Validation
      await runTest(2, 'Schema Validation', async () => {
        const validation = await schemaValidator.validateSchema();
        return validation;
      });

      // Test 4: Inconsistency Detection
      await runTest(3, 'Inconsistency Detection', async () => {
        const detectedInconsistencies = await schemaValidator.detectInconsistencies();
        setInconsistencies(detectedInconsistencies);
        
        // Try to resolve automatically
        if (detectedInconsistencies.length > 0) {
          const resolution = await schemaValidator.resolveInconsistencies(detectedInconsistencies);
          return { detected: detectedInconsistencies, resolution };
        }
        
        return { detected: detectedInconsistencies, message: 'No inconsistencies found' };
      });

      // Test 5: Basic Queries Test
      await runTest(4, 'Basic Queries Test', async () => {
        const basicQueries = [
          {
            name: 'Strategies basic query',
            query: (client: any) => client.from('strategies').select('*').limit(5)
          },
          {
            name: 'Trades basic query',
            query: (client: any) => client.from('trades').select('*').limit(5)
          },
          {
            name: 'Strategy rules basic query',
            query: (client: any) => client.from('strategy_rules').select('*').limit(5)
          }
        ];

        const results = [];
        for (const queryTest of basicQueries) {
          const result = await executeWithFallback(
            queryTest.query as any,
            queryTest.name.includes('strategies') ? 'strategies' :
            queryTest.name.includes('trades') ? 'trades' : 'strategy_rules',
            'select'
          );
          results.push({ name: queryTest.name, result });
        }

        return results;
      });

      // Test 6: Complex Queries Test
      await runTest(5, 'Complex Queries Test', async () => {
        const complexQueries = [
          {
            name: 'Trades with strategy join',
            query: (client: any) => client
              .from('trades')
              .select(`
                *,
                strategies:strategy_id (
                  name,
                  description
                )
              `)
              .limit(5)
          },
          {
            name: 'Strategy with rules join',
            query: (client: any) => client
              .from('strategies')
              .select(`
                *,
                strategy_rules (
                  id,
                  rule_text,
                  is_checked
                )
              `)
              .limit(5)
          }
        ];

        const results = [];
        for (const queryTest of complexQueries) {
          const result = await executeWithFallback(
            queryTest.query as any,
            'strategies',
            'select'
          );
          results.push({ name: queryTest.name, result });
        }

        return results;
      });

      // Test 7: Fallback Mechanism Test
      await runTest(6, 'Fallback Mechanism Test', async () => {
        const fallbackTest = await testAllTablesWithFallback();
        setFallbackStats(getFallbackStats());
        return fallbackTest;
      });

      // Test 8: Strategies Table Access
      await runTest(7, 'Strategies Table Access', async () => {
        const strategiesTests = [
          'Basic select',
          'Select with filter',
          'Select with order',
          'Information schema access'
        ];

        const results = [];
        
        for (const test of strategiesTests) {
          let query;
          switch (test) {
            case 'Basic select':
              query = (client: any) => client.from('strategies').select('*').limit(10);
              break;
            case 'Select with filter':
              query = (client: any) => client.from('strategies').select('*').eq('is_active', true).limit(5);
              break;
            case 'Select with order':
              query = (client: any) => client.from('strategies').select('*').order('created_at', { ascending: false }).limit(5);
              break;
            case 'Information schema access':
              query = (client: any) => client
                .from('information_schema.columns')
                .select('column_name, data_type')
                .eq('table_name', 'strategies')
                .eq('table_schema', 'public');
              break;
          }

          const result = await executeWithFallback(query as any, 'strategies', 'select');
          results.push({ test, result });
        }

        return results;
      });

      // Test 9: Core Tables Integration
      await runTest(8, 'Core Tables Integration', async () => {
        const integrationTests = [
          {
            name: 'Complete trade with strategy and rules',
            query: (client: any) => client
              .from('trades')
              .select(`
                *,
                strategies:strategy_id (
                  *,
                  strategy_rules (
                    id,
                    rule_text,
                    is_checked
                  )
                )
              `)
              .limit(3)
          },
          {
            name: 'Strategy with trade statistics',
            query: (client: any) => client
              .from('strategies')
              .select(`
                *,
                trades:trades(count)
              `)
              .limit(5)
          }
        ];

        const results = [];
        for (const test of integrationTests) {
          const result = await executeWithFallback(test.query as any, 'strategies', 'select');
          results.push({ name: test.name, result });
        }

        return results;
      });

      // Test 10: User Experience Simulation
      await runTest(9, 'User Experience Simulation', async () => {
        // Simulate typical user workflows
        const userWorkflows = [
          {
            name: 'View strategies list',
            query: (client: any) => client.from('strategies').select('*').limit(20)
          },
          {
            name: 'View recent trades',
            query: (client: any) => client.from('trades').select('*').order('trade_date', { ascending: false }).limit(10)
          },
          {
            name: 'View strategy details',
            query: (client: any) => client
              .from('strategies')
              .select(`
                *,
                strategy_rules (
                  id,
                  rule_text,
                  is_checked
                )
              `)
              .limit(1)
          }
        ];

        const results = [];
        for (const workflow of userWorkflows) {
          const result = await executeWithFallback(workflow.query as any, 'strategies', 'select');
          results.push({ name: workflow.name, result });
        }

        return results;
      });

    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const getOverallStatus = () => {
    if (testResults.length === 0) return 'pending';
    
    const hasErrors = testResults.some(test => test.status === 'error');
    const hasPending = testResults.some(test => test.status === 'pending');
    
    if (hasPending) return 'pending';
    if (hasErrors) return 'error';
    return 'success';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Comprehensive Schema Cache Fix Test
          </h1>
          <p className="text-gray-600 mb-6">
            This test runs a comprehensive suite to verify that all Supabase schema cache issues have been resolved
            and that the strategies table and all core tables work without errors.
          </p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Overall Status:</span>
              <span className={`text-lg font-bold ${getStatusColor(getOverallStatus())}`}>
                {getStatusIcon(getOverallStatus())} {getOverallStatus().toUpperCase()}
              </span>
            </div>
            
            <button
              onClick={runComprehensiveTest}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run Comprehensive Test'}
            </button>
          </div>

          {currentStep && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">Current Step: {currentStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(test.status)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {test.duration && (
                      <span className="text-sm text-gray-500">{test.duration}ms</span>
                    )}
                  </div>
                </div>
                
                {test.details && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schema Inconsistencies */}
        {inconsistencies.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schema Inconsistencies</h2>
            <div className="space-y-3">
              {inconsistencies.map((inconsistency, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{inconsistency.tableName}</h3>
                      <p className="text-sm text-gray-600">{inconsistency.details}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {inconsistency.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          inconsistency.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          inconsistency.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          inconsistency.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {inconsistency.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  {inconsistency.resolution && (
                    <p className="text-sm text-blue-600 mt-2">
                      <strong>Resolution:</strong> {inconsistency.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Statistics */}
        {fallbackStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fallback Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{fallbackStats.totalQueries}</div>
                <div className="text-sm text-gray-600">Total Queries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{fallbackStats.fallbackUsed}</div>
                <div className="text-sm text-gray-600">Fallback Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{fallbackStats.fallbackUsageRate}</div>
                <div className="text-sm text-gray-600">Usage Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{fallbackStats.fallbackSuccessRate}</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Result */}
        {refreshResult && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schema Refresh Result</h2>
            <div className={`p-4 rounded-lg ${
              refreshResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                refreshResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {refreshResult.message}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center">
                  <span className="text-sm">Cache Cleared:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    refreshResult.details.cacheCleared ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {refreshResult.details.cacheCleared ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">Schema Rebuilt:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    refreshResult.details.schemaRebuilt ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {refreshResult.details.schemaRebuilt ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">Validation Passed:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    refreshResult.details.validationPassed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {refreshResult.details.validationPassed ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">Queries Tested:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    refreshResult.details.queriesTested ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {refreshResult.details.queriesTested ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}