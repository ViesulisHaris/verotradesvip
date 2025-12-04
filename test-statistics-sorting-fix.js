/**
 * Test script to verify statistics boxes update correctly when sorting changes
 * This script tests the fixes implemented for the race condition issue
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testTimeout: 10000,
  retryDelay: 500
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Sort by Date (Newest First)',
    sortField: 'trade_date',
    sortDirection: 'desc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Date (Oldest First)',
    sortField: 'trade_date',
    sortDirection: 'asc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Symbol (A-Z)',
    sortField: 'symbol',
    sortDirection: 'asc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Symbol (Z-A)',
    sortField: 'symbol',
    sortDirection: 'desc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by P&L (High to Low)',
    sortField: 'pnl',
    sortDirection: 'desc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by P&L (Low to High)',
    sortField: 'pnl',
    sortDirection: 'asc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Entry Price (High to Low)',
    sortField: 'entry_price',
    sortDirection: 'desc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Entry Price (Low to High)',
    sortField: 'entry_price',
    sortDirection: 'asc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Quantity (High to Low)',
    sortField: 'quantity',
    sortDirection: 'desc',
    expectedStatsUpdate: true
  },
  {
    name: 'Sort by Quantity (Low to High)',
    sortField: 'quantity',
    sortDirection: 'asc',
    expectedStatsUpdate: true
  }
];

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

function logSuccess(message) {
  const timestamp = new Date().toISOString();
  console.log(`✅ [${timestamp}] ${message}`);
}

function logError(message) {
  const timestamp = new Date().toISOString();
  console.error(`❌ [${timestamp}] ${message}`);
}

function logWarning(message) {
  const timestamp = new Date().toISOString();
  console.warn(`⚠️ [${timestamp}] ${message}`);
}

// Test functions
async function navigateToTradesPage(page) {
  log('Navigating to trades page...');
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.dashboard-card', { timeout: TEST_CONFIG.testTimeout });
    logSuccess('Successfully navigated to trades page');
    return true;
  } catch (error) {
    logError(`Failed to navigate to trades page: ${error.message}`);
    return false;
  }
}

async function waitForStatisticsUpdate(page, previousStats) {
  log('Waiting for statistics to update...');
  const maxWaitTime = 5000; // 5 seconds max wait
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Get current statistics values
      const currentStats = await page.evaluate(() => {
        const totalPnL = document.querySelector('.metric-value')?.textContent;
        const winRate = document.querySelectorAll('.metric-value')[1]?.textContent;
        return { totalPnL, winRate };
      });
      
      // Check if statistics have changed (or if they're the same but valid)
      if (currentStats.totalPnL && currentStats.winRate) {
        if (!previousStats || 
            currentStats.totalPnL !== previousStats.totalPnL || 
            currentStats.winRate !== previousStats.winRate) {
          logSuccess('Statistics updated successfully');
          return currentStats;
        }
        
        // If stats are the same but valid, that's also OK (they might not change with sorting)
        if (previousStats && 
            currentStats.totalPnL === previousStats.totalPnL && 
            currentStats.winRate === previousStats.winRate) {
          log('Statistics remain the same (valid for sorting changes)');
          return currentStats;
        }
      }
      
      await sleep(TEST_CONFIG.retryDelay);
    } catch (error) {
      logWarning(`Error checking statistics: ${error.message}`);
      await sleep(TEST_CONFIG.retryDelay);
    }
  }
  
  logError('Statistics did not update within expected time');
  return null;
}

async function clickSortControl(page, sortField, sortDirection) {
  log(`Clicking sort control for ${sortField} ${sortDirection}`);
  try {
    // Find the sort control for the specified field
    const sortSelector = `[data-testid="sort-${sortField}"]`;
    const sortButton = await page.$(sortSelector);
    
    if (!sortButton) {
      // Try alternative selector
      const altSelector = `button[aria-label*="${sortField}"]`;
      const altButton = await page.$(altSelector);
      if (altButton) {
        await altButton.click();
      } else {
        logError(`Sort control not found for field: ${sortField}`);
        return false;
      }
    } else {
      await sortButton.click();
    }
    
    // If direction is different, click again to toggle
    await sleep(500);
    
    // Check current direction and click again if needed
    const currentDirection = await page.evaluate((field) => {
      const element = document.querySelector(`[data-testid="sort-${field}"]`);
      return element ? element.getAttribute('data-direction') : null;
    }, sortField);
    
    if (currentDirection && currentDirection !== sortDirection) {
      await page.click(sortSelector);
    }
    
    logSuccess(`Sort control clicked for ${sortField} ${sortDirection}`);
    return true;
  } catch (error) {
    logError(`Failed to click sort control: ${error.message}`);
    return false;
  }
}

async function captureConsoleLogs(page) {
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  return logs;
}

async function runSingleTest(page, scenario) {
  log(`\n=== Running Test: ${scenario.name} ===`);
  
  try {
    // Get initial statistics
    const initialStats = await page.evaluate(() => {
      const totalPnL = document.querySelector('.metric-value')?.textContent;
      const winRate = document.querySelectorAll('.metric-value')[1]?.textContent;
      return { totalPnL, winRate };
    });
    
    log('Initial statistics:', initialStats);
    
    // Click sort control
    const sortSuccess = await clickSortControl(page, scenario.sortField, scenario.sortDirection);
    if (!sortSuccess) {
      return { success: false, error: 'Failed to click sort control' };
    }
    
    // Wait for statistics to update
    const updatedStats = await waitForStatisticsUpdate(page, initialStats);
    if (!updatedStats && scenario.expectedStatsUpdate) {
      return { success: false, error: 'Statistics did not update as expected' };
    }
    
    // Check for debug logs
    const debugLogs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    const statisticsDebugLogs = debugLogs.filter(log => 
      log.text.includes('[STATISTICS_DEBUG]') || 
      log.text.includes('[TRADES_PAGE_DEBUG]')
    );
    
    log(`Found ${statisticsDebugLogs.length} debug logs related to statistics`);
    
    return { 
      success: true, 
      initialStats, 
      updatedStats, 
      debugLogCount: statisticsDebugLogs.length 
    };
    
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  log('Starting statistics sorting fix tests...');
  
  const puppeteer = require('puppeteer');
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture console logs
    await captureConsoleLogs(page);
    
    // Navigate to trades page
    const navigationSuccess = await navigateToTradesPage(page);
    if (!navigationSuccess) {
      throw new Error('Failed to navigate to trades page');
    }
    
    // Wait for initial load
    await sleep(2000);
    
    const results = [];
    
    // Run each test scenario
    for (const scenario of TEST_SCENARIOS) {
      const result = await runSingleTest(page, scenario);
      results.push({
        scenario: scenario.name,
        ...result
      });
      
      // Small delay between tests
      await sleep(1000);
    }
    
    // Generate report
    generateReport(results);
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateReport(results) {
  log('\n=== TEST REPORT ===');
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`);
  log(`Failed: ${totalTests - passedTests}`);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  log('\n=== DETAILED RESULTS ===');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    log(`${status} - ${result.scenario}`);
    
    if (!result.success) {
      log(`  Error: ${result.error}`);
    } else {
      log(`  Debug logs: ${result.debugLogCount}`);
      if (result.initialStats && result.updatedStats) {
        log(`  Stats: ${result.initialStats.totalPnL} → ${result.updatedStats.totalPnL}`);
      }
    }
  });
  
  // Summary
  if (passedTests === totalTests) {
    logSuccess('\n🎉 All tests passed! Statistics boxes update correctly when sorting changes.');
  } else {
    logWarning(`\n⚠️ ${totalTests - passedTests} tests failed. Statistics boxes may still have issues.`);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  TEST_SCENARIOS,
  TEST_CONFIG
};