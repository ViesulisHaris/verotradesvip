// Lazy loading utilities for performance optimization
import { lazy, ComponentType } from 'react';
import React from 'react';

// Enhanced lazy component wrapper
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType<T>,
  loadingPlaceholder?: React.ComponentType<any>
) => {
  const LazyComponent = lazy(importFunc);
  
  return LazyComponent;
};

// Default loading placeholder
const DefaultLoadingPlaceholder: React.FC = () => {
  return React.createElement('div', { className: 'flex items-center justify-center p-8' }, [
    React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500' }),
    React.createElement('p', { className: 'text-white/70 mt-2' }, 'Loading...')
  ]);
};

export default DefaultLoadingPlaceholder;

// Lazy load images
export const lazyLoadImage = (src: string, placeholder?: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Performance monitoring for lazy loading
export const measureLazyLoadPerformance = (componentName: string, loadTime: number) => {
  if (loadTime > 100) { // More than 100ms is considered slow
    console.warn(`Slow lazy load detected: ${componentName} took ${loadTime}ms`);
  }
  
  // Track lazy loading metrics
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart;
      const loadComplete = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
      
      console.log(`Lazy Load Performance: ${componentName}`, {
        domContentLoaded: `${domContentLoaded}ms`,
        loadComplete: `${loadComplete}ms`,
        componentLoadTime: `${loadTime}ms`
      });
    }
  }
};

// Preload critical resources
export const preloadCriticalResources = (resources: string[]) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = 'image'; // Adjust based on resource type
        document.head.appendChild(link);
      });
    });
  }
};

// Debounced resize observer for performance
export const createResizeObserver = (callback: () => void, delay: number = 250) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  };
};