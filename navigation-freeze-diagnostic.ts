/**
 * NAVIGATION FREEZE DIAGNOSTIC SCRIPT
 *
 * This script will help diagnose the exact cause of menu freezing
 * after visiting the Trades page by monitoring key indicators.
 */

console.log('🔍 NAVIGATION FREEZE DIAGNOSTIC: Starting diagnostic...');

// Track navigation state before and after visiting Trades page
let navigationState = {
  beforeTrades: null as any,
  afterTrades: null as any,
  navigationAttempts: [] as any[]
};

// Function to check if navigation elements are clickable
function checkNavigationElements() {
  const navElements = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link, .nav-item-luxury');
  const results: any[] = [];
  
  navElements.forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    results.push({
      index,
      text: element.textContent?.substring(0, 20),
      href: (element as HTMLAnchorElement).href,
      visible: rect.width > 0 && rect.height > 0,
      pointerEvents: styles.pointerEvents,
      zIndex: styles.zIndex,
      position: styles.position,
      display: styles.display,
      opacity: styles.opacity,
      hasPointerEventsNone: styles.pointerEvents === 'none',
      isHidden: styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0'
    });
  });
  
  return results;
}

// Function to check for problematic overlays
function checkForOverlays() {
  const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"], [aria-modal="true"]');
  const results: any[] = [];
  
  overlays.forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    results.push({
      index,
      className: element.className,
      zIndex: styles.zIndex,
      position: styles.position,
      pointerEvents: styles.pointerEvents,
      width: rect.width,
      height: rect.height,
      coversScreen: rect.width > window.innerWidth * 0.9 && rect.height > window.innerHeight * 0.9
    });
  });
  
  return results;
}

// Function to check body styles
function checkBodyStyles() {
  const styles = window.getComputedStyle(document.body);
  return {
    pointerEvents: styles.pointerEvents,
    overflow: styles.overflow,
    userSelect: styles.userSelect,
    classes: document.body.className,
    hasInlineStyles: !!document.body.getAttribute('style'),
    inlineStyles: document.body.getAttribute('style')
  };
}

// Function to check navigation safety state
function checkNavigationSafety() {
  if (typeof window !== 'undefined' && (window as any).navigationSafety) {
    const navSafety = (window as any).navigationSafety;
    return {
      isNavigating: navSafety.isNavigating,
      userInteractionInProgress: navSafety.userInteractionInProgress,
      lastCleanupTime: navSafety.lastCleanupTime,
      cooldownRemaining: navSafety.CLEANUP_COOLDOWN ? 
        Math.max(0, navSafety.CLEANUP_COOLDOWN - (Date.now() - navSafety.lastCleanupTime)) : 
        'unknown'
    };
  }
  return null;
}

// Function to check for trades cleanup functions
function checkTradesCleanupFunctions() {
  return {
    cleanupModalOverlays: typeof (window as any).cleanupModalOverlays === 'function',
    forceCleanupAllOverlays: typeof (window as any).forceCleanupAllOverlays === 'function',
    tradesPageCleanup: typeof (window as any).tradesPageCleanup === 'function',
    navigationSafetyTradesCleanup: typeof (window as any).navigationSafety?.getTradesCleanup === 'function'
  };
}

