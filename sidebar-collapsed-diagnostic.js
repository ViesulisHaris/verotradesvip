/**
 * SIDEBAR COLLAPSED STATE DIAGNOSTIC TEST
 * 
 * This script diagnoses why the sidebar is not visible when collapsed
 * Based on code analysis, I've identified the most likely issues:
 * 
 * 1. CSS Transform Issue: The sidebar is being translated off-screen even when collapsed
 * 2. State Management Conflict: isSidebarOpen vs isCollapsed state confusion
 * 3. Missing Toggle Button: The collapse/expand button might not be visible
 */

console.log('🔍 [SIDEBAR DIAGNOSTIC] Starting collapsed state analysis...');

// Wait for page to load
setTimeout(() => {
  console.log('🔍 [SIDEBAR DIAGNOSTIC] Page loaded, beginning analysis...');
  
  // Test 1: Find sidebar element
  const sidebar = document.querySelector('aside');
  console.log('📊 [TEST 1] Sidebar element found:', !!sidebar);
  
  if (sidebar) {
    const computedStyle = window.getComputedStyle(sidebar);
    console.log('📊 [TEST 1] Sidebar styles:', {
      transform: computedStyle.transform,
      width: computedStyle.width,
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      zIndex: computedStyle.zIndex,
      left: computedStyle.left,
      position: computedStyle.position
    });
    
    // Test 2: Check if sidebar has collapsed class
    const hasCollapsedClass = sidebar.classList.contains('collapsed');
    console.log('📊 [TEST 2] Sidebar has collapsed class:', hasCollapsedClass);
    
    // Test 3: Check transform values
    const transform = computedStyle.transform;
    const isTranslatedOffScreen = transform.includes('translateX(-100%)') || 
                               transform.includes('translateX(-280px)') || 
                               transform.includes('translateX(-256px)');
    console.log('📊 [TEST 3] Sidebar translated off-screen:', isTranslatedOffScreen);
    
    // Test 4: Find toggle button
    const toggleButton = document.querySelector('button[aria-label*="sidebar"], button[title*="sidebar"]');
    console.log('📊 [TEST 4] Toggle button found:', !!toggleButton);
    
    if (toggleButton) {
      const buttonStyle = window.getComputedStyle(toggleButton);
      console.log('📊 [TEST 4] Toggle button styles:', {
        display: buttonStyle.display,
        visibility: buttonStyle.visibility,
        opacity: buttonStyle.opacity,
        position: buttonStyle.position,
        zIndex: buttonStyle.zIndex
      });
    }
    
    // Test 5: Check localStorage state
    const savedState = localStorage.getItem('sidebar-collapsed');
    console.log('📊 [TEST 5] LocalStorage state:', savedState);
    
    // Test 6: Check for overlay elements
    const overlay = document.querySelector('.verotrade-desktop-overlay');
    console.log('📊 [TEST 6] Desktop overlay found:', !!overlay);
    
    if (overlay) {
      const overlayStyle = window.getComputedStyle(overlay);
      console.log('📊 [TEST 6] Overlay styles:', {
        display: overlayStyle.display,
        visibility: overlayStyle.visibility,
        opacity: overlayStyle.opacity,
        zIndex: overlayStyle.zIndex
      });
    }
    
    // DIAGNOSIS SUMMARY
    console.log('\n🎯 [DIAGNOSIS SUMMARY]');
    console.log('=====================================');
    
    if (isTranslatedOffScreen) {
      console.log('❌ PRIMARY ISSUE: Sidebar is translated off-screen even when collapsed');
      console.log('   Expected: translateX(0) when collapsed (visible but narrow)');
      console.log('   Actual: translateX(-100%) (completely hidden)');
    }
    
    if (!toggleButton) {
      console.log('❌ SECONDARY ISSUE: Toggle button not found or not visible');
      console.log('   User cannot expand sidebar from collapsed state');
    }
    
    if (hasCollapsedClass && isTranslatedOffScreen) {
      console.log('🔍 ROOT CAUSE IDENTIFIED:');
      console.log('   The sidebar has "collapsed" class but CSS rules are still');
      console.log('   applying translateX(-100%) which hides it completely.');
      console.log('   This happens in verotrade-design-system.css line 305:');
      console.log('   .verotrade-sidebar.collapsed { transform: translateX(-100%); }');
    }
    
    console.log('\n💡 [RECOMMENDED FIX]');
    console.log('=====================================');
    console.log('1. When sidebar is collapsed, it should have transform: translateX(0)');
    console.log('2. The collapsed state should only affect width, not position');
    console.log('3. Ensure toggle button is always visible when sidebar is collapsed');
    console.log('4. Fix the CSS rule: .verotrade-sidebar.collapsed { transform: translateX(0); }');
    
  } else {
    console.log('❌ [CRITICAL] No sidebar element found on page');
  }
  
}, 2000);