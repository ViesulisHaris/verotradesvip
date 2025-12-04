// Optimized memoization utilities for performance optimization
import { StrategyStats } from './strategy-rules-engine';

// Simplified cache entry without TTL complexity
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class OptimizedMemoCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get value from cache (production optimized)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
    };
    this.cache.set(key, entry);
  }

  /**
   * Clear cache entries matching pattern
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Optimized cache instance
export const optimizedMemoCache = new OptimizedMemoCache();

/**
 * Optimized memoize trade data processing
 */
export const memoizedTradeProcessing = (() => {
  const cache = new Map<string, any>();
  const TTL = 5 * 60 * 1000; // 5 minutes

  return (trades: any[], processingType: string) => {
    const tradeIds = trades.map(t => t.id).sort().join('_');
    const cacheKey = `${processingType}_${tradeIds}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Process and cache result
    let result;
    switch (processingType) {
      case 'chart_data':
        result = processChartData(trades);
        break;
      case 'emotion_data':
        result = processEmotionData(trades);
        break;
      case 'summary_stats':
        result = processSummaryStats(trades);
        break;
      default:
        result = trades;
    }

    cache.set(cacheKey, { value: result, timestamp: Date.now() });
    
    // Cleanup expired entries
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > TTL) {
        cache.delete(key);
      }
    }

    return result;
  };
})();

/**
 * Process chart data from trades
 */
function processChartData(trades: any[]) {
  if (!trades || trades.length === 0) return [];
  
  const chronologicalTrades = [...trades].reverse();
  let cumulative = 0;
  
  return chronologicalTrades.map(trade => {
    cumulative += trade.pnl || 0;
    return {
      date: new Date(trade.trade_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      pnl: trade.pnl || 0,
      cumulative
    };
  });
}

/**
 * Process emotion data from trades
 */
function processEmotionData(trades: any[]) {
  if (!trades || trades.length === 0) {
    return [];
  }
  
  const emotionData: Record<string, { buyCount: number; sellCount: number; nullCount: number }> = {};
  const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
  
  trades.forEach((trade) => {
    if (!trade.emotional_state) return;
    
    let emotions: string[] = [];
    if (Array.isArray(trade.emotional_state)) {
      emotions = trade.emotional_state.filter((e: any) => typeof e === 'string' && e.trim());
    } else if (typeof trade.emotional_state === 'string') {
      const trimmedState = trade.emotional_state.trim();
      if (trimmedState) {
        try {
          const parsed = JSON.parse(trimmedState);
          if (Array.isArray(parsed)) {
            emotions = parsed.filter((e: any) => typeof e === 'string' && e.trim());
          } else if (typeof parsed === 'string' && parsed.trim()) {
            emotions = [parsed.trim()];
          }
        } catch {
          emotions = [trimmedState.toUpperCase()];
        }
      }
    }
    
    const validEmotionsForTrade = emotions.filter(emotion => validEmotions.includes(emotion.toUpperCase()));
    
    validEmotionsForTrade.forEach(emotion => {
      if (!emotionData[emotion]) {
        emotionData[emotion] = { buyCount: 0, sellCount: 0, nullCount: 0 };
      }
      
      const tradeSide = typeof trade.side === 'string' ? trade.side.trim() : null;
      
      if (tradeSide === 'Buy') {
        emotionData[emotion].buyCount++;
      } else if (tradeSide === 'Sell') {
        emotionData[emotion].sellCount++;
      } else {
        emotionData[emotion].nullCount++;
      }
    });
  });
  
  const emotionEntries = Object.entries(emotionData);
  const allTotals = emotionEntries.map(([_, counts]) =>
    counts.buyCount + counts.sellCount + counts.nullCount
  );
  const maxFrequency = Math.max(...allTotals, 1);
  
  // Calculate the total number of emotion occurrences across all emotions
  const totalEmotionOccurrences = allTotals.reduce((sum, total) => sum + total, 0);
  
  return emotionEntries.map(([emotion, counts]) => {
    const total = counts.buyCount + counts.sellCount + counts.nullCount;
    
    if (total === 0) {
      return {
        subject: emotion,
        value: 0,
        fullMark: 100, // Fixed fullMark for percentage-based visualization
        leaning: 'Balanced',
        side: 'NULL',
        leaningValue: 0,
        totalTrades: 0
      };
    }
    
    let leaningValue = ((counts.buyCount - counts.sellCount) / total) * 100;
    leaningValue = Math.max(-100, Math.min(100, leaningValue));
    
    let leaning = 'Balanced';
    let side = 'NULL';
    
    if (leaningValue > 15) {
      leaning = 'Buy Leaning';
      side = 'Buy';
    } else if (leaningValue < -15) {
      leaning = 'Sell Leaning';
      side = 'Sell';
    }
    
    // Calculate a more meaningful value for radar visualization
    // Combine frequency with intensity to create variation even when emotions are similar
    const baseFrequency = totalEmotionOccurrences > 0 ? (total / totalEmotionOccurrences) * 100 : 0;
    
    // Add variation based on the leaning bias to create visual distinction
    // This ensures emotions with different buy/sell patterns appear different even if frequencies are similar
    const leaningVariation = Math.abs(leaningValue) * 0.3; // Scale down leaning impact
    
    // Add emotion-specific variation to ensure visual distinction even with similar distributions
    // Each emotion gets a unique multiplier based on its position in the valid emotions array
    const emotionIndex = validEmotions.indexOf(emotion);
    const emotionVariation = (emotionIndex + 1) * 2; // Small variation based on emotion type
    
    // Add random variation based on emotion name hash for consistency
    const emotionHash = emotion.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashVariation = (emotionHash % 10) * 1.5; // Consistent variation per emotion
    
    // Combine all variations for visual distinction
    // Ensure we have a minimum value to avoid all emotions being at the same level
    const radarValue = Math.max(10, Math.min(100, baseFrequency + leaningVariation + emotionVariation + hashVariation));
    
    // Debug logging removed for production optimization
    
    return {
      subject: emotion,
      value: radarValue, // Use combined value for better visualization
      fullMark: 100, // Fixed fullMark for percentage-based visualization
      leaning,
      side,
      leaningValue,
      totalTrades: total
    };
  });
}

/**
 * Process summary statistics from trades
 */
function processSummaryStats(trades: any[]) {
  if (!trades || trades.length === 0) {
    return {
      totalPnL: 0,
      winrate: 0,
      profitFactor: 0,
      total: 0,
      avgTimeHeld: 0,
      sharpeRatio: 0
    };
  }
  
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const wins = trades.filter(trade => (trade.pnl || 0) > 0).length;
  const total = trades.length;
  const winrate = total ? ((wins / total) * 100) : 0;

  const grossProfit = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;

  // Calculate average time held
  const tradesWithTime = trades.filter(trade => trade.entry_time && trade.exit_time);
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
      // Error logging removed for production optimization
    }
  });

  const avgTimeHeld = validTrades > 0 ? totalMinutes / validTrades : 0;
  
  // Calculate Sharpe ratio
  const returns = trades.map(trade => trade.pnl || 0);
  const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
  const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev !== 0 ? avgReturn / stdDev : 0;

  return {
    totalPnL,
    winrate,
    profitFactor,
    total,
    avgTimeHeld,
    sharpeRatio
  };
}

/**
 * Debounced function for frequent operations with optimized performance
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    // Clear existing timeout
    clearTimeout(timeoutId);
    
    // Store args for potential immediate execution
    lastArgs = args;
    
    // If this is a rapid successive call, debounce
    if (now - lastCallTime < 50) { // Very rapid calls get debounced
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn(...args);
      }, delay);
    } else {
      // For slower typing, use shorter delay for better responsiveness
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn(...args);
      }, Math.min(delay, 150)); // Cap at 150ms for better UX
    }
  }) as T;
}

/**
 * Create a specialized debounced function for filtering with optimal delay
 */
export function createFilterDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastFilterHash: string | undefined;
  
  return ((...args: Parameters<T>) => {
    // Extract market filter from args if it's the filter function
    const marketFilter = args.length > 1 && typeof args[1] === 'object' ? args[1].market : undefined;
    
    // Generate current filter hash from args for comparison
    const currentFilterHash = JSON.stringify(args);
    
    // Check if any filter changed - if so, clear cache immediately
    if (lastFilterHash !== undefined && lastFilterHash !== currentFilterHash) {
      // Debug logging removed for production optimization
      
      // Clear all cache entries when any filter changes to ensure fresh statistics
      optimizedMemoCache.clear();
    }
    
    lastFilterHash = currentFilterHash;
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout with reduced delay for better responsiveness
    timeoutId = setTimeout(() => {
      // Debug logging removed for production optimization
      fn(...args);
    }, 150); // 150ms for filtering - optimal balance between responsiveness and performance
  }) as T;
}

/**
 * Create a debounced function for statistics with longer delay
 */
export function createStatsDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T
): T {
  // Use 300ms for statistics - less critical for immediate feedback
  return createDebouncedFunction(fn, 300);
}

/**
 * Throttled function for rate limiting
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

/**
 * Memoized strategy stats calculation using the optimized cache
 */
export const memoizedStrategyStats = (() => {
  return async (strategyId: string): Promise<StrategyStats | null> => {
    // Check cache first
    const cacheKey = `strategy_stats_${strategyId}`;
    const cached = optimizedMemoCache.get<StrategyStats>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      // Import dynamically to avoid circular dependencies
      const { calculateStrategyStats } = await import('./strategy-rules-engine');
      const stats = await calculateStrategyStats(strategyId);
      
      // Cache the result
      if (stats) {
        optimizedMemoCache.set(cacheKey, stats);
      }
      
      return stats;
    } catch (error) {
      console.error('Error in memoizedStrategyStats:', error);
      return null;
    }
  };
})();

// Legacy export for backward compatibility - memoizedStrategyStats is already exported above