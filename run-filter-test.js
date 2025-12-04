// Automated Filter Test Runner
// This script will navigate to the trades page and run filtering tests

const puppeteer = require('puppeteer');
const fs = require('fs');

async function runFilteringTests() {
  console.log('🚀 [FILTER_TEST_RUNNER] Starting automated filtering tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    devtools: true    // Open devtools
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('📝 [BROWSER_CONSOLE]', msg.text());
  });
  
  // Enable network logging
  page.on('request', request => {
    if (request.url().includes('trades')) {
      console.log('🌐 [NETWORK_REQUEST]', {
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('trades')) {
      console.log('📥 [NETWORK_RESPONSE]', {
        url: response.url(),
        status: response.status()
      });
    }
  });
  
  try {
    // Navigate to the app
    console.log('📍 [FILTER_TEST_RUNNER] Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForSelector('.dashboard-card', { timeout: 10000 });
    console.log('✅ [FILTER_TEST_RUNNER] Trades page loaded');
    
    // Check if we need to login
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 [FILTER_TEST_RUNNER] Login required, skipping test for now');
      await browser.close();
      return { status: 'LOGIN_REQUIRED', message: 'Need to login first' };
    }
    
    // Load and execute the test script
    const testScript = fs.readFileSync('./simple-filter-test.js', 'utf8');
    
    console.log('🧪 [FILTER_TEST_RUNNER] Executing filter test script...');
    const testResults = await page.evaluate(testScript);
    
    // Wait for tests to complete
    await page.waitForTimeout(5000);
    
    // Get any console errors
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    // Get network requests
    const networkRequests = await page.evaluate(() => {
      return window.filterTestRequests || [];
    });
    
    console.log('📊 [FILTER_TEST_RUNNER] Test completed');
    console.log('📊 [FILTER_TEST_RUNNER] Console errors:', consoleErrors);
    console.log('📊 [FILTER_TEST_RUNNER] Network requests:', networkRequests);
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'filter-test-result.png',
      fullPage: true 
    });
    
    await browser.close();
    
    return {
      status: 'COMPLETED',
      consoleErrors,
      networkRequests,
      screenshot: 'filter-test-result.png'
    };
    
  } catch (error) {
    console.error('❌ [FILTER_TEST_RUNNER] Test failed:', error);
    await browser.close();
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

// Run the tests
runFilteringTests()
  .then(results => {
    console.log('\n📋 [FILTER_TEST_RUNNER] Final Results:', results);
    
    // Save results to file
    fs.writeFileSync(
      'filter-test-results.json', 
      JSON.stringify(results, null, 2)
    );
    
    console.log('💾 [FILTER_TEST_RUNNER] Results saved to filter-test-results.json');
  })
  .catch(error => {
    console.error('❌ [FILTER_TEST_RUNNER] Failed to run tests:', error);
  });