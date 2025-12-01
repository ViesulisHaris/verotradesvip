/**
 * Diagnostic Script to Identify "Cannot read properties of undefined (reading 'call')" Error
 * 
 * This script adds comprehensive logging to track:
 * 1. AuthContext access patterns
 * 2. Navigation safety function calls
 * 3. Component mount/unmount cycles
 * 4. Global window object access
 */

console.log('🔍 [DIAGNOSTIC] Starting comprehensive error tracking...');

// Track AuthContext usage
if (typeof window !== 'undefined') {
  // Monitor useAuth calls
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('Cannot read properties of undefined')) {
      console.log('🚨 [DIAGNOSTIC] TARGET ERROR DETECTED!');
      console.log('🔍 [DIAGNOSTIC] Error details:', {
        message: args[0],
        stack: args[1]?.stack,
        timestamp: new Date().toISOString(),
        url: window.location?.href,
        userAgent: navigator.userAgent
      });
      
      // Check if it's related to AuthContext
      if (args[0].includes('call') && args[1]?.stack) {
        const stack = args[1].stack;
        if (stack.includes('AuthContext') || stack.includes('useAuth')) {
          console.log('🔍 [DIAGNOSTIC] CONFIRMED: AuthContext-related error');
          console.log('🔍 [DIAGNOSTIC] Check if component is wrapped in AuthContextProviderSimple');
        }
        
        if (stack.includes('navigation-safety') || stack.includes('forceCleanup')) {
          console.log('🔍 [DIAGNOSTIC] CONFIRMED: Navigation safety error');
          console.log('🔍 [DIAGNOSTIC] Check if cleanup functions exist');
        }
      }
    }
    
    return originalConsoleError.apply(console, args);
  };

  // Monitor navigation safety function calls
  let navigationSafetyCallCount = 0;
  
  // Wrap navigation safety object
  const originalNavigationSafety = window.navigationSafety;
  if (originalNavigationSafety) {
    window.navigationSafety = {
      ...originalNavigationSafety,
      forceCleanupNavigationBlockers: function(...args) {
        navigationSafetyCallCount++;
        console.log(`🔍 [DIAGNOSTIC] Navigation safety call #${navigationSafetyCallCount}: forceCleanupNavigationBlockers`);
        
        // Check if cleanup functions exist
        const tradesCleanup = window.cleanupModalOverlays ||
                           window.forceCleanupAllOverlays ||
                           window.tradesPageCleanup ||
                           (window.navigationSafety && window.navigationSafety.tradesPageCleanup);
        
        console.log('🔍 [DIAGNOSTIC] Cleanup functions available:', {
          cleanupModalOverlays: !!window.cleanupModalOverlays,
          forceCleanupAllOverlays: !!window.forceCleanupAllOverlays,
          tradesPageCleanup: !!window.tradesPageCleanup,
          navigationSafetyTradesCleanup: !!(window.navigationSafety && window.navigationSafety.tradesPageCleanup),
          tradesCleanupType: typeof tradesCleanup
        });
        
        if (tradesCleanup && typeof tradesCleanup !== 'function') {
          console.error('🚨 [DIAGNOSTIC] CRITICAL: tradesCleanup exists but is not a function!');
        }
        
        try {
          return originalNavigationSafety.forceCleanupNavigationBlockers.apply(this, args);
        } catch (error) {
          console.error('🚨 [DIAGNOSTIC] Error in forceCleanupNavigationBlockers:', error);
          throw error;
        }
      },
      
      safeNavigation: function(...args) {
        console.log('🔍 [DIAGNOSTIC] Navigation safety call: safeNavigation', args);
        return originalNavigationSafety.safeNavigation.apply(this, args);
      }
    };
  }

  // Monitor React component mounting
  let componentMountCount = 0;
  
  // Track when components try to use auth context
  const observeAuthUsage = () => {
    const authElements = document.querySelectorAll('[data-auth-aware]');
    authElements.forEach((element, index) => {
      if (!element.hasAttribute('data-auth-monitored')) {
        element.setAttribute('data-auth-monitored', 'true');
        console.log(`🔍 [DIAGNOSTIC] Found auth-aware element #${index + 1}:`, element);
      }
    });
  };

  // Start monitoring
  const observer = new MutationObserver(() => {
    componentMountCount++;
    observeAuthUsage();
    
    if (componentMountCount % 10 === 0) {
      console.log(`🔍 [DIAGNOSTIC] Component monitoring cycle #${componentMountCount}`);
      console.log('🔍 [DIAGNOSTIC] Current state:', {
        navigationSafetyCalls: navigationSafetyCallCount,
        authElementsFound: document.querySelectorAll('[data-auth-aware]').length,
        url: window.location?.href,
        timestamp: new Date().toISOString()
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('🔍 [DIAGNOSTIC] Monitoring system initialized');
  console.log('🔍 [DIAGNOSTIC] Waiting for error to occur...');
  
  // Check initial state
  setTimeout(() => {
    console.log('🔍 [DIAGNOSTIC] Initial state check (5 seconds):');
    console.log('🔍 [DIAGNOSTIC] Navigation safety available:', !!window.navigationSafety);
    console.log('🔍 [DIAGNOSTIC] Auth context provider should be mounted');
    
    // Test if navigation safety functions are callable
    if (window.navigationSafety) {
      try {
        const testResult = window.navigationSafety.getTradesCleanup?.();
        console.log('🔍 [DIAGNOSTIC] getTradesCleanup test result:', typeof testResult);
      } catch (error) {
        console.error('🚨 [DIAGNOSTIC] getTradesCleanup test failed:', error);
      }
    }
  }, 5000);
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.diagnosticHelper = {
    getStats: () => ({
      navigationSafetyCalls: navigationSafetyCallCount,
      componentMountCount,
      timestamp: new Date().toISOString()
    }),
    
    testAuthContext: () => {
      console.log('🔍 [DIAGNOSTIC] Manual AuthContext test');
      // This will help identify if useAuth is available
      const authContext = document.querySelector('[data-auth-context]');
      console.log('🔍 [DIAGNOSTIC] Auth context element found:', !!authContext);
    },
    
    testNavigationSafety: () => {
      console.log('🔍 [DIAGNOSTIC] Manual navigation safety test');
      if (window.navigationSafety) {
        console.log('🔍 [DIAGNOSTIC] Navigation safety methods:', Object.keys(window.navigationSafety));
      } else {
        console.log('🔍 [DIAGNOSTIC] Navigation safety not available');
      }
    }
  };
  
  console.log('🔍 [DIAGNOSTIC] Diagnostic helper exported to window.diagnosticHelper');
  console.log('🔍 [DIAGNOSTIC] Run window.diagnosticHelper.getStats() for current stats');
}