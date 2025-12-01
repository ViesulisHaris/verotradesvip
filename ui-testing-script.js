const { chromium } = require('playwright');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS_FILE = 'ui-testing-results.json';
const SCREENSHOT_DIR = 'ui-test-screenshots';

// Test configuration
const TEST_CONFIG = {
  // Login credentials for the test user
  loginCredentials: {
    email: 'test@example.com',
    password: 'testpassword123'
  },
  // Expected data based on database verification
  expectedData: {
    totalTrades: 200,
    winRate: 71, // Expected ~71% win rate
    markets: ['Stock', 'Crypto', 'Forex', 'Futures'],
    emotions: ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL']
  },
  // Performance thresholds
  performanceThresholds: {
    pageLoadTime: 5000, // 5 seconds max page load time
    dataRenderTime: 3000, // 3 seconds max data rendering time
    totalTestTime: 60000 // 60 seconds total test time
  }
};

// Test results structure
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    performanceIssues: [],
    criticalErrors: []
  },
  pages: {
    trades: {},
    dashboard: {},
    confluence: {},
    calendar: {},
    strategies: {}
  },
  screenshots: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

function createScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

function saveResults() {
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  log(`Test results saved to ${TEST_RESULTS_FILE}`);
}

async function takeScreenshot(page, name, description) {
  try {
    const screenshotPath = `${SCREENSHOT_DIR}/${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push({
      path: screenshotPath,
      name,
      description,
      timestamp: new Date().toISOString()
    });
    log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function measurePerformance(page, actionName, action) {
  const startTime = Date.now();
  const result = await action();
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  log(`${actionName} completed in ${duration}ms`);
  
  if (duration > TEST_CONFIG.performanceThresholds.pageLoadTime && actionName.includes('load')) {
    testResults.summary.performanceIssues.push({
      action: actionName,
      duration,
      threshold: TEST_CONFIG.performanceThresholds.pageLoadTime
    });
  }
  
  return { result, duration };
}

async function login(page) {
  log('Attempting to login...');
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_CONFIG.loginCredentials.email);
    await page.fill('input[type="password"]', TEST_CONFIG.loginCredentials.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL(/\/dashboard|\/trades/, { timeout: 10000 });
    
    log('Login successful');
    return true;
  } catch (error) {
    log(`Login failed: ${error.message}`, 'error');
    return false;
  }
}

// Page testing functions
async function testTradesPage(page) {
  log('Testing Trades page...');
  const pageTest = {
    name: 'Trades Page',
    tests: [],
    performance: {},
    dataVerification: {}
  };
  
  try {
    // Navigate to trades page
    const { result, duration } = await measurePerformance(page, 'Trades page load', async () => {
      await page.goto(`${BASE_URL}/trades`);
      await page.waitForLoadState('networkidle');
      return true;
    });
    
    pageTest.performance.pageLoadTime = duration;
    
    // Take screenshot
    await takeScreenshot(page, 'trades-page', 'Trades page after load');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="trades-container"], .glass, .trade-item', { timeout: 10000 });
    
    // Test 1: Verify total trades count
    const { result: countResult, duration: countDuration } = await measurePerformance(page, 'Trades count verification', async () => {
      const tradesCount = await page.locator('.trade-item, [data-testid="trade-row"]').count();
      const totalTradesText = await page.locator('text=/Total Trades/').textContent();
      
      // Extract number from text like "Total Trades 200"
      const extractedCount = totalTradesText ? parseInt(totalTradesText.match(/\d+/)?.[0] || '0') : 0;
      
      return {
        actualCount: tradesCount,
        displayedCount: extractedCount,
        expectedCount: TEST_CONFIG.expectedData.totalTrades
      };
    });
    
    pageTest.tests.push({
      name: 'Total Trades Count',
      status: countResult.actualCount >= TEST_CONFIG.expectedData.totalTrades || countResult.displayedCount === TEST_CONFIG.expectedData.totalTrades ? 'PASS' : 'FAIL',
      details: countResult,
      duration: countDuration
    });
    
    // Test 2: Verify trade data display
    const { result: dataResult, duration: dataDuration } = await measurePerformance(page, 'Trade data display verification', async () => {
      const firstTrade = page.locator('.trade-item, [data-testid="trade-row"]').first();
      const hasSymbol = await firstTrade.locator('text=/AAPL|BTC|EUR|USD/').count() > 0;
      const hasPnL = await firstTrade.locator('text=/\\$|\\-|\\+/').count() > 0;
      const hasMarket = await firstTrade.locator('text=/Stock|Crypto|Forex|Futures/').count() > 0;
      
      return {
        hasSymbol,
        hasPnL,
        hasMarket,
        hasEmotionalState: await firstTrade.locator('text=/FOMO|CONFIDENT|PATIENT/').count() > 0
      };
    });
    
    pageTest.tests.push({
      name: 'Trade Data Display',
      status: dataResult.hasSymbol && dataResult.hasPnL && dataResult.hasMarket ? 'PASS' : 'FAIL',
      details: dataResult,
      duration: dataDuration
    });
    
    // Test 3: Verify emotional states are displayed
    const { result: emotionResult, duration: emotionDuration } = await measurePerformance(page, 'Emotional states display', async () => {
      // Expand first trade to see details
      const expandButton = page.locator('button[aria-label*="expand"], .expand-button, button:has-text("▼")').first();
      if (await expandButton.count() > 0) {
        await expandButton.click();
        await page.waitForTimeout(1000); // Wait for expansion animation
      }
      
      const hasEmotionalData = await page.locator('text=/Emotional State|emotion|FOMO|CONFIDENT/').count() > 0;
      
      return {
        hasEmotionalData,
        emotionalStatesVisible: await page.locator('text=/FOMO|REVENGE|TILT|PATIENCE|DISCIPLINE|CONFIDENT/').count()
      };
    });
    
    pageTest.tests.push({
      name: 'Emotional States Display',
      status: emotionResult.hasEmotionalData ? 'PASS' : 'FAIL',
      details: emotionResult,
      duration: emotionDuration
    });
    
    // Test 4: Verify pagination or scroll functionality
    const { result: paginationResult, duration: paginationDuration } = await measurePerformance(page, 'Pagination/Scroll test', async () => {
      const hasPagination = await page.locator('.pagination, button:has-text("Next"), button:has-text("Previous")').count() > 0;
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const needsScroll = pageHeight > viewportHeight;
      
      return {
        hasPagination,
        needsScroll,
        canScroll: needsScroll
      };
    });
    
    pageTest.tests.push({
      name: 'Pagination/Scroll Functionality',
      status: paginationResult.hasPagination || paginationResult.canScroll ? 'PASS' : 'FAIL',
      details: paginationResult,
      duration: paginationDuration
    });
    
  } catch (error) {
    log(`Error testing trades page: ${error.message}`, 'error');
    pageTest.tests.push({
      name: 'Page Load',
      status: 'FAIL',
      error: error.message
    });
    
    testResults.summary.criticalErrors.push({
      page: 'trades',
      error: error.message
    });
  }
  
  testResults.pages.trades = pageTest;
  return pageTest;
}

async function testDashboardPage(page) {
  log('Testing Dashboard page...');
  const pageTest = {
    name: 'Dashboard Page',
    tests: [],
    performance: {},
    dataVerification: {}
  };
  
  try {
    // Navigate to dashboard page
    const { result, duration } = await measurePerformance(page, 'Dashboard page load', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      return true;
    });
    
    pageTest.performance.pageLoadTime = duration;
    
    // Take screenshot
    await takeScreenshot(page, 'dashboard-page', 'Dashboard page after load');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="pnl"], .stat-card, .glass', { timeout: 10000 });
    
    // Test 1: Verify summary statistics
    const { result: statsResult, duration: statsDuration } = await measurePerformance(page, 'Summary statistics verification', async () => {
      const totalTradesElement = await page.locator('text=/Total Trades/').first();
      const winRateElement = await page.locator('text=/Win Rate/').first();
      const totalPnLElement = await page.locator('text=/Total P&L|P&L/').first();
      
      const totalTradesText = await totalTradesElement.textContent();
      const winRateText = await winRateElement.textContent();
      const totalPnLText = await totalPnLElement.textContent();
      
      const extractedTrades = totalTradesText ? parseInt(totalTradesText.match(/\d+/)?.[0] || '0') : 0;
      const extractedWinRate = winRateText ? parseFloat(winRateText.match(/[\d.]+/)?.[0] || '0') : 0;
      
      return {
        totalTrades: extractedTrades,
        winRate: extractedWinRate,
        hasPnL: totalPnLText && totalPnLText.includes('$'),
        expectedTrades: TEST_CONFIG.expectedData.totalTrades,
        expectedWinRate: TEST_CONFIG.expectedData.winRate
      };
    });
    
    pageTest.tests.push({
      name: 'Summary Statistics',
      status: statsResult.totalTrades === TEST_CONFIG.expectedData.totalTrades && 
               Math.abs(statsResult.winRate - TEST_CONFIG.expectedData.winRate) <= 5 ? 'PASS' : 'FAIL',
      details: statsResult,
      duration: statsDuration
    });
    
    // Test 2: Verify charts render
    const { result: chartsResult, duration: chartsDuration } = await measurePerformance(page, 'Charts rendering verification', async () => {
      const hasPerformanceChart = await page.locator('.performance-chart, canvas, svg').count() > 0;
      const hasEmotionRadar = await page.locator('.emotion-radar, .radar-chart').count() > 0;
      
      return {
        hasPerformanceChart,
        hasEmotionRadar,
        totalCharts: await page.locator('canvas, svg').count()
      };
    });
    
    pageTest.tests.push({
      name: 'Charts Rendering',
      status: chartsResult.hasPerformanceChart ? 'PASS' : 'FAIL',
      details: chartsResult,
      duration: chartsDuration
    });
    
    // Test 3: Verify market distribution
    const { result: marketResult, duration: marketDuration } = await measurePerformance(page, 'Market distribution verification', async () => {
      const hasMarketDistribution = await page.locator('text=/Market Distribution|Market/').count() > 0;
      const marketElements = await page.locator('text=/Stock|Crypto|Forex|Futures/').all();
      
      return {
        hasMarketDistribution,
        marketTypesFound: marketElements.length,
        expectedMarkets: TEST_CONFIG.expectedData.markets
      };
    });
    
    pageTest.tests.push({
      name: 'Market Distribution',
      status: marketResult.hasMarketDistribution ? 'PASS' : 'FAIL',
      details: marketResult,
      duration: marketDuration
    });
    
    // Test 4: Verify strategy performance data
    const { result: strategyResult, duration: strategyDuration } = await measurePerformance(page, 'Strategy performance verification', async () => {
      const hasStrategyData = await page.locator('text=/Strategy|strategy/').count() > 0;
      
      return {
        hasStrategyData
      };
    });
    
    pageTest.tests.push({
      name: 'Strategy Performance Data',
      status: strategyResult.hasStrategyData ? 'PASS' : 'FAIL',
      details: strategyResult,
      duration: strategyDuration
    });
    
  } catch (error) {
    log(`Error testing dashboard page: ${error.message}`, 'error');
    pageTest.tests.push({
      name: 'Page Load',
      status: 'FAIL',
      error: error.message
    });
    
    testResults.summary.criticalErrors.push({
      page: 'dashboard',
      error: error.message
    });
  }
  
  testResults.pages.dashboard = pageTest;
  return pageTest;
}

async function testConfluencePage(page) {
  log('Testing Confluence page...');
  const pageTest = {
    name: 'Confluence Page',
    tests: [],
    performance: {},
    dataVerification: {}
  };
  
  try {
    // Navigate to confluence page
    const { result, duration } = await measurePerformance(page, 'Confluence page load', async () => {
      await page.goto(`${BASE_URL}/confluence`);
      await page.waitForLoadState('networkidle');
      return true;
    });
    
    pageTest.performance.pageLoadTime = duration;
    
    // Take screenshot
    await takeScreenshot(page, 'confluence-page', 'Confluence page after load');
    
    // Wait for data to load
    await page.waitForSelector('.glass, .filter-section, .stat-card', { timeout: 10000 });
    
    // Test 1: Verify emotional analysis displays
    const { result: emotionAnalysisResult, duration: emotionAnalysisDuration } = await measurePerformance(page, 'Emotional analysis verification', async () => {
      const hasEmotionalAnalysis = await page.locator('text=/Emotional State Analysis|Emotion/').count() > 0;
      const hasEmotionRadar = await page.locator('.emotion-radar, .radar-chart').count() > 0;
      const emotionButtons = await page.locator('button:has-text("FOMO"), button:has-text("CONFIDENT"), button:has-text("PATIENT")').all();
      
      return {
        hasEmotionalAnalysis,
        hasEmotionRadar,
        emotionFilterButtons: emotionButtons.length,
        expectedEmotions: TEST_CONFIG.expectedData.emotions
      };
    });
    
    pageTest.tests.push({
      name: 'Emotional Analysis Display',
      status: emotionAnalysisResult.hasEmotionalAnalysis && emotionAnalysisResult.emotionFilterButtons > 0 ? 'PASS' : 'FAIL',
      details: emotionAnalysisResult,
      duration: emotionAnalysisDuration
    });
    
    // Test 2: Verify emotion-based filtering
    const { result: emotionFilterResult, duration: emotionFilterDuration } = await measurePerformance(page, 'Emotion filtering test', async () => {
      // Try to click on FOMO filter button
      const fomoButton = page.locator('button:has-text("FOMO")').first();
      let filterWorked = false;
      
      if (await fomoButton.count() > 0) {
        await fomoButton.click();
        await page.waitForTimeout(2000); // Wait for filter to apply
        
        // Check if filtered results are shown
        const filteredResults = await page.locator('text=/Filtered Trades|Results/').count();
        filterWorked = filteredResults > 0;
      }
      
      return {
        fomoButtonExists: await fomoButton.count() > 0,
        filterApplied: filterWorked
      };
    });
    
    pageTest.tests.push({
      name: 'Emotion-Based Filtering',
      status: emotionFilterResult.fomoButtonExists && emotionFilterResult.filterApplied ? 'PASS' : 'PARTIAL',
      details: emotionFilterResult,
      duration: emotionFilterDuration
    });
    
    // Test 3: Verify analytics calculations
    const { result: analyticsResult, duration: analyticsDuration } = await measurePerformance(page, 'Analytics calculations verification', async () => {
      const hasWinRate = await page.locator('text=/Win Rate/').count() > 0;
      const hasProfitFactor = await page.locator('text=/Profit Factor/').count() > 0;
      const hasTradeExpectancy = await page.locator('text=/Trade Expectancy/').count() > 0;
      
      return {
        hasWinRate,
        hasProfitFactor,
        hasTradeExpectancy,
        hasAdvancedMetrics: await page.locator('text=/Sharpe Ratio|Max Drawdown/').count() > 0
      };
    });
    
    pageTest.tests.push({
      name: 'Analytics Calculations',
      status: analyticsResult.hasWinRate && analyticsResult.hasProfitFactor ? 'PASS' : 'FAIL',
      details: analyticsResult,
      duration: analyticsDuration
    });
    
    // Test 4: Verify filter functionality
    const { result: filterResult, duration: filterDuration } = await measurePerformance(page, 'Filter functionality test', async () => {
      const hasMarketFilter = await page.locator('select, option:has-text("Market")').count() > 0;
      const hasSymbolFilter = await page.locator('input[placeholder*="symbol"], input[placeholder*="Symbol"]').count() > 0;
      const hasDateFilter = await page.locator('input[type="date"]').count() > 0;
      
      return {
        hasMarketFilter,
        hasSymbolFilter,
        hasDateFilter,
        hasSideFilter: await page.locator('select:has-text("Side"), option:has-text("Buy")').count() > 0
      };
    });
    
    pageTest.tests.push({
      name: 'Filter Functionality',
      status: filterResult.hasMarketFilter && filterResult.hasSymbolFilter ? 'PASS' : 'FAIL',
      details: filterResult,
      duration: filterDuration
    });
    
  } catch (error) {
    log(`Error testing confluence page: ${error.message}`, 'error');
    pageTest.tests.push({
      name: 'Page Load',
      status: 'FAIL',
      error: error.message
    });
    
    testResults.summary.criticalErrors.push({
      page: 'confluence',
      error: error.message
    });
  }
  
  testResults.pages.confluence = pageTest;
  return pageTest;
}

async function testOtherPages(page) {
  log('Testing other pages (Calendar, Strategies)...');
  
  // Test Calendar page
  const calendarTest = { name: 'Calendar Page', tests: [] };
  try {
    const { result, duration } = await measurePerformance(page, 'Calendar page load', async () => {
      await page.goto(`${BASE_URL}/calendar`);
      await page.waitForLoadState('networkidle');
      return true;
    });
    
    await takeScreenshot(page, 'calendar-page', 'Calendar page after load');
    
    const hasCalendar = await page.locator('.calendar, .date-picker, .month-view').count() > 0;
    const hasTradeData = await page.locator('text=/trade|Trade|pnl|P&L/').count() > 0;
    
    calendarTest.tests.push({
      name: 'Calendar Display',
      status: hasCalendar ? 'PASS' : 'FAIL',
      details: { hasCalendar, hasTradeData },
      duration
    });
    
    calendarTest.performance = { pageLoadTime: duration };
  } catch (error) {
    calendarTest.tests.push({
      name: 'Page Load',
      status: 'FAIL',
      error: error.message
    });
  }
  
  // Test Strategies page
  const strategiesTest = { name: 'Strategies Page', tests: [] };
  try {
    const { result, duration } = await measurePerformance(page, 'Strategies page load', async () => {
      await page.goto(`${BASE_URL}/strategies`);
      await page.waitForLoadState('networkidle');
      return true;
    });
    
    await takeScreenshot(page, 'strategies-page', 'Strategies page after load');
    
    const hasStrategies = await page.locator('text=/strategy|Strategy/').count() > 0;
    const hasStrategyList = await page.locator('.strategy-list, .strategy-card').count() > 0;
    
    strategiesTest.tests.push({
      name: 'Strategies Display',
      status: hasStrategies ? 'PASS' : 'FAIL',
      details: { hasStrategies, hasStrategyList },
      duration
    });
    
    strategiesTest.performance = { pageLoadTime: duration };
  } catch (error) {
    strategiesTest.tests.push({
      name: 'Page Load',
      status: 'FAIL',
      error: error.message
    });
  }
  
  testResults.pages.calendar = calendarTest;
  testResults.pages.strategies = strategiesTest;
  
  return { calendarTest, strategiesTest };
}

// Main test execution
async function runUITests() {
  log('Starting UI testing for Trading Journal application...');
  log(`Testing with expected data: ${TEST_CONFIG.expectedData.totalTrades} trades, ${TEST_CONFIG.expectedData.winRate}% win rate`);
  
  const startTime = Date.now();
  
  try {
    // Create screenshot directory
    createScreenshotDir();
    
    // Launch browser
    const browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 100 // Slow down operations for better visibility
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'UI Testing Bot'
    });
    
    const page = await context.newPage();
    
    // Login first
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      log('Login failed, aborting tests', 'error');
      await browser.close();
      return;
    }
    
    // Test each page
    await testTradesPage(page);
    await testDashboardPage(page);
    await testConfluencePage(page);
    await testOtherPages(page);
    
    // Calculate summary
    const allTests = [];
    Object.values(testResults.pages).forEach(page => {
      if (page.tests) {
        allTests.push(...page.tests);
      }
    });
    
    testResults.summary.totalTests = allTests.length;
    testResults.summary.passedTests = allTests.filter(test => test.status === 'PASS').length;
    testResults.summary.failedTests = allTests.filter(test => test.status === 'FAIL').length;
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    log(`UI testing completed in ${totalDuration}ms`);
    log(`Total tests: ${testResults.summary.totalTests}`);
    log(`Passed: ${testResults.summary.passedTests}`);
    log(`Failed: ${testResults.summary.failedTests}`);
    log(`Performance issues: ${testResults.summary.performanceIssues.length}`);
    log(`Critical errors: ${testResults.summary.criticalErrors.length}`);
    
    // Save results
    saveResults();
    
    await browser.close();
    
    return testResults;
    
  } catch (error) {
    log(`UI testing failed: ${error.message}`, 'error');
    testResults.summary.criticalErrors.push({
      error: error.message
    });
    saveResults();
    return testResults;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runUITests().then(results => {
    log('UI testing completed');
    process.exit(results.summary.criticalErrors.length > 0 ? 1 : 0);
  }).catch(error => {
    log(`UI testing failed with error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runUITests, TEST_CONFIG };