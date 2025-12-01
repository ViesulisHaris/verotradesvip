/**
 * Zoom Detection Utility
 *
 * This utility provides accurate browser zoom level detection and
 * zoom-aware responsive breakpoint calculations to fix mobile view issues
 * caused by browser zoom levels.
 */

import React, { useState, useEffect } from 'react';

export interface ZoomInfo {
  level: number;           // Current zoom level (1.0 = 100%)
  percentage: number;       // Zoom percentage (100 = 100%)
  actualWidth: number;      // Actual window.innerWidth
  effectiveWidth: number;   // Width adjusted for zoom
  actualHeight: number;     // Actual window.innerHeight
  effectiveHeight: number;  // Height adjusted for zoom
  devicePixelRatio: number; // Device pixel ratio
}

export interface ZoomAwareBreakpoint {
  name: string;
  min: number;            // Minimum width in pixels
  zoomAdjusted: number;    // Minimum width adjusted for current zoom
  isActive: boolean;       // Whether breakpoint is currently active
}

class ZoomDetector {
  private static instance: ZoomDetector | null = null;
  private static isInitializing = false;
  private listeners: Array<(zoomInfo: ZoomInfo) => void> = [];
  private currentZoom: ZoomInfo;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window === 'undefined') {
      throw new Error('ZoomDetector constructor called during SSR - window is undefined');
    }
    
    this.currentZoom = this.calculateZoom();
    this.initializeDetection();
  }

  public static getInstance(): ZoomDetector {
    // Prevent SSR instantiation
    if (typeof window === 'undefined') {
      throw new Error('ZoomDetector cannot be instantiated during SSR');
    }

    if (!ZoomDetector.instance && !ZoomDetector.isInitializing) {
      ZoomDetector.isInitializing = true;
      ZoomDetector.instance = new ZoomDetector();
      ZoomDetector.isInitializing = false;
    }
    
    return ZoomDetector.instance!;
  }

  /**
   * Calculate current zoom level using multiple methods for accuracy
   */
  private calculateZoom(): ZoomInfo {
    // Method 1: Using window.outerWidth vs innerWidth
    const outerWidth = window.outerWidth || window.screen.width;
    const innerWidth = window.innerWidth;
    const zoomLevel1 = outerWidth / innerWidth;

    // Method 2: Using devicePixelRatio
    const devicePixelRatio = window.devicePixelRatio || 1;
    const zoomLevel2 = devicePixelRatio;

    // Method 3: Using visual viewport API (most accurate)
    const visualViewport = (window as any).visualViewport;
    let zoomLevel3 = 1;
    if (visualViewport) {
      zoomLevel3 = visualViewport.scale || 1;
    }

    // Method 4: Using matchMedia for more accurate zoom detection
    let zoomLevel4 = 1;
    const zoomMediaQueries = [
      { query: '(min-resolution: 1.25dppx)', value: 1.25 },
      { query: '(min-resolution: 1.5dppx)', value: 1.5 },
      { query: '(min-resolution: 2dppx)', value: 2.0 },
      { query: '(min-resolution: 3dppx)', value: 3.0 }
    ];
    
    for (const { query, value } of zoomMediaQueries) {
      if (window.matchMedia(query).matches) {
        zoomLevel4 = value;
        break;
      }
    }

    // Method 5: Using CSS pixels vs device pixels (most reliable for standard zoom levels)
    let zoomLevel5 = 1;
    const testElement = document.createElement('div');
    testElement.style.width = '100vw';
    testElement.style.height = '100vh';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);
    
    const rect = testElement.getBoundingClientRect();
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    if (viewportWidth > 0 && rect.width > 0) {
      zoomLevel5 = viewportWidth / rect.width;
    }
    
    document.body.removeChild(testElement);

    // Determine the most reliable zoom level
    // Prioritize visual viewport, then matchMedia, then CSS pixels method
    let zoomLevel;
    
    // If visual viewport is available and not 1.0, use it as primary
    if (visualViewport && Math.abs(zoomLevel3 - 1) > 0.01) {
      zoomLevel = zoomLevel3;
    }
    // If matchMedia detected a zoom level, use it
    else if (zoomLevel4 !== 1) {
      zoomLevel = zoomLevel4;
    }
    // Otherwise use the CSS pixels method which is more reliable than outerWidth
    else if (Math.abs(zoomLevel5 - 1) > 0.01) {
      zoomLevel = zoomLevel5;
    }
    // Fallback to averaging if none of the above methods detected a zoom
    else {
      // Use weighted average but with more emphasis on the more reliable methods
      const weights = [0.1, 0.1, 0.5, 0.3]; // Prioritize visual viewport and matchMedia
      zoomLevel = (zoomLevel1 * weights[0] + zoomLevel2 * weights[1] + zoomLevel3 * weights[2] + zoomLevel4 * weights[3]);
    }

    // Round to common zoom levels to improve accuracy
    const commonZoomLevels = [0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0];
    let closestZoom = 1.0;
    let minDiff = Math.abs(zoomLevel - 1.0);
    
    for (const commonLevel of commonZoomLevels) {
      const diff = Math.abs(zoomLevel - commonLevel);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = commonLevel;
      }
    }
    
    // Only round to common level if it's very close (within 2%)
    if (minDiff < 0.02) {
      zoomLevel = closestZoom;
    }

    const actualWidth = window.innerWidth;
    const actualHeight = window.innerHeight;
    const effectiveWidth = actualWidth * zoomLevel;
    const effectiveHeight = actualHeight * zoomLevel;

    return {
      level: zoomLevel,
      percentage: Math.round(zoomLevel * 100),
      actualWidth,
      effectiveWidth,
      actualHeight,
      effectiveHeight,
      devicePixelRatio
    };
  }

  /**
   * Initialize zoom detection with optimized event listeners
   */
  private initializeDetection(): void {
    // Throttled resize handler to prevent excessive updates
    const throttledResize = this.throttle(this.handleResize.bind(this), 200);
    
    // Listen for window resize with throttling
    window.addEventListener('resize', throttledResize);

    // Listen for zoom events (where supported)
    window.addEventListener('zoom', this.handleZoom.bind(this));

    // Listen for device pixel ratio changes
    window.addEventListener('devicepixelratio', this.handleZoom.bind(this));

    // Use ResizeObserver for more accurate detection with throttling
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(throttledResize);
      this.resizeObserver.observe(document.body);
    }

    // Listen for wheel events with Ctrl/Cmd (zoom gestures) with throttling
    const throttledWheel = this.throttle(this.handleWheel.bind(this), 150);
    window.addEventListener('wheel', throttledWheel, { passive: true });

    // Initial detection
    this.updateZoom();
  }

  /**
   * Handle window resize events with debouncing
   */
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.updateZoom();
    }, 150); // Increased debounce time to reduce updates
  }

  /**
   * Handle zoom events
   */
  private handleZoom(): void {
    this.updateZoom();
  }

  /**
   * Handle wheel events for zoom detection
   */
  private handleWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      // This is likely a zoom gesture
      setTimeout(() => {
        this.updateZoom();
      }, 50);
    }
  }

  /**
   * Update zoom information and notify listeners with change detection
   */
  private updateZoom(): void {
    const newZoom = this.calculateZoom();
    const levelChanged = Math.abs(newZoom.level - this.currentZoom.level) > 0.01;
    const percentageChanged = Math.abs(newZoom.percentage - this.currentZoom.percentage) > 0.5; // Only update if percentage changes by more than 0.5%
    const widthChanged = Math.abs(newZoom.effectiveWidth - this.currentZoom.effectiveWidth) > 5; // Only update if width changes by more than 5px

    const significantChange = levelChanged || percentageChanged || widthChanged;

    if (significantChange) {
      this.currentZoom = newZoom;
      this.notifyListeners();
      
      // Add zoom-aware class to body for CSS targeting
      this.updateBodyClasses(newZoom);
      
      // Store zoom info for debugging
      if (typeof window !== 'undefined') {
        (window as any).__zoomInfo = newZoom;
      }
    }
  }

  /**
   * Update body classes based on zoom level
   */
  private updateBodyClasses(zoomInfo: ZoomInfo): void {
    const body = document.body;
    
    // Remove existing zoom classes
    body.classList.remove('zoom-low', 'zoom-normal', 'zoom-high', 'zoom-very-high');
    
    // Add appropriate zoom class
    if (zoomInfo.percentage < 90) {
      body.classList.add('zoom-low');
    } else if (zoomInfo.percentage <= 110) {
      body.classList.add('zoom-normal');
    } else if (zoomInfo.percentage <= 150) {
      body.classList.add('zoom-high');
    } else {
      body.classList.add('zoom-very-high');
    }
    
    // Add zoom percentage as CSS variable
    body.style.setProperty('--zoom-level', zoomInfo.level.toString());
    body.style.setProperty('--zoom-percentage', zoomInfo.percentage.toString());
  }

  /**
   * Notify all listeners of zoom changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentZoom));
  }

  /**
   * Get current zoom information
   */
  public getCurrentZoom(): ZoomInfo {
    return { ...this.currentZoom };
  }

  /**
   * Add zoom change listener
   */
  public addListener(listener: (zoomInfo: ZoomInfo) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove zoom change listener
   */
  public removeListener(listener: (zoomInfo: ZoomInfo) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get zoom-aware breakpoints
   */
  public getZoomAwareBreakpoints(): ZoomAwareBreakpoint[] {
    const zoom = this.currentZoom;
    
    return [
      { name: 'sm', min: 640, zoomAdjusted: 640 / zoom.level, isActive: zoom.effectiveWidth >= 640 },
      { name: 'md', min: 768, zoomAdjusted: 768 / zoom.level, isActive: zoom.effectiveWidth >= 768 },
      { name: 'lg', min: 1024, zoomAdjusted: 1024 / zoom.level, isActive: zoom.effectiveWidth >= 1024 },
      { name: 'xl', min: 1280, zoomAdjusted: 1280 / zoom.level, isActive: zoom.effectiveWidth >= 1280 },
      { name: '2xl', min: 1536, zoomAdjusted: 1536 / zoom.level, isActive: zoom.effectiveWidth >= 1536 }
    ];
  }

  /**
   * Check if desktop view should be active based on zoom-corrected width
   */
  public isDesktopView(): boolean {
    return this.currentZoom.effectiveWidth >= 1024;
  }

  /**
   * Check if tablet view should be active based on zoom-corrected width
   */
  public isTabletView(): boolean {
    const effective = this.currentZoom.effectiveWidth;
    return effective >= 768 && effective < 1024;
  }

  /**
   * Check if mobile view should be active based on zoom-corrected width
   */
  public isMobileView(): boolean {
    return this.currentZoom.effectiveWidth < 768;
  }

  /**
   * Get the actual breakpoint that should be active considering zoom
   */
  public getActualBreakpoint(): string {
    const effective = this.currentZoom.effectiveWidth;
    
    if (effective >= 1536) return '2xl';
    if (effective >= 1280) return 'xl';
    if (effective >= 1024) return 'lg';
    if (effective >= 768) return 'md';
    return 'sm';
  }

  /**
   * Force zoom recalculation
   */
  public recalculate(): void {
    this.updateZoom();
  }

  /**
   * Throttle function to limit how often a function can be called
   */
  private throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    } as T;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Remove all event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('zoom', this.handleZoom);
    window.removeEventListener('devicepixelratio', this.handleZoom);
    window.removeEventListener('wheel', this.handleWheel);
    
    this.listeners = [];
  }
}

