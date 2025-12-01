'use client';

import { useState, useEffect } from 'react';
import CustomDropdown from '@/src/components/ui/CustomDropdown';

// Test component to reproduce the strategy dropdown issue
export default function TestStrategyDropdown() {
  // Create mock strategies data with more than 3 items
  const [strategies, setStrategies] = useState([
    { value: 'strategy-1', label: 'Strategy 1: Day Trading Breakout' },
    { value: 'strategy-2', label: 'Strategy 2: Swing Trading Momentum' },
    { value: 'strategy-3', label: 'Strategy 3: Position Trading Value' },
    { value: 'strategy-4', label: 'Strategy 4: Scalping Small Profits' },
    { value: 'strategy-5', label: 'Strategy 5: Trend Following' },
    { value: 'strategy-6', label: 'Strategy 6: Mean Reversion' },
    { value: 'strategy-7', label: 'Strategy 7: Arbitrage Opportunities' },
    { value: 'strategy-8', label: 'Strategy 8: News-Based Trading' },
  ]);

  const [selectedStrategy, setSelectedStrategy] = useState('');

  const handleStrategyChange = (value: string) => {
    setSelectedStrategy(value);
    console.log('Selected strategy:', value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Strategy Dropdown Test</h1>
        <p className="text-gray-300 mb-8">
          Testing the strategy dropdown to ensure all strategies are visible and selectable
        </p>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Strategy Selection</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">
              Select a Strategy
            </label>
            <CustomDropdown
              value={selectedStrategy}
              onChange={handleStrategyChange}
              options={strategies}
              placeholder="Select a strategy"
              className="w-full"
            />
          </div>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Debug Information</h3>
            <p className="text-gray-300">
              Selected Strategy: <span className="text-blue-400">{selectedStrategy || 'None'}</span>
            </p>
            <p className="text-gray-300">
              Total Strategies Available: <span className="text-blue-400">{strategies.length}</span>
            </p>
            <p className="text-gray-300 mt-4 text-sm">
              This test verifies that all strategies are visible in the dropdown and can be selected,
              especially when there are more than 3 strategies.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-2">All Strategies:</h3>
            <ul className="space-y-1">
              {strategies.map((strategy, index) => (
                <li 
                  key={strategy.value} 
                  className={`text-sm ${selectedStrategy === strategy.value ? 'text-blue-400 font-medium' : 'text-gray-300'}`}
                >
                  {index + 1}. {strategy.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}