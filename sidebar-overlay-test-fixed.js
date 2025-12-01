/**
 * SIDEBAR OVERLAY COMPREHENSIVE TEST - FIXED VERSION
 * 
 * This test thoroughly verifies that the redesigned sidebar functions properly as an overlay
 * without interfering with other page elements.
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testPages: ['/dashboard', '/trades', '/strategies'],
  viewports: [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ],
  screenshotsDir: './sidebar-test-screenshots',
  timeout: 8000
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      display: styles.display,
      opacity: styles.opacity
    };
  }, selector);
}

/**
 * Core test functions
 */
async function testSidebarExists(page, viewport) {
  log(`\n🧪 Testing sidebar existence for ${viewport.name}...`);
  
  // Wait for page to load
  await sleep(3000);
  
  // Check if sidebar exists
  const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
  const sidebarExists = sidebarInfo && sidebarInfo.exists;
  
  addTestResult(
    `Sidebar element exists (${viewport.name})`,
    sidebarExists,
    sidebarExists ? 'Sidebar element found in DOM' : 'Sidebar element not found'
  );
  
  return sidebarExists;
}

async function testSidebarInitialState(page, viewport) {
  log(`\n🧪 Testing initial sidebar state for ${viewport.name}...`);
  
  const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
  if (!sidebarInfo) return false;
  
  // Check if sidebar is initially hidden
  const isInitiallyHidden = sidebarInfo.transform.includes('translateX(-100%)') || 
                          sidebarInfo.translateX < -100;
  
  addTestResult(
    `Sidebar initially hidden (${viewport.name})`,
    isInitiallyHidden,
    `Transform: ${sidebarInfo.transform}, Position: ${sidebarInfo.translateX}px`
  );
  
  return isInitiallyHidden;
}

async function testSidebarToggle(page, viewport) {
  log(`\n🧪 Testing sidebar toggle functionality for ${viewport.name}...`);
  
  // Find toggle button
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"]';
  
  const toggleExists = await page.$(toggleSelector);
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
    `Found toggle button`
  );
  
  // Get content position before opening
  const contentBefore = await getElementInfo(page, '.verotrade-main-content');
  
  // Click to open sidebar
  await page.click(toggleSelector);
  await sleep(500); // Wait for animation
  
  // Check if sidebar is now visible
  const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
  const isNowVisible = sidebarInfo && (
    sidebarInfo.transform.includes('translateX(0)') || 
    sidebarInfo.translateX >= -50
  );
  
  addTestResult(
    `Sidebar opens when toggle clicked (${viewport.name})`,
    isNowVisible,
    `Transform: ${sidebarInfo.transform}, Position: ${sidebarInfo.translateX}px`
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
    `Overlay opacity: ${overlayInfo?.opacity}, Visibility: ${overlayInfo?.visible}`
  );
  
  // Get content position after opening sidebar
  const contentAfter = await getElementInfo(page, '.verotrade-main-content');
  
  // Check for content shifting
  const contentShifted = contentBefore && contentAfter && 
                        Math.abs(contentAfter.translateX - contentBefore.translateX) > 5;
  
  addTestResult(
    `Main content doesn't shift when sidebar opens (${viewport.name})`,
    !contentShifted,
    `Content X position: ${contentBefore?.translateX}px → ${contentAfter?.translateX}px`
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
  
  // Test closing
  await sleep(500);
  
  // Click overlay to close
  if (viewport.name === 'Mobile') {
    await page.click('.verotrade-mobile-overlay.active');
  } else {
    await page.click('.verotrade-desktop-overlay');
  }
  
  await sleep(500);
  
  // Check if sidebar is now hidden
  const sidebarInfoAfter = await getElementInfo(page, '.verotrade-sidebar-overlay');
  const isNowHidden = sidebarInfoAfter && (
    sidebarInfoAfter.transform.includes('translateX(-100%)') || 
    sidebarInfoAfter.translateX < -100
  );
  
  addTestResult(
    `Sidebar closes when overlay clicked (${viewport.name})`,
    isNowHidden,
    `Transform: ${sidebarInfoAfter.transform}, Position: ${sidebarInfoAfter.translateX}px`
  );
  
  await takeScreenshot(page, `sidebar-closed-${viewport.name.toLowerCase()}.png`, 
    `Sidebar closed state on ${viewport.name}`);
  
  return isNowVisible && isNowHidden;
}

async function testMultipleToggles(page, viewport) {
  log(`\n🧪 Testing multiple toggle operations for ${viewport.name}...`);
  
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"]';
  
  let allTogglesWorked = true;
  
  // Perform 3 rapid toggles
  for (let i = 0; i < 3; i++) {
    await page.click(toggleSelector);
    await sleep(300);
    
    const sidebarInfo = await getElementInfo(page, '.verotrade-sidebar-overlay');
    const isOpen = sidebarInfo && (
      sidebarInfo.transform.includes('translateX(0)') || 
      sidebarInfo.translateX >= -50
    );
    
    const expectedState = i % 2 === 0 ? 'open' : 'closed';
    const toggleWorked = (expectedState === 'open' && isOpen) || 
                       (expectedState === 'closed' && !isOpen);
    
    if (!toggleWorked) {
      allTogglesWorked = false;
    }
    
    addTestResult(
      `Toggle ${i + 1} works correctly (${viewport.name})`,
      toggleWorked,
      `Expected: ${expectedState}, Got: ${isOpen ? 'open' : 'closed'}`
    );
  }
  
  addTestResult(
    `Multiple toggles work reliably (${viewport.name})`,
    allTogglesWorked,
    'All 3 toggles performed correctly'
  );
  
  return allTogglesWorked;
}

async function testNavigationInteraction(page, viewport) {
  log(`\n🧪 Testing navigation interaction for ${viewport.name}...`);
  
  // Open sidebar
  const toggleSelector = viewport.name === 'Mobile' 
    ? '.verotrade-mobile-menu-btn'
    : 'button[aria-label*="sidebar"]';
  
  await page.click(toggleSelector);
  await sleep(500);
  
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
  await sleep(1000); // Wait for navigation
  
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
      'Mobile sidebar should auto-close after navigation'
    );
  }
  
  addTestResult(
    `Navigation link is clickable (${viewport.name})`,
    true,
    `Successfully clicked: ${linkText}`
  );
  
  return true;
}

/**
 * Main test execution
 */
async function runComprehensiveSidebarTest() {
  log('🚀 Starting comprehensive sidebar overlay test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
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
        
        await sleep(2000); // Allow page to fully load
        
        // Run all tests
        await testSidebarExists(page, viewport);
        await testSidebarInitialState(page, viewport);
        await testSidebarToggle(page, viewport);
        await testMultipleToggles(page, viewport);
        await testNavigationInteraction(page, viewport);
      }
    }
    
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
      successRate: testResults.totalTests > 0 ? ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) + '%' : '0%'
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