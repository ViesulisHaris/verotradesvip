const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  tradesPage: '/trades',
  timeout: 30000,
  screenshotDir: './test-screenshots',
  reportFile: './trades-page-test-report.json'
};

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    total: 0
  }
};

// Helper function to log test results
function logTest(testName, passed, details = {}) {
  const test = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  console.log(`${passed ? '✅' : '❌'} ${testName}`);
  if (Object.keys(details).length > 0) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

// Helper function to wait for element with timeout
async function waitForElement(page, selector, timeout = TEST_CONFIG.timeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to extract statistics from the page
async function extractStatistics(page) {
  try {
    const statistics = await page.evaluate(() => {
      const stats = {};
      
      // Extract Total Trades
      const totalTradesElement = document.querySelector('.dashboard-card .metric-value');
      if (totalTradesElement) {
        stats.totalTrades = totalTradesElement.textContent.trim();
      }
      
      // Extract all metric values
      const metricElements = document.querySelectorAll('.dashboard-card .metric-value');
      if (metricElements.length >= 3) {
        stats.totalTrades = metricElements[0].textContent.trim();
        stats.totalPnL = metricElements[1].textContent.trim();
        stats.winRate = metricElements[2].textContent.trim();
      }
      
      return stats;
    });
    
    return statistics;
  } catch (error) {
    console.error('Error extracting statistics:', error);
    return {};
  }
}

// Helper function to check for console errors
async function captureConsoleErrors(page) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleLogs = [];
  
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      consoleErrors.push(text);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    } else if (type === 'log') {
      consoleLogs.push(text);
    }
  });
  
  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });
  
  return { consoleErrors, consoleWarnings, consoleLogs };
}

