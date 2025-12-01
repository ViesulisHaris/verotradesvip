const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './confluence-edge-case-screenshots',
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
async function takeScreenshot(page, filename, category = 'EDGE_CASE_TEST') {
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
  edgeCases: { passed: 0, failed: 0, details: [] },
  errorHandling: { passed: 0, failed: 0, details: [] },
  performance: { passed: 0, failed: 0, details: [] },
  userExperience: { passed: 0, failed: 0, details: [] }
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
async function runComprehensiveEdgeCaseTests() {
  log('MAIN', 'Starting comprehensive confluence edge case and error handling tests...', 'info');
  
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
        
        const headers = request.headers();
        const authHeader = headers['authorization'] || headers['Authorization'];
        if (authHeader) {
          log('API_REQUEST', `✅ Auth header found: ${authHeader.substring(0, 30)}...`, 'debug');
        } else {
          log('API_REQUEST', `❌ NO auth header found in request`, 'error');
        }
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/confluence-')) {
        log('API_RESPONSE', `Response: ${response.status()} ${url}`, response.ok() ? 'success' : 'error');
        
        // Log response body for debugging
        response.text().then(body => {
          try {
            const data = JSON.parse(body);
            if (data.error) {
              log('API_RESPONSE', `Error response: ${data.error}`, 'error');
            }
          } catch (e) {
            log('API_RESPONSE', `Response body: ${body.substring(0, 200)}...`, 'debug');
          }
        }).catch(err => {
          log('API_RESPONSE', `Failed to read response body: ${err.message}`, 'error');
        });
      }
    });

    // Step 1: Authentication Tests
    log('AUTH_TESTS', 'Starting authentication edge case tests...', 'info');
    await testAuthenticationEdgeCases(page);
    
    // Step 2: Invalid Token Tests
    log('TOKEN_TESTS', 'Starting invalid authentication token tests...', 'info');
    await testInvalidAuthenticationTokens(page);
    
    // Step 3: Empty Data Tests
    log('EMPTY_DATA_TESTS', 'Starting empty data scenario tests...', 'info');
    await testEmptyDataScenarios(page);
    
    // Step 4: Invalid Filter Tests
    log('FILTER_TESTS', 'Starting invalid filter parameter tests...', 'info');
    await testInvalidFilterParameters(page);
    
    // Step 5: Pagination Edge Cases
    log('PAGINATION_TESTS', 'Starting pagination edge case tests...', 'info');
    await testPaginationEdgeCases(page);
    
    // Step 6: Error Recovery Tests
    log('ERROR_RECOVERY_TESTS', 'Starting error recovery scenario tests...', 'info');
    await testErrorRecoveryScenarios(page);
    
    // Step 7: Large Data Performance Tests
    log('PERFORMANCE_TESTS', 'Starting large data performance tests...', 'info');
    await testLargeDataPerformance(page);
    
    // Step 8: Rapid Filter Changes Tests
    log('RAPID_TESTS', 'Starting rapid filter change tests...', 'info');
    await testRapidFilterChanges(page);
    
    // Step 9: Memory Usage Tests
    log('MEMORY_TESTS', 'Starting memory usage tests...', 'info');
    await testMemoryUsage(page);
    
    // Step 10: Responsive Behavior Tests
    log('RESPONSIVE_TESTS', 'Starting responsive behavior tests...', 'info');
    await testResponsiveBehavior(page);
    
    await browser.close();
    
  } catch (error) {
    log('MAIN', `Test suite failed: ${error.message}`, 'error');
    await browser.close();
  }
}

// Test 1: Authentication Edge Cases
async function testAuthenticationEdgeCases(page) {
  try {
    // Test 1.1: Access without authentication
    log('AUTH_TESTS', 'Testing access without authentication...', 'debug');
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login');
    logTestResult('authentication', 'Access without auth redirects to login', isRedirectedToLogin,
      isRedirectedToLogin ? 'Correctly redirected to login' : 'Should have redirected to login');
    
    await takeScreenshot(page, 'auth-no-token', 'AUTH_TESTS');
    
    // Test 1.2: Access with expired token (simulate)
    log('AUTH_TESTS', 'Testing access with expired token...', 'debug');
    
    // First login to get a valid token
    await performLogin(page);
    await sleep(2000);
    
    // Navigate to confluence to get valid response
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Intercept and modify the next API call to simulate expired token
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-') && options?.headers?.Authorization) {
          // Modify the token to simulate expired token
          options.headers.Authorization = 'Bearer expired_token_12345';
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check if error is handled gracefully
    const errorElement = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
    const hasErrorHandling = !!errorElement;
    logTestResult('authentication', 'Expired token handled gracefully', hasErrorHandling,
      hasErrorHandling ? 'Error displayed for expired token' : 'No error handling for expired token');
    
    await takeScreenshot(page, 'auth-expired-token', 'AUTH_TESTS');
    
  } catch (error) {
    logTestResult('authentication', 'Authentication edge cases', false, error.message);
  }
}

