'use client';

import React, { useState } from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { Brain, AlertTriangle, TestTube, CheckCircle, XCircle } from 'lucide-react';

// Test data for edge cases
const testCases = [
  {
    name: 'Empty Data Array',
    description: 'Tests component with empty data array',
    data: [],
    shouldRender: false,
    expectedBehavior: 'Should show "No emotional data available" message'
  },
  {
    name: 'Null Data',
    description: 'Tests component with null data',
    data: null,
    shouldRender: false,
    expectedBehavior: 'Should show "No emotional data available" message'
  },
  {
    name: 'Valid Normal Data',
    description: 'Tests component with normal valid data',
    data: [
      { subject: 'FOMO', value: 25, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 10 },
      { subject: 'REVENGE', value: 15, fullMark: 100, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -15, totalTrades: 8 },
      { subject: 'PATIENCE', value: 5, fullMark: 100, leaning: 'Balanced', side: 'NULL', leaningValue: 5, totalTrades: 6 }
    ],
    shouldRender: true,
    expectedBehavior: 'Should render normal radar chart'
  },
  {
    name: 'Extreme Values',
    description: 'Tests component with extreme leaning values (>100 and <-100)',
    data: [
      { subject: 'EXTREME_BUY', value: 150, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 150, totalTrades: 20 },
      { subject: 'EXTREME_SELL', value: -200, fullMark: 100, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -200, totalTrades: 15 },
      { subject: 'ZERO_VALUE', value: 0, fullMark: 100, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 0 }
    ],
    shouldRender: true,
    expectedBehavior: 'Should clamp values to 0-100 range and -100 to 100 for leaningValue'
  },
  {
    name: 'Malformed Data Structures',
    description: 'Tests component with malformed data objects',
    data: [
      null,
      undefined,
      { subject: '', value: 25, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 10 },
      { subject: 'FOMO', value: null, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 10 },
      { subject: 'REVENGE', value: 'invalid', fullMark: 100, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -15, totalTrades: 8 },
      { subject: 123, value: 15, fullMark: 100, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -15, totalTrades: 8 },
      { subject: 'INVALID_EMOTION', value: 25, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 10 }
    ],
    shouldRender: false,
    expectedBehavior: 'Should filter out invalid items and show "No valid emotional data available"'
  },
  {
    name: 'Missing Required Fields',
    description: 'Tests component with data missing required fields',
    data: [
      { subject: 'FOMO' }, // Missing value
      { value: 25 }, // Missing subject
      { subject: 'REVENGE', value: 25 }, // Missing leaning, side, etc.
      { subject: 'PATIENCE', value: 25, leaning: null, side: undefined, leaningValue: NaN, totalTrades: -5 }
    ],
    shouldRender: true,
    expectedBehavior: 'Should handle missing fields with defaults and safe values'
  },
  {
    name: 'Special Characters and Whitespace',
    description: 'Tests component with special characters and whitespace',
    data: [
      { subject: '  FOMO  ', value: 25, fullMark: 100, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 10 },
      { subject: '\tREVENGE\n', value: 15, fullMark: 100, leaning: 'Sell Leaning', side: 'Sell', leaningValue: -15, totalTrades: 8 },
      { subject: 'PATIENCE@#$', value: 5, fullMark: 100, leaning: 'Balanced', side: 'NULL', leaningValue: 5, totalTrades: 6 }
    ],
    shouldRender: true,
    expectedBehavior: 'Should trim whitespace and handle special characters'
  }
];

export default function EmotionRadarEdgeCaseTest() {
  const [selectedTest, setSelectedTest] = useState(0);
  const [testResults, setTestResults] = useState<Record<number, 'pass' | 'fail' | 'pending'>>({});

  const currentTest = testCases[selectedTest] || testCases[0];

  const runTest = (testIndex: number) => {
    const test = testCases[testIndex];
    
    try {
      // Simulate the validation logic from EmotionRadar component
      const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
      
      if (!test || !test.data || (Array.isArray(test.data) && test.data.length === 0)) {
        // This should show empty state
        setTestResults(prev => ({ ...prev, [testIndex]: 'pass' }));
        return;
      }
      
      if (Array.isArray(test.data)) {
        const filteredData = test.data.filter(item => {
          try {
            if (!item || typeof item !== 'object') {
              return false;
            }
            
            if (typeof item.subject !== 'string' || !item.subject.trim()) {
              return false;
            }
            
            const normalizedSubject = item.subject.toUpperCase().trim();
            if (!VALID_EMOTIONS.includes(normalizedSubject)) {
              return false;
            }
            
            if (typeof item.value !== 'number' || !isFinite(item.value)) {
              return false;
            }
            
            if (item.value < 0 || item.value > 1000) {
              return false;
            }
            
            return true;
          } catch (error) {
            return false;
          }
        });
        
        // Test passes if component should render and has valid data, or shouldn't render and has no valid data
        const hasValidData = filteredData.length > 0;
        const testPassed = test.shouldRender === hasValidData;
        
        setTestResults(prev => ({ ...prev, [testIndex]: testPassed ? 'pass' : 'fail' }));
      }
    } catch (error) {
      console.error('Test execution error:', error);
      setTestResults(prev => ({ ...prev, [testIndex]: 'fail' }));
    }
  };

  const runAllTests = () => {
    testCases.forEach((_, index) => {
      setTimeout(() => runTest(index), index * 100); // Stagger test execution
    });
  };

  const getTestIcon = (result: 'pass' | 'fail' | 'pending') => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <TestTube className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-orange-400" />
        <h1 className="text-3xl font-bold text-white">Emotion Radar Edge Case Testing</h1>
      </div>

      <div className="glass p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Test Cases</h2>
          <button
            onClick={runAllTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run All Tests
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Cases List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white mb-4">Select Test Case</h3>
            {testCases.map((test, index) => (
              <div
                key={index}
                onClick={() => setSelectedTest(index)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTest === index
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{test.name}</h4>
                    <p className="text-sm text-white/70 mt-1">{test.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTestIcon(testResults[index] || 'pending')}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        runTest(index);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Run Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Details and Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Test Details</h3>
            
            <div className="glass p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">{currentTest?.name}</h4>
              <p className="text-sm text-white/70 mb-3">{currentTest?.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Expected Behavior:</span>
                  <span className="text-white/80">{currentTest?.expectedBehavior}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Should Render:</span>
                  <span className={currentTest?.shouldRender ? 'text-green-400' : 'text-red-400'}>
                    {currentTest?.shouldRender ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Test Result:</span>
                  <span className="flex items-center gap-2">
                    {getTestIcon(testResults[selectedTest] || 'pending')}
                    <span className={
                      testResults[selectedTest] === 'pass' ? 'text-green-400' :
                      testResults[selectedTest] === 'fail' ? 'text-red-400' :
                      'text-gray-400'
                    }>
                      {testResults[selectedTest] || 'pending'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="glass p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Test Data</h4>
              <pre className="text-xs text-white/70 bg-black/30 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(currentTest?.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Component Preview */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Component Preview</h2>
        <div className="border border-white/10 rounded-lg p-4">
          <EmotionRadar data={currentTest?.data as any} />
        </div>
      </div>

      {/* Test Summary */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Test Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {Object.values(testResults).filter(r => r === 'pass').length}
            </div>
            <div className="text-sm text-white/70">Passed</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">
              {Object.values(testResults).filter(r => r === 'fail').length}
            </div>
            <div className="text-sm text-white/70">Failed</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">
              {Object.values(testResults).filter(r => r === 'pending').length}
            </div>
            <div className="text-sm text-white/70">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}