'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Save, X } from 'lucide-react';
import BaseModal from './BaseModal';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';

// Trade interface
interface Trade {
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
  emotional_state?: string;
  strategies?: {
    id: string;
    name: string;
    rules?: string[];
  };
  notes?: string;
  market?: string;
}

export interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTrade: Partial<Trade>) => Promise<void>;
  trade: Trade | null;
}

const EditTradeModal: React.FC<EditTradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trade
}) => {
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'Buy' as 'Buy' | 'Sell',
    quantity: '',
    entry_price: '',
    exit_price: '',
    pnl: '',
    trade_date: '',
    entry_time: '',
    exit_time: '',
    emotional_state: '',
    market: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when trade changes
  useEffect(() => {
    if (trade) {
      console.log('🎭 [EditTradeModal] Initializing form with trade:', trade);
      setFormData({
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity.toString(),
        entry_price: trade.entry_price.toString(),
        exit_price: trade.exit_price?.toString() || '',
        pnl: trade.pnl?.toString() || '',
        trade_date: trade.trade_date,
        entry_time: trade.entry_time || '',
        exit_time: trade.exit_time || '',
        emotional_state: trade.emotional_state || '',
        market: trade.market || '',
        notes: trade.notes || ''
      });
      setErrors({});
    }
  }, [trade]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.entry_price || parseFloat(formData.entry_price) <= 0) {
      newErrors.entry_price = 'Entry price must be greater than 0';
    }

    if (formData.exit_price && parseFloat(formData.exit_price) <= 0) {
      newErrors.exit_price = 'Exit price must be greater than 0';
    }

    if (!formData.trade_date) {
      newErrors.trade_date = 'Trade date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trade || !validateForm()) {
      console.log('🎭 [EditTradeModal] Form validation failed');
      return;
    }

    setIsSubmitting(true);
    console.log('🎭 [EditTradeModal] Submitting form with data:', formData);

    try {
      const updatedTrade = {
        symbol: formData.symbol.trim(),
        side: formData.side,
        quantity: parseFloat(formData.quantity) || 0,
        entry_price: parseFloat(formData.entry_price) || 0,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
        trade_date: formData.trade_date,
        entry_time: formData.entry_time || undefined,
        exit_time: formData.exit_time || undefined,
        emotional_state: formData.emotional_state || undefined,
        market: formData.market || undefined,
        notes: formData.notes || undefined
      };

      await onSave(updatedTrade);
      console.log('🎭 [EditTradeModal] Trade updated successfully');
      onClose();
    } catch (error) {
      console.error('🎭 [EditTradeModal] Error updating trade:', error);
      setErrors({ submit: 'Failed to update trade. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update emotional state
  const updateEmotionalState = (emotions: string[] | { [key: string]: boolean }) => {
    const emotionArray = Array.isArray(emotions) ? emotions : 
      Object.entries(emotions).filter(([_, isSelected]) => isSelected).map(([emotion]) => emotion);
    
    setFormData(prev => ({
      ...prev,
      emotional_state: emotionArray.length > 0 ? emotionArray.join(', ') : ''
    }));
  };

  // Input field component
  const InputField = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    error,
    options,
    step
  }: {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    options?: string[];
    step?: string;
  }) => {
    const inputElement = type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface border ${error ? 'border-red-500' : 'border-white/10'} rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold transition-colors`}
        required={required}
      >
        {options?.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        className={`w-full bg-surface border ${error ? 'border-red-500' : 'border-white/10'} rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold transition-colors`}
        required={required}
      />
    );

    return (
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {inputElement}
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  };

  if (!isOpen || !trade) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trade"
      size="xl"
      className="edit-trade-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Trade Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Symbol"
              value={formData.symbol}
              onChange={(value) => setFormData({ ...formData, symbol: value })}
              placeholder="e.g., AAPL"
              required
              error={errors.symbol}
            />
            <InputField
              label="Side"
              type="select"
              value={formData.side}
              onChange={(value) => setFormData({ ...formData, side: value as 'Buy' | 'Sell' })}
              options={['Buy', 'Sell']}
              required
            />
            <InputField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(value) => setFormData({ ...formData, quantity: value })}
              placeholder="e.g., 100"
              required
              error={errors.quantity}
            />
            <InputField
              label="Market"
              value={formData.market}
              onChange={(value) => setFormData({ ...formData, market: value })}
              placeholder="e.g., stock, crypto, forex, futures"
            />
          </div>
        </div>

        {/* Price Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
            Price Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Entry Price"
              type="number"
              step="0.01"
              value={formData.entry_price}
              onChange={(value) => setFormData({ ...formData, entry_price: value })}
              placeholder="e.g., 150.50"
              required
              error={errors.entry_price}
            />
            <InputField
              label="Exit Price"
              type="number"
              step="0.01"
              value={formData.exit_price}
              onChange={(value) => setFormData({ ...formData, exit_price: value })}
              placeholder="e.g., 155.75"
              error={errors.exit_price}
            />
            <InputField
              label="P&L"
              type="number"
              step="0.01"
              value={formData.pnl}
              onChange={(value) => setFormData({ ...formData, pnl: value })}
              placeholder="e.g., 525.00"
            />
            <InputField
              label="Trade Date"
              type="date"
              value={formData.trade_date}
              onChange={(value) => setFormData({ ...formData, trade_date: value })}
              required
              error={errors.trade_date}
            />
          </div>
        </div>

        {/* Time Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
            Time Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Entry Time"
              type="time"
              value={formData.entry_time}
              onChange={(value) => setFormData({ ...formData, entry_time: value })}
            />
            <InputField
              label="Exit Time"
              type="time"
              value={formData.exit_time}
              onChange={(value) => setFormData({ ...formData, exit_time: value })}
            />
          </div>
        </div>

        {/* Emotional State */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
            Emotional State
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              How did you feel during this trade?
            </label>
            <EmotionalStateInput
              value={formData.emotional_state.split(', ').filter(e => e.trim())}
              onChange={updateEmotionalState}
              placeholder="Select emotions you felt during this trade..."
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
            Notes
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Additional notes about this trade
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this trade..."
              rows={4}
              className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold resize-none"
            />
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-surface border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .edit-trade-modal {
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .edit-trade-modal::-webkit-scrollbar {
          width: 8px;
        }
        
        .edit-trade-modal::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .edit-trade-modal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        .edit-trade-modal::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </BaseModal>
  );
};

export default EditTradeModal;