'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key for client-side

export default function ExecuteTradesBuySellCheckFix() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const executeFix = async () => {
    setIsExecuting(true);
    setError(null);
    setLogs([]);
    
    addLog('Starting trades buy/sell check constraint fix...');
    
    try {
      // Create a Supabase client for the operation
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Step 1: Check current constraints
      addLog('Checking current database constraints...');
      
      // Since we can't execute arbitrary SQL from the client, we'll test the constraint directly
      addLog('Testing trade insertion with "Buy" side...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated. Please log in first.');
      }
      
      // Test 1: Try to insert a trade with "Buy" side
      const testTradeBuy = {
        user_id: user.id,
        symbol: 'TEST_BUY',
        trade_date: new Date().toISOString().split('T')[0],
        side: 'Buy',
        quantity: 100,
        entry_price: 50.25,
        exit_price: 55.50,
        pnl: 525.00
      };
      
      const { data: buyResult, error: buyError } = await supabase
        .from('trades')
        .insert(testTradeBuy)
        .select();
      
      if (buyError) {
        if (buyError.message.includes('trades_buy_sell_check')) {
          addLog(`❌ CONSTRAINT ERROR DETECTED: ${buyError.message}`);
          addLog('The trades_buy_sell_check constraint is causing the issue.');
          addLog('This constraint needs to be fixed in the database.');
          addLog('Please run the TRADES_BUY_SELL_CHECK_FIX.sql script manually in Supabase SQL Editor.');
          addLog('Or contact your database administrator to apply the fix.');
        } else {
          addLog(`❌ Buy test failed with different error: ${buyError.message}`);
        }
      } else {
        addLog('✅ Buy test passed! Trade inserted successfully.');
        
        // Clean up test data
        await supabase.from('trades').delete().eq('symbol', 'TEST_BUY');
        addLog('Test data cleaned up.');
      }
      
      // Test 2: Try to insert a trade with "Sell" side
      addLog('Testing trade insertion with "Sell" side...');
      
      const testTradeSell = {
        user_id: user.id,
        symbol: 'TEST_SELL',
        trade_date: new Date().toISOString().split('T')[0],
        side: 'Sell',
        quantity: 100,
        entry_price: 55.50,
        exit_price: 50.25,
        pnl: -525.00
      };
      
      const { data: sellResult, error: sellError } = await supabase
        .from('trades')
        .insert(testTradeSell)
        .select();
      
      if (sellError) {
        if (sellError.message.includes('trades_buy_sell_check')) {
          addLog(`❌ CONSTRAINT ERROR DETECTED: ${sellError.message}`);
          addLog('The trades_buy_sell_check constraint is causing the issue.');
          addLog('This constraint needs to be fixed in the database.');
          addLog('Please run the TRADES_BUY_SELL_CHECK_FIX.sql script manually in Supabase SQL Editor.');
          addLog('Or contact your database administrator to apply the fix.');
        } else {
          addLog(`❌ Sell test failed with different error: ${sellError.message}`);
        }
      } else {
        addLog('✅ Sell test passed! Trade inserted successfully.');
        
        // Clean up test data
        await supabase.from('trades').delete().eq('symbol', 'TEST_SELL');
        addLog('Test data cleaned up.');
      }
      
      // Test 3: Try to insert a trade with invalid side (should fail)
      addLog('Testing trade insertion with invalid side (should fail)...');
      
      const testTradeInvalid = {
        user_id: user.id,
        symbol: 'TEST_INVALID',
        trade_date: new Date().toISOString().split('T')[0],
        side: 'InvalidSide',
        quantity: 100,
        entry_price: 50.25,
        exit_price: 55.50,
        pnl: 525.00
      };
      
      const { data: invalidResult, error: invalidError } = await supabase
        .from('trades')
        .insert(testTradeInvalid)
        .select();
      
      if (invalidError) {
        addLog(`✅ Invalid side correctly rejected: ${invalidError.message}`);
      } else {
        addLog('❌ Invalid side was incorrectly accepted - this indicates a problem with the constraint');
        // Clean up if it was inserted
        await supabase.from('trades').delete().eq('symbol', 'TEST_INVALID');
      }
      
      addLog('=== TEST COMPLETED ===');
      addLog('If you see constraint errors above, please run the SQL fix manually.');
      addLog('Otherwise, the trade logging functionality should work correctly.');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog(`❌ ERROR: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass p-8 rounded-xl">
          <h1 className="text-3xl font-bold text-white mb-6">Trades Buy/Sell Check Constraint Fix</h1>
          
          <div className="mb-6">
            <p className="text-white/80 mb-4">
              This tool will test and help fix the "new row for relation 'trades' violates check constraint 'trades_buy_sell_check'" error.
            </p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <h3 className="text-yellow-400 font-semibold mb-2">Important Notes:</h3>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• This test will create and delete test trades in your database</li>
                <li>• If constraint errors are detected, you'll need to run the SQL fix manually</li>
                <li>• Make sure you're logged in before running this test</li>
                <li>• Check the logs below for detailed results</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={executeFix}
            disabled={isExecuting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isExecuting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Testing Trade Constraints...
              </span>
            ) : (
              'Test Trade Constraints'
            )}
          </button>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-semibold mb-2">Error:</h3>
              <p className="text-red-200">{error}</p>
            </div>
          )}
          
          {logs.length > 0 && (
            <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="text-white font-semibold mb-3">Execution Logs:</h3>
              <div className="font-mono text-sm space-y-1">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.includes('❌') ? 'text-red-400' : 
                      log.includes('✅') ? 'text-green-400' : 
                      log.includes('⚠️') ? 'text-yellow-400' : 
                      'text-white/80'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/log-trade"
              className="block p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg hover:bg-blue-600/20 transition-colors"
            >
              <h3 className="text-blue-400 font-semibold mb-1">Test Trade Form</h3>
              <p className="text-blue-200 text-sm">Go to the trade logging form to test manually</p>
            </a>
            
            <a
              href="/trades"
              className="block p-4 bg-green-600/10 border border-green-500/20 rounded-lg hover:bg-green-600/20 transition-colors"
            >
              <h3 className="text-green-400 font-semibold mb-1">View Trades</h3>
              <p className="text-green-200 text-sm">Check if your trades are appearing correctly</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}