'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Test different import methods
const EmotionRadarDynamic = dynamic(() => import('@/components/ui/EmotionRadar'), {
  loading: () => <div className="h-64 lg:h-80 flex items-center justify-center text-white/70"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>,
  ssr: false
});

export default function TestEmotionRadarComprehensive() {
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      addLog(`🧪 Running test: ${testName}`);
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: true }));
      addLog(`✅ Test passed: ${testName}`);
    } catch (err) {
      const error = err as Error;
      setTestResults(prev => ({ ...prev, [testName]: false }));
      addLog(`❌ Test failed: ${testName} - ${error.message}`);
      setError(`${testName} failed: ${error.message}`);
    }
  };

  useEffect(() => {
    addLog('🚀 Comprehensive test page loaded');
    
    // Run all tests
    const runAllTests = async () => {
      await runTest('Import Check', async () => {
        const module = await import('@/components/ui/EmotionRadar');
        if (!module.default) {
          throw new Error('Default export not found');
        }
        addLog(`Module exports: ${Object.keys(module)}`);
      });

      await runTest('Recharts Import Check', async () => {
        const recharts = await import('recharts');
        const requiredComponents = ['ResponsiveContainer', 'RadarChart', 'PolarGrid', 'PolarAngleAxis', 'Radar', 'PolarRadiusAxis'];
        for (const component of requiredComponents) {
          if (!(recharts as any)[component]) {
            throw new Error(`Missing Recharts component: ${component}`);
          }
        }
        addLog(`Recharts components available: ${requiredComponents.join(', ')}`);
      });

      await runTest('Data Structure Validation', async () => {
        const testData = [
          { subject: 'FOMO', value: 80, fullMark: 100, leaning: 'Buy', side: 'Buy' },
          { subject: 'REVENGE', value: 60, fullMark: 100, leaning: 'Sell', side: 'Sell' }
        ];
        
        // Validate data structure
        testData.forEach((item, index) => {
          const required = ['subject', 'value', 'fullMark', 'leaning', 'side'];
          const missing = required.filter(prop => !(prop in item));
          if (missing.length > 0) {
            throw new Error(`Item ${index} missing properties: ${missing.join(', ')}`);
          }
        });
        
        addLog('✅ Data structure validation passed');
      });
    };

    runAllTests();
  }, []);

  // Test data scenarios
  const testScenarios = {
    valid: [
      { subject: 'FOMO', value: 80, fullMark: 100, leaning: 'Buy', side: 'Buy' },
      { subject: 'REVENGE', value: 60, fullMark: 100, leaning: 'Sell', side: 'Sell' },
      { subject: 'TILT', value: 40, fullMark: 100, leaning: 'Balanced', side: 'NULL' },
      { subject: 'OVERRISK', value: 70, fullMark: 100, leaning: 'Buy', side: 'Buy' },
      { subject: 'PATIENCE', value: 90, fullMark: 100, leaning: 'Balanced', side: 'NULL' },
      { subject: 'REGRET', value: 30, fullMark: 100, leaning: 'Sell', side: 'Sell' },
      { subject: 'DISCIPLINE', value: 85, fullMark: 100, leaning: 'Balanced', side: 'NULL' }
    ],
    empty: [],
    null: null as any,
    invalid: [
      { subject: 'INVALID_EMOTION', value: 50, fullMark: 100, leaning: 'Buy', side: 'Buy' }
    ],
    malformed: [
      { subject: 'FOMO' }, // Missing required properties
      { value: 50, fullMark: 100, leaning: 'Buy', side: 'Buy' } // Missing subject
    ] as any
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Comprehensive EmotionRadar Test</h1>
      
      {/* Test Results Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(testResults).map(([testName, passed]) => (
            <div key={testName} className={`p-4 rounded-lg ${passed ? 'bg-green-900' : 'bg-red-900'}`}>
              <p className={passed ? 'text-green-200' : 'text-red-200'}>
                {passed ? '✅' : '❌'} {testName}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900 border border-red-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error Detected:</h2>
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Debug Logs */}
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

      {/* Test Scenarios */}
      <div className="space-y-8">
        <h2 className="text-xl font-semibold">Test Scenarios:</h2>
        
        {Object.entries(testScenarios).map(([scenarioName, data]) => (
          <div key={scenarioName} className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {scenarioName} Data {data === null ? '(null)' : data.length === 0 ? '(empty array)' : `(${data.length} items)`}
            </h3>
            
            {data && data.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Data Preview:</h4>
                <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(data.slice(0, 2), null, 2)}
                  {data.length > 2 && '\n...'}
                </pre>
              </div>
            )}
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <Suspense fallback={<div className="text-white/70">Loading EmotionRadar...</div>}>
                <EmotionRadarDynamic data={data} />
              </Suspense>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Test Section */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Manual Test:</h2>
        <p className="text-gray-300 mb-4">
          Check the browser console for any runtime errors when interacting with the components above.
          Look for:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>JavaScript errors in console</li>
          <li>Missing gradient definitions</li>
          <li>Recharts rendering issues</li>
          <li>Component mounting/unmounting errors</li>
          <li>Data processing errors</li>
        </ul>
      </div>
    </div>
  );
}