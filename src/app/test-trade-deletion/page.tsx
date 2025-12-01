'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';

interface TestTrade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  entry_price: number;
  pnl?: number;
  trade_date: string;
  user_id: string;
}

export default function TestTradeDeletion() {
  const [trades, setTrades] = useState<TestTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isCreatingTestTrade, setIsCreatingTestTrade] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchTrades = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          addTestResult('❌ Authentication required', 'error');
          setLoading(false);
          return;
        }

        setUser(user);
        addTestResult('✅ User authenticated successfully', 'success');

        const { data: fetchedTrades, error: fetchError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (fetchError) {
          addTestResult(`❌ Error fetching trades: ${fetchError.message}`, 'error');
        } else {
          setTrades(fetchedTrades || []);
          addTestResult(`✅ Found ${fetchedTrades?.length || 0} trades`, 'success');
        }
      } catch (err) {
        addTestResult(`❌ Unexpected error: ${err}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchTrades();
  }, []);

  const addTestResult = (message: string, type: 'success' | 'error' | 'info') => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createTestTrade = async () => {
    if (!user) return;
    
    setIsCreatingTestTrade(true);
    try {
      const testTrade = {
        user_id: user.id,
        symbol: 'TEST',
        side: 'Buy',
        quantity: 100,
        entry_price: 50.00,
        exit_price: 55.00,
        pnl: 500.00,
        trade_date: new Date().toISOString().split('T')[0],
        market: 'stock',
        notes: 'Test trade for deletion testing'
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(testTrade)
        .select()
        .single();

      if (error) {
        addTestResult(`❌ Failed to create test trade: ${error.message}`, 'error');
      } else {
        addTestResult(`✅ Created test trade with ID: ${data.id}`, 'success');
        setTrades(prev => [data, ...prev]);
      }
    } catch (err) {
      addTestResult(`❌ Error creating test trade: ${err}`, 'error');
    } finally {
      setIsCreatingTestTrade(false);
    }
  };

  const testDeleteTrade = async (tradeId: string) => {
    if (!user) return;

    addTestResult(`🔄 Starting deletion test for trade: ${tradeId}`, 'info');
    
    try {
      // Step 1: Verify trade exists before deletion
      const { data: beforeDelete, error: beforeError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .single();

      if (beforeError || !beforeDelete) {
        addTestResult(`❌ Trade not found before deletion: ${beforeError?.message}`, 'error');
        return;
      }
      addTestResult(`✅ Trade found before deletion: ${beforeDelete.symbol}`, 'success');

      // Step 2: Perform deletion
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', user.id);

      if (deleteError) {
        addTestResult(`❌ Delete operation failed: ${deleteError.message}`, 'error');
        return;
      }
      addTestResult(`✅ Delete operation succeeded`, 'success');

      // Step 3: Verify trade is gone after deletion
      const { data: afterDelete, error: afterError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .single();

      if (!afterError && afterDelete) {
        addTestResult(`❌ Trade still exists after deletion!`, 'error');
        return;
      }
      addTestResult(`✅ Trade successfully removed from database`, 'success');

      // Step 4: Update UI
      setTrades(prev => prev.filter(trade => trade.id !== tradeId));
      addTestResult(`✅ UI updated - trade removed from list`, 'success');

      addTestResult(`🎉 Deletion test completed successfully!`, 'success');

    } catch (err) {
      addTestResult(`❌ Unexpected error during deletion test: ${err}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading trade deletion test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trade Deletion Test</h1>
          <p className="text-white/70">Test the manual trade deletion functionality</p>
        </div>

        {/* Test Results */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-white/50">No tests run yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono text-white/80">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Test Trade */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Create Test Trade</h2>
          <button
            onClick={createTestTrade}
            disabled={isCreatingTestTrade}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isCreatingTestTrade ? 'Creating...' : 'Create Test Trade'}
          </button>
        </div>

        {/* Trades List */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Available Trades for Testing</h2>
          {trades.length === 0 ? (
            <p className="text-white/50">No trades found. Create a test trade first.</p>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{trade.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        trade.side === 'Buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </div>
                    <div className="text-sm text-white/70">
                      {trade.quantity} shares @ ${trade.entry_price}
                      {trade.pnl && (
                        <span className={`ml-2 ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          P&L: ${trade.pnl}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      ID: {trade.id}
                    </div>
                  </div>
                  <button
                    onClick={() => testDeleteTrade(trade.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Test Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 glass p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Click "Create Test Trade" to create a trade for testing</li>
            <li>Click "Test Delete" on any trade to run the deletion test</li>
            <li>Watch the test results to verify each step of the deletion process</li>
            <li>The test will verify the trade exists, delete it, and confirm it's gone</li>
          </ol>
        </div>
      </div>
    </div>
  );
}