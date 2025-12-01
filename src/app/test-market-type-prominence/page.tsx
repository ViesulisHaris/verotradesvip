'use client';

import { useState } from 'react';
import MarketBadge from '@/components/ui/MarketBadge';

export default function TestMarketTypeProminence() {
  const [selectedMarket, setSelectedMarket] = useState('stock');

  const markets = [
    { key: 'stock', name: 'Stock', description: 'Blue colored letters' },
    { key: 'crypto', name: 'Crypto', description: 'Orange colored letters' },
    { key: 'forex', name: 'Forex', description: 'Green colored letters' },
    { key: 'futures', name: 'Futures', description: 'Purple colored letters' }
  ];

  const sampleTrades = [
    { symbol: 'AAPL', market: 'stock', side: 'Buy' },
    { symbol: 'BTC', market: 'crypto', side: 'Sell' },
    { symbol: 'EUR/USD', market: 'forex', side: 'Buy' },
    { symbol: 'ES', market: 'futures', side: 'Sell' },
    { symbol: 'TSLA', market: 'stock', side: 'Buy' },
    { symbol: 'ETH', market: 'crypto', side: 'Buy' }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Market Type Prominence Test</h1>
          <p className="text-white/70">Testing enhanced market type display with same prominence as symbol</p>
        </div>

        {/* Market Type Color Reference */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Market Type Color Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {markets.map((market) => (
              <div key={market.key} className="glass p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/50 font-medium uppercase tracking-wider">MARKET</span>
                  <MarketBadge market={market.key} size="prominent" />
                </div>
                <p className="text-sm text-white/70">{market.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Symbol vs Market Type Comparison */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Symbol vs Market Type Comparison</h2>
          <p className="text-white/70 mb-4">Both should have equal visual weight and prominence</p>
          
          <div className="space-y-4">
            {sampleTrades.map((trade, index) => (
              <div key={index} className="glass p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50 font-medium uppercase tracking-wider">SYMBOL</span>
                    <h3 className="text-xl font-bold text-white bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                      {trade.symbol}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50 font-medium uppercase tracking-wider">MARKET</span>
                    <MarketBadge market={trade.market} size="prominent" />
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    trade.side === 'Buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <span className={`text-sm font-bold ${
                      trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.side === 'Buy' ? 'B' : 'S'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Comparison */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Size Comparison</h2>
          <p className="text-white/70 mb-4">Comparing different MarketBadge sizes with the new prominent size</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-white/60 w-20">Small:</span>
              <MarketBadge market="stock" size="sm" />
              <MarketBadge market="crypto" size="sm" />
              <MarketBadge market="forex" size="sm" />
              <MarketBadge market="futures" size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60 w-20">Medium:</span>
              <MarketBadge market="stock" size="md" />
              <MarketBadge market="crypto" size="md" />
              <MarketBadge market="forex" size="md" />
              <MarketBadge market="futures" size="md" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60 w-20">Large:</span>
              <MarketBadge market="stock" size="lg" />
              <MarketBadge market="crypto" size="lg" />
              <MarketBadge market="forex" size="lg" />
              <MarketBadge market="futures" size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60 w-20">Prominent:</span>
              <MarketBadge market="stock" size="prominent" />
              <MarketBadge market="crypto" size="prominent" />
              <MarketBadge market="forex" size="prominent" />
              <MarketBadge market="futures" size="prominent" />
            </div>
          </div>
        </div>

        {/* Interactive Market Selector */}
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Interactive Market Selector</h2>
          <p className="text-white/70 mb-4">Select a market type to see its prominent display</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {markets.map((market) => (
              <button
                key={market.key}
                onClick={() => setSelectedMarket(market.key)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedMarket === market.key
                    ? 'bg-blue-500/20 border-blue-500/40'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <p className="text-white font-medium">{market.name}</p>
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider">SELECTED MARKET</span>
            <MarketBadge market={selectedMarket} size="prominent" />
          </div>
        </div>

        {/* Responsive Test */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Responsive Test</h2>
          <p className="text-white/70 mb-4">Test how the display adapts to different screen sizes</p>
          
          <div className="space-y-4">
            <div className="border border-white/20 rounded-lg p-4">
              <p className="text-white/60 mb-2">Full width display:</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 font-medium uppercase tracking-wider">SYMBOL</span>
                  <h3 className="text-xl font-bold text-white bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                    AAPL
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 font-medium uppercase tracking-wider">MARKET</span>
                  <MarketBadge market="stock" size="prominent" />
                </div>
              </div>
            </div>
            
            <div className="border border-white/20 rounded-lg p-4">
              <p className="text-white/60 mb-2">Compact display:</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">SYMBOL</span>
                <h3 className="text-xl font-bold text-white bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                  AAPL
                </h3>
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">MARKET</span>
                <MarketBadge market="stock" size="prominent" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/trades'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Enhanced Trades Page
          </button>
        </div>
      </div>
    </div>
  );
}