'use client';

import React, { useState } from 'react';
import PerformanceTrendChart from '@/components/ui/PerformanceTrendChart';

export default function TestChartDebug() {
  const [testData, setTestData] = useState([
    { date: 'Day 1', pnl: 100, cumulative: 100 },
    { date: 'Day 2', pnl: -50, cumulative: 50 },
    { date: 'Day 3', pnl: 200, cumulative: 250 }
  ]);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Chart Debug Test</h1>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Test Data:</h2>
        <pre className="text-green-400 text-sm">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">PerformanceTrendChart:</h2>
        <PerformanceTrendChart data={testData} height={300} />
      </div>
    </div>
  );
}