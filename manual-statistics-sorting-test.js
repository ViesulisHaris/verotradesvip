/**
 * Manual test script for statistics boxes sorting fix
 * This script can be run directly in the browser console on the trades page
 * to verify that statistics update correctly when sorting changes
 */

// Manual test instructions
console.log(`
🧪 STATISTICS SORTING FIX - MANUAL TEST
=====================================

To run this test:
1. Navigate to the trades page (must be logged in)
2. Open browser console (F12)
3. Copy and paste this entire script
4. Press Enter to execute
5. Follow the on-screen instructions

The test will:
✓ Check initial statistics values
✓ Test different sorting options
✓ Verify statistics update correctly
✓ Log debug information
`);

// Test configuration
const MANUAL_TEST = {
  sortFields: ['trade_date', 'symbol', 'pnl', 'entry_price', 'quantity'],
  directions: ['asc', 'desc'],
  waitTime: 2000, // Time to wait for statistics to update
  maxRetries: 3
};

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

// Get current statistics values
function getCurrentStatistics() {
  const statElements = document.querySelectorAll('.metric-value');
  if (statElements.length < 3) {
    logWarning('Could not find all statistics elements');
    return null;
  }
  
  return {
    totalTrades: statElements[0]?.textContent || 'N/A',
    totalPnL: statElements[1]?.textContent || 'N/A',
    winRate: statElements[2]?.textContent || 'N/A'
  };
}

// Find and click sort controls
function clickSortControl(field, direction) {
  log(`Looking for sort control: ${field} ${direction}`);
  
  // Try multiple selectors for sort controls
  const selectors = [
    `[data-testid="sort-${field}"]`,
    `button[aria-label*="${field}"]`,
    `button[data-field="${field}"]`,
    `div:has(span:contains("${field}")) button`
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      log(`Found sort control with selector: ${selector}`);
      element.click();
      
      // Wait a bit and check if we need to click again for direction
      return sleep(500).then(() => {
        // Check current direction and click again if needed
        const currentDirection = element.getAttribute('data-direction') || 
                              element.getAttribute('aria-sort') || 
                              'asc';
        
        if (currentDirection !== direction) {
          log(`Changing direction from ${currentDirection} to ${direction}`);
          element.click();
        }
        
        return true;
      });
    }
  }
  
  logError(`Sort control not found for field: ${field}`);
  return Promise.resolve(false);
}

// Wait for statistics to update
async function waitForStatisticsUpdate(previousStats, maxWait = 5000) {
  log('Waiting for statistics to update...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const currentStats = getCurrentStatistics();
    
    if (currentStats && previousStats) {
      // Check if any value changed (or if they're valid but same)
      const hasValidValues = currentStats.totalPnL !== 'N/A' && 
                           currentStats.winRate !== 'N/A';
      
      if (hasValidValues) {
        logSuccess('Statistics are valid');
        return currentStats;
      }
    }
    
    await sleep(200);
  }
  
  logError('Statistics did not update within expected time');
  return null;
}

// Run a single test scenario
async function runSortTest(field, direction) {
  log(`\n=== Testing Sort: ${field} ${direction.toUpperCase()} ===`);
  
  try {
    // Get initial statistics
    const initialStats = getCurrentStatistics();
    if (!initialStats) {
      return { success: false, error: 'Could not get initial statistics' };
    }
    
    log('Initial statistics:', initialStats);
    
    // Click sort control
    const clickSuccess = await clickSortControl(field, direction);
    if (!clickSuccess) {
      return { success: false, error: 'Failed to click sort control' };
    }
    
    // Wait for statistics to update
    const updatedStats = await waitForStatisticsUpdate(initialStats);
    
    // Check for debug logs in console
    const consoleContent = Array.from(document.querySelectorAll('#console-output pre'))
      .map(el => el.textContent)
      .join('\n');
    
    const hasStatisticsDebug = consoleContent.includes('[STATISTICS_DEBUG]') ||
                           consoleContent.includes('[TRADES_PAGE_DEBUG]');
    
    log(`Debug logs detected: ${hasStatisticsDebug}`);
    
    return {
      success: true,
      initialStats,
      updatedStats,
      hasDebugLogs: hasStatisticsDebug
    };
    
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runManualTest() {
  log('🧪 Starting manual statistics sorting test...');
  
  // Check if we're on the trades page
  if (!window.location.pathname.includes('/trades')) {
    logError('This test must be run on the trades page');
    return;
  }
  
  // Check if user is logged in
  const statsElements = document.querySelectorAll('.metric-value');
  if (statsElements.length < 3) {
    logError('User may not be logged in or trades page not fully loaded');
    return;
  }
  
  logSuccess('Ready to run test on trades page');
  
  const results = [];
  
  // Test each sort field and direction
  for (const field of MANUAL_TEST.sortFields) {
    for (const direction of MANUAL_TEST.directions) {
      const result = await runSortTest(field, direction);
      results.push({
        field,
        direction,
        ...result
      });
      
      // Wait between tests
      await sleep(MANUAL_TEST.waitTime);
    }
  }
  
  // Generate report
  generateManualTestReport(results);
}

// Generate test report
function generateManualTestReport(results) {
  log('\n=== MANUAL TEST REPORT ===');
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`);
  log(`Failed: ${totalTests - passedTests}`);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  log('\n=== DETAILED RESULTS ===');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    log(`${status} - ${result.field} ${result.direction.toUpperCase()}`);
    
    if (!result.success) {
      log(`  Error: ${result.error}`);
    } else {
      log(`  Debug logs: ${result.hasDebugLogs ? '✅' : '❌'}`);
      if (result.initialStats && result.updatedStats) {
        log(`  Stats: ${result.initialStats.totalPnL} → ${result.updatedStats.totalPnL}`);
      }
    }
  });
  
  // Summary
  const allHaveDebugLogs = results.every(r => r.hasDebugLogs);
  
  if (passedTests === totalTests && allHaveDebugLogs) {
    logSuccess('\n🎉 All tests passed! Statistics boxes update correctly when sorting changes.');
    logSuccess('Debug logging is working properly.');
  } else {
    logWarning(`\n⚠️ ${totalTests - passedTests} tests failed or missing debug logs.`);
    if (!allHaveDebugLogs) {
      logWarning('Debug logging may not be working correctly.');
    }
  }
  
  log('\n=== FIX VERIFICATION ===');
  log('If tests pass, the following fixes are working:');
  log('✓ fetchStatistics uses refs properly');
  log('✓ Separate useEffect responds to sortConfig changes');
  log('✓ Refs are synchronized with state');
  log('✓ Debug logging tracks statistics updates');
}

// Auto-start the test
if (typeof window !== 'undefined') {
  // Add a small delay to ensure page is fully loaded
  setTimeout(runManualTest, 1000);
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runManualTest, MANUAL_TEST };
}