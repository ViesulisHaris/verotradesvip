/**
 * MENU FREEZING DIAGNOSTIC TEST
 * 
 * This test systematically investigates the persistent menu freezing issue
 * despite all previous fixes. It tests multiple potential root causes.
 */

console.log('🔍 MENU FREEZING DIAGNOSTIC TEST STARTED');
console.log('==========================================');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testTimeout: 30000,
  navigationDelay: 2000,
  clickDelay: 500
};

// Test results tracking
const testResults = {
  initialLoad: { success: false, error: null, timestamp: null },
  navigationTests: [],
  overlayTests: [],
  eventListenerTests: [],
  cssTests: [],
  performanceTests: []
};

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to log test results
function logTestResult(testName, success, details = {}) {
  const result = {
    testName,
    success,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  console.log(`📋 ${success ? '✅' : '❌'} ${testName}`, result);
  return result;
}

// Test 1: Initial Application Load and Menu State
async function testInitialLoad() {
  console.log('\n🚀 TEST 1: Initial Application Load and Menu State');
  
  try {
    // Navigate to the application
    window.location.href = TEST_CONFIG.baseUrl;
    await wait(3000);
    
    // Check if page loaded
    const body = document.body;
    const pageLoaded = body && body.innerHTML.length > 0;
    
    if (!pageLoaded) {
      return logTestResult('Initial Load', false, { error: 'Page failed to load' });
    }
    
    // Check for sidebar components
    const desktopSidebar = document.querySelector('aside[class*="sidebar"]');
    const mobileSidebar = document.querySelector('button[class*="mobile-menu"]');
    
    // Check for navigation elements
    const navLinks = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link');
    const sidebarLinks = document.querySelectorAll('.nav-item-luxury');
    
    // Check for debug panels
    const debugPanels = document.querySelectorAll('.zoom-debug-panel, [class*="debug-panel"]');
    
    const result = logTestResult('Initial Load', true, {
      desktopSidebarExists: !!desktopSidebar,
      mobileSidebarExists: !!mobileSidebar,
      navLinksCount: navLinks.length,
      sidebarLinksCount: sidebarLinks.length,
      debugPanelsCount: debugPanels.length,
      bodyStyles: {
        pointerEvents: window.getComputedStyle(body).pointerEvents,
        overflow: window.getComputedStyle(body).overflow,
        userSelect: window.getComputedStyle(body).userSelect
      }
    });
    
    testResults.initialLoad = { success: true, error: null, timestamp: new Date().toISOString() };
    return result;
    
  } catch (error) {
    const result = logTestResult('Initial Load', false, { error: error.message });
    testResults.initialLoad = { success: false, error: error.message, timestamp: new Date().toISOString() };
    return result;
  }
}

// Test 2: Navigation to Trades Page (Critical Test)
async function testTradesPageNavigation() {
  console.log('\n🧭 TEST 2: Navigation to Trades Page (Critical Test)');
  
  try {
    // Find and click the Trades link
    const tradesLink = Array.from(document.querySelectorAll('a, [role="link"], button')).find(el => 
      el.textContent?.includes('Trades') || el.href?.includes('/trades')
    );
    
    if (!tradesLink) {
      return logTestResult('Trades Link Found', false, { error: 'Trades navigation link not found' });
    }
    
    console.log('📍 Found Trades link:', tradesLink);
    
    // Check link state before click
    const linkBeforeClick = {
      pointerEvents: window.getComputedStyle(tradesLink).pointerEvents,
      zIndex: window.getComputedStyle(tradesLink).zIndex,
      position: window.getComputedStyle(tradesLink).position,
      visible: tradesLink.offsetParent !== null,
      disabled: tradesLink.disabled
    };
    
    // Attempt to click the Trades link
    console.log('🖱️ Clicking Trades link...');
    tradesLink.click();
    
    // Wait for navigation
    await wait(TEST_CONFIG.navigationDelay);
    
    // Check if navigation succeeded
    const currentUrl = window.location.href;
    const onTradesPage = currentUrl.includes('/trades');
    
    // Check for any overlays that might be blocking
    const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
    const blockingOverlays = Array.from(overlays).filter(overlay => {
      const style = window.getComputedStyle(overlay);
      const zIndex = parseInt(style.zIndex) || 0;
      return zIndex > 50 && (style.position === 'fixed' || style.position === 'absolute');
    });
    
    // Check body styles after navigation
    const bodyAfterNav = {
      pointerEvents: window.getComputedStyle(document.body).pointerEvents,
      overflow: window.getComputedStyle(document.body).overflow,
      userSelect: window.getComputedStyle(document.body).userSelect,
      classes: document.body.className
    };
    
    // Check if navigation elements are still interactive
    const navElementsAfterNav = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link');
    const interactiveNavElements = Array.from(navElementsAfterNav).filter(nav => {
      const style = window.getComputedStyle(nav);
      return style.pointerEvents !== 'none' && nav.offsetParent !== null;
    });
    
    const result = logTestResult('Trades Page Navigation', onTradesPage, {
      currentUrl,
      linkBeforeClick,
      blockingOverlaysCount: blockingOverlays.length,
      bodyAfterNav,
      navElementsCount: navElementsAfterNav.length,
      interactiveNavElementsCount: interactiveNavElements.length,
      navigationBlocked: !onTradesPage || blockingOverlays.length > 0
    });
    
    testResults.navigationTests.push(result);
    return result;
    
  } catch (error) {
    const result = logTestResult('Trades Page Navigation', false, { error: error.message });
    testResults.navigationTests.push(result);
    return result;
  }
}

// Test 3: Test Navigation Away from Trades Page
async function testNavigationAwayFromTrades() {
  console.log('\n🔙 TEST 3: Navigation Away from Trades Page');
  
  try {
    // First ensure we're on trades page
    if (!window.location.href.includes('/trades')) {
      window.location.href = `${TEST_CONFIG.baseUrl}/trades`;
      await wait(3000);
    }
    
    // Try to navigate to Dashboard
    const dashboardLink = Array.from(document.querySelectorAll('a, [role="link"], button')).find(el => 
      el.textContent?.includes('Dashboard') || el.href?.includes('/dashboard')
    );
    
    if (!dashboardLink) {
      return logTestResult('Dashboard Link Found', false, { error: 'Dashboard navigation link not found on trades page' });
    }
    
    console.log('📍 Found Dashboard link on trades page:', dashboardLink);
    
    // Check link state
    const linkState = {
      pointerEvents: window.getComputedStyle(dashboardLink).pointerEvents,
      zIndex: window.getComputedStyle(dashboardLink).zIndex,
      visible: dashboardLink.offsetParent !== null,
      disabled: dashboardLink.disabled
    };
    
    // Attempt to click
    console.log('🖱️ Clicking Dashboard link from trades page...');
    dashboardLink.click();
    await wait(TEST_CONFIG.navigationDelay);
    
    // Check if navigation worked
    const currentUrl = window.location.href;
    const navigationSuccess = currentUrl.includes('/dashboard') || !currentUrl.includes('/trades');
    
    // Check for overlays
    const overlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
    const blockingOverlays = Array.from(overlays).filter(overlay => {
      const style = window.getComputedStyle(overlay);
      const zIndex = parseInt(style.zIndex) || 0;
      return zIndex > 50;
    });
    
    const result = logTestResult('Navigation Away from Trades', navigationSuccess, {
      currentUrl,
      linkState,
      blockingOverlaysCount: blockingOverlays.length,
      navigationBlocked: !navigationSuccess
    });
    
    testResults.navigationTests.push(result);
    return result;
    
  } catch (error) {
    const result = logTestResult('Navigation Away from Trades', false, { error: error.message });
    testResults.navigationTests.push(result);
    return result;
  }
}

// Test 4: Overlay and Modal Detection
async function testOverlayDetection() {
  console.log('\n🎭 TEST 4: Overlay and Modal Detection');
  
  try {
    // Check for various types of overlays
    const overlaySelectors = [
      '.fixed.inset-0',
      '.modal-backdrop',
      '[style*="position: fixed"]',
      '.modal-overlay',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '.fixed.z-50',
      '.fixed.z-\\[999999\\]',
      '.fixed.z-\\[9999\\]',
      '[data-testid="modal"]',
      '[data-testid="overlay"]',
      '.ReactModal__Overlay',
      '.ReactModal__Content'
    ];
    
    const overlayResults = {};
    let totalOverlays = 0;
    let blockingOverlays = 0;
    
    overlaySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      const blockingElements = Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        const rect = el.getBoundingClientRect();
        const coversScreen = rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8;
        return zIndex > 50 && (style.position === 'fixed' || style.position === 'absolute') && coversScreen;
      });
      
      overlayResults[selector] = {
        total: elements.length,
        blocking: blockingElements.length
      };
      totalOverlays += elements.length;
      blockingOverlays += blockingElements.length;
    });
    
    // Check debug panels specifically
    const debugPanels = document.querySelectorAll('.zoom-debug-panel, [class*="debug-panel"]');
    const highZIndexDebugPanels = Array.from(debugPanels).filter(panel => {
      const style = window.getComputedStyle(panel);
      return parseInt(style.zIndex) > 100;
    });
    
    // Check body state
    const bodyState = {
      pointerEvents: window.getComputedStyle(document.body).pointerEvents,
      overflow: window.getComputedStyle(document.body).overflow,
      userSelect: window.getComputedStyle(document.body).userSelect,
      classes: document.body.className,
      hasInlineStyles: document.body.hasAttribute('style')
    };
    
    const result = logTestResult('Overlay Detection', blockingOverlays === 0, {
      overlayResults,
      totalOverlays,
      blockingOverlays,
      debugPanelsCount: debugPanels.length,
      highZIndexDebugPanelsCount: highZIndexDebugPanels.length,
      bodyState,
      hasBlockingElements: blockingOverlays > 0
    });
    
    testResults.overlayTests.push(result);
    return result;
    
  } catch (error) {
    const result = logTestResult('Overlay Detection', false, { error: error.message });
    testResults.overlayTests.push(result);
    return result;
  }
}

