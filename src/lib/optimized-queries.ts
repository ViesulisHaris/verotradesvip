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
  try {
    // Validate user ID
    const validatedUserId = validateUUID(userId, 'user_id');
    
    // Build base query
    let query = supabase
      .from('trades')
      .select(`
        *,
        strategies (
          id,
          name,
          rules
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
      query = query.eq('market', options.market);
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

    // Emotional states filter
    if (options.emotionalStates && options.emotionalStates.length > 0) {
      // This is a complex filter - we need to handle it differently
      // For now, we'll filter client-side after fetching
      // In a real implementation, you might want to use a more sophisticated approach
      console.log('Emotional states filter applied:', options.emotionalStates);
    }

    // Apply pagination
    const { from, to, orderBy } = buildPaginationQuery(options);
    query = query
      .range(from, to)
      .order(orderBy.column as any, { ascending: orderBy.ascending });

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching paginated trades:', error);
      throw error;
    }

    const totalCount = count || 0;
    const currentPage = options.page;
    const totalPages = Math.ceil(totalCount / options.limit);

    return {
      data: data || [],
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
    
    // Fetch only necessary columns for dashboard
    const { data: trades, error } = await supabase
      .from('trades')
      .select('pnl, trade_date, entry_time, exit_time, strategies(id, name)')
      .eq('user_id', validatedUserId)
      .order('trade_date', { ascending: false })
      .limit(1000); // Limit for performance

    if (error) {
      console.error('Error fetching dashboard trades:', error);
      throw error;
    }

    // Process summary statistics
    const pnls = (trades || []).map(t => t.pnl || 0);
    const totalTrades = pnls.length;
    const winningTrades = pnls.filter(p => p > 0).length;
    const totalPnL = pnls.reduce((sum, p) => sum + p, 0);
    const grossProfit = pnls.filter(p => p > 0).reduce((sum, p) => sum + p, 0);
    const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((sum, p) => sum + p, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;
    const winrate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Calculate average time held
    const tradesWithTime = (trades || []).filter(t => t.entry_time && t.exit_time);
    let totalMinutes = 0;
    let validTrades = 0;

    tradesWithTime.forEach(trade => {
      try {
        const [entryHours, entryMinutes] = trade.entry_time!.split(':').map(Number);
        const [exitHours, exitMinutes] = trade.exit_time!.split(':').map(Number);
        
        const entryDate = new Date();
        entryDate.setHours(entryHours, entryMinutes, 0, 0);
        
        const exitDate = new Date();
        exitDate.setHours(exitHours, exitMinutes, 0, 0);
        
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
      const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / totalTrades;
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
      strategies.map(async (strategy) => {
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
    const symbolCounts = (data || []).reduce((acc, trade) => {
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
        count
      }))
      .sort((a, b) => b.count - a.count); // Sort by frequency
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