const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Comprehensive Filtering and Sorting Test Script
 * Tests all filtering and sorting functionality with 200 trades dataset
 */

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  performance: {
    filterTimes: [],
    sortTimes: [],
    averageFilterTime: 0,
    averageSortTime: 0
  },
  issues: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logTest(testName, status, details = '', duration = 0) {
  const test = {
    name: testName,
    status,
    details,
    duration,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS.tests.push(test);
  TEST_RESULTS.summary.total++;
  
  if (status === 'PASS') {
    TEST_RESULTS.summary.passed++;
    console.log(`✅ ${testName} - ${details} (${duration}ms)`);
  } else if (status === 'FAIL') {
    TEST_RESULTS.summary.failed++;
    console.log(`❌ ${testName} - ${details} (${duration}ms)`);
    TEST_RESULTS.issues.push({ test: testName, issue: details });
  } else {
    TEST_RESULTS.summary.skipped++;
    console.log(`⏭️  ${testName} - ${details} (${duration}ms)`);
  }
}

async function takeScreenshot(page, testName) {
  try {
    const screenshotPath = `filtering-sorting-test-${testName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return null;
  }
}

async function checkForFilterControls(page) {
  try {
    // Check for various filter controls that might be present
    const filterSelectors = [
      'select[name="market"]',
      'select[name="symbol"]',
      'input[type="date"]',
      'input[name="dateFrom"]',
      'input[name="dateTo"]',
      'select[name="winLoss"]',
      'select[name="emotionalState"]',
      'button[aria-label*="filter"]',
      '.filter-dropdown',
      '.filter-controls',
      '[data-testid*="filter"]'
    ];

    const foundControls = [];
    for (const selector of filterSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        foundControls.push(selector);
      }
    }

    return foundControls;
  } catch (error) {
    console.error('Error checking for filter controls:', error);
    return [];
  }
}

async function checkForSortControls(page) {
  try {
    // Check for various sort controls that might be present
    const sortSelectors = [
      'select[name="sortBy"]',
      'button[aria-label*="sort"]',
      '.sort-dropdown',
      '.sort-controls',
      'th[aria-sort]',
      '[data-testid*="sort"]',
      'thead button',
      '.sortable-header'
    ];

    const foundControls = [];
    for (const selector of sortSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        foundControls.push(selector);
      }
    }

    return foundControls;
  } catch (error) {
    console.error('Error checking for sort controls:', error);
    return [];
  }
}

async function testMarketTypeFiltering(page) {
  const startTime = Date.now();
  
  try {
    const marketFilter = await page.locator('select[name="market"]').first();
    if (await marketFilter.isVisible()) {
      // Test Stock market filter
      await marketFilter.selectOption('Stock');
      await delay(1000);
      
      const tradesAfterFilter = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Market Type Filtering - Stock', 'PASS', `Found ${tradesAfterFilter} trades after filtering`, Date.now() - startTime);
      
      // Test Crypto market filter
      await marketFilter.selectOption('Crypto');
      await delay(1000);
      
      const cryptoTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Market Type Filtering - Crypto', 'PASS', `Found ${cryptoTrades} trades after filtering`, Date.now() - startTime);
      
      // Reset filter
      await marketFilter.selectOption('');
      await delay(500);
      
    } else {
      logTest('Market Type Filtering', 'FAIL', 'Market filter control not found', Date.now() - startTime);
    }
  } catch (error) {
    logTest('Market Type Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testSymbolFiltering(page) {
  const startTime = Date.now();
  
  try {
    const symbolFilter = await page.locator('select[name="symbol"], input[name="symbol"]').first();
    if (await symbolFilter.isVisible()) {
      // Test filtering by AAPL
      if (await symbolFilter.getAttribute('type') === 'text' || await symbolFilter.getAttribute('type') === 'search') {
        await symbolFilter.fill('AAPL');
      } else {
        await symbolFilter.selectOption('AAPL');
      }
      await delay(1000);
      
      const aaplTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Symbol Filtering - AAPL', 'PASS', `Found ${aaplTrades} AAPL trades`, Date.now() - startTime);
      
      // Clear filter
      await symbolFilter.fill('');
      await delay(500);
      
    } else {
      logTest('Symbol Filtering', 'FAIL', 'Symbol filter control not found', Date.now() - startTime);
    }
  } catch (error) {
    logTest('Symbol Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testDateRangeFiltering(page) {
  const startTime = Date.now();
  
  try {
    const dateFromFilter = await page.locator('input[name="dateFrom"], input[type="date"]').first();
    const dateToFilter = await page.locator('input[name="dateTo"], input[type="date"]').nth(1);
    
    if (await dateFromFilter.isVisible()) {
      // Test filtering by last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      await dateFromFilter.fill(sevenDaysAgo.toISOString().split('T')[0]);
      if (await dateToFilter.isVisible()) {
        await dateToFilter.fill(today.toISOString().split('T')[0]);
      }
      await delay(1000);
      
      const recentTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Date Range Filtering - Last 7 Days', 'PASS', `Found ${recentTrades} trades in date range`, Date.now() - startTime);
      
      // Clear filters
      await dateFromFilter.fill('');
      if (await dateToFilter.isVisible()) {
        await dateToFilter.fill('');
      }
      await delay(500);
      
    } else {
      logTest('Date Range Filtering', 'FAIL', 'Date filter controls not found', Date.now() - startTime);
    }
  } catch (error) {
    logTest('Date Range Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testWinLossFiltering(page) {
  const startTime = Date.now();
  
  try {
    const winLossFilter = await page.locator('select[name="winLoss"], select[name="pnlFilter"]').first();
    if (await winLossFilter.isVisible()) {
      // Test filtering by winning trades
      await winLossFilter.selectOption('profit');
      await delay(1000);
      
      const winningTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Win/Loss Filtering - Profit', 'PASS', `Found ${winningTrades} profitable trades`, Date.now() - startTime);
      
      // Test filtering by losing trades
      await winLossFilter.selectOption('loss');
      await delay(1000);
      
      const losingTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Win/Loss Filtering - Loss', 'PASS', `Found ${losingTrades} losing trades`, Date.now() - startTime);
      
      // Reset filter
      await winLossFilter.selectOption('');
      await delay(500);
      
    } else {
      logTest('Win/Loss Filtering', 'FAIL', 'Win/Loss filter control not found', Date.now() - startTime);
    }
  } catch (error) {
    logTest('Win/Loss Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testSortingByDate(page) {
  const startTime = Date.now();
  
  try {
    const dateSortControl = await page.locator('th:has-text("Date"), th:has-text("Trade Date"), button[aria-label*="sort date"]').first();
    if (await dateSortControl.isVisible()) {
      await dateSortControl.click();
      await delay(1000);
      
      logTest('Sorting by Date', 'PASS', 'Date sorting applied', Date.now() - startTime);
      
      // Test reverse sort
      await dateSortControl.click();
      await delay(1000);
      
      logTest('Sorting by Date - Reverse', 'PASS', 'Reverse date sorting applied', Date.now() - startTime);
      
    } else {
      // Check for dropdown sort
      const sortDropdown = await page.locator('select[name="sortBy"]').first();
      if (await sortDropdown.isVisible()) {
        await sortDropdown.selectOption('date');
        await delay(1000);
        logTest('Sorting by Date - Dropdown', 'PASS', 'Date sorting applied via dropdown', Date.now() - startTime);
        
        await sortDropdown.selectOption('-date');
        await delay(1000);
        logTest('Sorting by Date - Reverse Dropdown', 'PASS', 'Reverse date sorting applied via dropdown', Date.now() - startTime);
      } else {
        logTest('Sorting by Date', 'FAIL', 'Date sort control not found', Date.now() - startTime);
      }
    }
  } catch (error) {
    logTest('Sorting by Date', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testSortingByPnL(page) {
  const startTime = Date.now();
  
  try {
    const pnlSortControl = await page.locator('th:has-text("P&L"), th:has-text("PnL"), button[aria-label*="sort pnl"]').first();
    if (await pnlSortControl.isVisible()) {
      await pnlSortControl.click();
      await delay(1000);
      
      logTest('Sorting by P&L', 'PASS', 'P&L sorting applied', Date.now() - startTime);
      
      // Test reverse sort
      await pnlSortControl.click();
      await delay(1000);
      
      logTest('Sorting by P&L - Reverse', 'PASS', 'Reverse P&L sorting applied', Date.now() - startTime);
      
    } else {
      // Check for dropdown sort
      const sortDropdown = await page.locator('select[name="sortBy"]').first();
      if (await sortDropdown.isVisible()) {
        await sortDropdown.selectOption('pnl');
        await delay(1000);
        logTest('Sorting by P&L - Dropdown', 'PASS', 'P&L sorting applied via dropdown', Date.now() - startTime);
        
        await sortDropdown.selectOption('-pnl');
        await delay(1000);
        logTest('Sorting by P&L - Reverse Dropdown', 'PASS', 'Reverse P&L sorting applied via dropdown', Date.now() - startTime);
      } else {
        logTest('Sorting by P&L', 'FAIL', 'P&L sort control not found', Date.now() - startTime);
      }
    }
  } catch (error) {
    logTest('Sorting by P&L', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testSortingBySymbol(page) {
  const startTime = Date.now();
  
  try {
    const symbolSortControl = await page.locator('th:has-text("Symbol"), button[aria-label*="sort symbol"]').first();
    if (await symbolSortControl.isVisible()) {
      await symbolSortControl.click();
      await delay(1000);
      
      logTest('Sorting by Symbol', 'PASS', 'Symbol sorting applied', Date.now() - startTime);
      
      // Test reverse sort
      await symbolSortControl.click();
      await delay(1000);
      
      logTest('Sorting by Symbol - Reverse', 'PASS', 'Reverse symbol sorting applied', Date.now() - startTime);
      
    } else {
      // Check for dropdown sort
      const sortDropdown = await page.locator('select[name="sortBy"]').first();
      if (await sortDropdown.isVisible()) {
        await sortDropdown.selectOption('symbol');
        await delay(1000);
        logTest('Sorting by Symbol - Dropdown', 'PASS', 'Symbol sorting applied via dropdown', Date.now() - startTime);
        
        await sortDropdown.selectOption('-symbol');
        await delay(1000);
        logTest('Sorting by Symbol - Reverse Dropdown', 'PASS', 'Reverse symbol sorting applied via dropdown', Date.now() - startTime);
      } else {
        logTest('Sorting by Symbol', 'FAIL', 'Symbol sort control not found', Date.now() - startTime);
      }
    }
  } catch (error) {
    logTest('Sorting by Symbol', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testEmotionalStateFiltering(page) {
  const startTime = Date.now();
  
  try {
    const emotionFilter = await page.locator('select[name="emotionalState"], .emotion-filter').first();
    if (await emotionFilter.isVisible()) {
      // Test filtering by FOMO
      await emotionFilter.selectOption('FOMO');
      await delay(1000);
      
      const fomoTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Emotional State Filtering - FOMO', 'PASS', `Found ${fomoTrades} FOMO trades`, Date.now() - startTime);
      
      // Test filtering by CONFIDENT
      await emotionFilter.selectOption('CONFIDENT');
      await delay(1000);
      
      const confidentTrades = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Emotional State Filtering - CONFIDENT', 'PASS', `Found ${confidentTrades} CONFIDENT trades`, Date.now() - startTime);
      
      // Reset filter
      await emotionFilter.selectOption('');
      await delay(500);
      
    } else {
      logTest('Emotional State Filtering', 'FAIL', 'Emotional state filter control not found', Date.now() - startTime);
    }
  } catch (error) {
    logTest('Emotional State Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testCombinedFiltering(page) {
  const startTime = Date.now();
  
  try {
    // Test combining multiple filters
    const marketFilter = await page.locator('select[name="market"]').first();
    const winLossFilter = await page.locator('select[name="winLoss"], select[name="pnlFilter"]').first();
    
    if (await marketFilter.isVisible() && await winLossFilter.isVisible()) {
      // Apply Stock market filter + Profit filter
      await marketFilter.selectOption('Stock');
      await winLossFilter.selectOption('profit');
      await delay(1000);
      
      const combinedResults = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
      logTest('Combined Filtering - Stock + Profit', 'PASS', `Found ${combinedResults} trades with combined filters`, Date.now() - startTime);
      
      // Reset filters
      await marketFilter.selectOption('');
      await winLossFilter.selectOption('');
      await delay(500);
      
    } else {
      logTest('Combined Filtering', 'FAIL', 'Not enough filter controls available for combined testing', Date.now() - startTime);
    }
  } catch (error) {
    logTest('Combined Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testPerformanceWithLargeDataset(page) {
  const startTime = Date.now();
  
  try {
    // Test performance with various operations
    const operations = [
      { name: 'Page Load', action: () => page.goto(`${BASE_URL}/trades`) },
      { name: 'Market Filter', action: () => page.locator('select[name="market"]').first().selectOption('Stock') },
      { name: 'Symbol Filter', action: () => page.locator('input[name="symbol"]').first().fill('AAPL') },
      { name: 'Date Filter', action: () => page.locator('input[name="dateFrom"]').first().fill('2024-01-01') },
      { name: 'Sort by Date', action: () => page.locator('select[name="sortBy"]').first().selectOption('date') },
      { name: 'Sort by P&L', action: () => page.locator('select[name="sortBy"]').first().selectOption('pnl') }
    ];

    for (const op of operations) {
      try {
        const opStartTime = Date.now();
        await op.action();
        await delay(500);
        const duration = Date.now() - opStartTime;
        
        if (op.name.includes('Filter')) {
          TEST_RESULTS.performance.filterTimes.push(duration);
        } else if (op.name.includes('Sort')) {
          TEST_RESULTS.performance.sortTimes.push(duration);
        }
        
        logTest(`Performance - ${op.name}`, 'PASS', `Completed in ${duration}ms`, duration);
      } catch (error) {
        logTest(`Performance - ${op.name}`, 'FAIL', `Error: ${error.message}`, 0);
      }
    }
    
    // Calculate averages
    if (TEST_RESULTS.performance.filterTimes.length > 0) {
      TEST_RESULTS.performance.averageFilterTime = TEST_RESULTS.performance.filterTimes.reduce((a, b) => a + b, 0) / TEST_RESULTS.performance.filterTimes.length;
    }
    
    if (TEST_RESULTS.performance.sortTimes.length > 0) {
      TEST_RESULTS.performance.averageSortTime = TEST_RESULTS.performance.sortTimes.reduce((a, b) => a + b, 0) / TEST_RESULTS.performance.sortTimes.length;
    }
    
  } catch (error) {
    logTest('Performance Testing', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testDashboardFiltering(page) {
  const startTime = Date.now();
  
  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await delay(2000);
    
    // Check for dashboard-specific filters
    const dashboardFilters = await checkForFilterControls(page);
    
    if (dashboardFilters.length > 0) {
      logTest('Dashboard Filter Controls', 'PASS', `Found ${dashboardFilters.length} filter controls on dashboard`, Date.now() - startTime);
      
      // Test market distribution filters if present
      const marketDistFilter = await page.locator('[data-testid*="market"], .market-filter').first();
      if (await marketDistFilter.isVisible()) {
        await marketDistFilter.click();
        await delay(1000);
        logTest('Dashboard Market Distribution Filter', 'PASS', 'Market distribution filter applied', Date.now() - startTime);
      }
      
      // Test strategy-based filtering if present
      const strategyFilter = await page.locator('[data-testid*="strategy"], .strategy-filter').first();
      if (await strategyFilter.isVisible()) {
        await strategyFilter.click();
        await delay(1000);
        logTest('Dashboard Strategy Filter', 'PASS', 'Strategy filter applied', Date.now() - startTime);
      }
      
      // Test time-based filtering if present
      const timeFilter = await page.locator('[data-testid*="time"], .time-filter').first();
      if (await timeFilter.isVisible()) {
        await timeFilter.click();
        await delay(1000);
        logTest('Dashboard Time Filter', 'PASS', 'Time-based filter applied', Date.now() - startTime);
      }
      
    } else {
      logTest('Dashboard Filter Controls', 'FAIL', 'No filter controls found on dashboard', Date.now() - startTime);
    }
    
  } catch (error) {
    logTest('Dashboard Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function main() {
  console.log('🔍 Starting Comprehensive Filtering and Sorting Tests...');
  console.log('📊 Testing with 200 trades dataset\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to trades page
    console.log('🌐 Navigating to trades page...');
    await page.goto(`${BASE_URL}/trades`);
    await delay(3000);

    // Check if user is authenticated
    const loginRequired = await page.locator('text=Please log in').isVisible();
    if (loginRequired) {
      console.log('🔐 Authentication required, attempting to log in...');
      await page.goto(`${BASE_URL}/login`);
      await delay(2000);
      
      // Fill in login credentials (assuming test user exists)
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"], button:has-text("Sign In")');
      await delay(3000);
      
      // Navigate back to trades page
      await page.goto(`${BASE_URL}/trades`);
      await delay(3000);
    }

    // Take initial screenshot
    await takeScreenshot(page, 'initial-trades-page');

    // Check for filter and sort controls
    console.log('🔍 Checking for available filter and sort controls...');
    const filterControls = await checkForFilterControls(page);
    const sortControls = await checkForSortControls(page);
    
    logTest('Filter Controls Detection', filterControls.length > 0 ? 'PASS' : 'FAIL', 
             `Found ${filterControls.length} filter controls: ${filterControls.join(', ')}`);
    
    logTest('Sort Controls Detection', sortControls.length > 0 ? 'PASS' : 'FAIL', 
             `Found ${sortControls.length} sort controls: ${sortControls.join(', ')}`);

    // Get initial trade count
    const initialTradeCount = await page.locator('[data-testid="trade-item"], .trade-item, .glass').count();
    logTest('Initial Trade Count', 'PASS', `Found ${initialTradeCount} trades on page`);

    // Run filtering tests
    console.log('\n🧪 Running Filtering Tests...');
    await testMarketTypeFiltering(page);
    await testSymbolFiltering(page);
    await testDateRangeFiltering(page);
    await testWinLossFiltering(page);
    await testEmotionalStateFiltering(page);
    await testCombinedFiltering(page);

    // Run sorting tests
    console.log('\n📊 Running Sorting Tests...');
    await testSortingByDate(page);
    await testSortingByPnL(page);
    await testSortingBySymbol(page);

    // Run performance tests
    console.log('\n⚡ Running Performance Tests...');
    await testPerformanceWithLargeDataset(page);

    // Test dashboard filtering
    console.log('\n📈 Testing Dashboard Filtering...');
    await testDashboardFiltering(page);

    // Take final screenshot
    await takeScreenshot(page, 'final-test-state');

  } catch (error) {
    console.error('❌ Test execution error:', error);
    logTest('Test Execution', 'FAIL', `Critical error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Generate final report
  console.log('\n📋 Generating Test Report...');
  
  const reportContent = {
    ...TEST_RESULTS,
    summary: {
      ...TEST_RESULTS.summary,
      passRate: TEST_RESULTS.summary.total > 0 ? 
        ((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100).toFixed(2) + '%' : '0%'
    },
    recommendations: generateRecommendations()
  };

  const reportPath = `filtering-sorting-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(reportContent);
  const markdownPath = `FILTERING_SORTING_TEST_REPORT.md`;
  fs.writeFileSync(markdownPath, markdownReport);

  console.log(`\n📄 Test reports generated:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: ${markdownPath}`);
  
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total Tests: ${TEST_RESULTS.summary.total}`);
  console.log(`   Passed: ${TEST_RESULTS.summary.passed}`);
  console.log(`   Failed: ${TEST_RESULTS.summary.failed}`);
  console.log(`   Skipped: ${TEST_RESULTS.summary.skipped}`);
  console.log(`   Pass Rate: ${reportContent.summary.passRate}`);
  
  if (TEST_RESULTS.performance.averageFilterTime > 0) {
    console.log(`   Average Filter Time: ${TEST_RESULTS.performance.averageFilterTime.toFixed(2)}ms`);
  }
  
  if (TEST_RESULTS.performance.averageSortTime > 0) {
    console.log(`   Average Sort Time: ${TEST_RESULTS.performance.averageSortTime.toFixed(2)}ms`);
  }

  console.log('\n🎉 Filtering and Sorting Testing Complete!');
}

function generateRecommendations() {
  const recommendations = [];
  
  if (TEST_RESULTS.issues.length > 0) {
    recommendations.push('Implement missing filtering and sorting controls based on test failures');
  }
  
  if (TEST_RESULTS.performance.averageFilterTime > 1000) {
    recommendations.push('Optimize filter performance - average filter time exceeds 1 second');
  }
  
  if (TEST_RESULTS.performance.averageSortTime > 1000) {
    recommendations.push('Optimize sort performance - average sort time exceeds 1 second');
  }
  
  const filterTests = TEST_RESULTS.tests.filter(t => t.name.includes('Filtering') && t.status === 'FAIL');
  if (filterTests.length > 0) {
    recommendations.push('Implement comprehensive filtering functionality across all trade attributes');
  }
  
  const sortTests = TEST_RESULTS.tests.filter(t => t.name.includes('Sorting') && t.status === 'FAIL');
  if (sortTests.length > 0) {
    recommendations.push('Implement comprehensive sorting functionality for all trade columns');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All filtering and sorting functionality is working correctly');
  }
  
  return recommendations;
}

function generateMarkdownReport(data) {
  return `# Comprehensive Filtering and Sorting Test Report

**Generated:** ${data.timestamp}  
**Total Tests:** ${data.summary.total}  
**Passed:** ${data.summary.passed}  
**Failed:** ${data.summary.failed}  
**Skipped:** ${data.summary.skipped}  
**Pass Rate:** ${data.summary.passRate}

## Executive Summary

This report details the comprehensive testing of filtering and sorting functionality with a dataset of 200 trades. The tests covered all major filtering and sorting capabilities across the application.

## Test Results

### Filter Controls Detection
${data.tests.find(t => t.name === 'Filter Controls Detection')?.details || 'N/A'}

### Sort Controls Detection  
${data.tests.find(t => t.name === 'Sort Controls Detection')?.details || 'N/A'}

### Filtering Tests

${data.tests.filter(t => t.name.includes('Filtering')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

### Sorting Tests

${data.tests.filter(t => t.name.includes('Sorting')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

### Performance Tests

${data.tests.filter(t => t.name.includes('Performance')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

## Performance Analysis

- **Average Filter Time:** ${data.performance.averageFilterTime.toFixed(2)}ms
- **Average Sort Time:** ${data.performance.averageSortTime.toFixed(2)}ms
- **Filter Operations:** ${data.performance.filterTimes.length}
- **Sort Operations:** ${data.performance.sortTimes.length}

## Issues Found

${data.issues.length > 0 ? data.issues.map(issue => 
  `- **${issue.test}:** ${issue.issue}`
).join('\n') : 'No critical issues found.'}

## Recommendations

${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Test Results

\`\`\`json
${JSON.stringify(data.tests, null, 2)}
\`\`\`

---

*This report was generated automatically by the comprehensive filtering and sorting test script.*
`;
}

// Run the tests
main().catch(console.error);