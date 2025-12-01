// Menu Button Test Script
// This script tests the menu button positioning and hover functionality

console.log('🔧 [MENU_BUTTON_TEST] Starting menu button test...');

// Test 1: Check if menu button is properly positioned
function testMenuButtonPositioning() {
  console.log('🔧 [MENU_BUTTON_TEST] Testing menu button positioning...');
  
  // Check if menu button exists
  const menuButton = document.querySelector('.verotrade-desktop-menu-btn');
  if (!menuButton) {
    console.error('🔧 [MENU_BUTTON_TEST] ERROR: Menu button not found');
    return false;
  }
  
  // Check if menu button has correct positioning
  const style = window.getComputedStyle(menuButton);
  if (style.position !== 'fixed') {
    console.error('🔧 [MENU_BUTTON_TEST] ERROR: Menu button position is not fixed');
    return false;
  }
  
  console.log('✅ [MENU_BUTTON_TEST] Menu button positioning test passed');
  return true;
}

// Test 2: Check hover functionality
function testHoverFunctionality() {
  console.log('🔧 [MENU_BUTTON_TEST] Testing hover functionality...');
  
  // Check if sidebar exists
  const sidebar = document.querySelector('.verotrade-sidebar-overlay');
  if (!sidebar) {
    console.error('🔧 [MENU_BUTTON_TEST] ERROR: Sidebar not found');
    return false;
  }
  
  // Check initial sidebar width
  const initialWidth = window.getComputedStyle(sidebar).width;
  console.log(`🔧 [MENU_BUTTON_TEST] Initial sidebar width: ${initialWidth}`);
  
  // Simulate hover on menu button
  const menuButton = document.querySelector('.verotrade-desktop-menu-btn');
  if (!menuButton) {
    console.error('🔧 [MENU_BUTTON_TEST] ERROR: Menu button not found');
    return false;
  }
  
  // Trigger mouse enter event
  const mouseEnterEvent = new MouseEvent('mouseenter', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  menuButton.dispatchEvent(mouseEnterEvent);
  
  // Wait for transition to complete
  setTimeout(() => {
    const hoverWidth = window.getComputedStyle(sidebar).width;
    console.log(`🔧 [MENU_BUTTON_TEST] Sidebar width on hover: ${hoverWidth}`);
    
    if (hoverWidth === initialWidth) {
      console.error('🔧 [MENU_BUTTON_TEST] ERROR: Sidebar width did not change on hover');
      return false;
    }
    
    // Trigger mouse leave event
    const mouseLeaveEvent = new MouseEvent('mouseleave', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    menuButton.dispatchEvent(mouseLeaveEvent);
    
    // Wait for transition to complete
    setTimeout(() => {
      const finalWidth = window.getComputedStyle(sidebar).width;
      console.log(`🔧 [MENU_BUTTON_TEST] Sidebar width after mouse leave: ${finalWidth}`);
      
      if (finalWidth !== initialWidth) {
        console.error('🔧 [MENU_BUTTON_TEST] ERROR: Sidebar width did not return to initial state');
        return false;
      }
      
      console.log('✅ [MENU_BUTTON_TEST] Hover functionality test passed');
      return true;
    }, 400);
  }, 400);
}

// Test 3: Check if menu button appears on stats page
function testMenuButtonOnStats() {
  console.log('🔧 [MENU_BUTTON_TEST] Testing menu button on stats page...');
  
  // Check if we're on stats page
  if (!window.location.pathname.includes('stats')) {
    console.log('🔧 [MENU_BUTTON_TEST] Not on stats page, skipping test');
    return true;
  }
  
  // Check if menu button is visible
  const menuButton = document.querySelector('.verotrade-desktop-menu-btn');
  if (!menuButton) {
    console.error('🔧 [MENU_BUTTON_TEST] ERROR: Menu button not found on stats page');
    return false;
  }
  
  const style = window.getComputedStyle(menuButton);
  if (style.display === 'none') {
    console.error('🔧 [MENU_BUTTON_TEST] ERROR: Menu button is hidden on stats page');
    return false;
  }
  
  console.log('✅ [MENU_BUTTON_TEST] Menu button on stats page test passed');
  return true;
}

// Run all tests
function runAllTests() {
  console.log('🔧 [MENU_BUTTON_TEST] Running all tests...');
  
  const results = [
    testMenuButtonPositioning(),
    testHoverFunctionality(),
    testMenuButtonOnStats()
  ];
  
  setTimeout(() => {
    const allPassed = results.every(result => result === true);
    if (allPassed) {
      console.log('✅ [MENU_BUTTON_TEST] All tests passed!');
    } else {
      console.error('🔧 [MENU_BUTTON_TEST] Some tests failed!');
    }
  }, 1000);
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}