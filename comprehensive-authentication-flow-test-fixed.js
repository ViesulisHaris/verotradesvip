const puppeteer = require('puppeteer');
const path = require('path');

/**
 * COMPREHENSIVE AUTHENTICATION FLOW TEST
 * Tests complete authentication flow from login to dashboard
 * including sidebar visibility and logout functionality
 */

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './authentication-flow-test-screenshots',
  testUser: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  // Alternative test credentials to try
  alternativeCredentials: [
    { email: 'admin@example.com', password: 'admin123' },
    { email: 'user@example.com', password: 'password123' },
    { email: 'demo@example.com', password: 'demo123' },
    { email: 'test@verotrades.com', password: 'test123' }
  ]
};

const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  screenshots: [],
  errors: [],
  finalStatus: 'FAILED'
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function recordTest(testName, status, details = '', screenshot = '') {
  const testResult = {
    name: testName,
    status: status, // PASS, FAIL, SKIP
    details: details,
    screenshot: screenshot,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(testResult);
  log(`TEST: ${testName} - ${status}${details ? ` - ${details}` : ''}`, status === 'PASS' ? 'INFO' : 'ERROR');
  
  if (screenshot) {
    testResults.screenshots.push(screenshot);
  }
}

async function takeScreenshot(page, testName, step) {
  const timestamp = Date.now();
  const filename = `${testName}-${step}-${timestamp}.png`;
  const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
  
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    log(`Screenshot saved: ${filepath}`);
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'ERROR');
    return '';
  }
}

async function waitForElement(page, selector, timeout = TEST_CONFIG.timeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    log(`Element not found: ${selector} - ${error.message}`, 'ERROR');
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

async function getAuthenticationState(page) {
  try {
    // Check for auth context state
    const authState = await page.evaluate(() => {
      // Look for user data in localStorage
      const userStr = localStorage.getItem('supabase.auth.token');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return {
            isAuthenticated: !!user,
            userId: user?.user?.id || null,
            email: user?.user?.email || null
          };
        } catch (e) {
          return { isAuthenticated: false, error: 'Failed to parse auth token' };
        }
      }
      
      // Check for any auth-related elements
      const userElements = document.querySelectorAll('[data-user-id], [data-user-email]');
      if (userElements.length > 0) {
        return {
          isAuthenticated: true,
          hasUserElements: true,
          elementCount: userElements.length
        };
      }
      
      return { isAuthenticated: false };
    });
    
    return authState;
  } catch (error) {
    log(`Failed to get authentication state: ${error.message}`, 'ERROR');
    return { isAuthenticated: false, error: error.message };
  }
}

