'use client';

import React, { useState } from 'react';
import MarketDistributionChart from '@/components/ui/MarketDistributionChart';
import PerformanceTrendChart from '@/components/ui/PerformanceTrendChart';

export default function TestGlowEffect() {
  const [selectedDataSet, setSelectedDataSet] = useState('default');

  const dataSets = {
    default: [
      { market: 'Stock', count: 45, percentage: 45 },
      { market: 'Crypto', count: 30, percentage: 30 },
      { market: 'Forex', count: 15, percentage: 15 },
      { market: 'Futures', count: 10, percentage: 10 }
    ],
    allMarkets: [
      { market: 'Stock', count: 35, percentage: 35 },
      { market: 'Crypto', count: 25, percentage: 25 },
      { market: 'Forex', count: 20, percentage: 20 },
      { market: 'Futures', count: 10, percentage: 10 },
      { market: 'Options', count: 7, percentage: 7 },
      { market: 'Other', count: 3, percentage: 3 }
    ],
    twoMarkets: [
      { market: 'Stock', count: 75, percentage: 75 },
      { market: 'Crypto', count: 25, percentage: 25 }
    ],
    manySmallSegments: [
      { market: 'Stock', count: 20, percentage: 20 },
      { market: 'Crypto', count: 18, percentage: 18 },
      { market: 'Forex', count: 15, percentage: 15 },
      { market: 'Futures', count: 12, percentage: 12 },
      { market: 'Options', count: 10, percentage: 10 },
      { market: 'Other', count: 8, percentage: 8 },
      { market: 'Bonds', count: 7, percentage: 7 },
      { market: 'Commodities', count: 5, percentage: 5 },
      { market: 'ETFs', count: 3, percentage: 3 },
      { market: 'Metals', count: 2, percentage: 2 }
    ],
    empty: []
  };

  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    pnl: Math.random() * 1000 - 500,
    cumulative: (Math.random() - 0.5) * (i + 1) * 100
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Glow Effect Test - Market Distribution vs Performance Trend</h1>
        
        <div className="mb-8 text-center">
          <label className="text-sm font-medium mb-2 block">Select Data Set:</label>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.keys(dataSets).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDataSet(key)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedDataSet === key
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-center">Market Distribution Chart (with Glow)</h2>
            <MarketDistributionChart data={dataSets[selectedDataSet as keyof typeof dataSets]} height={350} />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-center">Performance Trend Chart (Reference Glow)</h2>
            <PerformanceTrendChart data={performanceData} height={350} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3 text-center">Small Chart (200px)</h3>
            <MarketDistributionChart data={dataSets[selectedDataSet as keyof typeof dataSets]} height={200} />
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3 text-center">Medium Chart (300px)</h3>
            <MarketDistributionChart data={dataSets[selectedDataSet as keyof typeof dataSets]} height={300} />
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3 text-center">Large Chart (400px)</h3>
            <MarketDistributionChart data={dataSets[selectedDataSet as keyof typeof dataSets]} height={400} />
          </div>
        </div>

        <div className="mt-8 bg-gray-800 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Glow Effect Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-2 text-teal-400">Expected Glow Effects:</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Stock segments: Blue glow</li>
                <li>• Crypto segments: Green glow</li>
                <li>• Forex segments: Amber glow</li>
                <li>• Futures segments: Red glow</li>
                <li>• Options segments: Purple glow</li>
                <li>• Other segments: Gray glow</li>
                <li>• Default segments: Teal glow (matching performance chart)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2 text-teal-400">Visual Consistency Checks:</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>✓ Glow intensity matches performance chart</li>
                <li>✓ Hover effects maintain glow consistency</li>
                <li>✓ Legend items have subtle glow effect</li>
                <li>✓ Glass morphism styling preserved</li>
                <li>✓ Responsive design maintained</li>
                <li>✓ Animation effects preserved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}