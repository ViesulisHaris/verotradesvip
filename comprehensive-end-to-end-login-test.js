#!/usr/bin/env node

/**
 * COMPREHENSIVE END-TO-END LOGIN TESTING SCRIPT
 * 
 * This script performs thorough testing of the authentication system from a user perspective,
 * including login flows, dashboard access, session persistence, and error handling.
 * 
 * CRITICAL TESTING SCOPE:
 * 1. Create comprehensive end-to-end login test that actually simulates real user logging in
 * 2. Verify dashboard access after successful authentication
 * 3. Test session persistence across page refreshes
 * 4. Test logout functionality and return to login page
 * 5. Test error scenarios (invalid credentials, network failures)
 * 6. Verify protected routes properly redirect unauthenticated users
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  headless: false, // Show browser for visual verification
  slowMo: 100, // Slow down actions for better observation
  timeout: 30000, // 30 seconds timeout
  viewport: { width: 1920, height: 1080 }
};

// Test credentials - UPDATE THESE WITH YOUR ACTUAL TEST CREDENTIALS
const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com', // Replace with valid test email
    password: 'testpassword123' // Replace with valid test password
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  },
  empty: {
    email: '',
    password: ''
  }
};

// Test results storage
const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: [],
  screenshots: [],
  errors: []
};

/**
 * Utility function to log test results
 */
