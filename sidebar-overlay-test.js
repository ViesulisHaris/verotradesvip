/**
 * SIDEBAR OVERLAY COMPREHENSIVE TEST
 * 
 * This test thoroughly verifies that the redesigned sidebar functions properly as an overlay
 * without interfering with other page elements.
 * 
 * Test Coverage:
 * 1. Sidebar open functionality from closed state
 * 2. Sidebar close functionality from open state  
 * 3. Non-interference with other page elements
 * 4. Layout stability (no content shifting)
 * 5. Z-index behavior (sidebar above content)
 * 6. Responsive behavior across screen sizes
 * 7. Multiple toggle operations
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testPages: [
    '/dashboard',
    '/trades', 
    '/strategies',
    '/calendar'
  ],
  viewports: [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ],
  screenshotsDir: './sidebar-test-screenshots',
  timeout: 10000
};

// Test results tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  details: []
};

/**
 * Utility functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, details = '') {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
    log(`✅ PASSED: ${testName} - ${details}`, 'success');
  } else {
    testResults.failedTests++;
    log(`❌ FAILED: ${testName} - ${details}`, 'error');
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

async function takeScreenshot(page, filename, description = '') {
  try {
    const screenshotPath = path.join(TEST_CONFIG.screenshotsDir, filename);
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      type: 'png'
    });
    log(`📸 Screenshot saved: ${filename} - ${description}`);
    return screenshotPath;
  } catch (error) {
    log(`❌ Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function waitForElement(page, selector, timeout = TEST_CONFIG.timeout) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    return true;
  } catch (error) {
    return false;
  }
}

async function getElementInfo(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    return {
      exists: true,
      visible: styles.visibility !== 'hidden' && styles.opacity !== '0',
      position: styles.position,
      zIndex: styles.zIndex,
      transform: styles.transform,
      translateX: rect.left,
      translateY: rect.top,
      width: rect.width,
      height: rect.height,
      display: styles.display
    };
  }, selector);
}

/**
 * Core test functions
 */
async function testSidebarInitialState(page, viewport) {
  log(`\n🧪 Testing initial sidebar state for ${viewport.name}...`);
  
  // Check if sidebar exists
  const sidebarExists = await waitForElement(page, '.verotrade-sidebar-overlay');
  addTestResult(
    `Sidebar element exists (${viewport.name})`,
    sidebarExists,
    sidebarExists ? 'Sidebar element found in DOM' : 'Sidebar element not found'
  );
  
  if (!sidebarExists) return false;
  
  // Get initial sidebar state
  const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
  const isInitiallyHidden = sidebarInfo && (
    sidebarInfo.transform.includes('translateX(-100%)') || 
    sidebarInfo.translateX < -100
  );
  
  addTestResult(
    `Sidebar initially hidden (${viewport.name})`,
    isInitiallyHidden,
    `Transform: ${sidebarInfo?.transform}, Position: ${sidebarInfo?.translateX}px`
  );
  
  return sidebarExists;
}

async function testSidebarOpenFunctionality(page, viewport) {
  log(`\n🧪 Testing sidebar OPEN functionality for ${viewport.name}...`);
  
  // Find and click the sidebar toggle button
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"], button[aria-label*="Open sidebar"]';
  
  const toggleExists = await waitForElement(page, toggleSelector);
  if (!toggleExists) {
    addTestResult(
      `Sidebar toggle button exists (${viewport.name})`,
      false,
      `Selector: ${toggleSelector}`
    );
    return false;
  }
  
  addTestResult(
    `Sidebar toggle button exists (${viewport.name})`,
    true,
    `Found toggle button: ${toggleSelector}`
  );
  
  // Get content position before opening sidebar
  const contentBefore = await getElementInfo(page, '.verotrade-main-content');
  
  // Click to open sidebar
  await page.click(toggleSelector);
  await page.waitForTimeout(500); // Wait for animation
  
  // Check if sidebar is now visible
  const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
  const isNowVisible = sidebarInfo && (
    sidebarInfo.transform.includes('translateX(0)') || 
    sidebarInfo.translateX >= -50
  );
  
  addTestResult(
    `Sidebar opens when toggle clicked (${viewport.name})`,
    isNowVisible,
    `Transform: ${sidebarInfo?.transform}, Position: ${sidebarInfo?.translateX}px`
  );
  
  // Check if overlay is visible
  const overlaySelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-overlay.active'
    : '.verotrade-desktop-overlay';
  
  const overlayInfo = await getElementInfo(page, overlaySelector);
  const overlayVisible = overlayInfo && overlayInfo.visible;
  
  addTestResult(
    `Overlay appears when sidebar opens (${viewport.name})`,
    overlayVisible,
    `Overlay opacity: ${overlayInfo?.opacity}, Visibility: ${overlayInfo?.visibility}`
  );
  
  // Get content position after opening sidebar
  const contentAfter = await getElementInfo(page, '.verotrade-main-content');
  
  // Check for content shifting
  const contentShifted = Math.abs(contentAfter.translateX - contentBefore.translateX) > 5;
  addTestResult(
    `Main content doesn't shift when sidebar opens (${viewport.name})`,
    !contentShifted,
    `Content X position: ${contentBefore.translateX}px → ${contentAfter.translateX}px`
  );
  
  // Check z-index hierarchy
  const sidebarZIndex = parseInt(sidebarInfo?.zIndex) || 0;
  const overlayZIndex = parseInt(overlayInfo?.zIndex) || 0;
  const contentZIndex = parseInt(contentAfter?.zIndex) || 0;
  
  const correctZIndex = sidebarZIndex > overlayZIndex && overlayZIndex > contentZIndex;
  addTestResult(
    `Correct z-index hierarchy (${viewport.name})`,
    correctZIndex,
    `Sidebar: ${sidebarZIndex}, Overlay: ${overlayZIndex}, Content: ${contentZIndex}`
  );
  
  await takeScreenshot(page, `sidebar-open-${viewport.name.toLowerCase()}.png`, 
    `Sidebar open state on ${viewport.name}`);
  
  return isNowVisible;
}

