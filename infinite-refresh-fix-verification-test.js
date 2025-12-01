const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 30000,
  navigationTimeout: 10000,
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
  let lastUrl = page.url();
  let lastContent = await page.content();
  let networkRequests = [];
  
  // Monitor network requests
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  // Monitor for changes over time
  const startTime = Date.now();
  let contentChanges = 0;
  let urlChanges = 0;
  
  const checkInterval = setInterval(async () => {
    const currentUrl = page.url();
    const currentContent = await page.content();
    
    if (currentUrl !== lastUrl) {
      urlChanges++;
      lastUrl = currentUrl;
    }
    
    if (currentContent !== lastContent) {
      contentChanges++;
      lastContent = currentContent;
    }
    
    // Count specific strategy-related requests
    const strategyRequests = networkRequests.filter(req => 
      req.url.includes('/strategies/performance/') || 
      req.url.includes('api/strategies')
    );
    
    refreshCount = strategyRequests.length;
    
  }, 1000);
  
  // Wait for observation period
  await new Promise(resolve => setTimeout(resolve, observationTime));
  clearInterval(checkInterval);
  
  // Analyze results
  const analysis = {
    observationTime: Date.now() - startTime,
    urlChanges,
    contentChanges,
    refreshCount,
    networkRequests: networkRequests.length,
    strategyRequests: networkRequests.filter(req => 
      req.url.includes('/strategies/performance/') || 
      req.url.includes('api/strategies')
    ).length
  };
  
  console.log(`📊 ${testName} Analysis:`, analysis);
  
  // Determine if infinite refresh is detected
  const isInfiniteRefresh = analysis.refreshCount > 5 || analysis.contentChanges > 10;
  
  return {
    isInfiniteRefresh,
    analysis
  };
}

