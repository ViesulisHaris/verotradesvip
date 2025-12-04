// Unit tests for performance optimization utilities
import {
  createOptimizedDebouncedFunction,
  createFilterDebouncedFunction,
  createSortDebouncedFunction,
  createURLUpdateDebouncedFunction,
  createOptimizedThrottledFunction,
  createRenderTracker,
  createTrackedMemo,
  performanceTracker,
  memoryLeakDetector,
  performanceUtils,
} from '@/lib/performance-optimization';
import { 
  measureFilterPerformance,
  measureSortPerformance,
  validatePerformance,
  PERFORMANCE_THRESHOLDS,
  PerformanceTimer,
  CachePerformanceTracker,
  MemoryLeakDetector as MockMemoryLeakDetector,
} from '../utils/performance-helpers';

describe('Performance Optimization', () => {
  beforeEach(() => {
    // Reset performance tracker
    performanceTracker.clearMetrics();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Debounced Functions', () => {
    test('should create optimized debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 100);
      
      debouncedFn('test');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle leading edge execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 100, { leading: true });
      
      debouncedFn('test');
      
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle trailing edge execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 100, { trailing: true });
      
      debouncedFn('test');
      debouncedFn('test2');
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenLastCalledWith('test2');
    });

    test('should handle max wait constraint', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 100, { maxWait: 200 });
      
      // Call multiple times
      debouncedFn('test1');
      jest.advanceTimersByTime(50);
      debouncedFn('test2');
      jest.advanceTimersByTime(50);
      debouncedFn('test3');
      jest.advanceTimersByTime(50);
      
      // Should execute at maxWait time
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenLastCalledWith('test3');
    });

    test('should cancel previous timeout', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 100);
      
      debouncedFn('test1');
      debouncedFn('test2');
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenLastCalledWith('test2');
    });
  });

  describe('Specialized Debounced Functions', () => {
    test('should create filter debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = createFilterDebouncedFunction(mockFn);
      
      debouncedFn('test');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(300); // Filter debounce delay
      
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    test('should create sort debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = createSortDebouncedFunction(mockFn);
      
      debouncedFn('test');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(150); // Sort debounce delay
      
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    test('should create URL update debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = createURLUpdateDebouncedFunction(mockFn);
      
      debouncedFn('test');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(500); // URL update debounce delay
      
      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('Throttled Functions', () => {
    test('should create optimized throttled function', () => {
      const mockFn = jest.fn();
      const throttledFn = createOptimizedThrottledFunction(mockFn, 100);
      
      // Call multiple times
      throttledFn('test1');
      throttledFn('test2');
      throttledFn('test3');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test1');
      
      jest.advanceTimersByTime(100);
      
      // Should execute with latest arguments
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('test3');
    });

    test('should respect throttle limit', () => {
      const mockFn = jest.fn();
      const throttledFn = createOptimizedThrottledFunction(mockFn, 100);
      
      // Call multiple times
      throttledFn('test1');
      jest.advanceTimersByTime(50);
      throttledFn('test2');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(50);
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Render Tracker', () => {
    test('should track component renders', () => {
      const mockComponentName = 'TestComponent';
      const tracker = createRenderTracker(mockComponentName);
      
      tracker();
      
      const metrics = performanceTracker.getMetrics(mockComponentName);
      expect(metrics).toBeDefined();
      expect(metrics!.renderCount).toBe(1);
    });

    test('should track render times', () => {
      const mockComponentName = 'TestComponent';
      const tracker = createRenderTracker(mockComponentName);
      
      // Simulate multiple renders
      tracker();
      jest.advanceTimersByTime(16); // 16ms
      tracker();
      
      const metrics = performanceTracker.getMetrics(mockComponentName);
      expect(metrics!.lastRenderTime).toBeGreaterThan(0);
      expect(metrics!.averageRenderTime).toBeGreaterThan(0);
    });

    test('should warn about slow renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      const tracker = createRenderTracker('SlowComponent');
      
      // Simulate slow render
      tracker();
      jest.advanceTimersByTime(20); // 20ms > 16ms threshold
      
      tracker();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow render detected: SlowComponent')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Tracked Memoization', () => {
    test('should cache function results', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoFn = createTrackedMemo(mockFn);
      
      const result1 = memoFn(5);
      const result2 = memoFn(5);
      const result3 = memoFn(10);
      
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(20);
      expect(mockFn).toHaveBeenCalledTimes(2); // Called only for unique inputs
    });

    test('should respect cache TTL', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoFn = createTrackedMemo(mockFn);
      
      memoFn(5);
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
      memoFn(5); // Should be cache miss due to TTL
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should use custom key function', () => {
      const mockFn = jest.fn((obj: { x: number }) => obj.x * 2);
      const memoFn = createTrackedMemo(mockFn, (obj) => obj.x.toString());
      
      const result1 = memoFn({ x: 5 });
      const result2 = memoFn({ x: 5 });
      const result3 = memoFn({ x: 10 });
      
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(20);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Tracker', () => {
    test('should track component metrics', () => {
      const componentName = 'TestComponent';
      const renderTime = 25.5;
      
      performanceTracker.trackRender(componentName, renderTime);
      
      const metrics = performanceTracker.getMetrics(componentName);
      expect(metrics).toBeDefined();
      expect(metrics!.renderCount).toBe(1);
      expect(metrics!.lastRenderTime).toBe(renderTime);
      expect(metrics!.averageRenderTime).toBe(renderTime);
    });

    test('should calculate average render time', () => {
      const componentName = 'TestComponent';
      
      performanceTracker.trackRender(componentName, 10);
      performanceTracker.trackRender(componentName, 20);
      performanceTracker.trackRender(componentName, 30);
      
      const metrics = performanceTracker.getMetrics(componentName);
      expect(metrics!.averageRenderTime).toBe(20); // (10 + 20 + 30) / 3
    });

    test('should clear all metrics', () => {
      const componentName = 'TestComponent';
      
      performanceTracker.trackRender(componentName, 10);
      performanceTracker.clearMetrics();
      
      const metrics = performanceTracker.getMetrics(componentName);
      expect(metrics).toBeUndefined();
    });

    test('should get all metrics', () => {
      const component1 = 'Component1';
      const component2 = 'Component2';
      
      performanceTracker.trackRender(component1, 10);
      performanceTracker.trackRender(component2, 20);
      
      const allMetrics = performanceTracker.getAllMetrics();
      expect(allMetrics).toEqual({
        [component1]: {
          renderCount: 1,
          lastRenderTime: 10,
          averageRenderTime: 10,
        },
        [component2]: {
          renderCount: 1,
          lastRenderTime: 20,
          averageRenderTime: 20,
        },
      });
    });
  });

  describe('Memory Leak Detector', () => {
    test('should track timeouts', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      
      memoryLeakDetector.trackTimeout(timeoutId, 'test-timeout');
      
      expect(() => {
        memoryLeakDetector.checkForLeaks();
      }).not.toThrow();
    });

    test('should track intervals', () => {
      const intervalId = setInterval(() => {}, 1000);
      
      memoryLeakDetector.trackInterval(intervalId, 'test-interval');
      
      expect(() => {
        memoryLeakDetector.checkForLeaks();
      }).not.toThrow();
    });

    test('should track event listeners', () => {
      const element = document.createElement('div');
      const listener = () => {};
      
      memoryLeakDetector.trackEventListener(element, 'click', listener, 'test-listener');
      
      expect(() => {
        memoryLeakDetector.checkForLeaks();
      }).not.toThrow();
    });

    test('should clean up all resources', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const intervalId = setInterval(() => {}, 1000);
      const element = document.createElement('div');
      const listener = () => {};
      
      memoryLeakDetector.trackTimeout(timeoutId);
      memoryLeakDetector.trackInterval(intervalId);
      memoryLeakDetector.trackEventListener(element, 'click', listener);
      
      memoryLeakDetector.cleanup();
      
      expect(() => {
        memoryLeakDetector.checkForLeaks();
      }).not.toThrow();
    });

    test('should detect memory leaks', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      // Simulate uncleared timeout
      const timeoutId = setTimeout(() => {}, 1000);
      memoryLeakDetector.trackTimeout(timeoutId);
      
      memoryLeakDetector.checkForLeaks();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Memory leak detected: 1 uncleared timeouts')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Utilities', () => {
    test('should provide performance tracking utilities', () => {
      expect(performanceUtils.trackRender).toBeDefined();
      expect(performanceUtils.createDebounced).toBeDefined();
      expect(performanceUtils.createThrottled).toBeDefined();
      expect(performanceUtils.createMemo).toBeDefined();
      expect(performanceUtils.trackTimeout).toBeDefined();
      expect(performanceUtils.trackInterval).toBeDefined();
      expect(performanceUtils.trackEventListener).toBeDefined();
      expect(performanceUtils.cleanup).toBeDefined();
      expect(performanceUtils.getMetrics).toBeDefined();
      expect(performanceUtils.getAllMetrics).toBeDefined();
      expect(performanceUtils.clearMetrics).toBeDefined();
    });
  });

  describe('Performance Measurement Integration', () => {
    test('should measure filter performance', () => {
      const mockTrades = Array.from({ length: 100 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'AAPL',
        pnl: Math.random() * 1000,
      }));
      
      const filters = { symbol: 'AAPL' };
      const mockFilterFn = jest.fn((trades, filters) => 
        trades.filter(trade => trade.symbol === filters.symbol)
      );
      
      const metrics = measureFilterPerformance(mockTrades, filters, mockFilterFn);
      
      expect(metrics.filterTime).toBeGreaterThanOrEqual(0);
      expect(metrics.sortTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(mockFilterFn).toHaveBeenCalled();
    });

    test('should measure sort performance', () => {
      const mockTrades = Array.from({ length: 100 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: `SYMBOL${i}`,
        pnl: Math.random() * 1000,
      }));
      
      const mockSortFn = jest.fn((trades, sortBy, sortOrder) => 
        [...trades].sort((a, b) => {
          const comparison = a[sortBy] > b[sortBy] ? 1 : -1;
          return sortOrder === 'desc' ? -comparison : comparison;
        })
      );
      
      const metrics = measureSortPerformance(mockTrades, 'symbol', 'asc');
      
      expect(metrics.sortTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(mockSortFn).toHaveBeenCalled();
    });

    test('should validate performance against thresholds', () => {
      const goodMetrics = {
        filterTime: 50,
        sortTime: 25,
        totalTime: 75,
      };
      
      const badMetrics = {
        filterTime: 150,
        sortTime: 75,
        totalTime: 225,
      };
      
      const goodValidation = validatePerformance(goodMetrics);
      const badValidation = validatePerformance(badMetrics);
      
      expect(goodValidation.passed).toBe(true);
      expect(goodValidation.violations).toHaveLength(0);
      
      expect(badValidation.passed).toBe(false);
      expect(badValidation.violations.length).toBeGreaterThan(0);
    });

    test('should use custom thresholds', () => {
      const metrics = {
        filterTime: 75,
        sortTime: 25,
        totalTime: 100,
      };
      
      const customThresholds = {
        FILTER_MAX_TIME: 80,
        SORT_MAX_TIME: 30,
      };
      
      const validation = validatePerformance(metrics, customThresholds);
      
      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  describe('Cache Performance Tracking', () => {
    test('should track cache hits and misses', () => {
      const tracker = new CachePerformanceTracker();
      
      tracker.recordHit();
      tracker.recordHit();
      tracker.recordMiss();
      tracker.recordHit();
      
      const stats = tracker.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBe(2/3);
    });

    test('should reset stats', () => {
      const tracker = new CachePerformanceTracker();
      
      tracker.recordHit();
      tracker.recordMiss();
      tracker.reset();
      
      const stats = tracker.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRatio).toBe(0);
    });
  });

  describe('Memory Leak Detection Integration', () => {
    test('should detect memory growth over time', () => {
      const detector = new MockMemoryLeakDetector();
      
      // Simulate growing memory usage
      detector.takeSnapshot();
      detector.takeSnapshot();
      detector.takeSnapshot();
      
      const leakDetection = detector.detectLeaks();
      
      expect(leakDetection.hasLeak).toBeDefined();
      expect(leakDetection.growthRate).toBeDefined();
      expect(leakDetection.totalGrowth).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero delay debouncing', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 0);
      
      debouncedFn('test');
      
      expect(mockFn).toHaveBeenCalled();
    });

    test('should handle negative delay throttling', () => {
      const mockFn = jest.fn();
      
      expect(() => {
        createOptimizedThrottledFunction(mockFn, -100);
      }).toThrow();
    });

    test('should handle invalid function types', () => {
      const invalidFn = null as any;
      
      expect(() => {
        createOptimizedDebouncedFunction(invalidFn, 100);
      }).toThrow();
    });

    test('should handle very long delays', () => {
      const mockFn = jest.fn();
      const debouncedFn = createOptimizedDebouncedFunction(mockFn, 60000); // 1 minute
      
      debouncedFn('test');
      
      jest.advanceTimersByTime(60000);
      
      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('Performance Budget Validation', () => {
    test('should validate against performance thresholds', () => {
      const withinThresholds = {
        filterTime: PERFORMANCE_THRESHOLDS.FILTER_MAX_TIME - 10,
        sortTime: PERFORMANCE_THRESHOLDS.SORT_MAX_TIME - 10,
        memoryUsage: PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE - 1000,
      };
      
      const exceedingThresholds = {
        filterTime: PERFORMANCE_THRESHOLDS.FILTER_MAX_TIME + 10,
        sortTime: PERFORMANCE_THRESHOLDS.SORT_MAX_TIME + 10,
        memoryUsage: PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE + 1000,
      };
      
      const withinValidation = validatePerformance(withinThresholds);
      const exceedingValidation = validatePerformance(exceedingThresholds);
      
      expect(withinValidation.passed).toBe(true);
      expect(exceedingValidation.passed).toBe(false);
    });
  });
});