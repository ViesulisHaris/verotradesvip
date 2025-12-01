const puppeteer = require('puppeteer');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  headless: false,
  slowMo: 100,
  timeout: 30000
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  consoleErrors: [],
  consoleWarnings: [],
  reactWarnings: [],
  mountingIssues: [],
  functionalityTests: [],
  summary: {
    totalErrors: 0,
    totalWarnings: 0,
    testsPassed: 0,
    testsFailed: 0
  }
};

// Function to capture console messages
function setupConsoleListeners(page) {
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      testResults.consoleErrors.push({
        text,
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      testResults.summary.totalErrors++;
      
      // Check for React-specific errors
      if (text.includes('Warning:') || text.includes('Error:')) {
        testResults.reactWarnings.push({
          text,
          type: 'react-warning',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for mounting issues
      if (text.includes('mount') || text.includes('Maximum update depth')) {
        testResults.mountingIssues.push({
          text,
          timestamp: new Date().toISOString()
        });
      }
    } else if (type === 'warning') {
      testResults.consoleWarnings.push({
        text,
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      testResults.summary.totalWarnings++;
    }
    
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  page.on('pageerror', error => {
    testResults.consoleErrors.push({
      text: error.message,
      type: 'page-error',
      timestamp: new Date().toISOString()
    });
    testResults.summary.totalErrors++;
    console.error(`[PAGE ERROR] ${error.message}`);
  });
}

// Test trades page functionality
async function testTradesPageFunctionality(page) {
  console.log('\n=== Testing Trades Page Functionality ===');
  
  try {
    // Navigate to trades page
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Test 1: Check if page loads without crashing
    const pageTitle = await page.title();
    if (pageTitle && pageTitle.includes('Trade')) {
      testResults.functionalityTests.push({
        test: 'Trades page loads',
        status: 'PASSED',
        message: 'Page title contains "Trade"'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'Trades page loads',
        status: 'FAILED',
        message: 'Page title does not contain "Trade"'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 2: Check for trade data loading
    const hasTradeData = await page.evaluate(() => {
      const tradeElements = document.querySelectorAll('[data-testid*="trade-row"]');
      return tradeElements.length > 0;
    });
    
    if (hasTradeData) {
      testResults.functionalityTests.push({
        test: 'Trade data loads',
        status: 'PASSED',
        message: 'Trade elements found on page'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'Trade data loads',
        status: 'FAILED',
        message: 'No trade elements found on page'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 3: Check for filter controls
    const hasFilterControls = await page.evaluate(() => {
      const filterInputs = document.querySelectorAll('input[type="text"], select');
      return filterInputs.length > 0;
    });
    
    if (hasFilterControls) {
      testResults.functionalityTests.push({
        test: 'Filter controls present',
        status: 'PASSED',
        message: 'Filter inputs and selects found'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'Filter controls present',
        status: 'FAILED',
        message: 'No filter controls found'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 4: Check for pagination controls
    const hasPagination = await page.evaluate(() => {
      const paginationButtons = document.querySelectorAll('button[aria-label*="page"], button[aria-label*="pagination"]');
      return paginationButtons.length > 0;
    });
    
    if (hasPagination) {
      testResults.functionalityTests.push({
        test: 'Pagination controls present',
        status: 'PASSED',
        message: 'Pagination buttons found'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'Pagination controls present',
        status: 'FAILED',
        message: 'No pagination controls found'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 5: Check for sorting controls
    const hasSortControls = await page.evaluate(() => {
      const sortButtons = document.querySelectorAll('button[aria-label*="sort"], select[aria-label*="sort"]');
      return sortButtons.length > 0;
    });
    
    if (hasSortControls) {
      testResults.functionalityTests.push({
        test: 'Sort controls present',
        status: 'PASSED',
        message: 'Sort controls found'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'Sort controls present',
        status: 'FAILED',
        message: 'No sort controls found'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 6: Check for edit/delete functionality
    const hasEditControls = await page.evaluate(() => {
      const editButtons = document.querySelectorAll('button[aria-label*="edit"], button[aria-label*="delete"]');
      return editButtons.length > 0;
    });
    
    if (hasEditControls) {
      testResults.functionalityTests.push({
        test: 'Edit/Delete controls present',
        status: 'PASSED',
        message: 'Edit and delete buttons found'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'Edit/Delete controls present',
        status: 'FAILED',
        message: 'No edit/delete controls found'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 7: Wait a bit more to check for delayed loading issues
    await page.waitForTimeout(2000);
    
    // Check for any React mounting warnings that might appear after interaction
    const finalWarnings = testResults.reactWarnings.length;
    const finalErrors = testResults.consoleErrors.length;
    
    if (finalWarnings === 0 && finalErrors === 0) {
      testResults.functionalityTests.push({
        test: 'No React mounting warnings',
        status: 'PASSED',
        message: 'No React warnings detected during interaction'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.functionalityTests.push({
        test: 'No React mounting warnings',
        status: 'FAILED',
        message: `Found ${finalWarnings} warnings and ${finalErrors} errors`
      });
      testResults.summary.testsFailed++;
    }
    
  } catch (error) {
    testResults.functionalityTests.push({
      test: 'Trades page functionality',
      status: 'ERROR',
      message: `Error during testing: ${error.message}`
    });
    testResults.summary.testsFailed++;
    testResults.consoleErrors.push({
      text: error.message,
      type: 'test-error',
      timestamp: new Date().toISOString()
    });
  }
}

// Main test function
async function runTradesPageTest() {
  let browser;
  let page;
  
  try {
    console.log('Starting Trades Page Verification Test...\n');
    
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Setup console listeners
    setupConsoleListeners(page);
    
    // Test trades page functionality
    await testTradesPageFunctionality(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
    testResults.consoleErrors.push({
      text: error.message,
      type: 'test-execution-error',
      timestamp: new Date().toISOString()
    });
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
  
  // Save results
  const resultsPath = './trades-page-test-results.json';
  require('fs').writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\nTrades page test results saved to: ${resultsPath}`);
  
  // Print summary
  console.log('\n=== TRADES PAGE TEST SUMMARY ===');
  console.log(`Total Errors: ${testResults.summary.totalErrors}`);
  console.log(`Total Warnings: ${testResults.summary.totalWarnings}`);
  console.log(`Tests Passed: ${testResults.summary.testsPassed}`);
  console.log(`Tests Failed: ${testResults.summary.testsFailed}`);
  
  if (testResults.mountingIssues.length > 0) {
    console.log('\n=== MOUNTING ISSUES ===');
    testResults.mountingIssues.forEach(issue => {
      console.log(`- ${issue.text}`);
    });
  }
  
  if (testResults.reactWarnings.length > 0) {
    console.log('\n=== REACT WARNINGS ===');
    testResults.reactWarnings.forEach(warning => {
      console.log(`- ${warning.text}`);
    });
  }
  
  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTradesPageTest().catch(console.error);
}

module.exports = { runTradesPageTest, testResults };