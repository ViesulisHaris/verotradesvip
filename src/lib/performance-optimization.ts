// Performance optimization utilities for trading journal
// Development-only monitoring and production-optimized helpers

// Development flag for performance monitoring
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Performance monitoring interface
interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
}

// Component performance tracker
class ComponentPerformanceTracker {
  private metrics = new Map<string, PerformanceMetrics>();
  private observers: PerformanceObserver[] = [];

  /**
   * Track component render performance
   */
  trackRender(componentName: string, renderTime: number) {
    if (!IS_DEVELOPMENT) return;

    const current = this.metrics.get(componentName) || {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
    };

    current.renderCount++;
    current.lastRenderTime = renderTime;
    current.averageRenderTime = (current.averageRenderTime * (current.renderCount - 1) + renderTime) / current.renderCount;

    this.metrics.set(componentName, current);

    // Warn about slow renders
    if (renderTime > 16) { // > 60fps threshold
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance metrics for a component
   */
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
  }

  /**
   * Start memory monitoring (development only)
   */
  startMemoryMonitoring() {
    if (!IS_DEVELOPMENT || typeof window === 'undefined') return;

    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usageMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usageMB > 50) { // Warn if memory usage exceeds 50MB
          console.warn(`🧠 High memory usage: ${usageMB.toFixed(2)}MB`);
        }
      }, 5000);
    }
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance tracker instance
export const performanceTracker = new ComponentPerformanceTracker();

// Memory leak detection utilities
class MemoryLeakDetector {
  private timeouts = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();
  private eventListeners = new Map<string, EventListener[]>();

  /**
   * Track a timeout for cleanup
   */
  trackTimeout(timeoutId: NodeJS.Timeout, label?: string) {
    this.timeouts.add(timeoutId);
    if (IS_DEVELOPMENT && label) {
      console.log(`⏰ Tracking timeout: ${label}`);
    }
  }

  /**
   * Track an interval for cleanup
   */
  trackInterval(intervalId: NodeJS.Timeout, label?: string) {
    this.intervals.add(intervalId);
    if (IS_DEVELOPMENT && label) {
      console.log(`⏱️ Tracking interval: ${label}`);
    }
  }