function logTest(testName, status, details = '', error = null) {
  const result = {
    testName,
    status: status ? 'PASS' : 'FAIL',
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.totalTests++;
  
  if (status) {
    testResults.passedTests++;
    console.log(`✅ ${testName}: ${details}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: ${details}`);
    if (error) {
      console.log(`   Error: ${error.message}`);
      testResults.errors.push({ testName, error: error.message });
    }
  }
}

/**
 * Take screenshot for debugging
 */
async function takeScreenshot(page, name) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `login-test-${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    testResults.screenshots.push({ name, filename, filepath });
    console.log(`📸 Screenshot saved: ${filename}`);
    
    return filepath;
  } catch (error) {
    console.log(`⚠️  Failed to take screenshot: ${error.message}`);
    return null;
  }
}

/**
 * Wait for element with timeout
 */
async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if element exists
 */
async function elementExists(page, selector) {
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get current URL
 */
async function getCurrentUrl(page) {
  return page.evaluate(() => window.location.href);
}

/**
 * Check authentication state by examining page content
 */
async function checkAuthenticationState(page) {
  try {
    // Check for login form (unauthenticated state)
    const hasLoginForm = await elementExists(page, 'input[type="email"]');
    
    // Check for dashboard content (authenticated state)
    const hasDashboard = await elementExists(page, 'h1');
    const dashboardText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : '';
    });
    
    // Check URL
    const currentUrl = await getCurrentUrl(page);
    
    return {
      isAuthenticated: !hasLoginForm && (currentUrl.includes('/dashboard') || dashboardText.includes('Trading Dashboard')),
      isLoginPage: currentUrl.includes('/login'),
      isDashboardPage: currentUrl.includes('/dashboard'),
      url: currentUrl,
      hasLoginForm,
      hasDashboardContent: dashboardText.includes('Trading Dashboard')
    };
  } catch (error) {
    console.log(`⚠️  Error checking auth state: ${error.message}`);
    return {
      isAuthenticated: false,
      isLoginPage: false,
      isDashboardPage: false,
      url: await getCurrentUrl(page),
      error: error.message
    };
  }
}

/**
 * Test 1: Verify login page loads correctly
 */
async function testLoginPageLoad(browser) {
  console.log('\n🧪 TEST 1: Login Page Load Verification');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Check if login form elements are present
    const hasEmailInput = await elementExists(page, 'input[type="email"]');
    const hasPasswordInput = await elementExists(page, 'input[type="password"]');
    const hasSubmitButton = await elementExists(page, 'button[type="submit"]');
    const hasWelcomeText = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Welcome to VeroTrade') || text.includes('Sign In');
    });
    
    const success = hasEmailInput && hasPasswordInput && hasSubmitButton && hasWelcomeText;
    
    logTest(
      'Login Page Load',
      success,
      `Email: ${hasEmailInput}, Password: ${hasPasswordInput}, Submit: ${hasSubmitButton}, Welcome: ${hasWelcomeText}`
    );
    
    await takeScreenshot(page, 'login-page-load');
    
  } catch (error) {
    logTest('Login Page Load', false, 'Failed to load login page', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 2: Test login with empty credentials
 */
async function testEmptyCredentials(browser) {
  console.log('\n🧪 TEST 2: Empty Credentials Validation');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation messages
    const hasErrorMessage = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Please enter both email and password') || 
             text.includes('required') || 
             text.includes('valid');
    });
    
    // Check if still on login page (should not redirect)
    const authState = await checkAuthenticationState(page);
    
    const success = hasErrorMessage || authState.isLoginPage;
    
    logTest(
      'Empty Credentials Validation',
      success,
      `Error message shown: ${hasErrorMessage}, Stayed on login: ${authState.isLoginPage}`
    );
    
    await takeScreenshot(page, 'empty-credentials');
    
  } catch (error) {
    logTest('Empty Credentials Validation', false, 'Failed to test empty credentials', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 3: Test login with invalid credentials
 */
async function testInvalidCredentials(browser) {
  console.log('\n🧪 TEST 3: Invalid Credentials Error Handling');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Fill in invalid credentials
    await page.type('input[type="email"]', TEST_CREDENTIALS.invalid.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.invalid.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for error message
    const hasErrorMessage = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Invalid email or password') || 
             text.includes('Invalid login credentials') ||
             text.includes('authentication failed');
    });
    
    // Check if still on login page
    const authState = await checkAuthenticationState(page);
    
    const success = hasErrorMessage && authState.isLoginPage;
    
    logTest(
      'Invalid Credentials Error Handling',
      success,
      `Error message shown: ${hasErrorMessage}, Stayed on login: ${authState.isLoginPage}`
    );
    
    await takeScreenshot(page, 'invalid-credentials');
    
  } catch (error) {
    logTest('Invalid Credentials Error Handling', false, 'Failed to test invalid credentials', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 4: Test successful login and dashboard access
 */
async function testSuccessfulLogin(browser) {
  console.log('\n🧪 TEST 4: Successful Login and Dashboard Access');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Fill in valid credentials
    await page.type('input[type="email"]', TEST_CREDENTIALS.valid.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.valid.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForTimeout(5000);
    
    // Check authentication state
    const authState = await checkAuthenticationState(page);
    
    // Check for dashboard content
    const hasDashboardContent = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Trading Dashboard') || 
             text.includes('Total PnL') ||
             text.includes('Profit Factor');
    });
    
    const success = authState.isAuthenticated && authState.isDashboardPage && hasDashboardContent;
    
    logTest(
      'Successful Login and Dashboard Access',
      success,
      `Authenticated: ${authState.isAuthenticated}, Dashboard: ${authState.isDashboardPage}, Content: ${hasDashboardContent}`
    );
    
    await takeScreenshot(page, 'successful-login-dashboard');
    
  } catch (error) {
    logTest('Successful Login and Dashboard Access', false, 'Failed to test successful login', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 5: Test session persistence across page refresh
 */
async function testSessionPersistence(browser) {
  console.log('\n🧪 TEST 5: Session Persistence Across Page Refresh');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    // First, login
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', TEST_CREDENTIALS.valid.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.valid.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(5000);
    
    // Check initial authentication state
    const initialAuthState = await checkAuthenticationState(page);
    
    // Refresh the page
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    // Check authentication state after refresh
    const refreshedAuthState = await checkAuthenticationState(page);
    
    const success = initialAuthState.isAuthenticated && refreshedAuthState.isAuthenticated;
    
    logTest(
      'Session Persistence Across Page Refresh',
      success,
      `Initial auth: ${initialAuthState.isAuthenticated}, After refresh: ${refreshedAuthState.isAuthenticated}`
    );
    
    await takeScreenshot(page, 'session-persistence');
    
  } catch (error) {
    logTest('Session Persistence Across Page Refresh', false, 'Failed to test session persistence', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 6: Test logout functionality
 */
async function testLogoutFunctionality(browser) {
  console.log('\n🧪 TEST 6: Logout Functionality');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    // First, login
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', TEST_CREDENTIALS.valid.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.valid.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(5000);
    
    // Check authenticated state
    const loggedInState = await checkAuthenticationState(page);
    
    // Look for logout button/link (common selectors)
    const logoutSelectors = [
      'button[onclick*="logout"]',
      'a[href*="logout"]',
      'button:contains("Logout")',
      'a:contains("Logout")',
      '[data-testid*="logout"]'
    ];
    
    let logoutButton = null;
    for (const selector of logoutSelectors) {
      try {
        logoutButton = await page.$(selector);
        if (logoutButton) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    // If no logout button found, try to find it by text content
    if (!logoutButton) {
      logoutButton = await page.evaluateHandle(() => {
        const buttons = document.querySelectorAll('button, a');
        for (const button of buttons) {
          if (button.textContent.toLowerCase().includes('logout') || 
              button.textContent.toLowerCase().includes('sign out')) {
            return button;
          }
        }
        return null;
      });
    }
    
    if (logoutButton) {
      await logoutButton.click();
      await page.waitForTimeout(3000);
      
      // Check authentication state after logout
      const loggedOutState = await checkAuthenticationState(page);
      
      const success = loggedInState.isAuthenticated && loggedOutState.isLoginPage;
      
      logTest(
        'Logout Functionality',
        success,
        `Was logged in: ${loggedInState.isAuthenticated}, Redirected to login: ${loggedOutState.isLoginPage}`
      );
    } else {
      logTest('Logout Functionality', false, 'Logout button not found');
    }
    
    await takeScreenshot(page, 'logout-test');
    
  } catch (error) {
    logTest('Logout Functionality', false, 'Failed to test logout functionality', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 7: Test protected route access for unauthenticated users
 */
async function testProtectedRouteAccess(browser) {
  console.log('\n🧪 TEST 7: Protected Route Access for Unauthenticated Users');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    // Try to access dashboard directly without authentication
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    // Check if redirected to login
    const authState = await checkAuthenticationState(page);
    
    const success = authState.isLoginPage || !authState.isAuthenticated;
    
    logTest(
      'Protected Route Access for Unauthenticated Users',
      success,
      `Redirected to login: ${authState.isLoginPage}, Authenticated: ${authState.isAuthenticated}`
    );
    
    await takeScreenshot(page, 'protected-route-access');
    
  } catch (error) {
    logTest('Protected Route Access for Unauthenticated Users', false, 'Failed to test protected route access', error);
  } finally {
    await page.close();
  }
}

/**
 * Test 8: Test network error handling
 */
async function testNetworkErrorHandling(browser) {
  console.log('\n🧪 TEST 8: Network Error Handling');
  
  const page = await browser.newPage();
  await page.setViewport(TEST_CONFIG.viewport);
  
  try {
    // Simulate offline mode
    await page.setOfflineMode(true);
    
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
    
    // Fill in credentials
    await page.type('input[type="email"]', TEST_CREDENTIALS.valid.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.valid.password);
    
    // Try to submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for network error message
    const hasNetworkError = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Network') || 
             text.includes('connection') ||
             text.includes('offline') ||
             text.includes('failed');
    });
    
    // Restore online mode
    await page.setOfflineMode(false);
    
    const success = hasNetworkError;
    
    logTest(
      'Network Error Handling',
      success,
      `Network error message shown: ${hasNetworkError}`
    );
    
    await takeScreenshot(page, 'network-error');
    
  } catch (error) {
    logTest('Network Error Handling', false, 'Failed to test network error handling', error);
  } finally {
    await page.close();
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  testResults.endTime = new Date().toISOString();
  
  const report = {
    summary: {
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      duration: new Date(testResults.endTime) - new Date(testResults.startTime),
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: testResults.totalTests > 0 ? (testResults.passedTests / testResults.totalTests * 100).toFixed(2) + '%' : '0%'
    },
    testResults: testResults.tests,
    screenshots: testResults.screenshots,
    errors: testResults.errors,
    testConfiguration: TEST_CONFIG,
    testCredentials: {
      valid: { email: TEST_CREDENTIALS.valid.email, password: '***' },
      invalid: TEST_CREDENTIALS.invalid,
      empty: TEST_CREDENTIALS.empty
    }
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, 'COMPREHENSIVE_LOGIN_TEST_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, 'COMPREHENSIVE_LOGIN_TEST_REPORT.md');
  fs.writeFileSync(markdownPath, markdownReport);
  
  console.log(`\n📊 Test Report Generated:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: ${markdownPath}`);
  
  return report;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
  const { summary, testResults, screenshots, errors } = report;
  
  let markdown = `# COMPREHENSIVE END-TO-END LOGIN TEST REPORT

## Test Summary

- **Start Time:** ${summary.startTime}
- **End Time:** ${summary.endTime}
- **Duration:** ${summary.duration}ms
- **Total Tests:** ${summary.totalTests}
- **Passed Tests:** ${summary.passedTests}
- **Failed Tests:** ${summary.failedTests}
- **Success Rate:** ${summary.successRate}

## Test Results

| Test Name | Status | Details | Error |
|-----------|--------|---------|-------|
`;

  testResults.forEach(test => {
    const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    markdown += `| ${test.testName} | ${status} | ${test.details || '-'} | ${test.error || '-'} |\n`;
  });

  if (screenshots.length > 0) {
    markdown += `\n## Screenshots\n\n`;
    screenshots.forEach(screenshot => {
      markdown += `- **${screenshot.name}**: \`${screenshot.filename}\`\n`;
    });
  }

  if (errors.length > 0) {
    markdown += `\n## Errors\n\n`;
    errors.forEach(error => {
      markdown += `- **${error.testName}**: ${error.error}\n`;
    });
  }

  markdown += `\n## Test Configuration\n\n`;
  markdown += `- **Base URL:** ${TEST_CONFIG.baseUrl}\n`;
  markdown += `- **Headless:** ${TEST_CONFIG.headless}\n`;
  markdown += `- **Timeout:** ${TEST_CONFIG.timeout}ms\n`;
  markdown += `- **Viewport:** ${TEST_CONFIG.viewport.width}x${TEST_CONFIG.viewport.height}\n`;

  markdown += `\n## Critical Findings\n\n`;
  
  const failedTests = testResults.filter(t => t.status === 'FAIL');
  if (failedTests.length === 0) {
    markdown += `✅ **ALL TESTS PASSED** - The authentication system is working correctly from a user perspective.\n\n`;
    markdown += `### Verified Functionality:\n`;
    markdown += `- ✅ Login page loads with all required elements\n`;
    markdown += `- ✅ Form validation works for empty credentials\n`;
    markdown += `- ✅ Error handling works for invalid credentials\n`;
    markdown += `- ✅ Successful login redirects to dashboard\n`;
    markdown += `- ✅ Dashboard content loads after authentication\n`;
    markdown += `- ✅ Session persistence works across page refreshes\n`;
    markdown += `- ✅ Protected routes redirect unauthenticated users\n`;
    markdown += `- ✅ Network error handling works appropriately\n`;
  } else {
    markdown += `❌ **${failedTests.length} TESTS FAILED** - Issues found in authentication system.\n\n`;
    markdown += `### Failed Tests:\n`;
    failedTests.forEach(test => {
      markdown += `- ❌ **${test.testName}**: ${test.details}\n`;
      if (test.error) {
        markdown += `  - Error: ${test.error}\n`;
      }
    });
  }

  markdown += `\n## Recommendations\n\n`;
  
  if (failedTests.length === 0) {
    markdown += `🎉 **Authentication system is fully functional!**\n\n`;
    markdown += `### Next Steps:\n`;
    markdown += `- Deploy to production\n`;
    markdown += `- Monitor authentication logs\n`;
    markdown += `- Set up analytics for user authentication flows\n`;
    markdown += `- Consider implementing additional security features (2FA, rate limiting)\n`;
  } else {
    markdown += `🔧 **Authentication system needs attention!**\n\n`;
    markdown += `### Priority Fixes:\n`;
    failedTests.forEach(test => {
      markdown += `- Fix **${test.testName}**: ${test.details}\n`;
    });
    markdown += `- Re-run tests after fixes\n`;
    markdown += `- Perform manual verification\n`;
  }

  return markdown;
}