// Test 5: Event Listener Analysis
async function testEventListenerAnalysis() {
  console.log('\n👂 TEST 5: Event Listener Analysis');
  
  try {
    // Get all navigation elements
    const navElements = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link, .nav-item-luxury');
    
    let elementsWithListeners = 0;
    let clickableElements = 0;
    let blockedElements = 0;
    const elementDetails = [];
    
    navElements.forEach((element, index) => {
      const style = window.getComputedStyle(element);
      const hasClickListener = element.onclick !== null;
      const hasPointerEvents = style.pointerEvents !== 'none';
      const isVisible = element.offsetParent !== null;
      const hasTabIndex = element.tabIndex >= 0;
      
      if (hasClickListener || element.addEventListener) {
        elementsWithListeners++;
      }
      
      if (hasPointerEvents && isVisible) {
        clickableElements++;
      }
      
      if (!hasPointerEvents || !isVisible) {
        blockedElements++;
      }
      
      if (index < 5) { // Only log first 5 to avoid spam
        elementDetails.push({
          tagName: element.tagName,
          textContent: element.textContent?.substring(0, 20),
          hasClickListener,
          hasPointerEvents,
          isVisible,
          hasTabIndex,
          zIndex: style.zIndex,
          position: style.position
        });
      }
    });
    
    // Check for global click handlers
    const hasGlobalClickHandler = window.onclick !== null;
    const hasDocumentClickHandler = document.onclick !== null;
    
    // Check for navigation safety system
    const navSafetyExists = typeof (window.navigationSafety) !== 'undefined';
    const cleanupFunctionExists = typeof (window.cleanupModalOverlays) !== 'undefined';
    
    const result = logTestResult('Event Listener Analysis', blockedElements === 0, {
      totalNavElements: navElements.length,
      elementsWithListeners,
      clickableElements,
      blockedElements,
      elementDetails,
      hasGlobalClickHandler,
      hasDocumentClickHandler,
      navSafetyExists,
      cleanupFunctionExists,
      hasBlockedElements: blockedElements > 0
    });
    
    testResults.eventListenerTests.push(result);
    return result;
    
  } catch (error) {
    const result = logTestResult('Event Listener Analysis', false, { error: error.message });
    testResults.eventListenerTests.push(result);
    return result;
  }
}

