'use client';

import { useState } from 'react';
import MarketBadge from '@/components/ui/MarketBadge';

// Mock trade data with various market types and edge cases
const mockTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy' as const,
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    market: 'stock',
    strategies: { id: '1', name: 'Tech Growth' }
  },
  {
    id: '2',
    symbol: 'BTC',
    side: 'Buy' as const,
    quantity: 0.5,
    entry_price: 45000,
    exit_price: 47000,
    pnl: 1000.00,
    trade_date: '2024-01-16',
    market: 'crypto',
    strategies: { id: '2', name: 'Crypto Momentum' }
  },
  {
    id: '3',
    symbol: 'EUR/USD',
    side: 'Sell' as const,
    quantity: 100000,
    entry_price: 1.0850,
    exit_price: 1.0820,
    pnl: 300.00,
    trade_date: '2024-01-17',
    market: 'forex',
    strategies: { id: '3', name: 'Currency Carry' }
  },
  {
    id: '4',
    symbol: 'ES',
    side: 'Buy' as const,
    quantity: 1,
    entry_price: 4500.25,
    exit_price: 4525.50,
    pnl: 1262.50,
    trade_date: '2024-01-18',
    market: 'futures',
    strategies: { id: '4', name: 'Index Futures' }
  },
  // Edge cases that should trigger the emoji cleanup
  {
    id: '5',
    symbol: '🚀',
    side: 'Buy' as const,
    quantity: 100,
    entry_price: 100,
    exit_price: 110,
    pnl: 1000,
    trade_date: '2024-01-19',
    market: '📈 stock', // Mixed emoji and text
    strategies: { id: '5', name: 'Meme Trading' }
  },
  {
    id: '6',
    symbol: 'TEST',
    side: 'Sell' as const,
    quantity: 50,
    entry_price: 200,
    exit_price: 195,
    pnl: -250,
    trade_date: '2024-01-20',
    market: '🎯crypto🎯', // Emojis around text
    strategies: { id: '6', name: 'Test Strategy' }
  },
  {
    id: '7',
    symbol: 'UNKNOWN',
    side: 'Buy' as const,
    quantity: 10,
    entry_price: 50,
    exit_price: 55,
    pnl: 50,
    trade_date: '2024-01-21',
    market: 'unknownmarket', // Unknown market type
    strategies: { id: '7', name: 'Unknown Strategy' }
  },
  {
    id: '8',
    symbol: 'NULL_MARKET',
    side: 'Buy' as const,
    quantity: 25,
    entry_price: 75,
    exit_price: 80,
    pnl: 125,
    trade_date: '2024-01-22',
    market: '', // Empty market
    strategies: { id: '8', name: 'Empty Market Test' }
  }
];

export default function TestMarketSymbolFix() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Market & Symbol Display Fix Test</h1>
          <p className="text-white/70">Testing market badge emoji cleanup and enhanced symbol display</p>
        </div>

        {/* MarketBadge Component Tests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">MarketBadge Component Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-medium text-white/70 mb-2">Normal Markets</h3>
              <div className="space-y-2">
                <MarketBadge market="stock" size="sm" />
                <MarketBadge market="crypto" size="sm" />
                <MarketBadge market="forex" size="sm" />
                <MarketBadge market="futures" size="sm" />
              </div>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-medium text-white/70 mb-2">Emoji Markets</h3>
              <div className="space-y-2">
                <MarketBadge market="📈 stock" size="sm" />
                <MarketBadge market="🎯crypto🎯" size="sm" />
                <MarketBadge market="💰forex💰" size="sm" />
                <MarketBadge market="🚀futures🚀" size="sm" />
              </div>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-medium text-white/70 mb-2">Unknown Markets</h3>
              <div className="space-y-2">
                <MarketBadge market="unknown" size="sm" />
                <MarketBadge market="random" size="sm" />
                <MarketBadge market="test" size="sm" />
                <MarketBadge market="" size="sm" />
              </div>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-medium text-white/70 mb-2">Multiple Markets</h3>
              <div className="space-y-2">
                <MarketBadge market="stock, crypto" size="sm" />
                <MarketBadge market="forex, futures" size="sm" />
                <MarketBadge market="stock, crypto, forex" size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Trade Cards Test */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Enhanced Trade Cards Test</h2>
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
                            {/* Enhanced Symbol Display */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/50 font-medium uppercase tracking-wider">SYMBOL</span>
                              <h3 className="text-xl font-bold text-white bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                {trade.symbol || 'N/A'}
                              </h3>
                            </div>
                            {trade.market && (
                              <MarketBadge market={trade.market} size="sm" />
                            )}
                          </div>
                          <p className="text-sm text-white/70">
                            {new Date(trade.trade_date).toLocaleDateString()} • {trade.quantity} shares
                          </p>
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
                          ${trade.pnl?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-white/70">
                          ${trade.entry_price} {trade.exit_price && `→ $${trade.exit_price}`}
                        </p>
                      </div>
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => toggleTradeExpansion(trade.id)}
                      >
                        {expandedTrades.has(trade.id) ? '▲' : '▼'}
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
                            <span className="text-white/60">Symbol:</span>
                            <span className="text-white font-bold bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                              {trade.symbol || 'N/A'}
                            </span>
                          </div>
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
                              ${trade.pnl?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Test Information */}
                      <div>
                        <h4 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Test Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white/60">Original Market:</span>
                            <span className="text-white font-mono text-xs">"{trade.market}"</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Original Symbol:</span>
                            <span className="text-white font-mono text-xs">"{trade.symbol}"</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Test Case:</span>
                            <span className="text-white font-medium">
                              {trade.id === '5' ? 'Emoji in market' :
                               trade.id === '6' ? 'Emojis around market' :
                               trade.id === '7' ? 'Unknown market' :
                               trade.id === '8' ? 'Empty market' : 'Normal case'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Fix Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">✅ MarketBadge Fixes</h3>
              <ul className="text-white/70 space-y-1 text-sm">
                <li>• Emoji cleanup from market names</li>
                <li>• Enhanced fallback for unknown markets</li>
                <li>• Better handling of null/undefined markets</li>
                <li>• Proper display of cleaned market names</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">✅ Symbol Display Fixes</h3>
              <ul className="text-white/70 space-y-1 text-sm">
                <li>• Prominent "SYMBOL" label added</li>
                <li>• Enhanced styling with background and border</li>
                <li>• Symbol shown in both summary and details</li>
                <li>• Fallback display for missing symbols</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}