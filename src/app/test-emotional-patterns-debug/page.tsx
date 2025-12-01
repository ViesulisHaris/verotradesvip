'use client';

import React, { useState, useEffect } from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { supabase } from '@/supabase/client';

export default function TestEmotionalPatternsDebug() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [emotionData, setEmotionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    async function loadTestData() {
      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No authenticated user');
          setDebugInfo({ error: 'No authenticated user' });
          setLoading(false);
          return;
        }
        
        setUser(user);
        console.log('✅ Authenticated user:', user.id);

        // Fetch trades for this user
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id);

        if (tradesError) {
          console.error('❌ Error fetching trades:', tradesError);
          setDebugInfo({ error: tradesError.message });
          setLoading(false);
          return;
        }

        console.log('✅ Trades data:', tradesData);
        setTrades(tradesData || []);

        // Process emotions like dashboard does
        const emotions = (tradesData || []).reduce<Record<string, number>>((acc, t) => {
          const e = t.emotional_state ?? 'Neutral';
          acc[e] = (acc[e] ?? 0) + 1;
          return acc;
        }, {});

        console.log('📊 Emotions count:', emotions);

        const totalEmotions = Object.values(emotions).reduce((a: number, b: number) => a + b, 0) || 1;
        console.log('📊 Total emotions:', totalEmotions);

        // Create emotionData like dashboard does
        const processedEmotionData = Object.entries(emotions).map(([label, value]) => ({
          subject: label,
          value: (value / totalEmotions) * 10,
          fullMark: 10,
          percent: ((value / totalEmotions) * 100).toFixed(1) + '%',
          leaning: 'Balanced',
          side: 'NULL',
          leaningValue: 0,
          totalTrades: value,
        }));

        console.log('📊 Processed emotionData:', processedEmotionData);
        setEmotionData(processedEmotionData);

        // Set debug info
        setDebugInfo({
          userId: user.id,
          totalTrades: tradesData?.length || 0,
          emotions,
          totalEmotions,
          emotionDataLength: processedEmotionData.length,
          emotionData: processedEmotionData
        });

      } catch (error) {
        console.error('❌ Unexpected error:', error);
        setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    }

    loadTestData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Emotional Patterns Debug Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">EmotionRadar Component</h2>
            <EmotionRadar data={emotionData} />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Raw Trades Data (First 5)</h2>
          <pre className="text-sm text-gray-300 overflow-auto max-h-64">
            {JSON.stringify(trades.slice(0, 5), null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">EmotionData Sent to EmotionRadar</h2>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(emotionData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}