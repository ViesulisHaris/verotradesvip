'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { Brain } from 'lucide-react';

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

interface EmotionData {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string;
  side: string;
  leaningValue?: number;
  totalTrades?: number;
}

export default function TestEmotionalAnalysisSimplePage() {
  const [trades, setTrades] = useState<Trade[]>([]);
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

      // Fetch trades using same query as both pages
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      setTrades(tradesData as Trade[] || []);
      setLoading(false);
      
      console.log('📊 Test Data Fetch:', {
        tradesCount: tradesData?.length || 0,
        user: user.id
      });
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // Same emotion processing logic as both pages
  const getEmotionData = (trades: Trade[]) => {
    try {
      if (!trades || trades.length === 0) {
        console.log('getEmotionData: No trades to process');
        return [];
      }
      
      const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
      const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
      
      trades.forEach((trade, index) => {
        try {
          if (!trade || typeof trade !== 'object') {
            console.warn(`Invalid trade at index ${index}`, trade);
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
            } else if (typeof trade.emotional_state === 'object' && trade.emotional_state !== null) {
              emotions = Object.values(trade.emotional_state)
                .filter((val: any) => typeof val === 'string')
                .map((val: any) => (val as string).toUpperCase());
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
          console.warn(`Error processing trade at index ${index}`, trade, error);
        }
      });
      
      const emotionEntries = Object.entries(emotionData);
      if (emotionEntries.length === 0) {
        console.log('getEmotionData: No valid emotion data found');
        return [];
      }
      
      return emotionEntries.map(([emotion, counts]) => {
        const total = counts.buyCount + counts.sellCount + counts.nullCount;
        
        if (total === 0) {
          console.warn(`Zero total trades for emotion ${emotion}`);
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
        
        let leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
        leaningValue = Math.max(-100, Math.min(100, leaningValue));
        
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
          value: Math.abs(leaningValue),
          fullMark: 100,
          leaning,
          side,
          leaningValue,
          totalTrades: total
        };
      });
    } catch (error) {
      console.error('getEmotionData: Unexpected error', error);
      return [];
    }
  };

  const emotionData = getEmotionData(trades);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Emotional State Analysis Test</h1>
      
      {error && (
        <div className="glass p-6 rounded-xl border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Error</h3>
          <p className="text-white/70">{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-8">
          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              Emotional Analysis Results
            </h2>
            <div className="text-sm text-white/70 mb-4">
              <p>Total Trades: {trades.length}</p>
              <p>Emotion Data Points: {emotionData.length}</p>
            </div>
            <EmotionRadar data={emotionData} />
          </div>
          
          <div className="glass p-6 rounded-xl mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Raw Emotion Data</h3>
            <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-green-400 whitespace-pre-wrap">
                {JSON.stringify(emotionData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}