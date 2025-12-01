const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

// Performance expectations
const PERFORMANCE_THRESHOLDS = {
  homepageLoad: 2000,      // under 2 seconds
  loginPageLoad: 2000,     // under 2 seconds
  authenticationProcess: 3000, // under 3 seconds
  dashboardLoad: 4000,     // under 4 seconds
  totalFlowTime: 10000     // under 10 seconds
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  performance: {},
  functionality: {},
  screenshots: {},
  errors: [],
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  if (type === 'error') {
    testResults.errors.push(logMessage);
  }
}

function measureTime() {
  const start = Date.now();
  return {
    end: () => Date.now() - start,
    getElapsed: () => Date.now() - start
  };
}

async function takeScreenshot(page, name) {
  try {
    const screenshotPath = `user-flow-test-${name}-${Date.now()}.png`;
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      encoding: 'binary'
    });
    testResults.screenshots[name] = screenshotPath;
    log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log(`Failed to take screenshot ${name}: ${error.message}`, 'error');
    return null;
  }
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    return true;
  } catch (error) {
    log(`Element not found: ${selector} - ${error.message}`, 'error');
    return false;
  }
}

async function checkElementExists(page, selector) {
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch (error) {
    return false;
  }
}

// Test functions
async function testHomepageAccess(page) {
  log('Testing homepage access and rendering...');
  const timer = measureTime();
  
  try {
    // Navigate to homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    const loadTime = timer.end();
    
    testResults.performance.homepageLoad = loadTime;
    testResults.functionality.homepageAccessible = loadTime <= PERFORMANCE_THRESHOLDS.homepageLoad;
    
    log(`Homepage loaded in ${loadTime}ms`);
    
    // Check if homepage renders properly (not blank)
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.length > 100;
    
    testResults.functionality.homepageHasContent = hasContent;
    log(`Homepage content check: ${hasContent ? 'PASS' : 'FAIL'} (${bodyText.length} characters)`);
    
    // Check for Login/Register buttons for unauthenticated users
    const loginButtonExists = await checkElementExists(page, 'a[href="/login"], button:contains("Login")');
    const registerButtonExists = await checkElementExists(page, 'a[href="/register"], button:contains("Register")');
    
    testResults.functionality.loginButtonVisible = loginButtonExists;
    testResults.functionality.registerButtonVisible = registerButtonExists;
    
    log(`Login button visible: ${loginButtonExists ? 'YES' : 'NO'}`);
    log(`Register button visible: ${registerButtonExists ? 'YES' : 'NO'}`);
    
    await takeScreenshot(page, 'homepage');
    
    return {
      success: hasContent && (loginButtonExists || registerButtonExists),
      loadTime,
      hasContent,
      loginButtonExists,
      registerButtonExists
    };
    
  } catch (error) {
    log(`Homepage test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testLoginPageAccess(page) {
  log('Testing login page access...');
  const timer = measureTime();
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const loadTime = timer.end();
    
    testResults.performance.loginPageLoad = loadTime;
    testResults.functionality.loginPageAccessible = loadTime <= PERFORMANCE_THRESHOLDS.loginPageLoad;
    
    log(`Login page loaded in ${loadTime}ms`);
    
    // Check for login form elements
    const emailInput = await waitForElement(page, 'input[type="email"], input[name="email"]');
    const passwordInput = await waitForElement(page, 'input[type="password"], input[name="password"]');
    const submitButton = await waitForElement(page, 'button[type="submit"], button:contains("Login")');
    
    testResults.functionality.loginFormComplete = emailInput && passwordInput && submitButton;
    
    log(`Login form elements - Email: ${emailInput ? 'YES' : 'NO'}, Password: ${passwordInput ? 'YES' : 'NO'}, Submit: ${submitButton ? 'YES' : 'NO'}`);
    
    await takeScreenshot(page, 'login-page');
    
    return {
      success: emailInput && passwordInput && submitButton,
      loadTime,
      formElements: { emailInput, passwordInput, submitButton }
    };
    
  } catch (error) {
    log(`Login page test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testLoginProcess(page) {
  log('Testing login process with valid credentials...');
  const timer = measureTime();
  
  try {
    // Navigate to login page if not already there
    if (page.url() !== `${BASE_URL}/login`) {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    }
    
    // Fill in login form
    await page.type('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    await page.type('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    
    // Submit form
    await page.click('button[type="submit"], button:contains("Login")');
    
    // Wait for navigation or response
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    const authTime = timer.end();
    testResults.performance.authenticationProcess = authTime;
    testResults.functionality.loginSuccessful = authTime <= PERFORMANCE_THRESHOLDS.authenticationProcess;
    
    log(`Authentication completed in ${authTime}ms`);
    
    // Check if redirected to dashboard or logged in successfully
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/dashboard') || currentUrl !== `${BASE_URL}/login`;
    
    testResults.functionality.loginRedirectCorrect = isLoggedIn;
    
    log(`Login result: ${isLoggedIn ? 'SUCCESS' : 'FAILED'} (redirected to: ${currentUrl})`);
    
    await takeScreenshot(page, 'after-login');
    
    return {
      success: isLoggedIn,
      authTime,
      redirectedUrl: currentUrl
    };
    
  } catch (error) {
    log(`Login process test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testDashboardAccess(page) {
  log('Testing dashboard access with authenticated user...');
  const timer = measureTime();
  
  try {
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    }
    
    const loadTime = timer.end();
    testResults.performance.dashboardLoad = loadTime;
    testResults.functionality.dashboardAccessible = loadTime <= PERFORMANCE_THRESHOLDS.dashboardLoad;
    
    log(`Dashboard loaded in ${loadTime}ms`);
    
    // Check if dashboard content is loaded
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.length > 100;
    
    testResults.functionality.dashboardHasContent = hasContent;
    log(`Dashboard content check: ${hasContent ? 'PASS' : 'FAIL'} (${bodyText.length} characters)`);
    
    await takeScreenshot(page, 'dashboard');
    
    return {
      success: hasContent,
      loadTime,
      hasContent
    };
    
  } catch (error) {
    log(`Dashboard access test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testSidebarVisibility(page) {
  log('Testing sidebar visibility for authenticated users...');
  
  try {
    // Check for UnifiedSidebar component
    const sidebarSelectors = [
      '[data-testid="unified-sidebar"]',
      '.unified-sidebar',
      '[class*="sidebar"]',
      '[class*="Sidebar"]',
      'nav[class*="sidebar"]',
      'aside[class*="sidebar"]'
    ];
    
    let sidebarFound = false;
    let sidebarSelector = null;
    
    for (const selector of sidebarSelectors) {
      if (await checkElementExists(page, selector)) {
        sidebarFound = true;
        sidebarSelector = selector;
        break;
      }
    }
    
    testResults.functionality.sidebarVisible = sidebarFound;
    log(`Sidebar visibility: ${sidebarFound ? 'YES' : 'NO'} (${sidebarSelector || 'no selector matched'})`);
    
    // Check for navigation elements
    const navElements = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav, aside, [role="navigation"]');
      return Array.from(navs).map(nav => ({
        tagName: nav.tagName,
        className: nav.className,
        id: nav.id,
        textContent: nav.innerText.substring(0, 100)
      }));
    });
    
    testResults.functionality.navigationElements = navElements;
    log(`Found ${navElements.length} navigation elements`);
    
    await takeScreenshot(page, 'dashboard-with-sidebar');
    
    return {
      success: sidebarFound,
      sidebarFound,
      sidebarSelector,
      navElements
    };
    
  } catch (error) {
    log(`Sidebar visibility test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testAuthenticationState(page) {
  log('Testing authentication state persistence...');
  
  try {
    // Check localStorage and sessionStorage for auth tokens
    const authData = await page.evaluate(() => {
      return {
        localStorage: {
          auth: localStorage.getItem('auth'),
          token: localStorage.getItem('token'),
          user: localStorage.getItem('user')
        },
        sessionStorage: {
          auth: sessionStorage.getItem('auth'),
          token: sessionStorage.getItem('token'),
          user: sessionStorage.getItem('user')
        }
      };
    });
    
    testResults.functionality.authDataStored = authData;
    log(`Auth data in storage: ${JSON.stringify(authData)}`);
    
    // Check for authentication cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('auth') || 
      cookie.name.toLowerCase().includes('token') ||
      cookie.name.toLowerCase().includes('session')
    );
    
    testResults.functionality.authCookies = authCookies;
    log(`Found ${authCookies.length} authentication cookies`);
    
    // Check if user state is accessible in the page
    const userState = await page.evaluate(() => {
      // Try to access user state from common React contexts
      if (window.__USER_STATE__) return window.__USER_STATE__;
      if (window.user) return window.user;
      if (window.auth) return window.auth;
      return null;
    });
    
    testResults.functionality.userStateAccessible = userState !== null;
    log(`User state accessible: ${userState ? 'YES' : 'NO'}`);
    
    return {
      success: authData.localStorage.auth || authData.localStorage.token || authCookies.length > 0,
      authData,
      authCookies,
      userState
    };
    
  } catch (error) {
    log(`Authentication state test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testLogoutFunctionality(page) {
  log('Testing logout functionality...');
  const timer = measureTime();
  
  try {
    // Look for logout button/link
    const logoutSelectors = [
      'button:contains("Logout")',
      'button:contains("Log out")',
      'a:contains("Logout")',
      'a:contains("Log out")',
      '[data-testid="logout"]',
      '.logout-button',
      '[class*="logout"]'
    ];
    
    let logoutButtonFound = false;
    let logoutSelector = null;
    
    for (const selector of logoutSelectors) {
      if (await checkElementExists(page, selector)) {
        logoutButtonFound = true;
        logoutSelector = selector;
        break;
      }
    }
    
    if (!logoutButtonFound) {
      log('Logout button not found, trying manual navigation to logout');
      await page.goto(`${BASE_URL}/logout`, { waitUntil: 'networkidle2' });
    } else {
      log(`Found logout button: ${logoutSelector}`);
      await page.click(logoutSelector);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
    }
    
    const logoutTime = timer.end();
    
    // Check if redirected to homepage or login page
    const currentUrl = page.url();
    const isLoggedOut = currentUrl === BASE_URL || currentUrl.includes('/login') || currentUrl.includes('/register');
    
    testResults.functionality.logoutSuccessful = isLoggedOut;
    testResults.performance.logoutProcess = logoutTime;
    
    log(`Logout completed in ${logoutTime}ms - ${isLoggedOut ? 'SUCCESS' : 'FAILED'} (redirected to: ${currentUrl})`);
    
    await takeScreenshot(page, 'after-logout');
    
    return {
      success: isLoggedOut,
      logoutTime,
      redirectedUrl: currentUrl,
      logoutButtonFound
    };
    
  } catch (error) {
    log(`Logout functionality test failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function runCompleteUserFlowTest() {
  log('Starting complete user flow verification...');
  const overallTimer = measureTime();
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for visual debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Enable request interception for performance monitoring
    await page.setRequestInterception(true);
    const requests = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
      request.continue();
    });
    
    // Execute test sequence
    const results = {};
    
    // Test 1: Homepage Access
    results.homepage = await testHomepageAccess(page);
    testResults.summary.totalTests++;
    if (results.homepage.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 2: Login Page Access
    results.loginPage = await testLoginPageAccess(page);
    testResults.summary.totalTests++;
    if (results.loginPage.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 3: Login Process
    results.loginProcess = await testLoginProcess(page);
    testResults.summary.totalTests++;
    if (results.loginProcess.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 4: Dashboard Access
    results.dashboard = await testDashboardAccess(page);
    testResults.summary.totalTests++;
    if (results.dashboard.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 5: Sidebar Visibility
    results.sidebar = await testSidebarVisibility(page);
    testResults.summary.totalTests++;
    if (results.sidebar.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 6: Authentication State
    results.authState = await testAuthenticationState(page);
    testResults.summary.totalTests++;
    if (results.authState.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Test 7: Logout Functionality
    results.logout = await testLogoutFunctionality(page);
    testResults.summary.totalTests++;
    if (results.logout.success) testResults.summary.passedTests++;
    else testResults.summary.failedTests++;
    
    // Calculate total flow time
    const totalFlowTime = overallTimer.end();
    testResults.performance.totalFlowTime = totalFlowTime;
    testResults.functionality.totalFlowWithinThreshold = totalFlowTime <= PERFORMANCE_THRESHOLDS.totalFlowTime;
    
    log(`Total user flow completed in ${totalFlowTime}ms`);
    
    // Store detailed results
    testResults.detailedResults = results;
    testResults.requests = requests;
    
    return testResults;
    
  } catch (error) {
    log(`Complete user flow test failed: ${error.message}`, 'error');
    testResults.errors.push(`Overall test failure: ${error.message}`);
    return testResults;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Generate and save report
function generateReport(results) {
  const report = {
    ...results,
    summary: {
      ...results.summary,
      successRate: results.summary.totalTests > 0 ? (results.summary.passedTests / results.summary.totalTests * 100).toFixed(2) + '%' : '0%',
      status: results.summary.failedTests === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
    },
    performanceComparison: {
      homepage: {
        actual: results.performance.homepageLoad,
        threshold: PERFORMANCE_THRESHOLDS.homepageLoad,
        passed: results.performance.homepageLoad <= PERFORMANCE_THRESHOLDS.homepageLoad
      },
      loginPage: {
        actual: results.performance.loginPageLoad,
        threshold: PERFORMANCE_THRESHOLDS.loginPageLoad,
        passed: results.performance.loginPageLoad <= PERFORMANCE_THRESHOLDS.loginPageLoad
      },
      authentication: {
        actual: results.performance.authenticationProcess,
        threshold: PERFORMANCE_THRESHOLDS.authenticationProcess,
        passed: results.performance.authenticationProcess <= PERFORMANCE_THRESHOLDS.authenticationProcess
      },
      dashboard: {
        actual: results.performance.dashboardLoad,
        threshold: PERFORMANCE_THRESHOLDS.dashboardLoad,
        passed: results.performance.dashboardLoad <= PERFORMANCE_THRESHOLDS.dashboardLoad
      },
      totalFlow: {
        actual: results.performance.totalFlowTime,
        threshold: PERFORMANCE_THRESHOLDS.totalFlowTime,
        passed: results.performance.totalFlowTime <= PERFORMANCE_THRESHOLDS.totalFlowTime
      }
    }
  };
  
  // Save JSON report
  const jsonReportPath = `comprehensive-user-flow-test-report-${Date.now()}.json`;
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  
  // Save markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownReportPath = `comprehensive-user-flow-test-report-${Date.now()}.md`;
  fs.writeFileSync(markdownReportPath, markdownReport);
  
  log(`Reports saved: ${jsonReportPath}, ${markdownReportPath}`);
  
  return { jsonReportPath, markdownReportPath, report };
}

function generateMarkdownReport(results) {
  return `# Comprehensive User Flow Verification Report

Generated: ${results.timestamp}

## Executive Summary

**Status: ${results.summary.status}**
- Total Tests: ${results.summary.totalTests}
- Passed: ${results.summary.passedTests}
- Failed: ${results.summary.failedTests}
- Success Rate: ${results.summary.successRate}

## Performance Results

| Metric | Actual Time | Threshold | Status |
|--------|-------------|-----------|---------|
| Homepage Load | ${results.performance.homepageLoad}ms | ${PERFORMANCE_THRESHOLDS.homepageLoad}ms | ${results.performance.homepageLoad <= PERFORMANCE_THRESHOLDS.homepageLoad ? '✅ PASS' : '❌ FAIL'} |
| Login Page Load | ${results.performance.loginPageLoad}ms | ${PERFORMANCE_THRESHOLDS.loginPageLoad}ms | ${results.performance.loginPageLoad <= PERFORMANCE_THRESHOLDS.loginPageLoad ? '✅ PASS' : '❌ FAIL'} |
| Authentication Process | ${results.performance.authenticationProcess}ms | ${PERFORMANCE_THRESHOLDS.authenticationProcess}ms | ${results.performance.authenticationProcess <= PERFORMANCE_THRESHOLDS.authenticationProcess ? '✅ PASS' : '❌ FAIL'} |
| Dashboard Load | ${results.performance.dashboardLoad}ms | ${PERFORMANCE_THRESHOLDS.dashboardLoad}ms | ${results.performance.dashboardLoad <= PERFORMANCE_THRESHOLDS.dashboardLoad ? '✅ PASS' : '❌ FAIL'} |
| Total Flow Time | ${results.performance.totalFlowTime}ms | ${PERFORMANCE_THRESHOLDS.totalFlowTime}ms | ${results.performance.totalFlowTime <= PERFORMANCE_THRESHOLDS.totalFlowTime ? '✅ PASS' : '❌ FAIL'} |

## Functionality Test Results

### Homepage Access
- **Status**: ${results.functionality.homepageAccessible ? '✅ PASS' : '❌ FAIL'}
- **Content Rendered**: ${results.functionality.homepageHasContent ? '✅ YES' : '❌ NO'}
- **Login Button Visible**: ${results.functionality.loginButtonVisible ? '✅ YES' : '❌ NO'}
- **Register Button Visible**: ${results.functionality.registerButtonVisible ? '✅ YES' : '❌ NO'}

### Login Process
- **Status**: ${results.functionality.loginSuccessful ? '✅ PASS' : '❌ FAIL'}
- **Redirect Correct**: ${results.functionality.loginRedirectCorrect ? '✅ YES' : '❌ NO'}

### Dashboard Access
- **Status**: ${results.functionality.dashboardAccessible ? '✅ PASS' : '❌ FAIL'}
- **Content Rendered**: ${results.functionality.dashboardHasContent ? '✅ YES' : '❌ NO'}

### Sidebar Visibility
- **Status**: ${results.functionality.sidebarVisible ? '✅ PASS' : '❌ FAIL'}
- **Navigation Elements Found**: ${results.functionality.navigationElements ? results.functionality.navigationElements.length : 0}

### Authentication State
- **Auth Data Stored**: ${results.functionality.authDataStored ? '✅ YES' : '❌ NO'}
- **Auth Cookies Found**: ${results.functionality.authCookies ? results.functionality.authCookies.length : 0}
- **User State Accessible**: ${results.functionality.userStateAccessible ? '✅ YES' : '❌ NO'}

### Logout Functionality
- **Status**: ${results.functionality.logoutSuccessful ? '✅ PASS' : '❌ FAIL'}

## Screenshots Taken

${Object.entries(results.screenshots).map(([name, path]) => `- **${name}**: ${path}`).join('\n')}

## Errors Encountered

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors encountered.'}

## Test Credentials Used

- **Email**: ${TEST_CREDENTIALS.email}
- **Password**: [REDACTED]

## Recommendations

${results.summary.failedTests === 0 ? 
  '✅ All tests passed! The user flow is working correctly within performance expectations.' :
  '❌ Some tests failed. Please review the detailed results above and address the issues identified.'}

---
*Report generated by Comprehensive User Flow Verification Script*
`;
}

// Main execution
async function main() {
  try {
    log('Starting Comprehensive User Flow Verification...');
    
    const results = await runCompleteUserFlowTest();
    const reportPaths = generateReport(results);
    
    log('=== FINAL RESULTS ===');
    log(`Status: ${results.summary.status}`);
    log(`Success Rate: ${results.summary.successRate}`);
    log(`Total Flow Time: ${results.performance.totalFlowTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.totalFlowTime}ms)`);
    log(`Reports saved to: ${reportPaths.jsonReportPath} and ${reportPaths.markdownReportPath}`);
    
    // Exit with appropriate code
    process.exit(results.summary.failedTests === 0 ? 0 : 1);
    
  } catch (error) {
    log(`Script execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runCompleteUserFlowTest,
  generateReport,
  PERFORMANCE_THRESHOLDS,
  TEST_CREDENTIALS
};