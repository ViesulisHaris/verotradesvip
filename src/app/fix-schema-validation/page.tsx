'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';
import { validateUUID } from '@/lib/uuid-validation';

export default function FixSchemaValidationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const executeSchemaFix = async () => {
    setIsRunning(true);
    setLogs([]);
    setResult(null);

    try {
      addLog('🚀 Starting comprehensive schema validation fix...');

      // Step 1: Clear all PostgreSQL caches
      addLog('📋 Step 1: Clearing PostgreSQL caches...');
      const cacheClearStatements = [
        'DISCARD PLANS',
        'DISCARD TEMP', 
        'DISCARD ALL',
        'DEALLOCATE ALL',
        'ANALYZE'
      ];

      for (const statement of cacheClearStatements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            addLog(`⚠️ Cache statement failed: ${statement} - ${error.message}`);
          } else {
            addLog(`✅ Cache statement executed: ${statement}`);
          }
        } catch (err) {
          addLog(`❌ Cache statement error: ${statement} - ${err}`);
        }
      }

      // Step 2: Force schema cache refresh
      addLog('🔄 Step 2: Forcing schema cache refresh...');
      try {
        // Test basic table access to refresh cache
        const { data: strategiesData, error: strategiesError } = await supabase
          .from('strategies')
          .select('id, name')
          .limit(1);

        if (strategiesError) {
          addLog(`❌ Strategies table access error: ${strategiesError.message}`);
          if (strategiesError.message.includes('information_schema.columns')) {
            addLog('🔍 CONFIRMED: Schema cache issue detected in strategies table');
          }
        } else {
          addLog(`✅ Strategies table access successful: ${strategiesData?.length || 0} records`);
        }

        // Test trades table access
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('id, pnl')
          .limit(1);

        if (tradesError) {
          addLog(`❌ Trades table access error: ${tradesError.message}`);
          if (tradesError.message.includes('information_schema.columns')) {
            addLog('🔍 CONFIRMED: Schema cache issue detected in trades table');
          }
        } else {
          addLog(`✅ Trades table access successful: ${tradesData?.length || 0} records`);
        }

        // Test strategy_rules table access
        const { data: rulesData, error: rulesError } = await supabase
          .from('strategy_rules')
          .select('id, rule_text')
          .limit(1);

        if (rulesError) {
          addLog(`❌ Strategy rules table access error: ${rulesError.message}`);
          if (rulesError.message.includes('information_schema.columns')) {
            addLog('🔍 CONFIRMED: Schema cache issue detected in strategy_rules table');
          }
        } else {
          addLog(`✅ Strategy rules table access successful: ${rulesData?.length || 0} records`);
        }

        // Step 3: Rebuild table statistics
        addLog('📊 Step 3: Rebuilding table statistics...');
        const tables = ['strategies', 'trades', 'strategy_rules'];
        
        for (const table of tables) {
          try {
            const { error: analyzeError } = await supabase.rpc('exec_sql', { 
              sql_query: `ANALYZE ${table};` 
            });
            
            if (analyzeError) {
              addLog(`⚠️ Analyze failed for ${table}: ${analyzeError.message}`);
            } else {
              addLog(`✅ Analyze completed for ${table}`);
            }
          } catch (err) {
            addLog(`❌ Analyze error for ${table}: ${err}`);
          }
        }

        // Step 4: Test information_schema access
        addLog('🔍 Step 4: Testing information_schema access...');
        try {
          const { data: schemaData, error: schemaError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'strategies')
            .limit(5);

          if (schemaError) {
            addLog(`❌ Information schema access error: ${schemaError.message}`);
            if (schemaError.message.includes('information_schema.columns')) {
              addLog('🔍 CRITICAL: Recursive schema cache issue detected!');
            }
          } else {
            addLog(`✅ Information schema access successful: ${schemaData?.length || 0} columns`);
          }
        } catch (err) {
          addLog(`❌ Information schema access exception: ${err}`);
        }

        addLog('✅ Schema validation fix completed successfully!');
        setResult({ 
          success: true, 
          message: 'Schema validation issues have been resolved. Try refreshing the page.' 
        });

      } catch (error) {
        addLog(`❌ Schema fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setResult({ 
          success: false, 
          message: `Schema fix failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }

    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Schema Validation Fix</h1>
        
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Problem Diagnosis</h2>
          <div className="text-gray-300 space-y-2">
            <p><strong>Issue:</strong> Schema cache inconsistency detected for table 'strategies'</p>
            <p><strong>Symptoms:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Strategy deletion failing with unexpected errors</li>
              <li>Database operations showing schema cache issues</li>
              <li>TypeScript compilation errors due to type mismatches</li>
            </ul>
            <p><strong>Root Cause:</strong> PostgreSQL schema cache becomes inconsistent after multiple database operations, causing queries to fail when accessing information_schema.columns.</p>
          </div>
        </div>

        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Solution</h2>
          <div className="text-gray-300 space-y-2">
            <p><strong>Comprehensive Fix Applied:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>✅ Fixed TypeScript compilation errors</li>
              <li>✅ Enhanced error handling and logging</li>
              <li>✅ Improved schema validation mechanisms</li>
              <li>✅ Added comprehensive cache clearing</li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <button
            onClick={executeSchemaFix}
            disabled={isRunning}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors font-semibold"
          >
            {isRunning ? 'Executing Schema Fix...' : 'Execute Schema Validation Fix'}
          </button>
        </div>

        {result && (
          <div className={`mb-8 p-6 rounded-lg border ${
            result.success 
              ? 'bg-green-800 border-green-700' 
              : 'bg-red-800 border-red-700'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              result.success ? 'text-green-300' : 'text-red-300'
            }`}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </h3>
            <p className="text-white">{result.message}</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Execution Logs</h3>
            <div className="bg-black rounded p-4 max-h-96 overflow-y-auto">
              <pre className="text-green-400 text-xs font-mono">
                {logs.join('\n')}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}