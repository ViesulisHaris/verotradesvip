'use client';

import React, { useState } from 'react';
import PerformanceTrendChart from '@/components/ui/PerformanceTrendChart';

export default function TestEnhancedChart() {
  const [dataSet, setDataSet] = useState('default');

  // Different data scenarios for testing
  const dataScenarios = {
    default: [
      { date: 'Jan 1', pnl: 100, cumulative: 100 },
      { date: 'Jan 2', pnl: -50, cumulative: 50 },
      { date: 'Jan 3', pnl: 200, cumulative: 250 },
      { date: 'Jan 4', pnl: 150, cumulative: 400 },
      { date: 'Jan 5', pnl: -100, cumulative: 300 },
      { date: 'Jan 6', pnl: 300, cumulative: 600 },
      { date: 'Jan 7', pnl: 250, cumulative: 850 },
      { date: 'Jan 8', pnl: -200, cumulative: 650 },
      { date: 'Jan 9', pnl: 400, cumulative: 1050 },
      { date: 'Jan 10', pnl: 350, cumulative: 1400 }
    ],
    increasing: [
      { date: 'Day 1', pnl: 50, cumulative: 50 },
      { date: 'Day 2', pnl: 100, cumulative: 150 },
      { date: 'Day 3', pnl: 150, cumulative: 300 },
      { date: 'Day 4', pnl: 200, cumulative: 500 },
      { date: 'Day 5', pnl: 250, cumulative: 750 },
      { date: 'Day 6', pnl: 300, cumulative: 1050 },
      { date: 'Day 7', pnl: 350, cumulative: 1400 },
      { date: 'Day 8', pnl: 400, cumulative: 1800 }
    ],
    decreasing: [
      { date: 'Day 1', pnl: -50, cumulative: -50 },
      { date: 'Day 2', pnl: -100, cumulative: -150 },
      { date: 'Day 3', pnl: -75, cumulative: -225 },
      { date: 'Day 4', pnl: -125, cumulative: -350 },
      { date: 'Day 5', pnl: -80, cumulative: -430 },
      { date: 'Day 6', pnl: -150, cumulative: -580 },
      { date: 'Day 7', pnl: -90, cumulative: -670 },
      { date: 'Day 8', pnl: -200, cumulative: -870 }
    ],
    volatile: [
      { date: 'Mon', pnl: 500, cumulative: 500 },
      { date: 'Tue', pnl: -800, cumulative: -300 },
      { date: 'Wed', pnl: 1200, cumulative: 900 },
      { date: 'Thu', pnl: -1500, cumulative: -600 },
      { date: 'Fri', pnl: 2000, cumulative: 1400 },
      { date: 'Sat', pnl: -1000, cumulative: 400 },
      { date: 'Sun', pnl: 1800, cumulative: 2200 }
    ],
    flat: [
      { date: 'Week 1', pnl: 10, cumulative: 10 },
      { date: 'Week 2', pnl: -5, cumulative: 5 },
      { date: 'Week 3', pnl: 15, cumulative: 20 },
      { date: 'Week 4', pnl: -10, cumulative: 10 },
      { date: 'Week 5', pnl: 20, cumulative: 30 },
      { date: 'Week 6', pnl: -15, cumulative: 15 }
    ],
    large: Array.from({ length: 50 }, (_, i) => ({
      date: `Day ${i + 1}`,
      pnl: Math.random() * 1000 - 500,
      cumulative: (Math.random() - 0.5) * (i + 1) * 200
    }))
  };

  const currentData = dataScenarios[dataSet as keyof typeof dataScenarios];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Enhanced Performance Trend Chart Test</h1>
          <p className="text-gray-300 mb-8">Test the visual enhancements with different data scenarios</p>
        </div>

        {/* Data Scenario Selector */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Data Scenario</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.keys(dataScenarios).map((scenario) => (
              <button
                key={scenario}
                onClick={() => setDataSet(scenario)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dataSet === scenario
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Test - Different Sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Small Chart */}
          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Small Chart (200px)</h3>
            <PerformanceTrendChart data={currentData} height={200} />
          </div>

          {/* Medium Chart */}
          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Medium Chart (300px)</h3>
            <PerformanceTrendChart data={currentData} height={300} />
          </div>

          {/* Large Chart */}
          <div className="glass-enhanced p-6 rounded-xl lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Large Chart (400px)</h3>
            <PerformanceTrendChart data={currentData} height={400} />
          </div>
        </div>

        {/* Responsive Test */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Responsive Test (Full Width)</h3>
          <PerformanceTrendChart data={currentData} height={350} />
        </div>

        {/* Empty State Test */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Empty State Test</h3>
          <PerformanceTrendChart data={[]} height={300} />
        </div>
      </div>
    </div>
  );
}