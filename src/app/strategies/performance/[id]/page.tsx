'use client';

import { useState, useEffect, useMemo, use, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { validateUUID } from '@/lib/uuid-validation';
import { StrategyStats, StrategyWithRules } from '@/lib/strategy-rules-engine';
import {
  ArrowLeft,
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
import { fetchTradeDataForPerformance, memoizedStrategyStats } from '@/lib/optimized-queries';
import { memoizedTradeProcessing } from '@/lib/memoization';

// Lazy load performance chart to improve initial load time
const StrategyPerformanceChart = dynamic(() => import('@/components/ui/StrategyPerformanceChart'), {
  loading: () => <div className="h-64 lg:h-80 flex items-center justify-center text-white/70"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>,
  ssr: false
});

export default function StrategyPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  // ===== INFINITE REFRESH DIAGNOSTIC LOGGING =====
  console.log('🔄 [DIAGNOSTIC] === COMPONENT FUNCTION CALLED ===');
  console.log('🔄 [DIAGNOSTIC] Render timestamp:', new Date().toISOString());
  // ===== END DIAGNOSTIC LOGGING =====
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategyWithRules & { stats: StrategyStats | null } | null>(null);
  const [tradeData, setTradeData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'rules'>('overview');
  
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const strategyId = resolvedParams.id;

  useEffect(() => {
    console.log('🔄 [INFINITE REFRESH DEBUG] useEffect triggered for strategyId:', strategyId);
    loadStrategy();
  }, [strategyId]);

  const loadStrategy = async () => {
    console.log('🔄 [INFINITE REFRESH DEBUG] loadStrategy called for strategyId:', strategyId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Validate UUIDs before database operation
      const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
      const validatedUserId = validateUUID(user.id, 'user_id');
      
      // Get strategy with stats
      const { data: strategyData, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', validatedStrategyId)
        .eq('user_id', validatedUserId)
        .single();

      if (error) {
        // Enhanced error logging to distinguish between permission and database errors
        console.log('🔍 [DIAGNOSTIC] Raw error object received:', error);
        console.log('🔍 [DIAGNOSTIC] Error type:', typeof error);
        console.log('🔍 [DIAGNOSTIC] Error keys:', error ? Object.keys(error) : 'error is null/undefined');
        
        const errorDetails = {
          error: error?.message || 'No error message available',
          code: error?.code || 'No error code available',
          details: error?.details || 'No error details available',
          hint: error?.hint || 'No error hint available',
          strategyId: strategyId,
          userId: user.id,
          timestamp: new Date().toISOString()
        };
        
        console.log('🔍 [DIAGNOSTIC] Processed errorDetails:', errorDetails);
        
        // Only log if we have actual error content to prevent empty objects
        if (errorDetails.error !== 'No error message available' ||
            errorDetails.code !== 'No error code available' ||
            errorDetails.details !== 'No error details available') {
          console.error('Strategy query error:', errorDetails);
        } else {
          console.warn('🔍 [DIAGNOSTIC] Suppressed empty error object logging to prevent "{}" output');
        }
        
        // Additional logging to prevent empty error objects
        console.log('🔍 [DEBUG] Strategy query error details:', {
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
          errorObject: JSON.stringify(error, null, 2)
        });

        // Check for specific error types
        if (error.code === 'PGRST116') {
          // No rows returned - strategy doesn't exist
          alert('Strategy not found. It may have been deleted or the ID is incorrect.');
        } else if (error.code === '42501') {
          // Permission denied
          alert('You do not have permission to view this strategy.');
        } else if (error.message.includes('strategy_rule_compliance')) {
          // Schema cache issue
          console.error('SCHEMA CACHE ISSUE DETECTED: strategy_rule_compliance reference found', {
            error: error.message,
            query: 'strategies table select with id and user_id filter'
          });
          alert('Database schema issue detected. Please try refreshing the page or contact support.');
        } else {
          // Generic database error
          alert(`Database error: ${error.message}. Please try again or contact support if the issue persists.`);
        }
        router.push('/strategies');
        return;
      }

      if (!strategyData) {
        console.warn('No strategy data returned', {
          strategyId: strategyId,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        alert('Strategy not found. It may have been deleted.');
        router.push('/strategies');
        return;
      }

      // Calculate strategy stats using the memoized function
      console.log('🔄 [INFINITE REFRESH DEBUG] Calculating stats for strategy:', validatedStrategyId);
      const statsData = await memoizedStrategyStats(validatedStrategyId);
      console.log('🔄 [INFINITE REFRESH DEBUG] Stats calculated, setting strategy state');

      // Only update if stats or strategy data has actually changed
      setStrategy(prevStrategy => {
        // If no previous strategy or different ID, update
        if (!prevStrategy || prevStrategy.id !== strategyData.id) {
          return {
            ...strategyData,
            stats: statsData
          };
        }
        
        // If stats are the same, keep the same reference
        if (prevStrategy.stats === statsData) {
          return prevStrategy;
        }
        
        // Create new object but try to maintain reference stability
        return {
          ...prevStrategy,
          ...strategyData,
          stats: statsData
        };
      });
      console.log('🔄 [INFINITE REFRESH DEBUG] Strategy state set successfully');
      
    } catch (error) {
      console.error('Exception in loadStrategy:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        strategyId: strategyId,
        timestamp: new Date().toISOString()
      });
      alert('An unexpected error occurred while loading the strategy. Please try again.');
      router.push('/strategies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTradeData = useCallback(async () => {
    console.log('🔄 [INFINITE REFRESH DEBUG] loadTradeData called, strategy exists:', !!strategy);
    if (!strategy) return;
    
    try {
      console.log('🔍 [PERFORMANCE PAGE] Using optimized trade data fetch for strategy:', strategy.id);
      
      // Use optimized query function
      const data = await fetchTradeDataForPerformance(strategy.id, 100);
      console.log('🔄 [INFINITE REFRESH DEBUG] Trade data fetched, length:', data?.length || 0);
      setTradeData(data || []);
    } catch (error) {
      console.error('Error loading trade data:', error);
      setTradeData([]);
    }
  }, [strategy?.id]); // Only depend on strategy.id, not the entire strategy object

  useEffect(() => {
    console.log('🔄 [INFINITE REFRESH DEBUG] Trade data useEffect triggered, strategy:', strategy ? strategy.id : 'null');
    if (strategy) {
      loadTradeData();
    }
  }, [strategy?.id, loadTradeData]); // Only depend on strategy.id and the loadTradeData callback

  const stats = strategy?.stats;
  const hasRules = strategy?.rules && strategy.rules.length > 0;

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatRatio = (value: number) => value.toFixed(2);
  const formatMinutes = (value: number) => `${Math.round(value)} min`;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Strategy Not Found</h2>
          <p className="text-white/60 mb-4">The strategy you're trying to view doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => router.push('/strategies')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Strategies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.push('/strategies')}
        className="text-white mb-4 inline-flex items-center gap-2 hover:text-blue-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Strategies
      </button>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white break-words word-wrap overflow-wrap break-word overflow-wrap break-word">{strategy.name}</h1>
          {strategy.is_active ? (
            <div className="px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 text-xs sm:text-sm rounded-full border border-green-500/30 w-fit flex-shrink-0">
              Active
            </div>
          ) : (
            <div className="px-2 sm:px-3 py-1 bg-gray-500/20 text-gray-400 text-xs sm:text-sm rounded-full border border-gray-500/30 w-fit flex-shrink-0">
              Inactive
            </div>
          )}
        </div>
        {strategy.description && (
          <p className="text-white/60">{strategy.description}</p>
        )}
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="text-center p-3 sm:p-4 bg-blue-600/10 rounded-lg border border-blue-500/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2">
            <Target className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-blue-400 font-medium truncate w-full">Winrate:</span>
            <span className={`text-base sm:text-lg font-bold ${stats && stats.winrate >= 50 ? 'text-green-400' : 'text-red-400'} truncate w-full`}>
              {stats ? formatPercentage(stats.winrate) : 'No Data'}
            </span>
          </div>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-purple-600/10 rounded-lg border border-purple-500/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2">
            <Target className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-purple-400 font-medium truncate w-full">Profit Factor:</span>
            <span className={`text-base sm:text-lg font-bold ${stats && stats.profit_factor >= 1.5 ? 'text-green-400' : 'text-red-400'} truncate w-full`}>
              {stats ? formatRatio(stats.profit_factor) : 'No Data'}
            </span>
          </div>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-green-600/10 rounded-lg border border-green-500/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2">
            {stats && stats.total_pnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm text-green-400 font-medium truncate w-full">Net PnL:</span>
            <span className={`text-base sm:text-lg font-bold ${stats && stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'} truncate w-full`}>
              {stats ? formatCurrency(stats.total_pnl) : 'No Data'}
            </span>
          </div>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-orange-600/10 rounded-lg border border-orange-500/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2">
            <Target className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-orange-400 font-medium truncate w-full">Trades:</span>
            <span className="text-base sm:text-lg font-bold text-white truncate w-full">
              {stats ? stats.total_trades : 'No Data'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-white/10 overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'overview'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('performance')}
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
            onClick={() => setActiveTab('rules')}
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
                      <span className="text-green-400 font-semibold text-right truncate">
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
                      <span className="text-white font-semibold text-right truncate">
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
                      <span className="text-white font-semibold text-right truncate">
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
                      <span className="text-green-400 font-semibold text-right truncate">
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
                      <span className="text-white font-semibold text-right truncate">
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
            {tradeData.length > 0 && (
              <div className="w-full overflow-x-auto">
                <StrategyPerformanceChart
                  data={tradeData}
                  title={`${strategy.name} Performance`}
                />
              </div>
            )}
            
            {/* Average Wins and Losses in Rows */}
            {stats && stats.total_trades > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">Average Trade Analysis</h3>
                  </div>
                 
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Average Win Row */}
                    <div className="p-3 sm:p-4 bg-green-600/10 rounded-lg border border-green-500/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-green-400 font-medium truncate w-full">Average Win:</span>
                        <span className="text-base sm:text-lg font-bold text-green-400 truncate w-full">
                          {formatCurrency(stats.average_win)}
                        </span>
                      </div>
                    </div>
                   
                    {/* Average Loss Row */}
                    <div className="p-3 sm:p-4 bg-red-600/10 rounded-lg border border-red-500/20 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-red-400 font-medium truncate w-full">Average Loss:</span>
                        <span className="text-base sm:text-lg font-bold text-red-400 truncate w-full">
                          {formatCurrency(stats.average_loss)}
                        </span>
                      </div>
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
             
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
  );
}