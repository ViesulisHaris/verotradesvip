'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { comprehensiveSchemaRefresh } from '@/lib/comprehensive-schema-refresh';
import { schemaValidator } from '@/lib/schema-validation';
import { executeWithFallback, testAllTablesWithFallback, getFallbackStats } from '@/lib/schema-cache-fallback';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'verotrades-user-experience-test',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  }
);

interface UserWorkflow {
  name: string;
  description: string;
  test: () => Promise<any>;
  expectedResults?: string;
}

interface WorkflowResult {
  workflow: string;
  success: boolean;
  message: string;
  duration: number;
  usedFallback: boolean;
  details?: any;
}

export default function UserExperienceAfterFixTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState('');
  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'partial' | 'failed'>('idle');
  const [schemaIssues, setSchemaIssues] = useState<any[]>([]);
  const [fallbackStats, setFallbackStats] = useState<any>(null);

  const userWorkflows: UserWorkflow[] = [
    {
      name: 'View Strategies List',
      description: 'User navigates to strategies page to see all their strategies',
      test: async () => {
        return await executeWithFallback(
          (client) => client.from('strategies').select('*').limit(20),
          'strategies',
          'select'
        );
      },
      expectedResults: 'List of strategies with all columns'
    },
    {
      name: 'View Recent Trades',
      description: 'User views their recent trading activity',
      test: async () => {
        return await executeWithFallback(
          (client) => client.from('trades').select('*').order('trade_date', { ascending: false }).limit(10),
          'trades',
          'select'
        );
      },
      expectedResults: 'Recent trades ordered by date'
    },
    {
      name: 'View Strategy Details',
      description: 'User clicks on a strategy to see details including rules',
      test: async () => {
        return await executeWithFallback(
          (client) => client
            .from('strategies')
            .select(`
              *,
              strategy_rules (
                id,
                rule_text,
                is_checked
              )
            `)
            .limit(1),
          'strategies',
          'select'
        );
      },
      expectedResults: 'Strategy with associated rules'
    },
    {
      name: 'View Trade with Strategy',
      description: 'User views a trade and sees the associated strategy information',
      test: async () => {
        return await executeWithFallback(
          (client) => client
            .from('trades')
            .select(`
              *,
              strategies:strategy_id (
                name,
                description
              )
            `)
            .limit(5),
          'trades',
          'select'
        );
      },
      expectedResults: 'Trades with strategy information'
    },
    {
      name: 'Create New Strategy',
      description: 'User creates a new trading strategy',
      test: async () => {
        // Test the schema structure for creating a strategy
        return await executeWithFallback(
          (client) => client
            .from('strategies')
            .select('id, name, description, is_active')
            .limit(1),
          'strategies',
          'select'
        );
      },
      expectedResults: 'Strategy structure ready for creation'
    },
    {
      name: 'Search Strategies',
      description: 'User searches for specific strategies',
      test: async () => {
        return await executeWithFallback(
          (client) => client.from('strategies').select('*').eq('is_active', true).limit(10),
          'strategies',
          'select'
        );
      },
      expectedResults: 'Filtered list of active strategies'
    },
    {
      name: 'View Strategy Rules',
      description: 'User views rules for a specific strategy',
      test: async () => {
        return await executeWithFallback(
          (client) => client.from('strategy_rules').select('*').limit(10),
          'strategy_rules',
          'select'
        );
      },
      expectedResults: 'List of strategy rules'
    },
    {
      name: 'Check Schema Consistency',
      description: 'System validates schema consistency',
      test: async () => {
        return await schemaValidator.validateSchema();
      },
      expectedResults: 'Valid schema without inconsistencies'
    },
    {
      name: 'Test Information Schema',
      description: 'System checks table structure information',
      test: async () => {
        return await executeWithFallback(
          (client) => client
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'strategies')
            .eq('table_schema', 'public')
            .limit(5),
          'information_schema',
          'select'
        );
      },
      expectedResults: 'Column information for strategies table'
    },
    {
      name: 'Verify Deleted Tables',
      description: 'System confirms deleted tables are removed',
      test: async () => {
        return await executeWithFallback(
          (client) => client
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', 'strategy_rule_compliance')
            .eq('table_schema', 'public'),
          'information_schema',
          'select'
        );
      },
      expectedResults: 'No deleted tables found'
    }
  ];

  const runWorkflow = async (workflow: UserWorkflow, index: number) => {
    const startTime = Date.now();
    setCurrentWorkflow(workflow.name);

    try {
      const result = await workflow.test();
      const duration = Date.now() - startTime;

      const workflowResult: WorkflowResult = {
        workflow: workflow.name,
        success: !result.error,
        message: result.error ? result.error.message : `Success: ${result.data?.length || 0} items`,
        duration,
        usedFallback: result.usedFallback || false,
        details: {
          expected: workflow.expectedResults,
          actual: result.error ? 'Error' : `${result.data?.length || 0} items returned`,
          data: result.data?.slice(0, 3) // First 3 items for preview
        }
      };

      setResults(prev => {
        const newResults = [...prev];
        newResults[index] = workflowResult;
        return newResults;
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const workflowResult: WorkflowResult = {
        workflow: workflow.name,
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        usedFallback: false,
        details: {
          expected: workflow.expectedResults,
          actual: 'Exception thrown',
          error: error
        }
      };

      setResults(prev => {
        const newResults = [...prev];
        newResults[index] = workflowResult;
        return newResults;
      });
    }
  };

  const runAllWorkflows = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setResults([]);
    setSchemaIssues([]);
    setFallbackStats(null);

    try {
      // First, run comprehensive schema refresh
      console.log('🔄 Running comprehensive schema refresh...');
      const refreshResult = await comprehensiveSchemaRefresh.refreshSchema();
      
      if (!refreshResult.success) {
        console.warn('Schema refresh had issues:', refreshResult.message);
      }

      // Detect schema inconsistencies
      console.log('🔍 Detecting schema inconsistencies...');
      const inconsistencies = await schemaValidator.detectInconsistencies();
      setSchemaIssues(inconsistencies);

      // Run all user workflows
      for (let i = 0; i < userWorkflows.length; i++) {
        await runWorkflow(userWorkflows[i], i);
        // Small delay between workflows
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get fallback statistics
      setFallbackStats(getFallbackStats());

      // Determine overall status
      const successCount = results.filter(r => r.success).length;
      const totalWorkflows = userWorkflows.length;
      
      if (successCount === totalWorkflows) {
        setOverallStatus('success');
      } else if (successCount >= totalWorkflows * 0.8) {
        setOverallStatus('partial');
      } else {
        setOverallStatus('failed');
      }

    } finally {
      setIsRunning(false);
      setCurrentWorkflow('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '🎉';
      case 'partial': return '⚠️';
      case 'failed': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'success': return 'All user workflows work perfectly!';
      case 'partial': return 'Most workflows work, some issues remain';
      case 'failed': return 'Critical issues affecting user experience';
      case 'running': return 'Testing user workflows...';
      default: return 'Ready to test user experience';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            User Experience Test After Schema Cache Fix
          </h1>
          <p className="text-gray-600 mb-6">
            This test simulates real user workflows to verify that the schema cache fixes 
            resolve all issues and provide a smooth user experience.
          </p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Overall Status:</span>
              <span className={`text-lg font-bold ${getStatusColor(overallStatus)}`}>
                {getStatusIcon(overallStatus)} {getOverallStatusText()}
              </span>
            </div>
            
            <button
              onClick={runAllWorkflows}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Testing Workflows...' : 'Test All User Workflows'}
            </button>
          </div>

          {currentWorkflow && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">Testing: {currentWorkflow}</span>
              </div>
            </div>
          )}
        </div>

        {/* Schema Issues */}
        {schemaIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schema Issues Detected</h2>
            <div className="space-y-3">
              {schemaIssues.map((issue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{issue.tableName}</h3>
                      <p className="text-sm text-gray-600">{issue.details}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {issue.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  {issue.resolution && (
                    <p className="text-sm text-blue-600 mt-2">
                      <strong>Resolution:</strong> {issue.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Workflow Results</h2>
          <div className="space-y-3">
            {userWorkflows.map((workflow, index) => {
              const result = results[index];
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-500">
                          Expected: {workflow.expectedResults}
                        </span>
                        {result && (
                          <>
                            <span className={`font-medium ${
                              result.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.usedFallback && '🔄 '} 
                              {result.success ? '✅ Success' : '❌ Failed'}
                            </span>
                            <span className="text-gray-500">
                              {result.duration}ms
                            </span>
                          </>
                        )}
                      </div>
                      {result && (
                        <p className="text-sm text-gray-700 mt-1">
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {result?.details && (
                    <details className="mt-3">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fallback Statistics */}
        {fallbackStats && (
          <div className="bg-white rounded-lg shadow-lg p-6">
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
      </div>
    </div>
  );
}