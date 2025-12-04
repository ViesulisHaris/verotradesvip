const puppeteer = require('puppeteer');
const fs = require('fs');

// Debug report structure
const debugReport = {
  timestamp: new Date().toISOString(),
  marketFilter: {
    issue: 'Market filter doesn\'t work correctly',
    tests: [],
    findings: [],
    rootCause: null,
    recommendations: []
  },
  statisticsBoxes: {
    issue: 'Statistics boxes stop working when sorting',
    tests: [],
    findings: [],
    rootCause: null,
    recommendations: []
  },
  recentOptimizations: {
    analysis: [],
    potentialImpacts: []
  }
};

// Helper function to log debug info
function logDebug(category, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    message,
    data
  };
  
  console.log(`[${timestamp}] [${category}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  return logEntry;
}

// Test Market Filter Functionality
async function testMarketFilter(page) {
  logDebug('MARKET_FILTER', 'Starting Market filter functionality test');
  
  try {
    // Navigate to trades page
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to login (authentication required)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      logDebug('MARKET_FILTER', 'Redirected to login, authentication required');
      
      // Try to login with test credentials or skip this test
      const finding = logDebug('MARKET_FILTER', 'Cannot test without authentication - skipping market filter test');
      debugReport.marketFilter.findings.push(finding);
      return false;
    }
    
    // Look for market dropdown
    const marketSelectors = [
      'select[name="market"]',
      'select#market',
      '[data-testid="market-filter"]',
      'select'
    ];
    
    let marketDropdown = null;
    for (const selector of marketSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        marketDropdown = await page.$(selector);
        if (marketDropdown) {
          logDebug('MARKET_FILTER', `Found market dropdown with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!marketDropdown) {
      const finding = logDebug('MARKET_FILTER', 'Market dropdown not found', { 
        selectors: marketSelectors 
      });
      debugReport.marketFilter.findings.push(finding);
      return false;
    }
    
    // Get available market options
    const marketOptions = await page.evaluate(() => {
      const select = document.querySelector('select[name="market"], select#market, [data-testid="market-filter"], select');
      if (!select) return [];
      return Array.from(select.options).map(option => ({
        value: option.value,
        text: option.textContent
      }));
    });
    
    logDebug('MARKET_FILTER', 'Available market options', marketOptions);
    
    // Get initial trades count
    const initialTradesCount = await page.evaluate(() => {
      const tradeElements = document.querySelectorAll('[data-testid="trade-item"], .dashboard-card, [class*="trade"]');
      return tradeElements.length;
    });
    
    logDebug('MARKET_FILTER', 'Initial trades count', { count: initialTradesCount });
    
    // Test filtering by first non-empty market option
    const testOption = marketOptions.find(option => option.value && option.value !== '');
    if (!testOption) {
      const finding = logDebug('MARKET_FILTER', 'No valid market options found for testing');
      debugReport.marketFilter.findings.push(finding);
      return false;
    }
    
    logDebug('MARKET_FILTER', `Testing filter for market: ${testOption.text} (${testOption.value})`);
    
    // Select market option
    await page.select('select', testOption.value);
    
    // Wait for debounced filter to apply
    await page.waitForTimeout(1000);
    
    // Check if filter was applied
    const filteredTradesCount = await page.evaluate(() => {
      const tradeElements = document.querySelectorAll('[data-testid="trade-item"], .dashboard-card, [class*="trade"]');
      return tradeElements.length;
    });
    
    // Check network requests to see if filter was sent to API
    const networkRequests = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/api/') || entry.name.includes('supabase'))
        .map(entry => ({
          url: entry.name,
          method: entry.initiatorType,
          timestamp: entry.startTime
        }));
    });
    
    const testResult = {
      market: testOption.text,
      value: testOption.value,
      initialCount: initialTradesCount,
      filteredCount: filteredTradesCount,
      networkRequests: networkRequests.length,
      filterApplied: filteredTradesCount !== initialTradesCount,
      networkRequestsFound: networkRequests.length > 0
    };
    
    debugReport.marketFilter.tests.push(testResult);
    logDebug('MARKET_FILTER', `Filter test result for ${testOption.text}`, testResult);
    
    // Check if the filter value is being passed to the API
    const apiCallWithMarket = networkRequests.filter(req => 
      req.url.includes(`market=${testOption.value}`) || 
      req.url.includes('market=')
    );
    
    if (apiCallWithMarket.length === 0) {
      const finding = logDebug('MARKET_FILTER', 'Market filter not being passed to API', {
        market: testOption.value,
        expectedPattern: `market=${testOption.value}`,
        networkRequests: networkRequests.map(req => req.url)
      });
      debugReport.marketFilter.findings.push(finding);
    }
    
    return true;
    
  } catch (error) {
    const errorFinding = logDebug('MARKET_FILTER', 'Error during market filter test', { error: error.message });
    debugReport.marketFilter.findings.push(errorFinding);
    return false;
  }
}