// Test 2: Invalid Authentication Tokens
async function testInvalidAuthenticationTokens(page) {
  try {
    // Test 2.1: Malformed token
    log('TOKEN_TESTS', 'Testing malformed token...', 'debug');
    
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-')) {
          options.headers = options.headers || {};
          options.headers.Authorization = 'Bearer malformed.token.with.invalid.format';
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const errorElement = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
    const hasErrorHandling = !!errorElement;
    logTestResult('errorHandling', 'Malformed token error handling', hasErrorHandling,
      hasErrorHandling ? 'Malformed token error handled' : 'No error handling for malformed token');
    
    await takeScreenshot(page, 'token-malformed', 'TOKEN_TESTS');
    
    // Test 2.2: Empty token
    log('TOKEN_TESTS', 'Testing empty token...', 'debug');
    
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-')) {
          options.headers = options.headers || {};
          options.headers.Authorization = '';
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const emptyTokenError = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
    const hasEmptyTokenError = !!emptyTokenError;
    logTestResult('errorHandling', 'Empty token error handling', hasEmptyTokenError,
      hasEmptyTokenError ? 'Empty token error handled' : 'No error handling for empty token');
    
    await takeScreenshot(page, 'token-empty', 'TOKEN_TESTS');
    
  } catch (error) {
    logTestResult('errorHandling', 'Invalid token tests', false, error.message);
  }
}

