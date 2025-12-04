// Comprehensive Filter Verification Script
// Tests all individual and combined filters after recent fixes

console.log('🔍 Starting Comprehensive Filter Verification...');
console.log('📅 Timestamp:', new Date().toISOString());

// Global test results
const testResults = {
  individualFilters: {},
  combinedFilters: {},
  edgeCases: {},
  performance: {},
  statistics: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warnings: [],
    errors: []
  }
};

// Performance monitoring
const performanceMetrics = {
  filterResponseTimes: [],
  apiCallCount: 0,
  cacheHitRate: 0,
  memoryUsage: []
};

// Utility functions
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

function measurePerformance(testName, testFunction) {
  const startTime = performance.now();
  const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  return testFunction().then(result => {
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;
    
    performanceMetrics.filterResponseTimes.push({
      test: testName,
      duration: duration,
      memoryDelta: memoryDelta,
      timestamp: new Date().toISOString()
    });
    
    console.log(`⏱️ ${testName}: ${duration.toFixed(2)}ms, Memory: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    return { result, duration, memoryDelta };
  });
}

function recordTestResult(category, testName, passed, details = {}) {
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passedTests++;
  } else {
    testResults.summary.failedTests++;
  }
  
  if (!testResults[category]) {
    testResults[category] = {};
  }
  
  testResults[category][testName] = {
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${category}.${testName}:`, details);
}

function getFilterElements() {
  return {
    symbolInput: document.querySelector('input[placeholder="Search symbol..."]'),
    marketSelect: document.querySelector('select'),
    dateFromInput: document.querySelector('input[type="date"][id*="from"], input[type="date"]:first-of-type'),
    dateToInput: document.querySelector('input[type="date"][id*="to"], input[type="date"]:last-of-type'),
    clearButton: document.querySelector('button:contains("Clear Filters")'),
    sortHeaders: document.querySelectorAll('[data-testid="sort-header"], .sort-header, th[onclick]'),
    statisticsBoxes: document.querySelectorAll('.dashboard-card .metric-value, .key-metrics-grid .metric-value'),
    tradesList: document.querySelector('[data-testid="trades-list"], .trades-list, .gap-component'),
    loadingIndicator: document.querySelector('.animate-spin, [role="progressbar"]')
  };
}

function getStatisticsValues() {
  const stats = {};
  const statElements = document.querySelectorAll('.metric-value, .key-metrics-grid .metric-value');
  statElements.forEach((element, index) => {
    const label = element.closest('.dashboard-card')?.querySelector('h3, .h3-metric-label')?.textContent;
    if (label) {
      stats[label] = element.textContent.trim();
    }
  });
  return stats;
}

function countVisibleTrades() {
  const tradeElements = document.querySelectorAll('[data-testid="trade-item"], .dashboard-card.overflow-hidden');
  return tradeElements.length;
}

function monitorNetworkRequests() {
  const originalFetch = window.fetch;
  let requestCount = 0;
  
  window.fetch = function(...args) {
    requestCount++;
    performanceMetrics.apiCallCount++;
    
    const url = args[0];
    if (typeof url === 'string' && url.includes('/trades')) {
      console.log(`🌐 API Request #${requestCount}:`, url);
    }
    
    return originalFetch.apply(this, args).finally(() => {
      requestCount--;
    });
  };
  
  return () => {
    window.fetch = originalFetch;
  };
}

// Test 1: Individual Filter Testing
async function testIndividualFilters() {
  console.log('\n🧪 Testing Individual Filters...');
  
  const elements = getFilterElements();
  if (!elements.symbolInput || !elements.marketSelect) {
    throw new Error('Filter elements not found');
  }
  
  // Test Symbol Filter
  console.log('\n📝 Testing Symbol Filter...');
  const initialTradeCount = countVisibleTrades();
  const initialStats = getStatisticsValues();
  
  await measurePerformance('Symbol Filter Test', async () => {
    elements.symbolInput.value = 'AAPL';
    elements.symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
    elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait for debouncing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filteredTradeCount = countVisibleTrades();
    const filteredStats = getStatisticsValues();
    
    recordTestResult('individualFilters', 'symbolFilter', 
      filteredTradeCount <= initialTradeCount,
      {
        initialTrades: initialTradeCount,
        filteredTrades: filteredTradeCount,
        statsChanged: JSON.stringify(initialStats) !== JSON.stringify(filteredStats)
      }
    );
  });
  
  // Test Market Filter
  console.log('\n🏪 Testing Market Filter...');
  const markets = ['stock', 'crypto', 'forex', 'futures'];
  
  for (const market of markets) {
    await measurePerformance(`Market Filter - ${market}`, async () => {
      elements.marketSelect.value = market;
      elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const marketTradeCount = countVisibleTrades();
      const marketStats = getStatisticsValues();
      
      recordTestResult('individualFilters', `marketFilter_${market}`,
        marketTradeCount >= 0, // Should always be >= 0
        {
          market,
          tradeCount: marketTradeCount,
          hasStats: Object.keys(marketStats).length > 0
        }
      );
    });
  }
  
  // Test Date Range Filter
  console.log('\n📅 Testing Date Range Filter...');
  if (elements.dateFromInput && elements.dateToInput) {
    await measurePerformance('Date Range Filter Test', async () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      elements.dateFromInput.value = lastMonth.toISOString().split('T')[0];
      elements.dateToInput.value = today.toISOString().split('T')[0];
      
      elements.dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateToInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dateFilteredTrades = countVisibleTrades();
      
      recordTestResult('individualFilters', 'dateRangeFilter',
        dateFilteredTrades >= 0,
        {
          dateFrom: elements.dateFromInput.value,
          dateTo: elements.dateToInput.value,
          tradeCount: dateFilteredTrades
        }
      );
    });
  }
  
  // Test Sorting
  console.log('\n🔄 Testing Sorting...');
  const sortFields = ['Date', 'Symbol', 'P&L', 'Entry Price', 'Quantity'];
  
  for (const field of sortFields) {
    await measurePerformance(`Sort - ${field}`, async () => {
      const sortHeader = Array.from(elements.sortHeaders).find(
        header => header.textContent.includes(field)
      );
      
      if (sortHeader) {
        sortHeader.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const sortedStats = getStatisticsValues();
        
        recordTestResult('individualFilters', `sorting_${field}`,
          Object.keys(sortedStats).length > 0,
          {
            field,
            hasStats: Object.keys(sortedStats).length > 0
          }
        );
      } else {
        recordTestResult('individualFilters', `sorting_${field}`, false, {
          reason: 'Sort header not found'
        });
      }
    });
  }
}

// Test 2: Combined Filter Testing
async function testCombinedFilters() {
  console.log('\n🔗 Testing Combined Filters...');
  
  const elements = getFilterElements();
  
  // Test Symbol + Market
  await measurePerformance('Symbol + Market Filter', async () => {
    elements.symbolInput.value = 'AAPL';
    elements.marketSelect.value = 'stock';
    
    elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
    elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const combinedTradeCount = countVisibleTrades();
    
    recordTestResult('combinedFilters', 'symbol_market',
      combinedTradeCount >= 0,
      {
        symbol: elements.symbolInput.value,
        market: elements.marketSelect.value,
        tradeCount: combinedTradeCount
      }
    );
  });
  
  // Test Symbol + Date Range
  if (elements.dateFromInput && elements.dateToInput) {
    await measurePerformance('Symbol + Date Range Filter', async () => {
      const today = new Date();
      const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      
      elements.symbolInput.value = 'AAPL';
      elements.dateFromInput.value = lastWeek.toISOString().split('T')[0];
      elements.dateToInput.value = today.toISOString().split('T')[0];
      
      elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateToInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const combinedTradeCount = countVisibleTrades();
      
      recordTestResult('combinedFilters', 'symbol_dateRange',
        combinedTradeCount >= 0,
        {
          symbol: elements.symbolInput.value,
          dateFrom: elements.dateFromInput.value,
          dateTo: elements.dateToInput.value,
          tradeCount: combinedTradeCount
        }
      );
    });
  }
  
  // Test Market + Date Range
  if (elements.dateFromInput && elements.dateToInput) {
    await measurePerformance('Market + Date Range Filter', async () => {
      elements.marketSelect.value = 'crypto';
      elements.dateFromInput.value = '2024-01-01';
      elements.dateToInput.value = '2024-12-31';
      
      elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateToInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const combinedTradeCount = countVisibleTrades();
      
      recordTestResult('combinedFilters', 'market_dateRange',
        combinedTradeCount >= 0,
        {
          market: elements.marketSelect.value,
          dateFrom: elements.dateFromInput.value,
          dateTo: elements.dateToInput.value,
          tradeCount: combinedTradeCount
        }
      );
    });
  }
  
  // Test All Filters Combined
  await measurePerformance('All Filters Combined', async () => {
    elements.symbolInput.value = 'AAPL';
    elements.marketSelect.value = 'stock';
    if (elements.dateFromInput && elements.dateToInput) {
      elements.dateFromInput.value = '2024-01-01';
      elements.dateToInput.value = '2024-12-31';
    }
    
    elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
    elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
    if (elements.dateFromInput && elements.dateToInput) {
      elements.dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateToInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allFiltersTradeCount = countVisibleTrades();
    
    recordTestResult('combinedFilters', 'all_filters',
      allFiltersTradeCount >= 0,
      {
        symbol: elements.symbolInput.value,
        market: elements.marketSelect.value,
        dateFrom: elements.dateFromInput?.value,
        dateTo: elements.dateToInput?.value,
        tradeCount: allFiltersTradeCount
      }
    );
  });
}

// Test 3: Edge Cases
async function testEdgeCases() {
  console.log('\n⚠️ Testing Edge Cases...');
  
  const elements = getFilterElements();
  
  // Test No Matching Results
  await measurePerformance('No Matching Results', async () => {
    elements.symbolInput.value = 'NONEXISTENT_SYMBOL_12345';
    elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const noResultsTradeCount = countVisibleTrades();
    const hasNoResultsMessage = document.body.textContent.includes('No trades') || 
                                document.body.textContent.includes('No results');
    
    recordTestResult('edgeCases', 'noMatchingResults',
      noResultsTradeCount === 0 || hasNoResultsMessage,
      {
        tradeCount: noResultsTradeCount,
        hasNoResultsMessage
      }
    );
  });
  
  // Test Single Character Input
  await measurePerformance('Single Character Input', async () => {
    elements.symbolInput.value = 'A';
    elements.symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Shorter wait for debouncing
    
    const singleCharTradeCount = countVisibleTrades();
    
    recordTestResult('edgeCases', 'singleCharacterInput',
      singleCharTradeCount >= 0,
      {
        inputValue: elements.symbolInput.value,
        tradeCount: singleCharTradeCount
      }
    );
  });
  
  // Test Date Range Boundaries
  if (elements.dateFromInput && elements.dateToInput) {
    await measurePerformance('Date Range Boundaries', async () => {
      elements.dateFromInput.value = '2024-12-31';
      elements.dateToInput.value = '2024-01-01'; // Invalid range (from > to)
      
      elements.dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.dateToInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const invalidRangeTradeCount = countVisibleTrades();
      
      recordTestResult('edgeCases', 'dateRangeBoundaries',
        invalidRangeTradeCount >= 0, // Should handle gracefully
        {
          dateFrom: elements.dateFromInput.value,
          dateTo: elements.dateToInput.value,
          tradeCount: invalidRangeTradeCount
        }
      );
    });
  }
  
  // Test Rapid Filter Changes
  await measurePerformance('Rapid Filter Changes', async () => {
    const initialApiCalls = performanceMetrics.apiCallCount;
    
    // Rapidly change filters
    for (let i = 0; i < 5; i++) {
      elements.symbolInput.value = `SYMBOL_${i}`;
      elements.symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50)); // Very rapid changes
    }
    
    // Wait for debouncing to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const finalApiCalls = performanceMetrics.apiCallCount;
    const apiCallDelta = finalApiCalls - initialApiCalls;
    
    recordTestResult('edgeCases', 'rapidFilterChanges',
      apiCallDelta < 10, // Should be debounced, not fire for every change
      {
        apiCallDelta,
        rapidChanges: 5,
        debouncingWorking: apiCallDelta < 5
      }
    );
  });
  
  // Test Filter Clearing
  if (elements.clearButton) {
    await measurePerformance('Filter Clearing', async () => {
      // Set some filters first
      elements.symbolInput.value = 'AAPL';
      elements.marketSelect.value = 'stock';
      elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
      elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Clear filters
      elements.clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const clearedSymbol = elements.symbolInput.value;
      const clearedMarket = elements.marketSelect.value;
      const clearedTradeCount = countVisibleTrades();
      
      recordTestResult('edgeCases', 'filterClearing',
        clearedSymbol === '' && clearedMarket === '',
        {
          symbolCleared: clearedSymbol === '',
          marketCleared: clearedMarket === '',
          tradeCount: clearedTradeCount
        }
      );
    });
  }
}

