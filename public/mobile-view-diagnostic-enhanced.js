/**
 * Enhanced Mobile View Diagnostic Tool with Zoom Detection
 * 
 * This enhanced diagnostic works with the zoom detection utility
 * to provide accurate information about zoom-affected responsive issues.
 */

console.log('🔍 ENHANCED MOBILE VIEW DIAGNOSTIC TOOL STARTED');
console.log('===========================================');

// Enhanced diagnostic functions
function checkZoomAwareViewport() {
  console.log('\n📱 ZOOM-AWARE VIEWPORT INFO:');
  
  // Get zoom info from our detector
  const zoomInfo = window.__zoomInfo || {
    level: 1,
    percentage: 100,
    actualWidth: window.innerWidth,
    effectiveWidth: window.innerWidth,
    actualHeight: window.innerHeight,
    effectiveHeight: window.innerHeight
  };
  
  console.log(`Zoom Level: ${zoomInfo.percentage}% (${zoomInfo.level})`);
  console.log(`Actual Window: ${zoomInfo.actualWidth}×${zoomInfo.actualHeight}`);
  console.log(`Effective Window: ${Math.round(zoomInfo.effectiveWidth)}×${Math.round(zoomInfo.effectiveHeight)}`);
  console.log(`Device Pixel Ratio: ${window.devicePixelRatio || 1}`);
  
  // Calculate what the effective width should be for desktop
  const desktopThreshold = 1024;
  const tabletThreshold = 768;
  const mobileThreshold = 640;
  
  console.log('\n🎯 BREAKPOINT ANALYSIS:');
  console.log(`Desktop Threshold (1024px): ${zoomInfo.effectiveWidth >= desktopThreshold ? '✅ SHOULD BE DESKTOP' : '❌ NOT DESKTOP'}`);
  console.log(`Tablet Threshold (768px): ${zoomInfo.effectiveWidth >= tabletThreshold ? '✅ SHOULD BE TABLET+' : '❌ NOT TABLET'}`);
  console.log(`Mobile Threshold (640px): ${zoomInfo.effectiveWidth >= mobileThreshold ? '✅ SHOULD BE MOBILE+' : '❌ NOT MOBILE'}`);
  
  // Determine actual view based on effective width
  let actualView = 'Mobile';
  if (zoomInfo.effectiveWidth >= desktopThreshold) {
    actualView = 'Desktop';
  } else if (zoomInfo.effectiveWidth >= tabletThreshold) {
    actualView = 'Tablet';
  }
  
  console.log(`\n📊 ACTUAL VIEW (Zoom-Corrected): ${actualView}`);
  
  // Check if there's a mismatch between actual and expected
  const shouldShowDesktop = zoomInfo.actualWidth >= desktopThreshold;
  const actuallyShowsDesktop = zoomInfo.effectiveWidth >= desktopThreshold;
  
  if (shouldShowDesktop && !actuallyShowsDesktop) {
    console.log('\n🚨 ZOOM ISSUE DETECTED:');
    console.log(`❌ Browser zoom (${zoomInfo.percentage}%) is causing mobile layout on desktop`);
    console.log(`❌ Actual width (${zoomInfo.actualWidth}px) should show desktop but effective width (${Math.round(zoomInfo.effectiveWidth)}px) shows mobile`);
    console.log(`💡 SOLUTION: Reset browser zoom to 100% (Ctrl+0 or Cmd+0)`);
  } else if (!shouldShowDesktop && actuallyShowsDesktop) {
    console.log('\n✅ LAYOUT IS CORRECT:');
    console.log(`✅ Actual width (${zoomInfo.actualWidth}px) and effective width (${Math.round(zoomInfo.effectiveWidth)}px) both show ${actualView}`);
  }
}

