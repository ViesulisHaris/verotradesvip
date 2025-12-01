'use client';

import React, { useState } from 'react';
import TradeModal from '@/components/forms/TradeModal';

// Sample trade data for testing
const sampleTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy' as const,
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    entry_time: '09:30',
    exit_time: '10:45',
    emotional_state: 'Confident',
    notes: 'Strong breakout above resistance',
    market: 'NASDAQ',
    strategies: {
      id: '1',
      name: 'Breakout Strategy'
    }
  },
  {
    id: '2',
    symbol: 'TSLA',
    side: 'Sell' as const,
    quantity: 50,
    entry_price: 800.00,
    exit_price: 785.25,
    pnl: 737.50,
    trade_date: '2024-01-15',
    entry_time: '11:00',
    exit_time: '14:30',
    emotional_state: 'Cautious',
    notes: 'Resistance held, good risk/reward',
    market: 'NASDAQ',
    strategies: {
      id: '2',
      name: 'Mean Reversion'
    }
  }
];

export default function TestModalBackdrop() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Modal Backdrop Test</h1>
        
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Testing Instructions</h2>
            <ul className="space-y-2 text-white/80">
              <li>1. Click the "Open Modal" button below</li>
              <li>2. Check that the entire screen is covered by the dark backdrop</li>
              <li>3. Verify there are no gaps or uncovered areas</li>
              <li>4. Ensure the header/sidebar are completely covered</li>
              <li>5. Test on different screen sizes</li>
            </ul>
          </div>

          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Test Controls</h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Modal
            </button>
          </div>

          <div className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Expected Results</h2>
            <div className="space-y-2 text-white/80">
              <p>✅ Entire viewport should be covered by dark backdrop</p>
              <p>✅ No bar or gap should be visible at the top</p>
              <p>✅ Backdrop should be uniform across entire screen</p>
              <p>✅ Modal should be centered on screen</p>
              <p>✅ Background should be completely darkened</p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <TradeModal
          trades={sampleTrades}
          selectedDate="2024-01-15"
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}