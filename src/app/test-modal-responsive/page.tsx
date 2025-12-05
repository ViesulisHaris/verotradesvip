'use client';

import React, { useState } from 'react';
import EditTradeModal from '@/components/trades/EditTradeModal';
import DeleteTradeModal from '@/components/trades/DeleteTradeModal';
import { Trade } from '@/components/trades/EditTradeModal';
import Button from '@/components/ui/Button';

export default function TestModalResponsivePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sampleTrade: Trade = {
    id: 'test-trade-123',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.75,
    pnl: 550.00,
    trade_date: '2024-01-15',
    entry_time: '09:30',
    exit_time: '10:45',
    emotional_state: ['CONFIDENT', 'PATIENCE'],
    notes: 'This is a test trade with a long note to test how the modal handles text overflow on smaller screens. The note should wrap properly and be readable on all device sizes.',
    market: 'stock'
  };

  const handleSaveTrade = (updatedTrade: Partial<Trade>) => {
    setIsLoading(true);
    console.log('Saving trade:', updatedTrade);
    setTimeout(() => {
      setIsLoading(false);
      setIsEditModalOpen(false);
      alert('Trade saved successfully!');
    }, 1500);
  };

  const handleDeleteTrade = (tradeId: string) => {
    setIsLoading(true);
    console.log('Deleting trade:', tradeId);
    setTimeout(() => {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      alert('Trade deleted successfully!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-warm-off-white mb-6 sm:mb-8">
          Modal Responsiveness Test
        </h1>

        <div className="space-y-6">
          {/* Test Instructions */}
          <div className="rounded-lg bg-surface p-4 sm:p-6 border border-input">
            <h2 className="text-lg sm:text-xl font-semibold text-warm-off-white mb-4">
              Testing Instructions
            </h2>
            <div className="space-y-2 text-sm sm:text-base text-gray-300">
              <p>📱 Test on different screen sizes by resizing your browser or using dev tools:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Mobile: 320px - 640px</li>
                <li>Tablet: 641px - 1024px</li>
                <li>Desktop: 1025px+</li>
              </ul>
              <p>✅ Verify that modals:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fit properly on all screen sizes</li>
                <li>Allow scrolling when content exceeds viewport</li>
                <li>Have proper spacing and padding</li>
                <li>Buttons are properly sized and accessible</li>
                <li>Text remains readable at all sizes</li>
              </ul>
            </div>
          </div>

          {/* Test Edit Modal */}
          <div className="rounded-lg bg-surface p-4 sm:p-6 border border-input">
            <h2 className="text-lg sm:text-xl font-semibold text-warm-off-white mb-4">
              Edit Trade Modal Test
            </h2>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              Test the EditTradeModal with comprehensive form fields.
            </p>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-gold text-background w-full sm:w-auto"
            >
              Open Edit Modal
            </Button>
          </div>

          {/* Test Delete Modal */}
          <div className="rounded-lg bg-surface p-4 sm:p-6 border border-input">
            <h2 className="text-lg sm:text-xl font-semibold text-warm-off-white mb-4">
              Delete Trade Modal Test
            </h2>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              Test the DeleteTradeModal with trade details confirmation.
            </p>
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Open Delete Modal
            </Button>
          </div>

          {/* Current Screen Size Indicator */}
          <div className="rounded-lg bg-surface p-4 sm:p-6 border border-input">
            <h2 className="text-lg sm:text-xl font-semibold text-warm-off-white mb-4">
              Current Screen Size
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Width:</span>
                <span className="ml-2 text-warm-off-white font-mono">
                  {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px
                </span>
              </div>
              <div>
                <span className="text-gray-400">Height:</span>
                <span className="ml-2 text-warm-off-white font-mono">
                  {typeof window !== 'undefined' ? window.innerHeight : 'N/A'}px
                </span>
              </div>
              <div>
                <span className="text-gray-400">Breakpoint:</span>
                <span className="ml-2 text-warm-off-white">
                  {typeof window !== 'undefined' 
                    ? (window.innerWidth < 640 ? 'Mobile' : 
                       window.innerWidth < 1024 ? 'Tablet' : 'Desktop')
                    : 'N/A'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-400">Orientation:</span>
                <span className="ml-2 text-warm-off-white">
                  {typeof window !== 'undefined' 
                    ? (window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait')
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        trade={sampleTrade}
        onSave={handleSaveTrade}
        isLoading={isLoading}
      />

      {/* Delete Modal */}
      <DeleteTradeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        trade={sampleTrade}
        onDelete={handleDeleteTrade}
        isLoading={isLoading}
      />
    </div>
  );
}