function checkZoomAwareCSS() {
  console.log('\n🎨 ZOOM-AWARE CSS ANALYSIS:');
  
  // Check if zoom-aware CSS is applied
  const bodyClasses = document.body.className;
  const hasZoomAware = bodyClasses.includes('zoom-aware-responsive');
  
  console.log(`Zoom-aware CSS applied: ${hasZoomAware ? '✅ YES' : '❌ NO'}`);
  console.log(`Body classes: ${bodyClasses}`);
  
  // Check CSS custom properties
  const rootStyles = getComputedStyle(document.documentElement);
  const zoomLevel = rootStyles.getPropertyValue('--zoom-level');
  const zoomPercentage = rootStyles.getPropertyValue('--zoom-percentage');
  
  console.log(`CSS --zoom-level: ${zoomLevel || 'NOT SET'}`);
  console.log(`CSS --zoom-percentage: ${zoomPercentage || 'NOT SET'}`);
  
  // Check for zoom-specific classes
  const hasZoomHigh = bodyClasses.includes('zoom-high');
  const hasZoomLow = bodyClasses.includes('zoom-low');
  const hasZoomNormal = bodyClasses.includes('zoom-normal');
  
  console.log(`Zoom level classes: High=${hasZoomHigh}, Low=${hasZoomLow}, Normal=${hasZoomNormal}`);
}

function checkZoomAwareLayout() {
  console.log('\n🏗️ ZOOM-AWARE LAYOUT ANALYSIS:');
  
  // Check sidebar elements
  const desktopSidebar = document.querySelector('.zoom-sidebar-desktop');
  const mobileSidebar = document.querySelector('.zoom-sidebar-mobile');
  const zoomContent = document.querySelector('.zoom-content');
  
  if (desktopSidebar) {
    const desktopStyles = getComputedStyle(desktopSidebar);
    console.log(`Desktop sidebar display: ${desktopStyles.display}`);
    console.log(`Desktop sidebar visibility: ${desktopStyles.visibility}`);
  }
  
  if (mobileSidebar) {
    const mobileStyles = getComputedStyle(mobileSidebar);
    console.log(`Mobile sidebar display: ${mobileStyles.display}`);
    console.log(`Mobile sidebar visibility: ${mobileStyles.visibility}`);
  }
  
  if (zoomContent) {
    const contentStyles = getComputedStyle(zoomContent);
    console.log(`Zoom content display: ${contentStyles.display}`);
    console.log(`Zoom content flex-direction: ${contentStyles.flexDirection}`);
  }
  
  // Check for zoom indicator
  const zoomIndicator = document.querySelector('.zoom-indicator');
  if (zoomIndicator) {
    console.log(`Zoom indicator found: ✅ VISIBLE`);
  } else {
    console.log(`Zoom indicator found: ❌ NOT VISIBLE`);
  }
  
  // Check for debug panel
  const debugPanel = document.querySelector('.zoom-debug-panel');
  if (debugPanel) {
    console.log(`Debug panel found: ✅ VISIBLE`);
  } else {
    console.log(`Debug panel found: ❌ NOT VISIBLE`);
  }
}

