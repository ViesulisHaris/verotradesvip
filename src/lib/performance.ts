// Performance monitoring and optimization utilities
import React from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.metrics.push({
      renderTime: endTime - startTime,
      componentName,
      timestamp: Date.now()
    });

    // Log slow renders
    if (endTime - startTime > 16) { // More than one frame
      console.warn(`Slow render detected: ${componentName} took ${endTime - startTime}ms`);
    }
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Get average render time for a component
  getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    if (componentMetrics.length === 0) return 0;
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / componentMetrics.length;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Monitor long tasks
  startLongTaskMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  // Monitor Core Web Vitals
  startCoreWebVitalsMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`LCP: ${lastEntry.startTime}ms`);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            console.log(`CLS: ${clsValue}`);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const endTime = performance.now();
        performanceMonitor.measureRender(componentName, () => {});
      }
    };
  }, [componentName]);
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoize utility for expensive computations
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): ((...args: Parameters<T>) => ReturnType<T>) => {
  const cache = new Map<string, ReturnType<T>>();
  
  return (...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

// Lazy load utility
export const lazyLoad = <T>(
  importFunc: () => Promise<T>,
  fallback?: React.ComponentType
): React.LazyExoticComponent<React.ComponentType<T>> => {
  return React.lazy(() => 
    importFunc().catch(error => {
      console.error('Lazy loading failed:', error);
      return { default: fallback || (() => null) } as any;
    })
  );
};