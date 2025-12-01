/**
 * Gray Screen Issue Diagnostic Script
 * 
 * This script helps diagnose the gray screen issue by checking:
 * 1. Authentication state and initialization
 * 2. Module loading and webpack chunks
 * 3. CSS loading and styling issues
 * 4. Supabase client initialization
 * 5. Component mounting and rendering
 */

// Run in browser console to diagnose gray screen issues
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Starting gray screen diagnosis...');

// 1. Check if we're on the correct page
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Page Info:', {
  url: window.location.href,
  pathname: window.location.pathname,
  title: document.title,
  readyState: document.readyState
});

// 2. Check authentication state
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Checking authentication state...');
setTimeout(() => {
  // Check if AuthContext is available
  const authContextElement = document.querySelector('[data-auth-context]');
  if (authContextElement) {
    console.log('✅ [GRAY_SCREEN_DIAGNOSTIC] AuthContext element found');
  } else {
    console.log('❌ [GRAY_SCREEN_DIAGNOSTIC] AuthContext element not found');
  }
  
  // Check for loading indicators
  const loadingElements = document.querySelectorAll('[data-loading], .loading, .spinner');
  console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Loading elements found:', loadingElements.length);
  
  // Check for auth-related console errors
  const originalError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('auth') || args[0].includes('supabase'))) {
      console.log('🚨 [GRAY_SCREEN_DIAGNOSTIC] Auth/Supabase error detected:', args);
    }
    originalError.apply(console, args);
  };
}, 1000);

// 3. Check CSS loading
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Checking CSS loading...');
const stylesheets = Array.from(document.styleSheets);
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Stylesheets loaded:', stylesheets.length);
stylesheets.forEach((sheet, index) => {
  try {
    console.log(`🔍 [GRAY_SCREEN_DIAGNOSTIC] Stylesheet ${index}:`, sheet.href);
  } catch (e) {
    console.log(`🚨 [GRAY_SCREEN_DIAGNOSTIC] Stylesheet ${index} access denied:`, e.message);
  }
});

// 4. Check for webpack chunks
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Checking webpack chunks...');
if (window.__webpack_require__ && window.__webpack_require__.cache) {
  const chunkCount = Object.keys(window.__webpack_require__.cache).length;
  console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Webpack chunks loaded:', chunkCount);
} else {
  console.log('❌ [GRAY_SCREEN_DIAGNOSTIC] Webpack require not available');
}

// 5. Check React components
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Checking React components...');
setTimeout(() => {
  const reactRoot = document.querySelector('#__next');
  if (reactRoot) {
    console.log('✅ [GRAY_SCREEN_DIAGNOSTIC] React root found');
    console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] React root children:', reactRoot.children.length);
    
    // Check for specific components
    const authGuard = document.querySelector('[data-auth-guard]');
    const homePage = document.querySelector('[data-home-page]');
    const loadingSpinner = document.querySelector('.spinner');
    
    console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Component detection:', {
      authGuard: !!authGuard,
      homePage: !!homePage,
      loadingSpinner: !!loadingSpinner
    });
  } else {
    console.log('❌ [GRAY_SCREEN_DIAGNOSTIC] React root not found');
  }
}, 2000);

// 6. Check for gray screen specific issues
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Checking for gray screen issues...');
setTimeout(() => {
  const body = document.body;
  const computedStyle = window.getComputedStyle(body);
  
  console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Body styles:', {
    backgroundColor: computedStyle.backgroundColor,
    color: computedStyle.color,
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity
  });
  
  // Check if body is empty or has hidden content
  const hasContent = body.innerText.trim().length > 0;
  const hasVisibleElements = Array.from(body.children).some(child => {
    const style = window.getComputedStyle(child);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  });
  
  console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Content analysis:', {
    hasTextContent: hasContent,
    hasVisibleElements: hasVisibleElements,
    childElementCount: body.children.length
  });
  
  // Final diagnosis
  console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Final diagnosis:');
  if (!hasContent && !hasVisibleElements) {
    console.log('🚨 [GRAY_SCREEN_DIAGNOSTIC] LIKELY ISSUE: No visible content rendered - check React component mounting');
  } else if (computedStyle.backgroundColor === 'rgb(18, 18, 18)' || computedStyle.backgroundColor === '#121212') {
    console.log('🚨 [GRAY_SCREEN_DIAGNOSTIC] LIKELY ISSUE: Dark background with no content - check authentication state');
  } else {
    console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Content appears to be rendering - check for specific element visibility issues');
  }
}, 3000);

// 7. Monitor for dynamic changes
console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Monitoring for DOM changes...');
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] DOM changed:', {
        addedNodes: mutation.addedNodes.length,
        removedNodes: mutation.removedNodes.length,
        target: mutation.target.tagName
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Stop monitoring after 10 seconds
setTimeout(() => {
  observer.disconnect();
  console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] DOM monitoring stopped');
}, 10000);

console.log('🔍 [GRAY_SCREEN_DIAGNOSTIC] Diagnostic script initialized. Check console for updates...');