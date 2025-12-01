'use client';

import React, { useState } from 'react';
import EnhancedStrategyCard from '@/components/ui/EnhancedStrategyCard';

// Mock strategy data for testing
const mockStrategy = {
  id: 'test-123',
  name: 'Test Strategy for Performance Metrics',
  description: 'This is a test strategy to verify the performance metrics display fixes',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  rules: ['Rule 1: Buy when RSI < 30', 'Rule 2: Sell when RSI > 70', 'Rule 3: Use 2% risk'],
  stats: {
    total_trades: 45,
    winning_trades: 28,
    gross_profit: 12500.50,
    gross_loss: -7200.25,
    total_pnl: 5300.25,
    winrate: 62.2,
    profit_factor: 1.74,
    sharpe_ratio: 1.35,
    max_drawdown: -1200.00,
    avg_hold_period: 145.5,
    average_win: 446.45,
    average_loss: -257.15
  }
};

export default function TestStrategyMetrics() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Strategy Performance Metrics Test</h1>
        
        <div className="mb-6">
          <p className="text-white/70 mb-4">
            This page tests the fixed performance metrics display in the strategy card. 
            The card should show properly formatted metrics with correct alignment and responsive design.
          </p>
          
          <div className="glass p-4 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-2">Test Instructions:</h2>
            <ul className="text-white/70 space-y-1 list-disc list-inside">
              <li>Verify the quick stats display correctly when expanded</li>
              <li>Check the Overview tab for properly formatted performance metrics</li>
              <li>Ensure responsive design works on different screen sizes</li>
              <li>Confirm no text overflow or alignment issues</li>
              <li>Test the Performance tab for additional metrics</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-8">
          <EnhancedStrategyCard
            strategy={mockStrategy}
            onDelete={() => console.log('Delete clicked')}
            onEdit={() => console.log('Edit clicked')}
          />
        </div>
      </div>
    </div>
  );
}