// Main test function
async function runInfiniteRefreshFixTest() {
  console.log('🚀 Starting Infinite Refresh Loop Fix Verification Test');
  console.log('=====================================================');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.text().includes('[INFINITE REFRESH DEBUG]')) {
        console.log('🔄 PAGE LOG:', msg.text());
      }
    });
    
    // Test 1: Navigate to strategies list first
    console.log('\n📍 Test 1: Navigate to strategies list');
    try {
      await page.goto(`${TEST_CONFIG.baseUrl}/strategies`, { 
        waitUntil: 'networkidle2', 
        timeout: TEST_CONFIG.navigationTimeout 
      });
      await takeScreenshot(page, 'strategies-list');
      logTest('Navigate to strategies list', true, 'Successfully loaded strategies page');
    } catch (error) {
      logTest('Navigate to strategies list', false, error.message);
    }
    
    // Test 2: Find and click on a strategy to view performance details
    console.log('\n📍 Test 2: Navigate to strategy performance details');
    let strategyId = null;
    
    try {
      // Wait for strategy cards to load
      await page.waitForSelector('[data-testid="strategy-card"], .strategy-card, a[href*="/strategies/performance/"]', { timeout: 10000 });
      
      // Find the first strategy link
      const strategyLink = await page.$('a[href*="/strategies/performance/"]');
      
      if (strategyLink) {
        const href = await page.evaluate(el => el.getAttribute('href'), strategyLink);
        strategyId = href.split('/').pop();
        console.log(`🎯 Found strategy ID: ${strategyId}`);
        
        // Click on the strategy
        await strategyLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_CONFIG.navigationTimeout });
        
        await takeScreenshot(page, 'strategy-performance-initial-load');
        logTest('Navigate to strategy performance details', true, `Successfully loaded strategy ${strategyId}`);
      } else {
        // If no strategy found, try direct navigation with a test ID
        strategyId = 'test-strategy-id';
        await page.goto(`${TEST_CONFIG.baseUrl}/strategies/performance/${strategyId}`, { 
          waitUntil: 'networkidle2', 
          timeout: TEST_CONFIG.navigationTimeout 
        });
        logTest('Navigate to strategy performance details', true, `Used direct navigation with test ID ${strategyId}`);
      }
    } catch (error) {
      logTest('Navigate to strategy performance details', false, error.message);
    }
    
    // Test 3: Monitor for infinite refresh loops
    console.log('\n📍 Test 3: Monitor for infinite refresh loops');
    try {
      const refreshResult = await detectInfiniteRefresh(page, 'Strategy Performance Page');
      await takeScreenshot(page, 'strategy-performance-after-observation');
      
      logTest('Infinite refresh detection', !refreshResult.isInfiniteRefresh, 
        `Refresh count: ${refreshResult.analysis.refreshCount}, Content changes: ${refreshResult.analysis.contentChanges}`);
    } catch (error) {
      logTest('Infinite refresh detection', false, error.message);
    }
    
    // Test 4: Check if performance data loads correctly
    console.log('\n📍 Test 4: Verify performance data display');
    try {
      // Wait for performance data to load
      await page.waitForTimeout(2000); // Allow data to load
      
      // Check for key performance metrics
      const performanceElements = await page.evaluate(() => {
        const selectors = [
          '.text-blue-400', // Winrate
          '.text-purple-400', // Profit Factor
          '.text-green-400', // Net PnL
          '.text-orange-400' // Trades
        ];
        
        return selectors.map(selector => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        });
      });
      
      const hasPerformanceData = performanceElements.some(text => text && text !== 'No Data' && text !== '--');
      
      await takeScreenshot(page, 'strategy-performance-data-check');
      logTest('Performance data display', hasPerformanceData, 
        `Performance elements found: ${performanceElements.filter(Boolean).length}/4`);
    } catch (error) {
      logTest('Performance data display', false, error.message);
    }
    
    // Test 5: Test tab navigation
    console.log('\n📍 Test 5: Test tab navigation');
    try {
      const tabs = ['overview', 'performance', 'rules'];
      let tabNavigationSuccess = true;
      
      for (const tab of tabs) {
        try {
          // Click on tab
          await page.click(`button:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`);
          await page.waitForTimeout(1000); // Wait for tab content to load
          
          // Check if tab is active
          const isActiveTab = await page.evaluate((tabName) => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => 
              btn.textContent.toLowerCase().includes(tabName) && 
              btn.classList.contains('text-blue-400')
            );
          }, tab);
          
          if (!isActiveTab) {
            tabNavigationSuccess = false;
            console.log(`⚠️ Tab "${tab}" may not have activated properly`);
          }
          
          await takeScreenshot(page, `strategy-performance-tab-${tab}`);
        } catch (tabError) {
          console.log(`⚠️ Error navigating to tab "${tab}": ${tabError.message}`);
          tabNavigationSuccess = false;
        }
      }
      
      logTest('Tab navigation', tabNavigationSuccess, `Successfully tested ${tabs.length} tabs`);
    } catch (error) {
      logTest('Tab navigation', false, error.message);
    }
    
    // Test 6: Test chart rendering
    console.log('\n📍 Test 6: Test chart rendering');
    try {
      // Navigate to Performance tab
      await page.click('button:has-text("Performance")');
      await page.waitForTimeout(2000);
      
      // Check for chart elements
      const hasChart = await page.evaluate(() => {
        const chartSelectors = [
          'canvas',
          '[class*="chart"]',
          '[class*="Chart"]',
          'svg'
        ];
        
        return chartSelectors.some(selector => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).some(el => 
            el.offsetWidth > 0 && el.offsetHeight > 0
          );
        });
      });
      
      await takeScreenshot(page, 'strategy-performance-chart');
      logTest('Chart rendering', hasChart, hasChart ? 'Chart elements found and rendered' : 'No chart elements detected');
    } catch (error) {
      logTest('Chart rendering', false, error.message);
    }
    
    // Test 7: Test multiple strategies if possible
    console.log('\n📍 Test 7: Test multiple strategies');
    try {
      // Go back to strategies list
      await page.goto(`${TEST_CONFIG.baseUrl}/strategies`, { 
        waitUntil: 'networkidle2', 
        timeout: TEST_CONFIG.navigationTimeout 
      });
      
      // Try to find multiple strategy links
      const strategyLinks = await page.$$('a[href*="/strategies/performance/"]');
      
      if (strategyLinks.length > 1) {
        console.log(`📊 Found ${strategyLinks.length} strategies, testing multiple...`);
        
        // Test up to 3 different strategies
        const testCount = Math.min(3, strategyLinks.length);
        let multipleStrategySuccess = true;
        
        for (let i = 0; i < testCount; i++) {
          try {
            const href = await page.evaluate(el => el.getAttribute('href'), strategyLinks[i]);
            const testStrategyId = href.split('/').pop();
            
            await page.goto(`${TEST_CONFIG.baseUrl}/strategies/performance/${testStrategyId}`, { 
              waitUntil: 'networkidle2', 
              timeout: TEST_CONFIG.navigationTimeout 
            });
            
            // Quick check for infinite refresh
            const quickRefreshCheck = await detectInfiniteRefresh(page, `Strategy ${testStrategyId}`, 2000);
            
            if (quickRefreshCheck.isInfiniteRefresh) {
              multipleStrategySuccess = false;
              console.log(`⚠️ Strategy ${testStrategyId} shows infinite refresh pattern`);
            }
            
            await takeScreenshot(page, `strategy-${testStrategyId}-test`);
          } catch (strategyError) {
            console.log(`⚠️ Error testing strategy ${i}: ${strategyError.message}`);
            multipleStrategySuccess = false;
          }
        }
        
        logTest('Multiple strategies test', multipleStrategySuccess, `Tested ${testCount} different strategies`);
      } else {
        logTest('Multiple strategies test', true, 'Only one strategy available or found, skipping multiple test');
      }
    } catch (error) {
      logTest('Multiple strategies test', false, error.message);
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
  const reportPath = `${TEST_CONFIG.screenshotDir}/infinite-refresh-fix-test-report-${Date.now()}.json`;
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
  runInfiniteRefreshFixTest()
    .then(report => {
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed to run:', error);
      process.exit(1);
    });
}

module.exports = { runInfiniteRefreshFixTest };