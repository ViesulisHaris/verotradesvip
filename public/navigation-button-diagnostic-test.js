/**
 * Navigation Button Functionality Diagnostic Test
 * 
 * This test will systematically check for button functionality issues
 * and identify the root cause of navigation problems.
 */

console.log('🔍 NAVIGATION BUTTON DIAGNOSTIC TEST STARTED');
console.log('==========================================');

// Test 1: Check for navigation safety system interference
function testNavigationSafetyInterference() {
  console.log('\n📋 TEST 1: Navigation Safety System Interference');
  console.log('--------------------------------------------------');
  
  if (typeof window !== 'undefined' && window.navigationSafety) {
    console.log('✅ Navigation safety system is active');
    
    const navSafety = window.navigationSafety;
    console.log('🔍 Navigation Safety State:', {
      isNavigating: navSafety.isNavigating || 'undefined',
      userInteractionInProgress: navSafety.userInteractionInProgress || 'undefined',
      lastCleanupTime: navSafety.lastCleanupTime || 'undefined',
      cooldownRemaining: navSafety.CLEANUP_COOLDOWN ? 
        Math.max(0, navSafety.CLEANUP_COOLDOWN - (Date.now() - (navSafety.lastCleanupTime || 0))) : 
        'unknown'
    });
    
    // Check if flags are stuck
    if (navSafety.isNavigating) {
      console.log('🚨 ISSUE: isNavigating flag is stuck - this will block navigation');
    }
    if (navSafety.userInteractionInProgress) {
      console.log('🚨 ISSUE: userInteractionInProgress flag is stuck - this will block navigation');
    }
    
    // Test reset function
    console.log('🔄 Testing navigation safety reset...');
    try {
      navSafety.resetNavigationSafetyFlags();
      console.log('✅ Navigation safety flags reset successfully');
    } catch (error) {
      console.log('❌ Failed to reset navigation safety flags:', error);
    }
  } else {
    console.log('ℹ️ Navigation safety system is not active');
  }
}

// Test 2: Check for multiple navigation components
function testMultipleNavigationComponents() {
  console.log('\n📋 TEST 2: Multiple Navigation Components Detection');
  console.log('--------------------------------------------------');
  
  const navigationSelectors = [
    'nav',
    '[role="navigation"]',
    '.sidebar',
    '.desktop-sidebar',
    '.mobile-sidebar',
    '[class*="navigation"]',
    '[class*="sidebar"]'
  ];
  
  const foundComponents = [];
  
  navigationSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundComponents.push({
        selector,
        count: elements.length,
        elements: Array.from(elements).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          isVisible: el.offsetParent !== null
        }))
      });
    }
  });
  
  console.log('🔍 Found Navigation Components:', foundComponents);
  
  if (foundComponents.length > 2) {
    console.log('🚨 ISSUE: Multiple navigation components detected - potential conflicts');
  }
  
  // Check for specific component conflicts
  const modernNav = document.querySelector('[class*="ModernNavigation"]');
  const sidebar = document.querySelector('[class*="Sidebar"]');
  
  if (modernNav && sidebar) {
    console.log('🚨 ISSUE: Both ModernNavigation and Sidebar components found - potential conflict');
  }
}

// Test 3: Check for CSS pointer-events issues
function testPointerEventsIssues() {
  console.log('\n📋 TEST 3: CSS Pointer Events Issues');
  console.log('--------------------------------------');
  
  const buttonSelectors = [
    'button',
    'a[href]',
    '[role="button"]',
    '[role="link"]',
    '[onclick]',
    '.nav-link',
    '[class*="button"]'
  ];
  
  const problematicElements = [];
  
  buttonSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const pointerEvents = computedStyle.pointerEvents;
      
      if (pointerEvents === 'none') {
        problematicElements.push({
          element,
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: element.textContent?.trim(),
          pointerEvents,
          zIndex: computedStyle.zIndex
        });
      }
    });
  });
  
  console.log('🔍 Elements with pointer-events: none:', problematicElements);
  
  if (problematicElements.length > 0) {
    console.log('🚨 ISSUE: Found elements with pointer-events: none - clicks will be blocked');
  }
  
  // Check body element
  const bodyStyle = window.getComputedStyle(document.body);
  console.log('🔍 Body element styles:', {
    pointerEvents: bodyStyle.pointerEvents,
    overflow: bodyStyle.overflow,
    touchAction: bodyStyle.touchAction,
    userSelect: bodyStyle.userSelect
  });
  
  if (bodyStyle.pointerEvents === 'none') {
    console.log('🚨 CRITICAL ISSUE: Body has pointer-events: none - ALL clicks blocked');
  }
}

