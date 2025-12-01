const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './confluence-performance-screenshots',
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
async function takeScreenshot(page, filename, category = 'PERFORMANCE_TEST') {
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
  largeDataHandling: { passed: 0, failed: 0, details: [] },
  rapidInteractions: { passed: 0, failed: 0, details: [] },
  memoryUsage: { passed: 0, failed: 0, details: [] },
  apiPerformance: { passed: 0, failed: 0, details: [] },
  stability: { passed: 0, failed: 0, details: [] }
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
async function runComprehensivePerformanceTests() {
  log('MAIN', 'Starting comprehensive confluence performance and stability tests...', 'info');
  
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

    // Step 1: Login and navigate to confluence
    log('AUTH_SETUP', 'Setting up authentication and navigation...', 'info');
    await performLogin(page);
    
    // Step 2: Large Data Handling Tests
    log('LARGE_DATA_TESTS', 'Starting large data handling tests...', 'info');
    await testLargeDataHandling(page);
    
    // Step 3: Rapid Interaction Tests
    log('RAPID_TESTS', 'Starting rapid interaction tests...', 'info');
    await testRapidInteractions(page);
    
    // Step 4: Memory Usage Tests
    log('MEMORY_TESTS', 'Starting memory usage tests...', 'info');
    await testMemoryUsage(page);
    
    // Step 5: API Performance Tests
    log('API_PERFORMANCE_TESTS', 'Starting API performance tests...', 'info');
    await testAPIPerformance(page);
    
    // Step 6: Stability Tests
    log('STABILITY_TESTS', 'Starting stability tests...', 'info');
    await testStability(page);
    
    await browser.close();
    
  } catch (error) {
    log('MAIN', `Test suite failed: ${error.message}`, 'error');
    await browser.close();
  }
}

// Helper function to perform login
async function performLogin(page) {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    // Fill login form
    await page.type('input[type="email"]', TEST_CONFIG.testUser.email);
    await page.type('input[type="password"]', TEST_CONFIG.testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await sleep(3000);
    
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login');
    log('AUTH_SETUP', isLoggedIn ? 'Login successful' : 'Login failed', isLoggedIn ? 'success' : 'error');
    
    return isLoggedIn;
  } catch (error) {
    log('AUTH_SETUP', `Login failed: ${error.message}`, 'error');
    return false;
  }
}