async function testSidebarCloseFunctionality(page, viewport) {
  log(`\n🧪 Testing sidebar CLOSE functionality for ${viewport.name}...`);
  
  // First ensure sidebar is open
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"]';
  
  await page.click(toggleSelector);
  await page.waitForTimeout(500);
  
  // Get content position before closing
  const contentBefore = await getElementInfo(page, '.verotrade-main-content');
  
  // Test close methods
  let closeMethod = '';
  
  if (viewport.name === 'Mobile') {
    // Test overlay click on mobile
    closeMethod = 'overlay click';
    await page.click('.verotrade-mobile-overlay.active');
  } else {
    // Test overlay click on desktop
    closeMethod = 'overlay click';
    await page.click('.verotrade-desktop-overlay');
  }
  
  await page.waitForTimeout(500);
  
  // Check if sidebar is now hidden
  const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
  const isNowHidden = sidebarInfo && (
    sidebarInfo.transform.includes('translateX(-100%)') || 
    sidebarInfo.translateX < -100
  );
  
  addTestResult(
    `Sidebar closes when ${closeMethod} (${viewport.name})`,
    isNowHidden,
    `Transform: ${sidebarInfo?.transform}, Position: ${sidebarInfo?.translateX}px`
  );
  
  // Get content position after closing
  const contentAfter = await getElementInfo(page, '.verotrade-main-content');
  
  // Check for content shifting
  const contentShifted = Math.abs(contentAfter.translateX - contentBefore.translateX) > 5;
  addTestResult(
    `Main content doesn't shift when sidebar closes (${viewport.name})`,
    !contentShifted,
    `Content X position: ${contentBefore.translateX}px → ${contentAfter.translateX}px`
  );
  
  // Test close with X button (if available)
  const closeButton = await page.$('button[aria-label*="Close sidebar"], button:has(svg)');
  if (closeButton) {
    await page.click(toggleSelector); // Reopen
    await page.waitForTimeout(500);
    
    const contentBeforeX = await getElementInfo(page, '.verotrade-main-content');
    await closeButton.click();
    await page.waitForTimeout(500);
    
    const sidebarAfterX = await getElementInfo(page, '.verotrade-sidebar-overlay');
    const closedWithX = sidebarAfterX && (
      sidebarAfterX.transform.includes('translateX(-100%)') || 
      sidebarAfterX.translateX < -100
    );
    
    addTestResult(
      `Sidebar closes with X button (${viewport.name})`,
      closedWithX,
      `X button close functionality`
    );
  }
  
  await takeScreenshot(page, `sidebar-closed-${viewport.name.toLowerCase()}.png`, 
    `Sidebar closed state on ${viewport.name}`);
  
  return isNowHidden;
}

async function testMultipleToggles(page, viewport) {
  log(`\n🧪 Testing multiple toggle operations for ${viewport.name}...`);
  
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"]';
  
  let allTogglesWorked = true;
  let previousState = 'closed';
  
  // Perform 5 rapid toggles
  for (let i = 0; i < 5; i++) {
    await page.click(toggleSelector);
    await page.waitForTimeout(300);
    
    const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
    const currentState = sidebarInfo && (
      sidebarInfo.transform.includes('translateX(0)') || 
      sidebarInfo.translateX >= -50
    ) ? 'open' : 'closed';
    
    const expectedState = previousState === 'closed' ? 'open' : 'closed';
    const toggleWorked = currentState === expectedState;
    
    if (!toggleWorked) {
      allTogglesWorked = false;
    }
    
    addTestResult(
      `Toggle ${i + 1} works correctly (${viewport.name})`,
      toggleWorked,
      `Expected: ${expectedState}, Got: ${currentState}`
    );
    
    previousState = currentState;
  }
  
  addTestResult(
    `Multiple toggles work reliably (${viewport.name})`,
    allTogglesWorked,
    'All 5 toggles performed correctly'
  );
  
  return allTogglesWorked;
}

