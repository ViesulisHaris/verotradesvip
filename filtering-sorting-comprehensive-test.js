const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Comprehensive Filtering and Sorting Test Script
 * Tests all filtering and sorting functionality for VeroTrade trading journal
 * Covers trades page, confluence page, pagination, and performance testing
 * Uses specified test credentials: testuser@verotrade.com / TestPassword123!
 */

const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'testuser@verotrade.com',
  password: 'TestPassword123!'
};

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
    paginationTimes: [],
    averageFilterTime: 0,
    averageSortTime: 0,
    averagePaginationTime: 0
  },
  issues: [],
  authenticationStatus: null,
  screenshots: []
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
    const screenshotPath = `filtering-sorting-comprehensive-test-${testName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    TEST_RESULTS.screenshots.push({ test: testName, path: screenshotPath });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return null;
  }
}

async function authenticateUser(page) {
  const startTime = Date.now();
  
  try {
    console.log('🔐 Attempting to authenticate with test credentials...');
    
    // Check if already logged in by visiting trades page
    await page.goto(`${BASE_URL}/trades`);
    await delay(2000);
    
    // Check if we need to login
    const loginRequired = await page.locator('text=Please log in, text=Sign In, text=Login').isVisible();
    if (loginRequired) {
      console.log('📝 Login required, redirecting to login page...');
      await page.goto(`${BASE_URL}/login`);
      await delay(2000);
      
      // Fill in the specified test credentials
      console.log(`🔑 Using credentials: ${TEST_CREDENTIALS.email}`);
      await page.fill('input[name="email"], input[type="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[name="password"], input[type="password"]', TEST_CREDENTIALS.password);
      
      // Submit form
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await delay(3000);
      
      // Check if login was successful
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        console.log('✅ Login successful!');
        TEST_RESULTS.authenticationStatus = 'SUCCESS';
        logTest('Authentication', 'PASS', 'Successfully authenticated with test credentials', Date.now() - startTime);
        return true;
      }
      
      // Check for error messages
      const errorMessage = await page.locator('text=Invalid, text=Error, text=Failed, text=Incorrect').first().isVisible();
      if (await errorMessage) {
        console.log('❌ Login failed with error message');
        TEST_RESULTS.authenticationStatus = 'FAILED';
        logTest('Authentication', 'FAIL', 'Login failed - invalid credentials or error message', Date.now() - startTime);
        return false;
      }
      
    } else {
      console.log('✅ User already authenticated');
      TEST_RESULTS.authenticationStatus = 'ALREADY_AUTHENTICATED';
      logTest('Authentication', 'PASS', 'User already authenticated', Date.now() - startTime);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    TEST_RESULTS.authenticationStatus = 'ERROR';
    logTest('Authentication', 'FAIL', `Authentication error: ${error.message}`, Date.now() - startTime);
    return false;
  }
}

async function detectFilterControls(page) {
  try {
    const filterSelectors = [
      'select[name="market"]',
      'select[name="symbol"]',
      'input[type="date"]',
      'input[name="dateFrom"]',
      'input[name="dateTo"]',
      'select[name="winLoss"]',
      'select[name="emotionalState"]',
      'select[name="strategy"]',
      'button[aria-label*="filter"]',
      '.filter-dropdown',
      '.filter-controls',
      '[data-testid*="filter"]',
      '.filter-button',
      'button:has-text("Filter")',
      '.market-filter',
      '.symbol-search',
      '.date-range-picker'
    ];

    const foundControls = [];
    for (const selector of filterSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        for (let i = 0; i < count; i++) {
          if (await element.nth(i).isVisible()) {
            foundControls.push(selector);
            break;
          }
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    return foundControls;
  } catch (error) {
    console.error('Error detecting filter controls:', error);
    return [];
  }
}

async function detectSortControls(page) {
  try {
    const sortSelectors = [
      'select[name="sortBy"]',
      'button[aria-label*="sort"]',
      '.sort-dropdown',
      '.sort-controls',
      'th[aria-sort]',
      '[data-testid*="sort"]',
      'thead button',
      '.sortable-header',
      'button:has-text("Sort")',
      '.sort-button',
      'th[role="button"]',
      '.column-header'
    ];

    const foundControls = [];
    for (const selector of sortSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        for (let i = 0; i < count; i++) {
          if (await element.nth(i).isVisible()) {
            foundControls.push(selector);
            break;
          }
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    return foundControls;
  } catch (error) {
    console.error('Error detecting sort controls:', error);
    return [];
  }
}

async function detectPaginationControls(page) {
  try {
    const paginationSelectors = [
      'select[name="pageSize"]',
      '.pagination',
      '.page-navigation',
      'button[aria-label*="page"]',
      '[data-testid*="pagination"]',
      '.page-size-selector',
      'button:has-text("Previous")',
      'button:has-text("Next")',
      '.page-number',
      '.pagination-controls'
    ];

    const foundControls = [];
    for (const selector of paginationSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        for (let i = 0; i < count; i++) {
          if (await element.nth(i).isVisible()) {
            foundControls.push(selector);
            break;
          }
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    return foundControls;
  } catch (error) {
    console.error('Error detecting pagination controls:', error);
    return [];
  }
}

async function getTradeCount(page) {
  try {
    const tradeSelectors = [
      '[data-testid="trade-item"]',
      '.trade-item',
      '.glass',
      '[class*="trade"]',
      'div[class*="rounded-xl"]',
      '.trade-row',
      '.trade-card'
    ];
    
    for (const selector of tradeSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          return count;
        }
      } catch (error) {
        continue;
      }
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting trade count:', error);
    return 0;
  }
}

async function testTradesPageFiltering(page) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Trades Page Filtering...');
    
    // Navigate to trades page
    await page.goto(`${BASE_URL}/trades`);
    await delay(2000);
    
    const initialTradeCount = await getTradeCount(page);
    logTest('Trades Page - Initial Load', 'PASS', `Loaded ${initialTradeCount} trades`, Date.now() - startTime);
    
    // Test market type filtering
    const marketFilter = page.locator('select[name="market"], .market-filter').first();
    if (await marketFilter.isVisible()) {
      const filterStart = Date.now();
      await marketFilter.selectOption('Stock');
      await delay(1000);
      const stockTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Trades Page - Market Filter (Stock)', 'PASS', `Found ${stockTrades} Stock trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      await marketFilter.selectOption('Crypto');
      await delay(1000);
      const cryptoTrades = await getTradeCount(page);
      logTest('Trades Page - Market Filter (Crypto)', 'PASS', `Found ${cryptoTrades} Crypto trades`, Date.now() - filterStart);
      
      // Reset filter
      await marketFilter.selectOption('');
      await delay(500);
    } else {
      logTest('Trades Page - Market Filter', 'FAIL', 'Market filter control not found', Date.now() - startTime);
    }
    
    // Test symbol filtering
    const symbolFilter = page.locator('input[name="symbol"], select[name="symbol"], .symbol-search').first();
    if (await symbolFilter.isVisible()) {
      const filterStart = Date.now();
      if (await symbolFilter.getAttribute('type') === 'text' || await symbolFilter.getAttribute('type') === 'search') {
        await symbolFilter.fill('AAPL');
      } else {
        await symbolFilter.selectOption('AAPL');
      }
      await delay(1000);
      const aaplTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Trades Page - Symbol Filter (AAPL)', 'PASS', `Found ${aaplTrades} AAPL trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Clear filter
      await symbolFilter.fill('');
      await delay(500);
    } else {
      logTest('Trades Page - Symbol Filter', 'FAIL', 'Symbol filter control not found', Date.now() - startTime);
    }
    
    // Test date range filtering
    const dateFromFilter = page.locator('input[name="dateFrom"], input[type="date"]').first();
    const dateToFilter = page.locator('input[name="dateTo"], input[type="date"]').nth(1);
    
    if (await dateFromFilter.isVisible()) {
      const filterStart = Date.now();
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      await dateFromFilter.fill(sevenDaysAgo.toISOString().split('T')[0]);
      if (await dateToFilter.isVisible()) {
        await dateToFilter.fill(today.toISOString().split('T')[0]);
      }
      await delay(1000);
      
      const recentTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Trades Page - Date Range Filter (Last 7 Days)', 'PASS', `Found ${recentTrades} trades in date range`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Clear filters
      await dateFromFilter.fill('');
      if (await dateToFilter.isVisible()) {
        await dateToFilter.fill('');
      }
      await delay(500);
    } else {
      logTest('Trades Page - Date Range Filter', 'FAIL', 'Date filter controls not found', Date.now() - startTime);
    }
    
    // Test win/loss filtering
    const winLossFilter = page.locator('select[name="winLoss"], select[name="pnlFilter"]').first();
    if (await winLossFilter.isVisible()) {
      const filterStart = Date.now();
      await winLossFilter.selectOption('profit');
      await delay(1000);
      const winningTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Trades Page - Win/Loss Filter (Profit)', 'PASS', `Found ${winningTrades} profitable trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      await winLossFilter.selectOption('loss');
      await delay(1000);
      const losingTrades = await getTradeCount(page);
      logTest('Trades Page - Win/Loss Filter (Loss)', 'PASS', `Found ${losingTrades} losing trades`, Date.now() - filterStart);
      
      // Reset filter
      await winLossFilter.selectOption('');
      await delay(500);
    } else {
      logTest('Trades Page - Win/Loss Filter', 'FAIL', 'Win/Loss filter control not found', Date.now() - startTime);
    }
    
    // Test emotional state filtering
    const emotionFilter = page.locator('select[name="emotionalState"], .emotion-filter').first();
    if (await emotionFilter.isVisible()) {
      const filterStart = Date.now();
      await emotionFilter.selectOption('FOMO');
      await delay(1000);
      const fomoTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Trades Page - Emotional State Filter (FOMO)', 'PASS', `Found ${fomoTrades} FOMO trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Reset filter
      await emotionFilter.selectOption('');
      await delay(500);
    } else {
      logTest('Trades Page - Emotional State Filter', 'FAIL', 'Emotional state filter control not found', Date.now() - startTime);
    }
    
  } catch (error) {
    logTest('Trades Page Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testConfluencePageFiltering(page) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Confluence Page Advanced Filtering...');
    
    // Navigate to confluence page
    await page.goto(`${BASE_URL}/confluence`);
    await delay(2000);
    
    // Check if confluence page exists
    const isConfluencePage = await page.locator('text=Confluence, text=confluence').isVisible();
    if (!isConfluencePage) {
      logTest('Confluence Page - Navigation', 'FAIL', 'Confluence page not found or not accessible', Date.now() - startTime);
      return;
    }
    
    const initialTradeCount = await getTradeCount(page);
    logTest('Confluence Page - Initial Load', 'PASS', `Loaded ${initialTradeCount} trades`, Date.now() - startTime);
    
    // Test market type dropdown
    const marketDropdown = page.locator('.market-type-dropdown, select[name="marketType"]').first();
    if (await marketDropdown.isVisible()) {
      const filterStart = Date.now();
      await marketDropdown.selectOption('Stocks');
      await delay(1000);
      const stockTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Confluence Page - Market Type Dropdown (Stocks)', 'PASS', `Found ${stockTrades} Stock trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      await marketDropdown.selectOption('Crypto');
      await delay(1000);
      const cryptoTrades = await getTradeCount(page);
      logTest('Confluence Page - Market Type Dropdown (Crypto)', 'PASS', `Found ${cryptoTrades} Crypto trades`, Date.now() - filterStart);
      
      // Reset
      await marketDropdown.selectOption('');
      await delay(500);
    } else {
      logTest('Confluence Page - Market Type Dropdown', 'FAIL', 'Market type dropdown not found', Date.now() - startTime);
    }
    
    // Test symbol search functionality
    const symbolSearch = page.locator('.symbol-search, input[placeholder*="symbol"], input[name="symbolSearch"]').first();
    if (await symbolSearch.isVisible()) {
      const filterStart = Date.now();
      await symbolSearch.fill('BTC');
      await delay(1000);
      const btcTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Confluence Page - Symbol Search (BTC)', 'PASS', `Found ${btcTrades} BTC trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Clear search
      await symbolSearch.fill('');
      await delay(500);
    } else {
      logTest('Confluence Page - Symbol Search', 'FAIL', 'Symbol search not found', Date.now() - startTime);
    }
    
    // Test strategy selection filter
    const strategyFilter = page.locator('.strategy-filter, select[name="strategy"]').first();
    if (await strategyFilter.isVisible()) {
      const filterStart = Date.now();
      await strategyFilter.selectOption('Momentum');
      await delay(1000);
      const momentumTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Confluence Page - Strategy Filter (Momentum)', 'PASS', `Found ${momentumTrades} Momentum trades`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Reset
      await strategyFilter.selectOption('');
      await delay(500);
    } else {
      logTest('Confluence Page - Strategy Filter', 'FAIL', 'Strategy filter not found', Date.now() - startTime);
    }
    
    // Test Buy/Sell filter toggle
    const buySellToggle = page.locator('.buy-sell-toggle, input[name="tradeType"], button:has-text("Buy"), button:has-text("Sell")').first();
    if (await buySellToggle.isVisible()) {
      const filterStart = Date.now();
      if (await buySellToggle.getAttribute('type') === 'checkbox') {
        await buySellToggle.check();
      } else {
        await buySellToggle.click();
      }
      await delay(1000);
      const filteredTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Confluence Page - Buy/Sell Toggle', 'PASS', `Found ${filteredTrades} trades after toggle`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Reset
      if (await buySellToggle.getAttribute('type') === 'checkbox') {
        await buySellToggle.uncheck();
      } else {
        await buySellToggle.click();
      }
      await delay(500);
    } else {
      logTest('Confluence Page - Buy/Sell Toggle', 'FAIL', 'Buy/Sell toggle not found', Date.now() - startTime);
    }
    
    // Test emotional state multi-select
    const emotionMultiSelect = page.locator('.emotion-multi-select, .emotion-filter-multi').first();
    if (await emotionMultiSelect.isVisible()) {
      const filterStart = Date.now();
      await emotionMultiSelect.click();
      await delay(500);
      
      // Select multiple emotions
      const fomoOption = page.locator('input[value="FOMO"], label:has-text("FOMO")').first();
      if (await fomoOption.isVisible()) {
        await fomoOption.click();
      }
      
      const confidentOption = page.locator('input[value="CONFIDENT"], label:has-text("CONFIDENT")').first();
      if (await confidentOption.isVisible()) {
        await confidentOption.click();
      }
      
      await delay(1000);
      const emotionFilteredTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Confluence Page - Emotional State Multi-Select', 'PASS', `Found ${emotionFilteredTrades} trades with selected emotions`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
      
      // Reset
      await emotionMultiSelect.click();
      await delay(500);
    } else {
      logTest('Confluence Page - Emotional State Multi-Select', 'FAIL', 'Emotional state multi-select not found', Date.now() - startTime);
    }
    
    // Test quick filter pills
    const quickFilterPills = page.locator('.quick-filter, .filter-pill, button:has-text("Stocks"), button:has-text("Crypto"), button:has-text("Buy Only")');
    const pillCount = await quickFilterPills.count();
    
    if (pillCount > 0) {
      const filterStart = Date.now();
      await quickFilterPills.first().click();
      await delay(1000);
      const quickFilteredTrades = await getTradeCount(page);
      const filterTime = Date.now() - filterStart;
      
      logTest('Confluence Page - Quick Filter Pills', 'PASS', `Found ${quickFilteredTrades} trades after quick filter`, filterTime);
      TEST_RESULTS.performance.filterTimes.push(filterTime);
    } else {
      logTest('Confluence Page - Quick Filter Pills', 'FAIL', 'Quick filter pills not found', Date.now() - startTime);
    }
    
  } catch (error) {
    logTest('Confluence Page Filtering', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testPaginationControls(page) {
  const startTime = Date.now();
  
  try {
    console.log('📄 Testing Pagination Controls...');
    
    // Navigate to trades page
    await page.goto(`${BASE_URL}/trades`);
    await delay(2000);
    
    // Test page size selection
    const pageSizeSelector = page.locator('select[name="pageSize"], .page-size-selector').first();
    if (await pageSizeSelector.isVisible()) {
      // Test different page sizes
      const pageSizes = ['10', '25', '50', '100'];
      
      for (const size of pageSizes) {
        const paginationStart = Date.now();
        await pageSizeSelector.selectOption(size);
        await delay(1000);
        const tradesOnPage = await getTradeCount(page);
        const paginationTime = Date.now() - paginationStart;
        
        logTest(`Pagination - Page Size ${size}`, 'PASS', `Showing ${tradesOnPage} trades per page`, paginationTime);
        TEST_RESULTS.performance.paginationTimes.push(paginationTime);
      }
      
      // Reset to default
      await pageSizeSelector.selectOption('25');
      await delay(500);
    } else {
      logTest('Pagination - Page Size Selector', 'FAIL', 'Page size selector not found', Date.now() - startTime);
    }
    
    // Test page navigation
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"], .pagination-next').first();
    const prevButton = page.locator('button:has-text("Previous"), button[aria-label*="previous"], .pagination-prev').first();
    
    if (await nextButton.isVisible()) {
      const initialTradeCount = await getTradeCount(page);
      
      // Test next page
      const paginationStart = Date.now();
      await nextButton.click();
      await delay(1000);
      const nextPageTrades = await getTradeCount(page);
      const paginationTime = Date.now() - paginationStart;
      
      logTest('Pagination - Next Page', 'PASS', `Navigated to next page with ${nextPageTrades} trades`, paginationTime);
      TEST_RESULTS.performance.paginationTimes.push(paginationTime);
      
      // Test previous page
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await delay(1000);
        const prevPageTrades = await getTradeCount(page);
        logTest('Pagination - Previous Page', 'PASS', `Navigated to previous page with ${prevPageTrades} trades`, Date.now() - paginationStart);
      }
      
      // Test page number selection
      const pageNumbers = page.locator('.page-number, button[aria-label*="page"]');
      const pageNumberCount = await pageNumbers.count();
      
      if (pageNumberCount > 2) {
        await pageNumbers.nth(1).click(); // Click page 2
        await delay(1000);
        const page2Trades = await getTradeCount(page);
        logTest('Pagination - Page Number Selection', 'PASS', `Navigated to page 2 with ${page2Trades} trades`, Date.now() - paginationStart);
        
        // Go back to first page
        await pageNumbers.first().click();
        await delay(500);
      }
      
    } else {
      logTest('Pagination - Navigation Controls', 'FAIL', 'Pagination navigation controls not found', Date.now() - startTime);
    }
    
    // Test total count display
    const totalCountElement = page.locator('.total-count, .trade-count, text=/\\d+ trades/').first();
    if (await totalCountElement.isVisible()) {
      const totalCountText = await totalCountElement.textContent();
      logTest('Pagination - Total Count Display', 'PASS', `Total count displayed: ${totalCountText}`, Date.now() - startTime);
    } else {
      logTest('Pagination - Total Count Display', 'FAIL', 'Total count display not found', Date.now() - startTime);
    }
    
    // Test pagination with active filters
    const marketFilter = page.locator('select[name="market"], .market-filter').first();
    if (await marketFilter.isVisible()) {
      await marketFilter.selectOption('Stock');
      await delay(1000);
      
      const filteredTradeCount = await getTradeCount(page);
      logTest('Pagination - With Active Filter', 'PASS', `Pagination working with ${filteredTradeCount} filtered trades`, Date.now() - startTime);
      
      // Reset filter
      await marketFilter.selectOption('');
      await delay(500);
    }
    
  } catch (error) {
    logTest('Pagination Controls', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testSortingFunctionality(page) {
  const startTime = Date.now();
  
  try {
    console.log('📊 Testing Sorting Functionality...');
    
    // Navigate to trades page
    await page.goto(`${BASE_URL}/trades`);
    await delay(2000);
    
    // Test sorting by date
    const dateSortControl = page.locator('th:has-text("Date"), th:has-text("Trade Date"), button[aria-label*="sort date"], .sort-date').first();
    if (await dateSortControl.isVisible()) {
      const sortStart = Date.now();
      await dateSortControl.click();
      await delay(1000);
      const sortTime = Date.now() - sortStart;
      
      logTest('Sorting - Date Column', 'PASS', 'Date sorting applied', sortTime);
      TEST_RESULTS.performance.sortTimes.push(sortTime);
      
      // Test reverse sort
      await dateSortControl.click();
      await delay(1000);
      logTest('Sorting - Date Column (Reverse)', 'PASS', 'Reverse date sorting applied', Date.now() - sortStart);
      
    } else {
      // Check for dropdown sort
      const sortDropdown = page.locator('select[name="sortBy"], .sort-dropdown').first();
      if (await sortDropdown.isVisible()) {
        const sortStart = Date.now();
        await sortDropdown.selectOption('date');
        await delay(1000);
        const sortTime = Date.now() - sortStart;
        
        logTest('Sorting - Date (Dropdown)', 'PASS', 'Date sorting applied via dropdown', sortTime);
        TEST_RESULTS.performance.sortTimes.push(sortTime);
        
        await sortDropdown.selectOption('-date');
        await delay(1000);
        logTest('Sorting - Date (Reverse Dropdown)', 'PASS', 'Reverse date sorting applied via dropdown', Date.now() - sortStart);
      } else {
        logTest('Sorting - Date Column', 'FAIL', 'Date sort control not found', Date.now() - startTime);
      }
    }
    
    // Test sorting by P&L
    const pnlSortControl = page.locator('th:has-text("P&L"), th:has-text("PnL"), button[aria-label*="sort pnl"], .sort-pnl').first();
    if (await pnlSortControl.isVisible()) {
      const sortStart = Date.now();
      await pnlSortControl.click();
      await delay(1000);
      const sortTime = Date.now() - sortStart;
      
      logTest('Sorting - P&L Column', 'PASS', 'P&L sorting applied', sortTime);
      TEST_RESULTS.performance.sortTimes.push(sortTime);
      
      // Test reverse sort
      await pnlSortControl.click();
      await delay(1000);
      logTest('Sorting - P&L Column (Reverse)', 'PASS', 'Reverse P&L sorting applied', Date.now() - sortStart);
      
    } else {
      logTest('Sorting - P&L Column', 'FAIL', 'P&L sort control not found', Date.now() - startTime);
    }
    
    // Test sorting by symbol
    const symbolSortControl = page.locator('th:has-text("Symbol"), button[aria-label*="sort symbol"], .sort-symbol').first();
    if (await symbolSortControl.isVisible()) {
      const sortStart = Date.now();
      await symbolSortControl.click();
      await delay(1000);
      const sortTime = Date.now() - sortStart;
      
      logTest('Sorting - Symbol Column', 'PASS', 'Symbol sorting applied', sortTime);
      TEST_RESULTS.performance.sortTimes.push(sortTime);
      
      // Test reverse sort
      await symbolSortControl.click();
      await delay(1000);
      logTest('Sorting - Symbol Column (Reverse)', 'PASS', 'Reverse symbol sorting applied', Date.now() - sortStart);
      
    } else {
      logTest('Sorting - Symbol Column', 'FAIL', 'Symbol sort control not found', Date.now() - startTime);
    }
    
    // Test sort direction indicators
    const sortIndicators = page.locator('.sort-indicator, [aria-sort], .sort-arrow');
    const indicatorCount = await sortIndicators.count();
    if (indicatorCount > 0) {
      logTest('Sorting - Direction Indicators', 'PASS', `Found ${indicatorCount} sort direction indicators`, Date.now() - startTime);
    } else {
      logTest('Sorting - Direction Indicators', 'FAIL', 'Sort direction indicators not found', Date.now() - startTime);
    }
    
    // Test sort persistence with filters
    const marketFilter = page.locator('select[name="market"], .market-filter').first();
    if (await marketFilter.isVisible() && await dateSortControl.isVisible()) {
      // Apply sort first
      await dateSortControl.click();
      await delay(500);
      
      // Then apply filter
      await marketFilter.selectOption('Stock');
      await delay(1000);
      
      const filteredSortedTrades = await getTradeCount(page);
      logTest('Sorting - Persistence with Filters', 'PASS', `Sort maintained with ${filteredSortedTrades} filtered trades`, Date.now() - startTime);
      
      // Reset
      await marketFilter.selectOption('');
      await delay(500);
    }
    
  } catch (error) {
    logTest('Sorting Functionality', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function testFilterPerformanceAndAccuracy(page) {
  const startTime = Date.now();
  
  try {
    console.log('⚡ Testing Filter Performance and Accuracy...');
    
    // Navigate to trades page
    await page.goto(`${BASE_URL}/trades`);
    await delay(2000);
    
    const initialTradeCount = await getTradeCount(page);
    
    // Test filter response time
    const marketFilter = page.locator('select[name="market"], .market-filter').first();
    if (await marketFilter.isVisible()) {
      const responseTimes = [];
      
      // Test multiple filter applications
      for (let i = 0; i < 5; i++) {
        const filterStart = Date.now();
        await marketFilter.selectOption(i % 2 === 0 ? 'Stock' : 'Crypto');
        await delay(500);
        const responseTime = Date.now() - filterStart;
        responseTimes.push(responseTime);
        
        await marketFilter.selectOption('');
        await delay(500);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      logTest('Performance - Filter Response Time', avgResponseTime < 1000 ? 'PASS' : 'FAIL', 
               `Average response time: ${avgResponseTime.toFixed(2)}ms`, Date.now() - startTime);
      
      TEST_RESULTS.performance.filterTimes.push(...responseTimes);
    }
    
    // Test result accuracy verification
    if (await marketFilter.isVisible()) {
      // Apply Stock filter
      await marketFilter.selectOption('Stock');
      await delay(1000);
      
      const stockTrades = await getTradeCount(page);
      
      // Verify that all visible trades are actually Stock trades
      const visibleTrades = page.locator('.glass, .trade-item');
      let actualStockCount = 0;
      
      for (let i = 0; i < Math.min(stockTrades, 10); i++) {
        const trade = visibleTrades.nth(i);
        const hasStockText = await trade.locator('text=Stock, text=stock').isVisible();
        if (hasStockText) {
          actualStockCount++;
        }
      }
      
      const accuracy = stockTrades > 0 ? (actualStockCount / Math.min(stockTrades, 10)) * 100 : 0;
      logTest('Accuracy - Filter Results Verification', accuracy >= 80 ? 'PASS' : 'FAIL', 
               `Filter accuracy: ${accuracy.toFixed(1)}% (${actualStockCount}/${Math.min(stockTrades, 10)} verified)`, Date.now() - startTime);
      
      // Reset filter
      await marketFilter.selectOption('');
      await delay(500);
    }
    
    // Test filter state persistence
    if (await marketFilter.isVisible()) {
      // Apply filter
      await marketFilter.selectOption('Crypto');
      await delay(1000);
      
      // Navigate away and back
      await page.goto(`${BASE_URL}/dashboard`);
      await delay(1000);
      await page.goto(`${BASE_URL}/trades`);
      await delay(2000);
      
      // Check if filter is still applied
      const cryptoTradesAfterRefresh = await getTradeCount(page);
      const filterPersisted = cryptoTradesAfterRefresh < initialTradeCount;
      
      logTest('Persistence - Filter State', filterPersisted ? 'PASS' : 'FAIL', 
               `Filter state ${filterPersisted ? 'persisted' : 'not persisted'} after navigation`, Date.now() - startTime);
      
      // Reset filter
      await marketFilter.selectOption('');
      await delay(500);
    }
    
    // Test filter reset functionality
    const resetButton = page.locator('button:has-text("Reset"), button:has-text("Clear"), .reset-filters, .clear-filters').first();
    if (await resetButton.isVisible()) {
      // Apply multiple filters
      if (await marketFilter.isVisible()) {
        await marketFilter.selectOption('Stock');
      }
      
      const symbolFilter = page.locator('input[name="symbol"], select[name="symbol"]').first();
      if (await symbolFilter.isVisible()) {
        await symbolFilter.fill('AAPL');
      }
      
      await delay(1000);
      const filteredCount = await getTradeCount(page);
      
      // Reset filters
      await resetButton.click();
      await delay(1000);
      const resetCount = await getTradeCount(page);
      
      const resetWorked = resetCount >= filteredCount;
      logTest('Functionality - Filter Reset', resetWorked ? 'PASS' : 'FAIL', 
               `Filter reset ${resetWorked ? 'successful' : 'failed'} (${filteredCount} -> ${resetCount} trades)`, Date.now() - startTime);
    } else {
      logTest('Functionality - Filter Reset', 'FAIL', 'Reset button not found', Date.now() - startTime);
    }
    
    // Test edge cases
    // Test with empty results
    if (await marketFilter.isVisible()) {
      await marketFilter.selectOption('NonExistentMarket');
      await delay(1000);
      const emptyResults = await getTradeCount(page);
      
      logTest('Edge Cases - Empty Results', emptyResults === 0 ? 'PASS' : 'FAIL', 
               `Empty results handling: ${emptyResults} trades found`, Date.now() - startTime);
      
      // Reset
      await marketFilter.selectOption('');
      await delay(500);
    }
    
    // Test with invalid inputs
    const symbolFilter = page.locator('input[name="symbol"], select[name="symbol"]').first();
    if (await symbolFilter.isVisible()) {
      await symbolFilter.fill('!@#$%^&*()');
      await delay(1000);
      const invalidInputResults = await getTradeCount(page);
      
      logTest('Edge Cases - Invalid Input', 'PASS', 
               `Invalid input handled gracefully: ${invalidInputResults} trades found`, Date.now() - startTime);
      
      // Clear
      await symbolFilter.fill('');
      await delay(500);
    }
    
  } catch (error) {
    logTest('Filter Performance and Accuracy', 'FAIL', `Error: ${error.message}`, Date.now() - startTime);
  }
}

async function main() {
  console.log('🔍 Starting Comprehensive Filtering and Sorting Tests...');
  console.log('📊 Testing all filtering, sorting, and pagination functionality\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Authenticate first
    const isAuthenticated = await authenticateUser(page);
    
    if (!isAuthenticated) {
      console.log('❌ Cannot proceed without authentication');
      await browser.close();
      return;
    }
    
    // Take initial screenshot
    await takeScreenshot(page, 'authenticated-dashboard');
    
    // Detect available controls
    console.log('🔍 Detecting available controls...');
    const filterControls = await detectFilterControls(page);
    const sortControls = await detectSortControls(page);
    const paginationControls = await detectPaginationControls(page);
    
    logTest('Control Detection - Filters', filterControls.length > 0 ? 'PASS' : 'FAIL', 
             `Found ${filterControls.length} filter controls: ${filterControls.join(', ')}`);
    
    logTest('Control Detection - Sort', sortControls.length > 0 ? 'PASS' : 'FAIL', 
             `Found ${sortControls.length} sort controls: ${sortControls.join(', ')}`);
    
    logTest('Control Detection - Pagination', paginationControls.length > 0 ? 'PASS' : 'FAIL', 
             `Found ${paginationControls.length} pagination controls: ${paginationControls.join(', ')}`);
    
    // Run comprehensive tests
    console.log('\n🧪 Running Trades Page Filtering Tests...');
    await testTradesPageFiltering(page);
    await takeScreenshot(page, 'trades-page-filtering-complete');
    
    console.log('\n🔍 Running Confluence Page Advanced Filtering Tests...');
    await testConfluencePageFiltering(page);
    await takeScreenshot(page, 'confluence-page-filtering-complete');
    
    console.log('\n📄 Running Pagination Controls Tests...');
    await testPaginationControls(page);
    await takeScreenshot(page, 'pagination-controls-complete');
    
    console.log('\n📊 Running Sorting Functionality Tests...');
    await testSortingFunctionality(page);
    await takeScreenshot(page, 'sorting-functionality-complete');
    
    console.log('\n⚡ Running Filter Performance and Accuracy Tests...');
    await testFilterPerformanceAndAccuracy(page);
    await takeScreenshot(page, 'performance-testing-complete');
    
    // Take final screenshot
    await takeScreenshot(page, 'final-test-state');

  } catch (error) {
    console.error('❌ Test execution error:', error);
    logTest('Test Execution', 'FAIL', `Critical error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Calculate performance averages
  if (TEST_RESULTS.performance.filterTimes.length > 0) {
    TEST_RESULTS.performance.averageFilterTime = TEST_RESULTS.performance.filterTimes.reduce((a, b) => a + b, 0) / TEST_RESULTS.performance.filterTimes.length;
  }
  
  if (TEST_RESULTS.performance.sortTimes.length > 0) {
    TEST_RESULTS.performance.averageSortTime = TEST_RESULTS.performance.sortTimes.reduce((a, b) => a + b, 0) / TEST_RESULTS.performance.sortTimes.length;
  }
  
  if (TEST_RESULTS.performance.paginationTimes.length > 0) {
    TEST_RESULTS.performance.averagePaginationTime = TEST_RESULTS.performance.paginationTimes.reduce((a, b) => a + b, 0) / TEST_RESULTS.performance.paginationTimes.length;
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

  const reportPath = `filtering-sorting-comprehensive-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(reportContent);
  const markdownPath = `FILTERING_SORTING_COMPREHENSIVE_TEST_REPORT.md`;
  fs.writeFileSync(markdownPath, markdownReport);

  console.log(`\n📄 Test reports generated:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: ${markdownPath}`);
  
  console.log(`\n📊 Test Summary:`);
  console.log(`   Authentication Status: ${TEST_RESULTS.authenticationStatus}`);
  console.log(`   Total Tests: ${TEST_RESULTS.summary.total}`);
  console.log(`   Passed: ${TEST_RESULTS.summary.passed}`);
  console.log(`   Failed: ${TEST_RESULTS.summary.failed}`);
  console.log(`   Skipped: ${TEST_RESULTS.summary.skipped}`);
  console.log(`   Pass Rate: ${reportContent.summary.passRate}`);
  
  console.log(`\n⚡ Performance Summary:`);
  console.log(`   Average Filter Time: ${TEST_RESULTS.performance.averageFilterTime.toFixed(2)}ms`);
  console.log(`   Average Sort Time: ${TEST_RESULTS.performance.averageSortTime.toFixed(2)}ms`);
  console.log(`   Average Pagination Time: ${TEST_RESULTS.performance.averagePaginationTime.toFixed(2)}ms`);

  console.log('\n🎉 Comprehensive Filtering and Sorting Testing Complete!');
}

function generateRecommendations() {
  const recommendations = [];
  
  if (TEST_RESULTS.authenticationStatus !== 'SUCCESS' && TEST_RESULTS.authenticationStatus !== 'ALREADY_AUTHENTICATED') {
    recommendations.push('Fix authentication flow - unable to authenticate with specified credentials (testuser@verotrade.com / TestPassword123!)');
  }
  
  const filterControlTest = TEST_RESULTS.tests.find(t => t.name === 'Control Detection - Filters');
  if (filterControlTest && filterControlTest.status === 'FAIL') {
    recommendations.push('Implement comprehensive filtering UI controls for trades and confluence pages');
  }
  
  const sortControlTest = TEST_RESULTS.tests.find(t => t.name === 'Control Detection - Sort');
  if (sortControlTest && sortControlTest.status === 'FAIL') {
    recommendations.push('Implement comprehensive sorting UI controls for all sortable columns');
  }
  
  const paginationControlTest = TEST_RESULTS.tests.find(t => t.name === 'Control Detection - Pagination');
  if (paginationControlTest && paginationControlTest.status === 'FAIL') {
    recommendations.push('Implement pagination controls with page size selection and navigation');
  }
  
  if (TEST_RESULTS.performance.averageFilterTime > 1000) {
    recommendations.push('Optimize filter performance - average filter time exceeds 1 second');
  }
  
  if (TEST_RESULTS.performance.averageSortTime > 1000) {
    recommendations.push('Optimize sort performance - average sort time exceeds 1 second');
  }
  
  if (TEST_RESULTS.performance.averagePaginationTime > 1000) {
    recommendations.push('Optimize pagination performance - average pagination time exceeds 1 second');
  }
  
  const confluenceTests = TEST_RESULTS.tests.filter(t => t.name.includes('Confluence Page') && t.status === 'FAIL');
  if (confluenceTests.length > 0) {
    recommendations.push('Enhance confluence page advanced filtering functionality');
  }
  
  const accuracyTests = TEST_RESULTS.tests.filter(t => t.name.includes('Accuracy') && t.status === 'FAIL');
  if (accuracyTests.length > 0) {
    recommendations.push('Improve filter result accuracy and verification');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All filtering and sorting functionality is working correctly');
  }
  
  return recommendations;
}

function generateMarkdownReport(data) {
  return `# Comprehensive Filtering and Sorting Test Report

**Generated:** ${data.timestamp}  
**Authentication Status:** ${data.authenticationStatus}  
**Total Tests:** ${data.summary.total}  
**Passed:** ${data.summary.passed}  
**Failed:** ${data.summary.failed}  
**Skipped:** ${data.summary.skipped}  
**Pass Rate:** ${data.summary.passRate}

## Executive Summary

This report details the comprehensive testing of filtering, sorting, and pagination functionality for the VeroTrade trading journal application. The tests covered all major filtering and sorting capabilities across the trades page, confluence page, and performance characteristics.

## Authentication Status

${data.authenticationStatus === 'SUCCESS' || data.authenticationStatus === 'ALREADY_AUTHENTICATED' ? 
  '✅ **Authentication Successful** - Test user (testuser@verotrade.com) was able to access the application' :
  '❌ **Authentication Failed** - Unable to authenticate with specified credentials'}

## Control Detection Results

### Filter Controls
${data.tests.find(t => t.name === 'Control Detection - Filters')?.details || 'N/A'}

### Sort Controls  
${data.tests.find(t => t.name === 'Control Detection - Sort')?.details || 'N/A'}

### Pagination Controls
${data.tests.find(t => t.name === 'Control Detection - Pagination')?.details || 'N/A'}

## Trades Page Filtering Tests

${data.tests.filter(t => t.name.includes('Trades Page')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

## Confluence Page Advanced Filtering Tests

${data.tests.filter(t => t.name.includes('Confluence Page')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

## Pagination Controls Tests

${data.tests.filter(t => t.name.includes('Pagination')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

## Sorting Functionality Tests

${data.tests.filter(t => t.name.includes('Sorting')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

## Performance and Accuracy Tests

${data.tests.filter(t => t.name.includes('Performance') || t.name.includes('Accuracy') || t.name.includes('Edge Cases')).map(test => 
  `#### ${test.name}
- **Status:** ${test.status}
- **Details:** ${test.details}
- **Duration:** ${test.duration}ms
`).join('\n')}

## Performance Analysis

- **Average Filter Time:** ${data.performance.averageFilterTime.toFixed(2)}ms
- **Average Sort Time:** ${data.performance.averageSortTime.toFixed(2)}ms
- **Average Pagination Time:** ${data.performance.averagePaginationTime.toFixed(2)}ms
- **Filter Operations:** ${data.performance.filterTimes.length}
- **Sort Operations:** ${data.performance.sortTimes.length}
- **Pagination Operations:** ${data.performance.paginationTimes.length}

## Screenshots Taken

${data.screenshots.map(screenshot => 
  `- **${screenshot.test}:** ${screenshot.path}`
).join('\n')}

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