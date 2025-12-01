'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import PnLChart from '@/components/ui/PnLChart';
import EmotionRadar from '@/components/ui/EmotionRadar';

interface Trade {
  pnl: number | null;
  emotional_state: string | null;
  user_id: string;
  side?: 'Buy' | 'Sell';
}

export default function TestGraphFixes() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [testResults, setTestResults] = useState({
    pnlChartVisible: false,
    emotionRadarVisible: false,
    pnlDataProcessed: false,
    emotionDataProcessed: false,
    menuStabilityTest: 'pending'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUser(user);

        const { data: tradesData } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id);

        const safeTrades: Trade[] = (tradesData ?? []) as Trade[];
        setTrades(safeTrades);

        // Test PnL data processing
        const validTrades = safeTrades.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
        const hasValidPnLData = validTrades.length > 0;
        
        // Test emotion data processing
        const emotions: Record<string, number> = {};
        safeTrades.forEach((trade) => {
          if (trade.emotional_state && typeof trade.emotional_state === 'string') {
            const emotion = trade.emotional_state.trim().toUpperCase();
            if (emotion) {
              emotions[emotion] = (emotions[emotion] || 0) + 1;
            }
          }
        });
        const hasEmotionData = Object.keys(emotions).length > 0;

        setTestResults(prev => ({
          ...prev,
          pnlChartVisible: hasValidPnLData,
          emotionRadarVisible: hasEmotionData,
          pnlDataProcessed: true,
          emotionDataProcessed: true
        }));

        console.log('🔧 [TEST RESULTS] Graph fixes test:', {
          hasValidPnLData,
          hasEmotionData,
          totalTrades: safeTrades.length,
          validTrades: validTrades.length,
          emotions: Object.keys(emotions).length
        });

      } catch (error) {
        console.error('Error loading test data:', error);
      }
    }

    loadData();
  }, []);

  // Test menu stability
  useEffect(() => {
    let resizeCount = 0;
    const handleResize = () => {
      resizeCount++;
      console.log(`🔧 [MENU STABILITY TEST] Resize event ${resizeCount} detected`);
      
      if (resizeCount > 5) {
        setTestResults(prev => ({
          ...prev,
          menuStabilityTest: 'failing'
        }));
      }
    };

    // Simulate menu opening/closing
    const testInterval = setInterval(() => {
      window.dispatchEvent(new Event('resize'));
    }, 1000);

    setTimeout(() => {
      clearInterval(testInterval);
      if (resizeCount <= 5) {
        setTestResults(prev => ({
          ...prev,
          menuStabilityTest: 'passed'
        }));
      }
    }, 6000);

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(testInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const emotionData = Object.entries(
    trades.reduce<Record<string, number>>((acc, trade) => {
      if (trade.emotional_state && typeof trade.emotional_state === 'string') {
        const emotion = trade.emotional_state.trim().toUpperCase();
        if (emotion) {
          acc[emotion] = (acc[emotion] || 0) + 1;
        }
      }
      return acc;
    }, {})
  ).map(([emotion, count]) => ({
    subject: emotion,
    value: count,
    fullMark: Math.max(...Object.values(
      trades.reduce<Record<string, number>>((acc, trade) => {
        if (trade.emotional_state && typeof trade.emotional_state === 'string') {
          const emotion = trade.emotional_state.trim().toUpperCase();
          if (emotion) {
            acc[emotion] = (acc[emotion] || 0) + 1;
          }
        }
        return acc;
      }, {})
    )) * 1.2 || 10,
    leaning: 'Balanced',
    side: 'NULL',
    leaningValue: 0,
    totalTrades: count
  }));

  const pnlData = trades
    .filter(trade => trade.pnl !== null && trade.pnl !== undefined)
    .map((trade, index) => ({
      date: `Trade ${index + 1}`,
      pnl: trade.pnl || 0,
      cumulative: trades
        .filter(t => t.pnl !== null && t.pnl !== undefined)
        .slice(0, index + 1)
        .reduce((sum, t) => sum + (t.pnl || 0), 0)
    }));

  return (
    <div className="space-y-8 p-6 min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold text-white mb-8">Graph Fixes Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80">PnL Chart Visible:</span>
              <span className={`font-bold ${testResults.pnlChartVisible ? 'text-green-400' : 'text-red-400'}`}>
                {testResults.pnlChartVisible ? '✅ YES' : '❌ NO'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Emotion Radar Visible:</span>
              <span className={`font-bold ${testResults.emotionRadarVisible ? 'text-green-400' : 'text-red-400'}`}>
                {testResults.emotionRadarVisible ? '✅ YES' : '❌ NO'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Menu Stability:</span>
              <span className={`font-bold ${
                testResults.menuStabilityTest === 'passed' ? 'text-green-400' : 
                testResults.menuStabilityTest === 'failing' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {testResults.menuStabilityTest === 'passed' ? '✅ PASSED' : 
                 testResults.menuStabilityTest === 'failing' ? '❌ FAILING' : '⏳ TESTING'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Data Summary</h2>
          <div className="space-y-2 text-white/80">
            <p>Total Trades: {trades.length}</p>
            <p>Trades with PnL: {trades.filter(t => t.pnl !== null && t.pnl !== undefined).length}</p>
            <p>Trades with Emotions: {trades.filter(t => t.emotional_state).length}</p>
            <p>Unique Emotions: {emotionData.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">P&L Performance Chart</h3>
          <div className="h-80">
            <PnLChart data={pnlData} height={320} />
          </div>
        </div>
        
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Emotional Patterns</h3>
          <div className="h-80">
            <EmotionRadar data={emotionData} />
          </div>
        </div>
      </div>
      
      <div className="glass p-6 rounded-xl mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-white/80">
          <li>Open browser console to see diagnostic logs</li>
          <li>Check if both charts are visible above</li>
          <li>Try opening/closing browser menu to test stability</li>
          <li>Watch for excessive resize events in console</li>
          <li>Both charts should remain stable during menu transitions</li>
        </ol>
      </div>
    </div>
  );
}