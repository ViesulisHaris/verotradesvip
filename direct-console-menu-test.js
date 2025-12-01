/**
 * Direct Console Menu Test Script
 * 
 * Copy and paste this entire script into the browser console on http://localhost:3000
 * This will manually test the menu freezing issue by simulating real user interactions
 */

console.log('🔍 Starting Direct Console Menu Test...');

// Global test state
const MenuTestState = {
  testResults: [],
  consoleErrors: [],
  overlayDetections: [],
  menuInteractions: [],
  startTime: Date.now(),
  isTestRunning: false
};

// Setup console error tracking
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

console.error = (...args) => {
  MenuTestState.consoleErrors.push({
    type: 'error',
    message: args.join(' '),
    timestamp: Date.now(),
    url: window.location.href
  });
  originalError.apply(console, args);
};

console.warn = (...args) => {
  MenuTestState.consoleErrors.push({
    type: 'warn',
    message: args.join(' '),
    timestamp: Date.now(),
    url: window.location.href
  });
  originalWarn.apply(console, args);
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  originalLog(logMessage);
  MenuTestState.testResults.push({
    message: logMessage,
    type,
    timestamp: Date.now()
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getElementInfo(element) {
  if (!element) return null;
  
  const computedStyle = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return {
    tagName: element.tagName,
    className: element.className,
    id: element.id,
    href: element.href,
    textContent: element.textContent?.trim(),
    visible: rect.width > 0 && rect.height > 0,
    pointerEvents: computedStyle.pointerEvents,
    zIndex: computedStyle.zIndex,
    position: computedStyle.position,
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    disabled: element.disabled,
    ariaDisabled: element.getAttribute('aria-disabled'),
    rect: {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    }
  };
}

// Check for blocking overlays
function checkBlockingOverlays() {
  log('🚫 Checking for blocking overlays...');
  
  const blockingOverlays = [];
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    // Check if element could be blocking navigation
    if (computedStyle.position === 'fixed' && 
        parseInt(computedStyle.zIndex) > 5 &&
        rect.width > window.innerWidth * 0.5 &&
        rect.height > window.innerHeight * 0.5) {
      
      blockingOverlays.push({
        element: element.tagName,
        className: element.className,
        id: element.id,
        zIndex: computedStyle.zIndex,
        pointerEvents: computedStyle.pointerEvents,
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        coversScreen: rect.width > window.innerWidth * 0.9 && 
                     rect.height > window.innerHeight * 0.9
      });
    }
  });
  
  MenuTestState.overlayDetections.push({
    timestamp: Date.now(),
    url: window.location.href,
    overlays: blockingOverlays,
    totalOverlays: blockingOverlays.length
  });
  
  log(`Found ${blockingOverlays.length} potential blocking overlays`);
  blockingOverlays.forEach((overlay, index) => {
    log(`  ${index + 1}. ${overlay.element} (${overlay.className})`);
    log(`     Z-Index: ${overlay.zIndex}, Covers Screen: ${overlay.coversScreen}`);
  });
  
  return blockingOverlays;
}

// Test menu elements
function testMenuElements() {
  log('🔘 Testing menu elements...');
  
  const menuSelectors = [
    'nav a',
    '.nav-item-luxury',
    '.nav-link',
    'button[onclick*="navigate"]',
    '.mobile-menu-button',
    '.sidebar-toggle'
  ];
  
  const menuElements = [];
  
  menuSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const info = getElementInfo(element);
      if (info) {
        info.selector = selector;
        menuElements.push(info);
      }
    });
  });
  
  log(`Found ${menuElements.length} menu elements:`);
  menuElements.forEach((element, index) => {
    log(`  ${index + 1}. ${element.tagName} (${element.selector})`);
    log(`     Text: "${element.textContent}"`);
    log(`     Visible: ${element.visible}, Pointer Events: ${element.pointerEvents}`);
    log(`     Z-Index: ${element.zIndex}, Position: ${element.position}`);
    
    if (!element.visible || element.pointerEvents === 'none') {
      log(`     ⚠️ POTENTIAL ISSUE: Element may not be clickable`);
    }
  });
  
  return menuElements;
}

