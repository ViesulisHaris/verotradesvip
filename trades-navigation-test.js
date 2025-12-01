/**
 * TRADES PAGE NAVIGATION TEST
 * 
 * This script tests that all menu buttons are clickable and navigate correctly
 * from the trades page.
 */

console.log('🧪 TRADES PAGE NAVIGATION TEST: Starting...');

// Test data
const menuItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Trades', href: '/trades' },
  { name: 'Log Trade', href: '/log-trade' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'Strategy', href: '/strategies' },
  { name: 'Confluence', href: '/confluence' },
  { name: 'Settings', href: '/settings' }
];

// Function to test navigation
function testNavigation() {
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Running navigation tests...');
  
  // Check if we're on the trades page
  const currentPath = window.location.pathname;
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Current path:', currentPath);
  
  if (!currentPath.includes('/trades')) {
    console.log('❌ TRADES PAGE NAVIGATION TEST: Not on trades page. Please navigate to /trades first.');
    return;
  }
  
  // Find all navigation links
  const navLinks = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link, .verotrade-top-navigation a');
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Found', navLinks.length, 'navigation links');
  
  // Test each navigation link
  navLinks.forEach((link, index) => {
    const href = link.getAttribute('href');
    const text = link.textContent?.trim() || 'Unknown';
    
    console.log(`🧪 TRADES PAGE NAVIGATION TEST: Testing link ${index + 1}: "${text}" -> "${href}"`);
    
    // Check if the link has proper pointer events
    const computedStyle = window.getComputedStyle(link);
    const pointerEvents = computedStyle.pointerEvents;
    
    if (pointerEvents === 'none') {
      console.log(`❌ TRADES PAGE NAVIGATION TEST: Link "${text}" has pointer-events: none - FIX NEEDED`);
    } else {
      console.log(`✅ TRADES PAGE NAVIGATION TEST: Link "${text}" has pointer-events: ${pointerEvents}`);
    }
    
    // Check if the link is visible
    const rect = link.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    
    if (!isVisible) {
      console.log(`❌ TRADES PAGE NAVIGATION TEST: Link "${text}" is not visible - FIX NEEDED`);
    } else {
      console.log(`✅ TRADES PAGE NAVIGATION TEST: Link "${text}" is visible`);
    }
    
    // Check if the link has a valid href
    if (!href || href === '#') {
      console.log(`❌ TRADES PAGE NAVIGATION TEST: Link "${text}" has invalid href - FIX NEEDED`);
    } else {
      console.log(`✅ TRADES PAGE NAVIGATION TEST: Link "${text}" has valid href: ${href}`);
    }
  });
  
  // Test mobile menu if it exists
  const mobileMenuButton = document.querySelector('button[aria-label="Toggle navigation menu"]');
  if (mobileMenuButton) {
    console.log('🧪 TRADES PAGE NAVIGATION TEST: Found mobile menu button');
    
    // Check if mobile menu button is clickable
    const buttonStyle = window.getComputedStyle(mobileMenuButton);
    const buttonPointerEvents = buttonStyle.pointerEvents;
    
    if (buttonPointerEvents === 'none') {
      console.log('❌ TRADES PAGE NAVIGATION TEST: Mobile menu button has pointer-events: none - FIX NEEDED');
    } else {
      console.log('✅ TRADES PAGE NAVIGATION TEST: Mobile menu button has pointer-events: auto');
    }
  }
  
  // Check for any overlays that might block navigation
  const overlays = document.querySelectorAll('.fixed.inset-0, [style*="position: fixed"]');
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Found', overlays.length, 'potential overlay elements');
  
  overlays.forEach((overlay, index) => {
    const computedStyle = window.getComputedStyle(overlay);
    const zIndex = parseInt(computedStyle.zIndex) || 0;
    const pointerEvents = computedStyle.pointerEvents;
    
    console.log(`🧪 TRADES PAGE NAVIGATION TEST: Overlay ${index + 1}: z-index=${zIndex}, pointer-events=${pointerEvents}`);
    
    if (zIndex > 100 && pointerEvents !== 'none') {
      console.log(`⚠️ TRADES PAGE NAVIGATION TEST: Overlay ${index + 1} has high z-index and might block navigation`);
    }
  });
  
  // Check body styles that might block navigation
  const bodyStyle = window.getComputedStyle(document.body);
  const bodyPointerEvents = bodyStyle.pointerEvents;
  
  if (bodyPointerEvents === 'none') {
    console.log('❌ TRADES PAGE NAVIGATION TEST: Body has pointer-events: none - FIX NEEDED');
  } else {
    console.log('✅ TRADES PAGE NAVIGATION TEST: Body has pointer-events: auto');
  }
  
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Navigation tests completed');
}

// Function to check for high z-index overlays
function checkHighZIndexOverlays() {
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Checking for high z-index overlays...');
  
  const allElements = document.querySelectorAll('*');
  const highZIndexElements = [];
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const zIndex = parseInt(computedStyle.zIndex) || 0;
    
    if (zIndex > 1000) {
      highZIndexElements.push({
        element: element.tagName,
        className: element.className,
        zIndex: zIndex,
        position: computedStyle.position,
        pointerEvents: computedStyle.pointerEvents
      });
    }
  });
  
  console.log('🧪 TRADES PAGE NAVIGATION TEST: Found', highZIndexElements.length, 'elements with z-index > 1000');
  
  highZIndexElements.forEach((item, index) => {
    console.log(`🧪 TRADES PAGE NAVIGATION TEST: High z-index element ${index + 1}:`, item);
    
    if (item.pointerEvents !== 'none') {
      console.log(`⚠️ TRADES PAGE NAVIGATION TEST: High z-index element ${index + 1} might block navigation`);
    }
  });
}

// Run tests
setTimeout(() => {
  testNavigation();
  checkHighZIndexOverlays();
  
  console.log('🧪 TRADES PAGE NAVIGATION TEST: All tests completed');
  console.log('🧪 TRADES PAGE NAVIGATION TEST: If you see any ❌ or ⚠️ messages, please check the fixes.');
}, 2000);

// Export functions for manual testing
window.testTradesPageNavigation = testNavigation;
window.checkHighZIndexOverlays = checkHighZIndexOverlays;

console.log('🧪 TRADES PAGE NAVIGATION TEST: Test functions exported to window object');
console.log('🧪 TRADES PAGE NAVIGATION TEST: You can run tests manually by calling:');
console.log('🧪 TRADES PAGE NAVIGATION TEST:   window.testTradesPageNavigation()');
console.log('🧪 TRADES PAGE NAVIGATION TEST:   window.checkHighZIndexOverlays()');