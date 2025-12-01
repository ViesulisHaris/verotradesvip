const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  homepageLoad: 2000,      // 2 seconds
  loginPageLoad: 2000,     // 2 seconds
  authentication: 3000,     // 3 seconds
  dashboardLoad: 4000,      // 4 seconds
  totalFlowTime: 10000     // 10 seconds
};

// Test results
let testResults = {
  startTime: null,
  endTime: null,
  totalFlowTime: null,
  steps: {},
  performance: {},
  screenshots: {},
  errors: [],
  success: false
};

// Utility functions
function timestamp() {
  return new Date().toISOString();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
  try {
    const screenshotPath = `final-user-flow-${name}-${Date.now()}.png`;
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      type: 'png'
    });
    testResults.screenshots[name] = {
      path: screenshotPath,
      description: description,
      timestamp: timestamp()
    };
    console.log(`📸 Screenshot saved: ${screenshotPath} - ${description}`);
    return screenshotPath;
  } catch (error) {
    console.error(`❌ Failed to take screenshot ${name}:`, error.message);
    return null;
  }
}

async function measurePageLoad(page, stepName) {
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
    };
  });

  testResults.performance[stepName] = {
    ...performanceMetrics,
    timestamp: timestamp()
  };

  return performanceMetrics;
}

async function checkForGraySpace(page, stepName) {
  const graySpaceCheck = await page.evaluate(() => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const backgroundColor = computedStyle.backgroundColor;
    
    // Check if body is gray or white without content
    const hasContent = body.innerText.trim().length > 0;
    const hasElements = body.children.length > 0;
    const isGray = backgroundColor.includes('128, 128, 128') || 
                   backgroundColor.includes('169, 169, 169') || 
                   backgroundColor.includes('192, 192, 192') ||
                   backgroundColor.includes('rgb(128') ||
                   backgroundColor.includes('rgb(169') ||
                   backgroundColor.includes('rgb(192');
    
    return {
      hasContent,
      hasElements,
      backgroundColor,
      isGray,
      innerTextLength: body.innerText.trim().length,
      elementCount: body.children.length
    };
  });

  testResults.steps[stepName].graySpaceCheck = graySpaceCheck;
  
  if (graySpaceCheck.isGray && !graySpaceCheck.hasContent) {
    testResults.errors.push(`Gray space detected on ${stepName}: ${JSON.stringify(graySpaceCheck)}`);
    return false;
  }
  
  return true;
}