// Export function to get singleton instance with SSR safety
export const getZoomDetector = (): ZoomDetector | null => {
  // Only instantiate on client side
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return ZoomDetector.getInstance();
  } catch (error) {
    console.error('[ZOOM-DETECTOR-DEBUG] ❌ Singleton creation failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

// Export the singleton instance getter for backward compatibility
// Note: This will be null during SSR
let zoomDetector: ZoomDetector | null = null;

// Lazy initialization function
export const initializeZoomDetector = (): ZoomDetector | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!zoomDetector) {
    try {
      zoomDetector = ZoomDetector.getInstance();
    } catch (error) {
      console.error('[ZOOM-DETECTOR-DEBUG] ❌ Singleton creation failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  return zoomDetector;
};

export { zoomDetector };

// Export React hook
export const useZoomDetection = () => {
  const [zoomInfo, setZoomInfo] = useState<ZoomInfo>(() => {
    // Return default values during SSR
    if (typeof window === 'undefined' || !zoomDetector) {
      return {
        level: 1,
        percentage: 100,
        actualWidth: 1024,
        effectiveWidth: 1024,
        actualHeight: 768,
        effectiveHeight: 768,
        devicePixelRatio: 1
      };
    }
    return zoomDetector.getCurrentZoom();
  });

  useEffect(() => {
    // Only add listener on client side when detector is available
    if (typeof window !== 'undefined') {
      const detector = initializeZoomDetector();
      if (detector) {
        const unsubscribe = detector.addListener(setZoomInfo);
        return unsubscribe;
      }
    }
    return () => {}; // No-op for SSR
  }, []);

  // Return default values during SSR or when detector is not available
  if (typeof window === 'undefined') {
    return {
      ...zoomInfo,
      isDesktop: true,
      isTablet: false,
      isMobile: false,
      breakpoint: 'lg',
      breakpoints: [],
      recalculate: () => {}
    };
  }

  // On client side, try to get the detector
  const detector = initializeZoomDetector();
  if (!detector) {
    return {
      ...zoomInfo,
      isDesktop: true,
      isTablet: false,
      isMobile: false,
      breakpoint: 'lg',
      breakpoints: [],
      recalculate: () => {}
    };
  }

  return {
    ...zoomInfo,
    isDesktop: detector.isDesktopView(),
    isTablet: detector.isTabletView(),
    isMobile: detector.isMobileView(),
    breakpoint: detector.getActualBreakpoint(),
    breakpoints: detector.getZoomAwareBreakpoints(),
    recalculate: () => detector.recalculate()
  };
};