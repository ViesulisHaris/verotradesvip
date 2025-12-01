'use client';

import React, { useState, useEffect } from 'react';
import { formatEmotionsAsBoxes } from '@/utils/emotion-formatter';

// Mock trade data for testing
const mockTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    market: 'Stock',
    side: 'Buy',
    quantity: 100,
    pnl: 150.50,
    trade_date: '2024-01-15',
    strategy_id: 'strategy1',
    emotional_state: ['FOMO', 'CONFIDENT']
  },
  {
    id: '2',
    symbol: 'BTCUSD',
    market: 'Crypto',
    side: 'Sell',
    quantity: 0.5,
    pnl: -75.25,
    trade_date: '2024-01-16',
    strategy_id: 'strategy2',
    emotional_state: ['REVENGE', 'TILT']
  },
  {
    id: '3',
    symbol: 'EURUSD',
    market: 'Forex',
    side: 'Buy',
    quantity: 1000,
    pnl: 25.75,
    trade_date: '2024-01-17',
    strategy_id: 'strategy1',
    emotional_state: ['PATIENCE', 'DISCIPLINE']
  },
  {
    id: '4',
    symbol: 'GOOGL',
    market: 'Stock',
    side: 'Buy',
    quantity: 50,
    pnl: 200.00,
    trade_date: '2024-01-18',
    strategy_id: 'strategy3',
    emotional_state: ['NEUTRAL']
  },
  {
    id: '5',
    symbol: 'ETHUSD',
    market: 'Crypto',
    side: 'Sell',
    quantity: 2,
    pnl: -50.00,
    trade_date: '2024-01-19',
    strategy_id: 'strategy2',
    emotional_state: ['ANXIOUS', 'OVERRISK']
  }
];

interface FilterState {
  market: string;
  symbol: string;
  strategy: string;
  side: string;
  startDate: string;
  endDate: string;
  emotionSearch: string[];
}