function checkMediaQueries() {
  console.log('\n📱 MEDIA QUERY ANALYSIS:');
  
  const queries = [
    { name: 'sm', query: '(min-width: 640px)' },
    { name: 'md', query: '(min-width: 768px)' },
    { name: 'lg', query: '(min-width: 1024px)' },
    { name: 'xl', query: '(min-width: 1280px)' },
    { name: '2xl', query: '(min-width: 1536px)' }
  ];
  
  queries.forEach(({ name, query }) => {
    const matches = window.matchMedia(query).matches;
    console.log(`${name.toUpperCase()} (${query}): ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
  });
  
  // Check zoom-aware media queries
  const zoomInfo = window.__zoomInfo || { level: 1, percentage: 100 };
  const zoomQueries = [
    { name: 'sm', query: `(min-width: ${640 / zoomInfo.level}px)` },
    { name: 'md', query: `(min-width: ${768 / zoomInfo.level}px)` },
    { name: 'lg', query: `(min-width: ${1024 / zoomInfo.level}px)` },
    { name: 'xl', query: `(min-width: ${1280 / zoomInfo.level}px)` },
    { name: '2xl', query: `(min-width: ${1536 / zoomInfo.level}px)` }
  ];
  
  console.log('\n🔍 ZOOM-AWARE MEDIA QUERIES:');
  zoomQueries.forEach(({ name, query }) => {
    const matches = window.matchMedia(query).matches;
    console.log(`${name.toUpperCase()} (zoom-aware): ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
  });
}

function checkLayoutElements() {
  console.log('\n🧩 LAYOUT ELEMENTS CHECK:');
  
  // Check main layout container
  const mainContainer = document.querySelector('.min-h-screen.bg-primary.flex');
  if (mainContainer) {
    console.log('Main container found: ✅ YES');
    const containerClasses = mainContainer.className;
    console.log(`Container classes: ${containerClasses}`);
  } else {
    console.log('Main container found: ❌ NO');
  }
  
  // Check for zoom-aware layout wrapper
  const zoomAwareLayout = document.querySelector('.zoom-aware-layout');
  if (zoomAwareLayout) {
    console.log('Zoom-aware layout found: ✅ YES');
    const layoutClasses = zoomAwareLayout.className;
    console.log(`Layout classes: ${layoutClasses}`);
  } else {
    console.log('Zoom-aware layout found: ❌ NO');
  }
  
  // Check sidebar elements
  const sidebars = document.querySelectorAll('aside');
  console.log(`Sidebar elements found: ${sidebars.length}`);
  sidebars.forEach((sidebar, index) => {
    const classes = sidebar.className;
    const isVisible = getComputedStyle(sidebar).display !== 'none';
    console.log(`  Sidebar ${index + 1}: ${isVisible ? 'VISIBLE' : 'HIDDEN'} (${classes})`);
  });
}

function generateRecommendations() {
  console.log('\n💡 RECOMMENDATIONS:');
  
  const zoomInfo = window.__zoomInfo || { level: 1, percentage: 100 };
  const issues = [];
  
  // Check for zoom issues
  if (Math.abs(zoomInfo.percentage - 100) > 5) {
    issues.push({
      type: 'zoom',
      severity: 'high',
      message: `Browser zoom is ${zoomInfo.percentage}% - reset to 100% for proper layout`,
      solution: 'Press Ctrl+0 (Windows/Linux) or Cmd+0 (Mac) to reset zoom'
    });
  }
  
  // Check for viewport issues
  if (zoomInfo.actualWidth < 1024 && zoomInfo.effectiveWidth >= 1024) {
    issues.push({
      type: 'layout',
      severity: 'high',
      message: 'Zoom is causing incorrect responsive behavior',
      solution: 'Zoom-aware layout system should fix this automatically'
    });
  }
  
  // Check for missing zoom detection
  if (!window.__zoomInfo) {
    issues.push({
      type: 'detection',
      severity: 'medium',
      message: 'Zoom detection system not initialized',
      solution: 'Refresh the page to initialize zoom detection'
    });
  }
  
  if (issues.length === 0) {
    console.log('✅ No issues detected - layout is working correctly!');
  } else {
    console.log(`\n🚨 ${issues.length} ISSUE(S) FOUND:`);
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.type.toUpperCase()} (${issue.severity}):`);
      console.log(`   Issue: ${issue.message}`);
      console.log(`   Solution: ${issue.solution}`);
    });
  }
  
  return issues;
}

// Main enhanced diagnostic function
function runEnhancedDiagnostic() {
  console.log('Running enhanced mobile view diagnostic with zoom detection...\n');
  
  checkZoomAwareViewport();
  checkZoomAwareCSS();
  checkZoomAwareLayout();
  checkMediaQueries();
  checkLayoutElements();
  
  const issues = generateRecommendations();
  
  console.log('\n🔍 ENHANCED DIAGNOSTIC COMPLETE');
  console.log('===========================================');
  
  // Return results for programmatic use
  return {
    zoomInfo: window.__zoomInfo,
    issues: issues,
    timestamp: new Date().toISOString(),
    isWorkingCorrectly: issues.length === 0
  };
}

// Auto-run diagnostic when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runEnhancedDiagnostic);
} else {
  runEnhancedDiagnostic();
}

// Also run diagnostic when window is resized
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    console.log('\n🔄 WINDOW RESIZED - RERUNNING ENHANCED DIAGNOSTIC');
    runEnhancedDiagnostic();
  }, 500);
});

// Also run diagnostic when zoom changes
window.addEventListener('zoom', () => {
  console.log('\n🔍 ZOOM CHANGED - RERUNNING ENHANCED DIAGNOSTIC');
  setTimeout(runEnhancedDiagnostic, 100);
});

// Make enhanced diagnostic available globally
window.enhancedMobileViewDiagnostic = runEnhancedDiagnostic;
console.log('💡 Tip: Run window.enhancedMobileViewDiagnostic() anytime to re-run enhanced diagnostic');