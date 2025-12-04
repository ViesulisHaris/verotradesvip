// Performance testing utilities for filtering and sorting
import { MockTrade, MockStrategy } from './test-data-generators';
import { TradeFilterOptions, StrategyFilterOptions } from '@/lib/filtering-types';

// Performance metrics interface
export interface PerformanceMetrics {
  filterTime: number;
  sortTime: number;
  totalTime: number;
  memoryUsage?: number;
  renderTime?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

// Performance benchmark interface
export interface PerformanceBenchmark {
  operation: string;
  dataSize: number;
  executionTime: number;
  memoryUsage: number;
  timestamp: number;
}

// Performance thresholds for filtering and sorting
export const PERFORMANCE_THRESHOLDS = {
  FILTER_MAX_TIME: 100, // 100ms for filtering
  SORT_MAX_TIME: 50, // 50ms for sorting
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  MAX_RENDER_TIME: 16, // 16ms for 60fps
  CACHE_HIT_RATIO: 0.8, // 80% cache hit ratio
} as const;

/**
 * Create a performance timer for measuring operation times
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private measurements: Record<string, number> = {};

  /**
   * Start timing an operation
   */
  start(label?: string): void {
    this.startTime = performance.now();
    if (label) {
      this.measurements[label] = this.startTime;
    }
  }

  /**
   * End timing and return elapsed time
   */
  end(label?: string): number {
    const endTime = performance.now();
    const elapsed = endTime - this.startTime;
    
    if (label && this.measurements[label]) {
      const labeledElapsed = endTime - this.measurements[label];
      this.measurements[label] = labeledElapsed;
      return labeledElapsed;
    }
    
    return elapsed;
  }

  /**
   * Get all measurements
   */
  getMeasurements(): Record<string, number> {
    return { ...this.measurements };
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = {};
    this.startTime = 0;
  }
}

/**
 * Measure filtering performance
 */
export function measureFilterPerformance(
  trades: MockTrade[],
  filters: TradeFilterOptions,
  filterFunction: (trades: MockTrade[], filters: TradeFilterOptions) => MockTrade[]
): PerformanceMetrics {
  const timer = new PerformanceTimer();
  const initialMemory = getMemoryUsage();
  
  timer.start('filter');
  const filteredTrades = filterFunction(trades, filters);
  const filterTime = timer.end('filter');
  
  timer.start('sort');
  const sortedTrades = applySorting(filteredTrades, filters);
  const sortTime = timer.end('sort');
  
  const finalMemory = getMemoryUsage();
  const memoryUsage = finalMemory - initialMemory;
  
  return {
    filterTime,
    sortTime,
    totalTime: filterTime + sortTime,
    memoryUsage,
    renderTime: undefined, // To be measured in component tests
    cacheHits: undefined, // To be measured in memoization tests
    cacheMisses: undefined,
  };
}

/**
 * Measure sorting performance
 */
export function measureSortPerformance(
  trades: MockTrade[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): PerformanceMetrics {
  const timer = new PerformanceTimer();
  const initialMemory = getMemoryUsage();
  
  timer.start('sort');
  const sortedTrades = applySorting(trades, { sortBy, sortOrder } as TradeFilterOptions);
  const sortTime = timer.end('sort');
  
  const finalMemory = getMemoryUsage();
  const memoryUsage = finalMemory - initialMemory;
  
  return {
    filterTime: 0,
    sortTime,
    totalTime: sortTime,
    memoryUsage,
  };
}

/**
 * Apply sorting to trades array
 */
function applySorting(trades: MockTrade[], filters: TradeFilterOptions): MockTrade[] {
  const sorted = [...trades];
  
  if (filters.sortBy) {
    sorted.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof MockTrade];
      let bValue: any = b[filters.sortBy as keyof MockTrade];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }
  
  return sorted;
}

/**
 * Get current memory usage
 */
