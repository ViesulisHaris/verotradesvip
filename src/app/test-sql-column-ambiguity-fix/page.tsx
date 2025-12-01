'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestSQLColumnAmbiguityFix() {
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<any>(null);
  const [tradeFormTest, setTradeFormTest] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    const results: any[] = [];

    try {
      // Test 1: Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        results.push({
          test: 'Authentication Check',
          status: 'FAILED',
          message: 'User not authenticated. Please login first.',
          details: authError?.message || 'No user found'
        });
        setTestResults(results);
        setLoading(false);
        return;
      }

      results.push({
        test: 'Authentication Check',
        status: 'PASSED',
        message: 'User authenticated successfully',
        details: `User ID: ${user.id}`
      });

      // Test 2: Test the verification function
      try {
        const { data: verificationData, error: verificationError } = await supabase.rpc('verify_trade_date_schema');
        
        if (verificationError) {
          results.push({
            test: 'Schema Verification Function',
            status: 'FAILED',
            message: 'Error calling verification function',
            details: verificationError.message
          });
        } else {
          results.push({
            test: 'Schema Verification Function',
            status: 'PASSED',
            message: 'Verification function executed successfully',
            details: verificationData
          });
          setSchemaStatus(verificationData?.[0] || null);
        }
      } catch (err) {
        results.push({
          test: 'Schema Verification Function',
          status: 'FAILED',
          message: 'Exception calling verification function',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 3: Check trades table structure
      try {
        const { data: tableData, error: tableError } = await supabase
          .from('trades')
          .select('*')
          .limit(1);
        
        if (tableError) {
          results.push({
            test: 'Trades Table Access',
            status: 'FAILED',
            message: 'Error accessing trades table',
            details: tableError.message
          });
        } else {
          results.push({
            test: 'Trades Table Access',
            status: 'PASSED',
            message: 'Trades table accessed successfully',
            details: `Found ${tableData.length} sample records`
          });
        }
      } catch (err) {
        results.push({
          test: 'Trades Table Access',
          status: 'FAILED',
          message: 'Exception accessing trades table',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 4: Test trade_date column specifically
      try {
        const { data: tradeDateData, error: tradeDateError } = await supabase
          .from('trades')
          .select('trade_date')
          .limit(1);
        
        if (tradeDateError) {
          results.push({
            test: 'Trade Date Column Access',
            status: 'FAILED',
            message: 'Error accessing trade_date column',
            details: tradeDateError.message
          });
        } else {
          results.push({
            test: 'Trade Date Column Access',
            status: 'PASSED',
            message: 'Trade date column accessed successfully',
            details: `Trade date data: ${JSON.stringify(tradeDateData)}`
          });
        }
      } catch (err) {
        results.push({
          test: 'Trade Date Column Access',
          status: 'FAILED',
          message: 'Exception accessing trade_date column',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 5: Test ordering by trade_date
      try {
        const { data: orderedData, error: orderError } = await supabase
          .from('trades')
          .select('id, trade_date')
          .order('trade_date', { ascending: false })
          .limit(5);
        
        if (orderError) {
          results.push({
            test: 'Order by Trade Date',
            status: 'FAILED',
            message: 'Error ordering by trade_date',
            details: orderError.message
          });
        } else {
          results.push({
            test: 'Order by Trade Date',
            status: 'PASSED',
            message: 'Successfully ordered by trade_date',
            details: `Found ${orderedData.length} ordered records`
          });
        }
      } catch (err) {
        results.push({
          test: 'Order by Trade Date',
          status: 'FAILED',
          message: 'Exception ordering by trade_date',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 6: Test inserting a trade with trade_date
      try {
        const testTrade = {
          user_id: user.id,
          symbol: 'TEST',
          strategy: 'Test Strategy',
          entry_price: 100.00,
          exit_price: 110.00,
          quantity: 10,
          trade_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          status: 'completed',
          profit_loss: 100.00,
          profit_loss_percent: 10.00
        };

        const { data: insertData, error: insertError } = await supabase
          .from('trades')
          .insert(testTrade)
          .select()
          .single();
        
        if (insertError) {
          results.push({
            test: 'Trade Insertion with trade_date',
            status: 'FAILED',
            message: 'Error inserting trade with trade_date',
            details: insertError.message
          });
        } else {
          results.push({
            test: 'Trade Insertion with trade_date',
            status: 'PASSED',
            message: 'Successfully inserted trade with trade_date',
            details: `Inserted trade ID: ${insertData.id}`
          });
          setTradeFormTest(insertData);

          // Clean up the test trade
          await supabase
            .from('trades')
            .delete()
            .eq('id', insertData.id);
        }
      } catch (err) {
        results.push({
          test: 'Trade Insertion with trade_date',
          status: 'FAILED',
          message: 'Exception inserting trade with trade_date',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return '✅';
      case 'FAILED':
        return '❌';
      default:
        return '⏳';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing SQL column ambiguity fix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">SQL Column Ambiguity Fix Test</h1>
            <p className="mt-1 text-sm text-gray-600">
              Testing the fix for the "column reference is_nullable is ambiguous" error
            </p>
          </div>

          <div className="px-6 py-4">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <button
                onClick={runTests}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Run Tests Again
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
              {testResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {getStatusIcon(result.status)} {result.test}
                    </h3>
                    <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer">Details</summary>
                      <pre className="mt-1 text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-x-auto">
                        {typeof result.details === 'object' 
                          ? JSON.stringify(result.details, null, 2)
                          : result.details}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {schemaStatus && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Schema Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium text-gray-700">Column Exists:</span>
                    <span className={`ml-2 text-sm ${schemaStatus.column_exists ? 'text-green-600' : 'text-red-600'}`}>
                      {schemaStatus.column_exists ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium text-gray-700">Column Type:</span>
                    <span className="ml-2 text-sm text-gray-900">{schemaStatus.column_type}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium text-gray-700">Nullable Status:</span>
                    <span className="ml-2 text-sm text-gray-900">{schemaStatus.nullable_status}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium text-gray-700">Can Query:</span>
                    <span className={`ml-2 text-sm ${schemaStatus.can_query ? 'text-green-600' : 'text-red-600'}`}>
                      {schemaStatus.can_query ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800">Next Steps</h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                <li>If all tests pass, the SQL column ambiguity fix is working correctly</li>
                <li>You can now execute the COMPREHENSIVE_TRADE_DATE_FIX.sql script in Supabase</li>
                <li>After executing the SQL script, test the trade logging functionality</li>
                <li>Visit the <a href="/log-trade" className="underline">Log Trade page</a> to test trade logging</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}