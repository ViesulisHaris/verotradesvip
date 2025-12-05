'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext-simple';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import AuthGuard from '@/components/AuthGuard';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './confluence.css';

// Confluence statistics interface
interface ConfluenceStats {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgTradeSize: number;
  lastSyncTime: number;
  emotionalData: Array<{
    subject: string;
    value: number;
    fullMark: number;
    leaning: string;
    side: string;
    leaningValue?: number;
    totalTrades?: number;
  }>;
}

// Trade interface for filtered trades
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
  emotional_state?: string[];
  strategy_id?: string;
  market?: string;
  notes?: string;
  strategies?: {
    id: string;
    name: string;
  };
}

// Filtered trades response interface
interface FilteredTradesResponse {
  trades: Trade[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Available emotional states
const AVAILABLE_EMOTIONS = [
  'FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'
];

// Available markets (from generate-test-data)
const AVAILABLE_MARKETS = ['Stock', 'Crypto', 'Forex', 'Futures'];

// P&L filter options
const PNL_FILTER_OPTIONS = [
  { value: 'all', label: 'All Trades' },
  { value: 'profitable', label: 'Profitable Only' },
  { value: 'lossable', label: 'Lossable Only' }
];

// Trade side options
const SIDE_FILTER_OPTIONS = [
  { value: '', label: 'All Sides' },
  { value: 'Buy', label: 'Buy Only' },
  { value: 'Sell', label: 'Sell Only' }
];

function ConfluencePage() {
  const { user, session, loading: authLoading, authInitialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ConfluenceStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filter states
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [pnlFilter, setPnlFilter] = useState<'all' | 'profitable' | 'lossable'>('all');
  const [sideFilter, setSideFilter] = useState<'Buy' | 'Sell' | ''>('');
  
  // Available strategies and data states
  const [availableStrategies, setAvailableStrategies] = useState<Array<{id: string, name: string}>>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [tradesPagination, setTradesPagination] = useState<FilteredTradesResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      console.log('🔐 [CONFLUENCE_DEBUG] Adding auth header to request');
    } else {
      console.warn('⚠️ [CONFLUENCE_DEBUG] No session token available for auth header');
    }
    
    return headers;
  };

  // Fetch available strategies
  const fetchStrategies = async () => {
    try {
      console.log('🔄 [CONFLUENCE_DEBUG] Fetching strategies...');
      
      const response = await fetch('/api/strategies', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch strategies');
      }

      const data = await response.json();
      console.log('✅ [CONFLUENCE_DEBUG] Strategies fetched successfully:', data);
      setAvailableStrategies(data.strategies || []);
    } catch (err) {
      console.error('❌ [CONFLUENCE_DEBUG] Error fetching strategies:', err);
      // Don't set error state for strategies, just log it
    }
  };

  // Fetch confluence statistics with optional filters
  const fetchStats = async (filters?: {
    emotionalStates?: string[];
    symbol?: string;
    market?: string;
    strategyId?: string;
    dateFrom?: string;
    dateTo?: string;
    pnlFilter?: 'all' | 'profitable' | 'lossable';
    side?: 'Buy' | 'Sell' | '';
  }) => {
    try {
      setStatsLoading(true);
      console.log('🔄 [CONFLUENCE_DEBUG] Fetching confluence statistics...', filters);
      
      const params = new URLSearchParams();

      // Add emotional states filter if any are selected
      if (filters?.emotionalStates && filters.emotionalStates.length > 0) {
        params.append('emotionalStates', filters.emotionalStates.join(','));
      }

      // Add symbol filter
      if (filters?.symbol?.trim()) {
        params.append('symbol', filters.symbol.trim());
      }

      // Add market filter
      if (filters?.market) {
        params.append('market', filters.market);
      }

      // Add strategy filter
      if (filters?.strategyId) {
        params.append('strategyId', filters.strategyId);
      }

      // Add date filters
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }

      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      // Add P&L filter
      if (filters?.pnlFilter && filters.pnlFilter !== 'all') {
        params.append('pnlFilter', filters.pnlFilter);
      }

      // Add side filter
      if (filters?.side) {
        params.append('side', filters.side);
      }

      const response = await fetch(`/api/confluence-stats${params.toString() ? `?${params}` : ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch statistics');
      }

      const data = await response.json();
      console.log('✅ [CONFLUENCE_DEBUG] Statistics fetched successfully:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ [CONFLUENCE_DEBUG] Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch filtered trades
  const fetchFilteredTrades = async (page: number = 1) => {
    try {
      setTradesLoading(true);
      console.log('🔄 [CONFLUENCE_DEBUG] Fetching filtered trades...');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      // Add emotional states filter if any are selected
      if (selectedEmotions.length > 0) {
        params.append('emotionalStates', selectedEmotions.join(','));
      }

      // Add symbol filter
      if (symbolFilter.trim()) {
        params.append('symbol', symbolFilter.trim());
      }

      // Add market filter
      if (marketFilter) {
        params.append('market', marketFilter);
      }

      // Add strategy filter
      if (strategyFilter) {
        params.append('strategyId', strategyFilter);
      }

      // Add date filters
      if (dateFromFilter) {
        params.append('dateFrom', dateFromFilter);
      }

      if (dateToFilter) {
        params.append('dateTo', dateToFilter);
      }

      // Add P&L filter
      if (pnlFilter !== 'all') {
        params.append('pnlFilter', pnlFilter);
      }

      // Add side filter
      if (sideFilter) {
        params.append('side', sideFilter);
      }

      const response = await fetch(`/api/confluence-trades?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trades');
      }

      const data = await response.json();
      console.log('✅ [CONFLUENCE_DEBUG] Filtered trades fetched successfully:', data);
      setFilteredTrades(data.trades);
      setTradesPagination(data);
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ [CONFLUENCE_DEBUG] Error fetching filtered trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setTradesLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    await fetchFilteredTrades(currentPage);
    setIsRefreshing(false);
  };

  // Toggle emotion selection
  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev => {
      const newSelection = prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion];
      
      // Reset to first page when filters change
      setCurrentPage(1);
      
      // Fetch trades and stats with new filters after a short delay
      setTimeout(() => {
        fetchFilteredTrades(1);
        fetchStats({
          emotionalStates: newSelection,
          symbol: symbolFilter,
          market: marketFilter,
          strategyId: strategyFilter,
          dateFrom: dateFromFilter,
          dateTo: dateToFilter,
          pnlFilter: pnlFilter,
          side: sideFilter
        });
      }, 100);
      
      return newSelection;
    });
  };

  // Clear all emotion filters
  const clearEmotionFilters = () => {
    setSelectedEmotions([]);
    setCurrentPage(1);
    setTimeout(() => {
      fetchFilteredTrades(1);
      fetchStats({
        emotionalStates: [],
        symbol: symbolFilter,
        market: marketFilter,
        strategyId: strategyFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter,
        pnlFilter: pnlFilter,
        side: sideFilter
      });
    }, 100);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedEmotions([]);
    setSymbolFilter('');
    setMarketFilter('');
    setStrategyFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setPnlFilter('all');
    setSideFilter('');
    setCurrentPage(1);
    setTimeout(() => {
      fetchFilteredTrades(1);
      fetchStats(); // Fetch stats without filters
    }, 100);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedEmotions.length > 0 ||
                          symbolFilter.trim() !== '' ||
                          marketFilter !== '' ||
                          strategyFilter !== '' ||
                          dateFromFilter !== '' ||
                          dateToFilter !== '' ||
                          pnlFilter !== 'all' ||
                          sideFilter !== '';

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchFilteredTrades(page);
  };

  // Initial data fetch
  useEffect(() => {
    if (user && authInitialized && !authLoading) {
      console.log('🔄 [CONFLUENCE_DEBUG] User authenticated, fetching initial data...');
      setLoading(true);
      
      Promise.all([
        fetchStats(),
        fetchStrategies(),
        fetchFilteredTrades(1)
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, authInitialized, authLoading]);

  return (
    <UnifiedLayout>
      <div className="verotrade-content-wrapper">
        <div className="mb-section">
          {/* Header */}
          <div className="mb-component">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="h1-dashboard mb-element">Confluence Analysis</h1>
                <p className="body-text mb-element">Analyze the confluence of factors affecting your trading performance</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="button-primary min-h-[44px] min-w-[44px] flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="dashboard-card p-4 mb-component" style={{ borderColor: 'var(--rust-red)' }}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--rust-red)' }} />
                <p className="body-text" style={{ color: 'var(--rust-red)' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Statistics Cards - Moved to Top */}
          {stats ? (
            <div className="key-metrics-grid mb-component">
              <div className="dashboard-card" data-testid="confluence-card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                      <Target className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    </div>
                    <h3 className="h3-metric-label">Total Trades</h3>
                  </div>
                </div>
                <p className="metric-value">{stats.totalTrades}</p>
              </div>
             
              <div className="dashboard-card" data-testid="confluence-card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                      <DollarSign className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    </div>
                    <h3 className="h3-metric-label">Total P&L</h3>
                  </div>
                </div>
                <p className={`metric-value ${(stats.totalPnL || 0) >= 0 ? '' : 'text-rust-red'}`}
                   style={{ color: (stats.totalPnL || 0) >= 0 ? 'var(--warm-off-white)' : 'var(--rust-red)' }}>
                  {formatCurrency(stats.totalPnL)}
                </p>
              </div>
             
              <div className="dashboard-card" data-testid="confluence-card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    </div>
                    <h3 className="h3-metric-label">Win Rate</h3>
                  </div>
                </div>
                <p className="metric-value">{stats && stats.winRate !== null ? stats.winRate.toFixed(1) : '0'}%</p>
              </div>
             
              <div className="dashboard-card" data-testid="confluence-card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                      <Activity className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    </div>
                    <h3 className="h3-metric-label">Last Sync</h3>
                  </div>
                </div>
                <p className="metric-value">
                  {new Date(stats.lastSyncTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="dashboard-card p-section mb-component text-center">
              <Target className="w-16 h-16 mx-auto mb-component" style={{ color: 'var(--muted-gray)' }} />
              <h3 className="h2-section mb-element">No trade data available</h3>
              <p className="body-text mb-component">
                Add some trades to see your confluence analysis here
              </p>
              <button
                onClick={handleRefresh}
                className="button-primary"
              >
                Refresh Data
              </button>
            </div>
          )}

          {/* Advanced Filters Section - Redesigned for Better Aesthetics and Symmetry */}
          <div className="dashboard-card mb-component">
            <div className="card-header mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                    <Filter className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                  </div>
                  <div>
                    <h2 className="h2-section">Advanced Filters</h2>
                    <p className="body-text text-sm">Refine your trading analysis with comprehensive filtering options</p>
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="button-secondary px-4 py-2"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            {/* Symmetrical Three-Column Layout with Consistent Spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Search and Date Filters */}
              <div className="space-y-6">
                <div className="filter-section">
                  <label className="block label-text mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    Symbol Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={symbolFilter}
                      onChange={(e) => {
                        setSymbolFilter(e.target.value);
                        setCurrentPage(1);
                        setTimeout(() => {
                          fetchFilteredTrades(1);
                          fetchStats({
                            emotionalStates: selectedEmotions,
                            symbol: e.target.value,
                            market: marketFilter,
                            strategyId: strategyFilter,
                            dateFrom: dateFromFilter,
                            dateTo: dateToFilter,
                            pnlFilter: pnlFilter,
                            side: sideFilter
                          });
                        }, 300);
                      }}
                      placeholder="Search symbols (e.g., AAPL, BTC)"
                      className="input-field pr-10"
                    />
                    {symbolFilter && (
                      <button
                        onClick={() => {
                          setSymbolFilter('');
                          setCurrentPage(1);
                          setTimeout(() => {
                            fetchFilteredTrades(1);
                            fetchStats({
                              emotionalStates: selectedEmotions,
                              symbol: '',
                              market: marketFilter,
                              strategyId: strategyFilter,
                              dateFrom: dateFromFilter,
                              dateTo: dateToFilter,
                              pnlFilter: pnlFilter,
                              side: sideFilter
                            });
                          }, 100);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 secondary-text hover:body-text transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="filter-section">
                  <label className="block label-text mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs secondary-text mb-2">From</label>
                      <input
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => {
                          setDateFromFilter(e.target.value);
                          setCurrentPage(1);
                          setTimeout(() => {
                            fetchFilteredTrades(1);
                            fetchStats({
                              emotionalStates: selectedEmotions,
                              symbol: symbolFilter,
                              market: marketFilter,
                              strategyId: strategyFilter,
                              dateFrom: e.target.value,
                              dateTo: dateToFilter,
                              pnlFilter: pnlFilter,
                              side: sideFilter
                            });
                          }, 100);
                        }}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs secondary-text mb-2">To</label>
                      <input
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => {
                          setDateToFilter(e.target.value);
                          setCurrentPage(1);
                          setTimeout(() => {
                            fetchFilteredTrades(1);
                            fetchStats({
                              emotionalStates: selectedEmotions,
                              symbol: symbolFilter,
                              market: marketFilter,
                              strategyId: strategyFilter,
                              dateFrom: dateFromFilter,
                              dateTo: e.target.value,
                              pnlFilter: pnlFilter,
                              side: sideFilter
                            });
                          }, 100);
                        }}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Market, Strategy, and P&L Filters */}
              <div className="space-y-6">
                <div className="filter-section">
                  <label className="block label-text mb-3">Market</label>
                  <div className="relative">
                    <select
                      value={marketFilter}
                      onChange={(e) => {
                        setMarketFilter(e.target.value);
                        setCurrentPage(1);
                        setTimeout(() => {
                          fetchFilteredTrades(1);
                          fetchStats({
                            emotionalStates: selectedEmotions,
                            symbol: symbolFilter,
                            market: e.target.value,
                            strategyId: strategyFilter,
                            dateFrom: dateFromFilter,
                            dateTo: dateToFilter,
                            pnlFilter: pnlFilter,
                            side: sideFilter
                          });
                        }, 100);
                      }}
                      className="input-field appearance-none cursor-pointer pr-10"
                    >
                      <option value="">All Markets</option>
                      {AVAILABLE_MARKETS.map(market => (
                        <option key={market} value={market}>{market}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 secondary-text pointer-events-none" />
                  </div>
                </div>

                <div className="filter-section">
                  <label className="block label-text mb-3">Strategy</label>
                  <div className="relative">
                    <select
                      value={strategyFilter}
                      onChange={(e) => {
                        setStrategyFilter(e.target.value);
                        setCurrentPage(1);
                        setTimeout(() => {
                          fetchFilteredTrades(1);
                          fetchStats({
                            emotionalStates: selectedEmotions,
                            symbol: symbolFilter,
                            market: marketFilter,
                            strategyId: e.target.value,
                            dateFrom: dateFromFilter,
                            dateTo: dateToFilter,
                            pnlFilter: pnlFilter,
                            side: sideFilter
                          });
                        }, 100);
                      }}
                      className="input-field appearance-none cursor-pointer pr-10"
                    >
                      <option value="">All Strategies</option>
                      {availableStrategies.map(strategy => (
                        <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 secondary-text pointer-events-none" />
                  </div>
                </div>

                <div className="filter-section">
                  <label className="block label-text mb-3">P&L Filter</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PNL_FILTER_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPnlFilter(option.value as 'all' | 'profitable' | 'lossable');
                          setCurrentPage(1);
                          setTimeout(() => {
                            fetchFilteredTrades(1);
                            fetchStats({
                              emotionalStates: selectedEmotions,
                              symbol: symbolFilter,
                              market: marketFilter,
                              strategyId: strategyFilter,
                              dateFrom: dateFromFilter,
                              dateTo: dateToFilter,
                              pnlFilter: option.value as 'all' | 'profitable' | 'lossable',
                              side: sideFilter
                            });
                          }, 100);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          pnlFilter === option.value
                            ? 'button-primary'
                            : 'button-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Side and Emotional Filters */}
              <div className="space-y-6">
                <div className="filter-section">
                  <label className="block label-text mb-3">Trade Side</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SIDE_FILTER_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSideFilter(option.value as 'Buy' | 'Sell' | '');
                          setCurrentPage(1);
                          setTimeout(() => {
                            fetchFilteredTrades(1);
                            fetchStats({
                              emotionalStates: selectedEmotions,
                              symbol: symbolFilter,
                              market: marketFilter,
                              strategyId: strategyFilter,
                              dateFrom: dateFromFilter,
                              dateTo: dateToFilter,
                              pnlFilter: pnlFilter,
                              side: option.value as 'Buy' | 'Sell' | ''
                            });
                          }, 100);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                          sideFilter === option.value
                            ? 'button-primary'
                            : 'button-secondary'
                        }`}
                      >
                        {option.value === 'Buy' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {option.value === 'Sell' && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <label className="block label-text mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                    Emotional States
                  </label>
                  <div className="border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_EMOTIONS.map(emotion => (
                        <button
                          key={emotion}
                          onClick={() => toggleEmotion(emotion)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all ${
                            selectedEmotions.includes(emotion)
                              ? 'bg-opacity-10 text-dusty-gold border'
                              : 'bg-verotrade-quaternary-black text-verotrade-text-primary hover:bg-verotrade-quinary-black border border-verotrade-border-primary'
                          }`}
                          style={selectedEmotions.includes(emotion) ? {
                            backgroundColor: 'rgba(184, 155, 94, 0.1)',
                            borderColor: 'var(--dusty-gold)',
                            color: 'var(--dusty-gold)'
                          } : {}}
                        >
                          {selectedEmotions.includes(emotion) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <div className="w-3.5 h-3.5 border secondary-text rounded" />
                          )}
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedEmotions.length > 0 && (
                    <div className="flex items-center justify-between mt-3 px-1">
                      <p className="text-xs secondary-text">
                        {selectedEmotions.length} emotion{selectedEmotions.length !== 1 ? 's' : ''} selected
                      </p>
                      <button
                        onClick={clearEmotionFilters}
                        className="text-xs font-medium text-dusty-gold hover:opacity-80 transition-colors"
                        style={{ color: 'var(--dusty-gold)' }}
                      >
                        Clear emotions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emotional Analysis Section - Full Width Below Filters */}
          <div className="dashboard-card mb-component">
            <div className="card-header mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                  <Brain className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                </div>
                <div>
                  <h2 className="h2-section">Emotional Analysis</h2>
                  <p className="body-text text-sm">Distribution of emotional states during trades</p>
                </div>
                {statsLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 ml-2" style={{ borderColor: 'var(--dusty-gold)' }}></div>
                )}
              </div>
            </div>
            <div style={{ height: '300px' }}>
              {statsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--dusty-gold)' }}></div>
                    <p className="body-text text-sm">Updating emotional data...</p>
                  </div>
                </div>
              ) : stats?.emotionalData && stats.emotionalData.length > 0 ? (
                <div className="h-full">
                  <EmotionRadar data={stats.emotionalData} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="secondary-text mb-2">No emotional data available</div>
                    <p className="body-text text-sm">Start logging emotions with your trades to see analysis</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Quick Insights Section - Full Width */}
          <div className="dashboard-card mb-component">
            <div className="card-header mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                  <Activity className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                </div>
                <div>
                  <h2 className="h2-section">Quick Insights</h2>
                  <p className="body-text text-sm">Comprehensive trading performance metrics and patterns</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <div className="insight-card">
                <div className="p-5 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black h-full">
                  <h3 className="text-sm font-medium text-dusty-gold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Best Trading Day</span>
                      <span className="text-sm font-medium text-dusty-gold">Monday</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Average Win</span>
                      <span className="text-sm font-medium text-green-400">$245.67</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Average Loss</span>
                      <span className="text-sm font-medium text-rust-red">-$89.23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Profit Factor</span>
                      <span className="text-sm font-medium text-dusty-gold">2.75</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Max Drawdown</span>
                      <span className="text-sm font-medium text-rust-red">-$1,234</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trading Activity */}
              <div className="insight-card">
                <div className="p-5 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black h-full">
                  <h3 className="text-sm font-medium text-dusty-gold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm body-text">3 profitable trades this week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-rust-red rounded-full"></div>
                      <span className="text-sm body-text">2 loss trades this week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-dusty-gold rounded-full"></div>
                      <span className="text-sm body-text">60% win rate this month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm body-text">15 trades total this week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm body-text">Most active: Crypto market</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotional Patterns */}
              <div className="insight-card">
                <div className="p-5 border border-verotrade-border-primary rounded-lg bg-verotrade-tertiary-black h-full">
                  <h3 className="text-sm font-medium text-dusty-gold mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Emotional Patterns
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Most Common</span>
                      <span className="text-sm font-medium text-dusty-gold">CONFIDENT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Highest P&L Emotion</span>
                      <span className="text-sm font-medium text-green-400">PATIENCE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Riskiest Emotion</span>
                      <span className="text-sm font-medium text-rust-red">TILT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Emotional Diversity</span>
                      <span className="text-sm font-medium text-dusty-gold">8/10 types</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm body-text">Neutral Trades</span>
                      <span className="text-sm font-medium text-blue-400">25%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trades Table */}
          <div className="dashboard-card">
            <div className="card-header mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                <h2 className="h2-section">
                  Filtered Trades ({tradesPagination?.totalCount || 0})
                </h2>
              </div>
              {tradesLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--dusty-gold)' }}></div>
              )}
            </div>
            <p className="body-text text-sm mb-4">Your filtered trading results with detailed information</p>

            {tradesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--dusty-gold)' }}></div>
                <p className="body-text text-sm">Loading trades...</p>
              </div>
            ) : filteredTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Symbol</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Side</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Quantity</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Entry</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Exit</th>
                      <th className="text-right py-3 px-4 body-text text-sm font-medium">P&L</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Date</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Strategy</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Market</th>
                      <th className="text-left py-3 px-4 body-text text-sm font-medium">Emotions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-opacity-5 transition-colors"
                          style={{ borderColor: 'var(--border-primary)' }}>
                        <td className="py-3 px-4 body-text text-sm font-medium">{trade.symbol}</td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            trade.side === 'Buy' ? 'text-dusty-gold' : 'text-rust-red'
                          }`} style={{ color: trade.side === 'Buy' ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-3 px-4 body-text text-sm">{trade.quantity}</td>
                        <td className="py-3 px-4 body-text text-sm">${trade.entry_price ? trade.entry_price.toFixed(2) : '0.00'}</td>
                        <td className="py-3 px-4 body-text text-sm">
                          {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          (trade.pnl || 0) >= 0 ? 'text-dusty-gold' : 'text-rust-red'
                        }`} style={{ color: (trade.pnl || 0) >= 0 ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                          {formatCurrency(trade.pnl || 0)}
                        </td>
                        <td className="py-3 px-4 body-text text-sm">
                          {new Date(trade.trade_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 body-text text-sm">
                          {trade.strategies?.name || '-'}
                        </td>
                        <td className="py-3 px-4 body-text text-sm">
                          {trade.market || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {trade.emotional_state && trade.emotional_state.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {trade.emotional_state.slice(0, 3).map((emotion, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-opacity-10 text-dusty-gold rounded text-xs border"
                                  style={{
                                    backgroundColor: 'rgba(184, 155, 94, 0.1)',
                                    borderColor: 'var(--dusty-gold)',
                                    color: 'var(--dusty-gold)'
                                  }}
                                >
                                  {emotion}
                                </span>
                              ))}
                              {trade.emotional_state.length > 3 && (
                                <span className="px-2 py-1 bg-verotrade-tertiary-black secondary-text rounded text-xs">
                                  +{trade.emotional_state.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="secondary-text">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {tradesPagination && tradesPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="body-text text-sm">
                      Showing {filteredTrades.length} of {tradesPagination.totalCount} trades
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!tradesPagination.hasPreviousPage}
                        className="button-secondary p-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="body-text font-medium px-3">
                        Page {currentPage} of {tradesPagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!tradesPagination.hasNextPage}
                        className="button-secondary p-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-gray)' }} />
                <h3 className="h2-section mb-2">No trades found</h3>
                <p className="body-text mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters to see more results'
                    : 'Add some trades to see your confluence analysis here'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="button-secondary"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}

// Wrapper component with authentication guard
function ConfluencePageWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <ConfluencePage />
    </AuthGuard>
  );
}

export default ConfluencePageWithAuth;