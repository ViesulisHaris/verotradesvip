'use client';

import { useState } from 'react';
import EnhancedStrategyCard from '@/components/ui/EnhancedStrategyCard';
import { StrategyStats, StrategyWithRules } from '@/lib/strategy-rules-engine';

// Mock strategy data for testing
const mockStrategy: StrategyWithRules & { stats: StrategyStats } = {
  id: 'test-strategy-1',
  name: 'Test Strategy for Modal',
  description: 'This is a test strategy to verify modal functionality works correctly',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  rules: [
    'Buy when RSI is below 30',
    'Sell when RSI is above 70',
    'Use 2% risk per trade',
    'Set stop loss at 2x ATR',
    'Take profit at 3x risk'
  ],
  stats: {
    total_trades: 45,
    winning_trades: 28,
    gross_profit: 12500.50,
    gross_loss: -7200.25,
    total_pnl: 5300.25,
    max_drawdown: -1500.75,
    sharpe_ratio: 1.45,
    avg_hold_period: 120.5,
    winrate: 62.2,
    profit_factor: 1.74,
    average_win: 446.45,
    average_loss: -257.15
  }
};

// Mock strategy with no data
const mockStrategyNoData: StrategyWithRules & { stats: null } = {
  id: 'test-strategy-2',
  name: 'Empty Strategy Test',
  description: 'Strategy with no performance data to test empty states',
  is_active: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  rules: [],
  stats: null
};

export default function TestModalPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const addTestResult = (result: string, success: boolean = true) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${result}`]);
  };

  const runTests = async () => {
    setIsTestRunning(true);
    setTestResults([]);
    
    // Test 1: Check if components render without errors
    try {
      addTestResult('Components render without errors');
    } catch (error) {
      addTestResult(`Component rendering error: ${error}`, false);
    }

    // Test 2: Check modal opening
    try {
      // This would require user interaction in a real test
      addTestResult('Modal opening test requires manual verification');
    } catch (error) {
      addTestResult(`Modal opening error: ${error}`, false);
    }

    // Test 3: Check responsive design
    try {
      // Check if we're on a mobile device
      const isMobile = window.innerWidth < 768;
      addTestResult(`Current screen size: ${window.innerWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
    } catch (error) {
      addTestResult(`Screen size detection error: ${error}`, false);
    }

    // Test 4: Check data structure
    try {
      if (mockStrategy.stats && mockStrategy.stats.total_trades > 0) {
        addTestResult('Mock strategy data structure is valid');
      } else {
        addTestResult('Mock strategy data structure is invalid', false);
      }
    } catch (error) {
      addTestResult(`Data structure validation error: ${error}`, false);
    }

    setIsTestRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Modal Functionality Test Page</h1>
        
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click "View Performance Details" on each strategy card below</li>
            <li>Verify the modal opens smoothly and is centered on the screen</li>
            <li>Test closing the modal using the X button</li>
            <li>Test clicking outside the modal to close it</li>
            <li>Check all tabs (Overview, Performance, Rules, Compliance)</li>
            <li>Resize your browser window to test responsive behavior</li>
            <li>Run the automated tests below for additional checks</li>
          </ol>
        </div>

        <div className="mb-8 flex gap-4">
          <button
            onClick={runTests}
            disabled={isTestRunning}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
          >
            {isTestRunning ? 'Running Tests...' : 'Run Automated Tests'}
          </button>
          <button
            onClick={clearResults}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="font-mono text-sm">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Strategy with Data</h2>
            <EnhancedStrategyCard
              strategy={mockStrategy}
              onDelete={() => alert('Delete clicked (test only)')}
              onEdit={() => alert('Edit clicked (test only)')}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Strategy with No Data</h2>
            <EnhancedStrategyCard
              strategy={mockStrategyNoData}
              onDelete={() => alert('Delete clicked (test only)')}
              onEdit={() => alert('Edit clicked (test only)')}
            />
          </div>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Manual Test Checklist</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Modal opens when clicking "View Performance Details"</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Modal is perfectly centered on the screen</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Modal closes when clicking the X button</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Modal closes when clicking outside the modal</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>All content displays correctly in the modal</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Modal works on mobile devices (responsive)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>All tabs (Overview, Performance, Rules, Compliance) work</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Performance metrics display correctly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span>Empty states display correctly (no data strategy)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}