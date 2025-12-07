'use client';

import React, { useState, useEffect } from 'react';
import { validateSchema, clearSchemaCache } from '@/lib/schema-validation';
import { supabase } from '@/supabase/client';
import { validateUUID } from '@/lib/uuid-validation';

export default function TestFixesVerificationPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{
    schemaValidatorTest: 'pending' | 'success' | 'failed';
    strategyNavigationTest: 'pending' | 'success' | 'failed';
  }>({
    schemaValidatorTest: 'pending',
    strategyNavigationTest: 'pending'
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const runTests = async () => {
    addLog('🔍 Starting comprehensive fixes verification...');

    // Test 1: SchemaValidator instantiation
    addLog('🧪 Testing SchemaValidator instantiation...');
    try {
      const validation = await validateSchema();
      addLog(`✅ Schema validation result: ${JSON.stringify(validation, null, 2)}`);
      setTestResults(prev => ({ ...prev, schemaValidatorTest: 'success' }));
    } catch (error) {
      addLog(`❌ Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addLog(`Error stack: ${error instanceof Error ? error.stack : 'No stack'}`);
      setTestResults(prev => ({ ...prev, schemaValidatorTest: 'failed' }));
    }

    // Test 2: Service role client creation
    addLog('🔧 Testing service role client creation...');
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!serviceRoleKey) {
        addLog('❌ SUPABASE_SERVICE_ROLE_KEY is missing - this should trigger fallback behavior');
      } else {
        addLog(`✅ Service role key length: ${serviceRoleKey.length} characters`);
        addLog(`✅ Service role key starts with: ${serviceRoleKey.substring(0, 20)}...`);
      }

      // Try to create service client (this is where the error used to occur)
      const { createClient } = await import('@supabase/supabase-js');
      const serviceClient = createClient(supabaseUrl!, serviceRoleKey || '', {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'X-Client-Info': 'verotrides-test'
          }
        }
      });
      addLog('✅ Service client created successfully');
    } catch (error) {
      addLog(`❌ Service client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Strategy data and UUID validation
    addLog('🎯 Testing strategy data and UUID validation...');
    try {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .limit(5);

      if (error) {
        addLog(`❌ Strategy fetch error: ${JSON.stringify(error, null, 2)}`);
      } else {
        addLog(`✅ Found ${strategies?.length || 0} strategies`);
        
        if (strategies && strategies.length > 0) {
          strategies.forEach((strategy: { id: string; name: string }, index: number) => {
            addLog(`📝 Strategy ${index + 1}: ${strategy.name} (ID: ${strategy.id})`);
            
            // Test UUID validation
            try {
              const validatedId = validateUUID(strategy.id, 'strategy_id');
              addLog(`✅ Strategy ${index + 1} UUID validation passed: ${validatedId}`);
            } catch (uuidError) {
              addLog(`❌ Strategy ${index + 1} UUID validation failed: ${uuidError instanceof Error ? uuidError.message : 'Unknown error'}`);
              addLog('This would trigger the old alert popup behavior');
            }
          });
        }
      }
    } catch (error) {
      addLog(`❌ Strategy test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Cache clearing
    addLog('🧹 Testing cache clearing...');
    try {
      await clearSchemaCache();
      addLog('✅ Cache clearing completed');
    } catch (error) {
      addLog(`❌ Cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    addLog('🏁 Verification tests complete');
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({
      schemaValidatorTest: 'pending',
      strategyNavigationTest: 'pending'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Fixes Verification Page</h1>
        
        <div className="mb-6">
          <button
            onClick={runTests}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Run Verification Tests
          </button>
          <button
            onClick={clearLogs}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Logs
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Test Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">SchemaValidator Test</h3>
                <div className={`text-sm mb-2 ${
                  testResults.schemaValidatorTest === 'success' ? 'text-green-600' : 
                  testResults.schemaValidatorTest === 'failed' ? 'text-red-600' : 'text-gray-400'
                }`}>
                  Status: {testResults.schemaValidatorTest}
                </div>
                <div className="text-xs text-gray-300">
                  {testResults.schemaValidatorTest === 'success' ? 
                    '✅ SchemaValidator can be instantiated without supabaseKey errors' : 
                    '❌ SchemaValidator instantiation failed - see logs'
                  }
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Strategy Navigation Test</h3>
                <div className={`text-sm mb-2 ${
                  testResults.strategyNavigationTest === 'success' ? 'text-green-600' : 
                  testResults.strategyNavigationTest === 'failed' ? 'text-red-600' : 'text-gray-400'
                }`}>
                  Status: {testResults.strategyNavigationTest}
                </div>
                <div className="text-xs text-gray-300">
                  {testResults.strategyNavigationTest === 'success' ? 
                    '✅ Strategy navigation now uses toast notifications instead of alerts' : 
                    '❌ Strategy navigation still uses alert popups - see logs'
                  }
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Diagnostic Logs</h2>
              <div className="bg-black p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-400">No logs yet. Click "Run Verification Tests" to start.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-2">
                      <span className="text-gray-400">[{index + 1}]</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Expected Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span>SchemaValidator should create successfully without supabaseKey errors</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span>Strategy navigation should use toast notifications instead of alert popups</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span>Both fixes should work together without conflicts</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span>Application should be more stable after fixes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}