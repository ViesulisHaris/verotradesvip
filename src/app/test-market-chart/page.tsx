'use client';

import React, { useState } from 'react';
import MarketDistributionChart from '@/components/ui/MarketDistributionChart';

export default function TestMarketChart() {
  const [dataSet, setDataSet] = useState(0);

  const dataSets = [
    // Normal distribution
    [
      { market: 'Stock', count: 45, percentage: 45 },
      { market: 'Crypto', count: 30, percentage: 30 },
      { market: 'Forex', count: 15, percentage: 15 },
      { market: 'Futures', count: 10, percentage: 10 }
    ],
    // Skewed distribution (one dominant)
    [
      { market: 'Stock', count: 80, percentage: 80 },
      { market: 'Crypto', count: 12, percentage: 12 },
      { market: 'Forex', count: 5, percentage: 5 },
      { market: 'Futures', count: 3, percentage: 3 }
    ],
    // Even distribution
    [
      { market: 'Stock', count: 25, percentage: 25 },
      { market: 'Crypto', count: 25, percentage: 25 },
      { market: 'Forex', count: 25, percentage: 25 },
      { market: 'Futures', count: 25, percentage: 25 }
    ],
    // Many small segments
    [
      { market: 'Stock', count: 35, percentage: 35 },
      { market: 'Crypto', count: 25, percentage: 25 },
      { market: 'Forex', count: 15, percentage: 15 },
      { market: 'Futures', count: 10, percentage: 10 },
      { market: 'Options', count: 8, percentage: 8 },
      { market: 'Other', count: 7, percentage: 7 }
    ],
    // Two segments only
    [
      { market: 'Stock', count: 65, percentage: 65 },
      { market: 'Crypto', count: 35, percentage: 35 }
    ]
  ];

  const currentData = dataSets[dataSet];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">Market Distribution Chart Test</h1>
        
        <div className="glass-enhanced p-6 rounded-xl">
          <div className="flex flex-wrap gap-4 mb-8">
            {dataSets.map((_, index) => (
              <button
                key={index}
                onClick={() => setDataSet(index)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dataSet === index
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Data Set {index + 1}
              </button>
            ))}
          </div>
          
          <div className="mb-6 p-4 bg-black/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Current Data Distribution:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {currentData.map((item) => (
                <div key={item.market} className="text-center">
                  <div className="text-sm text-white/70">{item.market}</div>
                  <div className="text-lg font-bold text-white">{item.count}</div>
                  <div className="text-sm text-blue-400">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Standard Size (300px)</h3>
              <MarketDistributionChart data={currentData} height={300} />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Large Size (400px)</h3>
              <MarketDistributionChart data={currentData} height={400} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}