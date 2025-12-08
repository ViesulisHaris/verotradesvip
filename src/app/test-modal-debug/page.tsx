'use client';

import { useState } from 'react';
import { Edit, Trash2, XCircle } from 'lucide-react';

// Test Delete Modal
const TestDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tradeSymbol 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tradeSymbol: string;
}) => {
  console.log('TestDeleteModal rendered with isOpen:', isOpen);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-red-500/20 relative z-[10000]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Delete Trade</h2>
        </div>
       
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete your {tradeSymbol} trade? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-surface border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors"
          >
            Delete Trade
          </button>
        </div>
      </div>
    </div>
  );
};

// Test Edit Modal
const TestEditModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  trade 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTrade: any) => void;
  trade: any;
}) => {
  console.log('TestEditModal rendered with isOpen:', isOpen);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="bg-surface rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gold/20 relative z-[10000]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Trade</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Symbol</label>
              <input
                type="text"
                value={trade?.symbol || ''}
                className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Side</label>
              <input
                type="text"
                value={trade?.side || ''}
                className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold"
                readOnly
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(trade)}
              className="flex-1 px-4 py-2 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ModalDebugPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalState, setModalState] = useState<{
    editOpen: boolean;
    deleteOpen: boolean;
    lastAction: string | null;
  }>({
    editOpen: false,
    deleteOpen: false,
    lastAction: null
  });

  const testTrade = {
    id: 'test-1',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    entry_time: '09:30',
    exit_time: '10:45',
    emotional_state: 'Confident',
    market: 'stock',
    notes: 'Test trade for debugging modals'
  };

  const handleEditClick = () => {
    console.log('Edit button clicked');
    setModalState(prev => ({
      ...prev,
      editOpen: true,
      lastAction: 'edit-click'
    }));
    setShowEditModal(true);
  };

  const handleDeleteClick = () => {
    console.log('Delete button clicked');
    setModalState(prev => ({
      ...prev,
      deleteOpen: true,
      lastAction: 'delete-click'
    }));
    setShowDeleteModal(true);
  };

  const handleEditClose = () => {
    console.log('Edit modal close button clicked');
    setModalState(prev => ({
      ...prev,
      editOpen: false,
      lastAction: 'edit-close'
    }));
    setShowEditModal(false);
  };

  const handleDeleteClose = () => {
    console.log('Delete modal close button clicked');
    setModalState(prev => ({
      ...prev,
      deleteOpen: false,
      lastAction: 'delete-close'
    }));
    setShowDeleteModal(false);
  };

  const handleEditSave = (updatedTrade: any) => {
    console.log('Edit modal save clicked', updatedTrade);
    setModalState(prev => ({
      ...prev,
      editOpen: false,
      lastAction: 'edit-save'
    }));
    setShowEditModal(false);
  };

  const handleDeleteConfirm = () => {
    console.log('Delete modal confirm clicked');
    setModalState(prev => ({
      ...prev,
      deleteOpen: false,
      lastAction: 'delete-confirm'
    }));
    setShowDeleteModal(false);
  };

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Modal Debug Test Page</h1>
        
        {/* Debug Information */}
        <div className="bg-surface rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Debug Information</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>Edit Modal State: {showEditModal ? 'OPEN' : 'CLOSED'}</p>
            <p>Delete Modal State: {showDeleteModal ? 'OPEN' : 'CLOSED'}</p>
            <p>Last Action: {modalState.lastAction || 'None'}</p>
            <p>Modal State Edit: {modalState.editOpen ? 'OPEN' : 'CLOSED'}</p>
            <p>Modal State Delete: {modalState.deleteOpen ? 'OPEN' : 'CLOSED'}</p>
          </div>
        </div>

        {/* Test Trade Card */}
        <div className="bg-surface rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Test Trade</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm">Symbol</p>
              <p className="text-white font-medium">{testTrade.symbol}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Side</p>
              <p className="text-white font-medium">{testTrade.side}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Entry Price</p>
              <p className="text-white font-medium">${testTrade.entry_price}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Exit Price</p>
              <p className="text-white font-medium">${testTrade.exit_price}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Trade
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Trade
            </button>
          </div>
        </div>

        {/* Z-index Test Elements */}
        <div className="bg-surface rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Z-index Test Elements</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded" style={{zIndex: 50, position: 'relative'}}>
              <p>Element with z-index: 50</p>
            </div>
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded" style={{zIndex: 100, position: 'relative'}}>
              <p>Element with z-index: 100 (same as original modal)</p>
            </div>
            <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded" style={{zIndex: 101, position: 'relative'}}>
              <p>Element with z-index: 101 (same as original modal content)</p>
            </div>
            <div className="p-4 bg-purple-500/20 border border-purple-500/50 rounded" style={{zIndex: 9999, position: 'relative'}}>
              <p>Element with z-index: 9999 (same as test modal)</p>
            </div>
          </div>
        </div>

        {/* Console Test */}
        <div className="bg-surface rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Console Test</h2>
          <p className="text-gray-300 mb-4">Open your browser console to see debug messages when clicking buttons.</p>
          <button
            onClick={() => console.log('Test button clicked - console is working')}
            className="px-4 py-2 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors"
          >
            Test Console
          </button>
        </div>
      </div>

      {/* Test Modals */}
      <TestEditModal
        isOpen={showEditModal}
        onClose={handleEditClose}
        onSave={handleEditSave}
        trade={testTrade}
      />

      <TestDeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        tradeSymbol={testTrade.symbol}
      />
    </div>
  );
}