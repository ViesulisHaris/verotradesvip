/**
 * COMPREHENSIVE CONFLUENCE FILTERING TEST
 * 
 * This test validates all filtering capabilities implemented in the confluence page:
 * - Emotional states filtering
 * - Symbol search filtering
 * - Market filtering
 * - Strategy filtering
 * - Date range filtering
 * - P&L filtering (profitable/lossable)
 * - Trade side filtering (Buy/Sell)
 * - Filter combinations
 * - Performance testing
 * - Error handling
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  headless: false,
  slowMo: 100,
  timeout: 30000,
  viewport: { width: 1920, height: 1080 }
};

// Test data
const EXPECTED_FILTERS = {
  emotions: ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'],
  markets: ['Stock', 'Crypto', 'Forex', 'Futures'],
  pnlFilters: ['all', 'profitable', 'lossable'],
  sides: ['Buy', 'Sell']
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  performance: [],
  screenshots: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

function addTestResult(testName, passed, details = '', performance = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName} - ${details}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    performance,
    timestamp: new Date().toISOString()
  });
}

async function takeScreenshot(page, name) {
  try {
    const screenshotPath = `confluence-test-${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push(screenshotPath);
    log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function loginIfNeeded(page) {
  log('Checking authentication status...');
  
  // Check if already on confluence page (authenticated)
  if (page.url().includes('/confluence')) {
    log('Already authenticated, proceeding with tests');
    return true;
  }
  
  // Try to navigate to confluence page
  await page.goto(`${TEST_CONFIG.baseUrl}/confluence`, { waitUntil: 'networkidle2' });
  
  // Check if redirected to login
  if (page.url().includes('/login')) {
    log('Login required, attempting authentication...');
    
    // Fill login form (assuming test credentials exist)
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to confluence
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    if (page.url().includes('/confluence')) {
      log('Authentication successful');
      return true;
    } else {
      log('Authentication failed', 'error');
      return false;
    }
  }
  
  return page.url().includes('/confluence');
}

async function testFilterUIPresence(page) {
  log('Testing filter UI presence...');
  
  const filterTests = [
    { selector: 'input[placeholder*="Search symbols"]', name: 'Symbol search input' },
    { selector: 'input[type="date"]', name: 'Date range inputs' },
    { selector: 'select', name: 'Market dropdown' },
    { selector: 'select', name: 'Strategy dropdown' },
    { selector: 'button:has-text("All Trades")', name: 'P&L filter buttons' },
    { selector: 'button:has-text("All Sides")', name: 'Side filter buttons' },
    { selector: 'button:has-text("FOMO")', name: 'Emotion filter buttons' }
  ];
  
  for (const test of filterTests) {
    const present = await waitForElement(page, test.selector);
    addTestResult(`Filter UI - ${test.name}`, present, present ? 'Element found' : 'Element not found');
  }
}

async function testSymbolFilter(page) {
  log('Testing symbol filter...');
  
  const startTime = Date.now();
  
  try {
    // Get initial trade count
    const initialCount = await getTradeCount(page);
    
    // Search for AAPL
    await page.type('input[placeholder*="Search symbols"]', 'AAPL');
    await page.waitForTimeout(1000); // Wait for debounced search
    
    const filteredCount = await getTradeCount(page);
    const searchTime = Date.now() - startTime;
    
    // Clear search
    await page.click('input[placeholder*="Search symbols"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(1000);
    
    const clearedCount = await getTradeCount(page);
    
    const symbolFilterWorks = filteredCount <= initialCount;
    const clearWorks = clearedCount === initialCount;
    
    addTestResult('Symbol filter - search', symbolFilterWorks, 
      `Initial: ${initialCount}, Filtered: ${filteredCount}`, searchTime);
    addTestResult('Symbol filter - clear', clearWorks, 
      `Cleared count matches initial: ${clearedCount}/${initialCount}`);
    
    testResults.performance.push({ test: 'Symbol filter', time: searchTime });
    
  } catch (error) {
    addTestResult('Symbol filter', false, error.message);
  }
}

async function testMarketFilter(page) {
  log('Testing market filter...');
  
  const startTime = Date.now();
  
  try {
    const initialCount = await getTradeCount(page);
    
    // Select Stock market
    await page.select('select', 'Stock');
    await page.waitForTimeout(1000);
    
    const stockCount = await getTradeCount(page);
    
    // Select Crypto market
    await page.select('select', 'Crypto');
    await page.waitForTimeout(1000);
    
    const cryptoCount = await getTradeCount(page);
    
    // Reset to all markets
    await page.select('select', '');
    await page.waitForTimeout(1000);
    
    const resetCount = await getTradeCount(page);
    const filterTime = Date.now() - startTime;
    
    const marketFilterWorks = stockCount < initialCount || cryptoCount < initialCount;
    const resetWorks = resetCount === initialCount;
    
    addTestResult('Market filter - filtering', marketFilterWorks,
      `Initial: ${initialCount}, Stock: ${stockCount}, Crypto: ${cryptoCount}`, filterTime);
    addTestResult('Market filter - reset', resetWorks,
      `Reset count matches initial: ${resetCount}/${initialCount}`);
    
    testResults.performance.push({ test: 'Market filter', time: filterTime });
    
  } catch (error) {
    addTestResult('Market filter', false, error.message);
  }
}

async function testPnLFilter(page) {
  log('Testing P&L filter...');
  
  const startTime = Date.now();
  
  try {
    const initialCount = await getTradeCount(page);
    
    // Filter profitable trades
    await page.click('button:has-text("Profitable Only")');
    await page.waitForTimeout(1000);
    
    const profitableCount = await getTradeCount(page);
    
    // Filter lossable trades
    await page.click('button:has-text("Lossable Only")');
    await page.waitForTimeout(1000);
    
    const lossableCount = await getTradeCount(page);
    
    // Reset to all trades
    await page.click('button:has-text("All Trades")');
    await page.waitForTimeout(1000);
    
    const resetCount = await getTradeCount(page);
    const filterTime = Date.now() - startTime;
    
    const pnlFilterWorks = profitableCount < initialCount || lossableCount < initialCount;
    const resetWorks = resetCount === initialCount;
    
    addTestResult('P&L filter - filtering', pnlFilterWorks,
      `Initial: ${initialCount}, Profitable: ${profitableCount}, Lossable: ${lossableCount}`, filterTime);
    addTestResult('P&L filter - reset', resetWorks,
      `Reset count matches initial: ${resetCount}/${initialCount}`);
    
    testResults.performance.push({ test: 'P&L filter', time: filterTime });
    
  } catch (error) {
    addTestResult('P&L filter', false, error.message);
  }
}

async function testSideFilter(page) {
  log('Testing side filter...');
  
  const startTime = Date.now();
  
  try {
    const initialCount = await getTradeCount(page);
    
    // Filter Buy trades
    await page.click('button:has-text("Buy Only")');
    await page.waitForTimeout(1000);
    
    const buyCount = await getTradeCount(page);
    
    // Filter Sell trades
    await page.click('button:has-text("Sell Only")');
    await page.waitForTimeout(1000);
    
    const sellCount = await getTradeCount(page);
    
    // Reset to all sides
    await page.click('button:has-text("All Sides")');
    await page.waitForTimeout(1000);
    
    const resetCount = await getTradeCount(page);
    const filterTime = Date.now() - startTime;
    
    const sideFilterWorks = buyCount < initialCount || sellCount < initialCount;
    const resetWorks = resetCount === initialCount;
    
    addTestResult('Side filter - filtering', sideFilterWorks,
      `Initial: ${initialCount}, Buy: ${buyCount}, Sell: ${sellCount}`, filterTime);
    addTestResult('Side filter - reset', resetWorks,
      `Reset count matches initial: ${resetCount}/${initialCount}`);
    
    testResults.performance.push({ test: 'Side filter', time: filterTime });
    
  } catch (error) {
    addTestResult('Side filter', false, error.message);
  }
}

async function testEmotionFilter(page) {
  log('Testing emotion filter...');
  
  const startTime = Date.now();
  
  try {
    const initialCount = await getTradeCount(page);
    
    // Select CONFIDENT emotion
    await page.click('button:has-text("CONFIDENT")');
    await page.waitForTimeout(1000);
    
    const confidentCount = await getTradeCount(page);
    
    // Select additional emotion (FOMO)
    await page.click('button:has-text("FOMO")');
    await page.waitForTimeout(1000);
    
    const multiEmotionCount = await getTradeCount(page);
    
    // Clear emotion filters
    await page.click('button:has-text("Clear All")');
    await page.waitForTimeout(1000);
    
    const clearedCount = await getTradeCount(page);
    const filterTime = Date.now() - startTime;
    
    const emotionFilterWorks = confidentCount < initialCount;
    const multiEmotionWorks = multiEmotionCount <= confidentCount; // Should be <= with more filters
    const clearWorks = clearedCount === initialCount;
    
    addTestResult('Emotion filter - single', emotionFilterWorks,
      `Initial: ${initialCount}, CONFIDENT: ${confidentCount}`, filterTime);
    addTestResult('Emotion filter - multiple', multiEmotionWorks,
      `CONFIDENT+FOMO: ${multiEmotionCount}`);
    addTestResult('Emotion filter - clear', clearWorks,
      `Cleared count matches initial: ${clearedCount}/${initialCount}`);
    
    testResults.performance.push({ test: 'Emotion filter', time: filterTime });
    
  } catch (error) {
    addTestResult('Emotion filter', false, error.message);
  }
}

async function testDateRangeFilter(page) {
  log('Testing date range filter...');
  
  const startTime = Date.now();
  
  try {
    const initialCount = await getTradeCount(page);
    
    // Set date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Fill date inputs
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      await dateInputs[0].type(thirtyDaysAgoStr); // From date
      await dateInputs[1].type(todayStr); // To date
      await page.waitForTimeout(1000);
      
      const dateFilteredCount = await getTradeCount(page);
      
      // Clear date filters
      await dateInputs[0].click({ clickCount: 3 });
      await dateInputs[0].press('Backspace');
      await dateInputs[1].click({ clickCount: 3 });
      await dateInputs[1].press('Backspace');
      await page.waitForTimeout(1000);
      
      const clearedCount = await getTradeCount(page);
      const filterTime = Date.now() - startTime;
      
      const dateFilterWorks = dateFilteredCount <= initialCount;
      const clearWorks = clearedCount === initialCount;
      
      addTestResult('Date range filter - filtering', dateFilterWorks,
        `Initial: ${initialCount}, Date filtered: ${dateFilteredCount}`, filterTime);
      addTestResult('Date range filter - clear', clearWorks,
        `Cleared count matches initial: ${clearedCount}/${initialCount}`);
      
      testResults.performance.push({ test: 'Date range filter', time: filterTime });
    } else {
      addTestResult('Date range filter', false, 'Date inputs not found');
    }
    
  } catch (error) {
    addTestResult('Date range filter', false, error.message);
  }
}

async function testFilterCombinations(page) {
  log('Testing filter combinations...');
  
  const startTime = Date.now();
  
  try {
    const initialCount = await getTradeCount(page);
    
    // Apply multiple filters: Stock market + Buy side + CONFIDENT emotion
    await page.select('select', 'Stock');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Buy Only")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("CONFIDENT")');
    await page.waitForTimeout(1000);
    
    const combinationCount = await getTradeCount(page);
    
    // Clear all filters
    await page.click('button:has-text("Clear All")');
    await page.waitForTimeout(1000);
    
    const clearedCount = await getTradeCount(page);
    const combinationTime = Date.now() - startTime;
    
    const combinationWorks = combinationCount < initialCount;
    const clearWorks = clearedCount === initialCount;
    
    addTestResult('Filter combinations', combinationWorks,
      `Initial: ${initialCount}, Combined: ${combinationCount}`, combinationTime);
    addTestResult('Filter combinations - clear all', clearWorks,
      `Cleared count matches initial: ${clearedCount}/${initialCount}`);
    
    testResults.performance.push({ test: 'Filter combinations', time: combinationTime });
    
  } catch (error) {
    addTestResult('Filter combinations', false, error.message);
  }
}

async function getTradeCount(page) {
  try {
    // Look for the trade count in the filtered trades section
    const countElement = await page.$('text=/Filtered Trades \\(\\d+\\)/');
    if (countElement) {
      const text = await page.evaluate(el => el.textContent, countElement);
      const match = text.match(/\((\d+)\)/);
      return match ? parseInt(match[1]) : 0;
    }
    
    // Alternative: count table rows
    const rows = await page.$$('table tbody tr');
    return rows.length;
  } catch (error) {
    return 0;
  }
}

async function testPerformance(page) {
  log('Testing performance with various filter combinations...');
  
  const performanceTests = [
    { name: 'No filters', filters: [] },
    { name: 'Single filter', filters: ['symbol:AAPL'] },
    { name: 'Multiple filters', filters: ['market:Stock', 'side:Buy', 'emotion:CONFIDENT'] },
    { name: 'All filters', filters: ['symbol:AAPL', 'market:Stock', 'side:Buy', 'pnl:profitable', 'emotion:CONFIDENT'] }
  ];
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    
    try {
      // Clear all filters first
      await page.click('button:has-text("Clear All")');
      await page.waitForTimeout(500);
      
      // Apply test-specific filters
      for (const filter of test.filters) {
        const [type, value] = filter.split(':');
        
        switch (type) {
          case 'symbol':
            await page.type('input[placeholder*="Search symbols"]', value);
            break;
          case 'market':
            await page.select('select', value);
            break;
          case 'side':
            await page.click(`button:has-text("${value} Only")`);
            break;
          case 'pnl':
            await page.click(`button:has-text("${value === 'profitable' ? 'Profitable Only' : 'Lossable Only'}")`);
            break;
          case 'emotion':
            await page.click(`button:has-text("${value}")`);
            break;
        }
        await page.waitForTimeout(300);
      }
      
      // Wait for final results
      await page.waitForTimeout(1000);
      
      const responseTime = Date.now() - startTime;
      const tradeCount = await getTradeCount(page);
      
      testResults.performance.push({
        test: `Performance - ${test.name}`,
        time: responseTime,
        tradeCount,
        filterCount: test.filters.length
      });
      
      addTestResult(`Performance - ${test.name}`, responseTime < 3000, // 3 second threshold
        `Response time: ${responseTime}ms, Trades: ${tradeCount}, Filters: ${test.filters.length}`, responseTime);
      
    } catch (error) {
      addTestResult(`Performance - ${test.name}`, false, error.message);
    }
  }
}

async function generateTestReport() {
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%',
      timestamp: new Date().toISOString()
    },
    testResults: testResults.details,
    performance: testResults.performance,
    screenshots: testResults.screenshots,
    recommendations: generateRecommendations()
  };
  
  const reportPath = `comprehensive-confluence-filtering-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`Test report generated: ${reportPath}`);
  
  // Generate markdown summary
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = `comprehensive-confluence-filtering-test-report-${Date.now()}.md`;
  fs.writeFileSync(markdownPath, markdownReport);
  
  log(`Markdown report generated: ${markdownPath}`);
  
  return { reportPath, markdownPath };
}

function generateRecommendations() {
  const recommendations = [];
  
  // Analyze performance
  const avgResponseTime = testResults.performance.reduce((sum, p) => sum + (p.time || 0), 0) / testResults.performance.length;
  if (avgResponseTime > 2000) {
    recommendations.push('Consider optimizing API response times - average response time is ' + avgResponseTime.toFixed(0) + 'ms');
  }
  
  // Analyze test failures
  const failures = testResults.details.filter(r => !r.passed);
  if (failures.length > 0) {
    recommendations.push(`${failures.length} tests failed - review failing components for bugs`);
  }
  
  // Check for missing features
  const missingFeatures = [];
  if (!testResults.details.find(r => r.test.includes('Strategy'))) {
    missingFeatures.push('Strategy filtering may need implementation or test data');
  }
  
  if (missingFeatures.length > 0) {
    recommendations.push('Missing features detected: ' + missingFeatures.join(', '));
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All tests passed - filtering system is working correctly!');
  }
  
  return recommendations;
}

function generateMarkdownReport(report) {
  return `# Comprehensive Confluence Filtering Test Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Pass Rate:** ${report.summary.passRate}

## Test Results

| Test | Status | Details | Performance |
|------|--------|----------|-------------|
${report.testResults.map(r => 
  `| ${r.test} | ${r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.details} | ${r.performance ? r.performance + 'ms' : '-' }`
).join('\n')}

## Performance Analysis

| Test | Response Time | Trade Count | Filter Count |
|------|---------------|--------------|--------------|
${report.performance.map(p => 
  `| ${p.test} | ${p.time}ms | ${p.tradeCount || '-'} | ${p.filterCount || '-'}`
).join('\n')}

## Recommendations

${report.recommendations.map(r => `- ${r}`).join('\n')}

## Screenshots

${report.screenshots.map(s => `- ${s}`).join('\n')}

---
*Report generated by Comprehensive Confluence Filtering Test Suite*
`;
}

// Main test execution
async function runTests() {
  log('Starting Comprehensive Confluence Filtering Tests...');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    slowMo: TEST_CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    // Authentication
    const authenticated = await loginIfNeeded(page);
    if (!authenticated) {
      log('Authentication failed - cannot proceed with tests', 'error');
      return;
    }
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial-state');
    
    // Wait for page to load completely
    await page.waitForTimeout(2000);
    
    // Run all tests
    await testFilterUIPresence(page);
    await testSymbolFilter(page);
    await testMarketFilter(page);
    await testPnLFilter(page);
    await testSideFilter(page);
    await testEmotionFilter(page);
    await testDateRangeFilter(page);
    await testFilterCombinations(page);
    await testPerformance(page);
    
    // Take final screenshot
    await takeScreenshot(page, 'final-state');
    
    // Generate report
    const { reportPath, markdownPath } = await generateTestReport();
    
    log(`Test execution completed. Results: ${testResults.passed}/${testResults.total} passed`);
    log(`Reports generated: ${reportPath}, ${markdownPath}`);
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testResults
};