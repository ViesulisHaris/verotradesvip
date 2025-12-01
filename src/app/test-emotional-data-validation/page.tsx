'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function TestEmotionalDataValidation() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

  useEffect(() => {
    async function loadAndValidateData() {
      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setValidationResults({ error: 'No authenticated user' });
          setLoading(false);
          return;
        }
        
        setUser(user);

        // Fetch trades for this user
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id);

        if (tradesError) {
          setValidationResults({ error: tradesError.message });
          setLoading(false);
          return;
        }

        setTrades(tradesData || []);

        // Analyze emotional data
        const emotionalStates = (tradesData || []).map(t => t.emotional_state);
        const uniqueEmotions = [...new Set(emotionalStates.filter(Boolean))];
        
        // Check which emotions are valid
        const validEmotions = uniqueEmotions.filter(e => {
          const normalized = e?.toUpperCase().trim();
          return normalized && VALID_EMOTIONS.includes(normalized);
        });
        
        const invalidEmotions = uniqueEmotions.filter(e => {
          const normalized = e?.toUpperCase().trim();
          return normalized && !VALID_EMOTIONS.includes(normalized);
        });

        // Count null/undefined emotions
        const nullEmotions = emotionalStates.filter(e => e === null || e === undefined).length;
        const emptyEmotions = emotionalStates.filter(e => e === '').length;

        // Create emotion data like dashboard does
        const emotions = (tradesData || []).reduce<Record<string, number>>((acc, t) => {
          const e = t.emotional_state ?? 'Neutral';
          acc[e] = (acc[e] ?? 0) + 1;
          return acc;
        }, {});

        const totalEmotions = Object.values(emotions).reduce((a: number, b: number) => a + b, 0) || 1;
        
        const emotionData = Object.entries(emotions).map(([label, value]) => ({
          subject: label,
          value: (value / totalEmotions) * 10,
          fullMark: 10,
          percent: ((value / totalEmotions) * 100).toFixed(1) + '%',
          leaning: 'Balanced',
          side: 'NULL',
          leaningValue: 0,
          totalTrades: value,
        }));

        // Test EmotionRadar validation logic
        const filteredData = emotionData.filter(item => {
          if (!item || typeof item !== 'object') return false;
          if (typeof item.subject !== 'string' || !item.subject.trim()) return false;
          
          const normalizedSubject = item.subject.toUpperCase().trim();
          if (!VALID_EMOTIONS.includes(normalizedSubject)) return false;
          
          if (typeof item.value !== 'number' || !isFinite(item.value)) return false;
          if (item.value < 0 || item.value > 1000) return false;
          
          return true;
        });

        setValidationResults({
          totalTrades: tradesData?.length || 0,
          emotionalStates,
          uniqueEmotions,
          validEmotions,
          invalidEmotions,
          nullEmotions,
          emptyEmotions,
          emotions,
          emotionData,
          filteredData,
          willEmotionRadarDisplay: filteredData.length > 0
        });

      } catch (error) {
        setValidationResults({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    }

    loadAndValidateData();
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
        <h1 className="text-3xl font-bold mb-8">Emotional Data Validation Test</h1>
        
        {validationResults.error ? (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
            <p className="text-red-300">{validationResults.error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Total Trades:</span> {validationResults.totalTrades}</p>
                  <p><span className="text-gray-400">Unique Emotions:</span> {validationResults.uniqueEmotions?.length || 0}</p>
                  <p><span className="text-gray-400">Valid Emotions:</span> {validationResults.validEmotions?.length || 0}</p>
                  <p><span className="text-gray-400">Invalid Emotions:</span> {validationResults.invalidEmotions?.length || 0}</p>
                  <p><span className="text-gray-400">Null Emotions:</span> {validationResults.nullEmotions || 0}</p>
                  <p><span className="text-gray-400">Empty Emotions:</span> {validationResults.emptyEmotions || 0}</p>
                  <p><span className="text-gray-400">EmotionRadar Will Display:</span> 
                    <span className={validationResults.willEmotionRadarDisplay ? 'text-green-400' : 'text-red-400'}>
                      {validationResults.willEmotionRadarDisplay ? ' YES' : ' NO'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Valid Emotions List</h2>
                <div className="grid grid-cols-2 gap-2">
                  {VALID_EMOTIONS.map(emotion => (
                    <div key={emotion} className="text-sm text-gray-300">
                      ✓ {emotion}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Found Emotions</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-green-400">Valid ({validationResults.validEmotions?.length || 0})</h3>
                  <div className="space-y-1">
                    {validationResults.validEmotions?.map((emotion: string, index: number) => (
                      <div key={index} className="text-sm text-gray-300">✓ {emotion}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 text-red-400">Invalid ({validationResults.invalidEmotions?.length || 0})</h3>
                  <div className="space-y-1">
                    {validationResults.invalidEmotions?.map((emotion: string, index: number) => (
                      <div key={index} className="text-sm text-gray-300">✗ {emotion}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 text-gray-400">Emotion Counts</h3>
                  <pre className="text-sm text-gray-300 overflow-auto">
                    {JSON.stringify(validationResults.emotions, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">EmotionData (Before EmotionRadar Filtering)</h2>
              <pre className="text-sm text-gray-300 overflow-auto max-h-64">
                {JSON.stringify(validationResults.emotionData, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">EmotionData (After EmotionRadar Filtering)</h2>
              <pre className="text-sm text-gray-300 overflow-auto max-h-64">
                {JSON.stringify(validationResults.filteredData, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}