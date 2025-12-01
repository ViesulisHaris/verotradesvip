'use client';

import React from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import DominantEmotionCard from '@/components/ui/DominantEmotionCard';
import SharpeRatioGauge from '@/components/ui/SharpeRatioGauge';
import EmotionRadar from '@/components/ui/EmotionRadar';
import PnLChart from '@/components/ui/FixedPnLChart';
import VRatingCard from '@/components/ui/VRatingCard';

export default function TestVisualEnhancements() {
  console.log('🔍 [TEST_DEBUG] TestVisualEnhancements page rendering...');

  // Sample data for testing components without authentication/data dependencies
  const sampleEmotionData = [
    { subject: 'FOMO', value: 30, fullMark: 50, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 5 },
    { subject: 'PATIENCE', value: 25, fullMark: 50, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 4 },
    { subject: 'DISCIPLINE', value: 20, fullMark: 50, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 3 },
    { subject: 'CONFIDENT', value: 15, fullMark: 50, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 2 }
  ];

  const samplePnLData = [
    { date: 'Day 1', pnl: 100, cumulative: 100 },
    { date: 'Day 2', pnl: -50, cumulative: 50 },
    { date: 'Day 3', pnl: 150, cumulative: 200 },
    { date: 'Day 4', pnl: 75, cumulative: 275 },
    { date: 'Day 5', pnl: -25, cumulative: 250 }
  ];

  const sampleEmotionData2 = {
    'FOMO': 5,
    'PATIENCE': 4,
    'DISCIPLINE': 3,
    'CONFIDENT': 2
  };

  const sampleVRatingData = {
    overallScore: 7.5,
    categories: {
      profitability: {
        name: 'Profitability',
        score: 8.0,
        weight: 30,
        contribution: 2.4,
        keyMetrics: ['Win Rate', 'P&L', 'Profit Factor'],
        icon: () => null
      },
      riskManagement: {
        name: 'Risk Management',
        score: 7.0,
        weight: 25,
        contribution: 1.75,
        keyMetrics: ['Drawdown', 'Position Size', 'Stop Loss'],
        icon: () => null
      },
      consistency: {
        name: 'Consistency',
        score: 7.5,
        weight: 20,
        contribution: 1.5,
        keyMetrics: ['Steady P&L', 'Regular Trading', 'Low Variance'],
        icon: () => null
      },
      emotionalDiscipline: {
        name: 'Emotional Discipline',
        score: 8.0,
        weight: 15,
        contribution: 1.2,
        keyMetrics: ['Positive Emotions', 'Emotional Control', 'Mindfulness'],
        icon: () => null
      },
      journalingAdherence: {
        name: 'Journaling Adherence',
        score: 6.0,
        weight: 10,
        contribution: 0.6,
        keyMetrics: ['Complete Notes', 'Regular Updates', 'Strategy Tracking'],
        icon: () => null
      }
    },
    adjustments: [],
    calculatedAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Visual Enhancements Test</h1>
        <p className="text-slate-400">Testing all enhanced components with sample data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total PnL"
          value="$1,250"
          profitability="good"
        />
        <DashboardCard
          title="Winrate"
          value="65%"
          profitability="good"
        />
        <DashboardCard
          title="Profit Factor"
          value="2.5"
          profitability="good"
        />
        <DashboardCard
          title="Total Trades"
          value="14"
          profitability="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <VRatingCard vRatingData={sampleVRatingData} />
        <SharpeRatioGauge sharpeRatio={1.8} />
        <DominantEmotionCard
          emotion="FOMO"
          emotionData={sampleEmotionData2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-lg rounded-xl border border-slate-700/50 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Emotional Patterns</h3>
          <EmotionRadar data={sampleEmotionData} />
        </div>
        
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-lg rounded-xl border border-slate-700/50 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">P&L Performance</h3>
          <PnLChart data={samplePnLData} />
        </div>
      </div>
    </div>
  );
}