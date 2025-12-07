'use client';

import React, { useState, useEffect } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import EmotionRadar from '@/components/ui/EmotionRadar';
import {
  Brain,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Filter,
  RefreshCw,
  Activity,
  AlertTriangle,
  Check,
  X,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from 'lucide-react';

// Mock data for testing
const mockStats = {
  totalTrades: 156,
  totalPnL: 12450.75,
  winRate: 68.5,
  avgTradeSize: 2500,
  lastSyncTime: Date.now(),
  emotionalData: [
    {
      subject: 'FOMO',
      value: 25,
      fullMark: 100,
      leaning: 'Buy Leaning',
      side: 'Buy',
      leaningValue: 35,
      totalTrades: 12
    },
    {
      subject: 'CONFIDENT',
      value: 45,
      fullMark: 100,
      leaning: 'Balanced',
      side: 'Buy',
      leaningValue: 15,
      totalTrades: 28
    },
    {
      subject: 'DISCIPLINE',
      value: 65,
      fullMark: 100,
      leaning: 'Balanced',
      side: 'Sell',
      leaningValue: -10,
      totalTrades: 42
    },
    {
      subject: 'PATIENCE',
      value: 35,
      fullMark: 100,
      leaning: 'Sell Leaning',
      side: 'Sell',
      leaningValue: -25,
      totalTrades: 18
    }
  ]
};

const mockTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.25,
    exit_price: 155.50,
    pnl: 525.00,
    trade_date: '2024-01-15',
    emotional_state: ['CONFIDENT', 'PATIENCE'],
    strategies: { id: '1', name: 'Momentum Strategy' },
    market: 'Stock'
  },
  {
    id: '2',
    symbol: 'BTC',
    side: 'Sell',
    quantity: 0.5,
    entry_price: 45000,
    exit_price: 44200,
    pnl: 400.00,
    trade_date: '2024-01-14',
    emotional_state: ['FOMO', 'ANXIOUS'],
    strategies: { id: '2', name: 'Crypto Scalping' },
    market: 'Crypto'
  },
  {
    id: '3',
    symbol: 'EUR/USD',
    side: 'Buy',
    quantity: 100000,
    entry_price: 1.0850,
    exit_price: 1.0890,
    pnl: 400.00,
    trade_date: '2024-01-13',
    emotional_state: ['DISCIPLINE'],
    strategies: { id: '3', name: 'Forex Swing' },
    market: 'Forex'
  }
];

