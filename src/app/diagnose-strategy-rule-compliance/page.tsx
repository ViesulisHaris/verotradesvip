'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DiagnosticResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  error?: string;
  timestamp?: string;
}

interface CacheInfo {
  tableExists: any[];
  dependencies: any[];
  cachedQueries: any[];
}

interface DiagnosticSummary {
  timestamp: string;
  tests: DiagnosticResult[];
  errors: any[];
  queryPlans: any[];
  cacheInfo: CacheInfo;
}

export default function DiagnoseStrategyRuleCompliancePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticSummary | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runDiagnostic = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    setDiagnosticResults(null);
    setCurrentStep(0);
    
    try {
      addLog('🚀 Starting comprehensive strategy_rule_compliance diagnostics...');
      
      // Step 1: Check database metadata
      setCurrentStep(1);
      addLog('📊 Step 1: Checking database metadata...');
      const cacheInfo = await checkDatabaseMetadata();
      
      // Step 2: Test cache behavior
      setCurrentStep(2);
      addLog('🧪 Step 2: Testing cache behavior...');
      const cacheTests = await testCacheBehavior();
      
      // Step 3: Analyze results
      setCurrentStep(3);
      addLog('📈 Step 3: Analyzing results...');
      const analysis = analyzeResults(cacheTests, cacheInfo);
      
      // Step 4: Generate report
      setCurrentStep(4);
      addLog('📋 Step 4: Generating diagnostic report...');
      
      const summary: DiagnosticSummary = {
        timestamp: new Date().toISOString(),
        tests: cacheTests,
        errors: [],
        queryPlans: [],
        cacheInfo
      };
      
      setDiagnosticResults(summary);
      addLog('✅ Diagnostic completed successfully!');
      
    } catch (error) {
      addLog(`❌ Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
    }
  };

  const checkDatabaseMetadata = async (): Promise<CacheInfo> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      // Check if strategy_rule_compliance table exists in system catalogs
      const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            tableowner
          FROM pg_tables 
          WHERE tablename LIKE '%strategy_rule_compliance%'
          OR tablename = 'strategy_rule_compliance'
        `
      });

      // Check for remaining dependencies
      const { data: depData, error: depError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT 
            d.classid::regclass as table_name,
            d.refobjid::regclass as ref_table,
            d.refobjsubid as ref_column
          FROM pg_depend d
          JOIN pg_class c ON d.refobjid = c.oid
          WHERE c.relname = 'strategy_rule_compliance'
        `
      });

      // Check for cached query plans
      const { data: queryData, error: queryError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements 
          WHERE query ILIKE '%strategy_rule_compliance%'
          ORDER BY total_time DESC
          LIMIT 10
        `
      });

      const cacheInfo: CacheInfo = {
        tableExists: tableData || [],
        dependencies: depData || [],
        cachedQueries: queryData || []
      };

      addLog(`   Table references found: ${cacheInfo.tableExists.length}`);
      addLog(`   Dependencies found: ${cacheInfo.dependencies.length}`);
      addLog(`   Cached queries found: ${cacheInfo.cachedQueries.length}`);

      return cacheInfo;
    } catch (error) {
      addLog(`   Error checking metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        tableExists: [],
        dependencies: [],
        cachedQueries: []
      };
    }
  };

  const testCacheBehavior = async (): Promise<DiagnosticResult[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const tests: DiagnosticResult[] = [];

    // Test 1: Direct strategies query
    try {
      addLog('   Testing direct strategies query...');
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .limit(1);

      tests.push({
        testName: 'Direct strategies query',
        status: error ? 'failed' : 'passed',
        details: error ? `Error: ${error.message}` : `Returned ${data?.length || 0} rows`,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      tests.push({
        testName: 'Direct strategies query',
        status: 'failed',
        details: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Test 2: Strategies query with user filter (like TradeForm)
    try {
      addLog('   Testing strategies query with user filter...');
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Skip test if no user is authenticated
      if (!userId) {
        tests.push({
          testName: 'Strategies query with user filter',
          status: 'failed',
          details: 'No authenticated user found',
          error: 'No authenticated user found',
          timestamp: new Date().toISOString()
        });
        return tests;
      }

      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(5);

      const hasStrategyError = error?.message?.includes('strategy_rule_compliance') || false;

      tests.push({
        testName: 'Strategies query with user filter',
        status: error ? 'failed' : 'passed',
        details: error ? `Error: ${error.message}` : `Returned ${data?.length || 0} rows`,
        error: error?.message,
        timestamp: new Date().toISOString()
      });

      if (hasStrategyError) {
        addLog('   ⚠️ STRATEGY_RULE_COMPLIANCE ERROR DETECTED!');
      }
    } catch (err) {
      tests.push({
        testName: 'Strategies query with user filter',
        status: 'failed',
        details: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Test 3: Trade insertion simulation
    try {
      addLog('   Testing trade insertion simulation...');
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Skip test if no user is authenticated
      if (!userId) {
        tests.push({
          testName: 'Trade insertion simulation',
          status: 'failed',
          details: 'No authenticated user found for trade insertion',
          error: 'No authenticated user found for trade insertion',
          timestamp: new Date().toISOString()
        });
        return tests;
      }

      // First try to get strategies
      const { data: strategies, error: strategyError } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (strategyError) {
        tests.push({
          testName: 'Trade insertion simulation',
          status: 'failed',
          details: `Strategy query failed: ${strategyError.message}`,
          error: strategyError.message,
          timestamp: new Date().toISOString()
        });
      } else {
        // Try trade insertion
        const strategyId = strategies?.[0]?.id || null;
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .insert({
            user_id: userId,
            market: 'stock',
            symbol: 'DIAGNOSTIC_TEST',
            strategy_id: strategyId,
            trade_date: new Date().toISOString().split('T')[0],
            side: 'Buy',
            quantity: 100,
            entry_price: 50.0,
            exit_price: 55.0,
            pnl: 500.0
          })
          .select('id')
          .single();

        // Clean up test trade if it was created
        if (trade?.id && !tradeError) {
          await supabase
            .from('trades')
            .delete()
            .eq('id', trade.id);
        }

        tests.push({
          testName: 'Trade insertion simulation',
          status: tradeError ? 'failed' : 'passed',
          details: tradeError ? `Error: ${tradeError.message}` : `Trade created and deleted successfully (ID: ${trade?.id})`,
          error: tradeError?.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      tests.push({
        testName: 'Trade insertion simulation',
        status: 'failed',
        details: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    return tests;
  };

  const analyzeResults = (tests: DiagnosticResult[], cacheInfo: CacheInfo) => {
    const strategyRuleComplianceErrors = tests.filter(
      t => t.error?.includes('strategy_rule_compliance')
    );

    const totalErrors = tests.filter(t => t.status === 'failed').length;
    const totalTests = tests.length;

    addLog(`\n🎯 Analysis Results:`);
    addLog(`   • Total tests: ${totalTests}`);
    addLog(`   • Failed tests: ${totalErrors}`);
    addLog(`   • Strategy_rule_compliance errors: ${strategyRuleComplianceErrors.length}`);
    addLog(`   • Table references found: ${cacheInfo.tableExists.length}`);
    addLog(`   • Dependencies found: ${cacheInfo.dependencies.length}`);
    addLog(`   • Cached queries found: ${cacheInfo.cachedQueries.length}`);

    if (strategyRuleComplianceErrors.length > 0) {
      addLog(`\n🔥 DIAGNOSIS: strategy_rule_compliance cache issue confirmed`);
      addLog(`   → Primary cause: PostgreSQL query plan cache or Supabase schema cache`);
      addLog(`   → Recommended fix: Execute aggressive cache clearing script`);
    } else if (totalErrors > 0) {
      addLog(`\n📋 DIAGNOSIS: Other database issues detected`);
      addLog(`   → Check logs for specific error details`);
    } else {
      addLog(`\n✅ DIAGNOSIS: No strategy_rule_compliance issues detected`);
      addLog(`   → System appears to be working correctly`);
    }
  };

  const downloadDiagnosticScript = () => {
    const scriptContent = `// Diagnostic script for strategy_rule_compliance issues
// Run this in Node.js to perform comprehensive diagnostics

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
  '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}'
);

async function runDiagnostics() {
  console.log('🚀 Starting strategy_rule_compliance diagnostics...');
  
  try {
    // Test strategies query
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Strategies query failed:', error.message);
      if (error.message.includes('strategy_rule_compliance')) {
        console.error('🔥 CONFIRMED: strategy_rule_compliance cache issue detected');
      }
    } else {
      console.log('✅ Strategies query succeeded');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

runDiagnostics();`;

    const blob = new Blob([scriptContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagnose-strategy-rule-compliance.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSQLScript = () => {
    const sqlContent = `-- AGGRESSIVE_CACHE_CLEAR_WITH_LOGGING.sql
-- Execute this in Supabase SQL Editor with service role key

BEGIN;

-- Discard all cached query plans
DISCARD PLANS;

-- Reset all session configuration  
RESET ALL;

-- Rebuild table statistics
ANALYZE;

-- Force cache invalidation
CREATE TEMP TABLE cache_bust (id INTEGER);
DROP TABLE cache_bust;

COMMIT;`;

    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AGGRESSIVE_CACHE_CLEAR_WITH_LOGGING.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Strategy Rule Compliance Diagnostics</h1>
          <p className="text-gray-400">
            Comprehensive diagnostic tool to identify and resolve strategy_rule_compliance cache issues
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Diagnostic Controls</h2>
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running Diagnostic...
                </span>
              ) : (
                'Run Comprehensive Diagnostic'
              )}
            </button>
          </div>

          {currentStep > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {currentStep}
                </div>
                <span className="text-sm text-gray-300">
                  {currentStep === 1 && 'Checking database metadata...'}
                  {currentStep === 2 && 'Testing cache behavior...'}
                  {currentStep === 3 && 'Analyzing results...'}
                  {currentStep === 4 && 'Generating report...'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <button
              onClick={downloadDiagnosticScript}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              📄 Download Node.js Diagnostic Script
            </button>
            <button
              onClick={downloadSQLScript}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🗃️ Download SQL Cache Clear Script
            </button>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Diagnostic Logs</h3>
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {diagnosticResults && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Diagnostic Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Test Summary</h4>
                <div className="space-y-2">
                  {diagnosticResults.tests.map((test, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        test.status === 'passed' ? 'bg-green-600' : 
                        test.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                      }`}></div>
                      <div className="text-sm">
                        <div className="font-medium">{test.testName}</div>
                        <div className={`text-xs ${
                          test.status === 'passed' ? 'text-green-400' : 
                          test.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {test.status.toUpperCase()}
                        </div>
                        {test.details && (
                          <div className="text-gray-400 text-xs mt-1">{test.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Cache Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Table References:</span>
                    <span className={diagnosticResults.cacheInfo.tableExists.length > 0 ? 'text-red-400' : 'text-green-400'}>
                      {diagnosticResults.cacheInfo.tableExists.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dependencies:</span>
                    <span className={diagnosticResults.cacheInfo.dependencies.length > 0 ? 'text-red-400' : 'text-green-400'}>
                      {diagnosticResults.cacheInfo.dependencies.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cached Queries:</span>
                    <span className={diagnosticResults.cacheInfo.cachedQueries.length > 0 ? 'text-red-400' : 'text-green-400'}>
                      {diagnosticResults.cacheInfo.cachedQueries.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <div className="space-y-2 text-sm">
                {diagnosticResults.tests.some(t => t.error?.includes('strategy_rule_compliance')) && (
                  <>
                    <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg">
                      <div className="font-medium text-red-400 mb-1">🔥 STRATEGY_RULE_COMPLIANCE ISSUE DETECTED</div>
                      <div className="text-gray-300">
                        The diagnostic has confirmed the presence of strategy_rule_compliance references in the database cache.
                      </div>
                      <div className="text-gray-300 mt-2">
                        <strong>Recommended Actions:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Execute the AGGRESSIVE_CACHE_CLEAR_WITH_LOGGING.sql script in Supabase SQL Editor</li>
                          <li>Use service role key for proper permissions</li>
                          <li>Restart the application after cache clearing</li>
                          <li>Test trade logging functionality again</li>
                        </ol>
                      </div>
                    </div>
                  </>
                )}
                
                {diagnosticResults.tests.every(t => t.status === 'passed') && (
                  <div className="p-3 bg-green-900/30 border border-green-600 rounded-lg">
                    <div className="font-medium text-green-400 mb-1">✅ NO ISSUES DETECTED</div>
                    <div className="text-gray-300">
                      All diagnostic tests passed successfully. The system appears to be working correctly.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}