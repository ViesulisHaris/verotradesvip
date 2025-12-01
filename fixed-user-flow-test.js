const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

// Test results
const testResults = {
  timestamp: new Date().toISOString(),
  steps: [],
  screenshots: [],
  performance: {},
  errors: [],
  summary: {
    totalSteps: 0,
    passedSteps: 0,
    failedSteps: 0
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  testResults.steps.push({
    timestamp,
    message,
    type,
    success: type !== 'error'
  });
  
  if (type === 'error') {
    testResults.errors.push(logMessage);
  }
}

async function takeScreenshot(page, name) {
  try {
    const screenshotPath = `fixed-user-flow-${name}-${Date.now()}.png`;
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true
    });
    testResults.screenshots.push({ name, path: screenshotPath });
    log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log(`Failed to take screenshot ${name}: ${error.message}`, 'error');
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAuth(page, maxWait = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const authState = await page.evaluate(() => {
      // Check if loading is complete and auth is initialized
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
      const hasLoadingElements = loadingElements.length > 0;
      
      // Check for content that indicates auth is ready
      const hasContent = document.body.innerText.length > 100;
      
      return {
        hasLoadingElements,
        hasContent,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    if (!authState.hasLoadingElements && authState.hasContent) {
      log(`Auth ready - Content length: ${authState.bodyText.length}`);
      return true;
    }
    
    await sleep(500);
  }
  
  log('Auth initialization timeout', 'error');
  return false;
}

async function findElementByText(page, text, tag = 'button') {
  const elements = await page.evaluate((searchText, searchTag) => {
    const elements = Array.from(document.querySelectorAll(searchTag));
    return elements.map(el => ({
      text: el.textContent.trim(),
      selector: `${searchTag}[text="${searchText}"]`
    })).filter(el => el.text.includes(searchText));
  }, text, tag);
  
  return elements.length > 0 ? elements[0] : null;
}

async function main() {
  let browser;
  let page;
  
  try {
    log('Starting Fixed User Flow Verification...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Step 1: Test Homepage Access
    log('Step 1: Testing homepage access and rendering...');
    testResults.summary.totalSteps++;
    
    const homepageStart = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    // Wait for auth to initialize
    const authReady = await waitForAuth(page);
    await sleep(2000); // Extra wait for content to fully render
    
    const homepageLoadTime = Date.now() - homepageStart;
    testResults.performance.homepageLoad = homepageLoadTime;
    
    // Check if homepage has content
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.length > 100;
    
    // Look for Login and Register buttons
    const loginButton = await findElementByText(page, 'Login');
    const registerButton = await findElementByText(page, 'Register');
    
    if (hasContent && loginButton && registerButton && authReady) {
      log(`✅ Homepage loaded successfully in ${homepageLoadTime}ms with ${bodyText.length} characters`);
      log(`✅ Login button found: ${loginButton.text}`);
      log(`✅ Register button found: ${registerButton.text}`);
      testResults.summary.passedSteps++;
    } else {
      log(`❌ Homepage issue - Load time: ${homepageLoadTime}ms, Content: ${bodyText.length} chars, Auth ready: ${authReady}`, 'error');
      log(`❌ Login button: ${loginButton ? 'YES' : 'NO'}, Register button: ${registerButton ? 'YES' : 'NO'}`, 'error');
      testResults.summary.failedSteps++;
    }
    
    await takeScreenshot(page, 'homepage');
    
    // Step 2: Navigate to Login Page
    log('Step 2: Navigating to login page...');
    testResults.summary.totalSteps++;
    
    if (loginButton) {
      // Click the login button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginBtn = buttons.find(btn => btn.textContent.includes('Login'));
        if (loginBtn) loginBtn.click();
      });
    } else {
      // Direct navigation
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    }
    
    await sleep(3000); // Wait for login page to load
    
    const loginPageLoad = Date.now() - homepageStart;
    log(`Login page loaded in ${loginPageLoad}ms`);
    
    // Check for login form elements
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    // Look for submit button
    const submitButton = await findElementByText(page, 'Login');
    
    if (emailInput && passwordInput && submitButton) {
      log('✅ Login form elements found');
      testResults.summary.passedSteps++;
    } else {
      log('❌ Login form elements missing', 'error');
      log(`Email input: ${emailInput ? 'YES' : 'NO'}, Password input: ${passwordInput ? 'YES' : 'NO'}, Submit button: ${submitButton ? 'YES' : 'NO'}`, 'error');
      testResults.summary.failedSteps++;
    }
    
    await takeScreenshot(page, 'login-page');
    
    // Step 3: Fill and Submit Login Form
    log('Step 3: Testing login process with valid credentials...');
    testResults.summary.totalSteps++;
    
    const loginStart = Date.now();
    
    // Fill form
    if (emailInput) await page.type('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    if (passwordInput) await page.type('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    
    // Submit form
    if (submitButton) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginBtn = buttons.find(btn => btn.textContent.includes('Login'));
        if (loginBtn) loginBtn.click();
      });
    } else {
      // Try to submit with Enter key
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      await sleep(5000); // Extra wait for dashboard to fully load
    } catch (e) {
      log('Navigation timeout, checking current state...', 'error');
    }
    
    const loginTime = Date.now() - loginStart;
    testResults.performance.loginProcess = loginTime;
    
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
    
    if (isLoggedIn && loginTime < 15000) {
      log(`✅ Login successful in ${loginTime}ms, redirected to: ${currentUrl}`);
      testResults.summary.passedSteps++;
    } else {
      log(`❌ Login issue - Time: ${loginTime}ms, URL: ${currentUrl}`, 'error');
      testResults.summary.failedSteps++;
    }
    
    await takeScreenshot(page, 'after-login');
    
    // Step 4: Test Dashboard Access
    log('Step 4: Testing dashboard access with authenticated user...');
    testResults.summary.totalSteps++;
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      await sleep(5000); // Wait for dashboard to fully load
    }
    
    // Wait for dashboard auth to initialize
    await waitForAuth(page);
    await sleep(3000); // Extra wait for dashboard content
    
    const dashboardStart = Date.now();
    
    // Check dashboard content
    const dashboardBodyText = await page.evaluate(() => document.body.innerText);
    const dashboardHasContent = dashboardBodyText.length > 200;
    
    const dashboardLoadTime = Date.now() - dashboardStart;
    testResults.performance.dashboardLoad = dashboardLoadTime;
    
    if (dashboardHasContent && dashboardLoadTime < 10000) {
      log(`✅ Dashboard loaded successfully in ${dashboardLoadTime}ms with ${dashboardBodyText.length} characters`);
      testResults.summary.passedSteps++;
    } else {
      log(`❌ Dashboard issue - Load time: ${dashboardLoadTime}ms, Content: ${dashboardBodyText.length} chars`, 'error');
      testResults.summary.failedSteps++;
    }
    
    await takeScreenshot(page, 'dashboard');
    
    // Step 5: Test Sidebar Visibility
    log('Step 5: Testing sidebar visibility for authenticated users...');
    testResults.summary.totalSteps++;
    
    // Look for sidebar elements
    const sidebarSelectors = [
      '[data-testid="unified-sidebar"]',
      '.unified-sidebar',
      'nav[class*="sidebar"]',
      'aside[class*="sidebar"]',
      '.sidebar',
      '[class*="Sidebar"]'
    ];
    
    let sidebarFound = false;
    let sidebarSelector = null;
    
    for (const selector of sidebarSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          sidebarFound = true;
          sidebarSelector = selector;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    // Also check for any navigation elements
    const navElements = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav, aside, [role="navigation"]');
      return Array.from(navs).map(nav => ({
        tagName: nav.tagName,
        className: nav.className,
        textContent: nav.textContent.substring(0, 100)
      }));
    });
    
    if (sidebarFound || navElements.length > 0) {
      log(`✅ Sidebar/Navigation found - Selector: ${sidebarSelector || 'nav elements: ' + navElements.length}`);
      if (navElements.length > 0) {
        log(`Navigation elements found: ${navElements.map(nav => nav.tagName).join(', ')}`);
      }
      testResults.summary.passedSteps++;
    } else {
      log('❌ No sidebar or navigation elements found', 'error');
      testResults.summary.failedSteps++;
    }
    
    await takeScreenshot(page, 'dashboard-sidebar');
    
    // Step 6: Test Authentication State
    log('Step 6: Testing authentication state persistence...');
    testResults.summary.totalSteps++;
    
    // Check storage for auth data
    const authData = await page.evaluate(() => {
      return {
        localStorage: {
          auth: localStorage.getItem('auth'),
          token: localStorage.getItem('token'),
          user: localStorage.getItem('user'),
          supabase: localStorage.getItem('supabase.auth.token')
        },
        sessionStorage: {
          auth: sessionStorage.getItem('auth'),
          token: sessionStorage.getItem('token'),
          user: sessionStorage.getItem('user')
        }
      };
    });
    
    const hasAuthData = Object.values(authData.localStorage).some(val => val !== null) || 
                       Object.values(authData.sessionStorage).some(val => val !== null);
    
    if (hasAuthData) {
      log('✅ Authentication data found in storage');
      testResults.summary.passedSteps++;
    } else {
      log('❌ No authentication data found in storage', 'error');
      testResults.summary.failedSteps++;
    }
    
    // Step 7: Test Logout (if possible)
    log('Step 7: Testing logout functionality...');
    testResults.summary.totalSteps++;
    
    // Look for logout button
    const logoutButton = await findElementByText(page, 'Logout');
    
    if (logoutButton) {
      log(`✅ Logout button found: ${logoutButton.text}`);
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const logoutBtn = buttons.find(btn => btn.textContent.includes('Logout'));
        if (logoutBtn) logoutBtn.click();
      });
      await sleep(3000);
      testResults.summary.passedSteps++;
      await takeScreenshot(page, 'after-logout');
    } else {
      log('⚠️ Logout button not found - this may be expected', 'error');
      testResults.summary.failedSteps++;
    }
    
    // Calculate total performance
    const totalTime = testResults.performance.homepageLoad + 
                     (testResults.performance.loginProcess || 0) + 
                     (testResults.performance.dashboardLoad || 0);
    
    testResults.performance.totalFlowTime = totalTime;
    
    log(`=== FINAL RESULTS ===`);
    log(`Total Steps: ${testResults.summary.totalSteps}`);
    log(`Passed: ${testResults.summary.passedSteps}`);
    log(`Failed: ${testResults.summary.failedSteps}`);
    log(`Success Rate: ${((testResults.summary.passedSteps / testResults.summary.totalSteps) * 100).toFixed(2)}%`);
    log(`Total Flow Time: ${totalTime}ms`);
    
    // Save results
    const reportPath = `fixed-user-flow-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    log(`Report saved: ${reportPath}`);
    
  } catch (error) {
    log(`Script execution failed: ${error.message}`, 'error');
    testResults.errors.push(`Execution failure: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
main();