// Test Statistics Boxes During Sorting
async function testStatisticsBoxes(page) {
  logDebug('STATISTICS_BOXES', 'Starting statistics boxes during sorting test');
  
  try {
    // Navigate to trades page
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      logDebug('STATISTICS_BOXES', 'Redirected to login, authentication required');
      const finding = logDebug('STATISTICS_BOXES', 'Cannot test without authentication - skipping statistics test');
      debugReport.statisticsBoxes.findings.push(finding);
      return false;
    }
    
    // Look for statistics boxes
    const statsSelectors = [
      '[data-testid="statistics-boxes"]',
      '.key-metrics-grid',
      '[data-testid="total-pnl"]',
      '[data-testid="win-rate"]',
      '[data-testid="total-trades"]'
    ];
    
    let statsFound = false;
    for (const selector of statsSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        statsFound = true;
        logDebug('STATISTICS_BOXES', `Found statistics element with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!statsFound) {
      const finding = logDebug('STATISTICS_BOXES', 'Statistics boxes not found on page', {
        selectors: statsSelectors
      });
      debugReport.statisticsBoxes.findings.push(finding);
      return false;
    }
    
    // Get initial statistics
    const initialStats = await page.evaluate(() => {
      const statsContainer = document.querySelector('[data-testid="statistics-boxes"], .key-metrics-grid');
      if (!statsContainer) return null;
      
      const totalPnL = statsContainer.querySelector('[data-testid="total-pnl"]')?.textContent;
      const winRate = statsContainer.querySelector('[data-testid="win-rate"]')?.textContent;
      const totalTrades = statsContainer.querySelector('[data-testid="total-trades"]')?.textContent;
      
      return { totalPnL, winRate, totalTrades };
    });
    
    logDebug('STATISTICS_BOXES', 'Initial statistics', initialStats);
    
    // Look for sort controls
    const sortSelectors = [
      '[data-testid="sort-trade_date"]',
      '[data-testid="sort-symbol"]',
      '[data-testid="sort-pnl"]',
      'button[onclick*="sort"]',
      'button[aria-label*="sort"]',
      '.sort-indicator',
      'th[onclick]'
    ];
    
    let sortControlFound = false;
    for (const selector of sortSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        sortControlFound = true;
        logDebug('STATISTICS_BOXES', `Found sort control with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!sortControlFound) {
      const finding = logDebug('STATISTICS_BOXES', 'Sort controls not found on page', {
        selectors: sortSelectors
      });
      debugReport.statisticsBoxes.findings.push(finding);
      return false;
    }
    
    // Try to click on a sort control
    const sortButtons = await page.$$('button, th[onclick], [data-testid*="sort"]');
    if (sortButtons.length > 0) {
      logDebug('STATISTICS_BOXES', `Found ${sortButtons.length} sort buttons, clicking first one`);
      
      // Get stats before sorting
      const statsBeforeSort = await page.evaluate(() => {
        const statsContainer = document.querySelector('[data-testid="statistics-boxes"], .key-metrics-grid');
        if (!statsContainer) return null;
        
        const totalPnL = statsContainer.querySelector('[data-testid="total-pnl"]')?.textContent;
        const winRate = statsContainer.querySelector('[data-testid="win-rate"]')?.textContent;
        const totalTrades = statsContainer.querySelector('[data-testid="total-trades"]')?.textContent;
        
        return { totalPnL, winRate, totalTrades };
      });
      
      // Click sort button
      await sortButtons[0].click();
      
      // Wait for sorting to apply
      await page.waitForTimeout(1000);
      
      // Check if statistics are still functional after sorting
      const statsAfterSort = await page.evaluate(() => {
        const statsContainer = document.querySelector('[data-testid="statistics-boxes"], .key-metrics-grid');
        if (!statsContainer) return null;
        
        const totalPnL = statsContainer.querySelector('[data-testid="total-pnl"]')?.textContent;
        const winRate = statsContainer.querySelector('[data-testid="win-rate"]')?.textContent;
        const totalTrades = statsContainer.querySelector('[data-testid="total-trades"]')?.textContent;
        
        // Check if statistics are interactive (clickable, not just static text)
        const isInteractive = statsContainer.querySelector('button, [onclick], [role="button"]') !== null;
        
        return { totalPnL, winRate, totalTrades, isInteractive };
      });
      
      const sortTest = {
        statsBefore: statsBeforeSort,
        statsAfter: statsAfterSort,
        statsChanged: JSON.stringify(statsBeforeSort) !== JSON.stringify(statsAfterSort),
        statsFunctional: statsAfterSort !== null,
        statsInteractive: statsAfterSort?.isInteractive || false
      };
      
      debugReport.statisticsBoxes.tests.push(sortTest);
      logDebug('STATISTICS_BOXES', 'Sort test result', sortTest);
      
      if (statsAfterSort === null) {
        const finding = logDebug('STATISTICS_BOXES', 'Statistics boxes became non-functional after sorting');
        debugReport.statisticsBoxes.findings.push(finding);
      }
    }
    
    return true;
    
  } catch (error) {
    const errorFinding = logDebug('STATISTICS_BOXES', 'Error during statistics boxes test', { error: error.message });
    debugReport.statisticsBoxes.findings.push(errorFinding);
    return false;
  }
}