function getMemoryUsage(): number {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

/**
 * Create performance benchmarks
 */
export function createPerformanceBenchmark(
  operation: string,
  dataSize: number,
  executionTime: number,
  memoryUsage: number
): PerformanceBenchmark {
  return {
    operation,
    dataSize,
    executionTime,
    memoryUsage,
    timestamp: Date.now(),
  };
}

/**
 * Validate performance against thresholds
 */
export function validatePerformance(
  metrics: PerformanceMetrics,
  thresholds: Partial<typeof PERFORMANCE_THRESHOLDS> = {}
): {
  passed: boolean;
  violations: Array<{ threshold: string; expected: number; actual: number }>;
} {
  const finalThresholds = { ...PERFORMANCE_THRESHOLDS, ...thresholds };
  const violations: Array<{ threshold: string; expected: number; actual: number }> = [];
  
  if (metrics.filterTime > finalThresholds.FILTER_MAX_TIME) {
    violations.push({
      threshold: 'FILTER_MAX_TIME',
      expected: finalThresholds.FILTER_MAX_TIME,
      actual: metrics.filterTime,
    });
  }
  
  if (metrics.sortTime > finalThresholds.SORT_MAX_TIME) {
    violations.push({
      threshold: 'SORT_MAX_TIME',
      expected: finalThresholds.SORT_MAX_TIME,
      actual: metrics.sortTime,
    });
  }
  
  if (metrics.memoryUsage && metrics.memoryUsage > finalThresholds.MAX_MEMORY_USAGE) {
    violations.push({
      threshold: 'MAX_MEMORY_USAGE',
      expected: finalThresholds.MAX_MEMORY_USAGE,
      actual: metrics.memoryUsage,
    });
  }
  
  if (metrics.renderTime && metrics.renderTime > finalThresholds.MAX_RENDER_TIME) {
    violations.push({
      threshold: 'MAX_RENDER_TIME',
      expected: finalThresholds.MAX_RENDER_TIME,
      actual: metrics.renderTime,
    });
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Generate performance test data sets
 */
export function generatePerformanceTestData(): {
  small: MockTrade[];
  medium: MockTrade[];
  large: MockTrade[];
  extraLarge: MockTrade[];
} {
  return {
    small: Array.from({ length: 100 }, (_, i) => generateMockTrade({ id: `small-${i}` })),
    medium: Array.from({ length: 1000 }, (_, i) => generateMockTrade({ id: `medium-${i}` })),
    large: Array.from({ length: 5000 }, (_, i) => generateMockTrade({ id: `large-${i}` })),
    extraLarge: Array.from({ length: 10000 }, (_, i) => generateMockTrade({ id: `extra-large-${i}` })),
  };
}

/**
 * Helper function to generate mock trade for performance testing
 */
function generateMockTrade(overrides: Partial<MockTrade> = {}): MockTrade {
  return {
    id: `trade-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'test-user-123',
    symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC', 'ETH'][Math.floor(Math.random() * 6)],
    market: ['stock', 'crypto', 'forex', 'futures'][Math.floor(Math.random() * 4)] as any,
    side: ['Buy', 'Sell'][Math.floor(Math.random() * 2)] as any,
    entry_price: Math.random() * 1000 + 10,
    exit_price: Math.random() * 1000 + 10,
    quantity: Math.floor(Math.random() * 1000) + 10,
    pnl: (Math.random() - 0.5) * 2000, // Random P&L between -1000 and 1000
    trade_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    strategy_id: `strategy-${Math.floor(Math.random() * 10) + 1}`,
    strategy: 'Test Strategy',
    emotional_state: ['Confident', 'Anxious', 'Greedy', 'Fearful', 'Patient'][Math.floor(Math.random() * 5)],
    notes: 'Performance test trade',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Cache performance measurement utilities
 */
export class CachePerformanceTracker {
  private hits: number = 0;
  private misses: number = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getStats(): { hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? this.hits / total : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Memory leak detection utilities
 */
export class MemoryLeakDetector {
  private snapshots: Array<{ timestamp: number; memory: number }> = [];
  private maxSnapshots: number = 10;

  takeSnapshot(): void {
    const memory = getMemoryUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      memory,
    });

    // Keep only the last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  detectLeaks(): {
    hasLeak: boolean;
    growthRate: number;
    totalGrowth: number;
  } {
    if (this.snapshots.length < 3) {
      return { hasLeak: false, growthRate: 0, totalGrowth: 0 };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const totalGrowth = last.memory - first.memory;
    const timeDiff = last.timestamp - first.timestamp;
    const growthRate = timeDiff > 0 ? totalGrowth / timeDiff : 0;

    // Consider it a leak if memory is growing consistently
    const hasLeak = growthRate > 1000; // 1KB per second growth

    return {
      hasLeak,
      growthRate,
      totalGrowth,
    };
  }

  clear(): void {
    this.snapshots = [];
  }
}

/**
 * Performance report generator
 */
export function generatePerformanceReport(
  benchmarks: PerformanceBenchmark[]
): {
  summary: {
    totalOperations: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
    minExecutionTime: number;
    totalMemoryUsage: number;
    averageMemoryUsage: number;
  };
  details: PerformanceBenchmark[];
  recommendations: string[];
} {
  const totalOperations = benchmarks.length;
  const executionTimes = benchmarks.map(b => b.executionTime);
  const memoryUsages = benchmarks.map(b => b.memoryUsage);

  const summary = {
    totalOperations,
    averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / totalOperations,
    maxExecutionTime: Math.max(...executionTimes),
    minExecutionTime: Math.min(...executionTimes),
    totalMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0),
    averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / totalOperations,
  };

  const recommendations: string[] = [];

  if (summary.averageExecutionTime > PERFORMANCE_THRESHOLDS.FILTER_MAX_TIME) {
    recommendations.push('Consider optimizing filtering logic for better performance');
  }

  if (summary.averageMemoryUsage > PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE) {
    recommendations.push('Memory usage is high, consider implementing pagination or virtualization');
  }

  if (summary.maxExecutionTime > PERFORMANCE_THRESHOLDS.FILTER_MAX_TIME * 2) {
    recommendations.push('Some operations are significantly slower than average, investigate outliers');
  }

  return {
    summary,
    details: benchmarks,
    recommendations,
  };
}

/**
 * Stress test utilities
 */
export function createStressTest(
  operation: () => void,
  iterations: number = 1000,
  concurrency: number = 1
): Promise<{
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errors: number;
}> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const times: number[] = [];
    let errors = 0;
    let completed = 0;

    const runOperation = () => {
      const opStart = performance.now();
      try {
        operation();
        const opTime = performance.now() - opStart;
        times.push(opTime);
      } catch {
        errors++;
      } finally {
        completed++;
        if (completed === iterations) {
          const totalTime = performance.now() - startTime;
          resolve({
            totalTime,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            errors,
          });
        }
      }
    };

    // Run operations with specified concurrency
    for (let i = 0; i < concurrency; i++) {
      for (let j = i; j < iterations; j += concurrency) {
        setTimeout(runOperation, 0);
      }
    }
  });
}