// Test 3: Empty Data Scenarios
async function testEmptyDataScenarios(page) {
  try {
    // Ensure we're logged in
    await ensureLoggedIn(page);
    
    // Test 3.1: No trades in database
    log('EMPTY_DATA_TESTS', 'Testing empty trades scenario...', 'debug');
    
    // Clear all trades via API (if possible) or navigate to empty state
    await page.evaluate(() => {
      // Simulate empty data response
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats')) {
          return Promise.resolve(new Response(JSON.stringify({
            totalTrades: 0,
            totalPnL: 0,
            winRate: 0,
            avgTradeSize: 0,
            lastSyncTime: Date.now(),
            emotionalData: []
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        if (url.includes('/api/confluence-trades')) {
          return Promise.resolve(new Response(JSON.stringify({
            trades: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Check for empty state handling
    const emptyStateMessage = await page.$eval('h3', el => el.textContent).catch(() => null);
    const hasEmptyStateUI = emptyStateMessage && emptyStateMessage.includes('No trade data available');
    logTestResult('edgeCases', 'Empty trades UI handling', hasEmptyStateUI,
      hasEmptyStateUI ? 'Empty state UI displayed correctly' : 'Empty state UI not found');
    
    await takeScreenshot(page, 'empty-trades', 'EMPTY_DATA_TESTS');
    
    // Test 3.2: No emotional data
    log('EMPTY_DATA_TESTS', 'Testing no emotional data scenario...', 'debug');
    
    await page.evaluate(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats')) {
          return Promise.resolve(new Response(JSON.stringify({
            totalTrades: 10,
            totalPnL: 1500,
            winRate: 60,
            avgTradeSize: 100,
            lastSyncTime: Date.now(),
            emotionalData: [] // No emotional data
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const noEmotionDataMessage = await page.$eval('p', el => el.textContent).catch(() => null);
    const hasNoEmotionDataUI = noEmotionDataMessage && noEmotionDataMessage.includes('No emotional data available');
    logTestResult('edgeCases', 'No emotional data UI handling', hasNoEmotionDataUI,
      hasNoEmotionDataUI ? 'No emotion data UI displayed correctly' : 'No emotion data UI not found');
    
    await takeScreenshot(page, 'no-emotional-data', 'EMPTY_DATA_TESTS');
    
  } catch (error) {
    logTestResult('edgeCases', 'Empty data tests', false, error.message);
  }
}

// Test 4: Invalid Filter Parameters
async function testInvalidFilterParameters(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 4.1: Invalid emotion filter
    log('FILTER_TESTS', 'Testing invalid emotion filter...', 'debug');
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Try to apply invalid emotion filter via direct API call
    const invalidFilterResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/confluence-trades?emotionalStates=INVALID_EMOTION', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || 'test-token'}`
          }
        });
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return {
          status: 'ERROR',
          error: error.message
        };
      }
    });
    
    const handlesInvalidFilter = invalidFilterResponse.status === 200 || 
                             (invalidFilterResponse.status >= 400 && invalidFilterResponse.status < 500);
    logTestResult('errorHandling', 'Invalid emotion filter handling', handlesInvalidFilter,
      handlesInvalidFilter ? 'Invalid filter handled gracefully' : 'Invalid filter caused server error');
    
    // Test 4.2: Invalid pagination parameters
    log('FILTER_TESTS', 'Testing invalid pagination parameters...', 'debug');
    
    const invalidPaginationResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/confluence-trades?page=-1&limit=9999', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || 'test-token'}`
          }
        });
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return {
          status: 'ERROR',
          error: error.message
        };
      }
    });
    
    const handlesInvalidPagination = invalidPaginationResponse.status === 200 || 
                                (invalidPaginationResponse.status >= 400 && invalidPaginationResponse.status < 500);
    logTestResult('errorHandling', 'Invalid pagination handling', handlesInvalidPagination,
      handlesInvalidPagination ? 'Invalid pagination handled gracefully' : 'Invalid pagination caused server error');
    
    await takeScreenshot(page, 'invalid-filters', 'FILTER_TESTS');
    
  } catch (error) {
    logTestResult('errorHandling', 'Invalid filter tests', false, error.message);
  }
}

// Test 5: Pagination Edge Cases
async function testPaginationEdgeCases(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 5.1: Page beyond available data
    log('PAGINATION_TESTS', 'Testing pagination beyond available data...', 'debug');
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Try to navigate to a very high page number
    const beyondPageResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/confluence-trades?page=999', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || 'test-token'}`
          }
        });
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return {
          status: 'ERROR',
          error: error.message
        };
      }
    });
    
    const handlesBeyondPage = beyondPageResponse.status === 200 && 
                           beyondPageResponse.data.trades.length === 0;
    logTestResult('edgeCases', 'Pagination beyond data handling', handlesBeyondPage,
      handlesBeyondPage ? 'Beyond page handled correctly' : 'Beyond page not handled properly');
    
    // Test 5.2: Zero and negative page numbers
    log('PAGINATION_TESTS', 'Testing zero/negative page numbers...', 'debug');
    
    const zeroPageResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/confluence-trades?page=0', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || 'test-token'}`
          }
        });
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return {
          status: 'ERROR',
          error: error.message
        };
      }
    });
    
    const handlesZeroPage = zeroPageResponse.status === 200;
    logTestResult('edgeCases', 'Zero page number handling', handlesZeroPage,
      handlesZeroPage ? 'Zero page handled correctly' : 'Zero page not handled properly');
    
    await takeScreenshot(page, 'pagination-edge-cases', 'PAGINATION_TESTS');
    
  } catch (error) {
    logTestResult('edgeCases', 'Pagination edge cases', false, error.message);
  }
}

// Test 6: Error Recovery Scenarios
async function testErrorRecoveryScenarios(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 6.1: Network error simulation
    log('ERROR_RECOVERY_TESTS', 'Testing network error recovery...', 'debug');
    
    await page.evaluate(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-')) {
          // Simulate network error
          return Promise.reject(new Error('Network error'));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(5000);
    
    // Check if error is handled gracefully
    const networkErrorElement = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
    const hasNetworkErrorHandling = !!networkErrorElement;
    logTestResult('errorHandling', 'Network error recovery', hasNetworkErrorHandling,
      hasNetworkErrorHandling ? 'Network error handled gracefully' : 'Network error not handled');
    
    await takeScreenshot(page, 'network-error', 'ERROR_RECOVERY_TESTS');
    
    // Test 6.2: Server error simulation
    log('ERROR_RECOVERY_TESTS', 'Testing server error recovery...', 'debug');
    
    await page.evaluate(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-')) {
          // Simulate server error
          return Promise.resolve(new Response('Internal Server Error', {
            status: 500,
            statusText: 'Internal Server Error'
          }));
        }
        return originalFetch.apply(this, args);
      };
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const serverErrorElement = await page.$('.text-red-400, .border-red-500, [data-testid="error"]');
    const hasServerErrorHandling = !!serverErrorElement;
    logTestResult('errorHandling', 'Server error recovery', hasServerErrorHandling,
      hasServerErrorHandling ? 'Server error handled gracefully' : 'Server error not handled');
    
    await takeScreenshot(page, 'server-error', 'ERROR_RECOVERY_TESTS');
    
  } catch (error) {
    logTestResult('errorHandling', 'Error recovery tests', false, error.message);
  }
}

