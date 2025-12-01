'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Filter, BarChart3, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Calendar, DollarSign, Target, Brain, Clock, X, Settings, ChevronRight, Search, Activity, Zap, Shield, AlertCircle, Plus, Trash2 } from 'lucide-react';
import MultiSelectEmotionDropdown from '@/components/ui/MultiSelectEmotionDropdown';
import { formatEmotionsAsBoxes } from '@/utils/emotion-formatter';

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

interface FilterState {
  market: string;
  symbol: string;
  strategy: string;
  side: string;
  startDate: string;
  endDate: string;
  emotionSearch: string[];
}

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  timestamp: string;
}

export default function TestEmotionFilteringPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    market: '',
    symbol: '',
    strategy: '',
    side: '',
    startDate: '',
    endDate: '',
    emotionSearch: []
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isCreatingTestTrades, setIsCreatingTestTrades] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trades, filters]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false });

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...trades];

    addDebugLog(`Starting filter process with ${trades.length} trades`);

    if (filters.market) {
      filtered = filtered.filter(trade =>
        trade.market?.toLowerCase() === filters.market.toLowerCase()
      );
      addDebugLog(`After market filter: ${filtered.length} trades`);
    }

    if (filters.symbol) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
      addDebugLog(`After symbol filter: ${filtered.length} trades`);
    }

    if (filters.strategy) {
      filtered = filtered.filter(trade => trade.strategy_id === filters.strategy);
      addDebugLog(`After strategy filter: ${filtered.length} trades`);
    }

    if (filters.side) {
      filtered = filtered.filter(trade => trade.side === filters.side);
      addDebugLog(`After side filter: ${filtered.length} trades`);
    }

    if (filters.startDate) {
      filtered = filtered.filter(trade => trade.trade_date >= filters.startDate);
      addDebugLog(`After start date filter: ${filtered.length} trades`);
    }

    if (filters.endDate) {
      filtered = filtered.filter(trade => trade.trade_date <= filters.endDate);
      addDebugLog(`After end date filter: ${filtered.length} trades`);
    }

    if (filters.emotionSearch && filters.emotionSearch.length > 0) {
      addDebugLog(`Starting emotion filter with: ${filters.emotionSearch.join(', ')}`);
      
      filtered = filtered.filter(trade => {
        addDebugLog(`Processing trade: ${trade.id}, emotional_state: ${JSON.stringify(trade.emotional_state)}`);
        
        // Handle different data structures for emotional_state
        let emotionsArray: string[] = [];
        
        if (!trade.emotional_state) {
          addDebugLog(`Trade filtered out - no emotional_state`);
          return false;
        }
        
        // If emotional_state is a string, try to parse it as JSON
        if (typeof trade.emotional_state === 'string') {
          try {
            emotionsArray = JSON.parse(trade.emotional_state);
            addDebugLog(`Parsed emotional_state from string: ${JSON.stringify(emotionsArray)}`);
          } catch (e) {
            addDebugLog(`Failed to parse emotional_state as JSON`);
            return false;
          }
        }
        // If emotional_state is already an array
        else if (Array.isArray(trade.emotional_state)) {
          emotionsArray = trade.emotional_state;
          addDebugLog(`Using emotional_state as array: ${JSON.stringify(emotionsArray)}`);
        }
        // If emotional_state is an object, convert to array
        else if (typeof trade.emotional_state === 'object' && trade.emotional_state !== null) {
          emotionsArray = Object.values(trade.emotional_state).filter(val => typeof val === 'string') as string[];
          addDebugLog(`Converted emotional_state from object: ${JSON.stringify(emotionsArray)}`);
        }
        else {
          addDebugLog(`Trade filtered out - unsupported emotional_state format`);
          return false;
        }
        
        // Normalize both arrays to uppercase for case-insensitive comparison
        const normalizedEmotions = emotionsArray.map(emotion => emotion.toString().toUpperCase());
        const normalizedSearchTerms = filters.emotionSearch.map(emotion => emotion.toString().toUpperCase());
        
        const hasMatchingEmotion = normalizedEmotions.some(emotion =>
          normalizedSearchTerms.includes(emotion)
        );
        
        addDebugLog(`Trade emotions (normalized): ${normalizedEmotions.join(', ')}`);
        addDebugLog(`Search terms (normalized): ${normalizedSearchTerms.join(', ')}`);
        addDebugLog(`Has matching emotion: ${hasMatchingEmotion}`);
        
        return hasMatchingEmotion;
      });
      
      addDebugLog(`After emotion filter: ${filtered.length} trades`);
    }

    setFilteredTrades(filtered);
    addDebugLog(`Filter process completed. Final result: ${filtered.length} trades`);
  };

  const createTestTrades = async () => {
    setIsCreatingTestTrades(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const testTrades = [
      {
        user_id: user.id,
        symbol: 'AAPL',
        market: 'Stock',
        side: 'Buy',
        quantity: 100,
        pnl: 250.50,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['FOMO', 'ANXIOUS'])
      },
      {
        user_id: user.id,
        symbol: 'GOOGL',
        market: 'Stock',
        side: 'Sell',
        quantity: 50,
        pnl: -150.25,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['REVENGE', 'TILT'])
      },
      {
        user_id: user.id,
        symbol: 'BTC',
        market: 'Crypto',
        side: 'Buy',
        quantity: 0.5,
        pnl: 500.00,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['CONFIDENT', 'DISCIPLINE'])
      },
      {
        user_id: user.id,
        symbol: 'ETH',
        market: 'Crypto',
        side: 'Buy',
        quantity: 2,
        pnl: -300.75,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['PATIENCE'])
      },
      {
        user_id: user.id,
        symbol: 'EURUSD',
        market: 'Forex',
        side: 'Sell',
        quantity: 10000,
        pnl: 125.30,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['NEUTRAL'])
      },
      {
        user_id: user.id,
        symbol: 'TSLA',
        market: 'Stock',
        side: 'Buy',
        quantity: 75,
        pnl: 0,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['FOMO', 'OVERRISK', 'TILT'])
      },
      {
        user_id: user.id,
        symbol: 'MSFT',
        market: 'Stock',
        side: 'Sell',
        quantity: 80,
        pnl: 180.60,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: null // No emotions
      },
      {
        user_id: user.id,
        symbol: 'AMZN',
        market: 'Stock',
        side: 'Buy',
        quantity: 60,
        pnl: -90.40,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: JSON.stringify(['REGRET', 'ANXIOUS'])
      }
    ];

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert(testTrades)
        .select();

      if (error) {
        addDebugLog(`Error creating test trades: ${error.message}`);
        addTestResult('Create Test Trades', false, `Error: ${error.message}`);
      } else {
        addDebugLog(`Successfully created ${testTrades.length} test trades`);
        addTestResult('Create Test Trades', true, `Created ${testTrades.length} test trades`);
        fetchData(); // Refresh the trades list
      }
    } catch (error) {
      addDebugLog(`Unexpected error creating test trades: ${error}`);
      addTestResult('Create Test Trades', false, `Unexpected error: ${error}`);
    }

    setIsCreatingTestTrades(false);
  };

  const deleteTestTrades = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)
        .in('symbol', ['AAPL', 'GOOGL', 'BTC', 'ETH', 'EURUSD', 'TSLA', 'MSFT', 'AMZN']);

      if (error) {
        addDebugLog(`Error deleting test trades: ${error.message}`);
        addTestResult('Delete Test Trades', false, `Error: ${error.message}`);
      } else {
        addDebugLog(`Successfully deleted test trades`);
        addTestResult('Delete Test Trades', true, 'Deleted test trades');
        fetchData(); // Refresh the trades list
      }
    } catch (error) {
      addDebugLog(`Unexpected error deleting test trades: ${error}`);
      addTestResult('Delete Test Trades', false, `Unexpected error: ${error}`);
    }
  };

  const addTestResult = (testName: string, passed: boolean, details: string) => {
    const result: TestResult = {
      testName,
      passed,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const runSingleEmotionTest = (emotion: string) => {
    setDebugLogs([]);
    addDebugLog(`Starting single emotion test for: ${emotion}`);
    
    setFilters({ ...filters, emotionSearch: [emotion] });
    
    setTimeout(() => {
      const tradesWithEmotion = filteredTrades.filter(trade => {
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
        
        return emotionsArray.some(e => e.toUpperCase() === emotion.toUpperCase());
      });
      
      const passed = tradesWithEmotion.length > 0;
      addTestResult(
        `Single Emotion Filter (${emotion})`,
        passed,
        `Found ${tradesWithEmotion.length} trades with ${emotion} emotion`
      );
    }, 1000);
  };

  const runMultipleEmotionTest = () => {
    setDebugLogs([]);
    addDebugLog(`Starting multiple emotion test`);
    
    const emotions = ['FOMO', 'REVENGE', 'CONFIDENT'];
    setFilters({ ...filters, emotionSearch: emotions });
    
    setTimeout(() => {
      const tradesWithEmotions = filteredTrades.filter(trade => {
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
        
        return emotionsArray.some(e => emotions.includes(e.toUpperCase()));
      });
      
      const passed = tradesWithEmotions.length > 0;
      addTestResult(
        `Multiple Emotion Filter (${emotions.join(', ')})`,
        passed,
        `Found ${tradesWithEmotions.length} trades with any of the selected emotions`
      );
    }, 1000);
  };

  const runCaseInsensitiveTest = () => {
    setDebugLogs([]);
    addDebugLog(`Starting case insensitive test`);
    
    // Test with mixed case emotions
    const emotions = ['fomo', 'Revenge', 'CONFIDENT'];
    setFilters({ ...filters, emotionSearch: emotions });
    
    setTimeout(() => {
      const tradesWithEmotions = filteredTrades.filter(trade => {
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
        
        return emotionsArray.some(e => emotions.map(em => em.toUpperCase()).includes(e.toUpperCase()));
      });
      
      const passed = tradesWithEmotions.length > 0;
      addTestResult(
        `Case Insensitive Test (${emotions.join(', ')})`,
        passed,
        `Found ${tradesWithEmotions.length} trades with case-insensitive matching`
      );
    }, 1000);
  };

  const clearFilters = () => {
    setFilters({
      market: '',
      symbol: '',
      strategy: '',
      side: '',
      startDate: '',
      endDate: '',
      emotionSearch: []
    });
    setDebugLogs([]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Emotion Filtering Test</h1>
        <div className="flex gap-2">
          <button
            onClick={createTestTrades}
            disabled={isCreatingTestTrades}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isCreatingTestTrades ? 'Creating...' : 'Create Test Trades'}
          </button>
          <button
            onClick={deleteTestTrades}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete Test Trades
          </button>
        </div>
      </div>

      {/* Test Controls */}
      <div className="glass-enhanced p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Search Emotions</label>
            <MultiSelectEmotionDropdown
              value={filters.emotionSearch}
              onChange={(emotions) => setFilters({ ...filters, emotionSearch: emotions })}
              placeholder="Select emotions to test..."
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => runSingleEmotionTest('FOMO')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Test FOMO Filter
          </button>
          <button
            onClick={() => runSingleEmotionTest('REVENGE')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Test REVENGE Filter
          </button>
          <button
            onClick={() => runSingleEmotionTest('CONFIDENT')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Test CONFIDENT Filter
          </button>
          <button
            onClick={runMultipleEmotionTest}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Test Multiple Emotions
          </button>
          <button
            onClick={runCaseInsensitiveTest}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Test Case Insensitive
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Clear Filters
          </button>
          <button
            onClick={clearTestResults}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="glass-enhanced p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
        {testResults.length === 0 ? (
          <p className="text-white/70">No tests run yet. Click the test buttons above to start testing.</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{result.testName}</span>
                  </div>
                  <span className="text-sm opacity-70">{result.timestamp}</span>
                </div>
                <p className="text-sm mt-1 opacity-80">{result.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Logs */}
      <div className="glass-enhanced p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Debug Logs</h2>
        <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-white/50">No debug logs yet. Run a test to see detailed filtering information.</p>
          ) : (
            <div className="space-y-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-white/80">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Trades */}
      <div className="glass-enhanced p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">
          Current Trades ({trades.length} total, {filteredTrades.length} filtered)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4">Symbol</th>
                <th className="text-left py-3 px-4">Market</th>
                <th className="text-left py-3 px-4">Side</th>
                <th className="text-left py-3 px-4">P&L</th>
                <th className="text-left py-3 px-4">Emotional State</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                  <td className="py-3 px-4">{trade.market}</td>
                  <td className="py-3 px-4">{trade.side}</td>
                  <td className={`py-3 px-4 font-medium ${
                    (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(trade.pnl || 0)}
                  </td>
                  <td className="py-3 px-4">
                    {formatEmotionsAsBoxes(trade.emotional_state)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrades.length === 0 && (
            <div className="text-center text-white/70 py-8">
              No trades match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}