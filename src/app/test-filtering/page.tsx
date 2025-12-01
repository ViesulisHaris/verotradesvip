'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

// Helper function to format emotions as boxes
const formatEmotionsAsBoxes = (emotionalState: string[] | null | string) => {
  if (!emotionalState) {
    return <span className="text-gray-400">None</span>;
  }

  let emotions: string[] = [];
  
  if (Array.isArray(emotionalState)) {
    emotions = emotionalState
      .filter((e: any) => typeof e === 'string' && e.trim())
      .map((e: any) => e.trim().toUpperCase());
  } else if (typeof emotionalState === 'string') {
    const trimmed = emotionalState.trim();
    if (trimmed) {
      // Quick check if it's JSON format
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            emotions = parsed.map((e: any) => typeof e === 'string' ? e.trim().toUpperCase() : e);
          } else if (typeof parsed === 'string') {
            emotions = [parsed.trim().toUpperCase()];
          }
        } catch {
          emotions = [trimmed.toUpperCase()];
        }
      } else {
        emotions = [trimmed.toUpperCase()];
      }
    }
  }
  
  const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
    'FOMO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    'REVENGE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    'TILT': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    'OVERRISK': { bg: 'emotion-box-bg', text: 'emotion-box-text', border: 'border-yellow-500/50' },
    'PATIENCE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    'REGRET': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    'DISCIPLINE': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    'CONFIDENT': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    'ANXIOUS': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {emotions.map((emotion, index) => {
        const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
        return (
          <div
            key={index}
            className={`px-2 py-1 rounded-md ${emotionColor.bg} ${emotionColor.text} text-xs border ${emotionColor.border}`}
          >
            {emotion}
          </div>
        );
      })}
    </div>
  );
};

interface Trade {
  id: string;
  symbol: string;
  market: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  pnl: number | null;
  trade_date: string;
  strategy_id: string | null;
  emotional_state: string[] | null;
}

export default function TestFilteringPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[TEST] ${message}`);
  };

  const fetchTestData = async () => {
    addTestResult('Starting test data fetch...');
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      addTestResult('ERROR: No user found');
      return;
    }

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false })
      .limit(10); // Limit to 10 for testing

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
    addTestResult(`Fetched ${tradesData?.length || 0} trades for testing`);
  };

  const runFilterTests = async () => {
    if (trades.length === 0) {
      addTestResult('ERROR: No trades available for testing');
      return;
    }

    addTestResult('=== Starting Filter Tests ===');
    
    // Test 1: Market Filter
    addTestResult('Test 1: Market Filter (Stock)');
    const stockTrades = trades.filter(trade => trade.market?.toLowerCase() === 'stock');
    addTestResult(`Found ${stockTrades.length} Stock trades`);

    // Test 2: Side Filter
    addTestResult('Test 2: Side Filter (Buy)');
    const buyTrades = trades.filter(trade => trade.side === 'Buy');
    addTestResult(`Found ${buyTrades.length} Buy trades`);

    // Test 3: Symbol Filter
    addTestResult('Test 3: Symbol Filter (contains "A")');
    const symbolTrades = trades.filter(trade => 
      trade.symbol.toLowerCase().includes('a')
    );
    addTestResult(`Found ${symbolTrades.length} trades with symbol containing 'A'`);

    // Test 4: Emotion Filter
    addTestResult('Test 4: Emotion Filter (FOMO)');
    const emotionTrades = trades.filter(trade => {
      if (!trade.emotional_state) return false;
      let emotionsArray: string[] = [];
      
      if (typeof trade.emotional_state === 'string') {
        try {
          emotionsArray = JSON.parse(trade.emotional_state);
        } catch (e) {
          return false;
        }
      } else if (Array.isArray(trade.emotional_state)) {
        emotionsArray = trade.emotional_state;
      }
      
      return emotionsArray.some(emotion => 
        emotion.toString().toUpperCase() === 'FOMO'
      );
    });
    addTestResult(`Found ${emotionTrades.length} trades with FOMO emotion`);

    // Test 5: Date Range Filter
    addTestResult('Test 5: Date Range Filter (2024)');
    const dateTrades = trades.filter(trade => 
      trade.trade_date >= '2024-01-01' && trade.trade_date <= '2024-12-31'
    );
    addTestResult(`Found ${dateTrades.length} trades in 2024`);

    // Test 6: Combined Filters
    addTestResult('Test 6: Combined Filters (Stock + Buy)');
    const combinedTrades = trades.filter(trade => 
      trade.market?.toLowerCase() === 'stock' && trade.side === 'Buy'
    );
    addTestResult(`Found ${combinedTrades.length} Stock + Buy trades`);

    addTestResult('=== Filter Tests Complete ===');
  };

  useEffect(() => {
    fetchTestData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Filter Functionality Test</h1>
        
        <div className="mb-8">
          <button
            onClick={runFilterTests}
            disabled={loading || trades.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Loading...' : 'Run Filter Tests'}
          </button>
          
          <button
            onClick={fetchTestData}
            className="ml-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
          >
            Refresh Data
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Data Summary</h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p>Total Trades: {trades.length}</p>
            <p>Markets: {[...new Set(trades.map(t => t.market))].join(', ')}</p>
            <p>Sides: {[...new Set(trades.map(t => t.side))].join(', ')}</p>
            <p>With Emotions: {trades.filter(t => t.emotional_state && t.emotional_state.length > 0).length}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-black p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-400">Click "Run Filter Tests" to start testing...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sample Trade Data</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Market</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">P&L</th>
                  <th className="text-left py-2">Emotions</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 5).map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800">
                    <td className="py-2">{trade.symbol}</td>
                    <td className="py-2">{trade.market}</td>
                    <td className="py-2">{trade.side}</td>
                    <td className="py-2">{trade.trade_date}</td>
                    <td className="py-2">{trade.pnl}</td>
                    <td className="py-2">
                      {formatEmotionsAsBoxes(trade.emotional_state)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}