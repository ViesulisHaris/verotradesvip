'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { createClient } from '@supabase/supabase-js';

export default function TestTradeDateUserPerspective() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const addTestResult = (testName: string, status: 'pass' | 'fail' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const checkSchemaInfo = async () => {
    try {
      // Create a direct client to bypass any caching issues
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const directClient = createClient(supabaseUrl, supabaseAnonKey);

      // Check if trades table exists and get column info
      const { data: columns, error: columnError } = await directClient
        .rpc('get_table_columns', { table_name: 'trades' })
        .limit(100);

      if (columnError) {
        // Try alternative approach using information_schema
        const { data: schemaData, error: schemaError } = await directClient
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'trades')
          .order('ordinal_position');

        if (schemaError) {
          addTestResult('Schema Check', 'error', 'Failed to retrieve schema information', schemaError);
          return null;
        }

        setSchemaInfo(schemaData);
        return schemaData;
      }

      setSchemaInfo(columns);
      return columns;
    } catch (error) {
      addTestResult('Schema Check', 'error', 'Exception during schema check', error);
      return null;
    }
  };

  const runTest1_SchemaAccess = async () => {
    setCurrentTest('Test 1: Schema Access - Checking trade_date column');
    try {
      const schema = await checkSchemaInfo();
      if (!schema) {
        addTestResult('Schema Access', 'fail', 'Could not retrieve schema information');
        return;
      }

      const tradeDateColumn = schema.find((col: any) => col.column_name === 'trade_date');
      if (!tradeDateColumn) {
        addTestResult('Schema Access', 'fail', 'trade_date column not found in database schema', {
          availableColumns: schema.map((col: any) => col.column_name)
        });
      } else {
        addTestResult('Schema Access', 'pass', 'trade_date column found in schema', {
          column_name: tradeDateColumn.column_name,
          data_type: tradeDateColumn.data_type,
          is_nullable: tradeDateColumn.is_nullable
        });
      }
    } catch (error) {
      addTestResult('Schema Access', 'error', 'Exception during schema access test', error);
    }
  };

  const runTest2_TradeInsertion = async () => {
    if (!userId) {
      addTestResult('Trade Insertion', 'error', 'User not authenticated');
      return;
    }

    setCurrentTest('Test 2: Trade Insertion - Testing trade_date field');
    try {
      const testTrade = {
        user_id: userId,
        symbol: 'TEST',
        trade_date: new Date().toISOString().split('T')[0],
        side: 'Buy',
        quantity: 100,
        entry_price: 50.0,
        exit_price: 55.0,
        pnl: 500.0
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(testTrade)
        .select()
        .single();

      if (error) {
        addTestResult('Trade Insertion', 'fail', 'Failed to insert trade with trade_date', {
          error: error.message,
          details: error
        });
      } else {
        addTestResult('Trade Insertion', 'pass', 'Successfully inserted trade with trade_date', {
          tradeId: data.id,
          trade_date: data.trade_date
        });

        // Clean up - delete the test trade
        await supabase.from('trades').delete().eq('id', data.id);
      }
    } catch (error) {
      addTestResult('Trade Insertion', 'error', 'Exception during trade insertion test', error);
    }
  };

  const runTest3_TradeRetrieval = async () => {
    if (!userId) {
      addTestResult('Trade Retrieval', 'error', 'User not authenticated');
      return;
    }

    setCurrentTest('Test 3: Trade Retrieval - Querying with trade_date');
    try {
      // First insert a test trade
      const testTrade = {
        user_id: userId,
        symbol: 'TEST_RETRIEVE',
        trade_date: new Date().toISOString().split('T')[0],
        side: 'Buy',
        quantity: 100,
        entry_price: 50.0,
        exit_price: 55.0,
        pnl: 500.0
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('trades')
        .insert(testTrade)
        .select()
        .single();

      if (insertError) {
        addTestResult('Trade Retrieval', 'fail', 'Failed to insert test trade for retrieval test', insertError);
        return;
      }

      // Now try to retrieve it
      const { data: retrievedData, error: retrieveError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', insertedData.id)
        .single();

      if (retrieveError) {
        addTestResult('Trade Retrieval', 'fail', 'Failed to retrieve trade with trade_date', retrieveError);
      } else {
        addTestResult('Trade Retrieval', 'pass', 'Successfully retrieved trade with trade_date', {
          tradeId: retrievedData.id,
          trade_date: retrievedData.trade_date
        });
      }

      // Clean up
      await supabase.from('trades').delete().eq('id', insertedData.id);
    } catch (error) {
      addTestResult('Trade Retrieval', 'error', 'Exception during trade retrieval test', error);
    }
  };

  const runTest4_DateOrdering = async () => {
    if (!userId) {
      addTestResult('Date Ordering', 'error', 'User not authenticated');
      return;
    }

    setCurrentTest('Test 4: Date Ordering - Sorting by trade_date');
    try {
      // Insert multiple test trades with different dates
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const testTrades = [
        {
          user_id: userId,
          symbol: 'TEST_ORDER1',
          trade_date: twoDaysAgo.toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0
        },
        {
          user_id: userId,
          symbol: 'TEST_ORDER2',
          trade_date: yesterday.toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0
        },
        {
          user_id: userId,
          symbol: 'TEST_ORDER3',
          trade_date: today.toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0
        }
      ];

      const { data: insertedTrades, error: insertError } = await supabase
        .from('trades')
        .insert(testTrades)
        .select();

      if (insertError) {
        addTestResult('Date Ordering', 'fail', 'Failed to insert test trades for ordering test', insertError);
        return;
      }

      // Now try to retrieve them ordered by trade_date
      const { data: orderedTrades, error: orderError } = await supabase
        .from('trades')
        .select('id, symbol, trade_date')
        .eq('user_id', userId)
        .in('symbol', ['TEST_ORDER1', 'TEST_ORDER2', 'TEST_ORDER3'])
        .order('trade_date', { ascending: false });

      if (orderError) {
        addTestResult('Date Ordering', 'fail', 'Failed to order trades by trade_date', orderError);
      } else {
        // Check if they are properly ordered
        const isCorrectlyOrdered = orderedTrades?.every((trade: any, index: number) => {
          if (index === 0) return true;
          return new Date(trade.trade_date) <= new Date(orderedTrades[index - 1].trade_date);
        });

        if (isCorrectlyOrdered) {
          addTestResult('Date Ordering', 'pass', 'Successfully ordered trades by trade_date', {
            trades: orderedTrades?.map((t: any) => ({ symbol: t.symbol, trade_date: t.trade_date }))
          });
        } else {
          addTestResult('Date Ordering', 'fail', 'Trades not properly ordered by trade_date', {
            trades: orderedTrades?.map((t: any) => ({ symbol: t.symbol, trade_date: t.trade_date }))
          });
        }
      }

      // Clean up
      if (insertedTrades) {
        await supabase.from('trades').delete().in('id', insertedTrades.map((t: any) => t.id));
      }
    } catch (error) {
      addTestResult('Date Ordering', 'error', 'Exception during date ordering test', error);
    }
  };

  const runTest5_Integration = async () => {
    if (!userId) {
      addTestResult('Integration', 'error', 'User not authenticated');
      return;
    }

    setCurrentTest('Test 5: Integration - Complete Trade Flow');
    try {
      // Simulate complete trade flow
      const tradeData = {
        symbol: 'AAPL',
        date: new Date().toISOString().split('T')[0],
        side: 'Buy',
        quantity: '100',
        entry_price: '150.00',
        exit_price: '155.00',
        pnl: '500.00'
      };

      // This simulates what the TradeForm component does
      const { data, error } = await supabase.from('trades').insert({
        user_id: userId,
        symbol: tradeData.symbol,
        trade_date: tradeData.date,
        side: tradeData.side,
        quantity: parseFloat(tradeData.quantity),
        entry_price: parseFloat(tradeData.entry_price),
        exit_price: parseFloat(tradeData.exit_price),
        pnl: parseFloat(tradeData.pnl)
      }).select().single();

      if (error) {
        addTestResult('Integration', 'fail', 'Integration test failed - complete trade flow', {
          error: error.message,
          details: error
        });
      } else {
        addTestResult('Integration', 'pass', 'Integration test passed - complete trade flow works', {
          tradeId: data.id,
          trade_date: data.trade_date
        });

        // Clean up
        await supabase.from('trades').delete().eq('id', data.id);
      }
    } catch (error) {
      addTestResult('Integration', 'error', 'Exception during integration test', error);
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    await runTest1_SchemaAccess();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runTest2_TradeInsertion();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runTest3_TradeRetrieval();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runTest4_DateOrdering();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runTest5_Integration();
    
    setIsRunningTests(false);
    setCurrentTest('');
  };

  const runMultipleTestVariants = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    // Run tests 3 times as requested by user
    for (let variant = 1; variant <= 3; variant++) {
      addTestResult(`Variant ${variant}`, 'pass', `Starting test variant ${variant}`);
      
      await runTest1_SchemaAccess();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await runTest2_TradeInsertion();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await runTest3_TradeRetrieval();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await runTest4_DateOrdering();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await runTest5_Integration();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunningTests(false);
    setCurrentTest('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'fail': return 'text-red-400';
      case 'error': return 'text-orange-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'error': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  const calculateSuccessRate = () => {
    const passCount = testResults.filter(r => r.status === 'pass').length;
    const totalCount = testResults.filter(r => r.status !== 'info').length;
    return totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="glass p-6 rounded-xl">
        <h1 className="text-3xl font-bold text-white mb-4">Trade Date Schema Cache Test</h1>
        <p className="text-white/70 mb-6">
          Comprehensive testing for the "Could not find the 'trade_date' column of 'trades' in the schema cache" error
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunningTests || !userId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          <button
            onClick={runMultipleTestVariants}
            disabled={isRunningTests || !userId}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? 'Running Multiple Variants...' : 'Run 3 Test Variants'}
          </button>

          <button
            onClick={checkSchemaInfo}
            disabled={isRunningTests}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Schema
          </button>
        </div>

        {currentTest && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 font-medium">{currentTest}</p>
          </div>
        )}

        {!userId && (
          <div className="mb-6 p-4 bg-orange-600/20 border border-orange-500/20 rounded-lg">
            <p className="text-orange-400">Please log in to run tests</p>
          </div>
        )}

        {schemaInfo && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-500/20 rounded-lg">
            <h3 className="text-green-400 font-medium mb-2">Current Schema Information:</h3>
            <div className="text-white/80 text-sm">
              {schemaInfo.map((col: any, index: number) => (
                <div key={index} className="mb-1">
                  <span className="font-medium">{col.column_name}</span>: {col.data_type} {col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}
                </div>
              ))}
            </div>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Test Results</h3>
              <div className="text-white">
                Success Rate: <span className={`font-bold ${parseFloat(calculateSuccessRate()) >= 80 ? 'text-green-400' : 'text-red-400'}`}>
                  {calculateSuccessRate()}%
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getStatusIcon(result.status)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${getStatusColor(result.status)}`}>
                          {result.testName}
                        </span>
                        <span className="text-white/50 text-sm">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-white/60 text-xs">
                          <summary className="cursor-pointer hover:text-white/80">Details</summary>
                          <pre className="mt-2 p-2 bg-black/20 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}