// Test 6: CSS and Z-Index Analysis
async function testCSSAnalysis() {
  console.log('\n🎨 TEST 6: CSS and Z-Index Analysis');
  
  try {
    // Analyze body and document styles
    const bodyStyle = window.getComputedStyle(document.body);
    const documentElement = document.documentElement;
    
    // Check for high z-index elements that might block navigation
    const allElements = document.querySelectorAll('*');
    const highZIndexElements = [];
    const fixedPositionElements = [];
    
    allElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const zIndex = parseInt(style.zIndex) || 0;
      const position = style.position;
      
      if (zIndex > 100) {
        highZIndexElements.push({
          tagName: element.tagName,
          className: element.className,
          zIndex,
          position,
          pointerEvents: style.pointerEvents
        });
      }
      
      if (position === 'fixed') {
        fixedPositionElements.push({
          tagName: element.tagName,
          className: element.className,
          zIndex,
          pointerEvents: style.pointerEvents
        });
      }
    });
    
    // Check sidebar specific styles
    const sidebar = document.querySelector('aside[class*="sidebar"]');
    let sidebarStyles = null;
    if (sidebar) {
      sidebarStyles = {
        zIndex: window.getComputedStyle(sidebar).zIndex,
        position: window.getComputedStyle(sidebar).position,
        pointerEvents: window.getComputedStyle(sidebar).pointerEvents,
        visibility: window.getComputedStyle(sidebar).visibility
      };
    }
    
    const result = logTestResult('CSS and Z-Index Analysis', highZIndexElements.length === 0, {
      bodyStyles: {
        pointerEvents: bodyStyle.pointerEvents,
        overflow: bodyStyle.overflow,
        userSelect: bodyStyle.userSelect,
        position: bodyStyle.position
      },
      highZIndexElementsCount: highZIndexElements.length,
      highZIndexElements: highZIndexElements.slice(0, 5), // First 5 only
      fixedPositionElementsCount: fixedPositionElements.length,
      sidebarExists: !!sidebar,
      sidebarStyles,
      hasProblematicZIndex: highZIndexElements.length > 0
    });
    
    testResults.cssTests.push(result);
    return result;
    
  } catch (error) {
    const result = logTestResult('CSS and Z-Index Analysis', false, { error: error.message });
    testResults.cssTests.push(result);
    return result;
  }
}

