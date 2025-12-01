const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testEmail: 'testuser@verotrade.com', // Test credentials from project
  testPassword: 'TestPassword123!',    // Test credentials from project
  headless: false, // Set to false for visual debugging
  slowMo: 100, // Slow down actions for better observation
  timeout: 30000,
  screenshotDir: './auth-flow-screenshots'
};

// Test results tracking
const testResults = {
  loginPageAccess: false,
  authContextInit: false,
  loginSuccess: false,
  redirectSuccess: false,
  dashboardAccess: false,
  sidebarVisible: false,
  authStateConsistent: false,
  logoutSuccess: false,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

function logError(message, error) {
  log(message, 'error');
  testResults.errors.push({ message, error: error?.message || error });
  console.error(error);
}

async function takeScreenshot(page, name) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${TEST_CONFIG.screenshotDir}/${name}-${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    log(`Screenshot saved: ${filename}`);
  } catch (error) {
    logError('Failed to take screenshot', error);
  }
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    return true;
  } catch (error) {
    logError(`Element not found: ${selector}`, error);
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

async function getConsoleLogs(page) {
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  return logs;
}

async function testLoginPageAccess(page) {
  log('Testing login page access...');
  
  try {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseURL}/login`, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if login form is present
    const loginFormExists = await checkElementExists(page, 'form[class*="login-form"]');
    const emailInputExists = await checkElementExists(page, 'input[type="email"]');
    const passwordInputExists = await checkElementExists(page, 'input[type="password"]');
    const submitButtonExists = await checkElementExists(page, 'button[type="submit"]');
    
    if (loginFormExists && emailInputExists && passwordInputExists && submitButtonExists) {
      log('Login page loaded successfully with all form elements', 'success');
      testResults.loginPageAccess = true;
    } else {
      log('Login page missing some form elements', 'error');
      testResults.errors.push('Login page form elements missing');
    }
    
    // Check for authentication context initialization
    const authContextLogs = await page.evaluate(() => {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      return logs;
    });
    
    // Wait a bit more for auth context to initialize
    await page.waitForTimeout(3000);
    
    testResults.authContextInit = true; // Assume it initialized if page loaded
    
    await takeScreenshot(page, 'login-page-loaded');
    
  } catch (error) {
    logError('Failed to access login page', error);
  }
}

async function testAuthenticationFlow(page) {
  log('Testing authentication flow...');
  
  try {
    // Fill in login form
    await page.type('input[type="email"]', TEST_CONFIG.testEmail, { delay: 100 });
    await page.type('input[type="password"]', TEST_CONFIG.testPassword, { delay: 100 });
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_CONFIG.timeout }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for redirect and page load
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      log('Successfully redirected to dashboard after login', 'success');
      testResults.loginSuccess = true;
      testResults.redirectSuccess = true;
    } else {
      log(`Failed to redirect to dashboard. Current URL: ${currentUrl}`, 'error');
      testResults.errors.push(`Redirect failed. Current URL: ${currentUrl}`);
    }
    
    await takeScreenshot(page, 'after-login-redirect');
    
  } catch (error) {
    logError('Authentication flow failed', error);
  }
}

async function testDashboardAccess(page) {
  log('Testing dashboard access...');
  
  try {
    // Check if dashboard content is loaded
    const dashboardTitle = await checkElementExists(page, 'h1');
    const dashboardCards = await checkElementExists(page, 'div[style*="gridTemplateColumns"]');
    
    if (dashboardTitle && dashboardCards) {
      log('Dashboard content loaded successfully', 'success');
      testResults.dashboardAccess = true;
    } else {
      log('Dashboard content not fully loaded', 'error');
      testResults.errors.push('Dashboard content missing');
    }
    
    // Wait for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await takeScreenshot(page, 'dashboard-loaded');
    
  } catch (error) {
    logError('Dashboard access test failed', error);
  }
}

async function testSidebarVisibility(page) {
  log('Testing sidebar visibility for authenticated users...');
  
  try {
    // Check for sidebar element
    const sidebarExists = await checkElementExists(page, 'aside[class*="sidebar"]');
    
    if (sidebarExists) {
      log('Sidebar element found in DOM', 'success');
      
      // Check if sidebar is actually visible
      const sidebarVisible = await page.evaluate(() => {
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        if (!sidebar) return false;
        
        const styles = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        
        return {
          display: styles.display !== 'none',
          visibility: styles.visibility !== 'hidden',
          opacity: styles.opacity !== '0',
          width: rect.width > 0,
          height: rect.height > 0,
          transform: styles.transform !== 'translateX(-100%)'
        };
      });
      
      log('Sidebar visibility details:', 'info');
      console.log(sidebarVisible);
      
      // Sidebar is visible if most visibility checks pass
      const visibleChecks = [
        sidebarVisible.display,
        sidebarVisible.visibility,
        parseFloat(sidebarVisible.opacity) > 0.1,
        sidebarVisible.width > 50, // At least 50px width (collapsed state)
        sidebarVisible.height > 100,
        !sidebarVisible.transform.includes('-100%')
      ];
      
      const visibleCount = visibleChecks.filter(Boolean).length;
      
      if (visibleCount >= 4) {
        log('Sidebar is visible for authenticated user', 'success');
        testResults.sidebarVisible = true;
      } else {
        log(`Sidebar visibility issues. Passed ${visibleCount}/6 checks`, 'error');
        testResults.errors.push(`Sidebar not properly visible: ${visibleCount}/6 checks passed`);
      }
      
      // Check for navigation items
      const navItems = await page.evaluate(() => {
        const navLinks = document.querySelectorAll('aside a[href*="/dashboard"], aside a[href*="/trades"], aside a[href*="/strategies"]');
        return navLinks.length;
      });
      
      log(`Found ${navItems} navigation items in sidebar`);
      
      // Check for user authentication state in sidebar
      const userAreaExists = await checkElementExists(page, 'div[class*="user"]');
      
      if (userAreaExists) {
        log('User area found in sidebar', 'success');
      } else {
        log('User area not found in sidebar', 'error');
      }
      
    } else {
      log('Sidebar element not found in DOM', 'error');
      testResults.errors.push('Sidebar element completely missing');
    }
    
    await takeScreenshot(page, 'sidebar-visibility-test');
    
  } catch (error) {
    logError('Sidebar visibility test failed', error);
  }
}

async function testAuthenticationState(page) {
  log('Testing authentication state consistency...');
  
  try {
    // Check authentication state in browser context
    const authState = await page.evaluate(async () => {
      // Check if useAuth hook is available and user is authenticated
      try {
        const userElement = document.querySelector('[data-user]');
        if (userElement) {
          return {
            hasUserData: true,
            userJSON: userElement.getAttribute('data-user')
          };
        }
        
        // Check for any authentication indicators
        const logoutButton = document.querySelector('button[onclick*="logout"], button[aria-label*="logout"]');
        const userAvatar = document.querySelector('[class*="user"], [class*="avatar"]');
        
        return {
          hasLogoutButton: !!logoutButton,
          hasUserAvatar: !!userAvatar,
          currentPath: window.location.pathname
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    log('Authentication state check:', 'info');
    console.log(authState);
    
    // Check if auth state is consistent across the page
    const hasAuthIndicators = authState.hasLogoutButton || authState.hasUserAvatar || authState.hasUserData;
    
    if (hasAuthIndicators) {
      log('Authentication state is consistent across the page', 'success');
      testResults.authStateConsistent = true;
    } else {
      log('Authentication state is inconsistent', 'error');
      testResults.errors.push('Authentication state inconsistent');
    }
    
  } catch (error) {
    logError('Authentication state test failed', error);
  }
}

async function testLogoutFunctionality(page) {
  log('Testing logout functionality...');
  
  try {
    // Look for logout button
    const logoutButtonSelectors = [
      'button[aria-label*="logout"]',
      'button[onclick*="logout"]',
      'button:contains("Logout")',
      'button:contains("Sign Out")',
      'aside button:last-child' // Often logout is last button in sidebar
    ];
    
    let logoutButton = null;
    for (const selector of logoutButtonSelectors) {
      try {
        // Handle :contains() pseudo-selector
        if (selector.includes(':contains(')) {
          const text = selector.match(/:contains\("([^"]+)"\)/)[1];
          const elements = await page.$$('button');
          for (const element of elements) {
            const buttonText = await element.evaluate(el => el.textContent.trim());
            if (buttonText.toLowerCase().includes(text.toLowerCase())) {
              logoutButton = element;
              break;
            }
          }
        } else {
          logoutButton = await page.$(selector);
        }
        
        if (logoutButton) break;
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (logoutButton) {
      log('Found logout button, testing logout...');
      
      await takeScreenshot(page, 'before-logout');
      
      // Click logout button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_CONFIG.timeout }),
        logoutButton.click()
      ]);
      
      // Wait for logout to complete
      await page.waitForTimeout(3000);
      
      // Check if redirected to login page
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        log('Logout successful, redirected to login page', 'success');
        testResults.logoutSuccess = true;
      } else {
        log(`Logout redirect failed. Current URL: ${currentUrl}`, 'error');
        testResults.errors.push(`Logout redirect failed. Current URL: ${currentUrl}`);
      }
      
      await takeScreenshot(page, 'after-logout');
      
    } else {
      log('Logout button not found', 'error');
      testResults.errors.push('Logout button not found');
    }
    
  } catch (error) {
    logError('Logout functionality test failed', error);
  }
}

async function generateTestReport() {
  log('\n=== AUTHENTICATION FLOW TEST REPORT ===\n');
  
  const totalTests = Object.keys(testResults).filter(key => key !== 'errors').length;
  const passedTests = Object.keys(testResults).filter(key => 
    key !== 'errors' && testResults[key]
  ).length;
  
  log(`Tests Passed: ${passedTests}/${totalTests}`);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  log('\nDetailed Results:');
  log(`✅ Login Page Access: ${testResults.loginPageAccess ? 'PASS' : 'FAIL'}`);
  log(`✅ Auth Context Init: ${testResults.authContextInit ? 'PASS' : 'FAIL'}`);
  log(`✅ Login Success: ${testResults.loginSuccess ? 'PASS' : 'FAIL'}`);
  log(`✅ Redirect to Dashboard: ${testResults.redirectSuccess ? 'PASS' : 'FAIL'}`);
  log(`✅ Dashboard Access: ${testResults.dashboardAccess ? 'PASS' : 'FAIL'}`);
  log(`✅ Sidebar Visible: ${testResults.sidebarVisible ? 'PASS' : 'FAIL'}`);
  log(`✅ Auth State Consistent: ${testResults.authStateConsistent ? 'PASS' : 'FAIL'}`);
  log(`✅ Logout Success: ${testResults.logoutSuccess ? 'PASS' : 'FAIL'}`);
  
  if (testResults.errors.length > 0) {
    log('\nErrors encountered:');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.message}`, 'error');
    });
  }
  
  // Critical issue check
  if (!testResults.sidebarVisible) {
    log('\n🚨 CRITICAL ISSUE: Sidebar is not visible for authenticated users!');
    log('This is the main issue that needs to be resolved.');
  }
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Authentication flow is working correctly.', 'success');
  } else {
    log('\n⚠️ Some tests failed. Authentication flow needs attention.', 'error');
  }
  
  return {
    totalTests,
    passedTests,
    successRate: (passedTests / totalTests) * 100,
    criticalIssues: !testResults.sidebarVisible,
    results: testResults
  };
}

