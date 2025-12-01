'use client';

import React, { useState } from 'react';
import EnhancedStrategyCard from '@/components/ui/EnhancedStrategyCard';

// Mock strategy data for testing
const mockStrategies = [
  {
    id: 'test-strategy-1',
    name: 'Test Strategy 1',
    description: 'This is a test strategy for modal glitch verification',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user-id',
    rules: [],
    stats: {
      total_trades: 25,
      winning_trades: 15,
      winrate: 60,
      total_pnl: 1250.50,
      gross_profit: 1875.00,
      gross_loss: -624.50,
      profit_factor: 3.0,
      max_drawdown: -300.00,
      sharpe_ratio: 1.25,
      avg_hold_period: 2.5,
      average_win: 125.00,
      average_loss: -62.45
    }
  },
  {
    id: 'test-strategy-2',
    name: 'Test Strategy 2',
    description: 'Another test strategy for modal glitch verification',
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user-id',
    rules: [],
    stats: {
      total_trades: 18,
      winning_trades: 8,
      winrate: 44.44,
      total_pnl: -320.75,
      gross_profit: 964.00,
      gross_loss: -1284.75,
      profit_factor: 0.75,
      max_drawdown: -450.00,
      sharpe_ratio: -0.5,
      avg_hold_period: 1.8,
      average_win: 120.50,
      average_loss: -128.48
    }
  }
];

export default function TestModalGlitchPage() {
  const [strategies] = useState(mockStrategies);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Modal Glitch Test Page</h1>
          <p className="text-white/70">This page is specifically designed for testing modal functionality without authentication requirements.</p>
        </div>

        {/* Test Instructions */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <ul className="text-white/80 space-y-2">
            <li>• Click "View Performance Details" on any strategy card to open the modal</li>
            <li>• Test modal opening, closing, and tab switching</li>
            <li>• Verify there are no "trapped in a box" effects</li>
            <li>• Check for proper backdrop behavior and z-index layering</li>
            <li>• Test ESC key and backdrop click to close modal</li>
          </ul>
        </div>

        {/* Strategy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <EnhancedStrategyCard
              key={strategy.id}
              strategy={strategy}
              onDelete={() => {
                console.log('Delete clicked for strategy:', strategy.id);
              }}
              onEdit={() => {
                console.log('Edit clicked for strategy:', strategy.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}