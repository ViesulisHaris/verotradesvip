'use client';

import React, { useEffect, useState } from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';

export default function DebugEmotionRadar() {
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog('Debug page loaded');
  }, []);

  // Test data that should work
  const testData = [
    { subject: 'FOMO', value: 80, fullMark: 100, leaning: 'Buy', side: 'Buy' },
    { subject: 'REVENGE', value: 60, fullMark: 100, leaning: 'Sell', side: 'Sell' },
    { subject: 'TILT', value: 40, fullMark: 100, leaning: 'Balanced', side: 'NULL' },
    { subject: 'OVERRISK', value: 70, fullMark: 100, leaning: 'Buy', side: 'Buy' },
    { subject: 'PATIENCE', value: 90, fullMark: 100, leaning: 'Balanced', side: 'NULL' },
    { subject: 'REGRET', value: 30, fullMark: 100, leaning: 'Sell', side: 'Sell' },
    { subject: 'DISCIPLINE', value: 85, fullMark: 100, leaning: 'Balanced', side: 'NULL' }
  ];

  const handleEmotionRadarError = (error: Error) => {
    addLog(`EmotionRadar Error: ${error.message}`);
    addLog(`Error Stack: ${error.stack}`);
    setError(error.message);
  };

  const handleEmotionRadarLoad = () => {
    addLog('EmotionRadar loaded successfully');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">EmotionRadar Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Data:</h2>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900 border border-red-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error Detected:</h2>
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">EmotionRadar Component:</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <React.Suspense fallback={<div>Loading EmotionRadar...</div>}>
            <EmotionRadar data={testData} />
          </React.Suspense>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Debug Logs:</h2>
        <div className="bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-2 font-mono text-sm">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Empty Data Test:</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <EmotionRadar data={[]} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Null Data Test:</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <EmotionRadar data={null as any} />
        </div>
      </div>
    </div>
  );
}