/**
 * Comprehensive Verification Test for Trades Tab Navigation Freeze Issue
 * 
 * This script performs thorough testing to validate that all implemented fixes
 * have completely resolved the navigation freeze issue on the Trades page.
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './navigation-verification-screenshots',
  reportFile: './TRADES_NAVIGATION_FREEZE_VERIFICATION_REPORT.json'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  categories: {
    navigationFlow: { passed: 0, failed: 0, tests: [] },
    debugPanel: { passed: 0, failed: 0, tests: [] },
    modalCleanup: { passed: 0, failed: 0, tests: [] },
    edgeCases: { passed: 0, failed: 0, tests: [] },
    performance: { passed: 0, failed: 0, tests: [] }
  },
  details: []
};

/**
 * Helper function to log test results
 */
function logTest(category, testName, passed, details = '') {
  const result = {
    category,
    testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  testResults.categories[category].tests.push(result);
  
  if (passed) {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
    console.log(`✅ [${category}] ${testName}`);
  } else {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
    console.log(`❌ [${category}] ${testName}: ${details}`);
  }
  
  testResults.summary.totalTests++;
}

/**
 * Helper function to take screenshots
 */
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

/**
 * Test 1: Navigation Flow Testing
 */
async function testNavigationFlow(browser) {
  console.log('\n🧭 Testing Navigation Flow...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Login first
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('#email', { timeout: TEST_CONFIG.timeout });
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: TEST_CONFIG.timeout });
    
    // Test 1.1: Navigate to Trades page multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
      await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
      
      // Verify page loaded correctly
      const pageTitle = await page.$eval('.heading-luxury', el => el.textContent);
      if (pageTitle && pageTitle.includes('Trade History')) {
        logTest('navigationFlow', `Navigate to Trades (iteration ${i + 1})`, true);
      } else {
        logTest('navigationFlow', `Navigate to Trades (iteration ${i + 1})`, false, 'Page title not found');
      }
      
      await takeScreenshot(page, `trades-loaded-${i + 1}`);
    }
    
    // Test 1.2: Navigate away to all other pages
    const pages = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Strategies', url: '/strategies' },
      { name: 'Analytics', url: '/analytics' },
      { name: 'Log Trade', url: '/log-trade' },
      { name: 'Confluence', url: '/confluence' }
    ];
    
    for (const pageObj of pages) {
      // First navigate to Trades
      await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
      await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
      
      // Then navigate to the target page
      const startTime = Date.now();
      await page.goto(`${TEST_CONFIG.baseUrl}${pageObj.url}`);
      const navigationTime = Date.now() - startTime;
      
      // Check if navigation succeeded (no freeze)
      const currentUrl = page.url();
      const navigationSuccess = currentUrl.includes(pageObj.url);
      
      if (navigationSuccess && navigationTime < 5000) {
        logTest('navigationFlow', `Navigate to ${pageObj.name}`, true, `Navigation time: ${navigationTime}ms`);
      } else {
        logTest('navigationFlow', `Navigate to ${pageObj.name}`, false, 
                `Navigation time: ${navigationTime}ms, URL: ${currentUrl}`);
      }
      
      await takeScreenshot(page, `navigated-to-${pageObj.name.toLowerCase().replace(' ', '-')}`);
    }
    
    // Test 1.3: Rapid navigation cycles
    for (let cycle = 0; cycle < 5; cycle++) {
      await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
      await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
      await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
      await page.waitForTimeout(100); // Small delay between rapid navigations
    }
    
    logTest('navigationFlow', 'Rapid navigation cycles', true, 'Completed 5 cycles without freezing');
    
  } catch (error) {
    logTest('navigationFlow', 'Navigation flow test', false, error.message);
  } finally {
    await page.close();
  }
}

/**
 * Test 2: Debug Panel Verification
 */