// Analyze Recent Optimizations
async function analyzeRecentOptimizations(page) {
  logDebug('OPTIMIZATIONS', 'Analyzing recent optimizations for potential impacts');
  
  try {
    // Navigate to trades page
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Check if optimization features are active
    const optimizationChecks = await page.evaluate(() => {
      const checks = {
        debouncingActive: false,
        memoizationActive: false,
        localStorageCachingActive: false,
        performanceMonitoringActive: false,
        reactMemoActive: false
      };
      
      // Check for debouncing
      if (window.debounceTimeout || window.filterDebounce || window.createDebouncedFunction) {
        checks.debouncingActive = true;
      }
      
      // Check for memoization
      if (window.memoCache || window.__memoCacheStats || window.memoizedTradeProcessing) {
        checks.memoizationActive = true;
      }
      
      // Check for localStorage caching
      try {
        const testKey = 'test_cache_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        checks.localStorageCachingActive = true;
      } catch (e) {
        checks.localStorageCachingActive = false;
      }
      
      // Check for performance monitoring
      if (window.performance && window.performance.getEntriesByType) {
        checks.performanceMonitoringActive = true;
      }
      
      // Check for React.memo usage (indirect check)
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        checks.reactMemoActive = true;
      }
      
      return checks;
    });
    
    logDebug('OPTIMIZATIONS', 'Optimization features status', optimizationChecks);
    debugReport.recentOptimizations.analysis.push(optimizationChecks);
    
    // Check for potential issues with useEffect dependencies
    const useEffectAnalysis = await page.evaluate(() => {
      // Look for common patterns that might cause issues
      const patterns = {
        circularDependencies: false,
        missingDependencies: false,
        excessiveReRenders: false
      };
      
      // This is a simplified check - in reality would need more detailed analysis
      if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        const resourceEntries = window.performance.getEntriesByType('resource');
        
        // Check for excessive API calls (potential useEffect issues)
        const apiCalls = resourceEntries.filter(entry => 
          entry.name.includes('/api/') || entry.name.includes('supabase')
        );
        
        if (apiCalls.length > 10) {
          patterns.excessiveReRenders = true;
        }
      }
      
      return patterns;
    });
    
    debugReport.recentOptimizations.analysis.push(useEffectAnalysis);
    
    return true;
    
  } catch (error) {
    const errorFinding = logDebug('OPTIMIZATIONS', 'Error during optimization analysis', { error: error.message });
    debugReport.recentOptimizations.analysis.push(errorFinding);
    return false;
  }
}

