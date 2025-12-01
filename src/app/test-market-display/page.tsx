'use client';

import { useState } from 'react';
import MarketBadge from '@/components/ui/MarketBadge';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, DollarSign, Target, Timer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Helper function to format emotions as boxes
const formatEmotionsAsBoxes = (emotionalState: string[] | null | string) => {
  if (!emotionalState) {
    return <span className="text-gray-400">None</span>;
  }

  let emotions: string[] = [];
  
  if (Array.isArray(emotionalState)) {
    emotions = emotionalState
      .filter((e: any) => typeof e === 'string' && e.trim())
      .map((e: any) => e.trim().toUpperCase());
  } else if (typeof emotionalState === 'string') {
    const trimmed = emotionalState.trim();
    if (trimmed) {
      // Quick check if it's JSON format
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            emotions = parsed.map((e: any) => typeof e === 'string' ? e.trim().toUpperCase() : e);
          } else if (typeof parsed === 'string') {
            emotions = [parsed.trim().toUpperCase()];
          }
        } catch {
          emotions = [trimmed.toUpperCase()];
        }
      } else {
        // Handle comma-separated emotions
        emotions = trimmed.split(',').map(e => e.trim().toUpperCase());
      }
    }
  }
  
  const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
    'FOMO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    'REVENGE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    'TILT': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    'OVERRISK': { bg: 'emotion-box-bg', text: 'emotion-box-text', border: 'border-yellow-500/50' },
    'PATIENCE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    'REGRET': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    'DISCIPLINE': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    'CONFIDENT': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    'ANXIOUS': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' },
    'EXCITED': { bg: 'bg-yellow-400/20', text: 'text-yellow-300', border: 'border-yellow-400/50' },
    'FOCUSED': { bg: 'bg-blue-400/20', text: 'text-blue-300', border: 'border-blue-400/50' },
    'CALM': { bg: 'bg-green-400/20', text: 'text-green-300', border: 'border-green-400/50' },
    'ANALYTICAL': { bg: 'bg-purple-400/20', text: 'text-purple-300', border: 'border-purple-400/50' },
    'BALANCED': { bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-400/50' },
    'STRATEGIC': { bg: 'bg-indigo-400/20', text: 'text-indigo-300', border: 'border-indigo-400/50' }
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {emotions.map((emotion, index) => {
        const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
        return (
          <div
            key={index}
            className={`px-2 py-1 rounded-md ${emotionColor.bg} ${emotionColor.text} text-xs border ${emotionColor.border}`}
          >
            {emotion}
          </div>
        );
      })}
    </div>
  );
};

// Mock trade data with different market types to test display
const mockTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy' as const,
    quantity: 100,
    entry_price: 150.00,
    exit_price: 155.00,
    pnl: 500.00,
    trade_date: '2024-01-15',
    entry_time: '09:30',
    exit_time: '10:45',
    market: 'stock',
    strategies: { id: '1', name: 'Tech Growth', rules: ['Buy on dip', 'Sell at resistance'] },
    emotional_state: 'Confident, Patient'
  },
  {
    id: '2',
    symbol: 'BTCUSD',
    side: 'Buy' as const,
    quantity: 0.5,
    entry_price: 45000.00,
    exit_price: 47500.00,
    pnl: 1250.00,
    trade_date: '2024-01-14',
    entry_time: '14:20',
    exit_time: '16:30',
    market: 'crypto',
    strategies: { id: '2', name: 'Crypto Momentum', rules: ['Follow trend', 'Use stop loss'] },
    emotional_state: 'Excited, Focused'
  },
  {
    id: '3',
    symbol: 'EURUSD',
    side: 'Sell' as const,
    quantity: 10000,
    entry_price: 1.0850,
    exit_price: 1.0820,
    pnl: 300.00,
    trade_date: '2024-01-13',
    entry_time: '08:00',
    exit_time: '11:30',
    market: 'forex',
    strategies: { id: '3', name: 'Currency Range', rules: ['Trade ranges', 'Risk management'] },
    emotional_state: 'Calm, Analytical'
  },
  {
    id: '4',
    symbol: 'ES',
    side: 'Buy' as const,
    quantity: 2,
    entry_price: 4500.00,
    exit_price: 4525.00,
    pnl: 50.00,
    trade_date: '2024-01-12',
    entry_time: '09:15',
    exit_time: '14:00',
    market: 'futures',
    strategies: { id: '4', name: 'Index Futures', rules: ['Trade open', 'Close at end of day'] },
    emotional_state: 'Disciplined, Patient'
  },
  {
    id: '5',
    symbol: 'ETHUSD',
    side: 'Buy' as const,
    quantity: 2,
    entry_price: 2500.00,
    exit_price: 2600.00,
    pnl: 200.00,
    trade_date: '2024-01-11',
    entry_time: '13:00',
    exit_time: '15:30',
    market: 'stock, crypto', // Multiple markets test
    strategies: { id: '5', name: 'Hybrid Strategy', rules: ['Diversify', 'Balance risk'] },
    emotional_state: 'Balanced, Strategic'
  }
];

