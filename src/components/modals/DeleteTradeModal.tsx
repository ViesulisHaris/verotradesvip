'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import BaseModal from './BaseModal';

export interface DeleteTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tradeSymbol: string;
  tradeId?: string;
  isLoading?: boolean;
}

const DeleteTradeModal: React.FC<DeleteTradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tradeSymbol,
  tradeId,
  isLoading = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('🎭 [DeleteTradeModal] Modal opened for trade:', tradeSymbol);
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen, tradeSymbol]);

  // Handle confirmation
  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    console.log('🎭 [DeleteTradeModal] Confirming deletion for trade:', tradeSymbol);

    try {
      await onConfirm();
      console.log('🎭 [DeleteTradeModal] Trade deleted successfully');
      onClose();
    } catch (err) {
      console.error('🎭 [DeleteTradeModal] Error deleting trade:', err);
      setError('Failed to delete trade. Please try again.');
      setIsDeleting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isDeleting) {
      console.log('🎭 [DeleteTradeModal] Modal closing');
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Trade"
      size="sm"
      className="delete-trade-modal"
      closeOnOverlayClick={!isDeleting}
      closeOnEscape={!isDeleting}
    >
      <div className="space-y-6">
        {/* Warning Section */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Warning: This action cannot be undone</h3>
              <p className="text-gray-300 text-sm">
                Deleting this trade will permanently remove it from your trading history and all associated statistics.
              </p>
            </div>
          </div>
        </div>

        {/* Trade Information */}
        <div className="bg-surface border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-white font-medium text-lg">{tradeSymbol}</p>
              <p className="text-gray-400 text-sm">Trade ID: {tradeId || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="text-center space-y-2">
          <p className="text-gray-300">
            Are you sure you want to delete this trade?
          </p>
          <p className="text-gray-400 text-sm">
            This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-surface border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="flex-1 px-4 py-3 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Trade
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-500 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .delete-trade-modal {
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .delete-trade-modal::-webkit-scrollbar {
          width: 8px;
        }
        
        .delete-trade-modal::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .delete-trade-modal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        .delete-trade-modal::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </BaseModal>
  );
};

export default DeleteTradeModal;