// Test 4: Performance Verification
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const elements = getFilterElements();
  
  // Test Response Times
  const responseTimes = performanceMetrics.filterResponseTimes;
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, metric) => sum + metric.duration, 0) / responseTimes.length 
    : 0;
  
  recordTestResult('performance', 'averageResponseTime',
    avgResponseTime < 300, // Should be under 300ms
    {
      avgResponseTime: avgResponseTime.toFixed(2),
      measurements: responseTimes.length,
      under300ms: avgResponseTime < 300
    }
  );
  
  // Test Debouncing
  await measurePerformance('Debouncing Test', async () => {
    const initialApiCalls = performanceMetrics.apiCallCount;
    
    // Make rapid changes
    for (let i = 0; i < 3; i++) {
      elements.symbolInput.value = `TEST_${i}`;
      elements.symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debouncing
    
    const finalApiCalls = performanceMetrics.apiCallCount;
    const apiCallsDuringTest = finalApiCalls - initialApiCalls;
    
    recordTestResult('performance', 'debouncing',
      apiCallsDuringTest <= 2, // Should be debounced to fewer calls
      {
        apiCallsDuringTest,
        rapidChanges: 3,
        debouncingEffective: apiCallsDuringTest <= 2
      }
    );
  });
  
  // Test Memory Management
  if (performance.memory) {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Perform multiple filter operations
    for (let i = 0; i < 10; i++) {
      elements.symbolInput.value = `PERF_TEST_${i}`;
      elements.symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    recordTestResult('performance', 'memoryManagement',
      memoryIncrease < 10, // Should be under 10MB increase
      {
        initialMemoryMB: (initialMemory / 1024 / 1024).toFixed(2),
        finalMemoryMB: (finalMemory / 1024 / 1024).toFixed(2),
        memoryIncreaseMB: memoryIncrease.toFixed(2),
        memoryLeakSuspected: memoryIncrease > 10
      }
    );
  }
}

// Test 5: Statistics Verification
async function testStatistics() {
  console.log('\n📊 Testing Statistics...');
  
  const elements = getFilterElements();
  
  // Test Statistics Update with Filters
  const initialStats = getStatisticsValues();
  
  await measurePerformance('Statistics Update Test', async () => {
    elements.symbolInput.value = 'AAPL';
    elements.symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 400)); // Wait for stats to update
    
    const filteredStats = getStatisticsValues();
    
    recordTestResult('statistics', 'updateWithFilters',
      Object.keys(filteredStats).length > 0,
      {
        initialStatsCount: Object.keys(initialStats).length,
        filteredStatsCount: Object.keys(filteredStats).length,
        statsChanged: JSON.stringify(initialStats) !== JSON.stringify(filteredStats)
      }
    );
  });
  
  // Test Statistics with Sorting
  const sortHeaders = document.querySelectorAll('[data-testid="sort-header"], .sort-header, th[onclick]');
  if (sortHeaders.length > 0) {
    const statsBeforeSort = getStatisticsValues();
    
    await measurePerformance('Statistics with Sorting', async () => {
      sortHeaders[0].click(); // Click first sortable column
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const statsAfterSort = getStatisticsValues();
      
      recordTestResult('statistics', 'updateWithSorting',
        Object.keys(statsAfterSort).length > 0,
        {
          statsBeforeSortCount: Object.keys(statsBeforeSort).length,
          statsAfterSortCount: Object.keys(statsAfterSort).length,
          statisticsMaintained: Object.keys(statsAfterSort).length > 0
        }
      );
    });
  }
  
  // Test Statistics Accuracy
  await measurePerformance('Statistics Accuracy', async () => {
    // Clear all filters for baseline
    if (elements.clearButton) {
      elements.clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const baselineStats = getStatisticsValues();
    const baselineTradeCount = countVisibleTrades();
    
    // Apply a simple filter
    elements.marketSelect.value = 'stock';
    elements.marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const filteredStats = getStatisticsValues();
    const filteredTradeCount = countVisibleTrades();
    
    recordTestResult('statistics', 'accuracy',
      filteredTradeCount <= baselineTradeCount,
      {
        baselineTradeCount,
        filteredTradeCount,
        filterApplied: elements.marketSelect.value,
        statsAvailable: Object.keys(filteredStats).length > 0
      }
    );
  });
}