async function testLoginPageAccess(page) {
  log('Testing login page access...');
  
  try {
    // Navigate to login page with longer timeout and different wait strategy
    log(`Navigating to ${TEST_CONFIG.baseUrl}/login`);
    await page.goto(`${TEST_CONFIG.baseUrl}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    
    // Wait a bit more for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of login page
    const screenshot = await takeScreenshot(page, 'login-page', 'initial-load');
    
    // Check if login page loaded successfully with more specific selectors
    const loginForm = await waitForElement(page, 'form', 15000);
    const emailInput = await waitForElement(page, 'input[type="email"], input#email', 15000);
    const passwordInput = await waitForElement(page, 'input[type="password"], input#password', 15000);
    const submitButton = await waitForElement(page, 'button[type="submit"]', 15000);
    
    // Check for any error messages
    const hasErrors = await checkElementExists(page, '.error-message, [data-testid="error"], .error, .alert-error');
    
    // Additional checks for login page content
    const hasBrandTitle = await checkElementExists(page, '.brand-title');
    const hasFormInputs = emailInput && passwordInput;
    
    log(`Login page elements - Form: ${loginForm}, Email: ${emailInput}, Password: ${passwordInput}, Submit: ${submitButton}, Errors: ${hasErrors}, Brand: ${hasBrandTitle}`);
    
    if (loginForm && hasFormInputs && submitButton && !hasErrors && hasBrandTitle) {
      recordTest('Login Page Access', 'PASS', 'Login page loaded successfully with all required elements', screenshot);
      return true;
    } else {
      const missingElements = [];
      if (!loginForm) missingElements.push('login form');
      if (!emailInput) missingElements.push('email input');
      if (!passwordInput) missingElements.push('password input');
      if (!submitButton) missingElements.push('submit button');
      if (!hasBrandTitle) missingElements.push('brand title');
      if (hasErrors) missingElements.push('error messages present');
      
      recordTest('Login Page Access', 'FAIL', `Missing elements: ${missingElements.join(', ')}`, screenshot);
      return false;
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, 'login-page', 'error');
    recordTest('Login Page Access', 'FAIL', `Exception: ${error.message}`, screenshot);
    return false;
  }
}

async function testAuthenticationProcess(page) {
  log('Testing authentication process...');
  
  try {
    // Fill in login form
    await page.type('input[type="email"], input#email, input[name="email"]', TEST_CONFIG.testUser.email);
    await page.type('input[type="password"], input#password, input[name="password"]', TEST_CONFIG.testUser.password);
    
    // Take screenshot of filled form
    const screenshot1 = await takeScreenshot(page, 'authentication', 'form-filled');
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_CONFIG.timeout }),
      page.click('button[type="submit"]')
    ]);
    
    // Take screenshot after login attempt
    const screenshot2 = await takeScreenshot(page, 'authentication', 'after-submit');
    
    // Check current URL
    const currentUrl = page.url();
    log(`Current URL after login: ${currentUrl}`);
    
    // Check if redirected to dashboard or still on login
    const isOnDashboard = currentUrl.includes('/dashboard');
    const isStillOnLogin = currentUrl.includes('/login');
    const hasError = await checkElementExists(page, '[data-testid="error"], .error, .alert-error');
    
    if (isOnDashboard && !hasError) {
      recordTest('Authentication Process', 'PASS', 'Successfully authenticated and redirected to dashboard', screenshot2);
      return true;
    } else if (isStillOnLogin || hasError) {
      // Try to get error message
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('[data-testid="error"], .error, .alert-error');
        return errorElement ? errorElement.textContent.trim() : 'No error message found';
      });
      
      recordTest('Authentication Process', 'FAIL', `Authentication failed - ${errorMessage}`, screenshot2);
      return false;
    } else {
      recordTest('Authentication Process', 'FAIL', `Unexpected redirect to: ${currentUrl}`, screenshot2);
      return false;
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, 'authentication', 'error');
    recordTest('Authentication Process', 'FAIL', `Exception: ${error.message}`, screenshot);
    return false;
  }
}

async function testDashboardAccess(page) {
  log('Testing dashboard access...');
  
  try {
    // Ensure we're on dashboard
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    }
    
    // Take screenshot of dashboard
    const screenshot = await takeScreenshot(page, 'dashboard', 'initial-load');
    
    // Check for dashboard elements
    const dashboardContent = await waitForElement(page, '[data-testid="dashboard"], main, .dashboard');
    const hasHeaders = await checkElementExists(page, 'h1, h2, .dashboard-title');
    const hasError = await checkElementExists(page, '[data-testid="error"], .error, .alert-error');
    
    if (dashboardContent && hasHeaders && !hasError) {
      recordTest('Dashboard Access', 'PASS', 'Dashboard loaded successfully with content', screenshot);
      return true;
    } else {
      const issues = [];
      if (!dashboardContent) issues.push('no dashboard content');
      if (!hasHeaders) issues.push('no headers found');
      if (hasError) issues.push('error messages present');
      
      recordTest('Dashboard Access', 'FAIL', `Dashboard issues: ${issues.join(', ')}`, screenshot);
      return false;
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, 'dashboard', 'error');
    recordTest('Dashboard Access', 'FAIL', `Exception: ${error.message}`, screenshot);
    return false;
  }
}

async function testSidebarVisibility(page) {
  log('Testing sidebar visibility for authenticated users...');
  
  try {
    // Take screenshot of current state
    const screenshot1 = await takeScreenshot(page, 'sidebar', 'initial-state');
    
    // Check for UnifiedSidebar component
    const sidebarSelectors = [
      '[data-testid="unified-sidebar"]',
      '.unified-sidebar',
      '[data-testid="sidebar"]',
      '.sidebar',
      'nav[data-testid="navigation"]',
      'nav.sidebar',
      'aside[data-testid="sidebar"]',
      'aside.sidebar'
    ];
    
    let sidebarFound = false;
    let sidebarSelector = '';
    
    for (const selector of sidebarSelectors) {
      if (await checkElementExists(page, selector)) {
        sidebarFound = true;
        sidebarSelector = selector;
        break;
      }
    }
    
    // Check for sidebar-specific elements
    const hasNavigation = await checkElementExists(page, 'nav, [role="navigation"]');
    const hasMenuItems = await checkElementExists(page, 'nav a, [role="navigation"] a, .menu-item, .nav-item');
    const hasUserMenu = await checkElementExists(page, '[data-testid="user-menu"], .user-menu, .user-profile');
    
    // Check if sidebar is visible (not just present in DOM)
    const sidebarVisible = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             element.offsetWidth > 0 && 
             element.offsetHeight > 0;
    }, sidebarSelector);
    
    // Take screenshot after checks
    const screenshot2 = await takeScreenshot(page, 'sidebar', 'after-checks');
    
    if (sidebarFound && sidebarVisible && (hasNavigation || hasMenuItems)) {
      recordTest('Sidebar Visibility', 'PASS', `Sidebar is visible and functional (found with: ${sidebarSelector})`, screenshot2);
      return true;
    } else {
      const issues = [];
      if (!sidebarFound) issues.push('sidebar element not found');
      if (!sidebarVisible) issues.push('sidebar element found but not visible');
      if (!hasNavigation && !hasMenuItems) issues.push('no navigation menu items found');
      
      recordTest('Sidebar Visibility', 'FAIL', `Sidebar issues: ${issues.join(', ')}`, screenshot2);
      return false;
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, 'sidebar', 'error');
    recordTest('Sidebar Visibility', 'FAIL', `Exception: ${error.message}`, screenshot);
    return false;
  }
}

async function testAuthenticationState(page) {
  log('Testing authentication state throughout the flow...');
  
  try {
    // Get current authentication state
    const authState = await getAuthenticationState(page);
    
    // Take screenshot of auth state
    const screenshot = await takeScreenshot(page, 'auth-state', 'current-state');
    
    // Check for user information in the UI
    const userInfo = await page.evaluate(() => {
      const userElements = document.querySelectorAll('[data-user-email], [data-user-id], .user-email, .user-name');
      const info = [];
      userElements.forEach(el => {
        if (el.textContent && el.textContent.trim()) {
          info.push(el.textContent.trim());
        }
      });
      return info;
    });
    
    if (authState.isAuthenticated && (authState.userId || authState.email || userInfo.length > 0)) {
      recordTest('Authentication State', 'PASS', `User is authenticated - ${JSON.stringify(authState)}`, screenshot);
      return true;
    } else {
      recordTest('Authentication State', 'FAIL', `Authentication state invalid - ${JSON.stringify(authState)}`, screenshot);
      return false;
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, 'auth-state', 'error');
    recordTest('Authentication State', 'FAIL', `Exception: ${error.message}`, screenshot);
    return false;
  }
}

async function testLogoutFunctionality(page) {
  log('Testing logout functionality...');
  
  try {
    // Look for logout button/link
    const logoutSelectors = [
      'button[data-testid="logout"]',
      'a[data-testid="logout"]',
      'button:contains("Logout")',
      'a:contains("Logout")',
      'button:contains("Sign out")',
      'a:contains("Sign out")',
      '.logout-button',
      '.sign-out-button'
    ];
    
    let logoutElement = null;
    let logoutSelector = '';
    
    for (const selector of logoutSelectors) {
      try {
        // For text-based selectors, we need a different approach
        if (selector.includes(':contains(')) {
          const text = selector.match(/:contains\("(.+)"\)/)[1];
          const elements = await page.$x(`//*[contains(text(), '${text}')]`);
          if (elements.length > 0) {
            logoutElement = elements[0];
            logoutSelector = selector;
            break;
          }
        } else {
          logoutElement = await page.$(selector);
          if (logoutElement) {
            logoutSelector = selector;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Take screenshot before logout
    const screenshot1 = await takeScreenshot(page, 'logout', 'before-logout');
    
    if (logoutElement) {
      // Click logout button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_CONFIG.timeout }),
        logoutElement.click()
      ]);
      
      // Take screenshot after logout
      const screenshot2 = await takeScreenshot(page, 'logout', 'after-logout');
      
      // Check if redirected to login page
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/login') || currentUrl === TEST_CONFIG.baseUrl + '/';
      
      // Check authentication state after logout
      const authState = await getAuthenticationState(page);
      
      if (isOnLoginPage && !authState.isAuthenticated) {
        recordTest('Logout Functionality', 'PASS', 'Successfully logged out and redirected to login page', screenshot2);
        return true;
      } else {
        recordTest('Logout Functionality', 'FAIL', `Logout failed - URL: ${currentUrl}, Auth state: ${JSON.stringify(authState)}`, screenshot2);
        return false;
      }
    } else {
      recordTest('Logout Functionality', 'FAIL', 'Logout button/link not found', screenshot1);
      return false;
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, 'logout', 'error');
    recordTest('Logout Functionality', 'FAIL', `Exception: ${error.message}`, screenshot);
    return false;
  }
}