async function testDebugPanel(browser) {
  console.log('\n🔍 Testing Debug Panel CSS Fixes...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Login and navigate to Trades
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('#email', { timeout: TEST_CONFIG.timeout });
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: TEST_CONFIG.timeout });
    
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
    await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
    
    // Test 2.1: Check debug panel z-index
    const debugPanelZIndex = await page.evaluate(() => {
      const debugPanel = document.querySelector('.zoom-debug-panel');
      if (!debugPanel) return null;
      
      const computedStyle = window.getComputedStyle(debugPanel);
      return parseInt(computedStyle.zIndex) || 0;
    });
    
    if (debugPanelZIndex !== null && debugPanelZIndex <= 100) {
      logTest('debugPanel', 'Debug panel z-index', true, `z-index: ${debugPanelZIndex}`);
    } else {
      logTest('debugPanel', 'Debug panel z-index', false, `z-index: ${debugPanelZIndex} (should be <= 100)`);
    }
    
    // Test 2.2: Check pointer-events: none
    const debugPanelPointerEvents = await page.evaluate(() => {
      const debugPanel = document.querySelector('.zoom-debug-panel');
      if (!debugPanel) return null;
      
      const computedStyle = window.getComputedStyle(debugPanel);
      return computedStyle.pointerEvents;
    });
    
    if (debugPanelPointerEvents === 'none') {
      logTest('debugPanel', 'Debug panel pointer-events', true, `pointer-events: ${debugPanelPointerEvents}`);
    } else {
      logTest('debugPanel', 'Debug panel pointer-events', false, `pointer-events: ${debugPanelPointerEvents} (should be none)`);
    }
    
    // Test 2.3: Test navigation clicks with debug panel present
    const navigationLinkExists = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
      return navLinks.length > 0;
    });
    
    if (navigationLinkExists) {
      // Try clicking a navigation link
      const navigationClicked = await page.evaluate(() => {
        const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
        if (navLinks.length > 0) {
          const firstLink = navLinks[0];
          firstLink.click();
          return true;
        }
        return false;
      });
      
      // Wait a moment to see if navigation happens
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      if (currentUrl !== `${TEST_CONFIG.baseUrl}/trades`) {
        logTest('debugPanel', 'Navigation with debug panel present', true, 'Navigation succeeded');
      } else {
        logTest('debugPanel', 'Navigation with debug panel present', false, 'Navigation may be blocked');
      }
    } else {
      logTest('debugPanel', 'Navigation links availability', false, 'No navigation links found');
    }
    
    await takeScreenshot(page, 'debug-panel-verification');
    
  } catch (error) {
    logTest('debugPanel', 'Debug panel test', false, error.message);
  } finally {
    await page.close();
  }
}

/**
 * Test 3: Modal Cleanup Testing
 */
async function testModalCleanup(browser) {
  console.log('\n🧹 Testing Modal Cleanup Functionality...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Login and navigate to Trades
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('#email', { timeout: TEST_CONFIG.timeout });
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: TEST_CONFIG.timeout });
    
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
    await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
    
    // Test 3.1: Check if cleanup function is globally available
    const cleanupFunctionExists = await page.evaluate(() => {
      return typeof window.cleanupModalOverlays === 'function';
    });
    
    if (cleanupFunctionExists) {
      logTest('modalCleanup', 'Global cleanup function availability', true);
    } else {
      logTest('modalCleanup', 'Global cleanup function availability', false, 'cleanupModalOverlays not found');
    }
    
    // Test 3.2: Check if navigation safety functions are available
    const navigationSafetyExists = await page.evaluate(() => {
      return typeof window.navigationSafety === 'object' &&
             typeof window.navigationSafety.forceCleanupNavigationBlockers === 'function' &&
             typeof window.navigationSafety.safeNavigation === 'function';
    });
    
    if (navigationSafetyExists) {
      logTest('modalCleanup', 'Navigation safety functions availability', true);
    } else {
      logTest('modalCleanup', 'Navigation safety functions availability', false, 'Navigation safety not found');
    }
    
    // Test 3.3: Test cleanup function execution
    const cleanupExecuted = await page.evaluate(() => {
      try {
        if (typeof window.cleanupModalOverlays === 'function') {
          window.cleanupModalOverlays();
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    });
    
    if (cleanupExecuted) {
      logTest('modalCleanup', 'Cleanup function execution', true);
    } else {
      logTest('modalCleanup', 'Cleanup function execution', false, 'Cleanup function failed to execute');
    }
    
    // Test 3.4: Test navigation after cleanup
    await page.evaluate(() => {
      if (typeof window.navigationSafety === 'object') {
        window.navigationSafety.forceCleanupNavigationBlockers();
      }
    });
    
    const navigationAfterCleanup = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
      if (navLinks.length > 0) {
        const firstLink = navLinks[0];
        firstLink.click();
        return true;
      }
      return false;
    });
    
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    
    if (currentUrl !== `${TEST_CONFIG.baseUrl}/trades`) {
      logTest('modalCleanup', 'Navigation after cleanup', true, 'Navigation succeeded after cleanup');
    } else {
      logTest('modalCleanup', 'Navigation after cleanup', false, 'Navigation still blocked after cleanup');
    }
    
    await takeScreenshot(page, 'modal-cleanup-verification');
    
  } catch (error) {
    logTest('modalCleanup', 'Modal cleanup test', false, error.message);
  } finally {
    await page.close();
  }
}