// Test 7: Large Data Performance
async function testLargeDataPerformance(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 7.1: Large dataset performance
    log('PERFORMANCE_TESTS', 'Testing large dataset performance...', 'debug');
    
    const startTime = Date.now();
    
    await page.evaluate(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url.includes('/api/confluence-stats')) {
          // Simulate large dataset
          return Promise.resolve(new Response(JSON.stringify({
            totalTrades: 10000,
            totalPnL: 150000,
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
          // Simulate large trades dataset
          const largeTrades = Array(1000).fill(null).map((_, i) => ({
            id: `trade_${i}`,
            symbol: `SYMBOL${i}`,
            side: i % 2 === 0 ? 'Buy' : 'Sell',
            quantity: Math.floor(Math.random() * 1000) + 100,
            entry_price: Math.random() * 1000 + 50,
            exit_price: Math.random() * 1000 + 50,
            pnl: (Math.random() - 0.5) * 1000,
            trade_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            emotional_state: ['FOMO', 'REVENGE', 'TILT'].slice(0, Math.floor(Math.random() * 3) + 1)
          }));
          
          return Promise.resolve(new Response(JSON.stringify({
            trades: largeTrades,
            totalCount: 10000,
            currentPage: 1,
            totalPages: 10,
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
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(5000);
    
    const loadTime = Date.now() - startTime;
    const performsWell = loadTime < 10000; // Should load within 10 seconds
    logTestResult('performance', 'Large dataset performance', performsWell,
      performsWell ? `Large data loaded in ${loadTime}ms` : `Large data took too long: ${loadTime}ms`);
    
    await takeScreenshot(page, 'large-dataset', 'PERFORMANCE_TESTS');
    
  } catch (error) {
    logTestResult('performance', 'Large data performance test', false, error.message);
  }
}

// Test 8: Rapid Filter Changes
async function testRapidFilterChanges(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 8.1: Rapid filter changes
    log('RAPID_TESTS', 'Testing rapid filter changes...', 'debug');
    
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Simulate rapid filter changes
    const emotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE'];
    let errors = 0;
    
    for (let i = 0; i < emotions.length; i++) {
      try {
        await page.click(`button:has-text("${emotions[i]}")`);
        await sleep(500); // Rapid changes with minimal delay
      } catch (error) {
        errors++;
      }
    }
    
    const handlesRapidChanges = errors === 0;
    logTestResult('userExperience', 'Rapid filter changes', handlesRapidChanges,
      handlesRapidChanges ? 'Rapid filter changes handled well' : `${errors} errors during rapid changes`);
    
    await takeScreenshot(page, 'rapid-filters', 'RAPID_TESTS');
    
  } catch (error) {
    logTestResult('userExperience', 'Rapid filter changes test', false, error.message);
  }
}

// Test 9: Memory Usage
async function testMemoryUsage(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 9.1: Memory usage during navigation
    log('MEMORY_TESTS', 'Testing memory usage during navigation...', 'debug');
    
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform multiple navigation cycles
    for (let i = 0; i < 5; i++) {
      await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
      await sleep(1000);
      
      // Apply and clear filters
      await page.click('button:has-text("FOMO")');
      await sleep(500);
      await page.click('button:has-text("Clear All")');
      await sleep(500);
    }
    
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    const memoryAcceptable = memoryIncrease < 50 * 1024 * 1024; // Less than 50MB increase
    logTestResult('performance', 'Memory usage during navigation', memoryAcceptable,
      memoryAcceptable ? `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB` : `Excessive memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    
    await takeScreenshot(page, 'memory-usage', 'MEMORY_TESTS');
    
  } catch (error) {
    logTestResult('performance', 'Memory usage test', false, error.message);
  }
}

// Test 10: Responsive Behavior
async function testResponsiveBehavior(page) {
  try {
    await ensureLoggedIn(page);
    
    // Test 10.1: Mobile viewport
    log('RESPONSIVE_TESTS', 'Testing mobile viewport...', 'debug');
    
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${BASE_URL}/confluence`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const mobileLayoutWorks = await page.$('.grid-cols-1, .lg\\:grid-cols-2');
    logTestResult('userExperience', 'Mobile responsive layout', !!mobileLayoutWorks,
      mobileLayoutWorks ? 'Mobile layout works correctly' : 'Mobile layout issues detected');
    
    await takeScreenshot(page, 'mobile-layout', 'RESPONSIVE_TESTS');
    
    // Test 10.2: Tablet viewport
    log('RESPONSIVE_TESTS', 'Testing tablet viewport...', 'debug');
    
    await page.setViewport({ width: 768, height: 1024 }); // iPad
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const tabletLayoutWorks = await page.$('.grid-cols-1, .sm\\:grid-cols-2');
    logTestResult('userExperience', 'Tablet responsive layout', !!tabletLayoutWorks,
      tabletLayoutWorks ? 'Tablet layout works correctly' : 'Tablet layout issues detected');
    
    await takeScreenshot(page, 'tablet-layout', 'RESPONSIVE_TESTS');
    
    // Test 10.3: Desktop viewport
    log('RESPONSIVE_TESTS', 'Testing desktop viewport...', 'debug');
    
    await page.setViewport({ width: 1920, height: 1080 }); // Desktop
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);
    
    const desktopLayoutWorks = await page.$('.lg\\:grid-cols-4, .grid-cols-1');
    logTestResult('userExperience', 'Desktop responsive layout', !!desktopLayoutWorks,
      desktopLayoutWorks ? 'Desktop layout works correctly' : 'Desktop layout issues detected');
    
    await takeScreenshot(page, 'desktop-layout', 'RESPONSIVE_TESTS');
    
  } catch (error) {
    logTestResult('userExperience', 'Responsive behavior test', false, error.message);
  }
}

// Helper function to ensure user is logged in
async function ensureLoggedIn(page) {
  const currentUrl = page.url();
  if (!currentUrl.includes('/confluence') || currentUrl.includes('/login')) {
    await performLogin(page);
  }
}

// Helper function to perform login
async function performLogin(page) {
  try {
    log('AUTH_HELPER', 'Performing login...', 'debug');
    
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
    log('AUTH_HELPER', isLoggedIn ? 'Login successful' : 'Login failed', isLoggedIn ? 'success' : 'error');
    
    return isLoggedIn;
  } catch (error) {
    log('AUTH_HELPER', `Login failed: ${error.message}`, 'error');
    return false;
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
  
  // Generate recommendations
  if (testResults.authentication.failed > 0) {
    report.recommendations.push('Review authentication error handling and token validation');
  }
  
  if (testResults.errorHandling.failed > 0) {
    report.recommendations.push('Improve error handling for invalid data and network issues');
  }
  
  if (testResults.performance.failed > 0) {
    report.recommendations.push('Optimize performance for large datasets and memory usage');
  }
  
  if (testResults.userExperience.failed > 0) {
    report.recommendations.push('Enhance responsive design and user interaction handling');
  }
  
  // Save report
  const reportPath = path.join(TEST_CONFIG.screenshotDir, `confluence-edge-case-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('REPORT', `Test report saved to: ${reportPath}`, 'success');
  
  return report;
}

// Main execution
async function main() {
  log('MAIN', 'Starting comprehensive confluence edge case and error handling test suite...', 'info');
  
  await runComprehensiveEdgeCaseTests();
  
  const report = generateTestReport();
  
  // Print summary
  log('SUMMARY', `Test Suite Complete:`, 'info');
  log('SUMMARY', `Total Tests: ${report.summary.totalTests}`, 'info');
  log('SUMMARY', `Passed: ${report.summary.passedTests}`, 'success');
  log('SUMMARY', `Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info');
  log('SUMMARY', `Success Rate: ${report.summary.successRate}%`, report.summary.successRate >= 80 ? 'success' : 'warning');
  
  if (report.recommendations.length > 0) {
    log('RECOMMENDATIONS', 'Recommendations:', 'warning');
    report.recommendations.forEach(rec => log('RECOMMENDATIONS', `- ${rec}`, 'warning'));
  }
  
  log('MAIN', 'Comprehensive confluence edge case testing completed', 'success');
}

// Run the test suite
main().catch(error => {
  log('MAIN', `Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});