// Main debugging function
async function runDebugAnalysis() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set up error handling
  page.on('error', (error) => {
    logDebug('BROWSER_ERROR', 'Page error', { error: error.message });
  });
  
  page.on('pageerror', (error) => {
    logDebug('PAGE_ERROR', 'JavaScript error', { error: error.message });
  });
  
  // Monitor console
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logDebug('CONSOLE_ERROR', msg.text(), { type: msg.type(), location: msg.location() });
    }
  });
  
  // Monitor network requests
  page.on('request', (request) => {
    if (request.url().includes('/api/') || request.url().includes('supabase')) {
      logDebug('NETWORK_REQUEST', 'API call', { url: request.url(), method: request.method() });
    }
  });
  
  try {
    logDebug('MAIN', 'Starting comprehensive debugging analysis');
    
    // Set up console error capture
    await page.evaluateOnNewDocument(() => {
      window.consoleErrors = [];
      const originalError = console.error;
      console.error = function(...args) {
        window.consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
    
    // Test 1: Market Filter Functionality
    const marketFilterResult = await testMarketFilter(page);
    
    // Test 2: Statistics Boxes During Sorting
    const statisticsBoxesResult = await testStatisticsBoxes(page);
    
    // Test 3: Analyze Recent Optimizations
    const optimizationsResult = await analyzeRecentOptimizations(page);
    
    logDebug('MAIN', 'Debug analysis completed', {
      marketFilterResult,
      statisticsBoxesResult,
      optimizationsResult
    });
    
  } catch (error) {
    logDebug('MAIN', 'Error during debug analysis', { error: error.message });
  } finally {
    await browser.close();
  }
}

// Run the debug analysis
if (require.main === module) {
  runDebugAnalysis()
    .then(() => {
      // Save debug report
      const reportPath = `debug-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
      console.log(`\nDebug report saved to: ${reportPath}`);
      
      // Print summary
      console.log('\n=== DEBUG ANALYSIS SUMMARY ===');
      console.log('Market Filter Issues:', debugReport.marketFilter.findings.length);
      console.log('Statistics Boxes Issues:', debugReport.statisticsBoxes.findings.length);
      console.log('Optimization Analysis Items:', debugReport.recentOptimizations.analysis.length);
      
      // Print key findings
      if (debugReport.marketFilter.findings.length > 0) {
        console.log('\n=== MARKET FILTER KEY FINDINGS ===');
        debugReport.marketFilter.findings.forEach(finding => {
          console.log(`- ${finding.message}`);
        });
      }
      
      if (debugReport.statisticsBoxes.findings.length > 0) {
        console.log('\n=== STATISTICS BOXES KEY FINDINGS ===');
        debugReport.statisticsBoxes.findings.forEach(finding => {
          console.log(`- ${finding.message}`);
        });
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Debug analysis failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testMarketFilter,
  testStatisticsBoxes,
  analyzeRecentOptimizations,
  debugReport
};