/**
 * Test 4: Edge Cases Testing
 */
async function testEdgeCases(browser) {
  console.log('\n🎯 Testing Edge Cases...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Login
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('#email', { timeout: TEST_CONFIG.timeout });
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: TEST_CONFIG.timeout });
    
    // Test 4.1: Navigation after filtering and sorting
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
    await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
    
    // Apply filters
    const filterInput = await page.$('input[placeholder="Search symbol..."]');
    if (filterInput) {
      await filterInput.type('AAPL');
      await page.waitForTimeout(500);
      
      // Try navigation after filtering
      const navigationAfterFilter = await page.evaluate(() => {
        const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
        if (navLinks.length > 0) {
          const firstLink = navLinks[0];
          firstLink.click();
          return true;
        }
        return false;
      });
      
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      
      if (currentUrl !== `${TEST_CONFIG.baseUrl}/trades`) {
        logTest('edgeCases', 'Navigation after filtering', true);
      } else {
        logTest('edgeCases', 'Navigation after filtering', false);
      }
    }
    
    // Test 4.2: Navigation after page visibility changes
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
    await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
    
    // Simulate page visibility change
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Try navigation after visibility change
    await page.evaluate(() => {
      const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
      if (navLinks.length > 0) {
        const firstLink = navLinks[0];
        firstLink.click();
        return true;
      }
      return false;
    });
    
    await page.waitForTimeout(1000);
    const urlAfterVisibilityChange = page.url();
    
    if (urlAfterVisibilityChange !== `${TEST_CONFIG.baseUrl}/trades`) {
      logTest('edgeCases', 'Navigation after visibility change', true);
    } else {
      logTest('edgeCases', 'Navigation after visibility change', false);
    }
    
    // Test 4.3: Browser back/forward actions
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
    await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
    
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await page.waitForTimeout(1000);
    
    await page.goBack();
    await page.waitForTimeout(1000);
    
    const currentUrlAfterBack = page.url();
    if (currentUrlAfterBack.includes('/trades')) {
      logTest('edgeCases', 'Browser back navigation', true);
    } else {
      logTest('edgeCases', 'Browser back navigation', false);
    }
    
    await page.goForward();
    await page.waitForTimeout(1000);
    
    const currentUrlAfterForward = page.url();
    if (currentUrlAfterForward.includes('/dashboard')) {
      logTest('edgeCases', 'Browser forward navigation', true);
    } else {
      logTest('edgeCases', 'Browser forward navigation', false);
    }
    
    await takeScreenshot(page, 'edge-cases-verification');
    
  } catch (error) {
    logTest('edgeCases', 'Edge cases test', false, error.message);
  } finally {
    await page.close();
  }
}

/**
 * Test 5: Performance Verification
 */
