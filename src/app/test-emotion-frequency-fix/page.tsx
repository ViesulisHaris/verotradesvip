'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import EmotionRadar from '@/components/ui/EmotionRadar';

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

export default function TestEmotionFrequencyFix() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [emotionData, setEmotionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No user found');
        return;
      }

      const { data: tradesData, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setTrades(tradesData as Trade[] || []);
      
      // Process emotion data using same logic as dashboard
      const processedData = getEmotionData(tradesData as Trade[] || []);
      setEmotionData(processedData);
      
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Copy of the fixed getEmotionData function from dashboard
  function getEmotionData(trades: Trade[]) {
    try {
      if (!trades || !Array.isArray(trades)) {
        console.warn('getEmotionData: Invalid trades input', trades);
        return [];
      }
      
      if (trades.length === 0) {
        console.log('getEmotionData: No trades to process');
        return [];
      }
      
      const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
      const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
      
      trades.forEach((trade, index) => {
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
      
      // Calculate maximum frequency to determine dynamic scaling
      const allTotals = emotionEntries.map(([_, counts]) => 
        counts.buyCount + counts.sellCount + counts.nullCount
      );
      const maxFrequency = Math.max(...allTotals, 1);
      
      // Calculate dynamic fullMark based on maximum frequency
      const dynamicFullMark = Math.ceil(maxFrequency * 1.2); // Add 20% padding
      
      return emotionEntries.map(([emotion, counts]) => {
        try {
          const total = counts.buyCount + counts.sellCount + counts.nullCount;
          
          if (total === 0) {
            console.warn(`getEmotionData: Zero total trades for emotion ${emotion}`);
            return {
              subject: emotion,
              value: 0,
              fullMark: dynamicFullMark,
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
            value: total, // Use frequency (total count) for radar visualization
            fullMark: dynamicFullMark, // Use dynamic fullMark based on max frequency
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
            fullMark: dynamicFullMark,
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Emotion Frequency Fix Test</h1>
      
      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
        <p className="text-white/70 mb-4">
          This page tests the emotion frequency fix. The radar chart should now display emotions based on their frequency 
          (how many times they were logged), not just their bias direction.
        </p>
        <p className="text-white/70 mb-4">
          <strong>Expected behavior:</strong> Emotions logged more frequently should appear further from the center of the radar chart.
        </p>
        <p className="text-white/70 mb-4">
          Total trades processed: {trades.length}
        </p>
      </div>

      <div className="glass p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Emotion Data (Debug)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emotionData.map((emotion, index) => (
            <div key={index} className="bg-black/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">{emotion.subject}</h3>
              <p className="text-sm text-white/70">Frequency (value): {emotion.value}</p>
              <p className="text-sm text-white/70">Total Trades: {emotion.totalTrades}</p>
              <p className="text-sm text-white/70">Leaning: {emotion.leaning}</p>
              <p className="text-sm text-white/70">Side: {emotion.side}</p>
              <p className="text-sm text-white/70">Full Mark: {emotion.fullMark}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Emotional State Radar</h2>
        <div className="h-96">
          <EmotionRadar data={emotionData} />
        </div>
      </div>
    </div>
  );
}