// Test 7: Performance and Memory Analysis
async function testPerformanceAnalysis() {
  console.log('\n⚡ TEST 7: Performance and Memory Analysis');
  
  try {
    // Check memory usage if available
    const memoryInfo = performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : null;
    
    // Check performance timing
    const navigation = performance.getEntriesByType('navigation')[0];
    const timingInfo = navigation ? {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    } : null;
    
    // Count DOM elements
    const totalElements = document.querySelectorAll('*').length;
    const deepNestedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      let depth = 0;
      let current = el;
      while (current.parentElement) {
        depth++;
        current = current.parentElement;
        if (depth > 20) return true;
      }
      return false;
    }).length;
    
    // Check for event listener leaks (rough estimate)
    const elementsWithManyListeners = Array.from(document.querySelectorAll('*')).filter(el => {
      // This is a rough check - actual listener counting requires more complex methods
      return el.onclick || el.onmouseover || el.onmouseout || el.addEventListener;
    }).length;
    
    const result = logTestResult('Performance Analysis', true, {
      memoryInfo,
      timingInfo,
      totalElements,
      deepNestedElements,
      elementsWithManyListeners,
      performanceIssues: {
        highMemoryUsage: memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024, // 50MB
        slowLoadTime: timingInfo && timingInfo.totalTime > 5000, // 5 seconds
        tooManyElements: totalElements > 10000,
        deepNesting: deepNestedElements > 1000
      }
    });
    
    testResults.performanceTests.push(result);
    return result;
    
  } catch (error) {
    const result = logTestResult('Performance Analysis', false, { error: error.message });
    testResults.performanceTests.push(result);
    return result;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🎯 STARTING COMPREHENSIVE MENU FREEZING DIAGNOSTIC TESTS');
  console.log('========================================================');
  
  try {
    // Run all tests in sequence
    await testInitialLoad();
    await wait(1000);
    
    await testTradesPageNavigation();
    await wait(1000);
    
    await testNavigationAwayFromTrades();
    await wait(1000);
    
    await testOverlayDetection();
    await wait(1000);
    
    await testEventListenerAnalysis();
    await wait(1000);
    
    await testCSSAnalysis();
    await wait(1000);
    
    await testPerformanceAnalysis();
    
    // Generate final report
    generateFinalReport();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Generate final diagnostic report
function generateFinalReport() {
  console.log('\n📊 FINAL DIAGNOSTIC REPORT');
  console.log('=============================');
  
  const allTests = [
    ...testResults.navigationTests,
    ...testResults.overlayTests,
    ...testResults.eventListenerTests,
    ...testResults.cssTests,
    ...testResults.performanceTests
  ];
  
  const failedTests = allTests.filter(test => !test.success);
  const passedTests = allTests.filter(test => test.success);
  
  console.log(`✅ Passed Tests: ${passedTests.length}`);
  console.log(`❌ Failed Tests: ${failedTests.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    failedTests.forEach(test => {
      console.log(`\n❌ ${test.testName}:`);
      console.log(`   Error: ${test.error || 'Unknown error'}`);
      if (test.navigationBlocked) console.log(`   ⚠️ Navigation appears to be blocked`);
      if (test.hasBlockingElements) console.log(`   ⚠️ Blocking elements detected`);
      if (test.hasBlockedElements) console.log(`   ⚠️ Blocked navigation elements found`);
    });
  }
  
  // Identify most likely root causes
  console.log('\n🔍 MOST LIKELY ROOT CAUSES:');
  
  const blockingOverlays = testResults.overlayTests.some(test => test.hasBlockingElements);
  const blockedElements = testResults.eventListenerTests.some(test => test.hasBlockedElements);
  const highZIndex = testResults.cssTests.some(test => test.hasProblematicZIndex);
  const navigationIssues = testResults.navigationTests.some(test => test.navigationBlocked);
  
  if (blockingOverlays) {
    console.log('1. 🎭 OVERLAYS/MODALS: Blocking overlays detected');
  }
  
  if (blockedElements) {
    console.log('2. 👂 EVENT LISTENERS: Navigation elements have blocked events');
  }
  
  if (highZIndex) {
    console.log('3. 🎨 CSS Z-INDEX: High z-index elements interfering with navigation');
  }
  
  if (navigationIssues) {
    console.log('4. 🧭 NAVIGATION: Direct navigation failures detected');
  }
  
  // Export results for further analysis
  const reportData = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      totalTests: allTests.length,
      passed: passedTests.length,
      failed: failedTests.length,
      likelyCauses: {
        blockingOverlays,
        blockedElements,
        highZIndex,
        navigationIssues
      }
    }
  };
  
  // Save to localStorage for debugging
  localStorage.setItem('menu-freezing-diagnostic-report', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Full report saved to localStorage under "menu-freezing-diagnostic-report"');
  
  return reportData;
}

// Auto-run tests if this script is loaded in browser
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAllTests, 2000);
    });
  } else {
    setTimeout(runAllTests, 2000);
  }
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults, generateFinalReport };
}