// Sidebar Diagnostic Script
// Run this in the browser console to diagnose sidebar issues

console.log('🔍 [SIDEBAR_DIAGNOSTIC] Starting sidebar diagnosis...');

// Check 1: Sidebar element existence
const sidebarElement = document.querySelector('.verotrade-sidebar-overlay') || 
                     document.querySelector('.verotrade-sidebar') ||
                     document.querySelector('[class*="sidebar"]');

console.log('🔍 [SIDEBAR_DIAGNOSTIC] Sidebar element check:', {
  found: !!sidebarElement,
  element: sidebarElement,
  className: sidebarElement?.className,
  id: sidebarElement?.id,
  styles: sidebarElement ? window.getComputedStyle(sidebarElement) : null
});

// Check 2: Sidebar visibility state
if (sidebarElement) {
  const styles = window.getComputedStyle(sidebarElement);
  console.log('🔍 [SIDEBAR_DIAGNOSTIC] Sidebar visibility state:', {
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity,
    transform: styles.transform,
    zIndex: styles.zIndex,
    position: styles.position,
    left: styles.left,
    top: styles.top,
    width: styles.width,
    height: styles.height
  });
}

// Check 3: Mobile menu button
const mobileMenuBtn = document.querySelector('.verotrade-mobile-menu-btn');
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Mobile menu button check:', {
  found: !!mobileMenuBtn,
  element: mobileMenuBtn,
  display: mobileMenuBtn ? window.getComputedStyle(mobileMenuBtn).display : null
});

// Check 4: Auth state
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Checking auth state...');
if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
  console.log('🔍 [SIDEBAR_DIAGNOSTIC] Next.js data found:', window.__NEXT_DATA__);
}

// Check 5: React component tree (if React DevTools available)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('🔍 [SIDEBAR_DIAGNOSTIC] React DevTools available');
  // Try to find sidebar components in React tree
  const reactRoot = document.querySelector('#__next');
  if (reactRoot) {
    console.log('🔍 [SIDEBAR_DIAGNOSTIC] React root found');
  }
}

// Check 6: CSS classes and media queries
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Current viewport:', {
  width: window.innerWidth,
  height: window.innerHeight,
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: window.innerWidth >= 1024
});

// Check 7: Event listeners
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Checking for sidebar-related events...');
const eventListeners = [];
if (sidebarElement) {
  // Try to trigger some events to see if they work
  sidebarElement.click();
  setTimeout(() => {
    const stylesAfterClick = window.getComputedStyle(sidebarElement);
    console.log('🔍 [SIDEBAR_DIAGNOSTIC] Sidebar state after click:', {
      transform: stylesAfterClick.transform,
      visibility: stylesAfterClick.visibility,
      opacity: stylesAfterClick.opacity
    });
  }, 100);
}

// Check 8: Look for UnifiedLayout component
const layoutElements = document.querySelectorAll('[class*="layout"], [class*="Layout"]');
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Layout elements:', {
  count: layoutElements.length,
  elements: Array.from(layoutElements).map(el => ({
    className: el.className,
    tagName: el.tagName
  }))
});

// Check 9: Check for any error boundaries or error messages
const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Error elements:', {
  count: errorElements.length,
  elements: Array.from(errorElements).map(el => ({
    className: el.className,
    textContent: el.textContent?.substring(0, 100)
  }))
});

// Check 10: Check for loading states
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
console.log('🔍 [SIDEBAR_DIAGNOSTIC] Loading elements:', {
  count: loadingElements.length,
  elements: Array.from(loadingElements).map(el => ({
    className: el.className,
    textContent: el.textContent?.substring(0, 100)
  }))
});

console.log('🔍 [SIDEBAR_DIAGNOSTIC] Diagnosis complete. Check the output above for issues.');