// Main test function
async function runTradesPageTest() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting comprehensive trades page test...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set up console error capture
    const { consoleErrors, consoleWarnings, consoleLogs } = await captureConsoleErrors(page);
    
    // Test 1: Navigate to trades page
    console.log('\n📋 Test 1: Navigate to /trades page');
    try {
      const startTime = Date.now();
      const response = await page.goto(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.tradesPage}`, {
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout
      });
      const loadTime = Date.now() - startTime;
      
      const httpStatus = response.status();
      const passed = httpStatus === 200;
      
      logTest('Navigate to /trades page', passed, {
        httpStatus,
        loadTime: `${loadTime}ms`,
        url: response.url()
      });
      
      if (!passed) {
        throw new Error(`HTTP ${httpStatus} response`);
      }
    } catch (error) {
      logTest('Navigate to /trades page', false, {
        error: error.message
      });
      throw error;
    }
    
    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check for console errors during page load
    console.log('\n📋 Test 2: Check for console errors');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow time for console messages to accumulate
    
    const hasErrors = consoleErrors.length > 0;
    const hasWarnings = consoleWarnings.length > 0;
    
    logTest('No console errors during page load', !hasErrors, {
      errors: consoleErrors,
      warnings: consoleWarnings,
      logsCount: consoleLogs.length
    });
    
    // Test 3: Verify page elements are loaded
    console.log('\n📋 Test 3: Verify page elements are loaded');
    
    const elementsToCheck = [
      { selector: '.verotrade-content-wrapper', name: 'Main content wrapper' },
      { selector: '.dashboard-card', name: 'Dashboard cards' },
      { selector: '.metric-value', name: 'Metric values' },
      { selector: 'h1.h1-dashboard', name: 'Page header' }
    ];
    
    for (const element of elementsToCheck) {
      const exists = await waitForElement(page, element.selector);
      logTest(`Element present: ${element.name}`, exists, {
        selector: element.selector
      });
    }
    
    // Test 4: Take screenshot of initial page state
    console.log('\n📋 Test 4: Take screenshot of initial page state');
    try {
      const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `trades-page-initial-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      logTest('Screenshot captured', true, {
        path: screenshotPath
      });
    } catch (error) {
      logTest('Screenshot captured', false, {
        error: error.message
      });
    }
    
    // Test 5: Record initial statistics values
    console.log('\n📋 Test 5: Record initial statistics values');
    try {
      const statistics = await extractStatistics(page);
      
      const hasStatistics = Object.keys(statistics).length > 0;
      logTest('Statistics extracted', hasStatistics, {
        statistics,
        extractedAt: new Date().toISOString()
      });
      
      if (hasStatistics) {
        // Parse numeric values for validation
        const totalTradesNum = parseInt(statistics.totalTrades) || 0;
        const totalPnLStr = statistics.totalPnL || '';
        const winRateNum = parseFloat(statistics.winRate?.replace('%', '')) || 0;
        
        logTest('Statistics values are valid', totalTradesNum >= 0 && !isNaN(winRateNum), {
          totalTrades: totalTradesNum,
          totalPnL: totalPnLStr,
          winRate: winRateNum
        });
      }
    } catch (error) {
      logTest('Statistics extracted', false, {
        error: error.message
      });
    }
    
    // Test 6: Verify fetchTradesStatistics function is being used
    console.log('\n📋 Test 6: Verify fetchTradesStatistics function usage');
    try {
      // Check if the function is called in console logs
      const fetchTradesStatsCalled = consoleLogs.some(log => 
        log.includes('fetchTradesStatistics') || 
        log.includes('Error fetching trades statistics')
      );
      
      logTest('fetchTradesStatistics function called', fetchTradesStatsCalled, {
        foundInLogs: fetchTradesStatsCalled,
        relevantLogs: consoleLogs.filter(log => 
          log.includes('fetchTradesStatistics') || 
          log.includes('trades statistics') ||
          log.includes('statistics')
        )
      });
    } catch (error) {
      logTest('fetchTradesStatistics function called', false, {
        error: error.message
      });
    }
    
    // Test 7: Verify statistics show values from all trades, not just first page
    console.log('\n📋 Test 7: Verify statistics represent all trades');
    try {
      // Wait a bit more to ensure statistics are fully loaded
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract statistics again to ensure they're stable
      const statisticsAfterLoad = await extractStatistics(page);
      
      // Check if pagination controls exist (indicates there are multiple pages)
      const paginationExists = await waitForElement(page, '.dashboard-card button[disabled="false"]', 5000);
      
      // If pagination exists, verify that total trades count is higher than page size
      let statisticsRepresentAllTrades = true;
      if (paginationExists && statisticsAfterLoad.totalTrades) {
        const totalTrades = parseInt(statisticsAfterLoad.totalTrades) || 0;
        // Default page size is 25, so if we have more than 25 trades and pagination, 
        // statistics should represent all trades
        statisticsRepresentAllTrades = totalTrades > 25;
      }
      
      logTest('Statistics represent all trades (not just first page)', statisticsRepresentAllTrades, {
        statistics: statisticsAfterLoad,
        paginationExists,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logTest('Statistics represent all trades (not just first page)', false, {
        error: error.message
      });
    }
    
    // Test 8: Check for unexpected behavior or layout issues
    console.log('\n📋 Test 8: Check for unexpected behavior');
    try {
      // Check for broken images
      const brokenImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => !img.complete || img.naturalHeight === 0).length;
      });
      
      // Check for overlapping elements (basic check)
      const hasLayoutIssues = await page.evaluate(() => {
        const cards = document.querySelectorAll('.dashboard-card');
        return cards.length === 0;
      });
      
      logTest('No layout issues detected', brokenImages === 0 && !hasLayoutIssues, {
        brokenImages,
        missingDashboardCards: hasLayoutIssues
      });
    } catch (error) {
      logTest('No layout issues detected', false, {
        error: error.message
      });
    }
    
    // Test 9: Verify responsiveness (basic check)
    console.log('\n📋 Test 9: Verify basic responsiveness');
    try {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobileLayoutOK = await waitForElement(page, '.verotrade-content-wrapper', 5000);
      
      // Test tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tabletLayoutOK = await waitForElement(page, '.verotrade-content-wrapper', 5000);
      
      // Reset to desktop
      await page.setViewport({ width: 1920, height: 1080 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logTest('Basic responsiveness test', mobileLayoutOK && tabletLayoutOK, {
        mobileLayoutOK,
        tabletLayoutOK
      });
    } catch (error) {
      logTest('Basic responsiveness test', false, {
        error: error.message
      });
    }
    
    // Final screenshot after all tests
    console.log('\n📋 Final screenshot');
    try {
      const finalScreenshotPath = path.join(TEST_CONFIG.screenshotDir, `trades-page-final-${Date.now()}.png`);
      await page.screenshot({ path: finalScreenshotPath, fullPage: true });
      
      logTest('Final screenshot captured', true, {
        path: finalScreenshotPath
      });
    } catch (error) {
      logTest('Final screenshot captured', false, {
        error: error.message
      });
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    logTest('Test execution', false, {
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (page) {
      // Capture any final console messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate and save report
  console.log('\n📊 Generating test report...');
  
  const report = {
    ...testResults,
    summary: {
      ...testResults.summary,
      successRate: testResults.summary.total > 0 ? 
        (testResults.summary.passed / testResults.summary.total * 100).toFixed(2) + '%' : '0%'
    },
    environment: {
      userAgent: 'Puppeteer',
      viewport: '1920x1080',
      testUrl: `${TEST_CONFIG.baseUrl}${TEST_CONFIG.tradesPage}`
    }
  };
  
  fs.writeFileSync(TEST_CONFIG.reportFile, JSON.stringify(report, null, 2));
  
  console.log('\n📋 Test Summary:');
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(`   Success Rate: ${report.summary.successRate}`);
  console.log(`   Report saved to: ${TEST_CONFIG.reportFile}`);
  console.log(`   Screenshots saved to: ${TEST_CONFIG.screenshotDir}`);
  
  return report;
}

// Run the test
if (require.main === module) {
  runTradesPageTest()
    .then((report) => {
      console.log('\n✅ Test completed successfully');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runTradesPageTest, TEST_CONFIG };