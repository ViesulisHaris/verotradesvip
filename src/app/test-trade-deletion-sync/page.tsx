'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Trash2, RefreshCw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  trade_date: string;
  market?: string;
}

export default function TestTradeDeletionSync() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [confluenceTrades, setConfluenceTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user and fetch initial data
    const initializeTest = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          addTestResult('❌ Authentication failed. Please log in first.', 'error');
          setLoading(false);
          return;
        }

        setUser(user);
        await fetchTradesData();
        setLoading(false);
      } catch (err) {
        addTestResult(`❌ Error initializing test: ${err}`, 'error');
        setLoading(false);
      }
    };

    initializeTest();
  }, []);

  const fetchTradesData = async () => {
    try {
      if (!user) return;

      // Fetch trades from the main trades endpoint
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (tradesError) {
        addTestResult(`❌ Error fetching trades: ${tradesError.message}`, 'error');
        return;
      }

      // Fetch trades as confluence page would
      const { data: confluenceData, error: confluenceError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (confluenceError) {
        addTestResult(`❌ Error fetching confluence data: ${confluenceError.message}`, 'error');
        return;
      }

      setTrades(tradesData || []);
      setConfluenceTrades(confluenceData || []);
      addTestResult(`✅ Fetched ${tradesData?.length || 0} trades from both sources`, 'success');
    } catch (err) {
      addTestResult(`❌ Error fetching trades data: ${err}`, 'error');
    }
  };

  const addTestResult = (message: string, type: 'success' | 'error' | 'info') => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testTradeDeletion = async () => {
    if (trades.length === 0) {
      addTestResult('❌ No trades available for testing. Please create some trades first.', 'error');
      return;
    }

    setIsTestRunning(true);
    addTestResult('🔄 Starting trade deletion synchronization test...', 'info');

    try {
      // Select a trade to delete (the first one)
      const tradeToDelete = trades[0];
      if (!tradeToDelete) {
        addTestResult('❌ No trade available for deletion', 'error');
        setIsTestRunning(false);
        return;
      }
      addTestResult(`📝 Selected trade: ${tradeToDelete.symbol} (${tradeToDelete.side})`, 'info');

      // Record initial state
      const initialTradesCount = trades.length;
      const initialConfluenceCount = confluenceTrades.length;
      addTestResult(`📊 Initial counts - Trades: ${initialTradesCount}, Confluence: ${initialConfluenceCount}`, 'info');

      // Delete the trade
      addTestResult('🗑️ Deleting trade...', 'info');
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeToDelete.id)
        .eq('user_id', user.id);

      if (deleteError) {
        addTestResult(`❌ Error deleting trade: ${deleteError.message}`, 'error');
        setIsTestRunning(false);
        return;
      }

      addTestResult('✅ Trade deleted successfully from database', 'success');

      // Trigger storage event to simulate trades page behavior
      localStorage.setItem('trade-deleted', Date.now().toString());
      addTestResult('📡 Storage event triggered', 'info');

      // Wait a moment for the event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh data to check synchronization
      addTestResult('🔄 Refreshing data to check synchronization...', 'info');
      await fetchTradesData();

      // Check if synchronization worked
      setTimeout(() => {
        const finalTradesCount = trades.length;
        const finalConfluenceCount = confluenceTrades.length;
        
        addTestResult(`📊 Final counts - Trades: ${finalTradesCount}, Confluence: ${finalConfluenceCount}`, 'info');

        if (finalTradesCount === initialTradesCount - 1 && finalConfluenceCount === initialConfluenceCount - 1) {
          addTestResult('🎉 SUCCESS: Trade deletion synchronized correctly!', 'success');
          addTestResult('✅ Both trades and confluence tabs show updated data', 'success');
        } else {
          addTestResult('❌ FAILURE: Data synchronization issue detected', 'error');
          addTestResult(`Expected counts: ${initialTradesCount - 1}, ${initialConfluenceCount - 1}`, 'error');
          addTestResult(`Actual counts: ${finalTradesCount}, ${finalConfluenceCount}`, 'error');
        }

        setIsTestRunning(false);
      }, 2000);

    } catch (err) {
      addTestResult(`❌ Test failed with error: ${err}`, 'error');
      setIsTestRunning(false);
    }
  };

  const manualRefresh = async () => {
    addTestResult('🔄 Manually refreshing data...', 'info');
    await fetchTradesData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading test environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Trade Deletion Sync Test</h1>
          <p className="text-white/70">Test if deleted trades from trades tab disappear from confluence tab</p>
        </div>

        {/* Test Controls */}
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={testTradeDeletion}
              disabled={isTestRunning || trades.length === 0}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTestRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Test Trade Deletion
                </>
              )}
            </button>
            <button
              onClick={manualRefresh}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
          <div className="text-sm text-white/60">
            <p>This test will delete the first trade and verify it disappears from both trades and confluence views.</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Trades Tab
            </h3>
            <p className="text-2xl font-bold text-white mb-2">{trades.length}</p>
            <p className="text-white/60 text-sm">Active trades</p>
            {trades.slice(0, 3).map((trade, index) => (
              <div key={trade.id} className="mt-2 p-2 bg-white/5 rounded text-sm">
                <span className="text-white/80">{trade.symbol}</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  trade.side === 'Buy' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
                }`}>
                  {trade.side}
                </span>
              </div>
            ))}
          </div>

          <div className="glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              Confluence Tab
            </h3>
            <p className="text-2xl font-bold text-white mb-2">{confluenceTrades.length}</p>
            <p className="text-white/60 text-sm">Active trades</p>
            {confluenceTrades.slice(0, 3).map((trade, index) => (
              <div key={trade.id} className="mt-2 p-2 bg-white/5 rounded text-sm">
                <span className="text-white/80">{trade.symbol}</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  trade.side === 'Buy' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
                }`}>
                  {trade.side}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-purple-400" />
            Test Results
          </h3>
          <div className="bg-black/20 rounded-lg p-4 h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-white/60">No test results yet. Run a test to see results here.</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result.includes('✅') && <span className="text-green-400">{result}</span>}
                    {result.includes('❌') && <span className="text-red-400">{result}</span>}
                    {result.includes('🔄') && <span className="text-blue-400">{result}</span>}
                    {result.includes('📝') && <span className="text-yellow-400">{result}</span>}
                    {result.includes('📊') && <span className="text-purple-400">{result}</span>}
                    {result.includes('🗑️') && <span className="text-orange-400">{result}</span>}
                    {result.includes('📡') && <span className="text-cyan-400">{result}</span>}
                    {result.includes('🎉') && <span className="text-green-400">{result}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="glass p-6 rounded-xl mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Ensure you have some trades in your account</li>
            <li>Click "Test Trade Deletion" to delete the first trade</li>
            <li>Observe the test results to see if synchronization works</li>
            <li>Verify that both trades and confluence counts decrease by 1</li>
            <li>Use "Refresh Data" to manually check current state</li>
          </ol>
        </div>
      </div>
    </div>
  );
}