/**
 * Main test execution function
 */
async function runComprehensiveLoginTests() {
  console.log('🚀 Starting Comprehensive End-to-End Login Tests');
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`👤 Test Email: ${TEST_CREDENTIALS.valid.email}`);
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('🌐 Browser launched successfully');
    
    // Run all tests
    await testLoginPageLoad(browser);
    await testEmptyCredentials(browser);
    await testInvalidCredentials(browser);
    await testSuccessfulLogin(browser);
    await testSessionPersistence(browser);
    await testLogoutFunctionality(browser);
    await testProtectedRouteAccess(browser);
    await testNetworkErrorHandling(browser);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    logTest('Test Execution', false, 'Critical error during test execution', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🌐 Browser closed');
    }
  }
  
  // Generate report
  const report = generateTestReport();
  
  // Display summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   Total Tests: ${report.summary.totalTests}`);
  console.log(`   Passed: ${report.summary.passedTests}`);
  console.log(`   Failed: ${report.summary.failedTests}`);
  console.log(`   Success Rate: ${report.summary.successRate}`);
  
  if (report.summary.failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication system is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please review the report for details.');
  }
  
  return report;
}

/**
 * Check if test credentials are configured
 */
function checkTestCredentials() {
  if (TEST_CREDENTIALS.valid.email === 'test@example.com' || 
      TEST_CREDENTIALS.valid.password === 'testpassword123') {
    console.log('⚠️  WARNING: Using default test credentials.');
    console.log('⚠️  Please update TEST_CREDENTIALS.valid with actual test credentials.');
    console.log('⚠️  Tests will run but may not reflect real authentication behavior.\n');
    
    return false;
  }
  return true;
}

// Run tests if this script is executed directly
if (require.main === module) {
  console.log('🔍 COMPREHENSIVE END-TO-END LOGIN TESTING');
  console.log('=' .repeat(50));
  
  // Check credentials
  const hasValidCredentials = checkTestCredentials();
  
  if (!hasValidCredentials) {
    console.log('💡 To run tests with real authentication:');
    console.log('   1. Update TEST_CREDENTIALS.valid with real test credentials');
    console.log('   2. Ensure the application is running on http://localhost:3000');
    console.log('   3. Re-run this script\n');
  }
  
  // Run tests
  runComprehensiveLoginTests()
    .then(() => {
      console.log('\n✅ Test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveLoginTests,
  TEST_CONFIG,
  TEST_CREDENTIALS
};