async function testNavigationInteraction(page, viewport) {
  log(`\n🧪 Testing navigation interaction with sidebar for ${viewport.name}...`);
  
  // Open sidebar
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"]';
  
  await page.click(toggleSelector);
  await page.waitForTimeout(500);
  
  // Find navigation links
  const navLinks = await page.$$('.verotrade-nav-item');
  
  if (navLinks.length === 0) {
    addTestResult(
      `Navigation links exist in sidebar (${viewport.name})`,
      false,
      'No navigation links found'
    );
    return false;
  }
  
  addTestResult(
    `Navigation links exist in sidebar (${viewport.name})`,
    true,
    `Found ${navLinks.length} navigation links`
  );
  
  // Test clicking a navigation link
  const firstLink = navLinks[0];
  const linkText = await page.evaluate(el => el.textContent.trim(), firstLink);
  
  await firstLink.click();
  await page.waitForTimeout(1000); // Wait for navigation
  
  // On mobile, sidebar should close after navigation
  if (viewport.name === 'Mobile') {
    const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
    const sidebarClosed = sidebarInfo && (
      sidebarInfo.transform.includes('translateX(-100%)') || 
      sidebarInfo.translateX < -100
    );
    
    addTestResult(
      `Sidebar closes after navigation on mobile (${viewport.name})`,
      sidebarClosed,
      `Mobile sidebar should auto-close after navigation`
    );
  }
  
  addTestResult(
    `Navigation link is clickable (${viewport.name})`,
    true,
    `Successfully clicked: ${linkText}`
  );
  
  return true;
}

async function testResponsiveBehavior(page) {
  log(`\n🧪 Testing responsive behavior across viewports...`);
  
  // Test mobile viewport
  await page.setViewport(TEST_CONFIG.viewports[0]);
  await page.reload();
  await page.waitForTimeout(1000);
  
  const mobileMenuBtn = await waitForElement(page, '.verotrade-mobile-menu-btn');
  addTestResult(
    'Mobile menu button appears on mobile',
    mobileMenuBtn,
    'Mobile-specific toggle button visible'
  );
  
  // Test desktop viewport
  await page.setViewport(TEST_CONFIG.viewports[2]);
  await page.reload();
  await page.waitForTimeout(1000);
  
  const desktopSidebar = await waitForElement(page, '.verotrade-sidebar-overlay');
  addTestResult(
    'Desktop sidebar loads properly',
    desktopSidebar,
    'Desktop sidebar functionality available'
  );
  
  return mobileMenuBtn && desktopSidebar;
}

/**
 * Main test execution
 */
async function runComprehensiveSidebarTest() {
  log('🚀 Starting comprehensive sidebar overlay test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  try {
    const page = await browser.newPage();
    
    // Create screenshots directory
    const fs = require('fs');
    if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
    }
    
    // Test on each page
    for (const testPage of TEST_CONFIG.testPages) {
      log(`\n📄 Testing page: ${testPage}`);
      
      // Test on each viewport
      for (const viewport of TEST_CONFIG.viewports) {
        await page.setViewport(viewport);
        await page.goto(`${TEST_CONFIG.baseUrl}${testPage}`, { 
          waitUntil: 'networkidle2',
          timeout: TEST_CONFIG.timeout 
        });
        
        await page.waitForTimeout(2000); // Allow page to fully load
        
        // Run all tests
        await testSidebarInitialState(page, viewport);
        await testSidebarOpenFunctionality(page, viewport);
        await testSidebarCloseFunctionality(page, viewport);
        await testMultipleToggles(page, viewport);
        await testNavigationInteraction(page, viewport);
      }
    }
    
    // Test responsive behavior
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    });
    await testResponsiveBehavior(page);
    
    await browser.close();
    
  } catch (error) {
    log(`❌ Test execution error: ${error.message}`, 'error');
    await browser.close();
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  const report = {
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) + '%'
    },
    details: testResults.details,
    timestamp: new Date().toISOString(),
    testConfiguration: TEST_CONFIG
  };
  
  const reportPath = './SIDEBAR_OVERLAY_TEST_REPORT.json';
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📊 Test Report Generated: ${reportPath}`);
  log(`📈 Summary: ${testResults.passedTests}/${testResults.totalTests} tests passed (${report.summary.successRate})`);
  
  if (testResults.failedTests > 0) {
    log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => log(`   - ${test.test}: ${test.details}`, 'error'));
  }
  
  return report;
}

/**
 * Run tests if called directly
 */
if (require.main === module) {
  runComprehensiveSidebarTest()
    .then(() => generateTestReport())
    .catch(error => {
      log(`❌ Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveSidebarTest,
  generateTestReport,
  testResults
};