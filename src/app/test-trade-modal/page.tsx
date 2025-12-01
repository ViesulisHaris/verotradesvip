'use client';

import React, { useState } from 'react';
import TradeModal from '@/components/forms/TradeModal';

// Sample trade data for testing
const singleTrade = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy' as const,
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    entry_time: '09:30:00',
    exit_time: '10:45:00',
    emotional_state: 'Confident',
    notes: 'Strong momentum breakout above resistance level. Good risk-reward ratio.',
    market: 'NASDAQ',
    strategies: {
      id: '1',
      name: 'Momentum Trading'
    }
  }
];

const multipleTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy' as const,
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    entry_time: '09:30:00',
    exit_time: '10:45:00',
    emotional_state: 'Confident',
    notes: 'Strong momentum breakout above resistance level. Good risk-reward ratio.',
    market: 'NASDAQ',
    strategies: {
      id: '1',
      name: 'Momentum Trading'
    }
  },
  {
    id: '2',
    symbol: 'TSLA',
    side: 'Sell' as const,
    quantity: 50,
    entry_price: 250.75,
    exit_price: 245.20,
    pnl: 277.50,
    trade_date: '2024-01-15',
    entry_time: '11:00:00',
    exit_time: '11:30:00',
    emotional_state: 'Cautious',
    notes: 'Bearish divergence on RSI, decided to take profits early.',
    market: 'NASDAQ',
    strategies: {
      id: '2',
      name: 'Technical Analysis'
    }
  },
  {
    id: '3',
    symbol: 'MSFT',
    side: 'Buy' as const,
    quantity: 75,
    entry_price: 380.50,
    exit_price: 378.25,
    pnl: -168.75,
    trade_date: '2024-01-15',
    entry_time: '13:15:00',
    exit_time: '14:20:00',
    emotional_state: 'Frustrated',
    notes: 'Failed breakout, stopped out at support. Should have waited for confirmation.',
    market: 'NASDAQ',
    strategies: {
      id: '3',
      name: 'Breakout Trading'
    }
  },
  {
    id: '4',
    symbol: 'GOOGL',
    side: 'Buy' as const,
    quantity: 25,
    entry_price: 145.80,
    exit_price: 148.90,
    pnl: 77.50,
    trade_date: '2024-01-15',
    entry_time: '15:00:00',
    exit_time: '15:45:00',
    emotional_state: 'Patient',
    notes: 'Consolidation breakout, managed risk well with proper position sizing.',
    market: 'NASDAQ',
    strategies: {
      id: '1',
      name: 'Momentum Trading'
    }
  },
  {
    id: '5',
    symbol: 'AMZN',
    side: 'Sell' as const,
    quantity: 60,
    entry_price: 155.30,
    exit_price: 152.10,
    pnl: 192.00,
    trade_date: '2024-01-15',
    entry_time: '16:00:00',
    exit_time: '16:30:00',
    emotional_state: 'Analytical',
    notes: 'Double top formation confirmed, short position with tight stop loss.',
    market: 'NASDAQ',
    strategies: {
      id: '2',
      name: 'Technical Analysis'
    }
  }
];

export default function TestTradeModal() {
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showMultipleModal, setShowMultipleModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Trade Modal Layout Test</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Single Trade Test */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Single Trade Test</h2>
            <p className="text-white/70 mb-6">
              Test the modal layout with a single trade to ensure it looks good without excessive scrolling.
            </p>
            <button
              onClick={() => setShowSingleModal(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Open Single Trade Modal
            </button>
          </div>

          {/* Multiple Trades Test */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Multiple Trades Test</h2>
            <p className="text-white/70 mb-6">
              Test the modal with 5 trades to verify scrolling behavior and custom scrollbar styling.
            </p>
            <button
              onClick={() => setShowMultipleModal(true)}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Open Multiple Trades Modal
            </button>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-12 glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">Test Checklist</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Modal should open smoothly with backdrop blur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Header and summary sections should be visible at the top</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Individual trades should flow naturally without height restrictions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Custom scrollbar should appear when content overflows (multiple trades)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Scrollbar should have glass morphism styling with hover effects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Click outside or ESC key should close the modal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>All trade information should be displayed properly</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Single Trade Modal */}
      {showSingleModal && (
        <TradeModal
          trades={singleTrade}
          selectedDate="2024-01-15"
          onClose={() => setShowSingleModal(false)}
        />
      )}

      {/* Multiple Trades Modal */}
      {showMultipleModal && (
        <TradeModal
          trades={multipleTrades}
          selectedDate="2024-01-15"
          onClose={() => setShowMultipleModal(false)}
        />
      )}
    </div>
  );
}