// Main diagnostic function
function runDiagnostic(label: string) {
  console.log(`🔍 DIAGNOSTIC: ${label}`);
  
  const diagnostic = {
    timestamp: Date.now(),
    label,
    navigationElements: checkNavigationElements(),
    overlays: checkForOverlays(),
    bodyStyles: checkBodyStyles(),
    navigationSafety: checkNavigationSafety(),
    tradesCleanupFunctions: checkTradesCleanupFunctions(),
    currentPath: window.location.pathname
  };
  
  // Log key issues
  console.log(`📊 ${label} - Navigation Elements:`, diagnostic.navigationElements.length);
  console.log(`📊 ${label} - Overlays:`, diagnostic.overlays.length);
  console.log(`📊 ${label} - Body pointer-events:`, diagnostic.bodyStyles.pointerEvents);
  console.log(`📊 ${label} - Navigation Safety:`, diagnostic.navigationSafety);
  
  // Check for specific problems
  const blockedNavElements = diagnostic.navigationElements.filter(el => el.hasPointerEventsNone || el.isHidden);
  if (blockedNavElements.length > 0) {
    console.error(`🚨 ${label} - BLOCKED NAVIGATION ELEMENTS:`, blockedNavElements);
  }
  
  const problematicOverlays = diagnostic.overlays.filter(el => el.coversScreen && el.pointerEvents !== 'none');
  if (problematicOverlays.length > 0) {
    console.error(`🚨 ${label} - PROBLEMATIC OVERLAYS:`, problematicOverlays);
  }
  
  if (diagnostic.bodyStyles.pointerEvents === 'none') {
    console.error(`🚨 ${label} - BODY POINTER-EVENTS SET TO NONE`);
  }
  
  if (diagnostic.navigationSafety?.isNavigating) {
    console.error(`🚨 ${label} - NAVIGATION SAFETY FLAG STUCK: isNavigating=true`);
  }
  
  if (diagnostic.navigationSafety?.userInteractionInProgress) {
    console.error(`🚨 ${label} - NAVIGATION SAFETY FLAG STUCK: userInteractionInProgress=true`);
  }
  
  return diagnostic;
}

// Run initial diagnostic
navigationState.beforeTrades = runDiagnostic('BEFORE TRADES PAGE');

// Set up monitoring for navigation attempts
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('🧭 HISTORY: pushState called', args);
  navigationState.navigationAttempts.push({
    timestamp: Date.now(),
    method: 'pushState',
    args: args,
    state: runDiagnostic('NAVIGATION ATTEMPT')
  });
  return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
  console.log('🧭 HISTORY: replaceState called', args);
  navigationState.navigationAttempts.push({
    timestamp: Date.now(),
    method: 'replaceState',
    args: args,
    state: runDiagnostic('NAVIGATION ATTEMPT')
  });
  return originalReplaceState.apply(this, args);
};

// Monitor clicks on navigation elements
document.addEventListener('click', (event) => {
  const target = event.target as Element;
  const navElement = target.closest('nav a, [role="navigation"] a, .nav-link, .nav-item-luxury');
  
  if (navElement) {
    console.log('🖱️ NAVIGATION CLICK:', {
      element: navElement.tagName,
      href: (navElement as HTMLAnchorElement).href,
      text: navElement.textContent?.substring(0, 20),
      timestamp: Date.now()
    });
    
    // Check state immediately after click
    setTimeout(() => {
      const clickState = runDiagnostic('AFTER NAVIGATION CLICK');
      navigationState.navigationAttempts.push({
        timestamp: Date.now(),
        method: 'click',
        element: navElement.tagName,
        href: (navElement as HTMLAnchorElement).href,
        state: clickState
      });
    }, 100);
  }
}, true);

// Export diagnostic functions to global scope for manual testing
(window as any).navigationDiagnostic = {
  runDiagnostic,
  checkNavigationElements,
  checkForOverlays,
  checkBodyStyles,
  checkNavigationSafety,
  checkTradesCleanupFunctions,
  getNavigationState: () => navigationState
};

console.log('🔗 NAVIGATION FREEZE DIAGNOSTIC: Diagnostic functions exported to window.navigationDiagnostic');
console.log('💡 USAGE: Run navigationDiagnostic.runDiagnostic("CUSTOM LABEL") to check current state');

// Auto-run diagnostic every 5 seconds
setInterval(() => {
  runDiagnostic('PERIODIC CHECK');
}, 5000);

console.log('🔍 NAVIGATION FREEZE DIAGNOSTIC: Auto-monitoring started (every 5 seconds)');