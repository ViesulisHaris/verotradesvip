const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  headless: false,
  slowMo: 100,
  timeout: 30000
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  consoleErrors: [],
  consoleWarnings: [],
  reactWarnings: [],
  hydrationErrors: [],
  authenticationTests: [],
  mountingIssues: [],
  summary: {
    totalErrors: 0,
    totalWarnings: 0,
    testsPassed: 0,
    testsFailed: 0
  }
};

// Function to capture console messages
function setupConsoleListeners(page) {
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      testResults.consoleErrors.push({
        text,
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      testResults.summary.totalErrors++;
      
      // Check for React-specific errors
      if (text.includes('Warning:') || text.includes('Error:')) {
        testResults.reactWarnings.push({
          text,
          type: 'react-warning',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for hydration errors
      if (text.includes('Hydration') || text.includes('hydration')) {
        testResults.hydrationErrors.push({
          text,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for mounting issues
      if (text.includes('mount') || text.includes('Maximum update depth')) {
        testResults.mountingIssues.push({
          text,
          timestamp: new Date().toISOString()
        });
      }
    } else if (type === 'warning') {
      testResults.consoleWarnings.push({
        text,
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      testResults.summary.totalWarnings++;
    }
    
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  page.on('pageerror', error => {
    testResults.consoleErrors.push({
      text: error.message,
      stack: error.stack,
      type: 'page-error',
      timestamp: new Date().toISOString()
    });
    testResults.summary.totalErrors++;
    console.error(`[PAGE ERROR] ${error.message}`);
  });
}

// Test authentication flow
async function testAuthenticationFlow(page) {
  console.log('\n=== Testing Authentication Flow ===');
  
  try {
    // Test 1: Access protected route without authentication
    console.log('Testing access to protected route without authentication...');
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`, { waitUntil: 'networkidle2' });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      testResults.authenticationTests.push({
        test: 'Protected route redirect',
        status: 'PASSED',
        message: 'Correctly redirected to login page'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.authenticationTests.push({
        test: 'Protected route redirect',
        status: 'FAILED',
        message: 'Did not redirect to login page'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 2: Login page loads without errors
    console.log('Testing login page loading...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    const loginForm = await page.$('form');
    if (loginForm) {
      testResults.authenticationTests.push({
        test: 'Login page loads',
        status: 'PASSED',
        message: 'Login form found on page'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.authenticationTests.push({
        test: 'Login page loads',
        status: 'FAILED',
        message: 'Login form not found'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 3: Register page loads without errors
    console.log('Testing register page loading...');
    await page.goto(`${TEST_CONFIG.baseUrl}/register`, { waitUntil: 'networkidle2' });
    
    const registerForm = await page.$('form');
    if (registerForm) {
      testResults.authenticationTests.push({
        test: 'Register page loads',
        status: 'PASSED',
        message: 'Register form found on page'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.authenticationTests.push({
        test: 'Register page loads',
        status: 'FAILED',
        message: 'Register form not found'
      });
      testResults.summary.testsFailed++;
    }
    
    // Test 4: Check for React mounting warnings on auth pages
    console.log('Checking for React mounting warnings on auth pages...');
    await page.waitForTimeout(2000); // Wait for any delayed rendering
    
    // Check if there are any React mounting warnings
    const mountingWarnings = testResults.reactWarnings.filter(warning => 
      warning.text.includes('mount') || 
      warning.text.includes('component') ||
      warning.text.includes('render')
    );
    
    if (mountingWarnings.length === 0) {
      testResults.authenticationTests.push({
        test: 'No React mounting warnings',
        status: 'PASSED',
        message: 'No React mounting warnings detected'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.authenticationTests.push({
        test: 'No React mounting warnings',
        status: 'FAILED',
        message: `Found ${mountingWarnings.length} React mounting warnings`,
        warnings: mountingWarnings
      });
      testResults.summary.testsFailed++;
    }
    
  } catch (error) {
    testResults.authenticationTests.push({
      test: 'Authentication flow',
      status: 'ERROR',
      message: error.message
    });
    testResults.summary.testsFailed++;
  }
}

// Test trades page specifically
async function testTradesPage(page) {
  console.log('\n=== Testing Trades Page ===');
  
  try {
    // Go to trades page (should redirect to login)
    await page.goto(`${TEST_CONFIG.baseUrl}/trades`, { waitUntil: 'networkidle2' });
    
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(3000);
    
    // Check for specific trades page issues
    const debouncedFunctionErrors = testResults.consoleErrors.filter(error =>
      error.text.includes('debounce') || 
      error.text.includes('createDebouncedFunction')
    );
    
    if (debouncedFunctionErrors.length === 0) {
      testResults.authenticationTests.push({
        test: 'Trades page debounced functions',
        status: 'PASSED',
        message: 'No debounced function errors detected'
      });
      testResults.summary.testsPassed++;
    } else {
      testResults.authenticationTests.push({
        test: 'Trades page debounced functions',
        status: 'FAILED',
        message: `Found ${debouncedFunctionErrors.length} debounced function errors`,
        errors: debouncedFunctionErrors
      });
      testResults.summary.testsFailed++;
    }
    
  } catch (error) {
    testResults.authenticationTests.push({
      test: 'Trades page',
      status: 'ERROR',
      message: error.message
    });
    testResults.summary.testsFailed++;
  }
}

// Main test function
async function runTests() {
  let browser;
  let page;
  
  try {
    console.log('Starting React Mounting Verification Test...\n');
    
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Setup console listeners
    setupConsoleListeners(page);
    
    // Run authentication tests
    await testAuthenticationFlow(page);
    
    // Run trades page tests
    await testTradesPage(page);
    
    // Test navigation between pages
    console.log('\n=== Testing Page Navigation ===');
    await page.goto(`${TEST_CONFIG.baseUrl}/`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    await page.goto(`${TEST_CONFIG.baseUrl}/register`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    testResults.authenticationTests.push({
      test: 'Page navigation',
      status: 'PASSED',
      message: 'Successfully navigated between pages'
    });
    testResults.summary.testsPassed++;
    
  } catch (error) {
    console.error('Test execution error:', error);
    testResults.consoleErrors.push({
      text: error.message,
      type: 'test-execution-error',
      timestamp: new Date().toISOString()
    });
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
  
  // Save results
  const resultsPath = './react-mounting-test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${resultsPath}`);
  
  // Print summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total Errors: ${testResults.summary.totalErrors}`);
  console.log(`Total Warnings: ${testResults.summary.totalWarnings}`);
  console.log(`Tests Passed: ${testResults.summary.testsPassed}`);
  console.log(`Tests Failed: ${testResults.summary.testsFailed}`);
  
  if (testResults.hydrationErrors.length > 0) {
    console.log('\n=== HYDRATION ERRORS ===');
    testResults.hydrationErrors.forEach(error => {
      console.log(`- ${error.text}`);
    });
  }
  
  if (testResults.mountingIssues.length > 0) {
    console.log('\n=== MOUNTING ISSUES ===');
    testResults.mountingIssues.forEach(issue => {
      console.log(`- ${issue.text}`);
    });
  }
  
  if (testResults.reactWarnings.length > 0) {
    console.log('\n=== REACT WARNINGS ===');
    testResults.reactWarnings.forEach(warning => {
      console.log(`- ${warning.text}`);
    });
  }
  
  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResults };