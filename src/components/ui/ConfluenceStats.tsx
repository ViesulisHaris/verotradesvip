'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Interface for trade data
interface TradeData {
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
  strategy_id?: string;
  market?: string;
  notes?: string;
  strategies?: {
    id: string;
    name: string;
  };
}

// Interface for component props
interface ConfluenceStatsProps {
  data: TradeData[];
  isLoading?: boolean;
}

// Interface for calculated statistics
interface TradeStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  averageTradeSize: number;
  bestTrade: TradeData | null;
  worstTrade: TradeData | null;
  monthlyPerformance: MonthlyPerformance[];
  strategyPerformance: StrategyPerformance[];
  marketPerformance: MarketPerformance[];
  emotionalPerformance: EmotionalPerformance[];
}

interface MonthlyPerformance {
  month: string;
  trades: number;
  pnl: number;
  winRate: number;
}

interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  trades: number;
  pnl: number;
  winRate: number;
}

interface MarketPerformance {
  market: string;
  trades: number;
  pnl: number;
  winRate: number;
}

interface EmotionalPerformance {
  emotion: string;
  trades: number;
  pnl: number;
  winRate: number;
}

// Main ConfluenceStats component
export default function ConfluenceStats({ data, isLoading = false }: ConfluenceStatsProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'monthly' | 'strategy' | 'market' | 'emotional'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate statistics from trade data
  const statistics = useMemo((): TradeStatistics => {
    if (!data || data.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageTradeSize: 0,
        bestTrade: null,
        worstTrade: null,
        monthlyPerformance: [],
        strategyPerformance: [],
        marketPerformance: [],
        emotionalPerformance: []
      };
    }

    const winningTrades = data.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = data.filter(trade => (trade.pnl || 0) < 0);
    const totalPnL = data.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const averageTradeSize = data.reduce((sum, trade) => sum + (trade.quantity || 0), 0) / data.length;
    
    const bestTrade = data.reduce((best, trade) =>
      (trade.pnl || 0) > (best?.pnl || 0) ? trade : best, data[0]) || null;
    const worstTrade = data.reduce((worst, trade) =>
      (trade.pnl || 0) < (worst?.pnl || 0) ? trade : worst, data[0]) || null;

    // Calculate monthly performance
    const monthlyMap = new Map<string, MonthlyPerformance>();
    data.forEach(trade => {
      const month = trade.trade_date.substring(0, 7); // YYYY-MM format
      const existing = monthlyMap.get(month) || {
        month,
        trades: 0,
        pnl: 0,
        winRate: 0
      };
      
      existing.trades++;
      existing.pnl += trade.pnl || 0;
      
      if ((trade.pnl || 0) > 0) {
        existing.winRate = ((existing.winRate * (existing.trades - 1)) + 100) / existing.trades;
      } else {
        existing.winRate = (existing.winRate * (existing.trades - 1)) / existing.trades;
      }
      
      monthlyMap.set(month, existing);
    });

    // Calculate strategy performance
    const strategyMap = new Map<string, StrategyPerformance>();
    data.forEach(trade => {
      const strategyId = trade.strategy_id || 'unknown';
      const strategyName = trade.strategies?.name || 'Unknown Strategy';
      const existing = strategyMap.get(strategyId) || {
        strategyId,
        strategyName,
        trades: 0,
        pnl: 0,
        winRate: 0
      };
      
      existing.trades++;
      existing.pnl += trade.pnl || 0;
      
      if ((trade.pnl || 0) > 0) {
        existing.winRate = ((existing.winRate * (existing.trades - 1)) + 100) / existing.trades;
      } else {
        existing.winRate = (existing.winRate * (existing.trades - 1)) / existing.trades;
      }
      
      strategyMap.set(strategyId, existing);
    });

    // Calculate market performance
    const marketMap = new Map<string, MarketPerformance>();
    data.forEach(trade => {
      const market = trade.market || 'Unknown';
      const existing = marketMap.get(market) || {
        market,
        trades: 0,
        pnl: 0,
        winRate: 0
      };
      
      existing.trades++;
      existing.pnl += trade.pnl || 0;
      
      if ((trade.pnl || 0) > 0) {
        existing.winRate = ((existing.winRate * (existing.trades - 1)) + 100) / existing.trades;
      } else {
        existing.winRate = (existing.winRate * (existing.trades - 1)) / existing.trades;
      }
      
      marketMap.set(market, existing);
    });

    // Calculate emotional performance
    const emotionalMap = new Map<string, EmotionalPerformance>();
    data.forEach(trade => {
      if (trade.emotional_state && trade.emotional_state.length > 0) {
        trade.emotional_state.forEach(emotion => {
          const existing = emotionalMap.get(emotion) || {
            emotion,
            trades: 0,
            pnl: 0,
            winRate: 0
          };
          
          existing.trades++;
          existing.pnl += trade.pnl || 0;
          
          if ((trade.pnl || 0) > 0) {
            existing.winRate = ((existing.winRate * (existing.trades - 1)) + 100) / existing.trades;
          } else {
            existing.winRate = (existing.winRate * (existing.trades - 1)) / existing.trades;
          }
          
          emotionalMap.set(emotion, existing);
        });
      }
    });

    return {
      totalTrades: data.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / data.length) * 100,
      totalPnL,
      averageTradeSize,
      bestTrade,
      worstTrade,
      monthlyPerformance: Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month)),
      strategyPerformance: Array.from(strategyMap.values()).sort((a, b) => b.trades - a.trades),
      marketPerformance: Array.from(marketMap.values()).sort((a, b) => b.trades - a.trades),
      emotionalPerformance: Array.from(emotionalMap.values()).sort((a, b) => b.trades - a.trades)
    };
  }, [data]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="card-unified p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verotrade-gold-primary mx-auto mb-4"></div>
          <p className="text-verotrade-text-tertiary">Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="card-unified p-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50 text-verotrade-gold-primary" />
          <h3 className="text-lg font-medium text-verotrade-text-primary mb-2">No trade data available</h3>
          <p className="text-sm text-verotrade-text-tertiary mb-4">
            Add some trades to see your confluence statistics here
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-verotrade-gold-primary/20 text-verotrade-gold-primary rounded-lg hover:bg-verotrade-gold-primary/30 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'monthly', label: 'Monthly', icon: Calendar },
          { id: 'strategy', label: 'Strategy', icon: Target },
          { id: 'market', label: 'Market', icon: TrendingUp },
          { id: 'emotional', label: 'Emotional', icon: Activity }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedView(id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              selectedView === id
                ? 'bg-verotrade-gold-primary/20 text-verotrade-gold-primary border border-verotrade-gold-primary/40'
                : 'bg-verotrade-tertiary-black text-verotrade-text-secondary hover:bg-verotrade-quaternary-black border border-verotrade-border-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Trades */}
          <div className="card-unified p-6 hover:shadow-verotrade-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-verotrade-gold-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-verotrade-gold-primary" />
              </div>
              <span className="text-verotrade-text-tertiary text-sm">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-verotrade-text-primary mb-1">{statistics.totalTrades}</h3>
            <p className="text-sm text-verotrade-text-tertiary">Total Trades</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-verotrade-success">{statistics.winningTrades} wins</span>
              <span className="text-verotrade-text-muted">•</span>
              <span className="text-verotrade-error">{statistics.losingTrades} losses</span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="card-unified p-6 hover:shadow-verotrade-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-verotrade-success/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-verotrade-success" />
              </div>
              <span className="text-verotrade-text-tertiary text-sm">Success</span>
            </div>
            <h3 className="text-2xl font-bold text-verotrade-text-primary mb-1">{statistics.winRate.toFixed(1)}%</h3>
            <p className="text-sm text-verotrade-text-tertiary">Win Rate</p>
            <div className="mt-3">
              <div className="w-full bg-verotrade-quaternary-black rounded-full h-2">
                <div 
                  className="bg-verotrade-success h-2 rounded-full transition-all duration-500"
                  style={{ width: `${statistics.winRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total P&L */}
          <div className="card-unified p-6 hover:shadow-verotrade-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                statistics.totalPnL >= 0 ? 'bg-verotrade-gold-primary/20' : 'bg-verotrade-error/20'
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  statistics.totalPnL >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
                }`} />
              </div>
              <span className="text-verotrade-text-tertiary text-sm">P&L</span>
            </div>
            <h3 className={`text-2xl font-bold mb-1 ${
              statistics.totalPnL >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
            }`}>
              {formatCurrency(statistics.totalPnL)}
            </h3>
            <p className="text-sm text-verotrade-text-tertiary">Total Profit/Loss</p>
            <div className="mt-3 flex items-center gap-1">
              {statistics.totalPnL >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-verotrade-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-verotrade-error" />
              )}
              <span className={`text-xs ${
                statistics.totalPnL >= 0 ? 'text-verotrade-success' : 'text-verotrade-error'
              }`}>
                {statistics.totalPnL >= 0 ? 'Profitable' : 'Loss'}
              </span>
            </div>
          </div>

          {/* Average Trade Size */}
          <div className="card-unified p-6 hover:shadow-verotrade-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-verotrade-info/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-verotrade-info" />
              </div>
              <span className="text-verotrade-text-tertiary text-sm">Average</span>
            </div>
            <h3 className="text-2xl font-bold text-verotrade-text-primary mb-1">
              {statistics.averageTradeSize.toFixed(0)}
            </h3>
            <p className="text-sm text-verotrade-text-tertiary">Avg Trade Size</p>
            <div className="mt-3 text-xs text-verotrade-text-muted">
              Per trade quantity
            </div>
          </div>
        </div>
      )}

      {/* Best/Worst Trades */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Trade */}
          <div className="card-unified p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-verotrade-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-verotrade-success" />
              </div>
              <h3 className="text-lg font-semibold text-verotrade-text-primary">Best Trade</h3>
            </div>
            {statistics.bestTrade ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">Symbol</span>
                  <span className="font-medium text-verotrade-text-primary">{statistics.bestTrade.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">Side</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    statistics.bestTrade.side === 'Buy'
                      ? 'bg-verotrade-success/20 text-verotrade-success'
                      : 'bg-verotrade-error/20 text-verotrade-error'
                  }`}>
                    {statistics.bestTrade.side}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">P&L</span>
                  <span className="font-medium text-verotrade-success">
                    {formatCurrency(statistics.bestTrade.pnl || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">Date</span>
                  <span className="text-verotrade-text-tertiary">{statistics.bestTrade.trade_date}</span>
                </div>
              </div>
            ) : (
              <p className="text-verotrade-text-tertiary">No best trade data available</p>
            )}
          </div>

          {/* Worst Trade */}
          <div className="card-unified p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-verotrade-error/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-verotrade-error" />
              </div>
              <h3 className="text-lg font-semibold text-verotrade-text-primary">Worst Trade</h3>
            </div>
            {statistics.worstTrade ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">Symbol</span>
                  <span className="font-medium text-verotrade-text-primary">{statistics.worstTrade.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">Side</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    statistics.worstTrade.side === 'Buy'
                      ? 'bg-verotrade-success/20 text-verotrade-success'
                      : 'bg-verotrade-error/20 text-verotrade-error'
                  }`}>
                    {statistics.worstTrade.side}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">P&L</span>
                  <span className="font-medium text-verotrade-error">
                    {formatCurrency(statistics.worstTrade.pnl || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-verotrade-text-secondary">Date</span>
                  <span className="text-verotrade-text-tertiary">{statistics.worstTrade.trade_date}</span>
                </div>
              </div>
            ) : (
              <p className="text-verotrade-text-tertiary">No worst trade data available</p>
            )}
          </div>
        </div>
      )}

      {/* Monthly Performance */}
      {selectedView === 'monthly' && (
        <div className="card-unified p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-verotrade-gold-primary" />
            <h3 className="text-lg font-semibold text-verotrade-text-primary">Monthly Performance</h3>
          </div>
          {statistics.monthlyPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-verotrade-border-primary">
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Month</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Trades</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">P&L</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.monthlyPerformance.map((month, index) => (
                    <tr key={month.month} className="border-b border-verotrade-border-primary/50 hover:bg-verotrade-quaternary-black/20">
                      <td className="py-3 px-4 font-medium text-verotrade-text-primary">{month.month}</td>
                      <td className="py-3 px-4 text-verotrade-text-secondary">{month.trades}</td>
                      <td className={`py-3 px-4 font-medium ${
                        month.pnl >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
                      }`}>
                        {formatCurrency(month.pnl)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-verotrade-quaternary-black rounded-full h-2">
                            <div 
                              className="bg-verotrade-success h-2 rounded-full"
                              style={{ width: `${month.winRate}%` }}
                            ></div>
                          </div>
                          <span className="text-verotrade-text-secondary">{month.winRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-verotrade-text-tertiary">No monthly performance data available</p>
          )}
        </div>
      )}

      {/* Strategy Performance */}
      {selectedView === 'strategy' && (
        <div className="card-unified p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-verotrade-gold-primary" />
            <h3 className="text-lg font-semibold text-verotrade-text-primary">Strategy Performance</h3>
          </div>
          {statistics.strategyPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-verotrade-border-primary">
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Strategy</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Trades</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">P&L</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.strategyPerformance.map((strategy) => (
                    <tr key={strategy.strategyId} className="border-b border-verotrade-border-primary/50 hover:bg-verotrade-quaternary-black/20">
                      <td className="py-3 px-4 font-medium text-verotrade-text-primary">{strategy.strategyName}</td>
                      <td className="py-3 px-4 text-verotrade-text-secondary">{strategy.trades}</td>
                      <td className={`py-3 px-4 font-medium ${
                        strategy.pnl >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
                      }`}>
                        {formatCurrency(strategy.pnl)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-verotrade-quaternary-black rounded-full h-2">
                            <div 
                              className="bg-verotrade-success h-2 rounded-full"
                              style={{ width: `${strategy.winRate}%` }}
                            ></div>
                          </div>
                          <span className="text-verotrade-text-secondary">{strategy.winRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-verotrade-text-tertiary">No strategy performance data available</p>
          )}
        </div>
      )}

      {/* Market Performance */}
      {selectedView === 'market' && (
        <div className="card-unified p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-verotrade-gold-primary" />
            <h3 className="text-lg font-semibold text-verotrade-text-primary">Market Performance</h3>
          </div>
          {statistics.marketPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-verotrade-border-primary">
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Market</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Trades</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">P&L</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.marketPerformance.map((market) => (
                    <tr key={market.market} className="border-b border-verotrade-border-primary/50 hover:bg-verotrade-quaternary-black/20">
                      <td className="py-3 px-4 font-medium text-verotrade-text-primary">{market.market}</td>
                      <td className="py-3 px-4 text-verotrade-text-secondary">{market.trades}</td>
                      <td className={`py-3 px-4 font-medium ${
                        market.pnl >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
                      }`}>
                        {formatCurrency(market.pnl)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-verotrade-quaternary-black rounded-full h-2">
                            <div 
                              className="bg-verotrade-success h-2 rounded-full"
                              style={{ width: `${market.winRate}%` }}
                            ></div>
                          </div>
                          <span className="text-verotrade-text-secondary">{market.winRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-verotrade-text-tertiary">No market performance data available</p>
          )}
        </div>
      )}

      {/* Emotional Performance */}
      {selectedView === 'emotional' && (
        <div className="card-unified p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-verotrade-gold-primary" />
            <h3 className="text-lg font-semibold text-verotrade-text-primary">Emotional Performance</h3>
          </div>
          {statistics.emotionalPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-verotrade-border-primary">
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Emotion</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Trades</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">P&L</th>
                    <th className="text-left py-3 px-4 font-medium text-verotrade-text-primary">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.emotionalPerformance.map((emotion) => (
                    <tr key={emotion.emotion} className="border-b border-verotrade-border-primary/50 hover:bg-verotrade-quaternary-black/20">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-verotrade-gold-primary/20 text-verotrade-gold-primary rounded text-xs font-medium">
                          {emotion.emotion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-verotrade-text-secondary">{emotion.trades}</td>
                      <td className={`py-3 px-4 font-medium ${
                        emotion.pnl >= 0 ? 'text-verotrade-gold-primary' : 'text-verotrade-error'
                      }`}>
                        {formatCurrency(emotion.pnl)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-verotrade-quaternary-black rounded-full h-2">
                            <div 
                              className="bg-verotrade-success h-2 rounded-full"
                              style={{ width: `${emotion.winRate}%` }}
                            ></div>
                          </div>
                          <span className="text-verotrade-text-secondary">{emotion.winRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-verotrade-text-tertiary">No emotional performance data available</p>
          )}
        </div>
      )}
    </div>
  );
}