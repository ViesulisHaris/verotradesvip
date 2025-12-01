'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { StrategyStats, StrategyWithRules } from '@/lib/strategy-rules-engine';
import {
  X,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { validateUUID } from '@/lib/uuid-validation';
import { fetchTradeDataForPerformance, memoizedStrategyStats } from '@/lib/optimized-queries';
import { memoizedTradeProcessing, createDebouncedFunction } from '@/lib/memoization';

// Lazy load the performance chart to improve initial load time
const StrategyPerformanceChart = dynamic(() => import('@/components/ui/StrategyPerformanceChart'), {
  loading: () => <div className="h-64 lg:h-80 flex items-center justify-center text-white/70"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>,
  ssr: false
});

interface Props {
  strategy: StrategyWithRules & { stats: StrategyStats | null };
  onClose: () => void;
}

export default function StrategyPerformanceModal({ strategy, onClose }: Props) {
  // Validate strategy prop on component mount
  const [isValidStrategy, setIsValidStrategy] = useState(false);
  const [isValidatingStrategy, setIsValidatingStrategy] = useState(true);
  const [tradeData, setTradeData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'rules'>('overview');
  const [stats, setStats] = useState<StrategyStats | null>(null);
  const [hasRules, setHasRules] = useState(false);
  const [isLoadingTradeData, setIsLoadingTradeData] = useState(false);

  useEffect(() => {
    console.log('🔍 [DEBUG] Strategy validation useEffect triggered:', {
      hasStrategy: !!strategy,
      strategyId: strategy?.id,
      strategyName: strategy?.name,
      hasStats: !!strategy?.stats,
      hasRules: strategy?.rules?.length > 0,
      rulesCount: strategy?.rules?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Set validating state to true at the start
    setIsValidatingStrategy(true);
    
    // Validate strategy object and ID
    if (!strategy || !strategy.id) {
      console.error('🔍 [DEBUG] Invalid strategy object passed to StrategyPerformanceModal:', {
        strategy,
        hasStrategy: !!strategy,
        hasId: !!strategy?.id,
        strategyId: strategy?.id
      });
      setIsValidStrategy(false);
      setIsValidatingStrategy(false);
      return;
    }

    try {
      console.log('🔍 [DEBUG] Attempting to validate strategy ID:', strategy.id);
      const validatedStrategyId = validateUUID(strategy.id, 'strategy_id');
      console.log('🔍 [DEBUG] Strategy ID validated successfully:', validatedStrategyId);
      
      setIsValidStrategy(true);
      setStats(strategy.stats);
      setHasRules(strategy.rules && strategy.rules.length > 0);
      
      console.log('🔍 [DEBUG] Strategy validation completed:', {
        isValidStrategy: true,
        validatedStrategyId,
        hasStats: !!strategy.stats,
        hasRules: strategy.rules && strategy.rules.length > 0,
        rulesCount: strategy.rules?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('🔍 [DEBUG] Invalid strategy ID in StrategyPerformanceModal:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        strategyId: strategy.id,
        strategyName: strategy.name,
        timestamp: new Date().toISOString()
      });
      setIsValidStrategy(false);
    } finally {
      // Always set validating to false when done
      setIsValidatingStrategy(false);
    }
  }, [strategy.id, strategy.stats, strategy.rules]);

  // Process trade data for the chart
  const chartData = useMemo(() => {
    console.log('🔍 [CHART_DATA_DEBUG] Processing chart data:', {
      hasTradeData: !!tradeData,
      tradeDataLength: tradeData.length,
      sampleTradeData: tradeData.slice(0, 2),
      timestamp: new Date().toISOString()
    });
    
    if (!tradeData || tradeData.length === 0) {
      console.log('🔍 [CHART_DATA_DEBUG] No trade data available, returning empty array');
      return [];
    }
    
    let cumulative = 0;
    const processedData = tradeData.map(trade => {
      cumulative += trade.pnl || 0;
      return {
        date: new Date(trade.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: trade.pnl || 0,
        cumulative
      };
    });
    
    console.log('🔍 [CHART_DATA_DEBUG] Chart data processed successfully:', {
      inputLength: tradeData.length,
      outputLength: processedData.length,
      firstPoint: processedData[0],
      lastPoint: processedData[processedData.length - 1],
      totalCumulative: cumulative
    });
    
    return processedData;
  }, [tradeData]);


  // Debounced trade data loading to prevent excessive API calls
  // Use useMemo to prevent recreation on every render
  const debouncedLoadTradeData = useMemo(() => {
    return createDebouncedFunction(async () => {
      console.log('🔍 [DEBUG] loadTradeData called:', {
        strategyId: strategy.id,
        strategyName: strategy.name,
        timestamp: new Date().toISOString()
      });
      
      // Guard conditions to prevent race conditions
      if (!strategy || !strategy.id) {
        console.error('🔍 [DEBUG] Cannot load trade data: Invalid strategy', {
          strategyId: strategy?.id,
          strategyName: strategy?.name
        });
        return;
      }

      // Prevent multiple simultaneous calls
      if (isLoadingTradeData) {
        console.log('🔍 [DEBUG] Trade data already loading, skipping duplicate call');
        return;
      }

      try {
        setIsLoadingTradeData(true);
        console.log('🔍 [DEBUG] Using optimized trade data fetch...');
        
        // Use optimized query function
        const data = await fetchTradeDataForPerformance(strategy.id, 100);
        
        console.log('🔍 [DEBUG] Optimized trade data result:', {
          hasData: !!data,
          dataLength: data?.length || 0,
          timestamp: new Date().toISOString()
        });

        setTradeData(data || []);
      } catch (error) {
        console.error('🔍 [DEBUG] Error loading trade data:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          strategyId: strategy.id,
          timestamp: new Date().toISOString()
        });
        // Set empty data to prevent infinite loading
        setTradeData([]);
      } finally {
        setIsLoadingTradeData(false);
      }
    }, 300); // 300ms debounce
  }, []); // Empty dependency array - create once

  useEffect(() => {
    console.log('🔍 [DEBUG] StrategyPerformanceModal mounted useEffect triggered:', {
      strategyName: strategy.name,
      strategyId: strategy.id,
      timestamp: new Date().toISOString()
    });
    
    // Only load trade data if strategy is valid AND validation is complete
    if (isValidStrategy && !isValidatingStrategy) {
      console.log('🔍 [DEBUG] Strategy is valid and validation complete, calling debouncedLoadTradeData...');
      debouncedLoadTradeData();
    } else {
      console.log('🔍 [DEBUG] Strategy is not valid or validation in progress, skipping loadTradeData', {
        isValidStrategy,
        isValidatingStrategy
      });
    }
    
    return () => {
      console.log('🔍 [DEBUG] StrategyPerformanceModal unmounting', {
        strategyName: strategy.name,
        timestamp: new Date().toISOString()
      });
    };
  }, [strategy.id]); // Only depend on strategy.id to prevent cascading re-renders

  // Add effect to load data when Performance tab is accessed
  useEffect(() => {
    if (activeTab === 'performance' && isValidStrategy && !isValidatingStrategy && tradeData.length === 0 && !isLoadingTradeData) {
      console.log('🔍 [DEBUG] Performance tab accessed but no data loaded, triggering data reload...');
      debouncedLoadTradeData();
    }
  }, [activeTab, strategy.id]); // Only depend on activeTab and strategy.id

  // Add ESC key handler to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Add diagnostic logging for modal rendering - MOVED BEFORE EARLY RETURN
  useEffect(() => {
    console.log('🔍 [MODAL_DEBUG] Modal rendering diagnostics:', {
      timestamp: new Date().toISOString(),
      modalVisible: true,
      strategyName: strategy.name,
      strategyId: strategy.id,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      computedZIndex: getComputedStyle(document.documentElement).getPropertyValue('--tw-z-index'),
      hasFixedPositioning: true,
      hasBackdropFilter: true,
      modalContainer: document.querySelector('[class*="fixed inset-0"]'),
      parentContainers: document.querySelectorAll('.overflow-hidden, .contain-layout, .contain-paint'),
      modalZIndex: '999999'
    });

    // Check for potential positioning conflicts
    const modalElement = document.querySelector('[class*="fixed inset-0"]');
    if (modalElement) {
      const computedStyle = window.getComputedStyle(modalElement);
      console.log('🔍 [MODAL_DEBUG] Modal computed styles:', {
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        top: computedStyle.top,
        left: computedStyle.left,
        width: computedStyle.width,
        height: computedStyle.height,
        transform: computedStyle.transform,
        willChange: computedStyle.willChange,
        contain: computedStyle.contain
      });
    }

    // Check for overlapping modals or containers
    const allFixedElements = document.querySelectorAll('[style*="position: fixed"], [class*="fixed"]');
    console.log('🔍 [MODAL_DEBUG] Fixed elements on page:', {
      count: allFixedElements.length,
      elements: Array.from(allFixedElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        hasBackdropFilter: window.getComputedStyle(el).backdropFilter !== 'none'
      }))
    });
  }, [strategy.name, strategy.id]);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatRatio = (value: number) => value.toFixed(2);
  const formatMinutes = (value: number) => `${Math.round(value)} min`;

  if (!isValidStrategy) {
    return createPortal(
      <div
        className="modal-overlay modal-backdrop fixed inset-0 bg-[var(--deep-charcoal)]/70 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="glass w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative scrollbar-glass"
          style={{
            borderRadius: '12px',
            background: 'var(--soft-graphite)',
            border: '0.8px solid rgba(184, 155, 94, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: 'var(--rust-red)' }}>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Invalid Strategy</h2>
              <p className="text-sm sm:text-base text-white/70 mb-6">This strategy modal contains invalid data.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="modal-overlay modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fade-in"
      onClick={onClose}
      data-testid="strategy-performance-modal-backdrop"
    >
      <div
        className="glass w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative scrollbar-glass"
        style={{
          borderRadius: '12px',
          background: 'var(--soft-graphite)',
          border: '0.8px solid rgba(184, 155, 94, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
          style={{
            background: 'transparent',
            border: 'none'
          }}
        >
          <X className="w-5 h-5" style={{ color: 'var(--warm-off-white)' }} />
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-6 pr-8 sm:pr-10 md:pr-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold break-words word-wrap break-word overflow-wrap break-word" style={{ color: 'var(--warm-off-white)' }}>{strategy.name}</h2>
            {strategy.is_active ? (
              <div className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border w-fit flex-shrink-0" style={{
                background: 'rgba(79, 91, 74, 0.2)',
                color: 'var(--muted-olive)',
                borderColor: 'rgba(79, 91, 74, 0.3)'
              }}>
                Active
              </div>
            ) : (
              <div className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border w-fit flex-shrink-0" style={{
                background: 'rgba(154, 154, 154, 0.2)',
                color: 'var(--muted-gray)',
                borderColor: 'rgba(154, 154, 154, 0.3)'
              }}>
                Inactive
              </div>
            )}
          </div>
          {strategy.description && (
            <p className="text-sm sm:text-base text-white/70 break-words word-wrap break-word overflow-wrap break-word line-clamp-3">{strategy.description}</p>
          )}
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-3 sm:p-4 bg-muted-olive/10 rounded-lg border border-muted-olive/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
            <div className="flex flex-col items-center gap-2">
              <Target className="w-5 h-5 metric-winrate-icon flex-shrink-0" />
              <span className="text-xs sm:text-sm metric-label font-medium truncate w-full">Winrate:</span>
              <span className={`text-base sm:text-lg font-bold ${stats && stats.winrate >= 50 ? 'text-green-400' : 'text-red-400'} truncate w-full`}>
                {stats ? formatPercentage(stats.winrate) : 'No Data'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-warm-sand/10 rounded-lg border border-warm-sand/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
            <div className="flex flex-col items-center gap-2">
              <Target className="w-5 h-5 metric-profit-factor-icon flex-shrink-0" />
              <span className="text-xs sm:text-sm metric-label font-medium truncate w-full">Profit Factor:</span>
              <span className={`text-base sm:text-lg font-bold ${stats && stats.profit_factor >= 1.5 ? 'text-green-400' : 'text-red-400'} truncate w-full`}>
                {stats ? formatRatio(stats.profit_factor) : 'No Data'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-dusty-gold/10 rounded-lg border border-dusty-gold/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
            <div className="flex flex-col items-center gap-2">
              {stats && stats.total_pnl >= 0 ? (
                <TrendingUp className="w-5 h-5 metric-pnl-icon flex-shrink-0" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm metric-label font-medium truncate w-full">Net PnL:</span>
              <span className={`text-base sm:text-lg font-bold ${stats && stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'} truncate w-full`}>
                {stats ? formatCurrency(stats.total_pnl) : 'No Data'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-warm-off-white/10 rounded-lg border border-warm-off-white/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
            <div className="flex flex-col items-center gap-2">
              <Target className="w-5 h-5 metric-total-trades-icon flex-shrink-0" />
              <span className="text-xs sm:text-sm metric-label font-medium truncate w-full">Trades:</span>
              <span className="text-base sm:text-lg font-bold metric-total-trades truncate w-full">
                {stats ? stats.total_trades : 'No Data'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-white/10 overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
          <button
            onClick={() => {
              console.log('🔍 [TAB_DEBUG] Overview tab clicked', {
                currentTab: activeTab,
                newTab: 'overview',
                tradeDataLength: tradeData.length,
                chartDataLength: chartData.length,
                timestamp: new Date().toISOString()
              });
              setActiveTab('overview');
            }}
            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              console.log('🔍 [TAB_DEBUG] Performance tab clicked', {
                currentTab: activeTab,
                newTab: 'performance',
                tradeDataLength: tradeData.length,
                chartDataLength: chartData.length,
                hasStats: !!stats,
                isLoadingTradeData,
                timestamp: new Date().toISOString()
              });
              setActiveTab('performance');
            }}
            className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'performance'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Performance
          </button>
          {hasRules && (
            <button
              onClick={() => {
                console.log('🔍 [TAB_DEBUG] Rules tab clicked', {
                  currentTab: activeTab,
                  newTab: 'rules',
                  hasRules,
                  rulesCount: strategy.rules?.length || 0,
                  timestamp: new Date().toISOString()
                });
                setActiveTab('rules');
              }}
              className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'rules'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Rules
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="min-h-[250px] sm:min-h-[300px] lg:min-h-[400px] space-y-4 sm:space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Detailed Analytics Section */}
              <div className="glass p-4 sm:p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white truncate">Performance Analytics</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Trade Analysis Column */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-blue-300 uppercase tracking-wider truncate">Trade Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Average Win</span>
                        <span className="metric-profit-factor font-semibold text-right truncate">
                          {stats && stats.winning_trades > 0 ? formatCurrency(stats.gross_profit / stats.winning_trades) : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Average Loss</span>
                        <span className="text-red-400 font-semibold text-right truncate">
                          {stats && stats.total_trades - stats.winning_trades > 0
                            ? formatCurrency(stats.gross_loss / (stats.total_trades - stats.winning_trades))
                            : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Expectancy</span>
                        <span className="metric-pnl font-semibold text-right truncate">
                          {stats && stats.total_trades > 0 ? formatCurrency(stats.total_pnl / stats.total_trades) : '$0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Metrics Column */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-purple-300 uppercase tracking-wider truncate">Risk Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Sharpe Ratio</span>
                        <span className={`font-semibold text-right truncate ${
                          stats && stats.sharpe_ratio > 1.5 ? 'text-[#B89B5E]' :
                          stats && stats.sharpe_ratio > 0.75 ? 'text-[#7A5C3A]' :
                          stats && stats.sharpe_ratio > 0 ? 'text-[#7A5C3A]' :
                          'text-[#4A2F2A]'
                        }`}>
                          {stats ? stats.sharpe_ratio.toFixed(2) : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Max Drawdown</span>
                        <span className="text-red-400 font-semibold text-right truncate">
                          {stats ? formatCurrency(stats.max_drawdown) : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Avg Hold Time</span>
                        <span className="text-white font-semibold text-right truncate">
                          {stats ? formatMinutes(stats.avg_hold_period) : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trade Statistics Column */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-green-300 uppercase tracking-wider truncate">Trade Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Winning Trades</span>
                        <span className="metric-winrate font-semibold text-right truncate">
                          {stats ? stats.winning_trades : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Losing Trades</span>
                        <span className="text-red-400 font-semibold text-right truncate">
                          {stats ? stats.total_trades - stats.winning_trades : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/70 text-sm truncate flex-shrink-0">Total Trades</span>
                        <span className="metric-total-trades font-semibold text-right truncate">
                          {stats ? stats.total_trades : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {(() => {
                console.log('🔍 [PERFORMANCE_TAB_DEBUG] Performance tab rendered:', {
                  activeTab,
                  chartDataLength: chartData.length,
                  tradeDataLength: tradeData.length,
                  hasStats: !!stats,
                  totalTrades: stats?.total_trades,
                  isLoadingTradeData,
                  strategyId: strategy.id,
                  timestamp: new Date().toISOString()
                });
                return null;
              })()}
              
              {/* Show loading state while data is being fetched */}
              {isLoadingTradeData ? (
                <div className="w-full overflow-x-auto">
                  <div className="h-64 lg:h-80 flex items-center justify-center text-white/70">
                    <div className="text-center px-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-sm">Loading performance data...</p>
                      <p className="text-xs text-white/50 mt-2">Fetching trade history for {strategy.name}</p>
                    </div>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  {(() => {
                    console.log('🔍 [PERFORMANCE_TAB_DEBUG] Rendering chart with data:', {
                      dataPoints: chartData.length,
                      firstDataPoint: chartData[0],
                      lastDataPoint: chartData[chartData.length - 1]
                    });
                    return null;
                  })()}
                  <StrategyPerformanceChart
                    data={chartData}
                    title={`${strategy.name} Performance`}
                  />
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  {(() => {
                    console.log('🔍 [PERFORMANCE_TAB_DEBUG] No chart data available:', {
                      tradeDataLength: tradeData.length,
                      tradeDataSample: tradeData.slice(0, 3),
                      isLoadingTradeData,
                      strategyId: strategy.id
                    });
                    return null;
                  })()}
                  <div className="h-64 lg:h-80 flex items-center justify-center text-white/70">
                    <div className="text-center px-4">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No performance data available</p>
                      <p className="text-xs text-white/50 mt-2">
                        {tradeData.length === 0 ?
                          `No trades found for ${strategy.name} strategy` :
                          'Unable to process performance data'
                        }
                      </p>
                      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-white/60">
                          <strong>Troubleshooting:</strong>
                        </p>
                        <ul className="text-xs text-white/50 mt-2 space-y-1">
                          <li>• Ensure trades are associated with this strategy</li>
                          <li>• Check that trades have valid P&L values</li>
                          <li>• Verify strategy has active trade history</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {stats && stats.total_trades > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 min-h-[160px] flex flex-col">
                    <h5 className="text-sm font-medium text-white mb-2 truncate">Performance Metrics</h5>
                    <div className="space-y-2 text-sm flex-grow">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Winning Trades:</span>
                        <span className="text-white text-right text-xs sm:text-sm truncate">{stats.winning_trades}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Gross Profit:</span>
                        <span className="metric-profit-factor text-right text-xs sm:text-sm truncate">{formatCurrency(stats.gross_profit)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Gross Loss:</span>
                        <span className="text-red-400 text-right text-xs sm:text-sm truncate">{formatCurrency(stats.gross_loss)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Max Drawdown:</span>
                        <span className="text-red-400 text-right text-xs sm:text-sm truncate">{formatCurrency(stats.max_drawdown)}</span>
                      </div>
                    </div>
                  </div>
                   
                  <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 min-h-[160px] flex flex-col">
                    <h5 className="text-sm font-medium text-white mb-2 truncate">Advanced Metrics</h5>
                    <div className="space-y-2 text-sm flex-grow">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Sharpe Ratio:</span>
                        <span className={`text-right text-xs sm:text-sm truncate ${
                          stats.sharpe_ratio > 1.5 ? 'text-[#B89B5E]' :
                          stats.sharpe_ratio > 0.75 ? 'text-[#7A5C3A]' :
                          stats.sharpe_ratio > 0 ? 'text-[#7A5C3A]' :
                          'text-[#4A2F2A]'
                        }`}>{stats.sharpe_ratio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Avg Hold Period:</span>
                        <span className="text-white text-right text-xs sm:text-sm truncate">{formatMinutes(stats.avg_hold_period)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Total Trades:</span>
                        <span className="metric-total-trades text-right text-xs sm:text-sm truncate">{stats.total_trades}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs sm:text-sm flex-shrink-0 truncate">Win Rate:</span>
                        <span className={`${stats.winrate >= 50 ? 'metric-winrate' : 'text-red-400'} text-xs sm:text-sm text-right truncate`}>
                          {formatPercentage(stats.winrate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && hasRules && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Custom Trading Rules
              </h4>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-glass">
                {strategy.rules && strategy.rules.map((rule, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-sm text-white/80 line-clamp-3">{rule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}