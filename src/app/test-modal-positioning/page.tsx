'use client';

import { useState } from 'react';
import { Edit, Trash2, X } from 'lucide-react';

// Test Modal components (copied from TradeHistory with the fixes)
const DeleteModal = ({ 
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-red-500/20 relative z-[101]">
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

const EditModal = ({ 
  isOpen, 
  onClose, 
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <div className="bg-surface rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gold/20 relative z-[101]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Trade</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Symbol</label>
              <input
                type="text"
                defaultValue="AAPL"
                className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Side</label>
              <select
                defaultValue="Buy"
                className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold"
              >
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
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
              onClick={onSave}
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

export default function TestModalPositioning() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Modal Positioning Test</h1>
        
        <div className="mb-8 text-gray-300">
          <p className="mb-4">This page tests the modal positioning fixes. Try the following:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Scroll down the page to different positions</li>
            <li>Click the "Open Edit Modal" button - the modal should appear centered in the viewport</li>
            <li>Click the "Open Delete Modal" button - the modal should appear centered in the viewport</li>
            <li>Verify that the modals appear above all other content regardless of scroll position</li>
            <li>Check that the background scroll is prevented when modals are open</li>
          </ol>
        </div>

        <div className="flex gap-4 mb-12">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-6 py-3 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Open Edit Modal
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Open Delete Modal
          </button>
        </div>

        {/* Generate lots of content to enable scrolling */}
        <div className="space-y-8">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-surface rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Section {i + 1}</h2>
              <p className="text-gray-300 mb-4">
                This is test content to create scrolling. The modal positioning should work correctly 
                regardless of where you are on the page when you open a modal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 rounded p-4">
                  <h3 className="text-gold font-medium mb-2">Feature {i + 1}.1</h3>
                  <p className="text-gray-400 text-sm">Test content for modal positioning verification.</p>
                </div>
                <div className="bg-black/30 rounded p-4">
                  <h3 className="text-gold font-medium mb-2">Feature {i + 1}.2</h3>
                  <p className="text-gray-400 text-sm">More content to test scroll behavior.</p>
                </div>
                <div className="bg-black/30 rounded p-4">
                  <h3 className="text-gold font-medium mb-2">Feature {i + 1}.3</h3>
                  <p className="text-gray-400 text-sm">Additional test content section.</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-6 py-3 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors flex items-center gap-2 mx-auto"
          >
            <Edit className="w-4 h-4" />
            Test Modal from Bottom of Page
          </button>
        </div>
      </div>

      {/* Modals */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          alert('Edit modal save clicked!');
          setShowEditModal(false);
        }}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          alert('Delete modal confirm clicked!');
          setShowDeleteModal(false);
        }}
        tradeSymbol="TEST"
      />
    </div>
  );
}