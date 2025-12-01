'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Test dynamic import exactly like in dashboard
const EmotionRadar = dynamic(() => import('@/components/ui/EmotionRadar'), {
  loading: () => <div className="h-64 lg:h-80 flex items-center justify-center text-white/70"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>,
  ssr: false
});

export default function TestEmotionRadarDynamic() {
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [componentLoaded, setComponentLoaded] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  useEffect(() => {
    addLog('Test page loaded');
    
    // Test if the dynamic import works
    import('@/components/ui/EmotionRadar')
      .then(module => {
        addLog('✅ Dynamic import successful');
        addLog(`Module exports: ${Object.keys(module)}`);
        setComponentLoaded(true);
      })
      .catch(err => {
        addLog(`❌ Dynamic import failed: ${err.message}`);
        setError(`Dynamic import failed: ${err.message}`);
      });
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Dynamic EmotionRadar Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Import Status:</h2>
        <div className={`p-4 rounded-lg ${componentLoaded ? 'bg-green-900' : 'bg-yellow-900'}`}>
          <p className={componentLoaded ? 'text-green-200' : 'text-yellow-200'}>
            {componentLoaded ? '✅ Component loaded successfully' : '⏳ Loading component...'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900 border border-red-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error Detected:</h2>
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Data:</h2>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dynamic EmotionRadar Component:</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <EmotionRadar data={testData} />
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