'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';

export default function ExecuteTradeDateFixPage() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  const addResult = (message: string, isSuccess: boolean = true) => {
    const prefix = isSuccess ? '✅' : '❌';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const executeFix = async () => {
    setResults([]);
    setIsExecuting(true);

    try {
      // Step 1: Check if user is authenticated
      setCurrentStep('Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        addResult('Authentication required: Please log in first', false);
        setIsExecuting(false);
        return;
      }
      addResult('Authentication successful');

      // Step 2: Try to add the trade_date column if it doesn't exist
      setCurrentStep('Adding trade_date column...');
      try {
        // We'll use a direct SQL approach through a custom function
        // Since we can't execute arbitrary SQL directly, we'll try a different approach
        
        // First, let's try to insert a trade with trade_date to see the exact error
        const testTrade = {
          user_id: user.id,
          symbol: 'TEST_FIX',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.0,
          exit_price: 55.0,
          pnl: 500.0,
          market: 'stock'
        };

        const { error: insertError } = await supabase
          .from('trades')
          .insert(testTrade);

        if (insertError) {
          if (insertError.message.includes('trade_date')) {
            addResult(`Confirmed trade_date column issue: ${insertError.message}`);
            
            // Since we can't execute DDL directly from the client,
            // we need to provide instructions for manual execution
            addResult('Manual database fix required:', false);
            addResult('1. Go to your Supabase dashboard', false);
            addResult('2. Navigate to SQL Editor', false);
            addResult('3. Execute the TRADE_DATE_SCHEMA_FIX.sql script', false);
            addResult('4. Refresh the page and try again', false);
          } else {
            addResult(`Other error: ${insertError.message}`, false);
          }
        } else {
          addResult('trade_date column appears to be working!');
          
          // Clean up the test trade
          const { error: deleteError } = await supabase
            .from('trades')
            .delete()
            .eq('symbol', 'TEST_FIX')
            .eq('user_id', user.id);
          
          if (deleteError) {
            addResult(`Cleanup error: ${deleteError.message}`, false);
          } else {
            addResult('Test trade cleaned up successfully');
          }
        }
      } catch (err) {
        addResult(`Column check failed: ${err}`, false);
      }

      // Step 3: Test the fix by trying to query trades with trade_date
      setCurrentStep('Testing trade_date column access...');
      try {
        const { data: trades, error: queryError } = await supabase
          .from('trades')
          .select('id, trade_date, symbol, side')
          .eq('user_id', user.id)
          .limit(1);

        if (queryError) {
          if (queryError.message.includes('trade_date')) {
            addResult(`trade_date query still failing: ${queryError.message}`, false);
          } else {
            addResult(`Other query error: ${queryError.message}`, false);
          }
        } else {
          addResult(`Successfully queried trades with trade_date column`);
          addResult(`Found ${trades?.length || 0} trades`);
        }
      } catch (err) {
        addResult(`Query test failed: ${err}`, false);
      }

      addResult('Fix execution completed!');
      
    } catch (error) {
      addResult(`Unexpected error: ${error}`, false);
    } finally {
      setIsExecuting(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Execute Trade Date Schema Fix</h1>
      
      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Fix trade_date Column Issue</h2>
        <p className="text-white/70 mb-4">
          This tool will attempt to fix the "Could not find the 'trade_date' column of 'trades' in the schema cache" error.
        </p>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
          <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Important Note</h3>
          <p className="text-yellow-300 text-sm">
            Due to security restrictions, this page can only test for the issue but cannot execute the actual database schema fix.
            If the issue is detected, you'll need to manually execute the SQL script in your Supabase dashboard.
          </p>
        </div>
        
        <button
          onClick={executeFix}
          disabled={isExecuting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {currentStep || 'Executing fix...'}
            </span>
          ) : (
            'Execute Trade Date Fix'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Execution Results</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
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

      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Manual Fix Instructions</h2>
        <div className="space-y-4 text-white/80">
          <div>
            <h3 className="font-semibold text-white mb-2">Step 1: Go to Supabase Dashboard</h3>
            <p className="text-sm">Navigate to your Supabase project dashboard.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">Step 2: Open SQL Editor</h3>
            <p className="text-sm">Click on "SQL Editor" in the left sidebar.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">Step 3: Execute the Fix Script</h3>
            <p className="text-sm mb-2">Copy and paste the contents of TRADE_DATE_SCHEMA_FIX.sql and execute it.</p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-xs">
              <p>-- The script will:</p>
              <p>-- 1. Check if trade_date column exists</p>
              <p>-- 2. Add the column if missing</p>
              <p>-- 3. Refresh the schema cache</p>
              <p>-- 4. Verify the fix</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">Step 4: Verify the Fix</h3>
            <p className="text-sm">Return to this page and run the test again, or visit /test-trade-date-fix.</p>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Quick Links</h2>
        <div className="space-y-3">
          <a
            href="/test-trade-date-fix"
            className="block py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Trade Date Fix
          </a>
          <a
            href="/log-trade"
            className="block py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Logging a Trade
          </a>
          <a
            href="/trades"
            className="block py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Trades Page
          </a>
        </div>
      </div>
    </div>
  );
}