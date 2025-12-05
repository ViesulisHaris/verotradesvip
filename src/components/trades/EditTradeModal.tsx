'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import InputGroup from './InputGroup';
import { ALL_EMOTIONS, Emotion } from '@/constants/emotions';
import { TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

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

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onSave: (updatedTrade: Partial<Trade>) => void;
  isLoading?: boolean;
}

export default function EditTradeModal({
  isOpen,
  onClose,
  trade,
  onSave,
  isLoading = false
}: EditTradeModalProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'Buy' as 'Buy' | 'Sell',
    quantity: '',
    entry: '',
    exit: '',
    pnl: '',
    market: 'stock' as 'stock' | 'crypto' | 'forex' | 'futures',
    date: '',
    time: '',
    exitTime: '',
    emotions: [] as string[],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when trade changes
  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol || '',
        side: trade.side || 'Buy',
        quantity: trade.quantity?.toString() || '',
        entry: trade.entry_price?.toString() || '',
        exit: trade.exit_price?.toString() || '',
        pnl: trade.pnl?.toString() || '',
        market: trade.market || 'stock',
        date: trade.trade_date || '',
        time: trade.entry_time || '',
        exitTime: trade.exit_time || '',
        emotions: trade.emotional_state || [],
        notes: trade.notes || ''
      });
      setErrors({});
    }
  }, [trade]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEmotionToggle = (emotion: string) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.entry || parseFloat(formData.entry) <= 0) {
      newErrors.entry = 'Entry price must be greater than 0';
    }

    if (!formData.exit || parseFloat(formData.exit) <= 0) {
      newErrors.exit = 'Exit price must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !trade) return;

    const updatedTrade: Partial<Trade> = {
      symbol: formData.symbol.trim(),
      side: formData.side,
      quantity: parseFloat(formData.quantity),
      entry_price: parseFloat(formData.entry),
      exit_price: parseFloat(formData.exit),
      pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
      market: formData.market,
      trade_date: formData.date,
      entry_time: formData.time || undefined,
      exit_time: formData.exitTime || undefined,
      emotional_state: formData.emotions.length > 0 ? formData.emotions : undefined,
      notes: formData.notes.trim() || undefined
    };

    onSave(updatedTrade);
  };

  const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
    'FOMO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    'REVENGE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    'TILT': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    'OVERRISK': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    'PATIENCE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    'REGRET': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    'DISCIPLINE': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    'CONFIDENT': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    'ANXIOUS': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trade"
      size="lg"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Market and Symbol */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2 text-warm-off-white">Market</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {(['stock', 'crypto', 'forex', 'futures'] as const).map(market => (
                <button
                  key={market}
                  type="button"
                  onClick={() => handleInputChange('market', market)}
                  className={`px-3 py-2 rounded-lg border transition-all capitalize ${
                    formData.market === market
                      ? 'bg-gold/10 border-gold text-gold'
                      : 'bg-surface border-input text-warm-off-white hover:border-gold/50'
                  }`}
                >
                  {market}
                </button>
              ))}
            </div>
          </div>
          
          <InputGroup
            label="Symbol"
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
            placeholder="e.g., AAPL, BTCUSD"
            error={errors.symbol}
          />
        </div>

        {/* Side and Quantity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2 text-warm-off-white">Side</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('side', 'Buy')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  formData.side === 'Buy'
                    ? 'bg-green-500/10 border-green-500 text-green-400'
                    : 'bg-surface border-input text-warm-off-white hover:border-green-500/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Buy</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('side', 'Sell')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  formData.side === 'Sell'
                    ? 'bg-red-500/10 border-red-500 text-red-400'
                    : 'bg-surface border-input text-warm-off-white hover:border-red-500/50'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Sell</span>
              </button>
            </div>
          </div>
          
          <InputGroup
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            placeholder="0.00"
            error={errors.quantity}
          />
        </div>

        {/* Entry and Exit Prices */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputGroup
            label="Entry Price"
            type="number"
            step="0.01"
            value={formData.entry}
            onChange={(e) => handleInputChange('entry', e.target.value)}
            placeholder="0.00"
            error={errors.entry}
          />
          
          <InputGroup
            label="Exit Price"
            type="number"
            step="0.01"
            value={formData.exit}
            onChange={(e) => handleInputChange('exit', e.target.value)}
            placeholder="0.00"
            error={errors.exit}
          />
        </div>

        {/* P&L and Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputGroup
            label="P&L"
            type="number"
            step="0.01"
            value={formData.pnl}
            onChange={(e) => handleInputChange('pnl', e.target.value)}
            placeholder="0.00"
          />
          
          <InputGroup
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={errors.date}
          />
        </div>

        {/* Entry and Exit Times */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputGroup
            label="Entry Time"
            type="time"
            value={formData.time}
            onChange={(e) => handleInputChange('time', e.target.value)}
          />
          
          <InputGroup
            label="Exit Time"
            type="time"
            value={formData.exitTime}
            onChange={(e) => handleInputChange('exitTime', e.target.value)}
          />
        </div>

        {/* Emotions */}
        <div>
          <label className="block text-sm font-medium mb-2 sm:mb-3 text-warm-off-white">Emotions</label>
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
            {formData.emotions.map(emotion => {
              const color = emotionColors[emotion] || emotionColors['NEUTRAL'];
              return (
                <div
                  key={emotion}
                  className={`px-3 py-1 rounded-full text-sm border ${color?.bg || ''} ${color?.text || ''} ${color?.border || ''}`}
                >
                  {emotion}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
            {ALL_EMOTIONS.map(emotion => (
              <button
                key={emotion}
                type="button"
                onClick={() => handleEmotionToggle(emotion)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all capitalize ${
                  formData.emotions.includes(emotion)
                    ? 'bg-gold/10 border-gold text-gold'
                    : 'bg-surface border-input text-warm-off-white hover:border-gold/50'
                }`}
              >
                {emotion.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2 text-warm-off-white">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes about this trade..."
            className="w-full h-20 sm:h-24 px-3 sm:px-4 py-2 sm:py-3 bg-surface border border-input rounded-lg text-warm-off-white placeholder-gray-500 focus:outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,101,0.2)] transition-all resize-none text-sm sm:text-base"
            style={{ borderRadius: '0.5rem' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-input">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-surface border border-input text-warm-off-white rounded-lg hover:bg-surface-hover transition-all text-sm sm:text-base"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gold text-background rounded-lg hover:bg-gold-hover transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}