async function testPerformance(browser) {
  console.log('\n⚡ Testing Performance Impact...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Login
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('#email', { timeout: TEST_CONFIG.timeout });
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: TEST_CONFIG.timeout });
    
    // Test 5.1: Navigation performance
    const navigationTimes = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
      await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
      const navigationTime = Date.now() - startTime;
      navigationTimes.push(navigationTime);
    }
    
    const avgNavigationTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    
    if (avgNavigationTime < 3000) {
      logTest('performance', 'Navigation performance', true, `Average time: ${avgNavigationTime.toFixed(2)}ms`);
    } else {
      logTest('performance', 'Navigation performance', false, `Average time: ${avgNavigationTime.toFixed(2)}ms (should be < 3000ms)`);
    }
    
    // Test 5.2: Cleanup function performance
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`);
    await page.waitForSelector('.heading-luxury', { timeout: TEST_CONFIG.timeout });
    
    const cleanupTimes = [];
    
    for (let i = 0; i < 10; i++) {
      const cleanupTime = await page.evaluate(() => {
        const startTime = performance.now();
        if (typeof window.navigationSafety === 'object') {
          window.navigationSafety.forceCleanupNavigationBlockers();
        }
        return performance.now() - startTime;
      });
      cleanupTimes.push(cleanupTime);
    }
    
    const avgCleanupTime = cleanupTimes.reduce((a, b) => a + b, 0) / cleanupTimes.length;
    
    if (avgCleanupTime < 50) {
      logTest('performance', 'Cleanup function performance', true, `Average time: ${avgCleanupTime.toFixed(2)}ms`);
    } else {
      logTest('performance', 'Cleanup function performance', false, `Average time: ${avgCleanupTime.toFixed(2)}ms (should be < 50ms)`);
    }
    
    // Test 5.3: Memory usage check
    const memoryUsage = await page.evaluate(() => {
      if (performance && performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      const memoryUsageMB = (memoryUsage.used / 1024 / 1024).toFixed(2);
      logTest('performance', 'Memory usage', true, `Memory usage: ${memoryUsageMB}MB`);
    } else {
      logTest('performance', 'Memory usage', false, 'Memory API not available');
    }
    
    await takeScreenshot(page, 'performance-verification');
    
  } catch (error) {
    logTest('performance', 'Performance test', false, error.message);
  } finally {
    await page.close();
  }
}

/**
 * Main test execution function
 */
async function runComprehensiveVerification() {
  console.log('🚀 Starting Comprehensive Verification for Trades Tab Navigation Freeze Issue...\n');
  
  // Create screenshot directory
  const fs = require('fs');
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Run all test categories
    await testNavigationFlow(browser);
    await testDebugPanel(browser);
    await testModalCleanup(browser);
    await testEdgeCases(browser);
    await testPerformance(browser);
    
    // Generate final report
    const successRate = ((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(2);
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    
    // Category breakdown
    console.log('\n📋 Category Breakdown:');
    Object.keys(testResults.categories).forEach(category => {
      const cat = testResults.categories[category];
      const catSuccessRate = ((cat.passed / (cat.passed + cat.failed)) * 100).toFixed(2);
      console.log(`${category}: ${cat.passed}/${cat.passed + cat.failed} passed (${catSuccessRate}%)`);
    });
    
    // Save detailed report to file
    fs.writeFileSync(TEST_CONFIG.reportFile, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${TEST_CONFIG.reportFile}`);
    
    // Final assessment
    const allNavigationTestsPassed = testResults.categories.navigationFlow.failed === 0;
    const allDebugPanelTestsPassed = testResults.categories.debugPanel.failed === 0;
    const allModalCleanupTestsPassed = testResults.categories.modalCleanup.failed === 0;
    
    if (allNavigationTestsPassed && allDebugPanelTestsPassed && allModalCleanupTestsPassed) {
      console.log('\n✅ SUCCESS: All critical tests passed! The Trades tab navigation freeze issue appears to be completely resolved.');
    } else {
      console.log('\n⚠️  WARNING: Some critical tests failed. The Trades tab navigation freeze issue may not be fully resolved.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
if (require.main === module) {
  runComprehensiveVerification();
}

module.exports = { runComprehensiveVerification, testResults };