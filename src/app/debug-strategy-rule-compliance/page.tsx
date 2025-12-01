'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import DashboardCard from '@/components/ui/DashboardCard';

// Simple Card component for container usage
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass p-6 rounded-xl ${className || ''}`}>
      {children}
    </div>
  );
}

interface DiagnosticLog {
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
  details?: any;
}

interface QueryTrace {
  timestamp: string;
  query: string;
  params?: any;
  error?: string;
  duration?: number;
}

interface CacheState {
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  supabaseAuth: any;
}

export default function DebugStrategyRuleCompliance() {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [queryTraces, setQueryTraces] = useState<QueryTrace[]>([]);
  const [cacheState, setCacheState] = useState<CacheState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Add log entry
  const addLog = (level: DiagnosticLog['level'], message: string, details?: any) => {
    const logEntry: DiagnosticLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
    setLogs(prev => [...prev, logEntry]);
  };

  // Capture cache state
  const captureCacheState = () => {
    try {
      const localStorageData: Record<string, any> = {};
      const sessionStorageData: Record<string, any> = {};
      
      // Capture localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            localStorageData[key] = localStorage.getItem(key);
          } catch (e) {
            localStorageData[key] = '[Error reading]';
          }
        }
      }
      
      // Capture sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            sessionStorageData[key] = sessionStorage.getItem(key);
          } catch (e) {
            sessionStorageData[key] = '[Error reading]';
          }
        }
      }
      
      // Capture Supabase auth state
      const supabaseAuth = supabase.auth.getSession();
      
      const state: CacheState = {
        localStorage: localStorageData,
        sessionStorage: sessionStorageData,
        supabaseAuth
      };
      
      setCacheState(state);
      addLog('info', 'Cache state captured', state);
    } catch (error) {
      addLog('error', 'Failed to capture cache state', error);
    }
  };

  // Generate cache-busting parameter
  const generateCacheBuster = () => {
    return `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Intercept and log Supabase queries with cache-busting
  const interceptSupabaseQueries = () => {
    const originalFrom = supabase.from;
    
    supabase.from = function(table: string) {
      const queryBuilder = originalFrom.call(this, table);
      
      // Intercept the select method
      const originalSelect = queryBuilder.select;
      queryBuilder.select = function(columns?: string) {
        const selectQuery = originalSelect.call(this, columns) as any;
        
        // Add cache-busting header to the request
        const cacheBuster = generateCacheBuster();
        
        // Intercept the execute methods
        const originalThen = selectQuery.then;
        selectQuery.then = function(onfulfilled?: any, onrejected?: any) {
          const startTime = Date.now();
          
          const wrappedOnfulfilled = (result: any) => {
            const duration = Date.now() - startTime;
            const trace: QueryTrace = {
              timestamp: new Date().toISOString(),
              query: `SELECT ${columns || '*'} FROM ${table} (cache-busted: ${cacheBuster})`,
              duration,
              error: result?.error?.message
            };
            
            setQueryTraces(prev => [...prev, trace]);
            
            // Check if this is the error we're looking for
            if (result?.error?.message?.includes('strategy_rule_compliance')) {
              addLog('error', 'STRATEGY_RULE_COMPLIANCE ERROR DETECTED!', {
                table,
                columns,
                error: result.error,
                query: trace,
                cacheState: cacheState
              });
            }
            
            return onfulfilled ? onfulfilled(result) : result;
          };
          
          const wrappedOnrejected = (reason: any) => {
            const duration = Date.now() - startTime;
            const trace: QueryTrace = {
              timestamp: new Date().toISOString(),
              query: `SELECT ${columns || '*'} FROM ${table} (cache-busted: ${cacheBuster})`,
              duration,
              error: reason?.message
            };
            
            setQueryTraces(prev => [...prev, trace]);
            
            if (reason?.message?.includes('strategy_rule_compliance')) {
              addLog('error', 'STRATEGY_RULE_COMPLIANCE ERROR IN REJECTION!', {
                table,
                columns,
                error: reason,
                query: trace,
                cacheState: cacheState
              });
            }
            
            return onrejected ? onrejected(reason) : Promise.reject(reason);
          };
          
          return originalThen.call(this, wrappedOnfulfilled, wrappedOnrejected);
        };
        
        return selectQuery;
      };
      
      return queryBuilder;
    };
    
    addLog('info', 'Supabase query interceptor installed with cache-busting');
  };

  // Create a Supabase client with cache-busting headers
  const createCacheBustingClient = () => {
    const cacheBuster = generateCacheBuster();
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storageKey: 'sb-auth-token',
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'X-Client-Info': 'verotrades-web',
            'X-Cache-Buster': cacheBuster,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        },
      }
    );
  };

  // Run comprehensive diagnostic tests
  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    setQueryTraces([]);
    setTestResults({});
    
    addLog('info', 'Starting comprehensive strategy_rule_compliance diagnostics');
    
    // Step 1: Capture initial cache state
    captureCacheState();
    
    // Step 2: Install query interceptor
    interceptSupabaseQueries();
    
    // Step 3: Test basic connection
    try {
      addLog('info', 'Testing basic Supabase connection...');
      const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
      setTestResults(prev => ({ ...prev, basicConnection: { success: !error, error: error?.message } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, basicConnection: { success: false, error } }));
    }
    
    // Step 4: Test strategies query (most likely to trigger error)
    try {
      addLog('info', 'Testing strategies query (most likely to trigger error)...');
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .limit(10);
      
      setTestResults(prev => ({ 
        ...prev, 
        strategiesQuery: { 
          success: !strategiesError, 
          error: strategiesError?.message,
          count: strategies?.length 
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        strategiesQuery: { success: false, error } 
      }));
    }
    
    // Step 5: Test strategy_rules query
    try {
      addLog('info', 'Testing strategy_rules query...');
      const { data: rules, error: rulesError } = await supabase
        .from('strategy_rules')
        .select('*')
        .limit(10);
      
      setTestResults(prev => ({ 
        ...prev, 
        strategyRulesQuery: { 
          success: !rulesError, 
          error: rulesError?.message,
          count: rules?.length 
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        strategyRulesQuery: { success: false, error } 
      }));
    }
    
    // Step 6: Test trades query with strategy join
    try {
      addLog('info', 'Testing trades query with strategy join...');
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          strategies:strategy_id (
            name,
            description
          )
        `)
        .limit(10);
      
      setTestResults(prev => ({ 
        ...prev, 
        tradesWithStrategyQuery: { 
          success: !tradesError, 
          error: tradesError?.message,
          count: trades?.length 
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        tradesWithStrategyQuery: { success: false, error } 
      }));
    }
    
    // Step 7: Test direct non_existent_table query (should fail)
    try {
      addLog('info', 'Testing direct non_existent_table query (should fail)...');
      const { data: compliance, error: complianceError } = await supabase
        .from('non_existent_table')
        .select('*')
        .limit(1);
      
      setTestResults(prev => ({
        ...prev,
        directComplianceQuery: {
          success: !complianceError,
          error: complianceError?.message,
          unexpectedSuccess: !complianceError
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        directComplianceQuery: { success: false, error }
      }));
    }
    
    // Step 8: Capture final cache state
    addLog('info', 'Capturing final cache state...');
    captureCacheState();
    
    // Step 9: Check browser's network requests
    addLog('info', 'Checking browser network requests...');
    const performanceEntries = performance.getEntriesByType('resource');
    const supabaseRequests = performanceEntries.filter(entry => 
      entry.name.includes('supabase') || entry.name.includes('rest')
    );
    
    setTestResults(prev => ({ 
      ...prev, 
      networkRequests: { 
        count: supabaseRequests.length,
        requests: supabaseRequests.map(req => ({
          url: req.name,
          method: 'GET', // Most will be GET requests
          status: 'unknown', // Performance API doesn't give status
          duration: req.duration
        }))
      } 
    }));
    
    addLog('success', 'Diagnostics completed');
    setIsRunning(false);
  };

  // Clear all caches and retry with cache-busting
  const clearCachesAndRetry = async () => {
    addLog('info', 'Clearing all caches and retrying with cache-busting...');
    
    try {
      // Clear localStorage
      localStorage.clear();
      addLog('info', 'localStorage cleared');
      
      // Clear sessionStorage
      sessionStorage.clear();
      addLog('info', 'sessionStorage cleared');
      
      // Clear Supabase auth
      await supabase.auth.signOut();
      addLog('info', 'Supabase auth cleared');
      
      // Clear browser cache hints
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          addLog('info', 'Browser service worker caches cleared');
        } catch (cacheError) {
          addLog('warning', 'Could not clear service worker caches', cacheError);
        }
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new client with cache-busting
      const cacheBustingClient = createCacheBustingClient();
      addLog('info', 'Created new Supabase client with cache-busting headers');
      
      // Re-run diagnostics with cache-busting
      await runDiagnosticsWithCacheBusting(cacheBustingClient);
    } catch (error) {
      addLog('error', 'Failed to clear caches', error);
    }
  };

  // Run diagnostics with cache-busting client
  const runDiagnosticsWithCacheBusting = async (client: any) => {
    setIsRunning(true);
    addLog('info', 'Running diagnostics with cache-busting client...');
    
    try {
      // Test strategies query with cache-busting
      addLog('info', 'Testing strategies query with cache-busting...');
      const { data: strategies, error: strategiesError } = await client
        .from('strategies')
        .select('*')
        .limit(10);
      
      setTestResults(prev => ({
        ...prev,
        cacheBustingStrategiesQuery: {
          success: !strategiesError,
          error: strategiesError?.message,
          count: strategies?.length
        }
      }));
      
      if (strategiesError) {
        addLog('error', 'Cache-busting strategies query failed', strategiesError);
      } else {
        addLog('success', 'Cache-busting strategies query successful', { count: strategies?.length });
      }
      
      // Test complex query with cache-busting
      addLog('info', 'Testing complex query with cache-busting...');
      const { data: complexQuery, error: complexError } = await client
        .from('strategies')
        .select(`
          *,
          trades:trades(count),
          strategy_rules:strategy_rules(count)
        `)
        .limit(5);
      
      setTestResults(prev => ({
        ...prev,
        cacheBustingComplexQuery: {
          success: !complexError,
          error: complexError?.message,
          count: complexQuery?.length
        }
      }));
      
      if (complexError) {
        addLog('error', 'Cache-busting complex query failed', complexError);
      } else {
        addLog('success', 'Cache-busting complex query successful', { count: complexQuery?.length });
      }
      
    } catch (error) {
      addLog('error', 'Cache-busting diagnostics failed', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Export diagnostic data
  const exportDiagnostics = () => {
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs,
      queryTraces,
      cacheState,
      testResults,
      environment: {
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };
    
    const blob = new Blob([JSON.stringify(diagnosticData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-rule-compliance-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('success', 'Diagnostic data exported');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            Strategy Rule Compliance Diagnostics
          </h1>
          <p className="text-gray-400">
            Comprehensive diagnostic tool to identify the source of strategy_rule_compliance errors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Control Panel</h2>
            <div className="space-y-4">
              <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? 'Running Diagnostics...' : 'Run Comprehensive Diagnostics'}
              </button>
              
              <button
                onClick={clearCachesAndRetry}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear Caches & Retry with Cache-Busting
              </button>
              
              <button
                onClick={exportDiagnostics}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Diagnostic Data
              </button>
            </div>
          </Card>

          {/* Test Results */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Test Results</h2>
            <div className="space-y-3">
              {Object.entries(testResults).map(([test, result]) => (
                <div key={test} className="border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-300">{test}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  {result.error && (
                    <div className="text-red-400 text-sm mt-2">
                      Error: {result.error}
                    </div>
                  )}
                  {result.count !== undefined && (
                    <div className="text-gray-400 text-sm mt-1">
                      Records: {result.count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Query Traces */}
        {queryTraces.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Query Traces</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queryTraces.map((trace, index) => (
                <div key={index} className={`border border-gray-700 rounded-lg p-3 ${
                  trace.error ? 'border-red-700 bg-red-900/20' : 'border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-gray-300">{trace.query}</span>
                    <span className="text-xs text-gray-500">{trace.timestamp}</span>
                  </div>
                  {trace.duration && (
                    <div className="text-xs text-gray-400">
                      Duration: {trace.duration}ms
                    </div>
                  )}
                  {trace.error && (
                    <div className="text-red-400 text-sm mt-2">
                      Error: {trace.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Diagnostic Logs</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`border border-gray-700 rounded-lg p-3 ${
                  log.level === 'error' ? 'border-red-700 bg-red-900/20' :
                  log.level === 'warning' ? 'border-yellow-700 bg-yellow-900/20' :
                  log.level === 'success' ? 'border-green-700 bg-green-900/20' :
                  'border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      log.level === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                  </div>
                  <div className="text-gray-300">{log.message}</div>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer">Details</summary>
                      <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cache State */}
        {cacheState && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Cache State</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">LocalStorage Keys</h3>
                <div className="text-sm text-gray-400">
                  {Object.keys(cacheState.localStorage).join(', ') || 'None'}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-300 mb-2">SessionStorage Keys</h3>
                <div className="text-sm text-gray-400">
                  {Object.keys(cacheState.sessionStorage).join(', ') || 'None'}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Supabase Auth</h3>
                <pre className="text-xs text-gray-500">
                  {JSON.stringify(cacheState.supabaseAuth, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}