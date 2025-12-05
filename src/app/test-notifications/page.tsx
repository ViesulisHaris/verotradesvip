'use client';

import { useState } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import TorchCard from '@/components/TorchCard';
import { useToastContext } from '@/contexts/ToastContext';

export default function TestNotificationsPage() {
  const { showSuccess, showError, showWarning, showInfo } = useToastContext();
  const [testTradeData, setTestTradeData] = useState({
    symbol: 'AAPL',
    side: 'Buy',
    quantity: '100',
    pnl: '150.50'
  });

  const handleSuccessTest = () => {
    showSuccess(
      'Trade Logged Successfully!',
      `${testTradeData.side} ${testTradeData.quantity} ${testTradeData.symbol}. PnL: $${testTradeData.pnl}`,
      {
        duration: 4000,
        autoClose: true
      }
    );
  };

  const handleErrorTest = () => {
    showError(
      'Trade Failed',
      'Failed to save trade: Database connection timeout. Please try again.',
      {
        duration: 6000,
        autoClose: true
      }
    );
  };

  const handleWarningTest = () => {
    showWarning(
      'Incomplete Trade Data',
      'Some optional fields are missing. The trade will be saved but may lack important analysis data.',
      {
        duration: 5000,
        autoClose: true
      }
    );
  };

  const handleInfoTest = () => {
    showInfo(
      'Trade Validation',
      'Your trade meets all risk management criteria and is ready to be logged.',
      {
        duration: 4000,
        autoClose: true
      }
    );
  };

  const handleMultipleToasts = () => {
    showSuccess('First Trade', 'AAPL trade logged successfully');
    setTimeout(() => showError('Second Trade Failed', 'GOOGL trade failed to save'), 500);
    setTimeout(() => showWarning('Warning', 'MSFT trade has missing data'), 1000);
    setTimeout(() => showInfo('Info', 'TSLA trade validated'), 1500);
  };

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Notification System Test</h1>
          <p className="text-gray-400">Test the toast notification system with different scenarios</p>
        </div>

        {/* Test Form */}
        <TorchCard className="p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Test Trade Data</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Symbol</label>
              <input
                type="text"
                value={testTradeData.symbol}
                onChange={(e) => setTestTradeData(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                placeholder="e.g., AAPL"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Side</label>
              <select
                value={testTradeData.side}
                onChange={(e) => setTestTradeData(prev => ({ ...prev, side: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-verotrade-gold-primary focus:outline-none transition-colors"
              >
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Quantity</label>
              <input
                type="number"
                value={testTradeData.quantity}
                onChange={(e) => setTestTradeData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">PnL</label>
              <input
                type="number"
                value={testTradeData.pnl}
                onChange={(e) => setTestTradeData(prev => ({ ...prev, pnl: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        </TorchCard>

        {/* Notification Test Buttons */}
        <TorchCard className="p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Notification Tests</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleSuccessTest}
              className="px-6 py-3 bg-profit/20 border border-profit text-profit rounded-lg font-medium hover:bg-profit/30 transition-colors"
            >
              Test Success Notification
            </button>

            <button
              onClick={handleErrorTest}
              className="px-6 py-3 bg-loss/20 border border-loss text-loss rounded-lg font-medium hover:bg-loss/30 transition-colors"
            >
              Test Error Notification
            </button>

            <button
              onClick={handleWarningTest}
              className="px-6 py-3 bg-yellow-500/20 border border-yellow-500 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500/30 transition-colors"
            >
              Test Warning Notification
            </button>

            <button
              onClick={handleInfoTest}
              className="px-6 py-3 bg-blue-500/20 border border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
            >
              Test Info Notification
            </button>

            <button
              onClick={handleMultipleToasts}
              className="px-6 py-3 bg-verotrade-gold-primary/20 border border-verotrade-gold-primary text-verotrade-gold-primary rounded-lg font-medium hover:bg-verotrade-gold-primary/30 transition-colors md:col-span-2"
            >
              Test Multiple Notifications (Sequential)
            </button>
          </div>
        </TorchCard>

      </div>
    </UnifiedLayout>
  );
}