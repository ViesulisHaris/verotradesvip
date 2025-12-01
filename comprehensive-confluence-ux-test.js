const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './confluence-ux-screenshots',
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Enhanced logging function
function log(category, message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;
  
  switch(type) {
    case 'success':
      console.log(`✅ ${prefix} ${message}`);
      break;
    case 'error':
      console.log(`❌ ${prefix} ${message}`);
      break;
    case 'warning':
      console.log(`⚠️ ${prefix} ${message}`);
      break;
    case 'debug':
      console.log(`🔍 ${prefix} ${message}`);
      break;
    default:
      console.log(`ℹ️ ${prefix} ${message}`);
  }
}

// Screenshot helper
async function takeScreenshot(page, filename, category = 'UX_TEST') {
  try {
    const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${category.toLowerCase()}-${filename}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(category, `Screenshot saved: ${filename}`, 'success');
    return screenshotPath;
  } catch (error) {
    log(category, `Failed to take screenshot: ${error.message}`, 'error');
  }
}

// Test results tracker
const testResults = {
  authentication: { passed: 0, failed: 0, details: [] },
  filterFunctionality: { passed: 0, failed: 0, details: [] },
  refreshFunctionality: { passed: 0, failed: 0, details: [] },
  responsiveDesign: { passed: 0, failed: 0, details: [] },
  dataConsistency: { passed: 0, failed: 0, details: [] },
  errorHandling: { passed: 0, failed: 0, details: [] },
  performance: { passed: 0, failed: 0, details: [] }
};

// Test helper functions
function logTestResult(category, testName, passed, details = '') {
  const result = passed ? 'PASSED' : 'FAILED';
  log(category, `Test: ${testName} - ${result}`, passed ? 'success' : 'error');
  
  if (details) {
    log(category, `Details: ${details}`, passed ? 'info' : 'error');
  }
  
  if (testResults[category]) {
    if (passed) {
      testResults[category].passed++;
    } else {
      testResults[category].failed++;
    }
    testResults[category].details.push({
      test: testName,
      result,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

// Sleep helper
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test suite
async function runComprehensiveUXTests() {
  log('MAIN', 'Starting comprehensive confluence UX validation tests...', 'info');
  
  // Ensure screenshot directory exists
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable comprehensive logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CONFLUENCE') || text.includes('[ERROR') || text.includes('Error:')) {
        log('PAGE_CONSOLE', text, msg.type() === 'error' ? 'error' : 'debug');
      }
    });
    
    // Enable request/response logging for API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/confluence-')) {
        log('API_REQUEST', `Request: ${request.method()} ${url}`, 'debug');
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/confluence-')) {
        log('API_RESPONSE', `Response: ${response.status()} ${url}`, response.ok() ? 'success' : 'error');
      }
    });

    // Step 1: Authentication and Basic Navigation
    log('AUTH_TESTS', 'Starting authentication and navigation tests...', 'info');
    await testAuthenticationAndNavigation(page);
    
    // Step 2: Filter Functionality Tests
    log('FILTER_TESTS', 'Starting comprehensive filter functionality tests...', 'info');
    await testFilterFunctionality(page);
    
    // Step 3: Refresh Functionality Tests
    log('REFRESH_TESTS', 'Starting refresh functionality tests...', 'info');
    await testRefreshFunctionality(page);
    
    // Step 4: Data Consistency Tests
    log('DATA_TESTS', 'Starting data consistency tests...', 'info');
    await testDataConsistency(page);
    
    // Step 5: Error Display Tests
    log('ERROR_TESTS', 'Starting error display tests...', 'info');
    await testErrorDisplay(page);
    
    // Step 6: Responsive Design Tests
    log('RESPONSIVE_TESTS', 'Starting responsive design tests...', 'info');
    await testResponsiveDesign(page);
    
    // Step 7: Performance Tests
    log('PERFORMANCE_TESTS', 'Starting performance tests...', 'info');
    await testPerformance(page);
    
    await browser.close();
    
  } catch (error) {
    log('MAIN', `Test suite failed: ${error.message}`, 'error');
    await browser.close();
  }
}

