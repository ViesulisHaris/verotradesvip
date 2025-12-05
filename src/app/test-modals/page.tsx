'use client';

import React, { useState } from 'react';
import EditTradeModal from '@/components/trades/EditTradeModal';
import DeleteTradeModal from '@/components/trades/DeleteTradeModal';
import { Trade } from '@/components/trades/EditTradeModal';
import Button from '@/components/ui/Button';

export default function TestModalsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sample trade data for testing
  const sampleTrade: Trade = {
    id: 'test-trade-1',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    entry_time: '09:30',
    exit_time: '10:45',
    emotional_state: ['CONFIDENT', 'PATIENCE'],
    notes: 'Good entry based on breakout pattern, took profits at resistance level.',
    market: 'stock'
  };

  const handleEditSave = (updatedTrade: Partial<Trade>) => {
    setIsLoading(true);
    console.log('Saving trade:', updatedTrade);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEditModalOpen(false);
      alert('Trade updated successfully!');
    }, 1500);
  };

  const handleDelete = (tradeId: string) => {
    setIsLoading(true);
    console.log('Deleting trade:', tradeId);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      alert('Trade deleted successfully!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-warm-off-white mb-8">Modal Components Test</h1>
        
        <div className="space-y-6">
          {/* Test Edit Modal */}
          <div className="rounded-lg bg-surface p-6 border border-input">
            <h2 className="text-xl font-semibold text-warm-off-white mb-4">Edit Trade Modal Test</h2>
            <p className="text-gray-400 mb-4">
              Test the EditTradeModal component with sample trade data.
            </p>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-gold text-background"
            >
              Open Edit Modal
            </Button>
          </div>

          {/* Test Delete Modal */}
          <div className="rounded-lg bg-surface p-6 border border-input">
            <h2 className="text-xl font-semibold text-warm-off-white mb-4">Delete Trade Modal Test</h2>
            <p className="text-gray-400 mb-4">
              Test the DeleteTradeModal component with confirmation dialog.
            </p>
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
            >
              Open Delete Modal
            </Button>
          </div>

          {/* Component Information */}
          <div className="rounded-lg bg-surface p-6 border border-input">
            <h2 className="text-xl font-semibold text-warm-off-white mb-4">Component Features</h2>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-gold">✓</span>
                <span>EditModal with form validation and error handling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">✓</span>
                <span>DeleteModal with trade details confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">✓</span>
                <span>InputGroup helper component with consistent styling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">✓</span>
                <span>Emotion selection with visual indicators</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">✓</span>
                <span>Tailwind color scheme integration (gold, surface, input, border)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">✓</span>
                <span>TypeScript type safety</span>
              </li>
              </ul>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        trade={sampleTrade}
        onSave={handleEditSave}
        isLoading={isLoading}
      />

      {/* Delete Modal */}
      <DeleteTradeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        trade={sampleTrade}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}