async function testHomepage(page) {
  console.log('\n🏠 Testing Homepage Access...');
  const startTime = Date.now();
  
  try {
    testResults.steps.homepage = {
      startTime: timestamp(),
      status: 'running',
      details: {}
    };

    // Navigate to homepage
    await page.goto(BASE_URL, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    testResults.steps.homepage.loadTime = loadTime;
    
    // Wait for content to load
    await delay(2000);
    
    // Take screenshot
    await takeScreenshot(page, 'homepage', 'Homepage after load');
    
    // Measure performance
    const performanceMetrics = await measurePageLoad(page, 'homepage');
    
    // Check for gray space
    const hasContent = await checkForGraySpace(page, 'homepage');
    
    // Check for specific homepage elements
    const homepageCheck = await page.evaluate(() => {
      // Look for buttons with text content "Login" and "Register"
      const allButtons = Array.from(document.querySelectorAll('button'));
      const loginButton = allButtons.find(btn =>
        btn.textContent?.trim().toLowerCase() === 'login' ||
        btn.onclick?.toString().includes('login')
      );
      const registerButton = allButtons.find(btn =>
        btn.textContent?.trim().toLowerCase() === 'register' ||
        btn.onclick?.toString().includes('register')
      );
      
      // Also check for anchor tags as fallback
      const loginAnchor = document.querySelector('a[href*="login"]');
      const registerAnchor = document.querySelector('a[href*="register"]');
      
      const hasNavigation = document.querySelector('nav') || document.querySelector('header');
      const hasMainContent = document.querySelector('main') || document.querySelector('.container');
      const hasVeroTradeLogo = document.querySelector('h1')?.textContent?.includes('VeroTrade');
      
      return {
        hasLoginButton: !!(loginButton || loginAnchor),
        hasRegisterButton: !!(registerButton || registerAnchor),
        hasNavigation: !!hasNavigation,
        hasMainContent: !!hasMainContent,
        hasVeroTradeLogo: !!hasVeroTradeLogo,
        pageTitle: document.title,
        url: window.location.href,
        totalButtons: allButtons.length,
        buttonTexts: allButtons.map(btn => btn.textContent?.trim()).filter(Boolean)
      };
    });
    
    testResults.steps.homepage.contentCheck = homepageCheck;
    
    // Validate homepage
    const homepageSuccess = hasContent && 
                           homepageCheck.hasLoginButton && 
                           homepageCheck.hasRegisterButton &&
                           loadTime < PERFORMANCE_THRESHOLDS.homepageLoad;
    
    testResults.steps.homepage.status = homepageSuccess ? 'success' : 'failed';
    testResults.steps.homepage.endTime = timestamp();
    
    if (!homepageSuccess) {
      testResults.errors.push(`Homepage test failed: ${JSON.stringify(homepageCheck)}`);
    }
    
    console.log(`✅ Homepage test completed in ${loadTime}ms`);
    console.log(`   Content visible: ${hasContent}`);
    console.log(`   Login button: ${homepageCheck.hasLoginButton}`);
    console.log(`   Register button: ${homepageCheck.hasRegisterButton}`);
    
    return homepageSuccess;
    
  } catch (error) {
    testResults.steps.homepage.status = 'error';
    testResults.steps.homepage.error = error.message;
    testResults.errors.push(`Homepage error: ${error.message}`);
    console.error(`❌ Homepage test failed:`, error.message);
    return false;
  }
}

async function testLoginPage(page) {
  console.log('\n🔐 Testing Login Page...');
  const startTime = Date.now();
  
  try {
    testResults.steps.loginPage = {
      startTime: timestamp(),
      status: 'running',
      details: {}
    };

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    testResults.steps.loginPage.loadTime = loadTime;
    
    // Wait for form to load
    await delay(2000);
    
    // Take screenshot
    await takeScreenshot(page, 'login-page', 'Login page with form');
    
    // Measure performance
    const performanceMetrics = await measurePageLoad(page, 'loginPage');
    
    // Check for gray space
    const hasContent = await checkForGraySpace(page, 'loginPage');
    
    // Check for login form elements
    const loginFormCheck = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]') || 
                        document.querySelector('input[name="email"]') ||
                        document.querySelector('input[placeholder*="email" i]');
      const passwordInput = document.querySelector('input[type="password"]') || 
                          document.querySelector('input[name="password"]') ||
                          document.querySelector('input[placeholder*="password" i]');
      const submitButton = document.querySelector('button[type="submit"]') || 
                          document.querySelector('input[type="submit"]') ||
                          document.querySelector('button');
      const hasForm = document.querySelector('form');
      
      return {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton,
        hasForm: !!hasForm,
        pageTitle: document.title,
        url: window.location.href
      };
    });
    
    testResults.steps.loginPage.contentCheck = loginFormCheck;
    
    // Validate login page
    const loginPageSuccess = hasContent && 
                            loginFormCheck.hasEmailInput && 
                            loginFormCheck.hasPasswordInput &&
                            loginFormCheck.hasSubmitButton &&
                            loadTime < PERFORMANCE_THRESHOLDS.loginPageLoad;
    
    testResults.steps.loginPage.status = loginPageSuccess ? 'success' : 'failed';
    testResults.steps.loginPage.endTime = timestamp();
    
    if (!loginPageSuccess) {
      testResults.errors.push(`Login page test failed: ${JSON.stringify(loginFormCheck)}`);
    }
    
    console.log(`✅ Login page test completed in ${loadTime}ms`);
    console.log(`   Content visible: ${hasContent}`);
    console.log(`   Email input: ${loginFormCheck.hasEmailInput}`);
    console.log(`   Password input: ${loginFormCheck.hasPasswordInput}`);
    console.log(`   Submit button: ${loginFormCheck.hasSubmitButton}`);
    
    return loginPageSuccess;
    
  } catch (error) {
    testResults.steps.loginPage.status = 'error';
    testResults.steps.loginPage.error = error.message;
    testResults.errors.push(`Login page error: ${error.message}`);
    console.error(`❌ Login page test failed:`, error.message);
    return false;
  }
}