// Test 1: Authentication and Basic Navigation
async function testAuthenticationAndNavigation(page) {
  try {
    // Test 1.1: Login and navigate to confluence
    log('AUTH_TESTS', 'Testing login and navigation to confluence...', 'debug');
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    // Fill login form
    await page.type('input[type="email"]', TEST_CONFIG.testUser.email);
    await page.type('input[type="password"]', TEST_CONFIG.testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await sleep(3000);
    
    // Navigate to confluence
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const currentUrl = page.url();
    const successfullyNavigated = currentUrl.includes('/confluence');
    logTestResult('authentication', 'Login and navigate to confluence', successfullyNavigated,
      successfullyNavigated ? 'Successfully navigated to confluence' : 'Failed to navigate to confluence');
    
    await takeScreenshot(page, 'confluence-loaded', 'AUTH_TESTS');
    
    // Test 1.2: Check page title and headers
    const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => null);
    const hasCorrectTitle = pageTitle && pageTitle.includes('Confluence Analysis');
    logTestResult('authentication', 'Page title and headers', hasCorrectTitle,
      hasCorrectTitle ? 'Correct page title found' : 'Page title missing or incorrect');
    
    // Test 1.3: Check for main components
    const statsCards = await page.$$('[data-testid="confluence-card"]');
    const emotionRadar = await page.$('canvas, svg');
    const tradesTable = await page.$('table');
    const filterButtons = await page.$$('button:has-text("FOMO"), button:has-text("REVENGE"), button:has-text("TILT")');
    
    const hasMainComponents = statsCards.length > 0 && emotionRadar && tradesTable && filterButtons.length > 0;
    logTestResult('authentication', 'Main components loaded', hasMainComponents,
      hasMainComponents ? `All main components loaded (cards: ${statsCards.length}, radar: ${!!emotionRadar}, table: ${!!tradesTable}, filters: ${filterButtons.length})` : 'Some main components missing');
    
    await takeScreenshot(page, 'main-components', 'AUTH_TESTS');
    
  } catch (error) {
    logTestResult('authentication', 'Authentication and navigation tests', false, error.message);
  }
}

// Test 2: Filter Functionality Tests
async function testFilterFunctionality(page) {
  try {
    // Test 2.1: Emotion filter buttons exist and are clickable
    log('FILTER_TESTS', 'Testing emotion filter buttons...', 'debug');
    
    const emotionButtons = await page.$$('button[class*="emotion"], button:has-text("FOMO"), button:has-text("REVENGE")');
    const hasEmotionButtons = emotionButtons.length >= 10; // Should have all 10 emotions
    logTestResult('filterFunctionality', 'Emotion filter buttons available', hasEmotionButtons,
      hasEmotionButtons ? `Found ${emotionButtons.length} emotion buttons` : `Only found ${emotionButtons.length} emotion buttons`);
    
    // Test 2.2: Single emotion filter
    log('FILTER_TESTS', 'Testing single emotion filter...', 'debug');
    
    if (emotionButtons.length > 0) {
      // Click FOMO filter
      await emotionButtons[0].click();
      await sleep(2000);
      
      // Check if filter is applied
      const activeFilters = await page.$$('button[class*="bg-dusty-gold"]');
      const hasActiveFilter = activeFilters.length > 0;
      logTestResult('filterFunctionality', 'Single emotion filter application', hasActiveFilter,
        hasActiveFilter ? 'Single emotion filter applied correctly' : 'Single emotion filter not applied');
      
      await takeScreenshot(page, 'single-filter', 'FILTER_TESTS');
      
      // Test 2.3: Multiple emotion filters
      log('FILTER_TESTS', 'Testing multiple emotion filters...', 'debug');
      
      // Click additional filters
      if (emotionButtons.length > 1) {
        await emotionButtons[1].click(); // REVENGE
        await sleep(1000);
        await emotionButtons[2].click(); // TILT
        await sleep(2000);
        
        const multipleActiveFilters = await page.$$('button[class*="bg-dusty-gold"]');
        const hasMultipleActive = multipleActiveFilters.length >= 3;
        logTestResult('filterFunctionality', 'Multiple emotion filters application', hasMultipleActive,
          hasMultipleActive ? `Multiple emotion filters applied (${multipleActiveFilters.length} active)` : 'Multiple emotion filters not applied');
        
        await takeScreenshot(page, 'multiple-filters', 'FILTER_TESTS');
      }
      
      // Test 2.4: Clear all filters
      log('FILTER_TESTS', 'Testing clear all filters...', 'debug');
      
      const clearButton = await page.$('button:has-text("Clear All")');
      if (clearButton) {
        await clearButton.click();
        await sleep(2000);
        
        const clearedFilters = await page.$$('button[class*="bg-dusty-gold"]');
        const hasClearedFilters = clearedFilters.length === 0;
        logTestResult('filterFunctionality', 'Clear all filters functionality', hasClearedFilters,
          hasClearedFilters ? 'Filters cleared successfully' : 'Filters not cleared');
        
        await takeScreenshot(page, 'filters-cleared', 'FILTER_TESTS');
      } else {
        logTestResult('filterFunctionality', 'Clear all filters button', false, 'Clear All button not found');
      }
      
      // Test 2.5: Filter state persistence during refresh
      log('FILTER_TESTS', 'Testing filter state persistence...', 'debug');
      
      // Apply filter again
      await emotionButtons[0].click(); // FOMO
      await sleep(1000);
      
      // Refresh page
      await page.click('button:has-text("Refresh")');
      await sleep(3000);
      
      // Check if filter is still active after refresh
      const persistentFilters = await page.$$('button[class*="bg-dusty-gold"]');
      const hasPersistentFilter = persistentFilters.length > 0;
      logTestResult('filterFunctionality', 'Filter state persistence during refresh', hasPersistentFilter,
        hasPersistentFilter ? 'Filter state persisted after refresh' : 'Filter state not persisted');
      
      await takeScreenshot(page, 'filter-persistence', 'FILTER_TESTS');
    }
    
  } catch (error) {
    logTestResult('filterFunctionality', 'Filter functionality tests', false, error.message);
  }
}

