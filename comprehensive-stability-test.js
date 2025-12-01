const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test results storage
const stabilityResults = {
  timestamp: new Date().toISOString(),
  pageLoadPerformance: {},
  databaseQueryPerformance: {},
  realTimeFeaturesStability: {},
  browserResourceUsage: {},
  edgeCasesAndStress: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    issues: []
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
}

function measureTime() {
  const start = Date.now();
  return {
    end: () => Date.now() - start
  };
}

function saveResults() {
  const filename = `stability-test-results-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(stabilityResults, null, 2));
  log(`Results saved to ${filename}`);
  return filename;
}

// 1. Page Load Performance Testing
async function testPageLoadPerformance(page) {
  log('Starting page load performance tests...');
  
  const pages = [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Trades', url: '/trades' },
    { name: 'Confluence', url: '/confluence' },
    { name: 'Strategies', url: '/strategies' },
    { name: 'Calendar', url: '/calendar' }
  ];

  for (const pageTest of pages) {
    log(`Testing load performance for ${pageTest.name} page...`);
    
    const metrics = {
      loadTimes: [],
      domContentLoaded: [],
      firstContentfulPaint: [],
      largestContentfulPaint: [],
      memoryUsage: []
    };

    // Test each page multiple times for consistency
    for (let i = 0; i < 5; i++) {
      const timer = measureTime();
      
      // Navigate to page
      const response = await page.goto(`${BASE_URL}${pageTest.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const loadTime = timer.end();
      metrics.loadTimes.push(loadTime);
      
      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);
      
      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
        };
      });
      
      metrics.domContentLoaded.push(performanceMetrics.domContentLoaded);
      metrics.firstContentfulPaint.push(performanceMetrics.firstContentfulPaint);
      metrics.largestContentfulPaint.push(performanceMetrics.largestContentfulPaint);
      
      // Get memory usage
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
        metrics.memoryUsage.push(memoryUsage);
      }
      
      log(`  Test ${i + 1}: Load time ${loadTime}ms`);
    }
    
    // Calculate averages and statistics
    const avgLoadTime = metrics.loadTimes.reduce((a, b) => a + b, 0) / metrics.loadTimes.length;
    const maxLoadTime = Math.max(...metrics.loadTimes);
    const minLoadTime = Math.min(...metrics.loadTimes);
    
    stabilityResults.pageLoadPerformance[pageTest.name] = {
      averageLoadTime: avgLoadTime,
      maxLoadTime: maxLoadTime,
      minLoadTime: minLoadTime,
      loadTimes: metrics.loadTimes,
      performanceMetrics: {
        averageDomContentLoaded: metrics.domContentLoaded.reduce((a, b) => a + b, 0) / metrics.domContentLoaded.length,
        averageFirstContentfulPaint: metrics.firstContentfulPaint.reduce((a, b) => a + b, 0) / metrics.firstContentfulPaint.length,
        averageLargestContentfulPaint: metrics.largestContentfulPaint.reduce((a, b) => a + b, 0) / metrics.largestContentfulPaint.length
      },
      memoryUsage: metrics.memoryUsage.length > 0 ? {
        averageUsed: metrics.memoryUsage.reduce((a, b) => a + b.used, 0) / metrics.memoryUsage.length,
        averageTotal: metrics.memoryUsage.reduce((a, b) => a + b.total, 0) / metrics.memoryUsage.length
      } : null,
      status: avgLoadTime < 3000 ? 'PASS' : 'FAIL'
    };
    
    log(`  ${pageTest.name} page: Average load time ${avgLoadTime.toFixed(2)}ms - ${stabilityResults.pageLoadPerformance[pageTest.name].status}`);
  }
}