export default function TestFilterFunctionalityPage() {
  const [trades] = useState(mockTrades);
  const [filteredTrades, setFilteredTrades] = useState(mockTrades);
  const [filters, setFilters] = useState<FilterState>({
    market: '',
    symbol: '',
    strategy: '',
    side: '',
    startDate: '',
    endDate: '',
    emotionSearch: []
  });
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[TEST] ${message}`);
  };

  // Apply filters function (copied from confluence page)
  const applyFilters = () => {
    console.log('🔍 [FILTER DEBUG] applyFilters() called');
    console.log('🔍 [FILTER DEBUG] Total trades before filtering:', trades.length);
    console.log('🔍 [FILTER DEBUG] Current filters:', filters);
    
    let filtered = [...trades];

    if (filters.market) {
      console.log('🔍 [FILTER DEBUG] Applying market filter:', filters.market);
      filtered = filtered.filter(trade =>
        trade.market?.toLowerCase() === filters.market.toLowerCase()
      );
      console.log('🔍 [FILTER DEBUG] Trades after market filter:', filtered.length);
    }

    if (filters.symbol) {
      console.log('🔍 [FILTER DEBUG] Applying symbol filter:', filters.symbol);
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
      console.log('🔍 [FILTER DEBUG] Trades after symbol filter:', filtered.length);
    }

    if (filters.strategy) {
      console.log('🔍 [FILTER DEBUG] Applying strategy filter:', filters.strategy);
      filtered = filtered.filter(trade => trade.strategy_id === filters.strategy);
      console.log('🔍 [FILTER DEBUG] Trades after strategy filter:', filtered.length);
    }

    if (filters.side) {
      console.log('🔍 [FILTER DEBUG] Applying side filter:', filters.side);
      filtered = filtered.filter(trade => trade.side === filters.side);
      console.log('🔍 [FILTER DEBUG] Trades after side filter:', filtered.length);
    }

    if (filters.startDate) {
      console.log('🔍 [FILTER DEBUG] Applying start date filter:', filters.startDate);
      filtered = filtered.filter(trade => trade.trade_date >= filters.startDate);
      console.log('🔍 [FILTER DEBUG] Trades after start date filter:', filtered.length);
    }

    if (filters.endDate) {
      console.log('🔍 [FILTER DEBUG] Applying end date filter:', filters.endDate);
      filtered = filtered.filter(trade => trade.trade_date <= filters.endDate);
      console.log('🔍 [FILTER DEBUG] Trades after end date filter:', filtered.length);
    }

    if (filters.emotionSearch && filters.emotionSearch.length > 0) {
      console.log('🔍 [EMOTION FILTER DEBUG] Starting emotion filter');
      console.log('🔍 [EMOTION FILTER DEBUG] Selected emotions:', filters.emotionSearch);
      console.log('🔍 [EMOTION FILTER DEBUG] Total trades before filter:', filtered.length);
      
      filtered = filtered.filter(trade => {
        if (!trade.emotional_state || !Array.isArray(trade.emotional_state)) {
          return false;
        }
        
        const normalizedEmotions = trade.emotional_state.map(emotion => emotion.toString().toUpperCase());
        const normalizedSearchTerms = filters.emotionSearch.map(emotion => emotion.toString().toUpperCase());
        
        const hasMatchingEmotion = normalizedEmotions.some(emotion =>
          normalizedSearchTerms.includes(emotion)
        );
        
        return hasMatchingEmotion;
      });
      
      console.log('🔍 [EMOTION FILTER DEBUG] Total trades after emotion filter:', filtered.length);
    }

    console.log('🔍 [FILTER DEBUG] Final filtered trades count:', filtered.length);
    console.log('🔍 [FILTER DEBUG] Setting filteredTrades state');
    setFilteredTrades(filtered);
  };

  // This is the key fix - useEffect should depend on both trades and filters
  useEffect(() => {
    console.log('🔍 [FILTER DEBUG] applyFilters useEffect triggered');
    console.log('🔍 [FILTER DEBUG] Current filters:', filters);
    applyFilters();
  }, [trades, filters]); // Re-apply filters when trades data OR filters change

  const runFilterTests = () => {
    addTestResult('=== Starting Filter Tests ===');
    
    // Test 1: Market Filter
    addTestResult('Test 1: Market Filter (Stock)');
    setFilters({ ...filters, market: 'Stock' });
    setTimeout(() => {
      const stockCount = filteredTrades.filter(t => t.market === 'Stock').length;
      addTestResult(`Expected: 2 Stock trades, Found: ${stockCount}`);
    }, 100);
    
    // Test 2: Side Filter
    setTimeout(() => {
      addTestResult('Test 2: Side Filter (Buy)');
      setFilters({ ...filters, market: '', side: 'Buy' });
      setTimeout(() => {
        const buyCount = filteredTrades.filter(t => t.side === 'Buy').length;
        addTestResult(`Expected: 3 Buy trades, Found: ${buyCount}`);
      }, 100);
    }, 500);
    
    // Test 3: Emotion Filter
    setTimeout(() => {
      addTestResult('Test 3: Emotion Filter (FOMO)');
      setFilters({ ...filters, market: '', side: '', emotionSearch: ['FOMO'] });
      setTimeout(() => {
        const fomoCount = filteredTrades.filter(t => 
          t.emotional_state && t.emotional_state.includes('FOMO')
        ).length;
        addTestResult(`Expected: 1 FOMO trade, Found: ${fomoCount}`);
      }, 100);
    }, 1000);
    
    // Test 4: Combined Filters
    setTimeout(() => {
      addTestResult('Test 4: Combined Filters (Stock + Buy)');
      setFilters({ ...filters, market: 'Stock', side: 'Buy', emotionSearch: [] });
      setTimeout(() => {
        const combinedCount = filteredTrades.filter(t => 
          t.market === 'Stock' && t.side === 'Buy'
        ).length;
        addTestResult(`Expected: 2 Stock+Buy trades, Found: ${combinedCount}`);
      }, 100);
    }, 1500);
    
    // Test 5: Reset Filters
    setTimeout(() => {
      addTestResult('Test 5: Reset Filters');
      setFilters({
        market: '',
        symbol: '',
        strategy: '',
        side: '',
        startDate: '',
        endDate: '',
        emotionSearch: []
      });
      setTimeout(() => {
        addTestResult(`Expected: 5 total trades, Found: ${filteredTrades.length}`);
        addTestResult('=== Filter Tests Complete ===');
      }, 100);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Filter Functionality Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              <button
                onClick={runFilterTests}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium w-full mb-4"
              >
                Run Automated Filter Tests
              </button>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Market Filter</label>
                  <select
                    value={filters.market}
                    onChange={(e) => setFilters({ ...filters, market: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">All Markets</option>
                    <option value="Stock">Stock</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Forex">Forex</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Side Filter</label>
                  <select
                    value={filters.side}
                    onChange={(e) => setFilters({ ...filters, side: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">All Sides</option>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Emotion Filter</label>
                  <select
                    multiple
                    value={filters.emotionSearch}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters({ ...filters, emotionSearch: selected });
                    }}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="FOMO">FOMO</option>
                    <option value="REVENGE">REVENGE</option>
                    <option value="TILT">TILT</option>
                    <option value="PATIENCE">PATIENCE</option>
                    <option value="DISCIPLINE">DISCIPLINE</option>
                    <option value="CONFIDENT">CONFIDENT</option>
                    <option value="ANXIOUS">ANXIOUS</option>
                    <option value="NEUTRAL">NEUTRAL</option>
                  </select>
                </div>
                
                <button
                  onClick={() => setFilters({
                    market: '',
                    symbol: '',
                    strategy: '',
                    side: '',
                    startDate: '',
                    endDate: '',
                    emotionSearch: []
                  })}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
            
            {/* Test Results */}
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="bg-black p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {testResults.length === 0 ? (
                  <p className="text-gray-400">Click "Run Automated Filter Tests" to start testing...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Data Display */}
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Filter Summary</h2>
              <div className="space-y-2 text-sm">
                <p>Total Trades: {trades.length}</p>
                <p>Filtered Trades: {filteredTrades.length}</p>
                <p>Current Filters: {JSON.stringify(filters, null, 2)}</p>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Filtered Trades</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-left py-2">Market</th>
                      <th className="text-left py-2">Side</th>
                      <th className="text-left py-2">P&L</th>
                      <th className="text-left py-2">Emotions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-700">
                        <td className="py-2">{trade.symbol}</td>
                        <td className="py-2">{trade.market}</td>
                        <td className="py-2">{trade.side}</td>
                        <td className="py-2">{trade.pnl}</td>
                        <td className="py-2">
                          {trade.emotional_state ? (
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                // Parse emotional state and display as formatted boxes
                                let emotions: string[] = [];
                                
                                if (Array.isArray(trade.emotional_state)) {
                                  emotions = trade.emotional_state
                                    .filter((e: any) => typeof e === 'string' && e.trim())
                                    .map((e: any) => e.trim().toUpperCase());
                                } else if (typeof trade.emotional_state === 'string') {
                                  const trimmed = (trade.emotional_state as any).trim();
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
                                
                                return emotions.map((emotion, index) => {
                                  const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
                                  return (
                                    <div
                                      key={index}
                                      className={`px-2 py-1 rounded-md ${emotionColor.bg} ${emotionColor.text} text-xs border ${emotionColor.border}`}
                                    >
                                      {emotion}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          ) : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}