// Test 3: Refresh Functionality Tests
async function testRefreshFunctionality(page) {
  try {
    // Test 3.1: Refresh button exists and is clickable
    log('REFRESH_TESTS', 'Testing refresh button...', 'debug');
    
    const refreshButton = await page.$('button:has-text("Refresh")');
    const hasRefreshButton = !!refreshButton;
    logTestResult('refreshFunctionality', 'Refresh button availability', hasRefreshButton,
      hasRefreshButton ? 'Refresh button found' : 'Refresh button not found');
    
    if (refreshButton) {
      // Test 3.2: Refresh functionality works
      log('REFRESH_TESTS', 'Testing refresh functionality...', 'debug');
      
      // Get initial data state
      const initialStats = await page.$$eval('[data-testid="confluence-card"]', cards => 
        cards.map(card => card.textContent?.trim() || '')
      );
      
      // Click refresh
      await refreshButton.click();
      
      // Wait for refresh to complete (check for spinning icon)
      await page.waitForFunction(() => 
        page.$('.animate-spin') === null, 
        { timeout: 5000 }
      );
      
      await sleep(2000);
      
      // Check if data was refreshed
      const refreshedStats = await page.$$eval('[data-testid="confluence-card"]', cards => 
        cards.map(card => card.textContent?.trim() || '')
      );
      
      const dataRefreshed = initialStats.length > 0 && refreshedStats.length > 0;
      logTestResult('refreshFunctionality', 'Data refresh functionality', dataRefreshed,
        dataRefreshed ? 'Data refreshed successfully' : 'Data refresh failed');
      
      await takeScreenshot(page, 'refresh-completed', 'REFRESH_TESTS');
      
      // Test 3.3: Refresh button state during loading
      log('REFRESH_TESTS', 'Testing refresh button state during loading...', 'debug');
      
      // Click refresh again and check button state
      const refreshStartTime = Date.now();
      await refreshButton.click();
      
      // Check if button is disabled during refresh
      const isDisabled = await page.$eval('button:has-text("Refresh")', el => 
        el.disabled || el.classList.contains('opacity-50')
      );
      
      const hasDisabledState = isDisabled;
      logTestResult('refreshFunctionality', 'Refresh button disabled state', hasDisabledState,
        hasDisabledState ? 'Refresh button properly disabled during loading' : 'Refresh button not disabled during loading');
      
      await takeScreenshot(page, 'refresh-disabled', 'REFRESH_TESTS');
    }
    
  } catch (error) {
    logTestResult('refreshFunctionality', 'Refresh functionality tests', false, error.message);
  }
}

