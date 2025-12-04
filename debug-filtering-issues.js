const puppeteer = require('puppeteer');
const fs = require('fs');

// Debug configuration
const DEBUG_CONFIG = {
  headless: false,
  slowMo: 100,
  timeout: 30000,
  viewport: { width: 1920, height: 1080 }
};

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

// Helper function to wait for network idle
async function waitForNetworkIdle(page, timeout = 2000) {
  await page.waitForLoadState('networkidle', { timeout });
}

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
    await page.goto('http://localhost:3000/trades');
    await waitForNetworkIdle(page);
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="trades-page"]', { timeout: 10000 });
    
    // Check initial state
    const initialTrades = await page.evaluate(() => {
      const tradeElements = document.querySelectorAll('[data-testid="trade-item"]');
      return Array.from(tradeElements).map(el => ({
        symbol: el.querySelector('[data-testid="trade-symbol"]')?.textContent,
        market: el.querySelector('[data-testid="trade-market"]')?.textContent
      }));
    });
    
    logDebug('MARKET_FILTER', 'Initial trades loaded', { count: initialTrades.length, trades: initialTrades.slice(0, 3) });
    
    // Find market dropdown
    const marketDropdown = await page.$('select[name="market"], select#market, [data-testid="market-filter"]');
    if (!marketDropdown) {
      const finding = logDebug('MARKET_FILTER', 'Market dropdown not found', { 
        selectors: ['select[name="market"]', 'select#market', '[data-testid="market-filter"]'] 
      });
      debugReport.marketFilter.findings.push(finding);
      return false;
    }
    
    // Get available market options
    const marketOptions = await page.evaluate(() => {
      const select = document.querySelector('select[name="market"], select#market, [data-testid="market-filter"]');
      if (!select) return [];
      return Array.from(select.options).map(option => ({
        value: option.value,
        text: option.textContent
      }));
    });
    
    logDebug('MARKET_FILTER', 'Available market options', marketOptions);
    
    // Test filtering by each market type
    for (const option of marketOptions) {
      if (!option.value) continue; // Skip "All Markets" option
      
      logDebug('MARKET_FILTER', `Testing filter for market: ${option.text} (${option.value})`);
      
      // Select market option
      await page.select('select[name="market"], select#market, [data-testid="market-filter"]', option.value);
      
      // Wait for debounced filter to apply (150ms + buffer)
      await page.waitForTimeout(500);
      await waitForNetworkIdle(page);
      
      // Check if filter was applied
      const filteredTrades = await page.evaluate((selectedMarket) => {
        const tradeElements = document.querySelectorAll('[data-testid="trade-item"]');
        return Array.from(tradeElements).map(el => ({
          symbol: el.querySelector('[data-testid="trade-symbol"]')?.textContent,
          market: el.querySelector('[data-testid="trade-market"]')?.textContent
        })).filter(trade => trade.market === selectedMarket);
      }, option.text);
      
      // Check network requests to see if filter was sent to API
      const networkRequests = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/trades') || entry.name.includes('supabase'))
          .map(entry => ({
            url: entry.name,
            method: entry.initiatorType,
            timestamp: entry.startTime
          }));
      });
      
      const testResult = {
        market: option.text,
        value: option.value,
        initialCount: initialTrades.length,
        filteredCount: filteredTrades.length,
        networkRequests: networkRequests.length,
        filterApplied: filteredTrades.length < initialTrades.length,
        networkRequestsFound: networkRequests.length > 0
      };
      
      debugReport.marketFilter.tests.push(testResult);
      logDebug('MARKET_FILTER', `Filter test result for ${option.text}`, testResult);
      
      // Check if the filter value is being passed to the API
      const apiCallWithMarket = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('market='))
          .map(entry => entry.name);
      });
      
      if (apiCallWithMarket.length === 0) {
        const finding = logDebug('MARKET_FILTER', 'Market filter not being passed to API', {
          market: option.value,
          expectedPattern: `market=${option.value}`
        });
        debugReport.marketFilter.findings.push(finding);
      }
    }
    
    // Test "All Markets" option
    await page.select('select[name="market"], select#market, [data-testid="market-filter"]', '');
    await page.waitForTimeout(500);
    await waitForNetworkIdle(page);
    
    const allMarketsTrades = await page.evaluate(() => {
      const tradeElements = document.querySelectorAll('[data-testid="trade-item"]');
      return tradeElements.length;
    });
    
    const resetTest = {
      action: 'Reset to All Markets',
      expectedCount: initialTrades.length,
      actualCount: allMarketsTrades,
      resetSuccessful: allMarketsTrades === initialTrades.length
    };
    
    debugReport.marketFilter.tests.push(resetTest);
    logDebug('MARKET_FILTER', 'Reset test result', resetTest);
    
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
    await page.goto('http://localhost:3000/trades');
    await waitForNetworkIdle(page);
    
    // Wait for statistics boxes to load
    await page.waitForSelector('[data-testid="statistics-boxes"], .key-metrics-grid', { timeout: 10000 });
    
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
    
    if (!initialStats) {
      const finding = logDebug('STATISTICS_BOXES', 'Statistics boxes not found on page');
      debugReport.statisticsBoxes.findings.push(finding);
      return false;
    }
    
    // Test each sort option
    const sortOptions = [
      { field: 'trade_date', direction: 'desc', label: 'Date (Newest First)' },
      { field: 'trade_date', direction: 'asc', label: 'Date (Oldest First)' },
      { field: 'symbol', direction: 'asc', label: 'Symbol (A-Z)' },
      { field: 'symbol', direction: 'desc', label: 'Symbol (Z-A)' },
      { field: 'pnl', direction: 'desc', label: 'P&L (High to Low)' },
      { field: 'pnl', direction: 'asc', label: 'P&L (Low to High)' }
    ];
    
    for (const sortOption of sortOptions) {
      logDebug('STATISTICS_BOXES', `Testing sort: ${sortOption.label}`);
      
      // Click sort control
      const sortSelector = `[data-testid="sort-${sortOption.field}"], [data-testid="sort-${sortOption.field}-${sortOption.direction}"]`;
      const sortButton = await page.$(sortSelector);
      
      if (!sortButton) {
        // Try alternative selector
        const altSelector = `button[onclick*="${sortOption.field}"], button[aria-label*="${sortOption.field}"]`;
        const altButton = await page.$(altSelector);
        
        if (!altButton) {
          const finding = logDebug('STATISTICS_BOXES', `Sort control not found for ${sortOption.label}`, {
            selector: sortSelector,
            altSelector
          });
          debugReport.statisticsBoxes.findings.push(finding);
          continue;
        }
        
        await altButton.click();
      } else {
        await sortButton.click();
      }
      
      // Wait for sorting to apply
      await page.waitForTimeout(500);
      await waitForNetworkIdle(page);
      
      // Check if statistics are still functional
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
        sortOption: sortOption.label,
        field: sortOption.field,
        direction: sortOption.direction,
        statsBefore: initialStats,
        statsAfter: statsAfterSort,
        statsChanged: JSON.stringify(initialStats) !== JSON.stringify(statsAfterSort),
        statsFunctional: statsAfterSort !== null,
        statsInteractive: statsAfterSort?.isInteractive || false
      };
      
      debugReport.statisticsBoxes.tests.push(sortTest);
      logDebug('STATISTICS_BOXES', `Sort test result for ${sortOption.label}`, sortTest);
      
      // Check if statistics calculation is being triggered during sort
      const statsApiCalls = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('statistics') || entry.name.includes('stats'))
          .map(entry => entry.name);
      });
      
      if (statsApiCalls.length === 0) {
        const finding = logDebug('STATISTICS_BOXES', 'Statistics API calls not triggered during sort', {
          sortOption: sortOption.label,
          expectedPattern: 'statistics'
        });
        debugReport.statisticsBoxes.findings.push(finding);
      }
      
      // Check for JavaScript errors during sorting
      const jsErrors = await page.evaluate(() => {
        return window.consoleErrors || [];
      });
      
      if (jsErrors.length > 0) {
        const finding = logDebug('STATISTICS_BOXES', 'JavaScript errors during sorting', {
          sortOption: sortOption.label,
          errors: jsErrors
        });
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
    // Check if optimization features are active
    const optimizationChecks = await page.evaluate(() => {
      const checks = {
        debouncingActive: false,
        memoizationActive: false,
        localStorageCachingActive: false,
        performanceMonitoringActive: false
      };
      
      // Check for debouncing
      if (window.debounceTimeout || window.filterDebounce) {
        checks.debouncingActive = true;
      }
      
      // Check for memoization
      if (window.memoCache || window.__memoCacheStats) {
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
      
      return checks;
    });
    
    logDebug('OPTIMIZATIONS', 'Optimization features status', optimizationChecks);
    debugReport.recentOptimizations.analysis.push(optimizationChecks);
    
    // Check useEffect dependencies in the page
    const useEffectAnalysis = await page.evaluate(() => {
      // Look for React DevTools or component state
      const reactDevTools = document.querySelector('[data-reactroot]');
      const componentState = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      return {
        reactDevToolsPresent: !!reactDevTools,
        componentStateAvailable: !!componentState,
        potentialUseEffectIssues: [] // This would need more detailed analysis
      };
    });
    
    debugReport.recentOptimizations.analysis.push(useEffectAnalysis);
    
    // Check for potential race conditions
    const raceConditionCheck = await page.evaluate(() => {
      const checks = {
        multipleApiCalls: 0,
        stateUpdateConflicts: false,
        debouncingConflicts: false
      };
      
      // Monitor network activity for a short period
      const startTime = Date.now();
      const initialCallCount = window.performance.getEntriesByType('resource').length;
      
      return new Promise(resolve => {
        setTimeout(() => {
          const finalCallCount = window.performance.getEntriesByType('resource').length;
          checks.multipleApiCalls = finalCallCount - initialCallCount;
          resolve(checks);
        }, 1000);
      });
    });
    
    debugReport.recentOptimizations.analysis.push(await raceConditionCheck);
    
    return true;
    
  } catch (error) {
    const errorFinding = logDebug('OPTIMIZATIONS', 'Error during optimization analysis', { error: error.message });
    debugReport.recentOptimizations.analysis.push(errorFinding);
    return false;
  }
}

// Main debugging function
async function runDebugAnalysis() {
  const browser = await puppeteer.launch(DEBUG_CONFIG);
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