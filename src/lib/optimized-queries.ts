// Optimized database queries with pagination and caching
import { supabase } from '@/supabase/client';
import { validateUUID } from '@/lib/uuid-validation';
import { PaginationOptions, buildPaginationQuery, PaginatedResult } from './pagination';
import { memoizedStrategyStats } from './memoization';

// Re-export memoizedStrategyStats for use in other modules
export { memoizedStrategyStats };

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
  emotional_state?: string;
  strategy_id?: string;
  user_id: string;
  notes?: string;
  market?: string;
  strategies?: {
    id: string;
    name: string;
    rules?: string[];
  };
}

/**
 * Fetch trades with pagination and optimized queries
 */
export async function fetchTradesPaginated(
  userId: string,
  options: PaginationOptions & {
    strategyId?: string;
    symbol?: string;
    market?: string;
    dateFrom?: string;
    dateTo?: string;
    pnlFilter?: 'all' | 'profitable' | 'lossable';
    side?: 'Buy' | 'Sell' | '';
    emotionalStates?: string[];
  } = { page: 1, limit: 50 }
): Promise<PaginatedResult<Trade>> {
  const startTime = performance.now();
  
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    // Build optimized query with only necessary columns for list view
    let query = supabase
      .from('trades')
      .select(`
        id,
        symbol,
        side,
        quantity,
        entry_price,
        exit_price,
        pnl,
        trade_date,
        entry_time,
        exit_time,
        emotional_state,
        market,
        strategies (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('user_id', validatedUserId);

    // Apply filters
    if (options.strategyId) {
      const validatedStrategyId = validateUUID(options.strategyId, 'strategy_id');
      query = query.eq('strategy_id', validatedStrategyId);
    }

    if (options.symbol) {
      query = query.ilike('symbol', `%${options.symbol}%`);
    }

    if (options.market) {
      console.log('🔄 [MARKET_FILTER_DEBUG] Applying market filter:', {
        market: options.market,
        timestamp: new Date().toISOString()
      });
      // Use case-insensitive filtering to handle inconsistent casing in database
      query = query.ilike('market', options.market);
    } else {
      console.log('🔄 [MARKET_FILTER_DEBUG] No market filter applied - fetching all markets', {
        timestamp: new Date().toISOString()
      });
    }

    if (options.dateFrom) {
      query = query.gte('trade_date', options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte('trade_date', options.dateTo);
    }

    // P&L filter
    if (options.pnlFilter && options.pnlFilter !== 'all') {
      if (options.pnlFilter === 'profitable') {
        query = query.gt('pnl', 0);
      } else if (options.pnlFilter === 'lossable') {
        query = query.lt('pnl', 0);
      }
    }

    // Trade side filter
    if (options.side) {
      query = query.eq('side', options.side);
    }

    // Emotional states filter - optimized for better performance
    if (options.emotionalStates && options.emotionalStates.length > 0) {
      // Use OR condition for emotional states filtering
      const emotionalStateConditions = options.emotionalStates.map(state =>
        `emotional_state.ilike.%${state}%`
      );
      
      // Apply the filter using .or() for better performance
      query = query.or(emotionalStateConditions.join(','));
      console.log('🔄 [OPTIMIZED_QUERIES_DEBUG] Optimized emotional states filter applied:', options.emotionalStates);
    }

    // Apply pagination
    const { from, to, orderBy } = buildPaginationQuery(options);
    query = query
      .range(from, to)
      .order(orderBy.column as any, { ascending: orderBy.ascending });

    // Execute query
    console.log('🔄 [MARKET_FILTER_DEBUG] Executing trades query with filters:', {
      hasEmotionalStates: !!(options.emotionalStates && options.emotionalStates.length > 0),
      emotionalStates: options.emotionalStates,
      marketFilter: {
        hasFilter: !!options.market,
        value: options.market || 'NO_FILTER',
        timestamp: new Date().toISOString()
      },
      otherFilters: {
        strategyId: options.strategyId,
        symbol: options.symbol,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        pnlFilter: options.pnlFilter,
        side: options.side
      },
      pagination: {
        page: options.page,
        limit: options.limit,
        from: from,
        to: to,
        orderBy: orderBy
      }
    });
    
    const { data, error, count } = await query;
    
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    
    console.log('🔄 [MARKET_FILTER_DEBUG] Optimized trades query response:', {
      hasData: !!data,
      dataLength: data?.length || 0,
      hasError: !!error,
      error: error?.message || null,
      count: count,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / options.limit),
      queryTime: `${queryTime.toFixed(2)}ms`,
      performance: queryTime < 300 ? 'GOOD' : 'NEEDS_OPTIMIZATION',
      marketFilter: {
        applied: !!options.market,
        value: options.market || 'NONE',
        timestamp: new Date().toISOString()
      }
    });
    
    // Additional market-specific logging
    if (data && data.length > 0 && options.market) {
      const marketMatches = data.filter((trade: Trade) => trade.market === options.market).length;
      console.log('🔄 [MARKET_FILTER_DEBUG] Market filter verification:', {
        expectedMarket: options.market,
        totalResults: data.length,
        matchingMarket: marketMatches,
        nonMatchingMarkets: data.length - marketMatches,
        filterAccuracy: marketMatches === data.length ? 'PERFECT' : 'ISSUE_DETECTED',
        timestamp: new Date().toISOString()
      });
    }

    if (error) {
      console.error('Error fetching paginated trades:', error);
      throw error;
    }

    const totalCount = count || 0;
    const currentPage = options.page;
    const totalPages = Math.ceil(totalCount / options.limit);

    // Optimized data processing
    const optimizedData = (data || []).map((trade: Trade) => ({
      ...trade,
      // Pre-calculate commonly used values for better rendering performance
      pnlDisplay: trade.pnl ? (trade.pnl >= 0 ? '+$' : '-$') + Math.abs(trade.pnl).toFixed(2) : '$0.00',
      isProfitable: (trade.pnl || 0) >= 0,
      tradeDateObj: new Date(trade.trade_date)
    }));

    return {
      data: optimizedData,
      totalCount,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  } catch (error) {
    console.error('Exception in fetchTradesPaginated:', error);
    throw error;
  }
}

/**
 * Fetch trades for dashboard with optimized summary
 */
export async function fetchTradesForDashboard(userId: string): Promise<{
  trades: Trade[];
  summary: {
    totalPnL: number;
    winrate: number;
    profitFactor: number;
    totalTrades: number;
    avgTimeHeld: number;
    sharpeRatio: number;
  };
}> {
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    // Fetch all necessary columns for dashboard
    const { data: trades, error } = await supabase
      .from('trades')
      .select(`
        id, symbol, side, quantity, entry_price, exit_price, pnl, trade_date,
        entry_time, exit_time, emotional_state, strategy_id, user_id, notes, market,
        strategies(id, name, rules)
      `)
      .eq('user_id', validatedUserId)
      .order('trade_date', { ascending: false })
      .limit(1000); // Limit for performance

    if (error) {
      console.error('Error fetching dashboard trades:', error);
      throw error;
    }

    // Return empty data if no trades found
    if (!trades || trades.length === 0) {
      return {
        trades: [],
        summary: {
          totalPnL: 0,
          winrate: 0,
          profitFactor: 0,
          totalTrades: 0,
          avgTimeHeld: 0,
          sharpeRatio: 0
        }
      };
    }

    // Process summary statistics
    const pnls = (trades || []).map((t: Trade) => t.pnl || 0);
    const totalTrades = pnls.length;
    const winningTrades = pnls.filter((p: number) => p > 0).length;
    const totalPnL = pnls.reduce((sum: number, p: number) => sum + p, 0);
    const grossProfit = pnls.filter((p: number) => p > 0).reduce((sum: number, p: number) => sum + p, 0);
    const grossLoss = Math.abs(pnls.filter((p: number) => p < 0).reduce((sum: number, p: number) => sum + p, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;
    const winrate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Calculate average time held
    const tradesWithTime = (trades || []).filter((t: Trade) => t.entry_time && t.exit_time);
    let totalMinutes = 0;
    let validTrades = 0;

    tradesWithTime.forEach((trade: Trade) => {
      try {
        const [entryHours, entryMinutes] = trade.entry_time!.split(':').map(Number);
        const [exitHours, exitMinutes] = trade.exit_time!.split(':').map(Number);
        
        const entryDate = new Date();
        entryDate.setHours(entryHours || 0, entryMinutes || 0, 0, 0);
        
        const exitDate = new Date();
        exitDate.setHours(exitHours || 0, exitMinutes || 0, 0, 0);
        
        let durationMs = exitDate.getTime() - entryDate.getTime();
        
        if (durationMs < 0) {
          durationMs += 24 * 60 * 60 * 1000;
        }
        
        totalMinutes += durationMs / (1000 * 60);
        validTrades++;
      } catch (error) {
        console.error('Error calculating trade duration:', error);
      }
    });

    const avgTimeHeld = validTrades > 0 ? totalMinutes / validTrades : 0;

    // Calculate Sharpe ratio
    let sharpeRatio = 0;
    if (totalTrades > 1) {
      const avgReturn = totalPnL / totalTrades;
      const variance = pnls.reduce((sum: number, pnl: number) => sum + Math.pow(pnl - avgReturn, 2), 0) / totalTrades;
      const stdDev = Math.sqrt(variance);
      sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    }

    return {
      trades: (trades || []).map((t: any) => ({
        id: t.id || '',
        symbol: t.symbol || '',
        side: t.side || 'Buy',
        quantity: t.quantity || 0,
        entry_price: t.entry_price || 0,
        exit_price: t.exit_price,
        pnl: t.pnl,
        trade_date: t.trade_date || '',
        entry_time: t.entry_time,
        exit_time: t.exit_time,
        emotional_state: t.emotional_state,
        strategy_id: t.strategy_id,
        user_id: validatedUserId,
        notes: t.notes,
        market: t.market,
        strategies: t.strategies
      })),
      summary: {
        totalPnL,
        winrate,
        profitFactor,
        totalTrades,
        avgTimeHeld,
        sharpeRatio
      }
    };
  } catch (error) {
    console.error('Exception in fetchTradesForDashboard:', error);
    throw error;
  }
}

/**
 * Fetch strategies with optimized stats calculation
 */
export async function fetchStrategiesWithOptimizedStats(userId: string): Promise<any[]> {
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    // Fetch strategies
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', validatedUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }

    if (!strategies || strategies.length === 0) {
      return [];
    }

    // Calculate stats in parallel with memoization
    const strategiesWithStats = await Promise.all(
      strategies.map(async (strategy: any) => {
        try {
          // Use memoized function for stats calculation
          const stats = await memoizedStrategyStats(strategy.id);
          return { ...strategy, stats };
        } catch (error) {
          console.error(`Error calculating stats for strategy ${strategy.id}:`, error);
          return { ...strategy, stats: null };
        }
      })
    );

    return strategiesWithStats;
  } catch (error) {
    console.error('Exception in fetchStrategiesWithOptimizedStats:', error);
    throw error;
  }
}

/**
 * Fetch trade data for performance charts with optimization
 */
export async function fetchTradeDataForPerformance(
  strategyId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    console.log('🔄 [INFINITE REFRESH DEBUG] fetchTradeDataForPerformance called for strategy:', strategyId);
    // Validate strategy ID
    const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
    
    const { data, error } = await supabase
      .from('trades')
      .select('pnl, trade_date')
      .eq('strategy_id', validatedStrategyId)
      .not('pnl', 'is', null)
      .order('trade_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching performance trade data:', error);
      throw error;
    }
    
    console.log('🔄 [INFINITE REFRESH DEBUG] fetchTradeDataForPerformance completed, data length:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Exception in fetchTradeDataForPerformance:', error);
    throw error;
  }
}

/**
 * Batch fetch multiple data types in parallel
 */
export async function batchFetchUserData(userId: string) {
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    // Execute all queries in parallel
    const [
      tradesResult,
      strategiesResult,
      recentActivity
    ] = await Promise.allSettled([
      fetchTradesForDashboard(validatedUserId),
      fetchStrategiesWithOptimizedStats(validatedUserId),
      fetchRecentActivity(validatedUserId)
    ]);

    return {
      trades: tradesResult.status === 'fulfilled' ? tradesResult.value : { trades: [], summary: null },
      strategies: strategiesResult.status === 'fulfilled' ? strategiesResult.value : [],
      recentActivity: recentActivity.status === 'fulfilled' ? recentActivity.value : [],
      errors: [
        tradesResult.status === 'rejected' ? tradesResult.reason : null,
        strategiesResult.status === 'rejected' ? strategiesResult.reason : null,
        recentActivity.status === 'rejected' ? recentActivity.reason : null,
      ].filter(Boolean)
    };
  } catch (error) {
    console.error('Exception in batchFetchUserData:', error);
    throw error;
  }
}

/**
 * Get available symbols for autocomplete
 */
export async function getAvailableSymbols(userId: string): Promise<Array<{ value: string; label: string; count: number }>> {
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    const { data, error } = await supabase
      .from('trades')
      .select('symbol')
      .eq('user_id', validatedUserId)
      .not('symbol', 'is', null);

    if (error) {
      console.error('Error fetching symbols:', error);
      throw error;
    }

    // Count occurrences of each symbol and format for autocomplete
    const symbolCounts = (data || []).reduce((acc: Record<string, number>, trade: any) => {
      const symbol = trade.symbol;
      if (symbol) {
        acc[symbol] = (acc[symbol] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(symbolCounts)
      .map(([symbol, count]) => ({
        value: symbol,
        label: symbol,
        count: count as number
      }))
      .sort((a, b) => (b.count as number) - (a.count as number)); // Sort by frequency
  } catch (error) {
    console.error('Exception in getAvailableSymbols:', error);
    throw error;
  }
}

/**
 * Get available strategies for filtering
 */
export async function getAvailableStrategies(userId: string): Promise<Array<{ id: string; name: string }>> {
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    const { data, error } = await supabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', validatedUserId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getAvailableStrategies:', error);
    throw error;
  }
}

/**
 * Fetch recent user activity
 */
async function fetchRecentActivity(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('trade_date, symbol, pnl, side')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in fetchRecentActivity:', error);
    throw error;
  }
}

/**
 * Fetch trades statistics for all trades (not paginated)
 * Returns aggregate statistics for total P&L, win rate, and other metrics
 */
export async function fetchTradesStatistics(
  userId: string,
  options: {
    strategyId?: string;
    symbol?: string;
    market?: string;
    dateFrom?: string;
    dateTo?: string;
    pnlFilter?: 'all' | 'profitable' | 'lossable';
    side?: 'Buy' | 'Sell' | '';
    emotionalStates?: string[];
  } = {}
): Promise<{
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}> {
  const startTime = performance.now();
  
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    // Build optimized query for statistics - use aggregate functions for better performance
    let query = supabase
      .from('trades')
      .select('pnl', { count: 'exact', head: true }) // Use head: true for faster count
      .eq('user_id', validatedUserId);

    // Apply filters (same as in fetchTradesPaginated)
    if (options.strategyId) {
      const validatedStrategyId = validateUUID(options.strategyId, 'strategy_id');
      query = query.eq('strategy_id', validatedStrategyId);
    }

    if (options.symbol) {
      query = query.ilike('symbol', `%${options.symbol}%`);
    }

    if (options.market) {
      console.log('🔄 [MARKET_FILTER_DEBUG] Applying market filter to statistics query:', {
        market: options.market,
        timestamp: new Date().toISOString()
      });
      // Use case-insensitive filtering to handle inconsistent casing in database
      query = query.ilike('market', options.market);
    } else {
      console.log('🔄 [MARKET_FILTER_DEBUG] No market filter applied to statistics - calculating for all markets', {
        timestamp: new Date().toISOString()
      });
    }

    if (options.dateFrom) {
      query = query.gte('trade_date', options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte('trade_date', options.dateTo);
    }

    // P&L filter
    if (options.pnlFilter && options.pnlFilter !== 'all') {
      if (options.pnlFilter === 'profitable') {
        query = query.gt('pnl', 0);
      } else if (options.pnlFilter === 'lossable') {
        query = query.lt('pnl', 0);
      }
    }

    // Trade side filter
    if (options.side) {
      query = query.eq('side', options.side);
    }

    // Emotional states filter for statistics
    if (options.emotionalStates && options.emotionalStates.length > 0) {
      const emotionalStateConditions = options.emotionalStates.map(state =>
        `emotional_state.ilike.%${state}%`
      );
      query = query.or(emotionalStateConditions.join(','));
    }

    // Execute query with optimized performance
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching trades statistics:', error);
      throw error;
    }

    const endTime = performance.now();
    const queryTime = endTime - startTime;
    
    // Optimized statistics calculation
    const trades = data || [];
    const totalTrades = count || trades.length;
    
    // Use reduce for single-pass calculation
    const stats = trades.reduce((acc: { totalPnL: number; winningTrades: number; losingTrades: number }, trade: Trade) => {
      const pnl = trade.pnl || 0;
      acc.totalPnL += pnl;
      if (pnl > 0) acc.winningTrades++;
      else if (pnl < 0) acc.losingTrades++;
      return acc;
    }, { totalPnL: 0, winningTrades: 0, losingTrades: 0 });

    const winRate = totalTrades > 0 ? (stats.winningTrades / totalTrades) * 100 : 0;

    console.log('🔄 [MARKET_FILTER_DEBUG] Optimized statistics query response:', {
      totalTrades,
      totalPnL: stats.totalPnL,
      winRate,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades,
      queryTime: `${queryTime.toFixed(2)}ms`,
      performance: queryTime < 300 ? 'GOOD' : 'NEEDS_OPTIMIZATION',
      marketFilter: {
        applied: !!options.market,
        value: options.market || 'NONE',
        timestamp: new Date().toISOString()
      }
    });

    return {
      totalPnL: stats.totalPnL,
      winRate,
      totalTrades,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades
    };
  } catch (error) {
    console.error('Exception in fetchTradesStatistics:', error);
    throw error;
  }
}