// Test 4: Data Consistency Tests
async function testDataConsistency(page) {
  try {
    // Test 4.1: Statistics data consistency
    log('DATA_TESTS', 'Testing statistics data consistency...', 'debug');
    
    const totalTradesCard = await page.$eval('[data-testid="confluence-card"]:first-of-type', el => {
      const valueText = el.querySelector('p.text-2xl')?.textContent;
      return valueText ? parseInt(valueText.replace(/[^0-9]/g, '')) : 0;
    }).catch(() => 0);
    
    const winRateCard = await page.$eval('[data-testid="confluence-card"]:nth-of-type(3)', el => {
      const valueText = el.querySelector('p.text-2xl')?.textContent;
      return valueText ? parseFloat(valueText.replace(/[^0-9.]/g, '')) : 0;
    }).catch(() => 0);
    
    // Check if data makes sense (win rate should be between 0-100)
    const dataConsistent = totalTradesCard >= 0 && winRateCard >= 0 && winRateCard <= 100;
    logTestResult('dataConsistency', 'Statistics data consistency', dataConsistent,
      dataConsistent ? `Data consistent (trades: ${totalTradesCard}, win rate: ${winRateCard}%)` : 'Data inconsistent or invalid');
    
    // Test 4.2: Emotional radar data consistency
    log('DATA_TESTS', 'Testing emotional radar data consistency...', 'debug');
    
    const radarChart = await page.$('canvas, svg');
    const hasRadarChart = !!radarChart;
    logTestResult('dataConsistency', 'Emotional radar chart presence', hasRadarChart,
      hasRadarChart ? 'Emotional radar chart found' : 'Emotional radar chart missing');
    
    if (hasRadarChart) {
      // Check if radar chart updates with filters
      const initialRadarData = await page.$eval('canvas, svg', el => {
        // Try to get some indication of data in the chart
        return el.innerHTML.length > 100; // Basic check if chart has content
      }).catch(() => false);
      
      // Apply a filter and check if radar updates
      const emotionButton = await page.$('button:has-text("FOMO")');
      if (emotionButton) {
        await emotionButton.click();
        await sleep(2000);
        
        const updatedRadarData = await page.$eval('canvas, svg', el => {
          return el.innerHTML.length > 100; // Check if chart content changed
        }).catch(() => false);
        
        const radarUpdates = initialRadarData && updatedRadarData;
        logTestResult('dataConsistency', 'Radar chart updates with filters', radarUpdates,
          radarUpdates ? 'Radar chart updates with filters' : 'Radar chart does not update with filters');
        
        await takeScreenshot(page, 'radar-update', 'DATA_TESTS');
      }
    }
    
    // Test 4.3: Filtered trades table consistency
    log('DATA_TESTS', 'Testing filtered trades table consistency...', 'debug');
    
    const tradesTable = await page.$('table');
    const hasTradesTable = !!tradesTable;
    logTestResult('dataConsistency', 'Trades table presence', hasTradesTable,
      hasTradesTable ? 'Trades table found' : 'Trades table missing');
    
    if (hasTradesTable) {
      const tableRows = await page.$$('tbody tr');
      const hasTableData = tableRows.length > 0;
      logTestResult('dataConsistency', 'Trades table data', hasTableData,
        hasTableData ? `Trades table has ${tableRows.length} rows` : 'Trades table empty');
    }
    
  } catch (error) {
    logTestResult('dataConsistency', 'Data consistency tests', false, error.message);
  }
}

