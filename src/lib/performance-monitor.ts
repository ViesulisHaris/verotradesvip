/**
 * Performance Monitoring Utility
 *
 * This utility provides comprehensive performance monitoring capabilities
 * for the trading journal application, focusing on identifying and
 * addressing performance bottlenecks.
 */

import React from 'react';

// Types for performance metrics
export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  fps?: number;
  interactions?: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics[];
  summary: {
    totalMetrics: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    slowestOperation: string;
  };
  recommendations: string[];
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private isMonitoring = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentFPS = 0;
  private interactionCount = 0;
  private memoryInterval: NodeJS.Timeout | null = null;

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('🔍 [PERFORMANCE_DEBUG] Performance monitoring already running, skipping...');
      return;
    }
    
    this.isMonitoring = true;
    console.log('🔍 [PERFORMANCE_DEBUG] Starting performance monitoring...', {
      timestamp: new Date().toISOString(),
      hasFPSMonitoring: typeof requestAnimationFrame !== 'undefined',
      hasMemoryMonitoring: typeof performance !== 'undefined' && 'memory' in performance,
      hasInteractionMonitoring: typeof window !== 'undefined'
    });
    
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
    this.startInteractionMonitoring();
    
    console.log('🚀 [PERFORMANCE] Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    
    console.log('🛑 [PERFORMANCE] Performance monitoring stopped');
  }

  /**
   * Measure the execution time of a function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        fps: this.currentFPS,
        interactions: this.interactionCount
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: `${name} (ERROR)`,
        duration,
        timestamp: Date.now(),
        fps: this.currentFPS,
        interactions: this.interactionCount
      });
      
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   */
  measureSync<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        fps: this.currentFPS,
        interactions: this.interactionCount
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: `${name} (ERROR)`,
        duration,
        timestamp: Date.now(),
        fps: this.currentFPS,
        interactions: this.interactionCount
      });
      
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Notify observers
    this.observers.forEach(observer => observer(metric));
    
    // Log slow operations (> 100ms)
    if (metric.duration > 100) {
      console.warn(`⚠️ [PERFORMANCE] Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
    
    // Log very slow operations (> 500ms)
    if (metric.duration > 500) {
      console.error(`🚨 [PERFORMANCE] Very slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Add a performance observer
   */
  addObserver(observer: (metrics: PerformanceMetrics) => void) {
    this.observers.push(observer);
  }

  /**
   * Remove a performance observer
   */
  removeObserver(observer: (metrics: PerformanceMetrics) => void) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalMetrics: 0,
          averageDuration: 0,
          maxDuration: 0,
          minDuration: 0,
          slowestOperation: 'N/A'
        },
        recommendations: ['No performance data available']
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    const slowestMetric = this.metrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );

    const recommendations = this.generateRecommendations();

    return {
      metrics: [...this.metrics],
      summary: {
        totalMetrics: this.metrics.length,
        averageDuration,
        maxDuration,
        minDuration,
        slowestOperation: slowestMetric.name
      },
      recommendations
    };
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics() {
    this.metrics = [];
    console.log('🧹 [PERFORMANCE] Performance metrics cleared');
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring() {
    const measureFPS = (timestamp: number) => {
      if (!this.isMonitoring) return;
      
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        this.frameCount++;
        
        // Calculate FPS every second
        if (delta >= 1000) {
          this.currentFPS = Math.round((this.frameCount * 1000) / delta);
          this.frameCount = 0;
          this.lastFrameTime = timestamp;
          
          // Log low FPS
          if (this.currentFPS < 30) {
            console.warn(`⚠️ [PERFORMANCE] Low FPS detected: ${this.currentFPS}`);
          }
        }
      } else {
        this.lastFrameTime = timestamp;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring() {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in performance)) {
      console.warn('⚠️ [PERFORMANCE] Memory monitoring not available in this environment');
      return;
    }
    
    this.memoryInterval = setInterval(() => {
      if (!this.isMonitoring) return;
      
      const memory = (performance as any).memory;
      if (memory) {
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const percentage = (used / total) * 100;
        
        // Log high memory usage
        if (percentage > 90) {
          console.warn(`⚠️ [PERFORMANCE] High memory usage: ${percentage.toFixed(2)}%`);
        }
      }
    }, 5000);
  }

  /**
   * Start interaction monitoring
   */
  private startInteractionMonitoring() {
    if (typeof window === 'undefined') return;
    
    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart', 'touchmove'];
    
    const handleInteraction = () => {
      this.interactionCount++;
    };
    
    interactionEvents.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });
    
    // Reset interaction count every 5 seconds
    setInterval(() => {
      if (this.interactionCount > 50) {
        console.warn(`⚠️ [PERFORMANCE] High interaction rate: ${this.interactionCount} interactions/5s`);
      }
      this.interactionCount = 0;
    }, 5000);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.length === 0) {
      return ['No performance data available for recommendations'];
    }
    
    const slowMetrics = this.metrics.filter(m => m.duration > 100);
    const verySlowMetrics = this.metrics.filter(m => m.duration > 500);
    
    if (slowMetrics.length > 0) {
      recommendations.push(
        `Found ${slowMetrics.length} slow operations (>100ms). Consider optimizing these functions.`
      );
    }
    
    if (verySlowMetrics.length > 0) {
      recommendations.push(
        `Found ${verySlowMetrics.length} very slow operations (>500ms). These should be prioritized for optimization.`
      );
    }
    
    const averageFPS = this.metrics.reduce((sum, m) => sum + (m.fps || 60), 0) / this.metrics.length;
    if (averageFPS < 45) {
      recommendations.push(
        'Average FPS is below 45. Consider reducing animation complexity or using hardware acceleration.'
      );
    }
    
    const highInteractionMetrics = this.metrics.filter(m => (m.interactions || 0) > 30);
    if (highInteractionMetrics.length > 0) {
      recommendations.push(
        'High interaction rates detected during some operations. Consider debouncing or throttling event handlers.'
      );
    }
    
    return recommendations;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  if (typeof window === 'undefined') {
    return {
      measure: async <T>(name: string, fn: () => Promise<T>) => fn(),
      measureSync: <T>(name: string, fn: () => T) => fn(),
      getReport: () => ({ metrics: [], summary: { totalMetrics: 0, averageDuration: 0, maxDuration: 0, minDuration: 0, slowestOperation: 'N/A' }, recommendations: [] })
    };
  }
  
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    getReport: performanceMonitor.getReport.bind(performanceMonitor)
  };
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    const { measure } = usePerformanceMonitor();
    
    const wrappedComponent = React.createElement(Component, props);
    
    React.useEffect(() => {
      measure(`${componentName} render`, async () => {
        return Promise.resolve();
      });
    });
    
    return wrappedComponent;
  };
}

// Default export
export default performanceMonitor;