'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useZoomDetection, ZoomInfo } from '@/lib/zoom-detection';

interface ZoomAwareLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ZoomAwareLayout component that provides zoom-aware responsive behavior
 *
 * This component:
 * 1. Detects browser zoom level
 * 2. Adjusts CSS classes based on zoom-corrected breakpoints
 * 3. Provides visual zoom indicator
 * 4. Ensures desktop sidebar shows correctly even when zoomed
 */
export default function ZoomAwareLayout({ children, className = '' }: ZoomAwareLayoutProps) {
  const zoomInfo = useZoomDetection();
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [prevZoomPercentage, setPrevZoomPercentage] = useState(100);
  const [prevBreakpoint, setPrevBreakpoint] = useState('lg');
  
  // Only log renders when zoom actually changes to reduce console noise
  useEffect(() => {
    if (zoomInfo.percentage !== prevZoomPercentage || zoomInfo.breakpoint !== prevBreakpoint) {
      console.log('NAVIGATION DEBUG: ZoomAwareLayout rendered - zoom level:', zoomInfo.percentage, 'breakpoint:', zoomInfo.breakpoint);
      setPrevZoomPercentage(zoomInfo.percentage);
      setPrevBreakpoint(zoomInfo.breakpoint);
    }
  }, [zoomInfo.percentage, zoomInfo.breakpoint, prevZoomPercentage, prevBreakpoint]);

  // Track hydration state
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Memoize zoom indicator visibility calculation
  const shouldShowZoomIndicator = useMemo(() => {
    if (!isHydrated) return false;
    return Math.abs(zoomInfo.percentage - 100) > 1; // Show if zoom differs by more than 1%
  }, [zoomInfo.percentage, isHydrated]);

  // Update zoom indicator state only when it actually changes
  useEffect(() => {
    setShowZoomIndicator(shouldShowZoomIndicator);
  }, [shouldShowZoomIndicator]);

  // Memoize CSS classes generation to prevent unnecessary recalculations
  const zoomClasses = useMemo(() => {
    return [
      `zoom-aware-layout`,
      `zoom-${zoomInfo.breakpoint}`, // sm, md, lg, xl, 2xl based on effective width
      zoomInfo.isDesktop ? 'zoom-desktop' : '',
      zoomInfo.isTablet ? 'zoom-tablet' : '',
      zoomInfo.isMobile ? 'zoom-mobile' : '',
      zoomInfo.percentage < 90 ? 'zoom-low' : '',
      zoomInfo.percentage > 110 ? 'zoom-high' : '',
      showZoomIndicator ? 'zoom-indicator-visible' : '',
      className
    ].filter(Boolean).join(' ');
  }, [zoomInfo.breakpoint, zoomInfo.isDesktop, zoomInfo.isTablet, zoomInfo.isMobile, zoomInfo.percentage, showZoomIndicator, className]);

  // Memoize CSS styles to prevent unnecessary recalculations
  const zoomStyles = useMemo(() => {
    return {
      // CSS custom properties for zoom-aware styling
      // Use default values during SSR to prevent hydration mismatch
      '--zoom-level': isHydrated ? zoomInfo.level.toString() : '1',
      '--zoom-percentage': isHydrated ? zoomInfo.percentage.toString() : '100',
      '--actual-width': isHydrated ? `${zoomInfo.actualWidth}px` : '1024px',
      '--effective-width': isHydrated ? `${zoomInfo.effectiveWidth}px` : '1024px',
      '--actual-height': isHydrated ? `${zoomInfo.actualHeight}px` : '768px',
      '--effective-height': isHydrated ? `${zoomInfo.effectiveHeight}px` : '768px'
    } as React.CSSProperties;
  }, [zoomInfo.level, zoomInfo.percentage, zoomInfo.actualWidth, zoomInfo.effectiveWidth, zoomInfo.actualHeight, zoomInfo.effectiveHeight, isHydrated]);

  return (
    <div
      className={zoomClasses}
      style={zoomStyles}
    >
      {/* Zoom Indicator */}
      {showZoomIndicator && (
        <div className="zoom-indicator fixed top-4 right-4 z-50 bg-gold text-primary px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-element">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>Zoom: {isHydrated ? zoomInfo.percentage : 100}%</span>
            {isHydrated && zoomInfo.breakpoint !== 'lg' && zoomInfo.effectiveWidth >= 1024 && (
              <span className="text-xs ml-element bg-primary/20 px-2 py-1 rounded">
                Should be desktop
              </span>
            )}
          </div>
          <div className="text-xs mt-1 opacity-75">
            Effective width: {isHydrated ? Math.round(zoomInfo.effectiveWidth) : 1024}px
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="zoom-content">
        {children}
      </div>

      {/* Zoom Debug Panel (only in development) - Fixed z-index conflicts */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="zoom-debug-panel fixed bottom-4 left-4 bg-elevated/90 border border-gold/50 text-primary p-element rounded-lg text-xs font-mono max-w-xs backdrop-blur-sm"
          style={{
            zIndex: -1, // CRITICAL FIX: Set to -1 to ensure it's behind all navigation elements
            pointerEvents: 'none', // CRITICAL FIX: Disable all pointer events to prevent navigation blocking
            position: 'fixed',
            bottom: '120px', // Move even higher to avoid mobile navigation
            left: '20px',
            userSelect: 'none', // Prevent text selection interference
            opacity: 0.4, // Make it even less intrusive
            transform: 'scale(0.8)' // Make it smaller to reduce interference
          }}
        >
          <div className="space-y-tight">
            <div>Zoom: {isHydrated ? zoomInfo.percentage : 100}%</div>
            <div>Actual: {isHydrated ? zoomInfo.actualWidth : 1024}×{isHydrated ? zoomInfo.actualHeight : 768}</div>
            <div>Effective: {isHydrated ? Math.round(zoomInfo.effectiveWidth) : 1024}×{isHydrated ? Math.round(zoomInfo.effectiveHeight) : 768}</div>
            <div>Breakpoint: {isHydrated ? zoomInfo.breakpoint : 'lg'}</div>
            <div>View: {isHydrated ? (zoomInfo.isDesktop ? 'Desktop' : zoomInfo.isTablet ? 'Tablet' : 'Mobile') : 'Desktop'}</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .zoom-aware-layout {
          /* Base styles */
          position: relative;
          width: 100%;
          height: 100%;
        }

        /* Ensure proper centering for all zoom levels */
        .zoom-content {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%;
        }

        /* Center cards and containers at all zoom levels */
        .zoom-content > div {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 100%;
        }

        /* Override for login/register pages to ensure centering */
        .zoom-content .flex.min-h-screen {
          justify-content: center;
          align-items: center;
        }

        .zoom-content .w-full.max-w-md {
          margin: 0 auto;
          width: 100%;
          max-width: 100%;
        }

        /* Zoom-aware responsive styles */
        .zoom-desktop .zoom-content {
          /* Ensure desktop layout is maintained even when zoomed */
          flex-direction: row;
        }

        .zoom-desktop .zoom-content > :first-child {
          /* Desktop sidebar should be visible */
          display: flex !important;
          visibility: visible !important;
        }

        .zoom-mobile .zoom-content {
          /* Mobile layout adjustments */
          flex-direction: column;
        }

        .zoom-mobile .zoom-content > :first-child {
          /* Mobile sidebar should be hidden by default */
          display: none;
        }

        .zoom-tablet .zoom-content {
          /* Tablet layout adjustments */
          flex-direction: column;
        }

        /* Zoom level specific adjustments */
        .zoom-high {
          /* High zoom adjustments */
          font-size: calc(1rem / var(--zoom-level, 1));
        }

        .zoom-low {
          /* Low zoom adjustments */
          font-size: calc(1rem * (1 / var(--zoom-level, 1)));
        }

        /* Ensure sidebar visibility is correct based on effective width */
        .zoom-content .desktop-sidebar {
          display: var(--desktop-sidebar-display, flex);
        }

        .zoom-content .mobile-sidebar {
          display: var(--mobile-sidebar-display, none);
        }

        /* Zoom indicator styles */
        .zoom-indicator {
          animation: slideInRight 0.3s ease-out;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* Debug panel styles - CRITICAL FIXES to prevent navigation interference */
        .zoom-debug-panel {
          animation: slideInLeft 0.3s ease-out;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          pointer-events: none !important; /* CRITICAL: Disable all pointer events to prevent navigation blocking */
          user-select: none !important; /* Prevent text selection interference */
          z-index: -1 !important; /* CRITICAL: Ensure it's behind all navigation elements */
          position: fixed !important;
          bottom: 120px !important; /* Move even higher to avoid mobile navigation */
          left: 20px !important;
          opacity: 0.4 !important; /* Make it even less intrusive */
          transition: opacity 0.2s ease, transform 0.2s ease; /* Smooth transitions */
          transform: scale(0.8) !important; /* Make it smaller */
        }
        
        /* CRITICAL: Ensure debug panel children don't block navigation */
        .zoom-debug-panel * {
          pointer-events: none !important; /* Disable all pointer events for children too */
          user-select: none !important;
        }
        
        /* Hide debug panel on hover to prevent accidental interactions */
        .zoom-debug-panel:hover {
          opacity: 0.2;
          transform: scale(0.75) !important;
        }
        
        /* Completely disable debug panel in production */
        body:has(.production) .zoom-debug-panel {
          display: none !important;
        }

        /* Responsive adjustments for zoom levels */
        @media (max-width: 639px) {
          .zoom-desktop .zoom-content {
            /* Force mobile layout on small screens */
            flex-direction: column;
          }
          
          .zoom-desktop .zoom-content > :first-child {
            display: none;
          }
          
          /* Ensure centering on mobile at all zoom levels */
          .zoom-content {
            padding: 1rem;
          }
          
          .zoom-content > div {
            max-width: 100%;
          }
        }

        @media (min-width: 640px) and (max-width: 767px) {
          .zoom-mobile .zoom-content {
            /* Force tablet layout on medium screens */
            flex-direction: column;
          }
          
          /* Ensure centering on tablet at all zoom levels */
          .zoom-content {
            padding: 1.5rem;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .zoom-mobile .zoom-content {
            /* Force tablet layout on large mobile screens */
            flex-direction: column;
          }
          
          /* Ensure centering on tablet at all zoom levels */
          .zoom-content {
            padding: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .zoom-mobile .zoom-content {
            /* Ensure desktop layout on large screens even if zoomed */
            flex-direction: row;
          }
          
          .zoom-mobile .zoom-content > :first-child {
            display: flex !important;
            visibility: visible !important;
          }
          
          /* Ensure centering on desktop at all zoom levels */
          .zoom-content {
            padding: 2rem;
          }
        }

        /* High zoom specific fixes */
        .zoom-high .zoom-content {
          /* Adjust spacing for high zoom */
          gap: calc(var(--space-4, 1rem) / var(--zoom-level, 1));
        }

        /* Low zoom specific fixes */
        .zoom-low .zoom-content {
          /* Adjust spacing for low zoom */
          gap: calc(var(--space-4, 1rem) * (1 / var(--zoom-level, 1)));
        }
        
        /* Fix for zoomed cards to ensure they stay centered */
        .zoom-card, .card-luxury {
          margin: 0 auto;
          width: 100%;
          max-width: 100%;
        }
        
        /* Ensure proper centering for all zoom levels */
        .zoom-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        
        /* Fix for zoomed responsive cards */
        .zoom-responsive-card {
          margin: 0 auto;
          width: 100%;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}