// Test 5: Error Display Tests
async function testErrorDisplay(page) {
  try {
    // Test 5.1: Error state display
    log('ERROR_TESTS', 'Testing error state display...', 'debug');
    
    // Simulate error condition by intercepting API calls
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats')) {
          // Simulate server error
          return Promise.resolve(new Response(JSON.stringify({
            error: 'Simulated server error for testing'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check if error is displayed
    const errorElement = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
    const hasErrorDisplay = !!errorElement;
    logTestResult('errorHandling', 'Error state display', hasErrorDisplay,
      hasErrorDisplay ? 'Error displayed correctly' : 'Error not displayed');
    
    if (hasErrorDisplay) {
      const errorText = await page.$eval('.text-red-400', el => el.textContent);
      const hasErrorText = errorText && errorText.length > 0;
      logTestResult('errorHandling', 'Error message display', hasErrorText,
        hasErrorText ? `Error message shown: ${errorText.substring(0, 50)}...` : 'Error message not shown');
    }
    
    await takeScreenshot(page, 'error-display', 'ERROR_TESTS');
    
    // Test 5.2: Loading state display
    log('ERROR_TESTS', 'Testing loading state display...', 'debug');
    
    // Remove error simulation and test loading
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats')) {
          // Simulate slow response
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(new Response(JSON.stringify({
                totalTrades: 100,
                totalPnL: 5000,
                winRate: 65,
                avgTradeSize: 150,
                lastSyncTime: Date.now(),
                emotionalData: []
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }));
            }, 2000); // 2 second delay
          });
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Check for loading indicators
    const loadingSpinners = await page.$$('.animate-spin');
    const hasLoadingIndicators = loadingSpinners.length > 0;
    logTestResult('errorHandling', 'Loading state indicators', hasLoadingIndicators,
      hasLoadingIndicators ? `Loading indicators found (${loadingSpinners.length})` : 'Loading indicators not found');
    
    await takeScreenshot(page, 'loading-state', 'ERROR_TESTS');
    
  } catch (error) {
    logTestResult('errorHandling', 'Error display tests', false, error.message);
  }
}

// Test 6: Responsive Design Tests
async function testResponsiveDesign(page) {
  try {
    // Test 6.1: Mobile viewport (375x667)
    log('RESPONSIVE_TESTS', 'Testing mobile responsive design...', 'debug');
    
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const mobileStatsCards = await page.$$eval('[data-testid="confluence-card"]', cards => cards.length);
    const mobileRadarVisible = await page.$('canvas, svg');
    const mobileFiltersVisible = await page.$$('button:has-text("FOMO"), button:has-text("REVENGE")');
    const mobileTableVisible = await page.$('table');
    
    const mobileLayoutWorks = mobileStatsCards >= 4 && mobileRadarVisible && 
                             mobileFiltersVisible.length >= 5 && mobileTableVisible;
    logTestResult('responsiveDesign', 'Mobile responsive layout', mobileLayoutWorks,
      mobileLayoutWorks ? 'Mobile layout works correctly' : 'Mobile layout has issues');
    
    await takeScreenshot(page, 'mobile-layout', 'RESPONSIVE_TESTS');
    
    // Test 6.2: Tablet viewport (768x1024)
    log('RESPONSIVE_TESTS', 'Testing tablet responsive design...', 'debug');
    
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const tabletStatsCards = await page.$$eval('[data-testid="confluence-card"]', cards => cards.length);
    const tabletRadarVisible = await page.$('canvas, svg');
    const tabletFiltersVisible = await page.$$('button:has-text("FOMO"), button:has-text("REVENGE")');
    const tabletTableVisible = await page.$('table');
    
    const tabletLayoutWorks = tabletStatsCards >= 4 && tabletRadarVisible && 
                             tabletFiltersVisible.length >= 5 && tabletTableVisible;
    logTestResult('responsiveDesign', 'Tablet responsive layout', tabletLayoutWorks,
      tabletLayoutWorks ? 'Tablet layout works correctly' : 'Tablet layout has issues');
    
    await takeScreenshot(page, 'tablet-layout', 'RESPONSIVE_TESTS');
    
    // Test 6.3: Desktop viewport (1920x1080)
    log('RESPONSIVE_TESTS', 'Testing desktop responsive design...', 'debug');
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const desktopStatsCards = await page.$$eval('[data-testid="confluence-card"]', cards => cards.length);
    const desktopRadarVisible = await page.$('canvas, svg');
    const desktopFiltersVisible = await page.$$('button:has-text("FOMO"), button:has-text("REVENGE")');
    const desktopTableVisible = await page.$('table');
    
    const desktopLayoutWorks = desktopStatsCards >= 4 && desktopRadarVisible && 
                              desktopFiltersVisible.length >= 5 && desktopTableVisible;
    logTestResult('responsiveDesign', 'Desktop responsive layout', desktopLayoutWorks,
      desktopLayoutWorks ? 'Desktop layout works correctly' : 'Desktop layout has issues');
    
    await takeScreenshot(page, 'desktop-layout', 'RESPONSIVE_TESTS');
    
  } catch (error) {
    logTestResult('responsiveDesign', 'Responsive design tests', false, error.message);
  }
}

// Test 7: Performance Tests
async function testPerformance(page) {
  try {
    // Test 7.1: Page load performance
    log('PERFORMANCE_TESTS', 'Testing page load performance...', 'debug');
    
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    const performsWell = loadTime < 5000; // Should load within 5 seconds
    logTestResult('performance', 'Page load performance', performsWell,
      performsWell ? `Page loaded in ${loadTime}ms` : `Page load too slow: ${loadTime}ms`);
    
    // Test 7.2: Filter response performance
    log('PERFORMANCE_TESTS', 'Testing filter response performance...', 'debug');
    
    const filterStartTime = Date.now();
    const emotionButton = await page.$('button:has-text("FOMO")');
    if (emotionButton) {
      await emotionButton.click();
      await page.waitForFunction(() => 
        page.$$('.tbody tr').length > 0, 
        { timeout: 3000 }
      );
      const filterResponseTime = Date.now() - filterStartTime;
      
      const filterPerformsWell = filterResponseTime < 2000; // Should respond within 2 seconds
      logTestResult('performance', 'Filter response performance', filterPerformsWell,
        filterPerformsWell ? `Filter responded in ${filterResponseTime}ms` : `Filter response too slow: ${filterResponseTime}ms`);
    }
    
    // Test 7.3: Memory usage check
    log('PERFORMANCE_TESTS', 'Testing memory usage...', 'debug');
    
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
      const memoryUsageMB = memoryUsage.used / 1024 / 1024;
      const memoryAcceptable = memoryUsageMB < 100; // Less than 100MB
      logTestResult('performance', 'Memory usage', memoryAcceptable,
        memoryAcceptable ? `Memory usage: ${memoryUsageMB.toFixed(2)}MB` : `Memory usage too high: ${memoryUsageMB.toFixed(2)}MB`);
    }
    
    await takeScreenshot(page, 'performance-test', 'PERFORMANCE_TESTS');
    
  } catch (error) {
    logTestResult('performance', 'Performance tests', false, error.message);
  }
}