// 2. Database Query Performance Testing
async function testDatabaseQueryPerformance(page) {
  log('Starting database query performance tests...');
  
  // Test trades page query performance
  await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
  
  const queryMetrics = {
    tradesLoad: [],
    complexQueries: [],
    concurrentQueries: []
  };
  
  // Test basic trades loading
  for (let i = 0; i < 10; i++) {
    const timer = measureTime();
    
    // Refresh page to trigger database queries
    await page.reload({ waitUntil: 'networkidle' });
    
    const loadTime = timer.end();
    queryMetrics.tradesLoad.push(loadTime);
    
    log(`  Trades query test ${i + 1}: ${loadTime}ms`);
  }
  
  // Test complex queries with filtering
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  
  for (let i = 0; i < 5; i++) {
    const timer = measureTime();
    
    // Navigate to different pages that require complex queries
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const queryTime = timer.end();
    queryMetrics.complexQueries.push(queryTime);
    
    log(`  Complex query test ${i + 1}: ${queryTime}ms`);
  }
  
  // Test concurrent access simulation
  const concurrentPromises = [];
  for (let i = 0; i < 5; i++) {
    const timer = measureTime();
    
    const promise = (async () => {
      const context = await page.context().browser().newContext();
      const newPage = await context.newPage();
      
      await newPage.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
      await newPage.waitForTimeout(1000);
      
      const time = timer.end();
      queryMetrics.concurrentQueries.push(time);
      
      await context.close();
      return time;
    })();
    
    concurrentPromises.push(promise);
  }
  
  await Promise.all(concurrentPromises);
  
  // Calculate metrics
  const avgTradesLoad = queryMetrics.tradesLoad.reduce((a, b) => a + b, 0) / queryMetrics.tradesLoad.length;
  const avgComplexQueries = queryMetrics.complexQueries.reduce((a, b) => a + b, 0) / queryMetrics.complexQueries.length;
  const avgConcurrentQueries = queryMetrics.concurrentQueries.reduce((a, b) => a + b, 0) / queryMetrics.concurrentQueries.length;
  
  stabilityResults.databaseQueryPerformance = {
    tradesLoading: {
      averageTime: avgTradesLoad,
      maxTime: Math.max(...queryMetrics.tradesLoad),
      minTime: Math.min(...queryMetrics.tradesLoad),
      times: queryMetrics.tradesLoad
    },
    complexQueries: {
      averageTime: avgComplexQueries,
      maxTime: Math.max(...queryMetrics.complexQueries),
      minTime: Math.min(...queryMetrics.complexQueries),
      times: queryMetrics.complexQueries
    },
    concurrentQueries: {
      averageTime: avgConcurrentQueries,
      maxTime: Math.max(...queryMetrics.concurrentQueries),
      minTime: Math.min(...queryMetrics.concurrentQueries),
      times: queryMetrics.concurrentQueries
    },
    status: avgTradesLoad < 2000 && avgComplexQueries < 3000 ? 'PASS' : 'FAIL'
  };
  
  log(`Database query performance: Trades ${avgTradesLoad.toFixed(2)}ms, Complex ${avgComplexQueries.toFixed(2)}ms, Concurrent ${avgConcurrentQueries.toFixed(2)}ms - ${stabilityResults.databaseQueryPerformance.status}`);
}

