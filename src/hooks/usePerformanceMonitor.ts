
'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        
        if (renderTime > 100) { // Log slow renders
          console.warn(`⚠️ Slow render detected in ${componentName}:`, {
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current,
            memoryUsage: performance.memory ? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'
          });
        }
      }
    };
  });

  useEffect(() => {
    // Monitor memory usage
    const checkMemory = () => {
      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryMB > 50) { // Warn if using more than 50MB
          console.warn(`⚠️ High memory usage in ${componentName}:`, {
            memoryUsage: `${memoryMB.toFixed(2)}MB`,
            memoryLimit: '50MB'
          });
        }
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [componentName]);
};