// Simulate manual click on menu element
async function simulateMenuClick(element, description) {
  log(`🖱️  Simulating click: ${description}`);
  
  const elementInfo = getElementInfo(element);
  
  MenuTestState.menuInteractions.push({
    timestamp: Date.now(),
    description,
    elementInfo,
    url: window.location.href
  });
  
  if (!element) {
    log(`❌ Element not found: ${description}`);
    return false;
  }
  
  if (!elementInfo.visible) {
    log(`❌ Element not visible: ${description}`);
    return false;
  }
  
  if (elementInfo.pointerEvents === 'none') {
    log(`❌ Element has pointer-events: none: ${description}`);
    return false;
  }
  
  try {
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(500);
    
    // Highlight the element
    const originalBackground = element.style.backgroundColor;
    element.style.backgroundColor = 'yellow';
    element.style.border = '2px solid red';
    
    await delay(1000);
    
    // Simulate click
    element.click();
    
    // Restore original style
    element.style.backgroundColor = originalBackground;
    element.style.border = '';
    
    log(`✅ Clicked: ${description}`);
    return true;
    
  } catch (error) {
    log(`❌ Failed to click ${description}: ${error.message}`);
    return false;
  }
}

// Test the specific Trades navigation issue
async function testTradesNavigationIssue() {
  log('🎯 Testing Trades navigation issue...');
  
  try {
    // Step 1: Find and click Trades link
    const tradesLink = document.querySelector('a[href="/trades"], .nav-link[href*="trades"]');
    
    if (tradesLink) {
      const success = await simulateMenuClick(tradesLink, 'Trades navigation link');
      
      if (success) {
        // Wait for navigation
        await delay(3000);
        
        log(`📍 Current URL after Trades navigation: ${window.location.href}`);
        
        // Step 2: Try to click other menu items from Trades page
        log('🔘 Testing other menu items from Trades page...');
        
        const otherLinks = [
          { selector: 'a[href="/dashboard"], .nav-link[href*="dashboard"]', name: 'Dashboard' },
          { selector: 'a[href="/strategies"], .nav-link[href*="strategies"]', name: 'Strategies' },
          { selector: 'a[href="/analytics"], .nav-link[href*="analytics"]', name: 'Analytics' }
        ];
        
        for (const link of otherLinks) {
          const element = document.querySelector(link.selector);
          if (element) {
            const info = getElementInfo(element);
            log(`🔍 Testing ${link.name} link:`, info);
            
            if (info.visible && info.pointerEvents !== 'none') {
              const clickSuccess = await simulateMenuClick(element, `${link.name} link from Trades page`);
              
              if (clickSuccess) {
                await delay(2000);
                log(`📍 Current URL after ${link.name} navigation: ${window.location.href}`);
                
                // Navigate back to Trades
                const tradesLinkAgain = document.querySelector('a[href="/trades"], .nav-link[href*="trades"]');
                if (tradesLinkAgain) {
                  await simulateMenuClick(tradesLinkAgain, `Back to Trades from ${link.name}`);
                  await delay(2000);
                }
              }
            } else {
              log(`⚠️ ${link.name} link is not clickable: visible=${info.visible}, pointerEvents=${info.pointerEvents}`);
            }
          } else {
            log(`❌ ${link.name} link not found`);
          }
        }
      }
    } else {
      log('❌ Trades navigation link not found');
    }
    
  } catch (error) {
    log(`❌ Trades navigation test failed: ${error.message}`);
  }
}

// Test multiple navigation cycles
async function testNavigationCycles() {
  log('🔄 Testing navigation cycles...');
  
  const navigationSequence = [
    { page: 'Trades', selector: 'a[href="/trades"], .nav-link[href*="trades"]' },
    { page: 'Dashboard', selector: 'a[href="/dashboard"], .nav-link[href*="dashboard"]' },
    { page: 'Trades', selector: 'a[href="/trades"], .nav-link[href*="trades"]' },
    { page: 'Strategies', selector: 'a[href="/strategies"], .nav-link[href*="strategies"]' },
    { page: 'Trades', selector: 'a[href="/trades"], .nav-link[href*="trades"]' }
  ];
  
  for (let i = 0; i < navigationSequence.length; i++) {
    const step = navigationSequence[i];
    log(`📍 Step ${i + 1}: Navigate to ${step.page}`);
    
    const element = document.querySelector(step.selector);
    if (element) {
      const success = await simulateMenuClick(element, `Navigate to ${step.page} (Step ${i + 1})`);
      
      if (success) {
        await delay(2000);
        log(`✅ Successfully navigated to ${step.page}`);
        log(`📍 Current URL: ${window.location.href}`);
        
        // Check for overlays after navigation
        checkBlockingOverlays();
        
      } else {
        log(`❌ Failed to navigate to ${step.page}`);
      }
    } else {
      log(`❌ ${step.page} navigation element not found`);
    }
  }
}

