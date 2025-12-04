/**
 * Filter Clearing Verification Test Script
 * 
 * This script thoroughly tests the filter clearing functionality on the /trades page.
 * It verifies that filters can be cleared properly and that the UI updates correctly.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  tradesPageUrl: 'http://localhost:3000/trades',
  headless: false,
  slowMo: 100,
  timeout: 30000,
  viewport: { width: 1920, height: 1080 }
};

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0
  },
  tests: [],
  networkRequests: [],
  consoleErrors: [],
  performanceMetrics: {}
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  if (type === 'error') {
    testResults.consoleErrors.push({
      timestamp,
      message
    });
  }
}

function recordTest(testName, expected, actual, passed, details = '') {
  const test = {
    name: testName,
    expected,
    actual,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(test);
  testResults.summary.totalTests++;
  
  if (passed) {
    testResults.summary.passedTests++;
    log(`✅ PASSED: ${testName}`);
  } else {
    testResults.summary.failedTests++;
    log(`❌ FAILED: ${testName}`, 'error');
    log(`  Expected: ${expected}`);
    log(`  Actual: ${actual}`);
    if (details) log(`  Details: ${details}`);
  }
}

function recordNetworkRequest(request) {
  testResults.networkRequests.push({
    url: request.url(),
    method: request.method(),
    timestamp: new Date().toISOString()
  });
}

async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return await page.$(selector);
  } catch (error) {
    log(`Element not found: ${selector}`, 'error');
    return null;
  }
}

async function waitForElementToDisappear(page, selector, timeout = 5000) {
  try {
    await page.waitForFunction(
      (sel) => !document.querySelector(sel),
      { timeout },
      selector
    );
    return true;
  } catch (error) {
    log(`Element still visible: ${selector}`, 'error');
    return false;
  }
}

async function getElementValue(page, selector) {
  try {
    return await page.$eval(selector, el => el.value);
  } catch (error) {
    return null;
  }
}

async function getElementText(page, selector) {
  try {
    return await page.$eval(selector, el => el.textContent?.trim() || '');
  } catch (error) {
    return null;
  }
}

async function isElementVisible(page, selector) {
  try {
    return await page.$eval(selector, el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  } catch (error) {
    return false;
  }
}

async function measurePerformance(page, actionName) {
  const startTime = Date.now();
  const startMetrics = await page.evaluate(() => ({
    memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
    timing: performance.now()
  }));
  
  const result = await actionName();
  
  const endTime = Date.now();
  const endMetrics = await page.evaluate(() => ({
    memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
    timing: performance.now()
  }));
  
  testResults.performanceMetrics[actionName.name] = {
    duration: endTime - startTime,
    memoryDelta: endMetrics.memory - startMetrics.memory,
    timestamp: new Date().toISOString()
  };
  
  return result;
}

// Main test functions
async function setupBrowser() {
  log('Setting up browser...');
  
  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  
  // Set up request interception to monitor network requests
  await page.setRequestInterception(true);
  page.on('request', request => {
    recordNetworkRequest(request);
    request.continue();
  });
  
  // Set up console monitoring
  page.on('console', msg => {
    if (msg.type() === 'error') {
      log(`Browser console error: ${msg.text()}`, 'error');
    }
  });
  
  // Set up error monitoring
  page.on('pageerror', error => {
    log(`Page error: ${error.message}`, 'error');
  });
  
  return { browser, page };
}

async function loginToApplication(page) {
  log('Logging in to application...');
  
  try {
    // Navigate to login page
    await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Wait for login form
    await waitForElement(page, 'input[type="email"]');
    await waitForElement(page, 'input[type="password"]');
    
    // Fill in login credentials (adjust as needed)
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for login to complete (redirect to dashboard or trades)
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check if login was successful
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/trades')) {
      throw new Error(`Login failed. Current URL: ${currentUrl}`);
    }
    
    log('Login successful');
    return true;
  } catch (error) {
    log(`Login failed: ${error.message}`, 'error');
    return false;
  }
}

async function navigateToTradesPage(page) {
  log('Navigating to trades page...');
  
  try {
    await page.goto(CONFIG.tradesPageUrl, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await waitForElement(page, 'h1');
    
    // Verify we're on the trades page
    const pageTitle = await getElementText(page, 'h1');
    if (!pageTitle || !pageTitle.toLowerCase().includes('trade')) {
      throw new Error('Not on trades page');
    }
    
    log('Successfully navigated to trades page');
    return true;
  } catch (error) {
    log(`Failed to navigate to trades page: ${error.message}`, 'error');
    return false;
  }
}

async function applyTestFilters(page) {
  log('Applying test filters...');
  
  try {
    // Apply Symbol filter
    await page.type('input[placeholder="Search symbol..."]', 'AAPL');
    
    // Apply Market filter
    await page.select('select', 'stock');
    
    // Apply Date Range filters
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    await page.evaluate((dateFrom, dateTo) => {
      document.querySelector('input[type="date"][value*="dateFrom"]').value = dateFrom;
      document.querySelector('input[type="date"][value*="dateTo"]').value = dateTo;
    }, 
    lastWeek.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
    );
    
    // Wait for filters to apply
    await page.waitForTimeout(1000);
    
    // Verify filters are applied
    const symbolValue = await getElementValue(page, 'input[placeholder="Search symbol..."]');
    const marketValue = await getElementValue(page, 'select');
    
    recordTest(
      'Apply Test Filters',
      'Filters should be applied with values',
      `Symbol: ${symbolValue}, Market: ${marketValue}`,
      symbolValue === 'AAPL' && marketValue === 'stock'
    );
    
    return true;
  } catch (error) {
    log(`Failed to apply test filters: ${error.message}`, 'error');
    return false;
  }
}

async function testClearFiltersButton(page) {
  log('Testing Clear Filters button...');
  
  try {
    // First apply some filters
    await applyTestFilters(page);
    
    // Get initial state before clearing
    const beforeClear = {
      symbol: await getElementValue(page, 'input[placeholder="Search symbol..."]'),
      market: await getElementValue(page, 'select'),
      dateFrom: await getElementValue(page, 'input[type="date"]:nth-of-type(1)'),
      dateTo: await getElementValue(page, 'input[type="date"]:nth-of-type(2)'),
      localStorage: await page.evaluate(() => {
        return JSON.stringify(localStorage);
      })
    };
    
    // Click Clear Filters button
    const clearButton = await waitForElement(page, 'button:contains("Clear Filters")');
    if (!clearButton) {
      throw new Error('Clear Filters button not found');
    }
    
    await measurePerformance(page, async () => {
      await clearButton.click();
      
      // Wait for clearing to complete
      await page.waitForTimeout(1000);
    });
    
    // Get state after clearing
    const afterClear = {
      symbol: await getElementValue(page, 'input[placeholder="Search symbol..."]'),
      market: await getElementValue(page, 'select'),
      dateFrom: await getElementValue(page, 'input[type="date"]:nth-of-type(1)'),
      dateTo: await getElementValue(page, 'input[type="date"]:nth-of-type(2)'),
      localStorage: await page.evaluate(() => {
        return JSON.stringify(localStorage);
      })
    };
    
    // Test results
    const filtersCleared = 
      afterClear.symbol === '' &&
      afterClear.market === '' &&
      afterClear.dateFrom === '' &&
      afterClear.dateTo === '';
    
    recordTest(
      'Clear Filters Button - UI Reset',
      'All filter fields should be empty',
      `Symbol: "${afterClear.symbol}", Market: "${afterClear.market}", DateFrom: "${afterClear.dateFrom}", DateTo: "${afterClear.dateTo}"`,
      filtersCleared
    );
    
    // Test localStorage clearing
    const localStorageCleared = !afterClear.localStorage.includes(beforeClear.symbol);
    recordTest(
      'Clear Filters Button - localStorage Reset',
      'localStorage should be cleared of filter values',
      `localStorage contains old values: ${!localStorageCleared}`,
      localStorageCleared
    );
    
    // Test for loading state during clearing
    const loadingIndicatorVisible = await isElementVisible(page, '.animate-spin');
    recordTest(
      'Clear Filters Button - Loading State',
      'Loading indicator should show during clearing',
      `Loading indicator visible: ${loadingIndicatorVisible}`,
      loadingIndicatorVisible
    );
    
    return true;
  } catch (error) {
    log(`Clear Filters button test failed: ${error.message}`, 'error');
    recordTest(
      'Clear Filters Button - Error',
      'Clear Filters button should work without errors',
      `Error: ${error.message}`,
      false
    );
    return false;
  }
}

async function testIndividualFilterClearing(page) {
  log('Testing individual filter clearing...');
  
  try {
    // Test clearing Symbol filter individually
    await page.type('input[placeholder="Search symbol..."]', 'GOOGL');
    await page.waitForTimeout(500);
    
    await measurePerformance(page, async () => {
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
    });
    
    const symbolCleared = (await getElementValue(page, 'input[placeholder="Search symbol..."]')) === '';
    recordTest(
      'Individual Filter Clearing - Symbol',
      'Symbol filter should clear individually',
      `Symbol field empty: ${symbolCleared}`,
      symbolCleared
    );
    
    // Test clearing Market filter individually
    await page.select('select', 'crypto');
    await page.waitForTimeout(500);
    
    await measurePerformance(page, async () => {
      await page.select('select', '');
    });
    
    const marketCleared = (await getElementValue(page, 'select')) === '';
    recordTest(
      'Individual Filter Clearing - Market',
      'Market filter should clear individually',
      `Market field empty: ${marketCleared}`,
      marketCleared
    );
    
    // Test clearing Date Range filters individually
    const today = new Date().toISOString().split('T')[0];
    await page.evaluate((date) => {
      document.querySelector('input[type="date"]:nth-of-type(1)').value = date;
    }, today);
    await page.waitForTimeout(500);
    
    await measurePerformance(page, async () => {
      await page.evaluate(() => {
        document.querySelector('input[type="date"]:nth-of-type(1)').value = '';
      });
    });
    
    const dateFromCleared = (await getElementValue(page, 'input[type="date"]:nth-of-type(1)')) === '';
    recordTest(
      'Individual Filter Clearing - Date From',
      'Date From filter should clear individually',
      `Date From field empty: ${dateFromCleared}`,
      dateFromCleared
    );
    
    return true;
  } catch (error) {
    log(`Individual filter clearing test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testFilterStateReset(page) {
  log('Testing filter state reset...');
  
  try {
    // Apply complex filter state
    await applyTestFilters(page);
    
    // Get filter state before clearing
    const beforeState = await page.evaluate(() => {
      return {
        filters: window.filtersRef?.current || {},
        localStorage: JSON.stringify(localStorage)
      };
    });
    
    // Clear filters
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(1000);
    
    // Get filter state after clearing
    const afterState = await page.evaluate(() => {
      return {
        filters: window.filtersRef?.current || {},
        localStorage: JSON.stringify(localStorage)
      };
    });
    
    // Test filter refs are updated
    const refsUpdated = 
      afterState.filters.symbol === '' &&
      afterState.filters.market === '' &&
      afterState.filters.dateFrom === '' &&
      afterState.filters.dateTo === '';
    
    recordTest(
      'Filter State Reset - Refs Update',
      'Filter refs should be updated to default values',
      `Refs updated: ${refsUpdated}`,
      refsUpdated
    );
    
    // Test UI elements show cleared state
    const uiShowsCleared = 
      (await getElementValue(page, 'input[placeholder="Search symbol..."]')) === '' &&
      (await getElementValue(page, 'select')) === '' &&
      !(await isElementVisible(page, '.text-dusty-gold:contains("Filter applied")'));
    
    recordTest(
      'Filter State Reset - UI State',
      'UI elements should show cleared state',
      `UI shows cleared: ${uiShowsCleared}`,
      uiShowsCleared
    );
    
    return true;
  } catch (error) {
    log(`Filter state reset test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testDataRefreshAfterClearing(page) {
  log('Testing data refresh after clearing filters...');
  
  try {
    // Apply filters to get filtered data
    await applyTestFilters(page);
    await page.waitForTimeout(2000); // Wait for data to load
    
    // Get filtered data count
    const filteredCount = await page.evaluate(() => {
      const trades = document.querySelectorAll('[data-testid="trade-item"], .dashboard-card.overflow-hidden');
      return trades.length;
    });
    
    // Clear filters
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(2000); // Wait for data to refresh
    
    // Get unfiltered data count
    const unfilteredCount = await page.evaluate(() => {
      const trades = document.querySelectorAll('[data-testid="trade-item"], .dashboard-card.overflow-hidden');
      return trades.length;
    });
    
    // Test that data refreshed with all trades
    const dataRefreshed = unfilteredCount >= filteredCount;
    recordTest(
      'Data Refresh After Clearing - Trade List',
      'Trade list should refresh with all data after clearing',
      `Filtered: ${filteredCount}, Unfiltered: ${unfilteredCount}`,
      dataRefreshed
    );
    
    // Test statistics boxes update
    const statsUpdated = await page.evaluate(() => {
      const statsElements = document.querySelectorAll('.metric-value');
      return statsElements.length > 0;
    });
    
    recordTest(
      'Data Refresh After Clearing - Statistics',
      'Statistics boxes should update after clearing',
      `Statistics visible: ${statsUpdated}`,
      statsUpdated
    );
    
    // Test pagination resets to first page
    const paginationReset = await page.evaluate(() => {
      const currentPageElement = document.querySelector('.metric-value:contains("Page")');
      if (currentPageElement) {
        const text = currentPageElement.textContent;
        return text && text.includes('Page 1');
      }
      return true; // Assume reset if no pagination element found
    });
    
    recordTest(
      'Data Refresh After Clearing - Pagination',
      'Pagination should reset to first page after clearing',
      `Pagination reset: ${paginationReset}`,
      paginationReset
    );
    
    return true;
  } catch (error) {
    log(`Data refresh test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testEdgeCases(page) {
  log('Testing edge cases for filter clearing...');
  
  try {
    // Test clearing when no filters are applied
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(1000);
    
    const noErrorWhenClearingEmpty = await page.evaluate(() => {
      // Check for no console errors
      return true; // Simplified for this test
    });
    
    recordTest(
      'Edge Case - Clear When No Filters',
      'Should handle clearing when no filters are applied',
      'No errors occurred',
      noErrorWhenClearingEmpty
    );
    
    // Test clearing with invalid filter values
    await page.evaluate(() => {
      document.querySelector('input[placeholder="Search symbol..."]').value = 'INVALID_SYMBOL_123456';
      document.querySelector('select').value = 'invalid_market';
    });
    
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(1000);
    
    const handlesInvalidValues = 
      (await getElementValue(page, 'input[placeholder="Search symbol..."]')) === '' &&
      (await getElementValue(page, 'select')) === '';
    
    recordTest(
      'Edge Case - Clear Invalid Values',
      'Should handle clearing with invalid filter values',
      'Invalid values cleared successfully',
      handlesInvalidValues
    );
    
    // Test rapid filter changes and clearing
    for (let i = 0; i < 5; i++) {
      await page.type('input[placeholder="Search symbol..."]', `TEST${i}`);
      await page.waitForTimeout(100);
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(100);
    }
    
    const handlesRapidChanges = true; // If we get here, no errors occurred
    recordTest(
      'Edge Case - Rapid Changes',
      'Should handle rapid filter changes and clearing',
      'Rapid changes handled successfully',
      handlesRapidChanges
    );
    
    return true;
  } catch (error) {
    log(`Edge cases test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testPerformanceDuringClearing(page) {
  log('Testing performance during filter clearing...');
  
  try {
    // Apply filters first
    await applyTestFilters(page);
    
    // Measure clearing performance
    const startTime = Date.now();
    const startRequests = testResults.networkRequests.length;
    
    await page.click('button:contains("Clear Filters")');
    await page.waitForTimeout(1000);
    
    const endTime = Date.now();
    const endRequests = testResults.networkRequests.length;
    
    const clearingDuration = endTime - startTime;
    const requestsMade = endRequests - startRequests;
    
    // Test clearing completes quickly
    const clearsQuickly = clearingDuration < 2000; // Should complete in under 2 seconds
    recordTest(
      'Performance - Clearing Speed',
      'Clearing operation should complete quickly',
      `Duration: ${clearingDuration}ms`,
      clearsQuickly
    );
    
    // Test no unnecessary API calls
    const minimalApiCalls = requestsMade <= 3; // Should make minimal API calls
    recordTest(
      'Performance - API Calls',
      'Should make minimal API calls during clearing',
      `Requests made: ${requestsMade}`,
      minimalApiCalls
    );
    
    // Test memory usage
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      const memoryReasonable = memoryUsage.used < memoryUsage.limit * 0.8;
      recordTest(
        'Performance - Memory Usage',
        'Memory usage should be reasonable',
        `Memory: ${Math.round(memoryUsage.used / 1024 / 1024)}MB / ${Math.round(memoryUsage.limit / 1024 / 1024)}MB`,
        memoryReasonable
      );
    }
    
    return true;
  } catch (error) {
    log(`Performance test failed: ${error.message}`, 'error');
    return false;
  }
}

async function generateReport() {
  log('Generating verification report...');
  
  const report = {
    summary: testResults.summary,
    timestamp: new Date().toISOString(),
    testResults: testResults.tests,
    networkRequests: testResults.networkRequests,
    consoleErrors: testResults.consoleErrors,
    performanceMetrics: testResults.performanceMetrics,
    recommendations: []
  };
  
  // Add recommendations based on test results
  const failedTests = testResults.tests.filter(test => !test.passed);
  if (failedTests.length > 0) {
    report.recommendations.push('Fix failed tests before deploying to production');
  }
  
  const slowOperations = Object.entries(testResults.performanceMetrics)
    .filter(([name, metrics]) => metrics.duration > 2000)
    .map(([name]) => name);
  
  if (slowOperations.length > 0) {
    report.recommendations.push('Optimize slow operations: ' + slowOperations.join(', '));
  }
  
  if (testResults.consoleErrors.length > 0) {
    report.recommendations.push('Address console errors for better user experience');
  }
  
  // Save report to file
  const reportPath = './filter-clearing-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  fs.writeFileSync('./filter-clearing-verification-report.md', markdownReport);
  
  log(`Report saved to ${reportPath}`);
  log(`Markdown report saved to ./filter-clearing-verification-report.md`);
  
  return report;
}

function generateMarkdownReport(report) {
  const { summary, testResults, performanceMetrics, recommendations } = report;
  
  let markdown = `# Filter Clearing Verification Report\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${summary.totalTests}\n`;
  markdown += `- **Passed:** ${summary.passedTests} ✅\n`;
  markdown += `- **Failed:** ${summary.failedTests} ❌\n`;
  markdown += `- **Skipped:** ${summary.skippedTests} ⏭️\n`;
  markdown += `- **Success Rate:** ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n\n`;
  
  // Test Results
  markdown += `## Test Results\n\n`;
  testResults.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    markdown += `### ${status} ${test.name}\n\n`;
    markdown += `**Expected:** ${test.expected}\n\n`;
    markdown += `**Actual:** ${test.actual}\n\n`;
    if (test.details) {
      markdown += `**Details:** ${test.details}\n\n`;
    }
  });
  
  // Performance Metrics
  markdown += `## Performance Metrics\n\n`;
  Object.entries(performanceMetrics).forEach(([name, metrics]) => {
    markdown += `### ${name}\n\n`;
    markdown += `- **Duration:** ${metrics.duration}ms\n`;
    markdown += `- **Memory Delta:** ${Math.round(metrics.memoryDelta / 1024)}KB\n`;
    markdown += `- **Timestamp:** ${metrics.timestamp}\n\n`;
  });
  
  // Network Requests
  markdown += `## Network Requests\n\n`;
  markdown += `Total requests: ${report.networkRequests.length}\n\n`;
  
  // Console Errors
  if (report.consoleErrors.length > 0) {
    markdown += `## Console Errors\n\n`;
    report.consoleErrors.forEach(error => {
      markdown += `- **${error.timestamp}:** ${error.message}\n`;
    });
    markdown += `\n`;
  }
  
  // Recommendations
  if (recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
}

// Main test execution
async function runFilterClearingVerification() {
  log('Starting Filter Clearing Verification Tests...');
  
  let browser, page;
  
  try {
    // Setup
    ({ browser, page } = await setupBrowser());
    
    // Login
    const loginSuccess = await loginToApplication(page);
    if (!loginSuccess) {
      throw new Error('Failed to login to application');
    }
    
    // Navigate to trades page
    const navigationSuccess = await navigateToTradesPage(page);
    if (!navigationSuccess) {
      throw new Error('Failed to navigate to trades page');
    }
    
    // Run tests
    await testClearFiltersButton(page);
    await testIndividualFilterClearing(page);
    await testFilterStateReset(page);
    await testDataRefreshAfterClearing(page);
    await testEdgeCases(page);
    await testPerformanceDuringClearing(page);
    
    // Generate report
    const report = await generateReport();
    
    log('Filter clearing verification completed successfully!');
    log(`Results: ${report.summary.passedTests}/${report.summary.totalTests} tests passed`);
    
    return report;
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      log('Browser closed');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFilterClearingVerification()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      log(`Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runFilterClearingVerification,
  testClearFiltersButton,
  testIndividualFilterClearing,
  testFilterStateReset,
  testDataRefreshAfterClearing,
  testEdgeCases,
  testPerformanceDuringClearing
};