  /**
   * Track an event listener for cleanup
   */
  trackEventListener(target: EventTarget, event: string, listener: EventListener, label?: string) {
    const key = `${target.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(listener);
    
    if (IS_DEVELOPMENT && label) {
      console.log(`👂 Tracking event listener: ${label}`);
    }
  }

  /**
   * Clear all tracked resources
   */
  cleanup() {
    // Clear timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();

    // Clear intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();

    // Remove event listeners
    this.eventListeners.forEach((listeners, key) => {
      const [targetName, event] = key.split('-');
      // Note: In a real implementation, you'd need to track the actual targets
      if (IS_DEVELOPMENT) {
        console.log(`🧹 Cleaning up ${listeners.length} ${event} listeners for ${targetName}`);
      }
    });
    this.eventListeners.clear();
  }

  /**
   * Check for memory leaks
   */
  checkForLeaks() {
    if (!IS_DEVELOPMENT) return;

    const timeoutCount = this.timeouts.size;
    const intervalCount = this.intervals.size;
    const listenerCount = Array.from(this.eventListeners.values())
      .reduce((total, listeners) => total + listeners.length, 0);

    if (timeoutCount > 0) {
      console.warn(`🚨 Memory leak detected: ${timeoutCount} uncleared timeouts`);
    }
    if (intervalCount > 0) {
      console.warn(`🚨 Memory leak detected: ${intervalCount} uncleared intervals`);
    }
    if (listenerCount > 0) {
      console.warn(`🚨 Memory leak detected: ${listenerCount} uncleared event listeners`);
    }
  }
}

// Global memory leak detector instance
export const memoryLeakDetector = new MemoryLeakDetector();

// Optimized debouncing functions
export function createOptimizedDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: {
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;

  const { maxWait, leading = false, trailing = true } = options;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    // Leading edge execution
    if (leading && now - lastCallTime >= delay) {
      lastCallTime = now;
      fn(...args);
      return;
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      lastCallTime = Date.now();
      if (trailing && lastArgs) {
        fn(...lastArgs);
      }
      timeoutId = null;
    }, delay);

    // Max wait constraint
    if (maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (lastArgs) {
          fn(...lastArgs);
        }
        maxTimeoutId = null;
      }, maxWait);
    }
  }) as T;
}

// Specialized debounced functions for different use cases
export function createFilterDebouncedFunction<T extends (...args: any[]) => any>(fn: T): T {
  return createOptimizedDebouncedFunction(fn, 300, {
    maxWait: 1000,
    leading: false,
    trailing: true
  });
}

export function createSortDebouncedFunction<T extends (...args: any[]) => any>(fn: T): T {
  return createOptimizedDebouncedFunction(fn, 150, {
    maxWait: 500,
    leading: false,
    trailing: true
  });
}

export function createURLUpdateDebouncedFunction<T extends (...args: any[]) => any>(fn: T): T {
  return createOptimizedDebouncedFunction(fn, 500, {
    maxWait: 2000,
    leading: false,
    trailing: true
  });
}

// Optimized throttling function
export function createOptimizedThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        // Execute with the latest arguments if they changed
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  }) as T;
}

// React performance utilities
export function createRenderTracker(componentName: string) {
  let renderCount = 0;
  let lastRenderTime = 0;

  return () => {
    if (!IS_DEVELOPMENT) return;

    const now = performance.now();
    const renderTime = lastRenderTime ? now - lastRenderTime : 0;
    
    renderCount++;
    performanceTracker.trackRender(componentName, renderTime);
    
    if (renderCount > 100) {
      console.warn(`🔄 Component ${componentName} has rendered ${renderCount} times`);
    }
    
    lastRenderTime = now;
  };
}

// Memoization helper with development tracking
export function createTrackedMemo<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (IS_DEVELOPMENT) {
        console.log(`💾 Cache hit for ${key}`);
      }
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    
    if (IS_DEVELOPMENT) {
      console.log(`💾 Cache miss for ${key}`);
    }
    
    return result;
  }) as T;
}

// Bundle size optimization utilities
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = '/fonts/inter-var.woff2';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // Preload critical CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'preload';
  cssLink.href = '/css/critical.css';
  cssLink.as = 'style';
  document.head.appendChild(cssLink);
}

// Performance budget validation
export function validatePerformanceBudget() {
  if (!IS_DEVELOPMENT || typeof window === 'undefined') return;

  // Check First Contentful Paint
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      const fcp = navEntry.loadEventEnd - navEntry.loadEventStart;
      
      if (fcp > 2000) {
        console.warn(`🐌 Slow First Contentful Paint: ${fcp.toFixed(2)}ms (target: <2000ms)`);
      }
    }
  }

  // Check bundle size (approximate)
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsResources = resources.filter(r => r.name.endsWith('.js'));
  const totalJSSize = jsResources.reduce((total, resource) => {
    return total + (resource.transferSize || 0);
  }, 0);

  if (totalJSSize > 500 * 1024) { // 500KB
    console.warn(`📦 Large JS bundle detected: ${(totalJSSize / 1024).toFixed(2)}KB (target: <500KB)`);
  }
}

// Initialize performance monitoring in development
if (IS_DEVELOPMENT && typeof window !== 'undefined') {
  // Start memory monitoring
  performanceTracker.startMemoryMonitoring();

  // Validate performance budget after page load
  setTimeout(() => {
    validatePerformanceBudget();
  }, 5000);

  // Check for memory leaks on page unload
  window.addEventListener('beforeunload', () => {
    memoryLeakDetector.checkForLeaks();
  });
}

// Export performance utilities for use in components
export const performanceUtils = {
  trackRender: createRenderTracker,
  createDebounced: createOptimizedDebouncedFunction,
  createThrottled: createOptimizedThrottledFunction,
  createMemo: createTrackedMemo,
  trackTimeout: memoryLeakDetector.trackTimeout.bind(memoryLeakDetector),
  trackInterval: memoryLeakDetector.trackInterval.bind(memoryLeakDetector),
  trackEventListener: memoryLeakDetector.trackEventListener.bind(memoryLeakDetector),
  cleanup: memoryLeakDetector.cleanup.bind(memoryLeakDetector),
  getMetrics: performanceTracker.getMetrics.bind(performanceTracker),
  getAllMetrics: performanceTracker.getAllMetrics.bind(performanceTracker),
  clearMetrics: performanceTracker.clearMetrics.bind(performanceTracker),
};