async function generateTestReport() {
  const endTime = new Date().toISOString();
  const duration = new Date(endTime) - new Date(testResults.startTime);
  
  const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
  const failedTests = testResults.tests.filter(t => t.status === 'FAIL').length;
  const totalTests = testResults.tests.length;
  
  testResults.endTime = endTime;
  testResults.duration = duration;
  testResults.summary = {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) + '%' : '0%'
  };
  testResults.finalStatus = failedTests === 0 ? 'PASSED' : 'FAILED';
  
  // Save detailed report
  const reportPath = './comprehensive-authentication-flow-test-report.json';
  require('fs').writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport();
  const markdownPath = './comprehensive-authentication-flow-test-report.md';
  require('fs').writeFileSync(markdownPath, markdownReport);
  
  log(`Test report saved to: ${reportPath}`);
  log(`Markdown report saved to: ${markdownPath}`);
  
  return testResults;
}

function generateMarkdownReport() {
  const { startTime, endTime, duration, summary, tests, screenshots, finalStatus } = testResults;
  
  let markdown = `# COMPREHENSIVE AUTHENTICATION FLOW TEST REPORT\n\n`;
  markdown += `**Test Duration:** ${new Date(duration).toISOString().substr(11, 8)}\n`;
  markdown += `**Start Time:** ${startTime}\n`;
  markdown += `**End Time:** ${endTime}\n`;
  markdown += `**Final Status:** ${finalStatus}\n\n`;
  
  markdown += `## Test Summary\n\n`;
  markdown += `- **Total Tests:** ${summary.total}\n`;
  markdown += `- **Passed:** ${summary.passed}\n`;
  markdown += `- **Failed:** ${summary.failed}\n`;
  markdown += `- **Success Rate:** ${summary.successRate}\n\n`;
  
  markdown += `## Test Results\n\n`;
  
  tests.forEach((test, index) => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    markdown += `### ${index + 1}. ${test.name} ${status}\n\n`;
    markdown += `- **Status:** ${test.status}\n`;
    markdown += `- **Details:** ${test.details}\n`;
    markdown += `- **Timestamp:** ${test.timestamp}\n`;
    if (test.screenshot) {
      markdown += `- **Screenshot:** ${test.screenshot}\n`;
    }
    markdown += `\n`;
  });
  
  if (screenshots.length > 0) {
    markdown += `## Screenshots\n\n`;
    screenshots.forEach(screenshot => {
      markdown += `- ${screenshot}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
}

async function runComprehensiveAuthenticationTest() {
  log('Starting comprehensive authentication flow test...');
  
  // Create screenshot directory
  const fs = require('fs');
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set timeout
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Run tests in sequence
    const testResults = [];
    
    testResults.push(await testLoginPageAccess(page));
    testResults.push(await testAuthenticationProcess(page));
    testResults.push(await testDashboardAccess(page));
    testResults.push(await testSidebarVisibility(page));
    testResults.push(await testAuthenticationState(page));
    testResults.push(await testLogoutFunctionality(page));
    
    // Generate final report
    const report = await generateTestReport();
    
    log(`Test completed. Final status: ${report.finalStatus}`);
    log(`Summary: ${report.summary.passed}/${report.summary.total} tests passed`);
    
    return report;
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'ERROR');
    testResults.errors.push(error.message);
    return await generateTestReport();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveAuthenticationTest()
    .then(report => {
      console.log('\n=== TEST COMPLETED ===');
      console.log(`Final Status: ${report.finalStatus}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log(`Detailed report saved to: comprehensive-authentication-flow-test-report.json`);
      process.exit(report.finalStatus === 'PASSED' ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveAuthenticationTest,
  testLoginPageAccess,
  testAuthenticationProcess,
  testDashboardAccess,
  testSidebarVisibility,
  testAuthenticationState,
  testLogoutFunctionality
};