// Test 4: Test actual button click functionality
function testButtonClickFunctionality() {
  console.log('\n📋 TEST 4: Button Click Functionality Test');
  console.log('--------------------------------------------');
  
  const testButtons = [
    { selector: 'button[aria-label*="menu"]', name: 'Mobile Menu Button' },
    { selector: 'button[aria-label*="navigation"]', name: 'Navigation Toggle Button' },
    { selector: 'a[href="/dashboard"]', name: 'Dashboard Link' },
    { selector: 'a[href="/trades"]', name: 'Trades Link' },
    { selector: 'a[href="/strategies"]', name: 'Strategies Link' },
    { selector: 'button[onclick*="logout"]', name: 'Logout Button' }
  ];
  
  const results = [];
  
  testButtons.forEach(({ selector, name }) => {
    const element = document.querySelector(selector);
    
    if (element) {
      const isVisible = element.offsetParent !== null;
      const computedStyle = window.getComputedStyle(element);
      const hasClickListener = element.onclick || element.hasAttribute('onclick');
      
      // Test click event
      let clickTestResult = 'unknown';
      try {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        const wasPrevented = !element.dispatchEvent(clickEvent);
        clickTestResult = wasPrevented ? 'prevented' : 'allowed';
      } catch (error) {
        clickTestResult = 'error: ' + error.message;
      }
      
      results.push({
        name,
        selector,
        found: true,
        isVisible,
        hasClickListener,
        pointerEvents: computedStyle.pointerEvents,
        zIndex: computedStyle.zIndex,
        clickTestResult,
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id
        }
      });
    } else {
      results.push({
        name,
        selector,
        found: false
      });
    }
  });
  
  console.log('🔍 Button Click Test Results:', results);
  
  const failedButtons = results.filter(r => 
    r.found && (!r.isVisible || r.pointerEvents === 'none' || r.clickTestResult === 'prevented')
  );
  
  if (failedButtons.length > 0) {
    console.log('🚨 ISSUE: Found non-functional buttons:', failedButtons);
  }
}

// Test 5: Check for event listener conflicts
function testEventListenerConflicts() {
  console.log('\n📋 TEST 5: Event Listener Conflicts');
  console.log('------------------------------------');
  
  // Check for global click listeners
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const clickListeners = [];
  
  // Temporarily override addEventListener to capture listeners
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'click') {
      clickListeners.push({
        target: this,
        listener: listener.toString(),
        options
      });
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Trigger some clicks to capture listeners
  setTimeout(() => {
    console.log('🔍 Detected click listeners:', clickListeners.length);
    
    // Check for navigation safety listeners
    const navSafetyListeners = clickListeners.filter(cl => 
      cl.listener.includes('navigationSafety') || 
      cl.listener.includes('safeNavigation') ||
      cl.listener.includes('forceCleanup')
    );
    
    if (navSafetyListeners.length > 0) {
      console.log('🚨 ISSUE: Found navigation safety click listeners that may interfere:', navSafetyListeners.length);
    }
    
    // Restore original addEventListener
    EventTarget.prototype.addEventListener = originalAddEventListener;
  }, 1000);
}

// Test 6: Check Next.js router functionality
function testNextJsRouter() {
  console.log('\n📋 TEST 6: Next.js Router Functionality');
  console.log('----------------------------------------');
  
  if (typeof window !== 'undefined') {
    console.log('🔍 Next.js Router State:', {
      hasNextRouter: !!(window as any).next,
      hasRouter: !!(window as any).next?.router,
      currentPath: window.location?.pathname,
      hasHistory: !!(window as any).history,
      historyLength: window.history?.length
    });
    
    // Test Next.js router if available
    if ((window as any).next?.router) {
      const router = (window as any).next.router;
      console.log('🔍 Router Info:', {
        pathname: router.pathname,
        query: router.query,
        asPath: router.asPath,
        isReady: router.isReady
      });
    }
  }
}

// Test 7: Check for overlay elements blocking clicks
function testOverlayBlockers() {
  console.log('\n📋 TEST 7: Overlay Elements Blocking Clicks');
  console.log('--------------------------------------------');
  
  const overlaySelectors = [
    '.modal-backdrop',
    '[role="dialog"]',
    '[aria-modal="true"]',
    '.fixed.inset-0',
    '[style*="position: fixed"]',
    '[style*="z-index"]'
  ];
  
  const blockingOverlays = [];
  
  overlaySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const zIndex = parseInt(computedStyle.zIndex) || 0;
      const position = computedStyle.position;
      
      if (zIndex > 100 && (position === 'fixed' || position === 'absolute')) {
        const rect = element.getBoundingClientRect();
        const coversScreen = rect.width > window.innerWidth * 0.9 && 
                             rect.height > window.innerHeight * 0.9;
        
        if (coversScreen) {
          blockingOverlays.push({
            element,
            tagName: element.tagName,
            className: element.className,
            zIndex,
            position,
            rect,
            isVisible: element.offsetParent !== null
          });
        }
      }
    });
  });
  
  console.log('🔍 Potentially blocking overlays:', blockingOverlays);
  
  if (blockingOverlays.length > 0) {
    console.log('🚨 ISSUE: Found overlays that may be blocking clicks');
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting comprehensive navigation diagnostic tests...');
  
  try {
    testNavigationSafetyInterference();
    testMultipleNavigationComponents();
    testPointerEventsIssues();
    testButtonClickFunctionality();
    testEventListenerConflicts();
    testNextJsRouter();
    testOverlayBlockers();
    
    console.log('\n✅ All diagnostic tests completed');
    console.log('==========================================');
    console.log('📊 SUMMARY: Check the results above for issues marked with 🚨');
    
    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. If navigation safety flags are stuck, call: window.navigationSafety.resetNavigationSafetyFlags()');
    console.log('2. If multiple navigation components exist, remove duplicates');
    console.log('3. If pointer-events: none found, identify and fix the source');
    console.log('4. If overlays are blocking, ensure they are properly cleaned up');
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
  }
}

// Auto-run tests when page loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    setTimeout(runAllTests, 1000); // Delay to ensure all components are loaded
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testNavigationSafetyInterference,
    testMultipleNavigationComponents,
    testPointerEventsIssues,
    testButtonClickFunctionality,
    testEventListenerConflicts,
    testNextJsRouter,
    testOverlayBlockers
  };
}