// Test viewport responsiveness
async function testViewportResponsiveness() {
  log('📱 Testing viewport responsiveness...');
  
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    log(`🖥️  Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})...`);
    
    // Resize viewport (this is limited in browser console, but we can test responsive behavior)
    try {
      // Test menu elements in current viewport
      const menuElements = testMenuElements();
      checkBlockingOverlays();
      
      // Check if mobile menu is visible
      const mobileMenu = document.querySelector('.mobile-menu-button, .sidebar-toggle');
      if (mobileMenu) {
        const mobileMenuInfo = getElementInfo(mobileMenu);
        log(`📱 Mobile menu button: visible=${mobileMenuInfo.visible}, clickable=${mobileMenuInfo.visible && mobileMenuInfo.pointerEvents !== 'none'}`);
      }
      
    } catch (error) {
      log(`❌ Viewport test failed: ${error.message}`);
    }
  }
}

// Generate final report
function generateReport() {
  log('📊 Generating final report...');
  
  const report = {
    summary: {
      totalTests: MenuTestState.testResults.length,
      totalErrors: MenuTestState.consoleErrors.length,
      totalOverlayDetections: MenuTestState.overlayDetections.length,
      totalMenuInteractions: MenuTestState.menuInteractions.length,
      testDuration: Date.now() - MenuTestState.startTime
    },
    testResults: MenuTestState.testResults,
    consoleErrors: MenuTestState.consoleErrors,
    overlayDetections: MenuTestState.overlayDetections,
    menuInteractions: MenuTestState.menuInteractions,
    recommendations: generateRecommendations()
  };
  
  console.log('📋 MENU FREEZING DIAGNOSIS REPORT:', report);
  
  // Save to localStorage for later retrieval
  localStorage.setItem('menuFreezingTestReport', JSON.stringify(report, null, 2));
  
  return report;
}

function generateRecommendations() {
  const recommendations = [];
  
  // Analyze console errors
  const recentErrors = MenuTestState.consoleErrors.filter(e => 
    Date.now() - e.timestamp < 30000
  );
  if (recentErrors.length > 0) {
    recommendations.push({
      type: 'javascript',
      priority: 'high',
      issue: `${recentErrors.length} console errors detected`,
      details: recentErrors.map(e => e.message),
      suggestion: 'Fix JavaScript errors that may be interfering with navigation'
    });
  }
  
  // Analyze overlays
  const blockingOverlays = MenuTestState.overlayDetections
    .filter(d => d.overlays.length > 0);
  
  if (blockingOverlays.length > 0) {
    recommendations.push({
      type: 'overlay',
      priority: 'high',
      issue: `${blockingOverlays.length} instances of blocking overlays detected`,
      details: blockingOverlays.flatMap(d => d.overlays),
      suggestion: 'Remove or reposition overlays that block navigation'
    });
  }
  
  // Analyze menu interactions
  const failedInteractions = MenuTestState.menuInteractions.filter(i => 
    !i.elementInfo || !i.elementInfo.visible || i.elementInfo.pointerEvents === 'none'
  );
  
  if (failedInteractions.length > 0) {
    recommendations.push({
      type: 'css',
      priority: 'high',
      issue: `${failedInteractions.length} failed menu interactions detected`,
      details: failedInteractions,
      suggestion: 'Fix CSS properties that prevent menu interactions'
    });
  }
  
  return recommendations;
}

// Main test function
async function runCompleteMenuTest() {
  if (MenuTestState.isTestRunning) {
    log('⚠️ Test is already running...');
    return;
  }
  
  MenuTestState.isTestRunning = true;
  log('🚀 Starting complete menu freezing test...');
  
  try {
    // Initial state
    log(`📍 Starting URL: ${window.location.href}`);
    
    // Test 1: Check overlays
    checkBlockingOverlays();
    await delay(1000);
    
    // Test 2: Test menu elements
    testMenuElements();
    await delay(1000);
    
    // Test 3: Test Trades navigation issue
    await testTradesNavigationIssue();
    await delay(2000);
    
    // Test 4: Test navigation cycles
    await testNavigationCycles();
    await delay(2000);
    
    // Test 5: Test viewport responsiveness
    await testViewportResponsiveness();
    
    // Generate report
    const report = generateReport();
    
    log('✅ Complete menu freezing test finished!');
    log(`📊 Summary: ${report.summary.totalTests} tests, ${report.summary.totalErrors} errors, ${report.summary.totalOverlayDetections} overlay detections`);
    log(`💡 Recommendations: ${report.recommendations.length} issues found`);
    
    return report;
    
  } catch (error) {
    log(`❌ Complete test failed: ${error.message}`);
    return null;
  } finally {
    MenuTestState.isTestRunning = false;
  }
}

// Auto-run the test
log('🔍 Direct Console Menu Test loaded');
log('💡 Run runCompleteMenuTest() to start the full test suite');
log('💡 Or run individual tests: testMenuElements(), checkBlockingOverlays(), testTradesNavigationIssue()');

// Auto-start the test after 2 seconds
setTimeout(() => {
  log('🚀 Auto-starting complete menu test...');
  runCompleteMenuTest();
}, 2000);