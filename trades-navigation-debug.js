// Navigation Debug Script for Trades Page
// Run this in browser console when on the Trades page to diagnose navigation freeze

console.log('🔍 TRADES NAVIGATION DEBUG STARTED');

// 1. Check for debug panel interference
function checkDebugPanel() {
  const debugPanel = document.querySelector('.zoom-debug-panel');
  if (debugPanel) {
    const computedStyle = window.getComputedStyle(debugPanel);
    console.log('🚫 DEBUG PANEL FOUND:', {
      element: debugPanel,
      zIndex: computedStyle.zIndex,
      display: computedStyle.display,
      position: computedStyle.position,
      pointerEvents: computedStyle.pointerEvents,
      rect: debugPanel.getBoundingClientRect()
    });
    
    // Test if debug panel is blocking clicks
    const testPoint = document.elementFromPoint(
      debugPanel.getBoundingClientRect().left + 10,
      debugPanel.getBoundingClientRect().top + 10
    );
    console.log('🎯 ELEMENT AT DEBUG PANEL POSITION:', testPoint);
  } else {
    console.log('✅ No debug panel found');
  }
}

// 2. Check for modal overlays
function checkModalOverlays() {
  const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [style*="position: fixed"]');
  console.log('📋 OVERLAY ELEMENTS FOUND:', overlays.length);
  
  overlays.forEach((overlay, index) => {
    const computedStyle = window.getComputedStyle(overlay);
    console.log(`📋 OVERLAY ${index + 1}:`, {
      element: overlay,
      className: overlay.className,
      zIndex: computedStyle.zIndex,
      display: computedStyle.display,
      pointerEvents: computedStyle.pointerEvents,
      rect: overlay.getBoundingClientRect()
    });
  });
}

// 3. Check body pointer events
function checkBodyPointerEvents() {
  const bodyStyle = window.getComputedStyle(document.body);
  console.log('👆 BODY POINTER EVENTS:', {
    pointerEvents: bodyStyle.pointerEvents,
    touchAction: bodyStyle.touchAction,
    overflow: bodyStyle.overflow
  });
}

// 4. Test navigation click detection
function testNavigationClicks() {
  const navLinks = document.querySelectorAll('a[href], button[onclick]');
  console.log('🔗 NAVIGATION ELEMENTS FOUND:', navLinks.length);
  
  navLinks.forEach((link, index) => {
    const rect = link.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const computedStyle = window.getComputedStyle(link);
    
    console.log(`🔗 LINK ${index + 1}:`, {
      element: link,
      href: link.href || 'no href',
      onclick: link.onclick ? 'has onclick' : 'no onclick',
      visible: isVisible,
      zIndex: computedStyle.zIndex,
      pointerEvents: computedStyle.pointerEvents,
      rect: rect
    });
  });
}

// 5. Check for event listeners on navigation elements
function checkEventListeners() {
  const navElements = document.querySelectorAll('nav a, .nav-item, button');
  console.log('👂 CHECKING EVENT LISTENERS ON NAV ELEMENTS:', navElements.length);
  
  navElements.forEach((element, index) => {
    const listeners = getEventListeners ? getEventListeners(element) : 'No access to getEventListeners';
    console.log(`👂 ELEMENT ${index + 1} LISTENERS:`, {
      element: element,
      listeners: listeners
    });
  });
}

// 6. Test click interception
function testClickInterception() {
  console.log('🖱️ TESTING CLICK INTERCEPTION...');
  
  // Try to click on navigation elements
  const navLinks = document.querySelectorAll('a[href^="/"]');
  navLinks.forEach((link, index) => {
    try {
      const rect = link.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        console.log(`🖱️ SIMULATING CLICK ON LINK ${index + 1}:`, link.href);
        link.click();
        
        // Check if navigation happened after a short delay
        setTimeout(() => {
          console.log(`🖱️ CLICK RESULT ${index + 1}:`, {
            currentUrl: window.location.href,
            targetUrl: link.href,
            navigated: window.location.href !== link.href
          });
        }, 100);
      }
    } catch (error) {
      console.error(`🖱️ CLICK ERROR ${index + 1}:`, error);
    }
  });
}

// Run all checks
function runFullDiagnosis() {
  console.log('🔍 RUNNING FULL NAVIGATION DIAGNOSIS...');
  checkDebugPanel();
  checkModalOverlays();
  checkBodyPointerEvents();
  testNavigationClicks();
  checkEventListeners();
  testClickInterception();
  console.log('🔍 DIAGNOSIS COMPLETE');
}

// Auto-run diagnosis
runFullDiagnosis();

// Also run diagnosis when user tries to navigate
document.addEventListener('click', (e) => {
  const target = e.target;
  const tagName = target.tagName;
  const className = target.className;
  
  console.log('🖱️ CLICK DETECTED:', {
    target: target,
    tagName: tagName,
    className: className,
    href: target.href,
    onclick: target.onclick
  });
  
  // Check if click is on navigation element
  if (target.href || target.onclick) {
    setTimeout(() => {
      console.log('🔄 POST-CLICK CHECK:', {
        currentUrl: window.location.href,
        navigated: false // We'll check this manually
      });
    }, 200);
  }
});

// Expose functions for manual testing
window.tradesDebug = {
  checkDebugPanel,
  checkModalOverlays,
  checkBodyPointerEvents,
  testNavigationClicks,
  checkEventListeners,
  testClickInterception,
  runFullDiagnosis
};

console.log('🔍 TRADES DEBUG FUNCTIONS AVAILABLE: window.tradesDebug');