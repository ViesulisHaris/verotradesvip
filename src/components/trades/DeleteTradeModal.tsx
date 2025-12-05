'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  trade_date: string;
  entry_time?: string;
  exit_time?: string;
  emotional_state?: string[];
  notes?: string;
  market?: 'stock' | 'crypto' | 'forex' | 'futures';
}

interface DeleteTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onDelete: (tradeId: string) => void;
  isLoading?: boolean;
}

export default function DeleteTradeModal({
  isOpen,
  onClose,
  trade,
  onDelete,
  isLoading = false
}: DeleteTradeModalProps) {
  const handleDelete = () => {
    if (trade) {
      onDelete(trade.id);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      showCloseButton={true}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="text-center px-2 sm:px-0">
        {/* Warning Icon */}
        <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg sm:text-xl font-semibold text-warm-off-white">
          Delete Trade
        </h3>

        {/* Confirmation Message */}
        <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-400 px-2 sm:px-0">
          Are you sure you want to delete this trade? This action cannot be undone.
        </p>

        {/* Trade Details */}
        {trade && (
          <div className="mb-4 sm:mb-6 rounded-lg bg-surface p-3 sm:p-4 border border-input">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
              <div>
                <p className="text-sm text-gray-400">Symbol</p>
                <p className="font-medium text-warm-off-white">{trade.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Side</p>
                <p className={`font-medium ${trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.side}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Quantity</p>
                <p className="font-medium text-warm-off-white">{trade.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entry Price</p>
                <p className="font-medium text-warm-off-white">{formatCurrency(trade.entry_price)}</p>
              </div>
              {trade.exit_price && (
                <div>
                  <p className="text-sm text-gray-400">Exit Price</p>
                  <p className="font-medium text-warm-off-white">{formatCurrency(trade.exit_price)}</p>
                </div>
              )}
              {trade.pnl !== undefined && (
                <div>
                  <p className="text-sm text-gray-400">P&L</p>
                  <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(trade.pnl)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="font-medium text-warm-off-white">{formatDate(trade.trade_date)}</p>
              </div>
              {trade.market && (
                <div>
                  <p className="text-sm text-gray-400">Market</p>
                  <p className="font-medium text-warm-off-white capitalize">{trade.market}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {trade.notes && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-input">
                <p className="mb-2 text-sm text-gray-400">Notes</p>
                <p className="text-xs sm:text-sm text-warm-off-white break-words">{trade.notes}</p>
              </div>
            )}

            {/* Emotions */}
            {trade.emotional_state && trade.emotional_state.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-input">
                <p className="mb-2 text-sm text-gray-400">Emotions</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {trade.emotional_state.map((emotion, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-full text-xs bg-gold/10 text-gold border border-gold/30 break-words"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-surface border border-input text-warm-off-white rounded-lg hover:bg-surface-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-red-500 border border-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            )}
            Delete Trade
          </button>
        </div>
      </div>
    </Modal>
  );
}