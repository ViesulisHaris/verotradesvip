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
    trade_date: '2025-01-15',
    entry_time: '09:30:00',
    exit_time: '10:45:00',
    emotional_state: 'Confident',
    notes: 'Good entry based on breakout pattern',
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
    entry_price: 200.00,
    exit_price: 195.50,
    pnl: 225.00,
    trade_date: '2025-01-15',
    entry_time: '11:00:00',
    exit_time: '12:30:00',
    emotional_state: 'Cautious',
    notes: 'Resistance level held strong',
    market: 'NASDAQ',
    strategies: {
      id: '2',
      name: 'Support/Resistance'
    }
  }
];

export default function TestModalClickOutside() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Trade Modal Click-Outside-to-Close Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click the "Open Modal" button below to open the trade details modal</li>
            <li>Try clicking outside the modal content (on the dark backdrop) - the modal should close</li>
            <li>Try clicking inside the modal content - the modal should stay open</li>
            <li>Test the close button in the top-right corner</li>
            <li>Test the "Close Details" button at the bottom</li>
            <li>Check that no JavaScript errors appear in the console</li>
          </ol>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={openModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Modal
          </button>
        </div>

        {isModalOpen && (
          <TradeModal
            trades={sampleTrades}
            selectedDate="2025-01-15"
            onClose={closeModal}
          />
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${isModalOpen ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span>Modal Status: {isModalOpen ? 'Open' : 'Closed'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}