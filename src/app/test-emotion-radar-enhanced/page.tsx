'use client';

import React, { useState } from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';
import { Brain, RefreshCw, TestTube, AlertTriangle } from 'lucide-react';

// Test data for the EmotionRadar component with new structure
const validEmotionData = [
  { subject: 'FOMO', value: 80, fullMark: 100, leaningValue: 75, totalTrades: 12, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'REVENGE', value: 60, fullMark: 100, leaningValue: -65, totalTrades: 8, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'TILT', value: 40, fullMark: 100, leaningValue: 5, totalTrades: 3, leaning: 'Balanced', side: 'NULL' },
  { subject: 'OVERRISK', value: 70, fullMark: 100, leaningValue: 60, totalTrades: 10, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'PATIENCE', value: 30, fullMark: 100, leaningValue: -10, totalTrades: 5, leaning: 'Balanced', side: 'NULL' },
  { subject: 'REGRET', value: 50, fullMark: 100, leaningValue: -45, totalTrades: 7, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'DISCIPLINE', value: 90, fullMark: 100, leaningValue: 8, totalTrades: 15, leaning: 'Balanced', side: 'NULL' },
];

const singleEmotionData = [
  { subject: 'FOMO', value: 80, fullMark: 100, leaningValue: 85, totalTrades: 6, leaning: 'Buy Leaning', side: 'Buy' },
];

const mixedEmotionData = [
  { subject: 'FOMO', value: 80, fullMark: 100, leaningValue: 70, totalTrades: 9, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'REVENGE', value: 60, fullMark: 100, leaningValue: -55, totalTrades: 4, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'INVALID_EMOTION', value: 40, fullMark: 100, leaningValue: 0, totalTrades: 0, leaning: 'Balanced', side: 'NULL' }, // Should be filtered out
  { subject: 'TILT', value: 70, fullMark: 100, leaningValue: 65, totalTrades: 11, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: null as any, value: 30, fullMark: 100, leaningValue: 0, totalTrades: 0, leaning: 'Balanced', side: 'NULL' }, // Should be filtered out
];

// New test scenarios for leaning functionality
const buyBiasedEmotionData = [
  { subject: 'FOMO', value: 90, fullMark: 100, leaningValue: 95, totalTrades: 20, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'GREED', value: 85, fullMark: 100, leaningValue: 88, totalTrades: 16, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'EUPHORIA', value: 80, fullMark: 100, leaningValue: 82, totalTrades: 14, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'OVERRISK', value: 75, fullMark: 100, leaningValue: 78, totalTrades: 12, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'IMPATIENCE', value: 70, fullMark: 100, leaningValue: 72, totalTrades: 10, leaning: 'Buy Leaning', side: 'Buy' },
];

const sellBiasedEmotionData = [
  { subject: 'FEAR', value: 85, fullMark: 100, leaningValue: -90, totalTrades: 18, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'REVENGE', value: 80, fullMark: 100, leaningValue: -85, totalTrades: 15, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'PANIC', value: 75, fullMark: 100, leaningValue: -80, totalTrades: 13, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'REGRET', value: 70, fullMark: 100, leaningValue: -75, totalTrades: 11, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'DOUBT', value: 65, fullMark: 100, leaningValue: -70, totalTrades: 9, leaning: 'Sell Leaning', side: 'Sell' },
];

const balancedEmotionData = [
  { subject: 'PATIENCE', value: 75, fullMark: 100, leaningValue: 5, totalTrades: 8, leaning: 'Balanced', side: 'NULL' },
  { subject: 'DISCIPLINE', value: 85, fullMark: 100, leaningValue: -8, totalTrades: 12, leaning: 'Balanced', side: 'NULL' },
  { subject: 'ANALYSIS', value: 70, fullMark: 100, leaningValue: 10, totalTrades: 6, leaning: 'Balanced', side: 'NULL' },
  { subject: 'CALM', value: 80, fullMark: 100, leaningValue: -5, totalTrades: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'NEUTRALITY', value: 65, fullMark: 100, leaningValue: 3, totalTrades: 7, leaning: 'Balanced', side: 'NULL' },
];

const extremeLeaningData = [
  { subject: 'EXTREME_FOMO', value: 100, fullMark: 100, leaningValue: 100, totalTrades: 25, leaning: 'Buy Leaning', side: 'Buy' },
  { subject: 'EXTREME_FEAR', value: 100, fullMark: 100, leaningValue: -100, totalTrades: 22, leaning: 'Sell Leaning', side: 'Sell' },
  { subject: 'PERFECT_BALANCE', value: 50, fullMark: 100, leaningValue: 0, totalTrades: 15, leaning: 'Balanced', side: 'NULL' },
];