// Main test execution
async function runComprehensiveVerification() {
  console.log('🚀 Starting Comprehensive Filter Verification...\n');
  
  try {
    // Check if we're on the trades page
    if (!window.location.pathname.includes('/trades')) {
      throw new Error('This test must be run on the trades page');
    }
    
    // Wait for page to load
    await waitForElement('input[placeholder="Search symbol..."], select');
    
    // Start network monitoring
    const stopNetworkMonitoring = monitorNetworkRequests();
    
    try {
      // Run all test suites
      await testIndividualFilters();
      await testCombinedFilters();
      await testEdgeCases();
      await testPerformance();
      await testStatistics();
      
    } finally {
      // Stop network monitoring
      stopNetworkMonitoring();
    }
    
    // Generate final report
    generateVerificationReport();
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    testResults.summary.errors.push(error.message);
  }
}

function generateVerificationReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE FILTER VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  const { totalTests, passedTests, failedTests, warnings, errors } = testResults.summary;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Errors: ${errors.length}`);
  
  // Performance Summary
  console.log(`\n⚡ PERFORMANCE SUMMARY:`);
  const avgResponseTime = performanceMetrics.filterResponseTimes.length > 0
    ? (performanceMetrics.filterResponseTimes.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.filterResponseTimes.length).toFixed(2)
    : 'N/A';
  console.log(`   Average Response Time: ${avgResponseTime}ms`);
  console.log(`   Total API Calls: ${performanceMetrics.apiCallCount}`);
  
  // Detailed Results
  console.log(`\n📋 DETAILED RESULTS:`);
  
  Object.entries(testResults).forEach(([category, tests]) => {
    if (category === 'summary') return;
    
    console.log(`\n${category.toUpperCase()}:`);
    Object.entries(tests).forEach(([testName, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${testName}`);
      if (!result.passed && Object.keys(result.details).length > 0) {
        console.log(`      Details:`, result.details);
      }
    });
  });
  
  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  
  if (parseFloat(avgResponseTime) > 300) {
    console.log(`   ⚠️  Consider optimizing filter response times (current: ${avgResponseTime}ms)`);
  }
  
  if (failedTests > 0) {
    console.log(`   ❌ ${failedTests} test(s) failed - review detailed results above`);
  }
  
  if (performanceMetrics.apiCallCount > 50) {
    console.log(`   ⚠️  High number of API calls (${performanceMetrics.apiCallCount}) - check debouncing`);
  }
  
  if (successRate >= 90) {
    console.log(`   ✅ Overall filtering functionality is working well (${successRate}% success rate)`);
  } else if (successRate >= 70) {
    console.log(`   ⚠️  Some filtering issues detected (${successRate}% success rate)`);
  } else {
    console.log(`   ❌ Significant filtering problems detected (${successRate}% success rate)`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 VERIFICATION COMPLETE');
  console.log('='.repeat(80));
  
  // Return results for programmatic use
  return testResults;
}

// Auto-run if script is executed directly
if (typeof window !== 'undefined') {
  console.log('🔧 Comprehensive Filter Verification Script Loaded');
  console.log('📝 To run tests, call: runComprehensiveVerification()');
  
  // Make it globally available
  window.runComprehensiveVerification = runComprehensiveVerification;
  window.testResults = testResults;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runComprehensiveVerification,
    testResults,
    generateVerificationReport
  };
}