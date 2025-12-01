/**
 * BROWSER-BASED STRATEGY ERROR TEST
 * 
 * This script uses Puppeteer to navigate to the strategies page
 * and capture the exact error as it appears in the browser
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  strategiesUrl: 'http://localhost:3000/strategies',
  loginUrl: 'http://localhost:3000/login',
  screenshotDir: './test-screenshots',
  timeout: 30000,
  headless: false // Set to true for headless mode
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  browserInfo: null,
  tests: [],
  screenshots: [],
  consoleLogs: [],
  networkRequests: [],
  errors: [],
  finalErrorState: null
};

// Helper function to log test results
function logTest(testName, status, details = null, error = null) {
  const test = {
    name: testName,
    status: status, // 'PASS', 'FAIL', 'WARN'
    timestamp: new Date().toISOString(),
    details: details,
    error: error ? {
      message: error.message,
      stack: error.stack
    } : null
  };
  
  testResults.tests.push(test);
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${testName}`);
  
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
  
  if (error) {
    console.error(`   Error:`, error.message);
    testResults.errors.push({
      test: testName,
      error: error.message,
      stack: error.stack
    });
  }
  
  console.log('');
}

// Ensure screenshot directory exists
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

async function takeScreenshot(page, name) {
  try {
    const screenshotPath = `${TEST_CONFIG.screenshotDir}/${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push({
      name,
      path: screenshotPath,
      timestamp: new Date().toISOString()
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error(`❌ Failed to take screenshot ${name}:`, error);
    return null;
  }
}

async function runBrowserTest() {
  console.log('🚀 BROWSER-BASED STRATEGY ERROR TEST');
  console.log('=' .repeat(50));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Target URL: ${TEST_CONFIG.strategiesUrl}`);
  console.log('=' .repeat(50));
  console.log('');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    console.log('🔍 Launching browser...');
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    page = await browser.newPage();
    
    // Capture browser info
    testResults.browserInfo = await page.evaluate(() => ({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }));
    
    // Set up console logging
    page.on('console', msg => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      testResults.consoleLogs.push(logEntry);
      
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Console Error: ${msg.text()}`);
      }
    });
    
    // Set up network request logging
    page.on('request', request => {
      testResults.networkRequests.push({
        timestamp: new Date().toISOString(),
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    page.on('response', response => {
      testResults.networkRequests.push({
        timestamp: new Date().toISOString(),
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
      
      if (response.status() >= 400) {
        console.log(`🔴 Network Error: ${response.status()} ${response.url()}`);
      }
    });
    
    // Test 1: Navigate to strategies page directly (unauthenticated)
    console.log('🔍 Test 1: Navigate to strategies page (unauthenticated)...');
    try {
      await page.goto(TEST_CONFIG.strategiesUrl, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout 
      });
      
      await takeScreenshot(page, 'strategies-unauthenticated');
      
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Check for error message
      const errorElement = await page.$('text=An unexpected error occurred while loading the strategy');
      if (errorElement) {
        logTest('Strategies Page (Unauthenticated)', 'FAIL', 'Target error message found on page');
        testResults.finalErrorState = {
          found: true,
          context: 'unauthenticated',
          screenshot: testResults.screenshots[testResults.screenshots.length - 1].path
        };
      } else {
        logTest('Strategies Page (Unauthenticated)', 'PASS', 'No error message found');
      }
      
      // Check for authentication redirect
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        logTest('Authentication Redirect', 'PASS', 'Redirected to login as expected');
      } else {
        logTest('Authentication Redirect', 'WARN', 'Not redirected to login');
      }
      
    } catch (error) {
      logTest('Strategies Page (Unauthenticated)', 'FAIL', null, error);
    }
    
    // Test 2: Try to log in (if login page is accessible)
    console.log('🔍 Test 2: Attempt login process...');
    try {
      await page.goto(TEST_CONFIG.loginUrl, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout 
      });
      
      await takeScreenshot(page, 'login-page');
      
      // Wait a bit for any dynamic content
      await page.waitForTimeout(2000);
      
      // Check if login form is present
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      
      if (emailInput && passwordInput) {
        logTest('Login Form Availability', 'PASS', 'Login form is accessible');
        
        // Try to fill in test credentials (this will likely fail but we want to see the behavior)
        await emailInput.type('test@example.com');
        await passwordInput.type('testpassword123');
        
        await takeScreenshot(page, 'login-form-filled');
        
        // Try to submit (this will likely fail)
        const submitButton = await page.$('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          await takeScreenshot(page, 'login-attempt-result');
          logTest('Login Attempt', 'PASS', 'Login form submitted (expected to fail)');
        } else {
          logTest('Login Submit Button', 'FAIL', 'No submit button found');
        }
      } else {
        logTest('Login Form Availability', 'FAIL', 'Login form not found');
      }
      
    } catch (error) {
      logTest('Login Process', 'FAIL', null, error);
    }
    
    // Test 3: Navigate to strategies page again (after login attempt)
    console.log('🔍 Test 3: Navigate to strategies page (after login attempt)...');
    try {
      await page.goto(TEST_CONFIG.strategiesUrl, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout 
      });
      
      await takeScreenshot(page, 'strategies-after-login-attempt');
      await page.waitForTimeout(3000);
      
      // Check for error message again
      const errorElement = await page.$('text=An unexpected error occurred while loading the strategy');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        logTest('Strategies Page (After Login)', 'FAIL', `Target error found: "${errorText}"`);
        testResults.finalErrorState = {
          found: true,
          context: 'after-login-attempt',
          errorMessage: errorText,
          screenshot: testResults.screenshots[testResults.screenshots.length - 1].path
        };
      } else {
        logTest('Strategies Page (After Login)', 'PASS', 'No error message found');
      }
      
      // Check page content
      const pageContent = await page.content();
      const hasErrorElements = pageContent.includes('error') || pageContent.includes('Error');
      const hasLoadingElements = pageContent.includes('Loading') || pageContent.includes('loading');
      
      logTest('Page Content Analysis', 'PASS', {
        hasErrorElements,
        hasLoadingElements,
        pageLength: pageContent.length
      });
      
    } catch (error) {
      logTest('Strategies Page (After Login)', 'FAIL', null, error);
    }
    
    // Test 4: Check browser console for errors
    console.log('🔍 Test 4: Analyzing browser console logs...');
    const errorLogs = testResults.consoleLogs.filter(log => log.type === 'error');
    if (errorLogs.length > 0) {
      logTest('Browser Console Errors', 'FAIL', {
        errorCount: errorLogs.length,
        errors: errorLogs.map(log => ({
          text: log.text,
          location: log.location
        }))
      });
    } else {
      logTest('Browser Console Errors', 'PASS', 'No console errors found');
    }
    
    // Test 5: Analyze network requests for failures
    console.log('🔍 Test 5: Analyzing network requests...');
    const failedRequests = testResults.networkRequests.filter(req => 
      req.type === 'response' && req.status >= 400
    );
    
    if (failedRequests.length > 0) {
      logTest('Network Request Failures', 'FAIL', {
        failureCount: failedRequests.length,
        failures: failedRequests.map(req => ({
          url: req.url,
          status: req.status,
          statusText: req.statusText
        }))
      });
    } else {
      logTest('Network Request Failures', 'PASS', 'No network failures detected');
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error);
    logTest('Browser Test Execution', 'FAIL', null, error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate final report
  console.log('=' .repeat(50));
  console.log('📊 BROWSER TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passedTests = testResults.tests.filter(test => test.status === 'PASS').length;
  const failedTests = testResults.tests.filter(test => test.status === 'FAIL').length;
  const warningTests = testResults.tests.filter(test => test.status === 'WARN').length;
  
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Warnings: ${warningTests} ⚠️`);
  console.log(`Screenshots: ${testResults.screenshots.length} 📸`);
  console.log(`Console Logs: ${testResults.consoleLogs.length} 🔍`);
  console.log(`Network Requests: ${testResults.networkRequests.length} 🌐`);
  console.log('');
  
  if (testResults.finalErrorState && testResults.finalErrorState.found) {
    console.log('🎯 TARGET ERROR CONFIRMED!');
    console.log('The "An unexpected error occurred while loading the strategy" error was found:');
    console.log(`   Context: ${testResults.finalErrorState.context}`);
    if (testResults.finalErrorState.errorMessage) {
      console.log(`   Message: ${testResults.finalErrorState.errorMessage}`);
    }
    console.log(`   Screenshot: ${testResults.finalErrorState.screenshot}`);
  } else {
    console.log('🤔 Target error not found in browser test.');
    console.log('The error might occur under different conditions or timing.');
  }
  
  // Save detailed results
  const reportPath = `browser-strategy-test-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed browser test report saved to: ${reportPath}`);
  
  return testResults;
}

// Execute the browser test
if (require.main === module) {
  runBrowserTest()
    .then(results => {
      console.log('\n✅ Browser test completed successfully');
      process.exit(results.finalErrorState && results.finalErrorState.found ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Browser test failed:', error);
      process.exit(1);
    });
}

module.exports = { runBrowserTest };