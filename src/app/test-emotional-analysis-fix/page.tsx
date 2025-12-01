'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Brain, Plus, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

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
  entry_time: string | null;
  exit_time: string | null;
}

interface EmotionData {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string;
  side: string;
  leaningValue: number;
  totalTrades: number;
}

// All 10 emotions that should be supported
const ALL_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

export default function TestEmotionalAnalysisFix() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  const addTestResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setTestResults(prev => [...prev, `${icon} ${message}`]);
  };

  const createTestTrades = async () => {
    if (!user) {
      addTestResult('User not authenticated', 'error');
      return;
    }

    setLoading(true);
    addTestResult('Creating test trades with all emotions...', 'info');

    try {
      // Create one trade for each emotion
      for (let i = 0; i < ALL_EMOTIONS.length; i++) {
        const emotion = ALL_EMOTIONS[i];
        const isBuy = i % 2 === 0; // Alternate between buy and sell
        
        const testTrade = {
          user_id: user.id,
          symbol: `TEST${emotion}`,
          market: 'Stock',
          side: isBuy ? 'Buy' : 'Sell',
          quantity: 100,
          pnl: isBuy ? Math.floor(Math.random() * 200) + 50 : -Math.floor(Math.random() * 100) - 25,
          trade_date: new Date(Date.now() - (ALL_EMOTIONS.length - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          strategy_id: null,
          emotional_state: [emotion], // Store as array with single emotion
          entry_time: '09:30:00',
          exit_time: '10:30:00',
          notes: `Test trade for ${emotion} emotion`
        };
        
        const { data, error } = await supabase
          .from('trades')
          .insert(testTrade)
          .select();
        
        if (error) {
          addTestResult(`Error creating test trade for ${emotion}: ${error.message}`, 'error');
        } else {
          addTestResult(`Created test trade for ${emotion} (ID: ${data[0].id})`, 'success');
        }
      }

      // Create a trade with multiple emotions
      const multiEmotionTrade = {
        user_id: user.id,
        symbol: 'MULTI',
        market: 'Crypto',
        side: 'Buy',
        quantity: 50,
        pnl: 150,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: null,
        emotional_state: ['FOMO', 'CONFIDENT', 'PATIENCE'], // Multiple emotions
        entry_time: '11:00:00',
        exit_time: '12:00:00',
        notes: 'Test trade with multiple emotions'
      };
      
      const { data: multiData, error: multiError } = await supabase
        .from('trades')
        .insert(multiEmotionTrade)
        .select();
      
      if (multiError) {
        addTestResult(`Error creating multi-emotion test trade: ${multiError.message}`, 'error');
      } else {
        addTestResult(`Created multi-emotion test trade (ID: ${multiData[0].id})`, 'success');
      }

      addTestResult(`Created ${ALL_EMOTIONS.length + 1} test trades`, 'success');
    } catch (error) {
      addTestResult(`Unexpected error: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndAnalyzeTrades = async () => {
    if (!user) {
      addTestResult('User not authenticated', 'error');
      return;
    }

    setLoading(true);
    addTestResult('Fetching and analyzing trades...', 'info');

    try {
      const { data: tradesData, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (error) {
        addTestResult(`Error fetching trades: ${error.message}`, 'error');
        return;
      }

      setTrades(tradesData || []);
      addTestResult(`Fetched ${tradesData?.length || 0} trades`, 'success');

      // Process emotions using same logic as dashboard
      const emotionDataMap: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
      
      tradesData?.forEach(trade => {
        if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
          trade.emotional_state.forEach((emotion: string) => {
            if (!emotionDataMap[emotion]) {
              emotionDataMap[emotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
            }
            
            if (trade.side === 'Buy') {
              emotionDataMap[emotion].buyCount++;
            } else if (trade.side === 'Sell') {
              emotionDataMap[emotion].sellCount++;
            } else {
              emotionDataMap[emotion].nullCount++;
            }
          });
        }
      });

      const processedEmotionData = Object.entries(emotionDataMap).map(([emotion, counts]) => {
        const total = counts.buyCount + counts.sellCount + counts.nullCount;
        const leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
        
        let leaning = 'Balanced';
        let side = 'NULL';
        
        if (leaningValue > 15) {
          leaning = 'Buy Leaning';
          side = 'Buy';
        } else if (leaningValue < -15) {
          leaning = 'Sell Leaning';
          side = 'Sell';
        }
        
        return {
          subject: emotion,
          value: total,
          fullMark: Math.max(1, total) * 1.2,
          leaning,
          side,
          leaningValue,
          totalTrades: total
        };
      });

      setEmotionData(processedEmotionData);
      
      const foundEmotions = processedEmotionData.map(item => item.subject);
      const missingEmotions = ALL_EMOTIONS.filter(emotion => !foundEmotions.includes(emotion));
      
      if (missingEmotions.length === 0) {
        addTestResult(`SUCCESS: All ${ALL_EMOTIONS.length} emotions are present in analysis!`, 'success');
      } else {
        addTestResult(`ISSUE: Missing emotions: ${missingEmotions.join(', ')}`, 'error');
        addTestResult(`Found emotions: ${foundEmotions.join(', ')}`, 'info');
      }

      addTestResult(`Emotion analysis complete with ${processedEmotionData.length} emotions`, 'success');
    } catch (error) {
      addTestResult(`Error analyzing emotions: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearTestTrades = async () => {
    if (!user) {
      addTestResult('User not authenticated', 'error');
      return;
    }

    setLoading(true);
    addTestResult('Clearing test trades...', 'info');

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)
        .like('symbol', 'TEST%');

      if (error) {
        addTestResult(`Error clearing test trades: ${error.message}`, 'error');
      } else {
        addTestResult('Cleared test trades', 'success');
        setTrades([]);
        setEmotionData([]);
      }
    } catch (error) {
      addTestResult(`Unexpected error: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Emotional Analysis Fix Test</h1>
      </div>

      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Test Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={createTestTrades}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Test Trades
          </button>
          
          <button
            onClick={fetchAndAnalyzeTrades}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Emotions
          </button>
          
          <button
            onClick={clearTestTrades}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Clear Test Data
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Expected Emotions ({ALL_EMOTIONS.length})</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_EMOTIONS.map(emotion => (
              <span key={emotion} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                {emotion}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Found Emotions ({emotionData.length})</h3>
          <div className="flex flex-wrap gap-2">
            {emotionData.map(item => (
              <span key={item.subject} className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm">
                {item.subject} ({item.totalTrades})
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">Test Results</h3>
          <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-white/50">No test results yet. Run the tests above.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm text-white/80">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {emotionData.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Emotion Data Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-4">Emotion</th>
                  <th className="text-center py-2 px-4">Total Trades</th>
                  <th className="text-center py-2 px-4">Buy Count</th>
                  <th className="text-center py-2 px-4">Sell Count</th>
                  <th className="text-center py-2 px-4">Leaning</th>
                  <th className="text-center py-2 px-4">Leaning Value</th>
                </tr>
              </thead>
              <tbody>
                {emotionData.map((item, index) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-2 px-4 font-medium">{item.subject}</td>
                    <td className="py-2 px-4 text-center">{item.totalTrades}</td>
                    <td className="py-2 px-4 text-center text-green-400">
                      {Math.round((item.leaningValue + 100) * item.totalTrades / 200)}
                    </td>
                    <td className="py-2 px-4 text-center text-red-400">
                      {Math.round((100 - item.leaningValue) * item.totalTrades / 200)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.side === 'Buy' ? 'bg-green-500/20 text-green-300' :
                        item.side === 'Sell' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {item.leaning}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`${
                        item.leaningValue > 15 ? 'text-green-400' :
                        item.leaningValue < -15 ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {item.leaningValue > 0 ? '+' : ''}{item.leaningValue.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-300">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-white/80">
          <li>Click "Create Test Trades" to create trades with all 10 emotions</li>
          <li>Click "Analyze Emotions" to process the emotional state data</li>
          <li>Verify that all 10 emotions appear in the "Found Emotions" section</li>
          <li>Check the emotion data table for proper processing</li>
          <li>Navigate to Dashboard and Confluence pages to verify the radar chart shows all emotions</li>
          <li>Use "Clear Test Data" to clean up when done</li>
        </ol>
      </div>
    </div>
  );
}