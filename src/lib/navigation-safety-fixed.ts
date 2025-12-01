/**
 * Navigation Safety Utility - FIXED VERSION
 * 
 * This utility provides functions to ensure navigation is not blocked by overlays,
 * modals, or other UI elements that might interfere with user interactions.
 * 
 * FIXED: Removed all aggressive blocking behavior that was preventing normal navigation
 */

// Global state to track navigation safety
let navigationSafetyEnabled = true;
let lastCleanupTime = 0;
const CLEANUP_COOLDOWN = 30000; // Aligned to 30 seconds to match interval timing and prevent conflicts
let isNavigating = false; // Track if navigation is in progress
let navigationStartTime = 0; // Track when navigation started to prevent cleanup conflicts
let userInteractionInProgress = false; // Track if user is actively interacting with navigation
let navigationCompletionTimer: NodeJS.Timeout | null = null; // Timer to detect stuck navigation
const NAVIGATION_TIMEOUT = 5000; // 5 seconds timeout for navigation to complete

/**
 * Enhanced cleanup function that removes all potential navigation-blocking elements
 * FIXED: Only runs on Trades page when there are actual modals open
 */
export function forceCleanupNavigationBlockers(): void {
  const now = Date.now();
  
  // Prevent excessive cleanup calls
  if (now - lastCleanupTime < CLEANUP_COOLDOWN) {
    return;
  }
  
  // FIXED: Only run cleanup on Trades page when there are actual modals open
  if (typeof window !== 'undefined') {
    const currentPath = window.location?.pathname || '';
    
    if (!currentPath.includes('/trades')) {
      console.log('🧹 Navigation Safety FIXED: Not on Trades page - SKIPPING ALL CLEANUP to prevent navigation interference');
      console.log('🔍 NAVIGATION SAFETY DEBUG: Path:', currentPath, '- cleanup skipped');
      return;
    }
    
    // FIXED: Only run cleanup if there are actually any open modals
    const hasOpenModals = document.querySelector('.modal-backdrop, [role="dialog"], [aria-modal="true"], .ReactModal__Overlay, .ReactModal__Content') !== null;
    
    if (!hasOpenModals) {
      console.log('🧹 Navigation Safety FIXED: No open modals detected on Trades page - SKIPPING CLEANUP to prevent navigation interference');
      return;
    }
    
    const tradesCleanup = (window as any).cleanupModalOverlays ||
                        (window as any).forceCleanupAllOverlays ||
                        (window as any).tradesPageCleanup ||
                        ((window as any).navigationSafety && (window as any).navigationSafety.tradesPageCleanup);
    
    if (tradesCleanup && typeof tradesCleanup === 'function') {
      console.log('🔗 Navigation Safety FIXED: Using trades page cleanup function (Trades page only)');
      console.log('🔍 NAVIGATION SAFETY DEBUG: FIXED - Only on Trades page with open modals:', currentPath);
      console.log('🚨 NAVIGATION SAFETY DIAGNOSTIC: About to call trades cleanup - modals are actually open');
      tradesCleanup();
      console.log('🔍 NAVIGATION SAFETY DEBUG: Trades cleanup completed');
      return; // Exit early if trades cleanup was successful
    }
  }
  
  // Minimal cleanup for other cases - much less aggressive
  try {
    // 1. Remove modal overlays with comprehensive selectors
    const modalSelectors = [
      '.modal-backdrop',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '.ReactModal__Overlay',
      '.ReactModal__Content'
    ];
    
    const overlays = document.querySelectorAll(modalSelectors.join(', '));
    
    overlays.forEach(overlay => {
      const element = overlay as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      const zIndex = parseInt(computedStyle.zIndex) || 0;
      
      // Remove elements with high z-index that cover screen
      if (zIndex > 100 && (
        computedStyle.position === 'fixed' ||
        computedStyle.position === 'absolute'
      )) {
        // Check if element has large dimensions (covers screen)
        const rect = element.getBoundingClientRect();
        const coversScreen = rect.width > window.innerWidth * 0.9 && 
                             rect.height > window.innerHeight * 0.9;
        
        if (coversScreen || element.classList.contains('modal-backdrop') || 
            element.getAttribute('aria-modal') === 'true') {
          console.log('🗑️ Navigation Safety FIXED: Removing blocking overlay:', element);
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        }
      }
    });
    
    // 2. Force cleanup of body styles that might block interactions
    document.body.style.pointerEvents = '';
    document.body.style.touchAction = '';
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('modal-open', 'overflow-hidden');
    
    // 3. Remove any inline styles that might be blocking interactions
    if (document.body.getAttribute('style')?.includes('pointer-events: none')) {
      document.body.removeAttribute('style');
    }
    
    // 4. FIXED: Ensure navigation elements are clickable - but don't override existing styles
    const navElements = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link');
    navElements.forEach(nav => {
      const element = nav as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      
      // Only fix if pointer-events is explicitly set to none
      if (computedStyle.pointerEvents === 'none') {
        element.style.pointerEvents = 'auto';
        console.log('🔧 Navigation Safety FIXED: Fixed pointer-events for navigation element:', element);
      }
    });
  } catch (error) {
    console.warn('⚠️ Navigation Safety FIXED: Failed to cleanup:', error);
  }
}

/**
 * FIXED Safe navigation function that allows normal navigation
 * FIXED: Removed all blocking behavior - only cleans up actual modals on Trades page
 */
