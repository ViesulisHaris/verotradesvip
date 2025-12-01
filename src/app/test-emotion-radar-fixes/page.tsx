'use client';

import { useState } from 'react';
import EmotionRadar from '@/components/ui/EmotionRadar';

// Test data with all 7 valid emotions
const validEmotionData = [
  { subject: 'FOMO', value: 8, fullMark: 10, leaning: 'Buy', side: 'Buy' },
  { subject: 'REVENGE', value: 6, fullMark: 10, leaning: 'Sell', side: 'Sell' },
  { subject: 'TILT', value: 4, fullMark: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'OVERRISK', value: 7, fullMark: 10, leaning: 'Buy', side: 'Buy' },
  { subject: 'PATIENCE', value: 9, fullMark: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'REGRET', value: 3, fullMark: 10, leaning: 'Sell', side: 'Sell' },
  { subject: 'DISCIPLINE', value: 10, fullMark: 10, leaning: 'Balanced', side: 'NULL' }
];

// Test data with invalid emotions mixed in (should be filtered out)
const mixedEmotionData = [
  { subject: 'FOMO', value: 8, fullMark: 10, leaning: 'Buy', side: 'Buy' },
  { subject: 'INVALID_EMOTION', value: 5, fullMark: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'REVENGE', value: 6, fullMark: 10, leaning: 'Sell', side: 'Sell' },
  { subject: 'ANOTHER_INVALID', value: 7, fullMark: 10, leaning: 'Buy', side: 'Buy' },
  { subject: 'TILT', value: 4, fullMark: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'OVERRISK', value: 7, fullMark: 10, leaning: 'Buy', side: 'Buy' },
  { subject: 'PATIENCE', value: 9, fullMark: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'REGRET', value: 3, fullMark: 10, leaning: 'Sell', side: 'Sell' },
  { subject: 'DISCIPLINE', value: 10, fullMark: 10, leaning: 'Balanced', side: 'NULL' }
];

// Test data with only invalid emotions (should show empty state)
const invalidEmotionData = [
  { subject: 'INVALID_EMOTION', value: 5, fullMark: 10, leaning: 'Balanced', side: 'NULL' },
  { subject: 'ANOTHER_INVALID', value: 7, fullMark: 10, leaning: 'Buy', side: 'Buy' },
  { subject: 'THIRD_INVALID', value: 3, fullMark: 10, leaning: 'Sell', side: 'Sell' }
];

export default function TestEmotionRadarFixes() {
  const [testData, setTestData] = useState(validEmotionData);
  const [testName, setTestName] = useState('Valid Emotions Only');

  const runTest = (data: any[], name: string) => {
    setTestData(data);
    setTestName(name);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Emotion Radar Fixes Test</h1>
        
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Current Test: {testName}</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => runTest(validEmotionData, 'Valid Emotions Only')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Test Valid Emotions
            </button>
            <button
              onClick={() => runTest(mixedEmotionData, 'Mixed Valid/Invalid Emotions')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Test Mixed Emotions
            </button>
            <button
              onClick={() => runTest(invalidEmotionData, 'Invalid Emotions Only')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Test Invalid Emotions
            </button>
            <button
              onClick={() => runTest([], 'Empty Data')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Test Empty Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Emotion Radar</h3>
            <EmotionRadar data={testData} />
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-blue-400">✅ Fix 1: Remove Numerical Values</h4>
                <p className="text-sm text-gray-300">Check that no numbers appear on the radar grid lines</p>
              </div>
              
              <div>
                <h4 className="font-medium text-green-400">✅ Fix 2: Filter Valid Emotions</h4>
                <p className="text-sm text-gray-300">Only FOMO, REVENGE, TILT, OVERRISK, PATIENCE, REGRET, DISCIPLINE should appear</p>
                <div className="mt-2 text-xs">
                  <p>Current data points: {testData.length}</p>
                  <p>Valid emotions: {testData.filter(d => 
                    ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE']
                    .includes(d.subject.toUpperCase())).length}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-purple-400">✅ Fix 3: Enhanced Visual Design</h4>
                <p className="text-sm text-gray-300">Check for:</p>
                <ul className="text-xs text-gray-400 mt-1 space-y-1">
                  <li>• Different shapes for Buy (triangle), Sell (diamond), Default (circle)</li>
                  <li>• Gradient fills with proper color coding</li>
                  <li>• Glow effects and shadows</li>
                  <li>• Smooth hover animations</li>
                  <li>• Inner highlights for depth</li>
                </ul>
              </div>
              
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2">Color Coding:</h4>
                <div className="text-xs space-y-1">
                  <p>🟢 Buy trades: Green gradients</p>
                  <p>🔴 Sell trades: Red gradients</p>
                  <p>🔵 Default/NULL: Blue gradients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Data Being Displayed</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Emotion</th>
                  <th className="text-left py-2">Value</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-left py-2">Valid?</th>
                </tr>
              </thead>
              <tbody>
                {testData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2">{item.subject}</td>
                    <td className="py-2">{item.value}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.side === 'Buy' ? 'bg-green-600' : 
                        item.side === 'Sell' ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
                        {item.side}
                      </span>
                    </td>
                    <td className="py-2">
                      {['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE']
                        .includes(item.subject.toUpperCase()) ? 
                        <span className="text-green-400">✅</span> : 
                        <span className="text-red-400">❌</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}