async function testLoginProcess(page) {
  console.log('\n🔑 Testing Login Process...');
  const startTime = Date.now();
  
  try {
    testResults.steps.loginProcess = {
      startTime: timestamp(),
      status: 'running',
      details: {}
    };

    // Navigate to login page if not already there
    if (!page.url().includes('/login')) {
      await page.goto(`${BASE_URL}/login`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      await delay(1000);
    }
    
    // Fill in login form
    await page.type('input[type="email"], input[name="email"], input[placeholder*="email" i]',
                   TEST_CREDENTIALS.email, { delay: 100 });
    await page.type('input[type="password"], input[name="password"], input[placeholder*="password" i]',
                   TEST_CREDENTIALS.password, { delay: 100 });
    
    // Check if inputs are filled correctly
    const emailValue = await page.$eval('input[type="email"], input[name="email"], input[placeholder*="email" i]', el => el.value);
    const passwordValue = await page.$eval('input[type="password"], input[name="password"], input[placeholder*="password" i]', el => el.value);
    console.log('🔍 Form values:', { email: emailValue, passwordLength: passwordValue?.length || 0 });
    
    // Take screenshot before submitting
    await takeScreenshot(page, 'login-form-filled', 'Login form filled with credentials');
    
    // Submit form
    const submitButton = await page.$('button[type="submit"], input[type="submit"], button');
    if (submitButton) {
      await submitButton.click();
    } else {
      throw new Error('Submit button not found');
    }
    
    // Wait for authentication
    await delay(3000);
    
    const authTime = Date.now() - startTime;
    testResults.steps.loginProcess.authenticationTime = authTime;
    
    // Check if redirected to dashboard or logged in
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/dashboard') || 
                      !currentUrl.includes('/login');
    
    // Take screenshot after login attempt
    await takeScreenshot(page, 'login-attempt-result', 'Result after login attempt');
    
    // Check authentication state
    const authCheck = await page.evaluate(() => {
      // Check for dashboard elements
      const hasDashboard = document.querySelector('[data-testid="dashboard"]') ||
                          document.querySelector('.dashboard') ||
                          document.querySelector('main');
      
      // Check for sidebar
      const hasSidebar = document.querySelector('[data-testid="sidebar"]') ||
                        document.querySelector('.sidebar') ||
                        document.querySelector('nav');
      
      // Check for user menu or logout button
      const hasUserMenu = document.querySelector('[data-testid="user-menu"]') ||
                         document.querySelector('.user-menu') ||
                         document.querySelector('button[aria-label*="logout" i]') ||
                         document.querySelector('a[href*="logout"]');
      
      return {
        currentUrl: window.location.href,
        hasDashboard: !!hasDashboard,
        hasSidebar: !!hasSidebar,
        hasUserMenu: !!hasUserMenu,
        pageTitle: document.title,
        localStorage: {
          hasAuthData: !!localStorage.getItem('auth') || !!localStorage.getItem('token') || !!localStorage.getItem('user')
        }
      };
    });
    
    testResults.steps.loginProcess.authCheck = authCheck;
    
    // Validate login process
    const loginSuccess = isLoggedIn && 
                        (authCheck.hasDashboard || authCheck.hasSidebar) &&
                        authTime < PERFORMANCE_THRESHOLDS.authentication;
    
    testResults.steps.loginProcess.status = loginSuccess ? 'success' : 'failed';
    testResults.steps.loginProcess.endTime = timestamp();
    
    if (!loginSuccess) {
      testResults.errors.push(`Login process failed: ${JSON.stringify(authCheck)}`);
    }
    
    console.log(`✅ Login process test completed in ${authTime}ms`);
    console.log(`   Logged in: ${isLoggedIn}`);
    console.log(`   Current URL: ${currentUrl}`);
    console.log(`   Has dashboard: ${authCheck.hasDashboard}`);
    console.log(`   Has sidebar: ${authCheck.hasSidebar}`);
    
    return loginSuccess;
    
  } catch (error) {
    testResults.steps.loginProcess.status = 'error';
    testResults.steps.loginProcess.error = error.message;
    testResults.errors.push(`Login process error: ${error.message}`);
    console.error(`❌ Login process test failed:`, error.message);
    return false;
  }
}

async function testDashboard(page) {
  console.log('\n📊 Testing Dashboard Access...');
  const startTime = Date.now();
  
  try {
    testResults.steps.dashboard = {
      startTime: timestamp(),
      status: 'running',
      details: {}
    };

    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
    }
    
    // Wait for dashboard to load
    await delay(3000);
    
    const loadTime = Date.now() - startTime;
    testResults.steps.dashboard.loadTime = loadTime;
    
    // Take screenshot
    await takeScreenshot(page, 'dashboard', 'Dashboard with sidebar');
    
    // Measure performance
    const performanceMetrics = await measurePageLoad(page, 'dashboard');
    
    // Check for gray space
    const hasContent = await checkForGraySpace(page, 'dashboard');
    
    // Check for dashboard elements
    const dashboardCheck = await page.evaluate(() => {
      // Check for sidebar
      const sidebar = document.querySelector('[data-testid="sidebar"]') ||
                     document.querySelector('.sidebar') ||
                     document.querySelector('nav') ||
                     document.querySelector('[data-testid="unified-sidebar"]');
      
      // Check for main content area
      const mainContent = document.querySelector('main') ||
                         document.querySelector('.main-content') ||
                         document.querySelector('.content');
      
      // Check for dashboard-specific elements
      const dashboardElement = document.querySelector('[data-testid="dashboard"]') ||
                             document.querySelector('.dashboard');
      
      // Check for user info or menu
      const userInfo = document.querySelector('[data-testid="user-info"]') ||
                      document.querySelector('.user-info') ||
                      document.querySelector('.user-menu');
      
      // Get sidebar details
      const sidebarDetails = sidebar ? {
        visible: sidebar.offsetParent !== null,
        hasNavigation: !!sidebar.querySelector('ul, nav, a'),
        hasLinks: !!sidebar.querySelector('a'),
        textContent: sidebar.innerText.trim().length
      } : null;
      
      return {
        hasSidebar: !!sidebar,
        hasMainContent: !!mainContent,
        hasDashboardElement: !!dashboardElement,
        hasUserInfo: !!userInfo,
        sidebarDetails,
        pageTitle: document.title,
        url: window.location.href,
        bodyTextLength: document.body.innerText.trim().length
      };
    });
    
    testResults.steps.dashboard.contentCheck = dashboardCheck;
    
    // Validate dashboard
    const dashboardSuccess = hasContent && 
                            dashboardCheck.hasSidebar && 
                            dashboardCheck.hasMainContent &&
                            dashboardCheck.sidebarDetails?.visible &&
                            loadTime < PERFORMANCE_THRESHOLDS.dashboardLoad;
    
    testResults.steps.dashboard.status = dashboardSuccess ? 'success' : 'failed';
    testResults.steps.dashboard.endTime = timestamp();
    
    if (!dashboardSuccess) {
      testResults.errors.push(`Dashboard test failed: ${JSON.stringify(dashboardCheck)}`);
    }
    
    console.log(`✅ Dashboard test completed in ${loadTime}ms`);
    console.log(`   Content visible: ${hasContent}`);
    console.log(`   Has sidebar: ${dashboardCheck.hasSidebar}`);
    console.log(`   Sidebar visible: ${dashboardCheck.sidebarDetails?.visible}`);
    console.log(`   Has main content: ${dashboardCheck.hasMainContent}`);
    
    return dashboardSuccess;
    
  } catch (error) {
    testResults.steps.dashboard.status = 'error';
    testResults.steps.dashboard.error = error.message;
    testResults.errors.push(`Dashboard error: ${error.message}`);
    console.error(`❌ Dashboard test failed:`, error.message);
    return false;
  }
}

