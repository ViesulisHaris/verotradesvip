'use client';

import React, { useState } from 'react';
import { Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import EditTradeModal from '@/components/modals/EditTradeModal';
import DeleteTradeModal from '@/components/modals/DeleteTradeModal';

// Mock trade data for testing
const mockTrade = {
  id: 'test-trade-123',
  symbol: 'AAPL',
  side: 'Buy' as const,
  quantity: 100,
  entry_price: 150.50,
  exit_price: 155.75,
  pnl: 525.00,
  trade_date: '2024-01-15',
  entry_time: '09:30',
  exit_time: '10:45',
  emotional_state: 'Confident, Patient',
  strategies: {
    id: 'strategy-123',
    name: 'Momentum Trading'
  },
  notes: 'Good breakout above resistance level with strong volume confirmation.',
  market: 'stock'
};

export default function TestNewModals() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const addTestResult = (result: string, success: boolean = true) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${result}`]);
  };

  const handleEditSave = async (updatedTrade: any) => {
    console.log('🧪 [TEST] Edit modal save called with:', updatedTrade);
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSaving(false);
    addTestResult(`Edit modal saved successfully with data: ${JSON.stringify(updatedTrade, null, 2)}`);
  };

  const handleDeleteConfirm = async () => {
    console.log('🧪 [TEST] Delete modal confirm called');
    setIsDeleting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsDeleting(false);
    addTestResult(`Delete modal confirmed successfully for trade: ${mockTrade.symbol}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">New Modal Components Test</h1>
        
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click "Open Edit Modal" to test the new EditTradeModal component</li>
            <li>Click "Open Delete Modal" to test the new DeleteTradeModal component</li>
            <li>Test all modal features: opening, closing, form submission, validation</li>
            <li>Verify proper z-index layering and backdrop behavior</li>
            <li>Test keyboard navigation (ESC key, Tab key)</li>
            <li>Test body scroll lock functionality</li>
            <li>Test responsive design on different screen sizes</li>
          </ol>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-3 font-medium"
          >
            <Edit className="w-5 h-5" />
            Open Edit Modal
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-3 font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Open Delete Modal
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Test Results</h2>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
              >
                Clear Results
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-gray-900 rounded">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mock Trade Info */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Mock Trade Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Symbol:</span> <span className="text-white font-medium">{mockTrade.symbol}</span></div>
            <div><span className="text-gray-400">Side:</span> <span className="text-white font-medium">{mockTrade.side}</span></div>
            <div><span className="text-gray-400">Quantity:</span> <span className="text-white font-medium">{mockTrade.quantity}</span></div>
            <div><span className="text-gray-400">Entry Price:</span> <span className="text-white font-medium">${mockTrade.entry_price}</span></div>
            <div><span className="text-gray-400">Exit Price:</span> <span className="text-white font-medium">${mockTrade.exit_price}</span></div>
            <div><span className="text-gray-400">P&L:</span> <span className={`font-medium ${mockTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>${mockTrade.pnl}</span></div>
            <div><span className="text-gray-400">Market:</span> <span className="text-white font-medium">{mockTrade.market}</span></div>
            <div><span className="text-gray-400">Emotions:</span> <span className="text-white font-medium">{mockTrade.emotional_state}</span></div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Modal States
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Edit Modal:</span>
                <span className={`font-medium ${showEditModal ? 'text-green-400' : 'text-gray-500'}`}>
                  {showEditModal ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delete Modal:</span>
                <span className={`font-medium ${showDeleteModal ? 'text-green-400' : 'text-gray-500'}`}>
                  {showDeleteModal ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              Loading States
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Edit Saving:</span>
                <span className={`font-medium ${isSaving ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {isSaving ? 'IN PROGRESS' : 'IDLE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delete Processing:</span>
                <span className={`font-medium ${isDeleting ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {isDeleting ? 'IN PROGRESS' : 'IDLE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTradeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          addTestResult('Edit modal closed successfully');
        }}
        onSave={handleEditSave}
        trade={mockTrade}
      />

      {/* Delete Modal */}
      <DeleteTradeModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          addTestResult('Delete modal closed successfully');
        }}
        onConfirm={handleDeleteConfirm}
        tradeSymbol={mockTrade.symbol}
        tradeId={mockTrade.id}
        isLoading={isDeleting}
      />
    </div>
  );
}