const AVAILABLE_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
const AVAILABLE_MARKETS = ['Stock', 'Crypto', 'Forex', 'Futures'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export default function TestConfluenceComponents() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const clearEmotionFilters = () => {
    setSelectedEmotions([]);
  };

  const clearAllFilters = () => {
    setSelectedEmotions([]);
    setSymbolFilter('');
    setMarketFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const hasActiveFilters = selectedEmotions.length > 0 ||
                          symbolFilter.trim() !== '' ||
                          marketFilter !== '' ||
                          dateFromFilter !== '' ||
                          dateToFilter !== '';

  return (
    <UnifiedLayout>
      <div className="h-screen overflow-hidden space-y-4 sm:space-y-6" data-testid="confluence-container">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-luxury text-2xl sm:text-3xl md:text-4xl">Confluence Analysis (Test)</h1>
              <p className="body-text text-sm sm:text-base">Testing confluence components with mock data</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-primary min-h-[44px] min-w-[44px] flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-luxury p-6 relative" data-testid="confluence-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-verotrade-gold-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-verotrade-gold-primary" />
              </div>
              <h3 className="text-sm font-medium text-verotrade-text-primary">Total Trades</h3>
            </div>
            <p className="text-2xl font-bold text-verotrade-text-primary">{mockStats.totalTrades}</p>
          </div>

          <div className="card-luxury p-6 relative" data-testid="confluence-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-verotrade-gold-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-verotrade-gold-primary" />
              </div>
              <h3 className="text-sm font-medium text-verotrade-text-primary">Total P&L</h3>
            </div>
            <p className={`text-2xl font-bold ${mockStats.totalPnL >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'}`}>
              {formatCurrency(mockStats.totalPnL)}
            </p>
          </div>

          <div className="card-luxury p-6 relative" data-testid="confluence-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-verotrade-gold-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-verotrade-gold-primary" />
              </div>
              <h3 className="text-sm font-medium text-verotrade-text-primary">Win Rate</h3>
            </div>
            <p className="text-2xl font-bold text-verotrade-text-primary">{mockStats.winRate.toFixed(1)}%</p>
          </div>

          <div className="card-luxury p-6 relative" data-testid="confluence-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-verotrade-gold-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-verotrade-gold-primary" />
              </div>
              <h3 className="text-sm font-medium text-verotrade-text-primary">Last Sync</h3>
            </div>
            <p className="text-sm text-verotrade-text-primary">
              {new Date(mockStats.lastSyncTime).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
          {/* Emotion Radar Chart */}
          <div className="card-luxury p-6 h-[500px] flex flex-col">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <Brain className="w-5 h-5 text-verotrade-gold-primary" />
              <h2 className="text-lg font-semibold text-verotrade-text-primary">Emotional Analysis</h2>
            </div>
            <div className="flex-1 min-h-0">
              <div className="h-full">
                <EmotionRadar data={mockStats.emotionalData} />
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="card-luxury p-6 h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-verotrade-gold-primary/20 to-verotrade-gold-primary/10 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-verotrade-gold-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-verotrade-text-primary">Advanced Filters</h2>
                  <p className="text-xs text-verotrade-text-tertiary mt-0.5">Test filter functionality</p>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-sm font-medium text-verotrade-gold-primary bg-verotrade-gold-primary/10 rounded-lg hover:bg-verotrade-gold-primary/20 transition-all duration-200 border border-verotrade-gold-primary/20"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-5 flex-1 overflow-y-auto pr-3 min-h-0 scrollbar-thin scrollbar-thumb-verotrade-gold-primary/20 scrollbar-track-transparent">
              {/* Symbol Search */}
              <div className="group">
                <label className="block text-sm font-medium mb-2.5 text-verotrade-text-primary flex items-center gap-2">
                  <Search className="w-4 h-4 text-verotrade-gold-primary" />
                  Symbol Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    placeholder="Search symbols (e.g., AAPL, BTC)"
                    className="w-full pl-4 pr-3 py-2.5 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black text-verotrade-text-primary placeholder-verotrade-text-muted focus:outline-none focus:ring-2 focus:ring-verotrade-gold-primary/50 focus:border-verotrade-gold-primary/50 transition-all duration-200"
                  />
                  {symbolFilter && (
                    <button
                      onClick={() => setSymbolFilter('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-verotrade-text-muted hover:text-verotrade-text-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2.5 text-verotrade-text-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-verotrade-gold-primary" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-verotrade-text-secondary mb-1.5">From</label>
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black text-verotrade-text-primary focus:outline-none focus:ring-2 focus:ring-verotrade-gold-primary/50 focus:border-verotrade-gold-primary/50 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-verotrade-text-secondary mb-1.5">To</label>
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black text-verotrade-text-primary focus:outline-none focus:ring-2 focus:ring-verotrade-gold-primary/50 focus:border-verotrade-gold-primary/50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Market Filter */}
              <div>
                <label className="block text-sm font-medium mb-2.5 text-verotrade-text-primary">Market</label>
                <div className="relative">
                  <select
                    value={marketFilter}
                    onChange={(e) => setMarketFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black text-verotrade-text-primary focus:outline-none focus:ring-2 focus:ring-verotrade-gold-primary/50 focus:border-verotrade-gold-primary/50 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="">All Markets</option>
                    {AVAILABLE_MARKETS.map(market => (
                      <option key={market} value={market}>{market}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-verotrade-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Emotional States */}
              <div>
                <label className="block text-sm font-medium mb-2.5 text-verotrade-text-primary flex items-center gap-2">
                  <Brain className="w-4 h-4 text-verotrade-gold-primary" />
                  Emotional States
                </label>
                <div className="border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_EMOTIONS.map(emotion => (
                      <button
                        key={emotion}
                        onClick={() => toggleEmotion(emotion)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedEmotions.includes(emotion)
                            ? 'bg-verotrade-gold-primary/20 text-verotrade-gold-primary border border-verotrade-gold-primary/40 shadow-sm'
                            : 'bg-verotrade-quaternary-black text-verotrade-text-primary hover:bg-verotrade-quinary-black border border-verotrade-border-primary'
                        }`}
                      >
                        {selectedEmotions.includes(emotion) ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 border border-verotrade-text-muted rounded" />
                        )}
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedEmotions.length > 0 && (
                  <div className="flex items-center justify-between mt-3 px-1">
                    <p className="text-xs font-medium text-verotrade-text-secondary">
                      {selectedEmotions.length} emotion{selectedEmotions.length !== 1 ? 's' : ''} selected
                    </p>
                    <button
                      onClick={clearEmotionFilters}
                      className="text-xs font-medium text-verotrade-gold-primary hover:text-verotrade-gold-primary/80 transition-colors"
                    >
                      Clear emotions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="card-luxury p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-verotrade-gold-primary" />
              <h2 className="text-lg font-semibold text-verotrade-text-primary">
                Sample Trades ({mockTrades.length})
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-verotrade-border-primary">
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Symbol</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Side</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Quantity</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Entry</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Exit</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">P&L</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Strategy</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Market</th>
                    <th className="text-left py-2 px-3 font-medium text-verotrade-text-primary">Emotions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-verotrade-border-primary/50 hover:bg-verotrade-quaternary-black/20">
                      <td className="py-2 px-3 font-medium text-verotrade-text-primary">{trade.symbol}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.side === 'Buy'
                            ? 'bg-verotrade-success/20 text-verotrade-success'
                            : 'bg-verotrade-error/20 text-verotrade-error'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-verotrade-text-secondary">{trade.quantity}</td>
                      <td className="py-2 px-3 text-verotrade-text-secondary">${trade.entry_price.toFixed(2)}</td>
                      <td className="py-2 px-3 text-verotrade-text-secondary">{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}</td>
                      <td className={`py-2 px-3 font-medium ${
                        (trade.pnl || 0) >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
                      }`}>
                        {formatCurrency(trade.pnl || 0)}
                      </td>
                      <td className="py-2 px-3 text-verotrade-text-secondary">{trade.trade_date}</td>
                      <td className="py-2 px-3 text-verotrade-text-secondary">
                        {trade.strategies?.name || '-'}
                      </td>
                      <td className="py-2 px-3 text-verotrade-text-secondary">
                        {trade.market || '-'}
                      </td>
                      <td className="py-2 px-3">
                        {trade.emotional_state && trade.emotional_state.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {trade.emotional_state.slice(0, 3).map((emotion, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-verotrade-gold-primary/20 text-verotrade-gold-primary rounded text-xs"
                              >
                                {emotion}
                              </span>
                            ))}
                            {trade.emotional_state.length > 3 && (
                              <span className="px-2 py-1 bg-verotrade-tertiary-black text-verotrade-text-tertiary rounded text-xs">
                                +{trade.emotional_state.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-verotrade-text-tertiary">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}