'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useRouter } from 'next/navigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import TorchCard from '@/components/TorchCard';
import { useToastContext } from '@/contexts/ToastContext';

interface FormState {
  market: { stock: boolean; crypto: boolean; forex: boolean; futures: boolean };
  symbol: string;
  strategy_id: string;
  date: string;
  side: string;
  quantity: string;
  stop_loss: string;
  take_profit: string;
  pnl: string;
  entry_time: string;
  exit_time: string;
  duration: string;
  emotional_state: string;
}

export default function LogTradePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    market: { stock: false, crypto: false, forex: false, futures: false },
    symbol: '',
    strategy_id: '',
    date: new Date().toISOString().split('T')[0] || '',
    side: 'Buy',
    quantity: '',
    stop_loss: '',
    take_profit: '',
    pnl: '',
    entry_time: '',
    exit_time: '',
    duration: '',
    emotional_state: 'Neutral',
  });
  const [strategies, setStrategies] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isEmotionOpen, setIsEmotionOpen] = useState(false);
  const { showSuccess, showError } = useToastContext();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('strategies').select('id, name').eq('user_id', user.id);
        setStrategies(data ?? []);
      }
    };
    load();
  }, []);

  // Calculate duration between entry and exit times
  const calculateDuration = (entryTime: string, exitTime: string): string => {
    if (!entryTime || !exitTime) return '';
    
    // Parse times with null checks
    const entryTimeParts = entryTime.split(':');
    const exitTimeParts = exitTime.split(':');
    
    if (entryTimeParts.length !== 2 || exitTimeParts.length !== 2) return '';
    
    const entryHours = parseInt(entryTimeParts[0] || '0', 10);
    const entryMinutes = parseInt(entryTimeParts[1] || '0', 10);
    const exitHours = parseInt(exitTimeParts[0] || '0', 10);
    const exitMinutes = parseInt(exitTimeParts[1] || '0', 10);
    
    // Check if parsing was successful
    if (isNaN(entryHours) || isNaN(entryMinutes) || isNaN(exitHours) || isNaN(exitMinutes)) return '';
    
    // Convert to minutes
    let entryTotalMinutes = entryHours * 60 + entryMinutes;
    let exitTotalMinutes = exitHours * 60 + exitMinutes;
    
    // Handle case where exit time is on the next day
    if (exitTotalMinutes < entryTotalMinutes) {
      exitTotalMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    // Calculate difference
    const diffMinutes = exitTotalMinutes - entryTotalMinutes;
    
    // Convert to hours and minutes
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    // Format the result
    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };

  // Update duration when entry_time or exit_time changes
  useEffect(() => {
    const duration = calculateDuration(form.entry_time, form.exit_time);
    setForm(prev => ({ ...prev, duration }));
  }, [form.entry_time, form.exit_time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Authentication Error', 'You must be logged in to save trades.');
        return;
      }

      const market = Object.keys(form.market).filter(k => form.market[k as keyof typeof form.market]).join(', ') || null;

      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        market,
        symbol: form.symbol,
        strategy_id: form.strategy_id || null,
        trade_date: form.date,
        side: form.side,
        quantity: parseFloat(form.quantity) || null,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
        take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        entry_time: form.entry_time || null,
        exit_time: form.exit_time || null,
        emotional_state: form.emotional_state,
      });

      if (error) {
        console.error('Error saving trade:', error);
        console.log('🔍 [TOAST_DEBUG] Attempting to show error toast');
        showError('Trade Failed', `Failed to save trade: ${error.message}`);
        console.log('🔍 [TOAST_DEBUG] Error toast shown');
      } else {
        // Create a descriptive success message with trade details
        const marketType = Object.keys(form.market).find(k => form.market[k as keyof typeof form.market]) || 'Unknown';
        const pnlText = form.pnl ? (parseFloat(form.pnl) > 0 ? `+$${form.pnl}` : `-$${Math.abs(parseFloat(form.pnl))}`) : 'No PnL';
        
        console.log('🔍 [TOAST_DEBUG] Attempting to show success toast');
        console.log('🔍 [TOAST_DEBUG] Trade data:', { marketType, side: form.side, quantity: form.quantity, symbol: form.symbol, pnlText });
        
        const toastId = showSuccess(
          'Trade Logged Successfully!',
          `${form.side} ${form.quantity} ${form.symbol} at ${marketType} market. ${pnlText}`,
          {
            duration: 3000,
            autoClose: true
          }
        );
        
        console.log('🔍 [TOAST_DEBUG] Toast ID returned:', toastId);
        console.log('🔍 [TOAST_DEBUG] Success toast shown');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          console.log('🔍 [TOAST_DEBUG] About to redirect to dashboard');
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showError('Unexpected Error', 'An unexpected error occurred while saving your trade.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketToggle = (marketType: keyof typeof form.market) => {
    setForm(prev => ({
      ...prev,
      market: {
        // Reset all market types to false, then set only the selected one to true
        stock: marketType === 'stock' ? !prev.market.stock : false,
        crypto: marketType === 'crypto' ? !prev.market.crypto : false,
        forex: marketType === 'forex' ? !prev.market.forex : false,
        futures: marketType === 'futures' ? !prev.market.futures : false,
        // Set the selected market type to true
        [marketType]: !prev.market[marketType]
      }
    }));
  };

  const emotionOptions = ['Neutral', 'Greed', 'Fear', 'Confidence', 'Frustration'];

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header with text reveal animation */}
        <div className="mb-8 text-reveal">
          <h1 className="text-4xl font-bold text-white mb-2">Log New Trade</h1>
          <p className="text-gray-400">Record your trading activity with detailed analysis</p>
        </div>

        {/* Main form with TorchCard spotlight effect */}
        <TorchCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Market Context Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white text-reveal-delay-1">Market Context</h2>
              
              {/* Market Type Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Market Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['stock', 'crypto', 'forex', 'futures'] as const).map((marketType) => (
                    <button
                      key={marketType}
                      type="button"
                      onClick={() => handleMarketToggle(marketType)}
                      className={`px-4 py-3 rounded-lg border transition-all duration-300 capitalize ${
                        form.market[marketType]
                          ? 'bg-verotrade-gold-primary/20 border-verotrade-gold-primary text-verotrade-gold-primary'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {marketType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Symbol</label>
                  <input
                    type="text"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                    placeholder="e.g., AAPL, BTCUSD"
                    required
                  />
                </div>

                {/* Strategy Dropdown */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Strategy</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStrategyOpen(!isStrategyOpen)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-left focus:border-verotrade-gold-primary focus:outline-none transition-colors flex items-center justify-between"
                    >
                      <span>{form.strategy_id ? strategies.find(s => s.id === form.strategy_id)?.name || 'Select Strategy' : 'None'}</span>
                      <svg className={`w-5 h-5 transition-transform ${isStrategyOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isStrategyOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg shadow-xl z-[9999]">
                        <button
                          type="button"
                          onClick={() => { setForm({ ...form, strategy_id: '' }); setIsStrategyOpen(false); }}
                          className="w-full px-4 py-3 text-left text-gray-400 hover:bg-white/5 transition-colors"
                        >
                          None
                        </button>
                        {strategies.map((strategy) => (
                          <button
                            key={strategy.id}
                            type="button"
                            onClick={() => { setForm({ ...form, strategy_id: strategy.id }); setIsStrategyOpen(false); }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors"
                          >
                            {strategy.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Details Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white text-reveal-delay-2">Execution Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Side Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Side</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Buy', 'Sell'].map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setForm({ ...form, side })}
                        className={`px-4 py-3 rounded-lg border transition-all duration-300 ${
                          form.side === side
                            ? side === 'Buy' 
                              ? 'bg-profit/20 border-profit text-profit'
                              : 'bg-loss/20 border-loss text-loss'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                {/* Date Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Entry Time */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Entry Time</label>
                  <input
                    type="time"
                    value={form.entry_time}
                    onChange={(e) => setForm({ ...form, entry_time: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Exit Time */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Exit Time</label>
                  <input
                    type="time"
                    value={form.exit_time}
                    onChange={(e) => setForm({ ...form, exit_time: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Duration Display */}
                {form.duration && (
                  <div className="md:col-span-2">
                    <div className="bg-verotrade-gold-primary/10 border border-verotrade-gold-primary/30 rounded-lg px-4 py-3 flex items-center space-x-3">
                      <svg className="w-5 h-5 text-verotrade-gold-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-sm text-gray-400">Duration:</span>
                        <span className="ml-2 text-white font-medium">{form.duration}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk & Outcome Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white text-reveal-delay-3">Risk & Outcome</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stop Loss */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Stop Loss</label>
                  <input
                    type="number"
                    value={form.stop_loss}
                    onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Take Profit */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Take Profit</label>
                  <input
                    type="number"
                    value={form.take_profit}
                    onChange={(e) => setForm({ ...form, take_profit: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-verotrade-gold-primary focus:outline-none transition-colors"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* PnL */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">PnL</label>
                  <input
                    type="number"
                    value={form.pnl}
                    onChange={(e) => setForm({ ...form, pnl: e.target.value })}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      form.pnl && parseFloat(form.pnl) > 0 
                        ? 'border-profit text-profit focus:border-profit' 
                        : form.pnl && parseFloat(form.pnl) < 0
                        ? 'border-loss text-loss focus:border-loss'
                        : 'border-white/10 focus:border-verotrade-gold-primary'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Emotional State Dropdown */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Emotional State</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEmotionOpen(!isEmotionOpen)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-left focus:border-verotrade-gold-primary focus:outline-none transition-colors flex items-center justify-between"
                    >
                      <span>{form.emotional_state}</span>
                      <svg className={`w-5 h-5 transition-transform ${isEmotionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isEmotionOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg shadow-xl z-[9999]">
                        {emotionOptions.map((emotion) => (
                          <button
                            key={emotion}
                            type="button"
                            onClick={() => { setForm({ ...form, emotional_state: emotion }); setIsEmotionOpen(false); }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors"
                          >
                            {emotion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button with Border Beam Animation */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="border-beam w-full py-4 rounded-xl font-semibold bg-verotrade-gold-secondary/80 text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-verotrade-gold-primary"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    <span>Saving Trade...</span>
                  </div>
                ) : (
                  <span>Save Trade</span>
                )}
              </button>
            </div>
          </form>
        </TorchCard>

      </div>
    </UnifiedLayout>
  );
}