export function safeNavigation(href: string, label?: string): void {
  console.log('🧭 Navigation Safety FIXED: Safe navigation attempted', { href, label, pathname: window.location?.pathname });
  
  // FIXED: Remove all blocking behavior - let navigation work normally
  // Only use navigation safety for actual modal cleanup on Trades page
  const isOnTradesPage = window.location?.pathname?.includes('/trades');
  
  if (isOnTradesPage) {
    console.log('🧭 Navigation Safety FIXED: On Trades page - checking for modal cleanup only');
    
    // Only run cleanup if there are actual modals open
    const hasOpenModals = document.querySelector('.modal-backdrop, [role="dialog"], [aria-modal="true"], .ReactModal__Overlay, .ReactModal__Content') !== null;
    
    if (hasOpenModals) {
      console.log('🧹 Navigation Safety FIXED: Cleaning up open modals before navigation');
      forceCleanupNavigationBlockers();
    }
  } else {
    console.log('🧭 Navigation Safety FIXED: Not on Trades page - skipping all cleanup to allow normal navigation');
  }
  
  // FIXED: Execute navigation immediately without any blocking
  try {
    console.log('🧭 Navigation Safety FIXED: Executing navigation to:', href);
    window.location.href = href;
  } catch (error) {
    console.error('Navigation Safety FIXED: Navigation failed', error);
    // Fallback: try to change location directly
    window.location.assign(href);
  }
}

/**
 * FIXED Initialize navigation safety for current page
 * FIXED: Removed global click handler that was interfering with normal navigation
 */
export function initializeNavigationSafety(): void {
  if (!navigationSafetyEnabled) return;
  
  console.log('🛡️ Navigation Safety FIXED: Initializing with minimal interference...');
  
  // FIXED: Removed global click handler that was blocking navigation
  // Only add visibility change handler for modal cleanup
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      forceCleanupNavigationBlockers();
    }
  });
  
  // Add beforeunload handler
  window.addEventListener('beforeunload', () => {
    forceCleanupNavigationBlockers();
  });
}

/**
 * Enable or disable navigation safety
 */
export function setNavigationSafety(enabled: boolean): void {
  navigationSafetyEnabled = enabled;
  console.log('🛡️ Navigation Safety FIXED:', enabled ? 'Enabled' : 'Disabled');
}

/**
 * Check if navigation safety is enabled
 */
export function isNavigationSafetyEnabled(): boolean {
  return navigationSafetyEnabled;
}

/**
 * Reset all navigation safety flags
 * FIXED: Simplified to prevent stuck flags
 */
export function resetNavigationSafetyFlags(): void {
  console.log('🔄 Navigation Safety FIXED: Manual reset of all flags called');
  
  // Clear any pending timeout
  if (navigationCompletionTimer) {
    clearTimeout(navigationCompletionTimer);
    navigationCompletionTimer = null;
  }
  
  // Reset all flags
  isNavigating = false;
  userInteractionInProgress = false;
  navigationStartTime = 0;
  
  console.log('✅ Navigation Safety FIXED: All flags have been reset', {
    isNavigating,
    userInteractionInProgress,
    navigationStartTime
  });
}

/**
 * Enhanced navigation detection to better determine when navigation has completed
 */
export function detectNavigationCompletion(): void {
  if (!isNavigating) {
    console.log('🔍 Navigation Safety FIXED: Navigation not in progress, no detection needed');
    return;
  }
  
  const navigationDuration = Date.now() - navigationStartTime;
  console.log('🔍 Navigation Safety FIXED: Checking navigation completion', {
    navigationDuration,
    pathname: window.location?.pathname
  });
  
  // If navigation has been in progress for too long, reset flags
  if (navigationDuration > NAVIGATION_TIMEOUT) {
    console.log('⚠️ Navigation Safety FIXED: Navigation timeout detected, resetting flags');
    resetNavigationSafetyFlags();
  }
}

/**
 * Special handling for Trades page navigation
 * FIXED: Simplified to work with new navigation system
 */
export function handleTradesPageNavigation(href: string, label?: string): void {
  console.log('🚨 TRADES PAGE NAVIGATION FIXED: Special handling for Trades page navigation', {
    href,
    label,
    currentPath: window.location?.pathname
  });
  
  // FIXED: Reset any stuck flags immediately
  resetNavigationSafetyFlags();
  
  // Execute navigation immediately without cleanup
  setTimeout(() => {
    console.log('🚨 TRADES PAGE NAVIGATION FIXED: Executing direct navigation to:', href);
    try {
      window.location.href = href;
    } catch (error) {
      console.error('Navigation Safety FIXED: Navigation failed', error);
      // Fallback: try to change location directly
      window.location.assign(href);
    }
  }, 10);
}

// Export to global scope for access from anywhere
if (typeof window !== 'undefined') {
  (window as any).navigationSafety = {
    forceCleanupNavigationBlockers,
    safeNavigation,
    initializeNavigationSafety,
    setNavigationSafety,
    isNavigationSafetyEnabled,
    resetNavigationSafetyFlags,
    detectNavigationCompletion,
    handleTradesPageNavigation,
    // Add reference to trades cleanup function for easier access
    getTradesCleanup: () => {
      return (window as any).cleanupModalOverlays ||
             (window as any).forceCleanupAllOverlays ||
             (window as any).tradesPageCleanup;
    }
  };
  
  console.log('🔗 Navigation Safety FIXED: Global scope initialized with minimal interference');
}