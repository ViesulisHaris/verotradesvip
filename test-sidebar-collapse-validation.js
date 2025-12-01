/**
 * SIDEBAR COLLAPSE VALIDATION TEST
 * 
 * This test will validate the sidebar collapse behavior and identify the exact issue
 */

console.log('🧪 [SIDEBAR VALIDATION] Starting comprehensive sidebar collapse test...');

// Test function to check sidebar state
function checkSidebarState() {
  console.log('\n📊 [SIDEBAR STATE CHECK]');
  console.log('================================');
  
  // Find sidebar element
  const sidebar = document.querySelector('aside');
  if (!sidebar) {
    console.log('❌ No sidebar element found');
    return false;
  }
  
  // Get computed styles
  const computedStyle = window.getComputedStyle(sidebar);
  const rect = sidebar.getBoundingClientRect();
  
  // Check all relevant properties
  const sidebarData = {
    element: 'aside',
    classes: sidebar.className,
    width: computedStyle.width,
    transform: computedStyle.transform,
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    position: computedStyle.position,
    left: computedStyle.left,
    zIndex: computedStyle.zIndex,
    boundingRect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right
    }
  };
  
  console.log('📋 Sidebar Data:', sidebarData);
  
  // Check if sidebar has collapsed class
  const hasCollapsedClass = sidebar.classList.contains('collapsed');
  console.log('🏷️ Has collapsed class:', hasCollapsedClass);
  
  // Check if sidebar is actually visible
  const isVisible = rect.width > 0 && rect.height > 0 && rect.left >= 0;
  console.log('👁️ Is actually visible:', isVisible);
  
  // Check if sidebar is translated off-screen
  const isTranslatedOffScreen = computedStyle.transform.includes('translateX(-100%)') || 
                               computedStyle.transform.includes('translateX(-280px)') || 
                               computedStyle.transform.includes('translateX(-256px)');
  console.log('↔️ Is translated off-screen:', isTranslatedOffScreen);
  
  // Find toggle button
  const toggleButton = document.querySelector('button[aria-label*="sidebar"], button[title*="sidebar"]');
  const toggleData = toggleButton ? {
    found: true,
    visible: window.getComputedStyle(toggleButton).display !== 'none',
    position: window.getComputedStyle(toggleButton).position,
    zIndex: window.getComputedStyle(toggleButton).zIndex
  } : { found: false };
  
  console.log('🎯 Toggle button:', toggleData);
  
  // DIAGNOSIS
  console.log('\n🎯 [DIAGNOSIS]');
  console.log('================================');
  
  if (hasCollapsedClass && isTranslatedOffScreen) {
    console.log('❌ CONFIRMED: Sidebar has collapsed class but is translated off-screen');
    console.log('   This is the ROOT CAUSE of the issue');
    console.log('   Expected: transform: translateX(0) when collapsed');
    console.log('   Actual: ' + computedStyle.transform);
    return {
      issue: 'CSS_TRANSFORM_HIDDEN',
      severity: 'HIGH',
      description: 'Sidebar is hidden by translateX(-100%) when collapsed'
    };
  }
  
  if (hasCollapsedClass && !isVisible) {
    console.log('❌ CONFIRMED: Sidebar has collapsed class but is not visible');
    return {
      issue: 'COLLAPSED_HIDDEN',
      severity: 'HIGH', 
      description: 'Collapsed sidebar is not visible'
    };
  }
  
  if (!toggleButton.found) {
    console.log('⚠️ WARNING: Toggle button not found');
    return {
      issue: 'NO_TOGGLE_BUTTON',
      severity: 'MEDIUM',
      description: 'Cannot expand collapsed sidebar'
    };
  }
  
  if (hasCollapsedClass && isVisible && !isTranslatedOffScreen) {
    console.log('✅ Sidebar collapsed state working correctly');
    return {
      issue: 'NONE',
      severity: 'OK',
      description: 'Sidebar collapsed state is working properly'
    };
  }
  
  console.log('🤔 Unknown state - needs manual investigation');
  return {
    issue: 'UNKNOWN',
    severity: 'UNKNOWN',
    description: 'Sidebar state needs investigation'
  };
}

// Run test after page loads
setTimeout(() => {
  const result = checkSidebarState();
  
  // Store result for later retrieval
  window.sidebarTestResult = result;
  
  console.log('\n📝 [FINAL RESULT]');
  console.log('================================');
  console.log('Issue:', result.issue);
  console.log('Severity:', result.severity);
  console.log('Description:', result.description);
  
  // Auto-fix if CSS transform issue detected
  if (result.issue === 'CSS_TRANSFORM_HIDDEN') {
    console.log('\n🔧 [AUTO-FIX ATTEMPT]');
    console.log('================================');
    console.log('Attempting to fix CSS transform issue...');
    
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      // Add inline style to override CSS
      sidebar.style.setProperty('transform', 'translateX(0)', 'important');
      console.log('✅ Applied fix: transform: translateX(0)');
      
      // Check if fix worked
      setTimeout(() => {
        const newRect = sidebar.getBoundingClientRect();
        const isNowVisible = newRect.left >= 0;
        console.log('🔍 Fix verification:', isNowVisible ? 'SUCCESS' : 'FAILED');
        
        if (isNowVisible) {
          console.log('🎉 Sidebar is now visible when collapsed!');
          window.sidebarFixApplied = true;
        }
      }, 100);
    }
  }
  
}, 2000);