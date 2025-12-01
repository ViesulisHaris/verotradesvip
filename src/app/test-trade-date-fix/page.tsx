'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';

export default function TestTradeDateFixPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const addResult = (message: string, isSuccess: boolean = true) => {
    const prefix = isSuccess ? '✅' : '❌';
    setTestResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    setIsRunning(true);

    try {
      // Test 1: Check if user is authenticated
      setCurrentTest('Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        addResult('Authentication failed: Please log in first', false);
        setIsRunning(false);
        return;
      }
      addResult('Authentication successful');

      // Test 2: Check trades table schema
      setCurrentTest('Checking trades table schema...');
      try {
        const { data: columns, error: schemaError } = await supabase
          .from('trades')
          .select('*')
          .limit(0);
        
        if (schemaError) {
          if (schemaError.message.includes('trade_date')) {
            addResult(`Schema error: ${schemaError.message}`, false);
          } else {
            addResult(`Other schema error: ${schemaError.message}`, false);
          }
        } else {
          addResult('Trades table schema accessible');
        }
      } catch (err) {
        addResult(`Schema check failed: ${err}`, false);
      }

      // Test 3: Query trades with trade_date column
      setCurrentTest('Testing trade_date column query...');
      try {
        const { data: trades, error: queryError } = await supabase
          .from('trades')
          .select('id, trade_date, symbol, side')
          .eq('user_id', user.id)
          .limit(1);
        
        if (queryError) {
          if (queryError.message.includes('trade_date')) {
            addResult(`trade_date query error: ${queryError.message}`, false);
          } else {
            addResult(`Other query error: ${queryError.message}`, false);
          }
        } else {
          addResult(`Successfully queried trades with trade_date column (found ${trades?.length || 0} trades)`);
        }
      } catch (err) {
        addResult(`Trade query failed: ${err}`, false);
      }

      // Test 4: Insert a test trade with trade_date
      setCurrentTest('Testing trade insertion with trade_date...');
      try {
        const testTrade = {
          user_id: user.id,
          symbol: 'TEST',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0,
          market: 'stock'
        };

        const { data: insertedTrade, error: insertError } = await supabase
          .from('trades')
          .insert(testTrade)
          .select()
          .single();

        if (insertError) {
          if (insertError.message.includes('trade_date')) {
            addResult(`trade_date insert error: ${insertError.message}`, false);
          } else {
            addResult(`Other insert error: ${insertError.message}`, false);
          }
        } else {
          addResult(`Successfully inserted test trade with ID: ${insertedTrade.id}`);
          
          // Test 5: Clean up the test trade
          setCurrentTest('Cleaning up test trade...');
          const { error: deleteError } = await supabase
            .from('trades')
            .delete()
            .eq('id', insertedTrade.id);

          if (deleteError) {
            addResult(`Cleanup error: ${deleteError.message}`, false);
          } else {
            addResult('Successfully cleaned up test trade');
          }
        }
      } catch (err) {
        addResult(`Trade insertion failed: ${err}`, false);
      }

      // Test 6: Test ordering by trade_date
      setCurrentTest('Testing ordering by trade_date...');
      try {
        const { data: orderedTrades, error: orderError } = await supabase
          .from('trades')
          .select('id, trade_date')
          .eq('user_id', user.id)
          .order('trade_date', { ascending: false })
          .limit(1);

        if (orderError) {
          if (orderError.message.includes('trade_date')) {
            addResult(`trade_date ordering error: ${orderError.message}`, false);
          } else {
            addResult(`Other ordering error: ${orderError.message}`, false);
          }
        } else {
          addResult('Successfully ordered trades by trade_date');
        }
      } catch (err) {
        addResult(`Trade ordering failed: ${err}`, false);
      }

      addResult('All tests completed!');
      
    } catch (error) {
      addResult(`Unexpected error: ${error}`, false);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Trade Date Schema Fix Test</h1>
      
      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Test trade_date Column</h2>
        <p className="text-white/70 mb-4">
          This test verifies that the trade_date column exists and works correctly in the trades table.
        </p>
        
        <button
          onClick={runTests}
          disabled={isRunning}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {currentTest || 'Running tests...'}
            </span>
          ) : (
            'Run Trade Date Tests'
          )}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  result.startsWith('✅') 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass p-6 rounded-xl mt-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Manual Test Trade Form</h2>
        <p className="text-white/70 mb-4">
          If the tests pass, you can try logging a trade manually using the button below:
        </p>
        <a
          href="/log-trade"
          className="inline-block py-3 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors"
        >
          Go to Log Trade Page
        </a>
      </div>
    </div>
  );
}