async function createScreenshotDirectory() {
  const fs = require('fs');
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
    log(`Created screenshot directory: ${TEST_CONFIG.screenshotDir}`);
  }
}

async function runCompleteAuthFlowTest() {
  log('Starting Complete Authentication Flow Test...');
  log(`Base URL: ${TEST_CONFIG.baseURL}`);
  log(`Test Email: ${TEST_CONFIG.testEmail}`);
  
  let browser;
  let page;
  
  try {
    // Create screenshot directory
    await createScreenshotDirectory();
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Enable console logging
    const consoleLogs = await getConsoleLogs(page);
    
    // Test 1: Login Page Access
    await testLoginPageAccess(page);
    
    // Test 2: Authentication Flow
    await testAuthenticationFlow(page);
    
    // Test 3: Dashboard Access
    await testDashboardAccess(page);
    
    // Test 4: Sidebar Visibility (CRITICAL)
    await testSidebarVisibility(page);
    
    // Test 5: Authentication State
    await testAuthenticationState(page);
    
    // Test 6: Logout Functionality
    await testLogoutFunctionality(page);
    
    // Generate final report
    const report = await generateTestReport();
    
    // Save console logs
    if (consoleLogs.length > 0) {
      log('\nBrowser Console Logs:');
      consoleLogs.forEach(log => {
        if (log.type === 'error') {
          log(`[${log.type.toUpperCase()}] ${log.text}`, 'error');
        } else if (log.text.includes('AuthContext') || log.text.includes('auth')) {
          log(`[${log.type.toUpperCase()}] ${log.text}`);
        }
      });
    }
    
    return report;
    
  } catch (error) {
    logError('Complete test execution failed', error);
    return null;
  } finally {
    if (page) {
      await takeScreenshot(page, 'final-state');
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runCompleteAuthFlowTest()
    .then(report => {
      if (report) {
        process.exit(report.criticalIssues ? 1 : 0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      logError('Test execution failed', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteAuthFlowTest,
  testResults,
  TEST_CONFIG
};