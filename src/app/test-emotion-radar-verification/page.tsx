'use client';

import React, { useState, useMemo } from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { Brain, RefreshCw, TestTube, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Helper function to format emotions as boxes
const formatEmotionsAsBoxes = (emotionalState: string[] | null | string) => {
  if (!emotionalState) {
    return <span className="text-gray-400">None</span>;
  }

  let emotions: string[] = [];
  
  if (Array.isArray(emotionalState)) {
    emotions = emotionalState
      .filter((e: any) => typeof e === 'string' && e.trim())
      .map((e: any) => e.trim().toUpperCase());
  } else if (typeof emotionalState === 'string') {
    const trimmed = emotionalState.trim();
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
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' },
    'FEAR': { bg: 'bg-red-600/20', text: 'text-red-300', border: 'border-red-600/50' }
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {emotions.map((emotion, index) => {
        const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
        return (
          <div
            key={index}
            className={`px-2 py-1 rounded-md ${emotionColor?.bg || ''} ${emotionColor?.text || ''} text-xs border ${emotionColor?.border || ''}`}
          >
            {emotion}
          </div>
        );
      })}
    </div>
  );
};

// Trade interface matching the dashboard
interface Trade {
  id: string;
  pnl: number | null;
  trade_date: string;
  emotional_state: string[] | null;
  side: string | null;
  entry_time: string | null;
  exit_time: string | null;
  strategy_id: string | null;
}

// Emotion data interface matching the EmotionRadar component
interface EmotionData {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string;
  side: string;
  leaningValue: number;
  totalTrades: number;
}

// Define the valid emotions
const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

// Predefined test scenarios with different emotion patterns
const testScenarios = {
  'Buy-Biased': {
    description: 'Emotions with strong buy leaning (more buy trades than sell trades)',
    trades: [
      // FOMO - Strong buy bias (8 buy, 2 sell)
      { id: '1', pnl: 100, trade_date: '2023-01-01', emotional_state: ['FOMO'], side: 'Buy', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '2', pnl: 50, trade_date: '2023-01-02', emotional_state: ['FOMO'], side: 'Buy', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '3', pnl: -25, trade_date: '2023-01-03', emotional_state: ['FOMO'], side: 'Buy', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '4', pnl: 75, trade_date: '2023-01-04', emotional_state: ['FOMO'], side: 'Buy', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      { id: '5', pnl: 150, trade_date: '2023-01-05', emotional_state: ['FOMO'], side: 'Buy', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '6', pnl: -50, trade_date: '2023-01-06', emotional_state: ['FOMO'], side: 'Buy', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '7', pnl: 200, trade_date: '2023-01-07', emotional_state: ['FOMO'], side: 'Buy', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '8', pnl: -75, trade_date: '2023-01-08', emotional_state: ['FOMO'], side: 'Buy', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
      { id: '9', pnl: 125, trade_date: '2023-01-09', emotional_state: ['FOMO'], side: 'Sell', entry_time: '13:00', exit_time: '14:00', strategy_id: '1' },
      { id: '10', pnl: -100, trade_date: '2023-01-10', emotional_state: ['FOMO'], side: 'Sell', entry_time: '13:30', exit_time: '14:30', strategy_id: '1' },
      
      // CONFIDENT - Moderate buy bias (6 buy, 3 sell)
      { id: '11', pnl: 80, trade_date: '2023-01-11', emotional_state: ['CONFIDENT'], side: 'Buy', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '12', pnl: 120, trade_date: '2023-01-12', emotional_state: ['CONFIDENT'], side: 'Buy', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '13', pnl: 60, trade_date: '2023-01-13', emotional_state: ['CONFIDENT'], side: 'Buy', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '14', pnl: 90, trade_date: '2023-01-14', emotional_state: ['CONFIDENT'], side: 'Buy', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      { id: '15', pnl: 110, trade_date: '2023-01-15', emotional_state: ['CONFIDENT'], side: 'Buy', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '16', pnl: 70, trade_date: '2023-01-16', emotional_state: ['CONFIDENT'], side: 'Buy', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '17', pnl: -40, trade_date: '2023-01-17', emotional_state: ['CONFIDENT'], side: 'Sell', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '18', pnl: -60, trade_date: '2023-01-18', emotional_state: ['CONFIDENT'], side: 'Sell', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
      { id: '19', pnl: -30, trade_date: '2023-01-19', emotional_state: ['CONFIDENT'], side: 'Sell', entry_time: '13:00', exit_time: '14:00', strategy_id: '1' },
    ]
  },
  'Sell-Biased': {
    description: 'Emotions with strong sell leaning (more sell trades than buy trades)',
    trades: [
      // FEAR - Strong sell bias (2 buy, 8 sell)
      { id: '20', pnl: -100, trade_date: '2023-01-20', emotional_state: ['FEAR'], side: 'Sell', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '21', pnl: -150, trade_date: '2023-01-21', emotional_state: ['FEAR'], side: 'Sell', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '22', pnl: -80, trade_date: '2023-01-22', emotional_state: ['FEAR'], side: 'Sell', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '23', pnl: -120, trade_date: '2023-01-23', emotional_state: ['FEAR'], side: 'Sell', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      { id: '24', pnl: -90, trade_date: '2023-01-24', emotional_state: ['FEAR'], side: 'Sell', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '25', pnl: -110, trade_date: '2023-01-25', emotional_state: ['FEAR'], side: 'Sell', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '26', pnl: -70, trade_date: '2023-01-26', emotional_state: ['FEAR'], side: 'Sell', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '27', pnl: -130, trade_date: '2023-01-27', emotional_state: ['FEAR'], side: 'Sell', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
      { id: '28', pnl: 50, trade_date: '2023-01-28', emotional_state: ['FEAR'], side: 'Buy', entry_time: '13:00', exit_time: '14:00', strategy_id: '1' },
      { id: '29', pnl: 25, trade_date: '2023-01-29', emotional_state: ['FEAR'], side: 'Buy', entry_time: '13:30', exit_time: '14:30', strategy_id: '1' },
      
      // ANXIOUS - Moderate sell bias (3 buy, 6 sell)
      { id: '30', pnl: -60, trade_date: '2023-01-30', emotional_state: ['ANXIOUS'], side: 'Sell', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '31', pnl: -80, trade_date: '2023-01-31', emotional_state: ['ANXIOUS'], side: 'Sell', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '32', pnl: -70, trade_date: '2023-02-01', emotional_state: ['ANXIOUS'], side: 'Sell', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '33', pnl: -90, trade_date: '2023-02-02', emotional_state: ['ANXIOUS'], side: 'Sell', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      { id: '34', pnl: -50, trade_date: '2023-02-03', emotional_state: ['ANXIOUS'], side: 'Sell', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '35', pnl: -65, trade_date: '2023-02-04', emotional_state: ['ANXIOUS'], side: 'Sell', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '36', pnl: 30, trade_date: '2023-02-05', emotional_state: ['ANXIOUS'], side: 'Buy', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '37', pnl: 20, trade_date: '2023-02-06', emotional_state: ['ANXIOUS'], side: 'Buy', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
      { id: '38', pnl: 40, trade_date: '2023-02-07', emotional_state: ['ANXIOUS'], side: 'Buy', entry_time: '13:00', exit_time: '14:00', strategy_id: '1' },
    ]
  },
  'Balanced': {
    description: 'Emotions with balanced leaning (roughly equal buy/sell trades)',
    trades: [
      // PATIENCE - Balanced (5 buy, 5 sell)
      { id: '39', pnl: 50, trade_date: '2023-02-08', emotional_state: ['PATIENCE'], side: 'Buy', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '40', pnl: 60, trade_date: '2023-02-09', emotional_state: ['PATIENCE'], side: 'Buy', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '41', pnl: -40, trade_date: '2023-02-10', emotional_state: ['PATIENCE'], side: 'Sell', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '42', pnl: 70, trade_date: '2023-02-11', emotional_state: ['PATIENCE'], side: 'Buy', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      { id: '43', pnl: -30, trade_date: '2023-02-12', emotional_state: ['PATIENCE'], side: 'Sell', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '44', pnl: 80, trade_date: '2023-02-13', emotional_state: ['PATIENCE'], side: 'Buy', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '45', pnl: -50, trade_date: '2023-02-14', emotional_state: ['PATIENCE'], side: 'Sell', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '46', pnl: 55, trade_date: '2023-02-15', emotional_state: ['PATIENCE'], side: 'Buy', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
      { id: '47', pnl: -45, trade_date: '2023-02-16', emotional_state: ['PATIENCE'], side: 'Sell', entry_time: '13:00', exit_time: '14:00', strategy_id: '1' },
      { id: '48', pnl: 65, trade_date: '2023-02-17', emotional_state: ['PATIENCE'], side: 'Buy', entry_time: '13:30', exit_time: '14:30', strategy_id: '1' },
      
      // DISCIPLINE - Balanced (4 buy, 4 sell)
      { id: '49', pnl: 100, trade_date: '2023-02-18', emotional_state: ['DISCIPLINE'], side: 'Buy', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '50', pnl: -80, trade_date: '2023-02-19', emotional_state: ['DISCIPLINE'], side: 'Sell', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '51', pnl: 90, trade_date: '2023-02-20', emotional_state: ['DISCIPLINE'], side: 'Buy', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '52', pnl: -70, trade_date: '2023-02-21', emotional_state: ['DISCIPLINE'], side: 'Sell', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      { id: '53', pnl: 110, trade_date: '2023-02-22', emotional_state: ['DISCIPLINE'], side: 'Buy', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '54', pnl: -90, trade_date: '2023-02-23', emotional_state: ['DISCIPLINE'], side: 'Sell', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '55', pnl: 85, trade_date: '2023-02-24', emotional_state: ['DISCIPLINE'], side: 'Buy', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '56', pnl: -75, trade_date: '2023-02-25', emotional_state: ['DISCIPLINE'], side: 'Sell', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
    ]
  },
  'Mixed': {
    description: 'Mixed scenarios with different emotions having different biases',
    trades: [
      // FOMO - Buy biased
      { id: '57', pnl: 100, trade_date: '2023-02-26', emotional_state: ['FOMO'], side: 'Buy', entry_time: '09:00', exit_time: '10:00', strategy_id: '1' },
      { id: '58', pnl: 80, trade_date: '2023-02-27', emotional_state: ['FOMO'], side: 'Buy', entry_time: '09:30', exit_time: '10:30', strategy_id: '1' },
      { id: '59', pnl: 120, trade_date: '2023-02-28', emotional_state: ['FOMO'], side: 'Buy', entry_time: '10:00', exit_time: '11:00', strategy_id: '1' },
      { id: '60', pnl: -50, trade_date: '2023-03-01', emotional_state: ['FOMO'], side: 'Sell', entry_time: '10:30', exit_time: '11:30', strategy_id: '1' },
      
      // REVENGE - Sell biased
      { id: '61', pnl: -100, trade_date: '2023-03-02', emotional_state: ['REVENGE'], side: 'Sell', entry_time: '11:00', exit_time: '12:00', strategy_id: '1' },
      { id: '62', pnl: -120, trade_date: '2023-03-03', emotional_state: ['REVENGE'], side: 'Sell', entry_time: '11:30', exit_time: '12:30', strategy_id: '1' },
      { id: '63', pnl: -80, trade_date: '2023-03-04', emotional_state: ['REVENGE'], side: 'Sell', entry_time: '12:00', exit_time: '13:00', strategy_id: '1' },
      { id: '64', pnl: 40, trade_date: '2023-03-05', emotional_state: ['REVENGE'], side: 'Buy', entry_time: '12:30', exit_time: '13:30', strategy_id: '1' },
      
      // TILT - Balanced
      { id: '65', pnl: 60, trade_date: '2023-03-06', emotional_state: ['TILT'], side: 'Buy', entry_time: '13:00', exit_time: '14:00', strategy_id: '1' },
      { id: '66', pnl: -70, trade_date: '2023-03-07', emotional_state: ['TILT'], side: 'Sell', entry_time: '13:30', exit_time: '14:30', strategy_id: '1' },
      { id: '67', pnl: 50, trade_date: '2023-03-08', emotional_state: ['TILT'], side: 'Buy', entry_time: '14:00', exit_time: '15:00', strategy_id: '1' },
      { id: '68', pnl: -60, trade_date: '2023-03-09', emotional_state: ['TILT'], side: 'Sell', entry_time: '14:30', exit_time: '15:30', strategy_id: '1' },
      
      // OVERRISK - Buy biased
      { id: '69', pnl: 150, trade_date: '2023-03-10', emotional_state: ['OVERRISK'], side: 'Buy', entry_time: '15:00', exit_time: '16:00', strategy_id: '1' },
      { id: '70', pnl: 180, trade_date: '2023-03-11', emotional_state: ['OVERRISK'], side: 'Buy', entry_time: '15:30', exit_time: '16:30', strategy_id: '1' },
      { id: '71', pnl: -100, trade_date: '2023-03-12', emotional_state: ['OVERRISK'], side: 'Sell', entry_time: '16:00', exit_time: '17:00', strategy_id: '1' },
      
      // NEUTRAL - Balanced
      { id: '72', pnl: 40, trade_date: '2023-03-13', emotional_state: ['NEUTRAL'], side: 'Buy', entry_time: '16:30', exit_time: '17:30', strategy_id: '1' },
      { id: '73', pnl: -35, trade_date: '2023-03-14', emotional_state: ['NEUTRAL'], side: 'Sell', entry_time: '17:00', exit_time: '18:00', strategy_id: '1' },
      { id: '74', pnl: 45, trade_date: '2023-03-15', emotional_state: ['NEUTRAL'], side: 'Buy', entry_time: '17:30', exit_time: '18:30', strategy_id: '1' },
      { id: '75', pnl: -40, trade_date: '2023-03-16', emotional_state: ['NEUTRAL'], side: 'Sell', entry_time: '18:00', exit_time: '19:00', strategy_id: '1' },
    ]
  }
};

// Helper function to process emotional state data for radar chart (copied from dashboard)
function getEmotionData(trades: Trade[]): EmotionData[] {
  if (!trades || trades.length === 0) return [];
  
  const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
  
  trades.forEach(trade => {
    // Handle both string and array formats for emotional_state
    let emotions: string[] = [];
    
    if (trade.emotional_state) {
      if (Array.isArray(trade.emotional_state)) {
        emotions = trade.emotional_state;
      } else if (typeof trade.emotional_state === 'string') {
        // Handle string format - could be JSON string or single emotion
        try {
          const parsed = JSON.parse(trade.emotional_state);
          emotions = Array.isArray(parsed) ? parsed : [trade.emotional_state];
        } catch {
          // If parsing fails, treat as single emotion
          emotions = [trade.emotional_state];
        }
      }
    }
    
    // Process each emotion individually - this ensures each emotion gets its own point
    emotions.forEach(emotion => {
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
  });
  
  // Calculate the maximum count to determine dynamic scaling
  const allCounts = Object.values(emotionData).flatMap(counts => [
    counts.buyCount, counts.sellCount, counts.nullCount
  ]);
  const maxCount = Math.max(...allCounts, 1);
  
  // Calculate dynamic fullMark based on the maximum count
  const dynamicFullMark = Math.ceil(maxCount * 1.2); // Add 20% padding
  
  return Object.entries(emotionData).map(([emotion, counts]) => {
    const total = counts.buyCount + counts.sellCount + counts.nullCount;
    
    // Calculate the leaning bias as a percentage difference
    // Positive values indicate buy bias, negative values indicate sell bias
    let leaningValue = 0;
    let leaning = 'Balanced';
    let side = 'NULL';
    
    if (total > 0) {
      // Calculate bias: (buyCount - sellCount) / total * 100
      // This gives us a range from -100 (all sell) to +100 (all buy)
      leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
      
      // Determine leaning direction and side
      if (leaningValue > 15) { // More than 15% buy bias
        leaning = 'Buy Leaning';
        side = 'Buy';
      } else if (leaningValue < -15) { // More than 15% sell bias
        leaning = 'Sell Leaning';
        side = 'Sell';
      } else {
        leaning = 'Balanced';
        side = 'NULL';
      }
    }
    
    return {
      subject: emotion,
      value: Math.abs(leaningValue), // Use the absolute bias value for radar visualization
      fullMark: 100, // Use 100 as fullMark since we're working with percentages
      leaning,
      side,
      leaningValue, // Store the actual leaning value for potential use in tooltips
      totalTrades: total // Store total trades for reference
    };
  });
}

// Function to generate random test data
function generateRandomTestData(): Trade[] {
  const emotions = VALID_EMOTIONS;
  const sides = ['Buy', 'Sell'];
  const numTrades = Math.floor(Math.random() * 50) + 30; // 30-80 trades
  
  const trades: Trade[] = [];
  
  for (let i = 0; i < numTrades; i++) {
    const numEmotions = Math.floor(Math.random() * 2) + 1; // 1-2 emotions per trade
    const selectedEmotions: string[] = [];
    
    for (let j = 0; j < numEmotions; j++) {
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      if (emotion && !selectedEmotions.includes(emotion)) {
        selectedEmotions.push(emotion);
      }
    }
    
    const side = sides[Math.floor(Math.random() * sides.length)];
    const pnl = side === 'Buy'
      ? Math.floor(Math.random() * 300) - 50 // Buy: -50 to 250
      : Math.floor(Math.random() * 100) - 200; // Sell: -200 to -100
    
    trades.push({
      id: `random-${i}`,
      pnl,
      trade_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
      emotional_state: selectedEmotions,
      side: side as 'Buy' | 'Sell' | null,
      entry_time: `${Math.floor(Math.random() * 6) + 9}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      exit_time: `${Math.floor(Math.random() * 6) + 10}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      strategy_id: 'random-strategy'
    });
  }
  
  return trades;
}

export default function TestEmotionRadarVerification() {
  const [currentScenario, setCurrentScenario] = useState<string>('Buy-Biased');
  const [customTrades, setCustomTrades] = useState<Trade[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Get the current trades based on selected scenario or custom data
  const currentTrades = isCustomMode ? customTrades : testScenarios[currentScenario as keyof typeof testScenarios]?.trades || [];
  
  // Process the trades using the actual getEmotionData function
  const emotionData = useMemo(() => getEmotionData(currentTrades), [currentTrades]);
  
  // Handle scenario change
  const handleScenarioChange = (scenario: string) => {
    setCurrentScenario(scenario);
    setIsCustomMode(false);
  };
  
  // Handle generating random test data
  const handleGenerateRandom = () => {
    const randomTrades = generateRandomTestData();
    setCustomTrades(randomTrades);
    setIsCustomMode(true);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gradient">Emotion Radar Verification Test</h1>
          <p className="text-lg text-white/70">
            Comprehensive test to verify the emotion radar chart shows actual leaning based on buy/sell trade distribution
          </p>
        </div>

        {/* Scenario Selection */}
        <div className="glass-enhanced p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Test Scenarios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(testScenarios).map(([name, scenario]) => (
              <button
                key={name}
                onClick={() => handleScenarioChange(name)}
                className={`p-4 rounded-lg border transition-all ${
                  currentScenario === name && !isCustomMode
                    ? 'bg-teal-600/20 border-teal-500/50'
                    : 'bg-black/30 border-white/10 hover:bg-white/5'
                }`}
              >
                <h3 className="font-medium mb-1">{name}</h3>
                <p className="text-sm text-white/70">{scenario.description}</p>
                <p className="text-xs text-white/50 mt-2">{scenario.trades.length} trades</p>
              </button>
            ))}
            
            <button
              onClick={handleGenerateRandom}
              className={`p-4 rounded-lg border transition-all ${
                isCustomMode
                  ? 'bg-purple-600/20 border-purple-500/50'
                  : 'bg-black/30 border-white/10 hover:bg-white/5'
              }`}
            >
              <h3 className="font-medium mb-1 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Random Data
              </h3>
              <p className="text-sm text-white/70">Generate random test data</p>
              <p className="text-xs text-white/50 mt-2">
                {isCustomMode ? `${customTrades.length} trades` : 'Click to generate'}
              </p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Processed Data Table */}
          <div className="glass-enhanced p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Processed Emotion Data
            </h2>
            
            {emotionData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-2">Emotion</th>
                      <th className="text-center py-2 px-2">Leaning</th>
                      <th className="text-center py-2 px-2">Value</th>
                      <th className="text-center py-2 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emotionData.map((emotion, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="py-2 px-2 font-medium">{emotion.subject}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            emotion.side === 'Buy' ? 'bg-green-500/20 text-green-300' :
                            emotion.side === 'Sell' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {emotion.side === 'Buy' && <TrendingUp className="w-3 h-3" />}
                            {emotion.side === 'Sell' && <TrendingDown className="w-3 h-3" />}
                            {emotion.side === 'NULL' && <Minus className="w-3 h-3" />}
                            {emotion.leaning}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          <span className={
                            emotion.leaningValue > 15 ? 'text-green-400' :
                            emotion.leaningValue < -15 ? 'text-red-400' :
                            'text-gray-400'
                          }>
                            {emotion.leaningValue > 0 ? '+' : ''}{emotion.leaningValue.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">{emotion.totalTrades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No emotion data to display</p>
              </div>
            )}
          </div>

          {/* EmotionRadar Display */}
          <div className="glass-enhanced p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Emotion Radar Visualization
            </h2>
            
            <div className="relative h-80">
              <EmotionRadar data={emotionData} />
            </div>
          </div>
        </div>

        {/* Raw Trade Data */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Raw Trade Data ({currentTrades.length} trades)
          </h2>
          
          {currentTrades.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-black/50 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Emotion(s)</th>
                    <th className="text-center py-2 px-2">Side</th>
                    <th className="text-right py-2 px-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-white/5">
                      <td className="py-2 px-2 font-mono text-xs">{trade.id}</td>
                      <td className="py-2 px-2">{trade.trade_date}</td>
                      <td className="py-2 px-2">
                        {formatEmotionsAsBoxes(trade.emotional_state)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.side === 'Buy' ? 'bg-green-500/20 text-green-300' :
                          trade.side === 'Sell' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className={`py-2 px-2 text-right font-mono ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}{trade.pnl || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-white/50">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No trade data to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}