async function testLogout(page) {
  console.log('\n🚪 Testing Logout Functionality...');
  const startTime = Date.now();
  
  try {
    testResults.steps.logout = {
      startTime: timestamp(),
      status: 'running',
      details: {}
    };

    // Look for logout button/link
    const logoutSelectors = [
      'button[aria-label*="logout" i]',
      'a[href*="logout"]',
      'button[data-testid="logout"]',
      '.logout-button',
      '[data-testid="user-menu"] button', // User menu that might contain logout
      '.user-menu button'
    ];
    
    let logoutElement = null;
    for (const selector of logoutSelectors) {
      try {
        logoutElement = await page.$(selector);
        if (logoutElement) {
          console.log(`Found logout element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    // If user menu found, click it first to reveal logout option
    if (logoutElement && logoutElement.toString().includes('user-menu')) {
      await logoutElement.click();
      await delay(1000);
      
      // Look for logout option in opened menu
      logoutElement = await page.$('a[href*="logout"], button[data-testid="logout"], .logout-option');
    }
    
    if (!logoutElement) {
      throw new Error('Logout button not found');
    }
    
    // Take screenshot before logout
    await takeScreenshot(page, 'before-logout', 'Dashboard before logout');
    
    // Click logout
    await logoutElement.click();
    
    // Wait for logout to complete
    await delay(3000);
    
    const logoutTime = Date.now() - startTime;
    testResults.steps.logout.logoutTime = logoutTime;
    
    // Take screenshot after logout
    await takeScreenshot(page, 'after-logout', 'Page after logout');
    
    // Check logout result
    const logoutCheck = await page.evaluate(() => {
      const currentUrl = window.location.href;
      const isOnHomepage = currentUrl === 'http://localhost:3000/' || 
                          currentUrl === 'http://localhost:3000' ||
                          !currentUrl.includes('/dashboard');
      
      // Check for login/register buttons (should be visible after logout)
      const hasLoginButton = document.querySelector('a[href="/login"]') || 
                            document.querySelector('button[href="/login"]') ||
                            document.querySelector('a[href*="login"]');
      
      const hasRegisterButton = document.querySelector('a[href="/register"]') || 
                               document.querySelector('button[href="/register"]') ||
                               document.querySelector('a[href*="register"]');
      
      // Check localStorage is cleared
      const hasAuthData = !!localStorage.getItem('auth') || 
                         !!localStorage.getItem('token') || 
                         !!localStorage.getItem('user');
      
      return {
        currentUrl,
        isOnHomepage,
        hasLoginButton,
        hasRegisterButton,
        hasAuthData,
        pageTitle: document.title
      };
    });
    
    testResults.steps.logout.logoutCheck = logoutCheck;
    
    // Validate logout
    const logoutSuccess = logoutCheck.isOnHomepage && 
                         logoutCheck.hasLoginButton && 
                         !logoutCheck.hasAuthData;
    
    testResults.steps.logout.status = logoutSuccess ? 'success' : 'failed';
    testResults.steps.logout.endTime = timestamp();
    
    if (!logoutSuccess) {
      testResults.errors.push(`Logout test failed: ${JSON.stringify(logoutCheck)}`);
    }
    
    console.log(`✅ Logout test completed in ${logoutTime}ms`);
    console.log(`   Redirected to homepage: ${logoutCheck.isOnHomepage}`);
    console.log(`   Has login button: ${logoutCheck.hasLoginButton}`);
    console.log(`   Auth data cleared: ${!logoutCheck.hasAuthData}`);
    
    return logoutSuccess;
    
  } catch (error) {
    testResults.steps.logout.status = 'error';
    testResults.steps.logout.error = error.message;
    testResults.errors.push(`Logout error: ${error.message}`);
    console.error(`❌ Logout test failed:`, error.message);
    return false;
  }
}

async function runCompleteUserFlowTest() {
  console.log('🚀 Starting Final Complete User Flow Verification...');
  console.log('=' .repeat(80));
  
  testResults.startTime = timestamp();
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for visual verification
      defaultViewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log(`PAGE: ${msg.text()}`);
    });
    
    // Enable request monitoring
    page.on('request', request => {
      console.log(`REQUEST: ${request.method()} ${request.url()}`);
    });
    
    // Run tests in sequence
    const homepageSuccess = await testHomepage(page);
    const loginPageSuccess = await testLoginPage(page);
    const loginSuccess = await testLoginProcess(page);
    const dashboardSuccess = await testDashboard(page);
    const logoutSuccess = await testLogout(page);
    
    // Calculate total flow time
    testResults.endTime = timestamp();
    testResults.totalFlowTime = Date.now() - new Date(testResults.startTime).getTime();
    
    // Determine overall success
    testResults.success = homepageSuccess && 
                          loginPageSuccess && 
                          loginSuccess && 
                          dashboardSuccess && 
                          logoutSuccess;
    
    // Generate summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 FINAL USER FLOW VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n⏱️  Total Flow Time: ${testResults.totalFlowTime}ms`);
    console.log(`   Threshold: ${PERFORMANCE_THRESHOLDS.totalFlowTime}ms`);
    console.log(`   Status: ${testResults.totalFlowTime < PERFORMANCE_THRESHOLDS.totalFlowTime ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n📊 Step Results:');
    console.log(`   Homepage: ${homepageSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Login Page: ${loginPageSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Login Process: ${loginSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Dashboard: ${dashboardSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Logout: ${logoutSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🖼️  Screenshots Taken:');
    Object.entries(testResults.screenshots).forEach(([name, info]) => {
      console.log(`   ${name}: ${info.path} - ${info.description}`);
    });
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log(`\n🎯 Overall Result: ${testResults.success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    
    if (testResults.success) {
      console.log('\n✅ All user flow tests passed! The application is working correctly.');
      console.log('   - Homepage renders with visible content');
      console.log('   - Login page displays login form (no gray space)');
      console.log('   - Login process works with valid credentials');
      console.log('   - Dashboard displays with sidebar visible');
      console.log('   - Logout functionality works correctly');
      console.log('   - No gray spaces detected on any pages');
      console.log('   - Performance is within acceptable thresholds');
    } else {
      console.log('\n❌ Some user flow tests failed. Please review the errors above.');
    }
    
    // Save detailed results
    const resultsPath = `final-user-flow-verification-results-${Date.now()}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
    
    return testResults.success;
    
  } catch (error) {
    console.error('❌ Critical error during user flow test:', error);
    testResults.errors.push(`Critical error: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runCompleteUserFlowTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteUserFlowTest,
  testResults,
  PERFORMANCE_THRESHOLDS,
  TEST_CREDENTIALS
};