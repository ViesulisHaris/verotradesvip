'use client';

import { useEffect } from 'react';
import { initializeNavigationSafety } from '@/lib/navigation-safety';

/**
 * NavigationSafetyProvider Component
 * 
 * This component initializes navigation safety for the entire application.
 * It should be included near the root of the app to ensure navigation
 * safety is active on all pages.
 */
export default function NavigationSafetyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize navigation safety when the component mounts
    console.log('🛡️ NavigationSafetyProvider: Initializing navigation safety...');
    initializeNavigationSafety();
    
    // ENHANCED: Check for trades page cleanup function availability
    const checkTradesCleanupAvailability = () => {
      if (typeof window !== 'undefined') {
        const tradesCleanup = (window as any).cleanupModalOverlays ||
                            (window as any).forceCleanupAllOverlays ||
                            (window as any).tradesPageCleanup ||
                            ((window as any).navigationSafety && (window as any).navigationSafety.getTradesCleanup &&
                             (window as any).navigationSafety.getTradesCleanup());
        
        if (tradesCleanup) {
          console.log('✅ NavigationSafetyProvider: Trades page cleanup function is available');
        } else {
          console.warn('⚠️ NavigationSafetyProvider: Trades page cleanup function not found');
        }
      }
    };
    
    // Check immediately and then periodically
    checkTradesCleanupAvailability();
    const availabilityInterval = setInterval(checkTradesCleanupAvailability, 2000);
    
    // Add global error handler for navigation-related errors
    const handleNavigationError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('navigation')) {
        console.error('🚨 Navigation Safety: Navigation error detected', event);
        // Force cleanup on navigation errors
        if (typeof window !== 'undefined' && (window as any).navigationSafety) {
          (window as any).navigationSafety.forceCleanupNavigationBlockers();
        }
      }
    };
    
    // Add global unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('navigation')) {
        console.error('🚨 Navigation Safety: Unhandled navigation rejection', event);
        // Force cleanup on navigation rejections
        if (typeof window !== 'undefined' && (window as any).navigationSafety) {
          (window as any).navigationSafety.forceCleanupNavigationBlockers();
        }
      }
    };
    
    window.addEventListener('error', handleNavigationError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      clearInterval(availabilityInterval);
      window.removeEventListener('error', handleNavigationError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return <>{children}</>;
}