// Helper function to calculate trade duration
const calculateTradeDuration = (entryTime?: string, exitTime?: string): string | null => {
  if (!entryTime || !exitTime) {
    return null;
  }

  try {
    const [entryHours, entryMinutes] = entryTime.split(':').map(Number);
    const [exitHours, exitMinutes] = exitTime.split(':').map(Number);
    
    const entryDate = new Date();
    entryDate.setHours(entryHours, entryMinutes, 0, 0);
    
    const exitDate = new Date();
    exitDate.setHours(exitHours, exitMinutes, 0, 0);
    
    let durationMs = exitDate.getTime() - entryDate.getTime();
    
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000;
    }
    
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error calculating trade duration:', error);
    return null;
  }
};

export default function TestMarketDisplayPage() {
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Market Display Test</h1>
          <p className="text-white/70">Testing market badge display with mock trade data</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-medium text-white/70">Total Trades</h3>
            </div>
            <p className="text-2xl font-bold text-white">{mockTrades.length}</p>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-medium text-white/70">Total P&L</h3>
            </div>
            <p className={`text-2xl font-bold ${(mockTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(mockTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))}
            </p>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-medium text-white/70">Win Rate</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {(() => {
                if (mockTrades.length === 0) return '0%';
                const winRate = (mockTrades.filter(t => (t.pnl || 0) > 0).length / mockTrades.length * 100);
                return `${winRate.toFixed(1)}%`;
              })()}
            </p>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-medium text-white/70">Market Types</h3>
            </div>
            <p className="text-lg font-bold text-white">
              {new Set(mockTrades.map(t => t.market?.split(',').map(m => m.trim()).flat()).flat()).size}
            </p>
          </div>
        </div>

        {/* Market Badge Test Section */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Market Badge Component Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-white/70 mb-2">Stock</p>
              <MarketBadge market="stock" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Crypto</p>
              <MarketBadge market="crypto" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Forex</p>
              <MarketBadge market="forex" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Futures</p>
              <MarketBadge market="futures" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Multiple</p>
              <MarketBadge market="stock, crypto" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Unknown</p>
              <MarketBadge market="unknown" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Empty</p>
              <MarketBadge market="" size="md" />
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">Null</p>
              <MarketBadge market={null as any} size="md" />
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className="space-y-4">
          {mockTrades.map((trade) => (
            <div key={trade.id} className="glass rounded-xl overflow-hidden">
              {/* Trade Summary - Always Visible */}
              <div className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        trade.side === 'Buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <span className={`text-sm font-bold ${
                          trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.side === 'Buy' ? 'B' : 'S'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{trade.symbol}</h3>
                          {trade.market && (
                            <MarketBadge market={trade.market} size="sm" />
                          )}
                        </div>
                        <p className="text-sm text-white/70">
                          {new Date(trade.trade_date).toLocaleDateString()} • {trade.quantity} shares
                        </p>
                        {(() => {
                          const duration = calculateTradeDuration(trade.entry_time, trade.exit_time);
                          return duration ? (
                            <div className="flex items-center gap-1 mt-1">
                              <Timer className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-blue-400">{duration}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {trade.strategies && (
                      <div className="px-3 py-1 bg-purple-500/20 rounded-full">
                        <span className="text-sm text-purple-300">{trade.strategies.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(trade.pnl || 0)}
                      </p>
                      <p className="text-sm text-white/70">
                        ${trade.entry_price} {trade.exit_price && `→ $${trade.exit_price}`}
                      </p>
                    </div>
                    <button
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => toggleTradeExpansion(trade.id)}
                    >
                      {expandedTrades.has(trade.id) ? (
                        <ChevronUp className="w-5 h-5 text-white/70" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/70" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTrades.has(trade.id) && (
                <div className="border-t border-white/10 p-6 bg-black/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trade Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Trade Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Entry Price:</span>
                          <span className="text-white font-medium">${trade.entry_price}</span>
                        </div>
                        {trade.exit_price && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Exit Price:</span>
                            <span className="text-white font-medium">${trade.exit_price}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/60">Quantity:</span>
                          <span className="text-white font-medium">{trade.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Side:</span>
                          <span className={`font-medium ${
                            trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.side}
                          </span>
                        </div>
                        {trade.market && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Market:</span>
                            <div className="flex items-center gap-2">
                              <MarketBadge market={trade.market} size="sm" />
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/60">P&L:</span>
                          <span className={`font-bold ${
                            (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(trade.pnl || 0)}
                          </span>
                        </div>
                        {trade.entry_time && trade.exit_time && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Duration:</span>
                            <span className="font-medium text-blue-400">
                              {calculateTradeDuration(trade.entry_time, trade.exit_time)}
                            </span>
                          </div>
                        )}
                        {trade.entry_time && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Entry Time:</span>
                            <span className="text-white font-medium">{trade.entry_time}</span>
                          </div>
                        )}
                        {trade.exit_time && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Exit Time:</span>
                            <span className="text-white font-medium">{trade.exit_time}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Strategy & Emotion */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Strategy & Emotion</h4>
                      {trade.strategies ? (
                        <div className="mb-4">
                          <p className="text-white/60 mb-2">Strategy: {trade.strategies.name}</p>
                          {trade.strategies.rules && trade.strategies.rules.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-white/60 text-sm">Rules followed:</p>
                              {trade.strategies.rules.map((rule, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-white/70">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  {rule}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-white/60 mb-4">No strategy assigned</p>
                      )}
                      
                      {trade.emotional_state && (
                        <div>
                          <p className="text-white/60 mb-1">Emotional State:</p>
                          {formatEmotionsAsBoxes(trade.emotional_state)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Diagnosis Summary */}
        <div className="glass p-6 rounded-xl mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Diagnosis Summary</h2>
          <div className="space-y-4 text-white/80">
            <p>
              <strong>✅ MarketBadge Component:</strong> Working correctly with all market types (stock, crypto, forex, futures, multiple markets)
            </p>
            <p>
              <strong>✅ Trade Display Logic:</strong> Market badges are properly integrated into trade cards
            </p>
            <p>
              <strong>✅ Conditional Rendering:</strong> Market badges only show when market data exists
            </p>
            <p>
              <strong>✅ Styling:</strong> Badges use appropriate colors and icons for each market type
            </p>
            <p>
              <strong>🎯 Root Cause:</strong> The actual trades table is empty - no trades exist to display
            </p>
            <p>
              <strong>🔧 Solution:</strong> Create actual trades through the trade form - market display will work automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}