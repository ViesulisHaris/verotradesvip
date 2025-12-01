const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 30000,
  observationTime: 5000, // Time to observe for infinite refresh loops
  screenshotDir: './test-screenshots'
};

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

// Test results tracking
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    total: 0
  }
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const result = {
    testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: PASSED - ${details}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: FAILED - ${details}`);
  }
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = `${TEST_CONFIG.screenshotDir}/${name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Helper function to detect infinite refresh patterns
async function detectInfiniteRefresh(page, testName, observationTime = TEST_CONFIG.observationTime) {
  console.log(`🔍 Detecting infinite refresh for ${testName}...`);
  
  let refreshCount = 0;
  let networkRequests = [];
  
  // Monitor network requests
  const requestHandler = (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  };
  
  page.on('request', requestHandler);
  
  // Monitor console logs for debug messages
  let consoleMessages = [];
  page.on('console', msg => {
    if (msg.text().includes('[INFINITE REFRESH DEBUG]')) {
      consoleMessages.push({
        text: msg.text(),
        timestamp: Date.now()
      });
      console.log('🔄 PAGE LOG:', msg.text());
    }
  });
  
  // Wait for observation period
  await new Promise(resolve => setTimeout(resolve, observationTime));
  
  // Remove the request handler
  page.off('request', requestHandler);
  
  // Analyze results
  const strategyRequests = networkRequests.filter(req => 
    req.url.includes('/strategies/performance/') || 
    req.url.includes('api/strategies')
  );
  
  const analysis = {
    observationTime,
    totalRequests: networkRequests.length,
    strategyRequests: strategyRequests.length,
    consoleMessages: consoleMessages.length,
    uniqueStrategyUrls: [...new Set(strategyRequests.map(req => req.url))].length
  };
  
  console.log(`📊 ${testName} Analysis:`, analysis);
  
  // Determine if infinite refresh is detected
  // More than 5 strategy requests in 5 seconds suggests infinite refresh
  const isInfiniteRefresh = analysis.strategyRequests > 5;
  
  return {
    isInfiniteRefresh,
    analysis
  };
}

// Main test function
async function runFocusedInfiniteRefreshTest() {
  console.log('🚀 Starting Focused Infinite Refresh Loop Fix Test');
  console.log('==================================================');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test 1: Direct navigation to strategy performance page with test ID
    console.log('\n📍 Test 1: Direct navigation to strategy performance page');
    const testStrategyId = 'test-strategy-123';
    
    try {
      await page.goto(`${TEST_CONFIG.baseUrl}/strategies/performance/${testStrategyId}`, { 
        waitUntil: 'networkidle2', 
        timeout: TEST_CONFIG.timeout 
      });
      
      await takeScreenshot(page, 'strategy-performance-direct-navigation');
      logTest('Direct navigation to strategy performance', true, `Navigated to strategy ${testStrategyId}`);
    } catch (error) {
      logTest('Direct navigation to strategy performance', false, error.message);
    }
    
    // Test 2: Monitor for infinite refresh loops (most important test)
    console.log('\n📍 Test 2: Monitor for infinite refresh loops');
    try {
      const refreshResult = await detectInfiniteRefresh(page, 'Strategy Performance Page');
      await takeScreenshot(page, 'strategy-performance-after-observation');
      
      logTest('Infinite refresh detection', !refreshResult.isInfiniteRefresh, 
        `Strategy requests: ${refreshResult.analysis.strategyRequests}, Console messages: ${refreshResult.analysis.consoleMessages}`);
    } catch (error) {
      logTest('Infinite refresh detection', false, error.message);
    }
    
    // Test 3: Check if page content stabilizes
    console.log('\n📍 Test 3: Check page content stability');
    try {
      let contentChanges = 0;
      let lastContent = await page.content();
      
      // Monitor content changes over 3 seconds
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const currentContent = await page.content();
        if (currentContent !== lastContent) {
          contentChanges++;
          lastContent = currentContent;
        }
      }
      
      const isStable = contentChanges <= 2; // Allow for minor dynamic content changes
      await takeScreenshot(page, 'strategy-performance-stability-check');
      
      logTest('Page content stability', isStable, `Content changes: ${contentChanges}`);
    } catch (error) {
      logTest('Page content stability', false, error.message);
    }
    
    // Test 4: Try to navigate to a different strategy
    console.log('\n📍 Test 4: Test different strategy navigation');
    try {
      const differentStrategyId = 'test-strategy-456';
      await page.goto(`${TEST_CONFIG.baseUrl}/strategies/performance/${differentStrategyId}`, { 
        waitUntil: 'networkidle2', 
        timeout: TEST_CONFIG.timeout 
      });
      
      // Quick refresh check
      const quickRefreshCheck = await detectInfiniteRefresh(page, `Different Strategy ${differentStrategyId}`, 3000);
      await takeScreenshot(page, 'different-strategy-performance');
      
      logTest('Different strategy navigation', !quickRefreshCheck.isInfiniteRefresh, 
        `Strategy requests: ${quickRefreshCheck.analysis.strategyRequests}`);
    } catch (error) {
      logTest('Different strategy navigation', false, error.message);
    }
    
    // Test 5: Test tab navigation if we can find tabs
    console.log('\n📍 Test 5: Test tab navigation');
    try {
      // Look for tab buttons using more generic selectors
      const tabButtons = await page.$$('button');
      console.log(`Found ${tabButtons.length} buttons on page`);
      
      let tabNavigationSuccess = false;
      for (const button of tabButtons) {
        const buttonText = await page.evaluate(el => el.textContent, button);
        console.log(`Found button with text: ${buttonText}`);
        
        if (buttonText && ['Overview', 'Performance', 'Rules'].includes(buttonText.trim())) {
          try {
            await button.click();
            await page.waitForTimeout(1000);
            tabNavigationSuccess = true;
            console.log(`Successfully clicked tab: ${buttonText}`);
            break;
          } catch (tabError) {
            console.log(`Error clicking tab ${buttonText}: ${tabError.message}`);
          }
        }
      }
      
      await takeScreenshot(page, 'strategy-performance-tab-navigation');
      logTest('Tab navigation', tabNavigationSuccess, tabNavigationSuccess ? 'Tab navigation successful' : 'No tabs found or navigation failed');
    } catch (error) {
      logTest('Tab navigation', false, error.message);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    logTest('Test execution', false, error.message);
  } finally {
    await browser.close();
  }
  
  // Generate final report
  testResults.endTime = new Date().toISOString();
  testResults.duration = Date.now() - new Date(testResults.startTime).getTime();
  
  const report = {
    ...testResults,
    success: testResults.summary.failed === 0,
    conclusion: testResults.summary.failed === 0 
      ? '✅ Infinite refresh loop fix appears to be working correctly'
      : '❌ Issues detected - infinite refresh loop may not be fully resolved'
  };
  
  // Save report
  const reportPath = `${TEST_CONFIG.screenshotDir}/focused-infinite-refresh-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Duration: ${testResults.duration}ms`);
  console.log(`Report saved to: ${reportPath}`);
  console.log(`\n🎯 Conclusion: ${report.conclusion}`);
  
  return report;
}

// Run the test
if (require.main === module) {
  runFocusedInfiniteRefreshTest()
    .then(report => {
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed to run:', error);
      process.exit(1);
    });
}

module.exports = { runFocusedInfiniteRefreshTest };