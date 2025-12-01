'use client';

import React from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';

export default function TestEmotionRadarInvalid() {
  const testData: any[] = [
    {
      "subject": "INVALID_EMOTION",
      "value": 50,
      "fullMark": 100,
      "leaning": "Buy",
      "side": "Buy"
    },
    {
      "subject": "FOMO",
      "value": "invalid",
      "fullMark": 100,
      "leaning": "Sell",
      "side": "Sell"
    },
    {
      "subject": "TILT",
      "value": null,
      "fullMark": 100,
      "leaning": "Balanced",
      "side": "NULL"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">EmotionRadar Test - Invalid Data</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">EmotionRadar Component</h2>
            <EmotionRadar data={testData} />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Data</h2>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
