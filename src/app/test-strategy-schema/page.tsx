'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

export default function TestStrategySchemaPage() {
  const [schemaTest, setSchemaTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testStrategySchema();
  }, []);

  const testStrategySchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test 1: Check if we can select strategies with is_active
      console.log('Testing strategy schema...');
      
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, is_active')
        .limit(1);
      
      if (strategiesError) {
        console.error('Strategies query error:', strategiesError);
        setError(`Strategies query failed: ${strategiesError.message}`);
        setSchemaTest({
          test: 'strategies_query',
          success: false,
          error: strategiesError.message,
          details: strategiesError
        });
        return;
      }
      
      console.log('Strategies query success:', strategiesData);
      
      // Test 2: Try to create a test strategy
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const testStrategy = {
          user_id: user.id,
          name: 'Test Strategy for Schema',
          description: 'Testing schema columns',
          is_active: true,
          rules: ['Test rule']
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('strategies')
          .insert(testStrategy)
          .select()
          .single();
        
        if (insertError) {
          console.error('Strategy insert error:', insertError);
          setError(`Strategy insert failed: ${insertError.message}`);
          setSchemaTest({
            test: 'strategy_insert',
            success: false,
            error: insertError.message,
            details: insertError
          });
        } else {
          console.log('Strategy insert success:', insertData);
          
          // Clean up - delete the test strategy
          await supabase
            .from('strategies')
            .delete()
            .eq('id', insertData.id);
          
          setSchemaTest({
            test: 'strategy_schema',
            success: true,
            message: 'Schema test passed - is_active column exists and works',
            data: {
              strategiesQuery: strategiesData,
              strategyInsert: insertData
            }
          });
        }
      } else {
        setSchemaTest({
          test: 'strategy_schema',
          success: true,
          message: 'Schema test passed - is_active column exists',
          data: {
            strategiesQuery: strategiesData
          }
        });
      }
      
    } catch (error) {
      console.error('Schema test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Unexpected error: ${errorMessage}`);
      setSchemaTest({
        test: 'strategy_schema',
        success: false,
        error: errorMessage,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Strategy Schema Test</h1>
        <p className="text-white/60">Testing if is_active column exists and strategy creation works</p>
      </div>

      <div className="mb-4">
        <Link
          href="/strategies"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to Strategies
        </Link>
      </div>

      {loading && (
        <div className="glass p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Testing strategy schema...</p>
        </div>
      )}

      {error && (
        <div className="glass p-6 mb-6 border border-red-500/30 bg-red-500/10">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Schema Test Error</h2>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {schemaTest && (
        <div className="glass p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Schema Test Results</h2>
          
          <div className={`p-4 rounded-lg mb-4 ${
            schemaTest.success 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                schemaTest.success ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className={`font-semibold ${
                schemaTest.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {schemaTest.success ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <p className="text-white/80">
              {schemaTest.message || schemaTest.error}
            </p>
          </div>

          {schemaTest.details && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Technical Details</h3>
              <pre className="bg-black/30 p-4 rounded-lg text-xs text-white/70 overflow-auto">
                {JSON.stringify(schemaTest.details, null, 2)}
              </pre>
            </div>
          )}

          {schemaTest.data && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Test Data</h3>
              <pre className="bg-black/30 p-4 rounded-lg text-xs text-white/70 overflow-auto">
                {JSON.stringify(schemaTest.data, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              onClick={testStrategySchema}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Test Again
            </button>
            <Link
              href="/strategies/create"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Strategy Creation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}