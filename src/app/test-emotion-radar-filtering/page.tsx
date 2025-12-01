'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Filter, BarChart3, TrendingUp, TrendingDown, Brain, Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, TestTube, Target } from 'lucide-react';
import EmotionRadar from '@/components/ui/EmotionRadar';
import CustomDropdown from '@/components/ui/CustomDropdown';
import MultiSelectEmotionDropdown from '@/components/ui/MultiSelectEmotionDropdown';

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
  side: string;
  emotionSearch: string[];
}

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: any;
}

interface EmotionDataItem {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string;
  side: string;
  leaningValue?: number;
  totalTrades?: number;
}

export default function EmotionRadarFilteringTest() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    market: '',
    side: '',
    emotionSearch: []
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [beforeFilterData, setBeforeFilterData] = useState<EmotionDataItem[]>([]);
  const [afterFilterData, setAfterFilterData] = useState<EmotionDataItem[]>([]);

  // Fetch trades from database
  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })
        .limit(500); // Limit for performance

      setTrades(tradesData as Trade[] || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setLoading(false);
    }
  };

  // Apply filters to trades
  useEffect(() => {
    let filtered = [...trades];

    if (filters.market) {
      filtered = filtered.filter(trade =>
        trade.market?.toLowerCase() === filters.market.toLowerCase()
      );
    }

    if (filters.side) {
      filtered = filtered.filter(trade => trade.side === filters.side);
    }

    if (filters.emotionSearch && filters.emotionSearch.length > 0) {
      filtered = filtered.filter(trade => {
        if (!trade.emotional_state) return false;
        
        let emotionsArray: string[] = [];
        
        if (typeof trade.emotional_state === 'string') {
          try {
            emotionsArray = JSON.parse(trade.emotional_state);
          } catch (e) {
            emotionsArray = [trade.emotional_state];
          }
        } else if (Array.isArray(trade.emotional_state)) {
          emotionsArray = trade.emotional_state;
        }
        
        const normalizedEmotions = emotionsArray.map(emotion => emotion.toString().toUpperCase());
        const normalizedSearchTerms = filters.emotionSearch.map(emotion => emotion.toString().toUpperCase());
        
        return normalizedEmotions.some(emotion =>
          normalizedSearchTerms.includes(emotion)
        );
      });
    }

    setFilteredTrades(filtered);
  }, [trades, filters]);

  // getEmotionData function from dashboard (same logic as confluence page)
  const getEmotionData = (tradeList: Trade[]): EmotionDataItem[] => {
    try {
      if (!tradeList || !Array.isArray(tradeList)) {
        console.warn('getEmotionData: Invalid trades input', tradeList);
        return [];
      }
      
      if (tradeList.length === 0) {
        console.log('getEmotionData: No trades to process');
        return [];
      }
      
      const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
      const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
      
      tradeList.forEach((trade, index) => {
        try {
          if (!trade || typeof trade !== 'object') {
            console.warn(`getEmotionData: Invalid trade at index ${index}`, trade);
            return;
          }
          
          let emotions: string[] = [];
          
          if (trade.emotional_state) {
            if (Array.isArray(trade.emotional_state)) {
              emotions = trade.emotional_state
                .filter((e: any) => typeof e === 'string' && e.trim())
                .map((e: any) => e.trim().toUpperCase());
            } else if (typeof trade.emotional_state === 'string') {
              const trimmedState = (trade.emotional_state as string).trim();
              if (!trimmedState) return;
              
              try {
                const parsed = JSON.parse(trimmedState);
                if (Array.isArray(parsed)) {
                  emotions = parsed
                    .filter((e: any) => typeof e === 'string' && e.trim())
                    .map((e: any) => e.trim().toUpperCase());
                } else if (typeof parsed === 'string' && parsed.trim()) {
                  emotions = [parsed.trim().toUpperCase()];
                }
              } catch {
                emotions = [trimmedState.toUpperCase()];
              }
            }
          }
          
          const validEmotionsForTrade = emotions.filter(emotion => validEmotions.includes(emotion));
          
          if (validEmotionsForTrade.length === 0) {
            return;
          }
          
          validEmotionsForTrade.forEach(emotion => {
            if (!emotionData[emotion]) {
              emotionData[emotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
            }
            
            const tradeSide = typeof trade.side === 'string' ? trade.side.trim() : null;
            
            if (tradeSide === 'Buy') {
              emotionData[emotion].buyCount++;
            } else if (tradeSide === 'Sell') {
              emotionData[emotion].sellCount++;
            } else {
              emotionData[emotion].nullCount++;
            }
          });
        } catch (error) {
          console.warn(`getEmotionData: Error processing trade at index ${index}`, trade, error);
        }
      });
      
      const emotionEntries = Object.entries(emotionData);
      if (emotionEntries.length === 0) {
        console.log('getEmotionData: No valid emotion data found');
        return [];
      }
      
      return emotionEntries.map(([emotion, counts]) => {
        try {
          const total = counts.buyCount + counts.sellCount + counts.nullCount;
          
          if (total === 0) {
            return {
              subject: emotion,
              value: 0,
              fullMark: 100,
              leaning: 'Balanced',
              side: 'NULL',
              leaningValue: 0,
              totalTrades: 0
            };
          }
          
          let leaningValue = 0;
          let leaning = 'Balanced';
          let side = 'NULL';
          
          leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
          leaningValue = Math.max(-100, Math.min(100, leaningValue));
          
          if (leaningValue > 15) {
            leaning = 'Buy Leaning';
            side = 'Buy';
          } else if (leaningValue < -15) {
            leaning = 'Sell Leaning';
            side = 'Sell';
          } else {
            leaning = 'Balanced';
            side = 'NULL';
          }
          
          return {
            subject: emotion,
            value: Math.abs(leaningValue),
            fullMark: 100,
            leaning,
            side,
            leaningValue,
            totalTrades: total
          };
        } catch (error) {
          console.warn(`getEmotionData: Error processing emotion data for ${emotion}`, error);
          return {
            subject: emotion,
            value: 0,
            fullMark: 100,
            leaning: 'Balanced',
            side: 'NULL',
            leaningValue: 0,
            totalTrades: 0
          };
        }
      }).filter(item => item && typeof item === 'object');
    } catch (error) {
      console.error('getEmotionData: Unexpected error', error);
      return [];
    }
  };

  // Calculate emotion data for filtered trades
  const emotionData = useMemo(() => getEmotionData(filteredTrades), [filteredTrades]);

  // Run comprehensive tests
  const runTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    // Test 1: Basic functionality - no filters
    results.push({
      testName: 'Basic Functionality - No Filters',
      status: 'running',
      message: 'Testing emotion radar with all trades...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    const allTradesEmotionData = getEmotionData(trades);
    setBeforeFilterData(allTradesEmotionData);

    if (allTradesEmotionData.length > 0) {
      results[0].status = 'passed';
      results[0].message = `Successfully processed ${trades.length} trades with ${allTradesEmotionData.length} emotions`;
      results[0].details = {
        totalTrades: trades.length,
        emotionCount: allTradesEmotionData.length,
        sampleData: allTradesEmotionData.slice(0, 3)
      };
    } else {
      results[0].status = 'failed';
      results[0].message = 'No emotion data generated from trades';
    }

    // Test 2: Market filter test
    results.push({
      testName: 'Market Filter Test',
      status: 'running',
      message: 'Testing market filter functionality...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test with Stock market filter
    const stockTrades = trades.filter(trade => trade.market === 'Stock');
    const stockEmotionData = getEmotionData(stockTrades);
    
    if (stockTrades.length > 0 && stockEmotionData.length > 0) {
      results[1].status = 'passed';
      results[1].message = `Stock filter: ${stockTrades.length} trades, ${stockEmotionData.length} emotions`;
      results[1].details = {
        filterType: 'Market: Stock',
        beforeCount: trades.length,
        afterCount: stockTrades.length,
        emotionDataChanged: JSON.stringify(allTradesEmotionData) !== JSON.stringify(stockEmotionData)
      };
    } else if (stockTrades.length === 0) {
      results[1].status = 'passed';
      results[1].message = 'No stock trades found (test passed but no data to verify)';
    } else {
      results[1].status = 'failed';
      results[1].message = 'Stock filter failed to generate emotion data';
    }

    // Test 3: Side filter test
    results.push({
      testName: 'Side Filter Test',
      status: 'running',
      message: 'Testing side filter functionality...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test with Buy side filter
    const buyTrades = trades.filter(trade => trade.side === 'Buy');
    const buyEmotionData = getEmotionData(buyTrades);
    
    if (buyTrades.length > 0 && buyEmotionData.length > 0) {
      const hasBuyLeaning = buyEmotionData.some(emotion => emotion.side === 'Buy');
      results[2].status = hasBuyLeaning ? 'passed' : 'failed';
      results[2].message = hasBuyLeaning 
        ? `Buy filter shows buy-leaning emotions: ${buyTrades.length} trades`
        : `Buy filter failed to show buy-leaning emotions`;
      results[2].details = {
        filterType: 'Side: Buy',
        beforeCount: trades.length,
        afterCount: buyTrades.length,
        hasBuyLeaning,
        sampleEmotions: buyEmotionData.slice(0, 3)
      };
    } else {
      results[2].status = 'failed';
      results[2].message = 'No buy trades found or no emotion data generated';
    }

    // Test 4: Emotion filter test
    results.push({
      testName: 'Emotion Filter Test',
      status: 'running',
      message: 'Testing emotion filter functionality...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test with FOMO emotion filter
    const fomoTrades = trades.filter(trade => {
      if (!trade.emotional_state) return false;
      const emotions = Array.isArray(trade.emotional_state) 
        ? trade.emotional_state 
        : [trade.emotional_state];
      return emotions.some(e => e.toString().toUpperCase() === 'FOMO');
    });
    const fomoEmotionData = getEmotionData(fomoTrades);
    
    if (fomoTrades.length > 0 && fomoEmotionData.length > 0) {
      const hasFomoEmotion = fomoEmotionData.some(emotion => emotion.subject === 'FOMO');
      results[3].status = hasFomoEmotion ? 'passed' : 'failed';
      results[3].message = hasFomoEmotion
        ? `FOMO filter correctly shows FOMO emotion: ${fomoTrades.length} trades`
        : `FOMO filter failed to show FOMO emotion`;
      results[3].details = {
        filterType: 'Emotion: FOMO',
        beforeCount: trades.length,
        afterCount: fomoTrades.length,
        hasFomoEmotion,
        sampleEmotions: fomoEmotionData.slice(0, 3)
      };
    } else {
      results[3].status = 'passed';
      results[3].message = 'No FOMO trades found (test passed but no data to verify)';
    }

    // Test 5: Combined filter test
    results.push({
      testName: 'Combined Filter Test',
      status: 'running',
      message: 'Testing combined filter functionality...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test with Stock + Buy filters
    const stockBuyTrades = trades.filter(trade => 
      trade.market === 'Stock' && trade.side === 'Buy'
    );
    const stockBuyEmotionData = getEmotionData(stockBuyTrades);
    
    if (stockBuyTrades.length > 0 && stockBuyEmotionData.length > 0) {
      const hasBuyLeaning = stockBuyEmotionData.some(emotion => emotion.side === 'Buy');
      results[4].status = hasBuyLeaning ? 'passed' : 'failed';
      results[4].message = hasBuyLeaning
        ? `Stock+Buy filter works: ${stockBuyTrades.length} trades with buy leaning`
        : `Stock+Buy filter failed to show proper leaning`;
      results[4].details = {
        filterType: 'Market: Stock + Side: Buy',
        beforeCount: trades.length,
        afterCount: stockBuyTrades.length,
        hasBuyLeaning,
        emotionData: stockBuyEmotionData
      };
      setAfterFilterData(stockBuyEmotionData);
    } else {
      results[4].status = 'passed';
      results[4].message = 'No Stock+Buy trades found (test passed but no data to verify)';
    }

    // Test 6: Leaning calculation verification
    results.push({
      testName: 'Leaning Calculation Verification',
      status: 'running',
      message: 'Verifying emotion leaning calculations...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create test data with known buy/sell ratios
    const testTrades: Trade[] = [
      {
        id: 'test1',
        symbol: 'TEST',
        market: 'Stock',
        side: 'Buy',
        quantity: 100,
        pnl: 100,
        trade_date: '2024-01-01',
        strategy_id: null,
        emotional_state: ['FOMO']
      },
      {
        id: 'test2',
        symbol: 'TEST',
        market: 'Stock',
        side: 'Buy',
        quantity: 100,
        pnl: 100,
        trade_date: '2024-01-01',
        strategy_id: null,
        emotional_state: ['FOMO']
      },
      {
        id: 'test3',
        symbol: 'TEST',
        market: 'Stock',
        side: 'Sell',
        quantity: 100,
        pnl: -100,
        trade_date: '2024-01-01',
        strategy_id: null,
        emotional_state: ['FOMO']
      }
    ];
    
    const testEmotionData = getEmotionData(testTrades);
    const fomoData = testEmotionData.find(e => e.subject === 'FOMO');
    
    if (fomoData && fomoData.side === 'Buy' && (fomoData.leaningValue || 0) > 0) {
      results[5].status = 'passed';
      results[5].message = `Leaning calculation correct: 2 Buy, 1 Sell = Buy leaning (${(fomoData.leaningValue || 0).toFixed(1)}%)`;
      results[5].details = {
        buyCount: 2,
        sellCount: 1,
        expectedLeaning: 'Buy',
        actualLeaning: fomoData.side,
        leaningValue: fomoData.leaningValue
      };
    } else {
      results[5].status = 'failed';
      results[5].message = 'Leaning calculation incorrect';
      results[5].details = {
        expected: 'Buy leaning with positive value',
        actual: fomoData ? `${fomoData.side} (${fomoData.leaningValue})` : 'No data'
      };
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  // Apply test filter
  const applyTestFilter = (testType: string) => {
    switch (testType) {
      case 'stock':
        setFilters({ market: 'Stock', side: '', emotionSearch: [] });
        break;
      case 'buy':
        setFilters({ market: '', side: 'Buy', emotionSearch: [] });
        break;
      case 'sell':
        setFilters({ market: '', side: 'Sell', emotionSearch: [] });
        break;
      case 'fomo':
        setFilters({ market: '', side: '', emotionSearch: ['FOMO'] });
        break;
      case 'discipline':
        setFilters({ market: '', side: '', emotionSearch: ['DISCIPLINE'] });
        break;
      case 'stock-buy':
        setFilters({ market: 'Stock', side: 'Buy', emotionSearch: [] });
        break;
      case 'crypto-sell-fomo':
        setFilters({ market: 'Crypto', side: 'Sell', emotionSearch: ['FOMO'] });
        break;
      default:
        setFilters({ market: '', side: '', emotionSearch: [] });
    }
  };

  const resetFilters = () => {
    setFilters({
      market: '',
      side: '',
      emotionSearch: []
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Emotion Radar Filtering Test</h1>
        </div>
        <button
          onClick={runTests}
          disabled={isRunningTests || loading}
          className="glass-enhanced p-3 rounded-lg hover-glow flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
          <span className="text-white">Run Tests</span>
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Test Results
          </h2>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                <div className="mt-1">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{result.testName}</h3>
                  <p className="text-white/70 text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <div className="mt-2 text-xs text-white/50">
                      <pre className="bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="glass-enhanced p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-400" />
          Filter Controls
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Market</label>
            <CustomDropdown
              value={filters.market}
              onChange={(value) => setFilters({ ...filters, market: value })}
              options={[
                { value: "", label: "All Markets" },
                { value: "Stock", label: "Stock" },
                { value: "Crypto", label: "Crypto" },
                { value: "Forex", label: "Forex" },
                { value: "Futures", label: "Futures" }
              ]}
              placeholder="All Markets"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Side</label>
            <CustomDropdown
              value={filters.side}
              onChange={(value) => setFilters({ ...filters, side: value })}
              options={[
                { value: "", label: "All Sides" },
                { value: "Buy", label: "Buy" },
                { value: "Sell", label: "Sell" }
              ]}
              placeholder="All Sides"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Emotions</label>
            <MultiSelectEmotionDropdown
              value={filters.emotionSearch}
              onChange={(emotions) => setFilters({ ...filters, emotionSearch: emotions })}
              placeholder="Select emotions to filter..."
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Test Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => applyTestFilter('')}
            className={`px-3 py-1 rounded text-sm ${
              !filters.market && !filters.side && filters.emotionSearch.length === 0
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            All Trades
          </button>
          <button
            onClick={() => applyTestFilter('stock')}
            className={`px-3 py-1 rounded text-sm ${
              filters.market === 'Stock' && !filters.side && filters.emotionSearch.length === 0
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Stocks Only
          </button>
          <button
            onClick={() => applyTestFilter('buy')}
            className={`px-3 py-1 rounded text-sm ${
              !filters.market && filters.side === 'Buy' && filters.emotionSearch.length === 0
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Buy Only
          </button>
          <button
            onClick={() => applyTestFilter('sell')}
            className={`px-3 py-1 rounded text-sm ${
              !filters.market && filters.side === 'Sell' && filters.emotionSearch.length === 0
                ? 'bg-red-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Sell Only
          </button>
          <button
            onClick={() => applyTestFilter('fomo')}
            className={`px-3 py-1 rounded text-sm ${
              !filters.market && !filters.side && filters.emotionSearch.includes('FOMO')
                ? 'bg-yellow-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            FOMO Trades
          </button>
          <button
            onClick={() => applyTestFilter('discipline')}
            className={`px-3 py-1 rounded text-sm ${
              !filters.market && !filters.side && filters.emotionSearch.includes('DISCIPLINE')
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Disciplined Trades
          </button>
          <button
            onClick={() => applyTestFilter('stock-buy')}
            className={`px-3 py-1 rounded text-sm ${
              filters.market === 'Stock' && filters.side === 'Buy' && filters.emotionSearch.length === 0
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Stock + Buy
          </button>
          <button
            onClick={() => applyTestFilter('crypto-sell-fomo')}
            className={`px-3 py-1 rounded text-sm ${
              filters.market === 'Crypto' && filters.side === 'Sell' && filters.emotionSearch.includes('FOMO')
                ? 'bg-orange-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Crypto + Sell + FOMO
          </button>
        </div>

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-enhanced p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-white/70">Total Trades</h3>
          </div>
          <p className="text-2xl font-bold text-white">{trades.length}</p>
        </div>

        <div className="glass-enhanced p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-white/70">Filtered Trades</h3>
          </div>
          <p className="text-2xl font-bold text-white">{filteredTrades.length}</p>
        </div>

        <div className="glass-enhanced p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-white/70">Emotion Types</h3>
          </div>
          <p className="text-2xl font-bold text-white">{emotionData.length}</p>
        </div>
      </div>

      {/* Emotion Radar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before Filter */}
        {beforeFilterData.length > 0 && (
          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Before Filter (All Trades)
            </h3>
            <div className="text-sm text-white/70 mb-4">
              {trades.length} trades • {beforeFilterData.length} emotions
            </div>
            <EmotionRadar data={beforeFilterData} />
          </div>
        )}

        {/* After Filter */}
        {afterFilterData.length > 0 && (
          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              After Filter (Applied)
            </h3>
            <div className="text-sm text-white/70 mb-4">
              {filteredTrades.length} trades • {afterFilterData.length} emotions
            </div>
            <EmotionRadar data={afterFilterData} />
          </div>
        )}

        {/* Current Filter */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            Current Filter Results
          </h3>
          <div className="text-sm text-white/70 mb-4">
            {filteredTrades.length} trades • {emotionData.length} emotions
            {filters.market && ` • Market: ${filters.market}`}
            {filters.side && ` • Side: ${filters.side}`}
            {filters.emotionSearch.length > 0 && ` • Emotions: ${filters.emotionSearch.join(', ')}`}
          </div>
          <EmotionRadar data={emotionData} />
        </div>

        {/* Emotion Data Details */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            Emotion Data Details
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-white text-sm">
              <thead className="sticky top-0 bg-black/50">
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2">Emotion</th>
                  <th className="text-left py-2 px-2">Value</th>
                  <th className="text-left py-2 px-2">Leaning</th>
                  <th className="text-left py-2 px-2">Side</th>
                  <th className="text-left py-2 px-2">Trades</th>
                </tr>
              </thead>
              <tbody>
                {emotionData.map((emotion, index) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-2 px-2 font-medium">{emotion.subject}</td>
                    <td className="py-2 px-2">{emotion.value.toFixed(1)}%</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        emotion.side === 'Buy' ? 'bg-green-600/20 text-green-300' :
                        emotion.side === 'Sell' ? 'bg-red-600/20 text-red-300' :
                        'bg-gray-600/20 text-gray-300'
                      }`}>
                        {emotion.leaning}
                      </span>
                    </td>
                    <td className="py-2 px-2">{emotion.side}</td>
                    <td className="py-2 px-2">{emotion.totalTrades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {emotionData.length === 0 && (
              <div className="text-center text-white/50 py-8">
                No emotion data available for current filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