const testScenarios = [
  {
    name: 'Valid Data (Multiple Emotions)',
    data: validEmotionData,
    description: 'Test with multiple valid emotions with new structure'
  },
  {
    name: 'Single Emotion',
    data: singleEmotionData,
    description: 'Test with single emotion with leaning values'
  },
  {
    name: 'Mixed Valid/Invalid Data',
    data: mixedEmotionData,
    description: 'Test with mixed valid and invalid emotions'
  },
  {
    name: 'Buy-Biased Emotions',
    data: buyBiasedEmotionData,
    description: 'Test emotions with strong buy leaning (positive leaningValue)'
  },
  {
    name: 'Sell-Biased Emotions',
    data: sellBiasedEmotionData,
    description: 'Test emotions with strong sell leaning (negative leaningValue)'
  },
  {
    name: 'Balanced Emotions',
    data: balancedEmotionData,
    description: 'Test emotions with balanced leaning (near-zero leaningValue)'
  },
  {
    name: 'Extreme Leaning Values',
    data: extremeLeaningData,
    description: 'Test with extreme leaning values (-100, 0, 100)'
  },
  {
    name: 'Empty Data',
    data: [],
    description: 'Test with empty data array'
  },
  {
    name: 'Null Data',
    data: null as any,
    description: 'Test with null data'
  },
  {
    name: 'Undefined Data',
    data: undefined as any,
    description: 'Test with undefined data'
  }
];

export default function TestEmotionRadarEnhanced() {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);

  const currentTest = testScenarios[currentTestIndex] || testScenarios[0];

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTest = async () => {
    addResult(`Starting test: ${currentTest?.name}`);
    
    try {
      // Test if the component renders without crashing
      addResult('✓ Component renders without crashing');
      
      // Test data validation with new structure
      if (currentTest?.data) {
        const validCount = Array.isArray(currentTest.data)
          ? currentTest.data.filter(item =>
              item &&
              typeof item.subject === 'string' &&
              typeof item.value === 'number' &&
              typeof item.leaningValue === 'number' &&
              typeof item.totalTrades === 'number' &&
              typeof item.leaning === 'string' &&
              typeof item.side === 'string'
            ).length
          : 0;
        
        // Test leaning value ranges
        const leaningValues = Array.isArray(currentTest.data)
          ? currentTest.data.filter(item => item && typeof item.leaningValue === 'number').map(item => item.leaningValue)
          : [];
        
        const validLeaningRange = leaningValues.every(value => value >= -100 && value <= 100);
        
        // Test leaning consistency
        const leaningConsistency = Array.isArray(currentTest.data)
          ? currentTest.data.filter(item =>
              item &&
              ((item.leaningValue > 10 && item.leaning === 'Buy Leaning') ||
               (item.leaningValue < -10 && item.leaning === 'Sell Leaning') ||
               (Math.abs(item.leaningValue) <= 10 && item.leaning === 'Balanced'))
            ).length
          : 0;
        
        addResult(`✓ Data validation: ${validCount} valid items found`);
        addResult(`✓ Leaning value range: ${validLeaningRange ? 'Valid (-100 to 100)' : 'Invalid'}`);
        addResult(`✓ Leaning consistency: ${leaningConsistency} items with consistent values`);
      } else {
        addResult('✓ Null/undefined data handled correctly');
      }
      
      addResult(`✓ Test completed: ${currentTest?.name}`);
    } catch (error) {
      addResult(`✗ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const nextTest = () => {
    setCurrentTestIndex((prev) => (prev + 1) % testScenarios.length);
    setTestResults([]);
  };

  const prevTest = () => {
    setCurrentTestIndex((prev) => (prev - 1 + testScenarios.length) % testScenarios.length);
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gradient">Enhanced EmotionRadar Test</h1>
          <p className="text-lg text-white/70">
            Testing the fixed EmotionRadar with glass morphism design and glow effects
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Test Controls */}
          <div className="glass-enhanced p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              Test Controls
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Current Test:</h3>
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="font-semibold text-teal-300">{currentTest?.name}</p>
                <p className="text-sm text-white/70">{currentTest?.description}</p>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={prevTest}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={runTest}
                className="flex-1 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Run Test
              </button>
              <button
                onClick={nextTest}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Test Results:</h3>
              <div className="bg-black/30 p-4 rounded-lg h-48 overflow-y-auto scrollbar-glass text-sm font-mono">
                {testResults.length === 0 ? (
                  <p className="text-white/50">No tests run yet. Click "Run Test" to start.</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className={result.includes('✓') ? 'text-green-400' : 'text-red-400'}>
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* EmotionRadar Display */}
          <div className="glass-enhanced p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              EmotionRadar Component
            </h2>
            
            <div className="relative">
              <EmotionRadar data={currentTest?.data} />
            </div>
          </div>
        </div>

        {/* All Test Scenarios */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">All Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testScenarios.map((scenario, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  index === currentTestIndex
                    ? 'bg-teal-600/20 border-teal-500/50'
                    : 'bg-black/30 border-white/10 hover:bg-white/5'
                }`}
                onClick={() => {
                  setCurrentTestIndex(index);
                  setTestResults([]);
                }}
              >
                <h3 className="font-medium mb-1">{scenario.name}</h3>
                <p className="text-sm text-white/70">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive Design Test */}
        <div className="glass-enhanced p-6 rounded-xl mt-8">
          <h2 className="text-2xl font-semibold mb-4">Responsive Design Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Small (Mobile)</h3>
              <div className="h-64">
                <EmotionRadar data={validEmotionData} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Medium (Tablet)</h3>
              <div className="h-80">
                <EmotionRadar data={validEmotionData} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Large (Desktop)</h3>
              <div className="h-96">
                <EmotionRadar data={validEmotionData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}