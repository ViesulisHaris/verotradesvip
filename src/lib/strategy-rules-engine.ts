import { supabase } from '@/supabase/client';
import { validateUUID, sanitizeUUID } from '@/lib/uuid-validation';
import { logStrategy, logError, logSchema } from '@/lib/debug-logger';
import { memoizedStrategyStats } from '@/lib/memoization';

export interface StrategyRule {
  type: 'winrate' | 'profit_factor' | 'net_pnl' | 'max_drawdown' | 'sharpe_ratio' | 'avg_hold_period' | 'custom_rule';
  value?: number;
  min?: number;
  max?: number;
  enabled: boolean;
}

export interface StrategyWithRules {
  id: string;
  name: string;
  description?: string;
  rules: string[];
  winrate_min?: number;
  winrate_max?: number;
  profit_factor_min?: number;
  net_pnl_min?: number;
  net_pnl_max?: number;
  max_drawdown_max?: number;
  sharpe_ratio_min?: number;
  avg_hold_period_min?: number;
  avg_hold_period_max?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RuleCheckState {
  ruleId: string;
  ruleText: string;
  isChecked: boolean;
}

/**
 * Calculate comprehensive strategy statistics
 */
export async function calculateStrategyStats(strategyId: string): Promise<StrategyStats | null> {
  try {
    // Validate strategy_id before database operation
    const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
    
    const { data: trades, error } = await supabase
      .from('trades')
      .select('pnl, entry_time, exit_time, trade_date')
      .eq('strategy_id', validatedStrategyId)
      .not('pnl', 'is', null)
      .order('trade_date, entry_time');

    if (error || !trades || trades.length === 0) {
      return null;
    }

    const pnls = trades.map(t => t.pnl || 0);
    const totalTrades = trades.length;
    const winningTrades = pnls.filter(p => p > 0).length;
    const losingTrades = pnls.filter(p => p < 0).length;
    const winrate = (winningTrades / totalTrades) * 100;
    const totalPnl = pnls.reduce((sum, p) => sum + p, 0);
    const grossProfit = pnls.filter(p => p > 0).reduce((sum, p) => sum + p, 0);
    const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((sum, p) => sum + p, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;

    // Calculate average win and average loss
    const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;

    // Calculate max drawdown
    let runningPnl = 0;
    let peakPnl = 0;
    let maxDrawdown = 0;

    for (const pnl of pnls) {
      runningPnl += pnl;
      if (runningPnl > peakPnl) {
        peakPnl = runningPnl;
      }
      const drawdown = peakPnl - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate average hold period
    const holdPeriods = trades
      .filter(t => t.entry_time && t.exit_time)
      .map(t => {
        const entry = new Date(`1970-01-01T${t.entry_time}`);
        const exit = new Date(`1970-01-01T${t.exit_time}`);
        return (exit.getTime() - entry.getTime()) / (1000 * 60); // Convert to minutes
      })
      .filter(period => period >= 0);

    const avgHoldPeriod = holdPeriods.length > 0
      ? holdPeriods.reduce((sum, period) => sum + period, 0) / holdPeriods.length
      : 0;

    // Calculate Sharpe ratio (simplified version)
    let sharpeRatio = 0;
    if (totalTrades > 1) {
      const avgReturn = totalPnl / totalTrades;
      const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / totalTrades;
      const stdDev = Math.sqrt(variance);
      sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    }
    
    return {
      total_trades: totalTrades,
      winning_trades: winningTrades,
      winrate,
      total_pnl: totalPnl,
      gross_profit: grossProfit,
      gross_loss: grossLoss,
      profit_factor: profitFactor,
      max_drawdown: maxDrawdown,
      sharpe_ratio: sharpeRatio,
      avg_hold_period: avgHoldPeriod,
      average_win: averageWin,
      average_loss: averageLoss
    };
  } catch (error) {
    console.error('Error calculating strategy stats:', error);
    return null;
  }
}

/**
 * Get all strategies for a user with their statistics
 */
export async function getStrategiesWithStats(userId: string): Promise<(StrategyWithRules & { stats: StrategyStats | null })[]> {
  try {
    console.log('🔍 [DEBUG] getStrategiesWithStats called with userId:', userId);
    
    // Validate user_id before database operation
    const validatedUserId = validateUUID(userId, 'user_id');
    console.log('✅ [DEBUG] User ID validated:', validatedUserId);
    
    logStrategy('Fetching strategies for user', { userId: validatedUserId });
    
    console.log('🔍 [DEBUG] Executing strategies query...');
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', validatedUserId)
      .order('created_at', { ascending: false });

    console.log('🔍 [DEBUG] Strategies query completed:', {
      strategiesFound: strategies?.length || 0,
      error: error?.message || 'No error'
    });

    if (error) {
      console.error('❌ [DEBUG] Error fetching strategies:', error);
      console.error('❌ [DEBUG] Full error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      logError('Error fetching strategies', { error: error.message, userId });
      
      // Check if this is a schema cache issue
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('🚨 [DEBUG] SCHEMA CACHE ISSUE DETECTED!');
        logSchema('SCHEMA CACHE ISSUE DETECTED: relation reference found in strategies query', {
          error: error.message,
          query: 'strategies table select with user_id filter'
        });
      }
      
      if (error.message.includes('schema cache')) {
        console.error('🚨 [DEBUG] EXPLICIT SCHEMA CACHE ERROR!');
        logSchema('EXPLICIT SCHEMA CACHE ERROR', {
          error: error.message,
          query: 'strategies table select with user_id filter'
        });
      }
      
      return [];
    }
    
    console.log('✅ [DEBUG] Strategies query successful:', strategies?.length || 0, 'strategies');
    logStrategy('Successfully fetched strategies', { count: strategies?.length || 0 });

    if (!strategies || strategies.length === 0) {
      console.log('🔍 [DEBUG] No strategies found, returning empty array');
      return [];
    }

    console.log('🔍 [DEBUG] Calculating stats for', strategies.length, 'strategies...');
    // Calculate stats for each strategy
    const strategiesWithStats = await Promise.all(
      strategies.map(async (strategy) => {
        console.log('🔍 [DEBUG] Calculating stats for strategy:', strategy.id, strategy.name);
        const stats = await calculateStrategyStats(strategy.id);
        console.log('✅ [DEBUG] Stats calculated for strategy:', strategy.id, stats ? 'with stats' : 'no stats');
        return { ...strategy, stats };
      })
    );

    console.log('✅ [DEBUG] All stats calculated, returning strategies with stats');
    return strategiesWithStats;
  } catch (error) {
    console.error('❌ [DEBUG] Exception in getStrategiesWithStats:', error);
    console.error('❌ [DEBUG] Exception stack:', error instanceof Error ? error.stack : 'No stack available');
    return [];
  }
}

/**
 * Validate strategy rule values
 */
export function validateStrategyRule(ruleType: string, value: number, min?: number, max?: number): {
  isValid: boolean;
  error?: string;
} {
  if (min !== undefined && value < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && value > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }
  
  return { isValid: true };
}

// Export StrategyStats interface for use in components
export interface StrategyStats {
  total_trades: number;
  winning_trades: number;
  winrate: number;
  total_pnl: number;
  gross_profit: number;
  gross_loss: number;
  profit_factor: number;
  max_drawdown: number;
  sharpe_ratio: number;
  avg_hold_period: number;
  average_win: number;
  average_loss: number;
}

/**
 * Get strategy rules with their check states
 * Note: This function now works with updated database schema
 */
export async function getStrategyRulesWithCheckStates(strategyId: string): Promise<RuleCheckState[]> {
  try {
    // Validate strategy_id before database operation
    const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
    
    logStrategy('Fetching strategy rules', { strategyId: validatedStrategyId });
    
    // Get strategy rules from database
    const { data, error } = await supabase
      .from('strategy_rules')
      .select('id, rule_type, rule_value, is_checked')
      .eq('strategy_id', validatedStrategyId)
      .order('created_at', { ascending: true });
    
    if (error) {
      logError('Error fetching strategy rules', { error: error.message, strategyId });
      
      // Check if this is a schema cache issue
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        logSchema('SCHEMA CACHE ISSUE DETECTED: relation reference found in strategy_rules query', {
          error: error.message,
          query: 'strategy_rules table select with strategy_id filter'
        });
      }
      
      return [];
    }
    
    logStrategy('Successfully fetched strategy rules', { count: data?.length || 0 });
    
    return data.map(rule => ({
      ruleId: rule.id,
      ruleText: `${rule.rule_type}: ${rule.rule_value}` || `Rule ${rule.id}`,
      isChecked: rule.is_checked || false
    }));
  } catch (error) {
    console.error('Error fetching strategy rules with check states:', error);
    return [];
  }
}

/**
 * Create rule check states from strategy rules
 */
export function createRuleCheckStatesFromStrategy(strategy: StrategyWithRules): RuleCheckState[] {
  if (!strategy.rules || strategy.rules.length === 0) {
    return [];
  }
  
  return strategy.rules.map((ruleText, index) => ({
    ruleId: `${strategy.id}-${index}`, // Temporary ID until we have proper rule IDs
    ruleText,
    isChecked: false
  }));
}
