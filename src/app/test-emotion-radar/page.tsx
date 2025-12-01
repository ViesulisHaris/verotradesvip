'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import EmotionRadar from '@/components/ui/EmotionRadar';

export default function TestEmotionRadar() {
  const [trades, setTrades] = useState<any[]>([]);
  const [emotionData, setEmotionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trades')
        .select('id, pnl, trade_date, emotional_state, side')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: true })
        .limit(1000);

      if (error) {
        console.error('Error fetching trades:', error);
        setTrades([]);
      } else {
        setTrades(data || []);
        processEmotionData(data || []);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const processEmotionData = (trades: any[]) => {
    if (!trades || trades.length === 0) {
      setEmotionData([]);
      return;
    }
    
    const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
    
    trades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        trade.emotional_state.forEach((emotion: string) => {
          if (!emotionData[emotion]) {
            emotionData[emotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
          }
          
          if (trade.side === 'Buy') {
            emotionData[emotion].buyCount++;
          } else if (trade.side === 'Sell') {
            emotionData[emotion].sellCount++;
          } else {
            emotionData[emotion].nullCount++;
          }
        });
      }
    });
    
    const data = Object.entries(emotionData).map(([emotion, counts]) => {
      const total = counts.buyCount + counts.sellCount + counts.nullCount;
      let leaning = 'Balanced';
      let side = 'NULL';
      
      if (counts.buyCount > counts.sellCount && counts.buyCount > counts.nullCount) {
        leaning = 'Buy Leaning';
        side = 'Buy';
      } else if (counts.sellCount > counts.buyCount && counts.sellCount > counts.nullCount) {
        leaning = 'Sell Leaning';
        side = 'Sell';
      } else if (counts.nullCount > counts.buyCount && counts.nullCount > counts.sellCount) {
        leaning = 'NULL Side';
        side = 'NULL';
      }
      
      return {
        subject: emotion,
        value: Math.min(100, total * 20), // Scale value for visibility (max 5 trades per emotion = 100)
        fullMark: 100,
        leaning,
        side
      };
    });
    
    setEmotionData(data);
  };

  const createTestTrade = async (side: string, emotions: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: 'TEST',
        trade_date: new Date().toISOString().split('T')[0],
        side: side,
        entry_price: 100,
        exit_price: 105,
        pnl: side === 'Buy' ? 5 : -5,
        emotional_state: emotions.length > 0 ? emotions : null,
      });

      if (error) {
        console.error('Error creating test trade:', error);
        alert('Error creating test trade: ' + error.message);
      } else {
        alert('Test trade created successfully!');
        fetchTrades(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating test trade:', error);
      alert('Error creating test trade');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-bold text-white">Test Emotion Radar</h2>
      
      <div className="glass p-4 lg:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-white">Current Emotion Radar</h3>
        <EmotionRadar data={emotionData} />
      </div>

      <div className="glass p-4 lg:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-white">Test Data</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <h4 className="text-white font-medium mb-2">Total Trades: {trades.length}</h4>
            <div className="text-white/70 text-sm">
              <p>Buy: {trades.filter(t => t.side === 'Buy').length}</p>
              <p>Sell: {trades.filter(t => t.side === 'Sell').length}</p>
              <p>NULL: {trades.filter(t => !t.side).length}</p>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Emotion Data</h4>
            <pre className="text-white/70 text-xs overflow-auto max-h-32">
              {JSON.stringify(emotionData, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Raw Trade Data</h4>
            <pre className="text-white/70 text-xs overflow-auto max-h-32">
              {JSON.stringify(trades.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="glass p-4 lg:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-white">Create Test Trades</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <button
            onClick={() => createTestTrade('Buy', ['FOMO', 'PATIENCE'])}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Buy Trade (FOMO + PATIENCE)
          </button>
          <button
            onClick={() => createTestTrade('Sell', ['REVENGE', 'TILT'])}
            className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Create Sell Trade (REVENGE + TILT)
          </button>
          <button
            onClick={() => createTestTrade(null as any, ['DISCIPLINE', 'OVERRISK'])}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Create NULL Side Trade (DISCIPLINE + OVERRISK)
          </button>
        </div>
      </div>
    </div>
  );
}