// Test 2: Large Data Handling
async function testLargeDataHandling(page) {
  try {
    // Test 2.1: Large dataset performance
    log('LARGE_DATA_TESTS', 'Testing large dataset performance...', 'debug');
    
    // Simulate large dataset response
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats')) {
          // Simulate large dataset response
          return Promise.resolve(new Response(JSON.stringify({
            totalTrades: 5000,
            totalPnL: 25000,
            winRate: 65,
            avgTradeSize: 150,
            lastSyncTime: Date.now(),
            emotionalData: Array(100).fill(null).map((_, i) => ({
              subject: `EMOTION_${i}`,
              value: Math.random() * 100,
              fullMark: 100,
              leaning: 'Balanced',
              side: 'Buy',
              leaningValue: Math.random() * 100 - 50,
              totalTrades: Math.floor(Math.random() * 1000)
            }))
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        if (url.includes('/api/confluence-trades')) {
          // Simulate large trades response
          const largeTrades = Array(1000).fill(null).map((_, i) => ({
            id: `trade_${i}`,
            symbol: `SYMBOL${i}`,
            side: i % 2 === 0 ? 'Buy' : 'Sell',
            quantity: Math.floor(Math.random() * 1000) + 100,
            entry_price: Math.random() * 1000 + 50,
            exit_price: Math.random() * 1000 + 50,
            pnl: (Math.random() - 0.5) * 2000,
            trade_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            emotional_state: ['FOMO', 'REVENGE', 'TILT'].slice(0, Math.floor(Math.random() * 3) + 1)
          }));
          
          return Promise.resolve(new Response(JSON.stringify({
            trades: largeTrades,
            totalCount: 5000,
            currentPage: 1,
            totalPages: 50,
            hasNextPage: true,
            hasPreviousPage: false
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    // Wait for page to fully load
    await sleep(5000);
    
    const performsWell = loadTime < 10000; // Should load within 10 seconds for large dataset
    logTestResult('largeDataHandling', 'Large dataset loading performance', performsWell,
      performsWell ? `Large dataset loaded in ${loadTime}ms` : `Large dataset loading too slow: ${loadTime}ms`);
    
    await takeScreenshot(page, 'large-dataset-loaded', 'LARGE_DATA_TESTS');
    
    // Test 2.2: Large dataset filtering performance
    log('LARGE_DATA_TESTS', 'Testing large dataset filtering performance...', 'debug');
    
    const filterStartTime = Date.now();
    const emotionButton = await page.$('button:has-text("FOMO")');
    if (emotionButton) {
      await emotionButton.click();
      await page.waitForFunction(() => 
        page.$$('tbody tr').length > 0, 
        { timeout: 5000 }
      );
      const filterTime = Date.now() - filterStartTime;
      
      const filterPerformsWell = filterTime < 3000; // Should filter within 3 seconds
      logTestResult('largeDataHandling', 'Large dataset filtering performance', filterPerformsWell,
        filterPerformsWell ? `Large dataset filtered in ${filterTime}ms` : `Large dataset filtering too slow: ${filterTime}ms`);
    }
    
    await takeScreenshot(page, 'large-dataset-filtered', 'LARGE_DATA_TESTS');
    
  } catch (error) {
    logTestResult('largeDataHandling', 'Large data handling tests', false, error.message);
  }
}

// Test 3: Rapid Interaction Tests
async function testRapidInteractions(page) {
  try {
    // Test 3.1: Rapid filter changes
    log('RAPID_TESTS', 'Testing rapid filter changes...', 'debug');
    
    const emotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE'];
    let errors = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < emotions.length; i++) {
      try {
        const button = await page.$(`button:has-text("${emotions[i]}")`);
        if (button) {
          await button.click();
          await sleep(200); // Rapid changes with minimal delay
        }
      } catch (error) {
        errors++;
      }
    }
    
    const totalTime = Date.now() - startTime;
    const handlesRapidChanges = errors === 0;
    logTestResult('rapidInteractions', 'Rapid filter changes', handlesRapidChanges,
      handlesRapidChanges ? `Rapid changes completed in ${totalTime}ms` : `${errors} errors during rapid changes`);
    
    await takeScreenshot(page, 'rapid-filter-changes', 'RAPID_TESTS');
    
    // Test 3.2: Rapid page navigation
    log('RAPID_TESTS', 'Testing rapid page navigation...', 'debug');
    
    const navStartTime = Date.now();
    let navErrors = 0;
    
    // Perform rapid navigation cycles
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
        await sleep(500);
      } catch (error) {
        navErrors++;
      }
    }
    
    const totalNavTime = Date.now() - navStartTime;
    const handlesRapidNav = navErrors === 0;
    logTestResult('rapidInteractions', 'Rapid page navigation', handlesRapidNav,
      handlesRapidNav ? `Rapid navigation completed in ${totalNavTime}ms` : `${navErrors} navigation errors`);
    
    await takeScreenshot(page, 'rapid-navigation', 'RAPID_TESTS');
    
  } catch (error) {
    logTestResult('rapidInteractions', 'Rapid interaction tests', false, error.message);
  }
}

// Test 4: Memory Usage Tests
async function testMemoryUsage(page) {
  try {
    // Test 4.1: Memory usage during normal operation
    log('MEMORY_TESTS', 'Testing memory usage during normal operation...', 'debug');
    
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    // Perform some operations to test memory stability
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("FOMO")');
      await sleep(500);
      await page.click('button:has-text("Clear All")');
      await sleep(500);
    }
    
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      const memoryAcceptable = memoryIncreaseMB < 20; // Less than 20MB increase
      logTestResult('memoryUsage', 'Memory usage during operations', memoryAcceptable,
        memoryAcceptable ? `Memory increase: ${memoryIncreaseMB.toFixed(2)}MB` : `Excessive memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    }
    
    await takeScreenshot(page, 'memory-usage-test', 'MEMORY_TESTS');
    
  } catch (error) {
    logTestResult('memoryUsage', 'Memory usage tests', false, error.message);
  }
}

// Test 5: API Performance Tests
async function testAPIPerformance(page) {
  try {
    // Test 5.1: API response times
    log('API_PERFORMANCE_TESTS', 'Testing API response times...', 'debug');
    
    const apiTimes = [];
    
    // Test multiple API calls and measure response times
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      // Trigger API call by refreshing
      await page.click('button:has-text("Refresh")');
      
      // Wait for API call to complete
      await page.waitForFunction(() => 
        page.$$('.animate-spin').length === 0, 
        { timeout: 5000 }
      );
      
      const responseTime = Date.now() - startTime;
      apiTimes.push(responseTime);
      
      await sleep(1000);
    }
    
    const avgResponseTime = apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length;
    const maxResponseTime = Math.max(...apiTimes);
    const minResponseTime = Math.min(...apiTimes);
    
    const apiPerformsWell = avgResponseTime < 2000 && maxResponseTime < 5000; // Average < 2s, max < 5s
    logTestResult('apiPerformance', 'API response times', apiPerformsWell,
      apiPerformsWell ? `API performance - Avg: ${avgResponseTime.toFixed(0)}ms, Max: ${maxResponseTime}ms, Min: ${minResponseTime}ms` : `API performance issues - Avg: ${avgResponseTime.toFixed(0)}ms, Max: ${maxResponseTime}ms`);
    
    await takeScreenshot(page, 'api-performance-test', 'API_PERFORMANCE_TESTS');
    
  } catch (error) {
    logTestResult('apiPerformance', 'API performance tests', false, error.message);
  }
}

// Test 6: Stability Tests
async function testStability(page) {
  try {
    // Test 6.1: Long-running stability
    log('STABILITY_TESTS', 'Testing long-running stability...', 'debug');
    
    const startTime = Date.now();
    let errors = 0;
    
    // Keep page active for extended period
    for (let i = 0; i < 10; i++) {
      try {
        await page.click('button:has-text("Refresh")');
        await page.waitForFunction(() => 
          page.$$('.animate-spin').length === 0, 
          { timeout: 5000 }
        );
        await sleep(2000);
      } catch (error) {
        errors++;
      }
    }
    
    const totalTime = Date.now() - startTime;
    const isStable = errors === 0;
    logTestResult('stability', 'Long-running stability', isStable,
      isStable ? `Stable for ${totalTime}ms with ${10} refresh cycles` : `${errors} errors during ${totalTime}ms`);
    
    await takeScreenshot(page, 'long-running-stability', 'STABILITY_TESTS');
    
    // Test 6.2: Error recovery stability
    log('STABILITY_TESTS', 'Testing error recovery stability...', 'debug');
    
    // Simulate error conditions and test recovery
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats') && Math.random() > 0.7) {
          // 30% chance of simulated error
          return Promise.resolve(new Response(JSON.stringify({
            error: 'Simulated stability test error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    let recoveryErrors = 0;
    let recoveries = 0;
    
    for (let i = 0; i < 5; i++) {
      try {
        await page.click('button:has-text("Refresh")');
        await sleep(2000);
        
        // Check if error is handled gracefully
        const errorElement = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
        if (errorElement) {
          recoveries++;
        } else {
          recoveryErrors++;
        }
      } catch (error) {
        recoveryErrors++;
      }
    }
    
    const handlesErrorsWell = recoveryErrors === 0;
    logTestResult('stability', 'Error recovery stability', handlesErrorsWell,
      handlesErrorsWell ? `Error recovery successful (${recoveries}/${5} attempts)` : `${recoveryErrors} recovery failures`);
    
    await takeScreenshot(page, 'error-recovery-stability', 'STABILITY_TESTS');
    
  } catch (error) {
    logTestResult('stability', 'Stability tests', false, error.message);
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
  if (testResults.largeDataHandling.failed > 0) {
    report.keyFindings.push('Large dataset handling performance issues detected');
  }
  
  if (testResults.rapidInteractions.failed > 0) {
    report.keyFindings.push('Rapid interaction handling needs improvement');
  }
  
  if (testResults.memoryUsage.failed > 0) {
    report.keyFindings.push('Memory management issues during operations');
  }
  
  if (testResults.apiPerformance.failed > 0) {
    report.keyFindings.push('API response time performance needs optimization');
  }
  
  if (testResults.stability.failed > 0) {
    report.keyFindings.push('Stability and error recovery issues detected');
  }
  
  // Generate recommendations
  if (testResults.largeDataHandling.failed > 0) {
    report.recommendations.push('Implement virtual scrolling for large datasets');
    report.recommendations.push('Add pagination with progressive loading');
    report.recommendations.push('Optimize data processing algorithms');
  }
  
  if (testResults.rapidInteractions.failed > 0) {
    report.recommendations.push('Implement debouncing for rapid interactions');
    report.recommendations.push('Add loading states during rapid operations');
    report.recommendations.push('Optimize UI update mechanisms');
  }
  
  if (testResults.memoryUsage.failed > 0) {
    report.recommendations.push('Implement memory cleanup and garbage collection');
    report.recommendations.push('Optimize component rendering to prevent memory leaks');
    report.recommendations.push('Add memory usage monitoring and alerts');
  }
  
  if (testResults.apiPerformance.failed > 0) {
    report.recommendations.push('Implement API response caching');
    report.recommendations.push('Add loading indicators for slow API calls');
    report.recommendations.push('Optimize database queries and indexing');
  }
  
  if (testResults.stability.failed > 0) {
    report.recommendations.push('Implement comprehensive error handling and recovery mechanisms');
    report.recommendations.push('Add automatic retry logic for failed operations');
    report.recommendations.push('Implement health checks and monitoring');
  }
  
  // Save report
  const reportPath = path.join(TEST_CONFIG.screenshotDir, `confluence-performance-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('REPORT', `Test report saved to: ${reportPath}`, 'success');
  
  return report;
}

// Main execution
async function main() {
  log('MAIN', 'Starting comprehensive confluence performance and stability test suite...', 'info');
  
  await runComprehensivePerformanceTests();
  
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
  
  log('MAIN', 'Comprehensive confluence performance and stability testing completed', 'success');
}

// Run test suite
main().catch(error => {
  log('MAIN', `Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});