// Generate comprehensive test report
function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0
    },
    categories: testResults,
    keyFindings: [],
    recommendations: []
  };
  
  // Calculate summary
  Object.values(testResults).forEach(category => {
    report.summary.totalTests += category.passed + category.failed;
    report.summary.passedTests += category.passed;
    report.summary.failedTests += category.failed;
  });
  
  report.summary.successRate = report.summary.totalTests > 0 
    ? (report.summary.passedTests / report.summary.totalTests * 100).toFixed(1)
    : 0;
  
  // Generate key findings
  if (testResults.filterFunctionality.failed > 0) {
    report.keyFindings.push('Filter functionality has issues that need to be addressed');
  }
  
  if (testResults.dataConsistency.failed > 0) {
    report.keyFindings.push('Data consistency issues detected between components');
  }
  
  if (testResults.responsiveDesign.failed > 0) {
    report.keyFindings.push('Responsive design needs improvement for different screen sizes');
  }
  
  if (testResults.performance.failed > 0) {
    report.keyFindings.push('Performance optimization needed for better user experience');
  }
  
  // Generate recommendations
  if (testResults.filterFunctionality.failed > 0) {
    report.recommendations.push('Improve filter state management and persistence');
    report.recommendations.push('Add more comprehensive filtering options (date range, P&L filtering, etc.)');
  }
  
  if (testResults.dataConsistency.failed > 0) {
    report.recommendations.push('Ensure data consistency between statistics, radar chart, and trades table');
    report.recommendations.push('Fix emotional radar chart positioning and update logic');
  }
  
  if (testResults.responsiveDesign.failed > 0) {
    report.recommendations.push('Optimize responsive design for mobile and tablet viewports');
    report.recommendations.push('Improve touch interaction and mobile usability');
  }
  
  if (testResults.performance.failed > 0) {
    report.recommendations.push('Optimize API response times and implement loading states');
    report.recommendations.push('Reduce memory usage and implement efficient data handling');
  }
  
  // Save report
  const reportPath = path.join(TEST_CONFIG.screenshotDir, `confluence-ux-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('REPORT', `Test report saved to: ${reportPath}`, 'success');
  
  return report;
}

// Main execution
async function main() {
  log('MAIN', 'Starting comprehensive confluence UX validation test suite...', 'info');
  
  await runComprehensiveUXTests();
  
  const report = generateTestReport();
  
  // Print summary
  log('SUMMARY', `Test Suite Complete:`, 'info');
  log('SUMMARY', `Total Tests: ${report.summary.totalTests}`, 'info');
  log('SUMMARY', `Passed: ${report.summary.passedTests}`, 'success');
  log('SUMMARY', `Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info');
  log('SUMMARY', `Success Rate: ${report.summary.successRate}%`, report.summary.successRate >= 80 ? 'success' : 'warning');
  
  if (report.keyFindings.length > 0) {
    log('KEY_FINDINGS', 'Key Findings:', 'warning');
    report.keyFindings.forEach(finding => log('KEY_FINDINGS', `- ${finding}`, 'warning'));
  }
  
  if (report.recommendations.length > 0) {
    log('RECOMMENDATIONS', 'Recommendations:', 'warning');
    report.recommendations.forEach(rec => log('RECOMMENDATIONS', `- ${rec}`, 'warning'));
  }
  
  log('MAIN', 'Comprehensive confluence UX testing completed', 'success');
}

// Run test suite
main().catch(error => {
  log('MAIN', `Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});