// 3. Real-time Features Stability Testing
async function testRealTimeFeaturesStability(page) {
  log('Starting real-time features stability tests...');
  
  // Test dashboard real-time updates
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  
  const realTimeMetrics = {
    dashboardUpdates: [],
    emotionalAnalysisRefresh: [],
    strategyPerformanceUpdates: [],
    dataConsistency: []
  };
  
  // Monitor dashboard for real-time updates
  for (let i = 0; i < 10; i++) {
    const timer = measureTime();
    
    // Wait for potential real-time updates
    await page.waitForTimeout(3000);
    
    // Check if dashboard content is stable and responsive
    const dashboardContent = await page.textContent('body');
    const updateTime = timer.end();
    
    realTimeMetrics.dashboardUpdates.push({
      time: updateTime,
      hasContent: dashboardContent && dashboardContent.length > 100
    });
    
    log(`  Dashboard update test ${i + 1}: ${updateTime}ms`);
  }
  
  // Test emotional analysis refresh
  await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle' });
  
  for (let i = 0; i < 5; i++) {
    const timer = measureTime();
    
    // Refresh page to test emotional analysis loading
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait for emotional analysis to load
    await page.waitForTimeout(2000);
    
    const refreshTime = timer.end();
    realTimeMetrics.emotionalAnalysisRefresh.push(refreshTime);
    
    log(`  Emotional analysis refresh test ${i + 1}: ${refreshTime}ms`);
  }
  
  // Test strategy performance updates
  await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
  
  for (let i = 0; i < 5; i++) {
    const timer = measureTime();
    
    // Navigate between strategies and trades to test performance updates
    await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
    
    const updateTime = timer.end();
    realTimeMetrics.strategyPerformanceUpdates.push(updateTime);
    
    log(`  Strategy performance update test ${i + 1}: ${updateTime}ms`);
  }
  
  // Test data consistency across pages
  const tradeCounts = [];
  
  for (const pageUrl of ['/trades', '/dashboard', '/confluence']) {
    await page.goto(`${BASE_URL}${pageUrl}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Try to get trade count or indicators of data presence
    const pageContent = await page.textContent('body');
    const hasTradeData = pageContent && (pageContent.includes('trade') || pageContent.includes('Trade') || pageContent.includes('profit') || pageContent.includes('loss'));
    
    tradeCounts.push({
      page: pageUrl,
      hasData: hasTradeData
    });
  }
  
  realTimeMetrics.dataConsistency = tradeCounts;
  
  // Calculate metrics
  const avgDashboardUpdates = realTimeMetrics.dashboardUpdates.reduce((a, b) => a + b.time, 0) / realTimeMetrics.dashboardUpdates.length;
  const avgEmotionalRefresh = realTimeMetrics.emotionalAnalysisRefresh.reduce((a, b) => a + b, 0) / realTimeMetrics.emotionalAnalysisRefresh.length;
  const avgStrategyUpdates = realTimeMetrics.strategyPerformanceUpdates.reduce((a, b) => a + b, 0) / realTimeMetrics.strategyPerformanceUpdates.length;
  
  const dataConsistent = tradeCounts.every(tc => tc.hasData);
  
  stabilityResults.realTimeFeaturesStability = {
    dashboardUpdates: {
      averageTime: avgDashboardUpdates,
      updates: realTimeMetrics.dashboardUpdates
    },
    emotionalAnalysisRefresh: {
      averageTime: avgEmotionalRefresh,
      refreshTimes: realTimeMetrics.emotionalAnalysisRefresh
    },
    strategyPerformanceUpdates: {
      averageTime: avgStrategyUpdates,
      updateTimes: realTimeMetrics.strategyPerformanceUpdates
    },
    dataConsistency: {
      consistent: dataConsistent,
      pageData: tradeCounts
    },
    status: avgDashboardUpdates < 5000 && avgEmotionalRefresh < 3000 && dataConsistent ? 'PASS' : 'FAIL'
  };
  
  log(`Real-time features stability: Dashboard ${avgDashboardUpdates.toFixed(2)}ms, Emotional ${avgEmotionalRefresh.toFixed(2)}ms, Strategy ${avgStrategyUpdates.toFixed(2)}ms, Data Consistent: ${dataConsistent} - ${stabilityResults.realTimeFeaturesStability.status}`);
}

// 4. Browser Resource Usage Testing
async function testBrowserResourceUsage(page) {
  log('Starting browser resource usage tests...');
  
  const resourceMetrics = {
    memoryConsumption: [],
    cpuUsage: [],
    networkRequests: [],
    garbageCollection: []
  };
  
  // Test memory consumption during navigation
  const pages = ['/dashboard', '/trades', '/confluence', '/strategies', '/calendar'];
  
  for (let i = 0; i < 3; i++) {
    for (const pageUrl of pages) {
      const timer = measureTime();
      
      await page.goto(`${BASE_URL}${pageUrl}`, { waitUntil: 'networkidle' });
      
      // Get memory usage
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
      
      const navigationTime = timer.end();
      
      if (memoryUsage) {
        resourceMetrics.memoryConsumption.push({
          page: pageUrl,
          used: memoryUsage.used,
          total: memoryUsage.total,
          limit: memoryUsage.limit,
          navigationTime: navigationTime
        });
      }
      
      log(`  Memory test for ${pageUrl}: ${memoryUsage ? (memoryUsage.used / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`);
    }
  }
  
  // Test network request efficiency
  await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
  
  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  resourceMetrics.networkRequests = requests;
  
  // Test garbage collection and cleanup
  const initialMemory = await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  });
  
  // Navigate through multiple pages to test cleanup
  for (let i = 0; i < 5; i++) {
    await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }
  
  // Force garbage collection if available
  await page.evaluate(() => {
    if (window.gc) {
      window.gc();
    }
  });
  
  const finalMemory = await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  });
  
  resourceMetrics.garbageCollection = {
    initialMemory: initialMemory,
    finalMemory: finalMemory,
    memoryGrowth: finalMemory - initialMemory
  };
  
  // Calculate metrics
  const avgMemoryUsage = resourceMetrics.memoryConsumption.reduce((a, b) => a + b.used, 0) / resourceMetrics.memoryConsumption.length;
  const maxMemoryUsage = Math.max(...resourceMetrics.memoryConsumption.map(m => m.used));
  const memoryGrowthRate = resourceMetrics.garbageCollection.memoryGrowth / initialMemory;
  
  stabilityResults.browserResourceUsage = {
    memoryConsumption: {
      averageUsage: avgMemoryUsage,
      maxUsage: maxMemoryUsage,
      measurements: resourceMetrics.memoryConsumption
    },
    networkRequests: {
      totalRequests: requests.length,
      requests: requests
    },
    garbageCollection: resourceMetrics.garbageCollection,
    status: memoryGrowthRate < 0.5 && avgMemoryUsage < 100 * 1024 * 1024 ? 'PASS' : 'FAIL' // Less than 50% growth and 100MB average
  };
  
  log(`Browser resource usage: Avg memory ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB, Memory growth ${(memoryGrowthRate * 100).toFixed(2)}%, Requests ${requests.length} - ${stabilityResults.browserResourceUsage.status}`);
}

// 5. Edge Cases and Stress Testing
async function testEdgeCasesAndStress(page) {
  log('Starting edge cases and stress testing...');
  
  const stressMetrics = {
    rapidNavigation: [],
    multipleTabs: [],
    dataRefreshDuringOperations: [],
    errorHandling: [],
    slowNetworkConditions: []
  };
  
  // Test rapid page navigation
  const pages = ['/dashboard', '/trades', '/confluence', '/strategies', '/calendar'];
  
  for (let i = 0; i < 10; i++) {
    const timer = measureTime();
    
    for (const pageUrl of pages) {
      await page.goto(`${BASE_URL}${pageUrl}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(200); // Very short wait to stress the system
    }
    
    const navigationTime = timer.end();
    stressMetrics.rapidNavigation.push(navigationTime);
    
    log(`  Rapid navigation test ${i + 1}: ${navigationTime}ms`);
  }
  
  // Test multiple tabs simulation
  const tabPromises = [];
  for (let i = 0; i < 3; i++) {
    const timer = measureTime();
    
    const promise = (async () => {
      const context = await page.context().browser().newContext();
      const newPage = await context.newPage();
      
      await newPage.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
      await newPage.waitForTimeout(2000);
      
      const time = timer.end();
      
      await context.close();
      return time;
    })();
    
    tabPromises.push(promise);
  }
  
  const tabResults = await Promise.all(tabPromises);
  stressMetrics.multipleTabs = tabResults;
  
  // Test data refresh during active operations
  await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
  
  for (let i = 0; i < 5; i++) {
    const timer = measureTime();
    
    // Start navigation
    const navigationPromise = page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    
    // Wait a short time then refresh
    await page.waitForTimeout(100);
    const refreshPromise = page.reload({ waitUntil: 'networkidle' });
    
    // Wait for both to complete (one will fail, but system should handle it gracefully)
    try {
      await Promise.race([navigationPromise, refreshPromise]);
    } catch (error) {
      // Expected to fail, but system should not crash
    }
    
    const stressTime = timer.end();
    stressMetrics.dataRefreshDuringOperations.push(stressTime);
    
    log(`  Data refresh stress test ${i + 1}: ${stressTime}ms`);
  }
  
  // Test error handling and recovery
  await page.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle' });
  
  for (let i = 0; i < 3; i++) {
    const timer = measureTime();
    
    try {
      // Navigate to non-existent page
      await page.goto(`${BASE_URL}/non-existent-page`, { waitUntil: 'networkidle', timeout: 5000 });
    } catch (error) {
      // Expected to fail
    }
    
    // Try to navigate back to valid page
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    
    const recoveryTime = timer.end();
    stressMetrics.errorHandling.push(recoveryTime);
    
    log(`  Error handling test ${i + 1}: ${recoveryTime}ms`);
  }
  
  // Test slow network conditions (simulate by using longer timeouts)
  const context = await page.context().browser().newContext();
  const slowPage = await context.newPage();
  
  try {
    const timer = measureTime();
    
    // Navigate with very long timeout to simulate slow network
    await slowPage.goto(`${BASE_URL}/trades`, { waitUntil: 'networkidle', timeout: 60000 });
    
    const slowLoadTime = timer.end();
    stressMetrics.slowNetworkConditions.push(slowLoadTime);
    
    log(`  Slow network test: ${slowLoadTime}ms`);
  } catch (error) {
    stressMetrics.slowNetworkConditions.push(60000); // Timeout
    log(`  Slow network test: Timeout after 60s`);
  }
  
  await context.close();
  
  // Calculate metrics
  const avgRapidNavigation = stressMetrics.rapidNavigation.reduce((a, b) => a + b, 0) / stressMetrics.rapidNavigation.length;
  const avgMultipleTabs = stressMetrics.multipleTabs.reduce((a, b) => a + b, 0) / stressMetrics.multipleTabs.length;
  const avgDataRefresh = stressMetrics.dataRefreshDuringOperations.reduce((a, b) => a + b, 0) / stressMetrics.dataRefreshDuringOperations.length;
  const avgErrorHandling = stressMetrics.errorHandling.reduce((a, b) => a + b, 0) / stressMetrics.errorHandling.length;
  const avgSlowNetwork = stressMetrics.slowNetworkConditions.reduce((a, b) => a + b, 0) / stressMetrics.slowNetworkConditions.length;
  
  stabilityResults.edgeCasesAndStress = {
    rapidNavigation: {
      averageTime: avgRapidNavigation,
      times: stressMetrics.rapidNavigation
    },
    multipleTabs: {
      averageTime: avgMultipleTabs,
      times: stressMetrics.multipleTabs
    },
    dataRefreshDuringOperations: {
      averageTime: avgDataRefresh,
      times: stressMetrics.dataRefreshDuringOperations
    },
    errorHandling: {
      averageTime: avgErrorHandling,
      times: stressMetrics.errorHandling
    },
    slowNetworkConditions: {
      averageTime: avgSlowNetwork,
      times: stressMetrics.slowNetworkConditions
    },
    status: avgRapidNavigation < 15000 && avgErrorHandling < 10000 ? 'PASS' : 'FAIL'
  };
  
  log(`Edge cases and stress: Rapid ${avgRapidNavigation.toFixed(2)}ms, Tabs ${avgMultipleTabs.toFixed(2)}ms, Refresh ${avgDataRefresh.toFixed(2)}ms, Error ${avgErrorHandling.toFixed(2)}ms, Slow ${avgSlowNetwork.toFixed(2)}ms - ${stabilityResults.edgeCasesAndStress.status}`);
}

// Main test execution function
async function runStabilityTests() {
  log('Starting comprehensive stability testing with 200 trades dataset...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Login first
    log('Logging in to application...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Fill the form using correct selectors
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    log('Login successful');
    
    // Run all stability tests
    await testPageLoadPerformance(page);
    await testDatabaseQueryPerformance(page);
    await testRealTimeFeaturesStability(page);
    await testBrowserResourceUsage(page);
    await testEdgeCasesAndStress(page);
    
    // Calculate summary
    const allTests = [
      stabilityResults.pageLoadPerformance,
      stabilityResults.databaseQueryPerformance,
      stabilityResults.realTimeFeaturesStability,
      stabilityResults.browserResourceUsage,
      stabilityResults.edgeCasesAndStress
    ];
    
    stabilityResults.summary.totalTests = allTests.length;
    stabilityResults.summary.passedTests = allTests.filter(test => test.status === 'PASS').length;
    stabilityResults.summary.failedTests = allTests.filter(test => test.status === 'FAIL').length;
    
    // Collect issues
    allTests.forEach((test, index) => {
      if (test.status === 'FAIL') {
        stabilityResults.summary.issues.push({
          category: ['Page Load Performance', 'Database Query Performance', 'Real-time Features', 'Browser Resource Usage', 'Edge Cases & Stress'][index],
          details: test
        });
      }
    });
    
    log('Stability testing completed');
    
  } catch (error) {
    log(`Error during stability testing: ${error.message}`, 'error');
    stabilityResults.summary.issues.push({
      category: 'Test Execution Error',
      details: error.message
    });
  } finally {
    await browser.close();
  }
  
  // Save results
  const resultsFile = saveResults();
  
  return {
    resultsFile,
    summary: stabilityResults.summary
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runStabilityTests()
    .then(({ resultsFile, summary }) => {
      log(`Stability testing completed. Results saved to: ${resultsFile}`);
      log(`Summary: ${summary.passedTests}/${summary.totalTests} tests passed`);
      
      if (summary.issues.length > 0) {
        log('Issues found:');
        summary.issues.forEach(issue => {
          log(`  - ${issue.category}: ${JSON.stringify(issue.details, null, 2)}`);
        });
      }
      
      process.exit(summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runStabilityTests,
  testPageLoadPerformance,
  testDatabaseQueryPerformance,
  testRealTimeFeaturesStability,
  testBrowserResourceUsage,
  testEdgeCasesAndStress
};