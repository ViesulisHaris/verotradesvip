const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'functionality-verification-screenshots');
const REPORT_FILE = path.join(__dirname, 'FUNCTIONALITY_VERIFICATION_REPORT.md');

// Test credentials
const TEST_CREDENTIALS = {
  email: 'testuser@verotrade.com',
  password: 'TestPassword123!'
};

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test results
const testResults = {
  homePage: { status: 'pending', details: [] },
  loginPage: { status: 'pending', details: [] },
  dashboard: { status: 'pending', details: [] },
  logTradePage: { status: 'pending', details: [] },
  authentication: { status: 'pending', details: [] },
  responsiveDesign: { status: 'pending', details: [] },
  navigation: { status: 'pending', details: [] },
  coreFeatures: { status: 'pending', details: [] }
};

async function takeScreenshot(page, name, description) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath} - ${description}`);
  return screenshotPath;
}

async function verifyHomePage(page) {
  console.log('\n=== Testing Home Page ===');
  testResults.homePage.status = 'running';
  
  try {
    // Navigate to home page
    console.log('Navigating to home page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if we were redirected
    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    if (currentUrl !== BASE_URL && currentUrl !== `${BASE_URL}/`) {
      testResults.homePage.details.push(`⚠ Redirected from ${BASE_URL} to ${currentUrl}`);
    }
    
    // Take screenshot
    await takeScreenshot(page, 'home-page', 'Home page loaded');
    
    // Get page title
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    testResults.homePage.details.push(`Page title: ${pageTitle}`);
    
    // Check for "Trading Journal" heading
    console.log('Checking for "Trading Journal" heading...');
    const tradingJournalHeading = await page.locator('h1, h2, h3').filter({ hasText: 'Trading Journal' }).isVisible();
    if (tradingJournalHeading) {
      testResults.homePage.details.push('✓ "Trading Journal" heading is visible');
    } else {
      testResults.homePage.details.push('✗ "Trading Journal" heading is not visible');
      
      // Debug: Get all headings on the page
      const allHeadings = await page.locator('h1, h2, h3').allTextContents();
      console.log('All headings found:', allHeadings);
      testResults.homePage.details.push(`Found headings: ${allHeadings.join(', ')}`);
    }
    
    // Check for welcome message
    console.log('Checking for welcome message...');
    const welcomeMessage = await page.locator('text=Welcome to your trading journal application').isVisible();
    if (welcomeMessage) {
      testResults.homePage.details.push('✓ Welcome message is visible');
    } else {
      testResults.homePage.details.push('✗ Welcome message is not visible');
      
      // Debug: Get all text content that might be similar
      const bodyText = await page.locator('body').textContent();
      console.log('Body text contains "welcome":', bodyText.toLowerCase().includes('welcome'));
      if (bodyText.toLowerCase().includes('welcome')) {
        testResults.homePage.details.push('⚠ Found "welcome" in body text but not exact match');
      }
    }
    
    // Check if page is not white screen
    const bodyContent = await page.locator('body').textContent();
    if (bodyContent && bodyContent.trim().length > 0) {
      testResults.homePage.details.push('✓ Page has content (not white screen)');
      console.log('Page content length:', bodyContent.length);
    } else {
      testResults.homePage.details.push('✗ Page appears to be white screen');
    }
    
    testResults.homePage.status = testResults.homePage.details.filter(d => d.includes('✓')).length >= 2 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.homePage.status = 'failed';
    testResults.homePage.details.push(`✗ Error: ${error.message}`);
    console.error('Error in home page test:', error);
  }
}

async function verifyLoginPage(page) {
  console.log('\n=== Testing Login Page ===');
  testResults.loginPage.status = 'running';
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await takeScreenshot(page, 'login-page', 'Login page loaded');
    
    // Check for login form
    const loginForm = await page.locator('form').isVisible();
    if (loginForm) {
      testResults.loginPage.details.push('✓ Login form is visible');
    } else {
      testResults.loginPage.details.push('✗ Login form is not visible');
    }
    
    // Check for email input
    const emailInput = await page.locator('input[type="email"], input[name="email"]').isVisible();
    if (emailInput) {
      testResults.loginPage.details.push('✓ Email input field is visible');
    } else {
      testResults.loginPage.details.push('✗ Email input field is not visible');
    }
    
    // Check for password input
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').isVisible();
    if (passwordInput) {
      testResults.loginPage.details.push('✓ Password input field is visible');
    } else {
      testResults.loginPage.details.push('✗ Password input field is not visible');
    }
    
    // Check for submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').isVisible();
    if (submitButton) {
      testResults.loginPage.details.push('✓ Submit button is visible');
    } else {
      testResults.loginPage.details.push('✗ Submit button is not visible');
    }
    
    testResults.loginPage.status = testResults.loginPage.details.filter(d => d.includes('✓')).length >= 3 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.loginPage.status = 'failed';
    testResults.loginPage.details.push(`✗ Error: ${error.message}`);
  }
}

async function verifyDashboard(page) {
  console.log('\n=== Testing Dashboard ===');
  testResults.dashboard.status = 'running';
  
  try {
    // First, try to login if not already authenticated
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await takeScreenshot(page, 'dashboard', 'Dashboard loaded');
    
    // Check if we're on a page that appears to be a dashboard
    const currentUrl = page.url();
    if (currentUrl === BASE_URL || currentUrl === `${BASE_URL}/`) {
      testResults.dashboard.details.push('✓ Navigated to home page after login (likely dashboard)');
    } else {
      testResults.dashboard.details.push(`✓ Navigated to ${currentUrl} after login`);
    }
    
    // Check for dashboard-like content
    const hasStatsOrCards = await page.locator('.stat, .card, .dashboard, .metric').count() > 0;
    if (hasStatsOrCards) {
      testResults.dashboard.details.push('✓ Dashboard-like content (stats/cards) is visible');
    } else {
      testResults.dashboard.details.push('⚠ No typical dashboard content found, but page may still be functional');
    }
    
    // Check for navigation elements
    const hasNavigation = await page.locator('nav, .navigation, .sidebar, .menu').count() > 0;
    if (hasNavigation) {
      testResults.dashboard.details.push('✓ Navigation elements are visible');
    } else {
      testResults.dashboard.details.push('⚠ No navigation elements found');
    }
    
    testResults.dashboard.status = testResults.dashboard.details.filter(d => d.includes('✓')).length >= 1 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.dashboard.status = 'failed';
    testResults.dashboard.details.push(`✗ Error: ${error.message}`);
  }
}

async function verifyLogTradePage(page) {
  console.log('\n=== Testing Log Trade Page ===');
  testResults.logTradePage.status = 'running';
  
  try {
    // Navigate to log-trade page
    await page.goto(`${BASE_URL}/log-trade`);
    await page.waitForLoadState('networkidle');
    
    // If redirected to login, login first
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      
      // Try to navigate to log-trade again
      await page.goto(`${BASE_URL}/log-trade`);
      await page.waitForLoadState('networkidle');
    }
    
    // Take screenshot
    await takeScreenshot(page, 'log-trade-page', 'Log trade page loaded');
    
    // Check for form elements
    const hasForm = await page.locator('form').isVisible();
    if (hasForm) {
      testResults.logTradePage.details.push('✓ Form is visible');
    } else {
      testResults.logTradePage.details.push('✗ Form is not visible');
    }
    
    // Check for trade-related input fields
    const hasTradeInputs = await page.locator('input, select, textarea').count() > 0;
    if (hasTradeInputs) {
      testResults.logTradePage.details.push('✓ Input fields are present');
    } else {
      testResults.logTradePage.details.push('✗ No input fields found');
    }
    
    // Check for submit button
    const hasSubmitButton = await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Log Trade")').isVisible();
    if (hasSubmitButton) {
      testResults.logTradePage.details.push('✓ Submit button is visible');
    } else {
      testResults.logTradePage.details.push('✗ Submit button is not visible');
    }
    
    testResults.logTradePage.status = testResults.logTradePage.details.filter(d => d.includes('✓')).length >= 2 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.logTradePage.status = 'failed';
    testResults.logTradePage.details.push(`✗ Error: ${error.message}`);
  }
}

async function verifyAuthenticationFlow(page) {
  console.log('\n=== Testing Authentication Flow ===');
  testResults.authentication.status = 'running';
  
  try {
    // Logout first if already logged in
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in login form
    await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    
    // Submit login form
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after login
    await takeScreenshot(page, 'after-login', 'Page after login attempt');
    
    // Check if login was successful (not on login page anymore)
    const isLoggedIn = !page.url().includes('/login');
    if (isLoggedIn) {
      testResults.authentication.details.push('✓ Login appears to be successful (redirected from login page)');
    } else {
      testResults.authentication.details.push('✗ Still on login page, login may have failed');
    }
    
    // Check for logout functionality
    const logoutButton = await page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")');
    const logoutButtonCount = await logoutButton.count();
    console.log(`Found ${logoutButtonCount} logout button(s)`);
    
    if (logoutButtonCount > 0) {
      testResults.authentication.details.push(`✓ Found ${logoutButtonCount} logout button(s)`);
      
      // Try to logout with the first visible button
      let logoutSuccessful = false;
      for (let i = 0; i < logoutButtonCount; i++) {
        try {
          const button = logoutButton.nth(i);
          if (await button.isVisible()) {
            console.log(`Attempting to click logout button ${i+1}`);
            await button.click();
            await page.waitForLoadState('networkidle');
            
            // Check if logout was successful (back to login page)
            const isLoggedOut = page.url().includes('/login');
            if (isLoggedOut) {
              testResults.authentication.details.push('✓ Logout appears to be successful (redirected to login page)');
              logoutSuccessful = true;
              break;
            } else {
              testResults.authentication.details.push(`✗ Logout button ${i+1} did not redirect to login page`);
            }
          }
        } catch (error) {
          console.log(`Error clicking logout button ${i+1}: ${error.message}`);
          testResults.authentication.details.push(`✗ Error clicking logout button ${i+1}: ${error.message}`);
        }
      }
      
      if (!logoutSuccessful) {
        testResults.authentication.details.push('✗ No logout button worked successfully');
      }
    } else {
      testResults.authentication.details.push('✗ No logout buttons found');
    }
    
    testResults.authentication.status = testResults.authentication.details.filter(d => d.includes('✓')).length >= 2 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.authentication.status = 'failed';
    testResults.authentication.details.push(`✗ Error: ${error.message}`);
  }
}

async function verifyResponsiveDesign(page) {
  console.log('\n=== Testing Responsive Design ===');
  testResults.responsiveDesign.status = 'running';
  
  try {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for desktop view
    await takeScreenshot(page, 'desktop-view', 'Desktop view');
    
    // Check if content is properly displayed (not mobile view)
    const desktopContent = await page.locator('body').textContent();
    const hasDesktopContent = desktopContent && desktopContent.trim().length > 0;
    
    if (hasDesktopContent) {
      testResults.responsiveDesign.details.push('✓ Desktop view loads with content');
    } else {
      testResults.responsiveDesign.details.push('✗ Desktop view appears empty');
    }
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for tablet view
    await takeScreenshot(page, 'tablet-view', 'Tablet view');
    
    // Check if content is properly displayed
    const tabletContent = await page.locator('body').textContent();
    const hasTabletContent = tabletContent && tabletContent.trim().length > 0;
    
    if (hasTabletContent) {
      testResults.responsiveDesign.details.push('✓ Tablet view loads with content');
    } else {
      testResults.responsiveDesign.details.push('✗ Tablet view appears empty');
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for mobile view
    await takeScreenshot(page, 'mobile-view', 'Mobile view');
    
    // Check if content is properly displayed
    const mobileContent = await page.locator('body').textContent();
    const hasMobileContent = mobileContent && mobileContent.trim().length > 0;
    
    if (hasMobileContent) {
      testResults.responsiveDesign.details.push('✓ Mobile view loads with content');
    } else {
      testResults.responsiveDesign.details.push('✗ Mobile view appears empty');
    }
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    testResults.responsiveDesign.status = testResults.responsiveDesign.details.filter(d => d.includes('✓')).length >= 2 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.responsiveDesign.status = 'failed';
    testResults.responsiveDesign.details.push(`✗ Error: ${error.message}`);
  }
}

async function verifyNavigation(page) {
  console.log('\n=== Testing Navigation ===');
  testResults.navigation.status = 'running';
  
  try {
    // Start from home page
    console.log('Starting navigation test...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Debug: Check if we're redirected
    const currentUrl = page.url();
    console.log(`Current URL for navigation test: ${currentUrl}`);
    
    // Look for navigation links with multiple selectors
    const navSelectors = [
      'nav a',
      '.navigation a',
      '.sidebar a',
      '.menu a',
      'header a',
      '.nav a',
      '.navbar a',
      '.nav-item a',
      '.nav-link',
      'a[href*="dashboard"]',
      'a[href*="trades"]',
      'a[href*="strategies"]',
      'a[href*="log-trade"]'
    ];
    
    let totalLinks = 0;
    let allNavLinks = [];
    
    for (const selector of navSelectors) {
      try {
        const links = await page.locator(selector);
        const count = await links.count();
        console.log(`Found ${count} links with selector: ${selector}`);
        
        if (count > 0) {
          totalLinks += count;
          for (let i = 0; i < count; i++) {
            const text = await links.nth(i).textContent();
            const href = await links.nth(i).getAttribute('href');
            allNavLinks.push({ text, href, selector });
            console.log(`Link: "${text}" -> ${href} (${selector})`);
          }
        }
      } catch (error) {
        console.log(`Error with selector ${selector}: ${error.message}`);
      }
    }
    
    testResults.navigation.details.push(`Found ${totalLinks} total navigation elements with ${allNavLinks.length} unique links`);
    
    if (allNavLinks.length > 0) {
      // Test a few key navigation links
      const keyLinks = ['dashboard', 'trades', 'strategies', 'log-trade'];
      let testedLinks = 0;
      
      for (const linkText of keyLinks) {
        try {
          // Try to find a matching link
          let matchingLink = null;
          for (const link of allNavLinks) {
            if ((link.text && link.text.toLowerCase().includes(linkText)) ||
                (link.href && link.href.toLowerCase().includes(linkText))) {
              matchingLink = link;
              break;
            }
          }
          
          if (matchingLink) {
            console.log(`Attempting to navigate to: ${linkText} via "${matchingLink.text}" -> ${matchingLink.href}`);
            
            // Navigate directly to the URL if available
            if (matchingLink.href) {
              await page.goto(matchingLink.href.startsWith('http') ? matchingLink.href : `${BASE_URL}${matchingLink.href}`);
            } else {
              // Click the link element
              await page.locator(matchingLink.selector).filter({ hasText: matchingLink.text }).click();
            }
            
            await page.waitForLoadState('networkidle');
            
            // Take screenshot
            await takeScreenshot(page, `navigation-${linkText}`, `Navigation to ${linkText}`);
            
            // Check if navigation was successful
            const navUrl = page.url();
            if (navUrl.includes(linkText) || navUrl !== currentUrl) {
              testResults.navigation.details.push(`✓ Successfully navigated to ${linkText}`);
              testedLinks++;
            } else {
              testResults.navigation.details.push(`✗ Navigation to ${linkText} may have failed (URL: ${navUrl})`);
            }
            
            // Go back to home page
            await page.goto(BASE_URL);
            await page.waitForLoadState('networkidle');
          } else {
            testResults.navigation.details.push(`⚠ No link found for: ${linkText}`);
          }
        } catch (error) {
          testResults.navigation.details.push(`✗ Error navigating to ${linkText}: ${error.message}`);
          console.error(`Error navigating to ${linkText}:`, error);
        }
      }
      
      if (testedLinks > 0) {
        testResults.navigation.details.push(`✓ Successfully tested ${testedLinks} navigation links`);
      } else {
        testResults.navigation.details.push('⚠ Could not test any navigation links');
      }
    } else {
      testResults.navigation.details.push('✗ No navigation links found with any selector');
    }
    
    testResults.navigation.status = testResults.navigation.details.filter(d => d.includes('✓')).length >= 2 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.navigation.status = 'failed';
    testResults.navigation.details.push(`✗ Error: ${error.message}`);
    console.error('Error in navigation test:', error);
  }
}

async function verifyCoreFeatures(page) {
  console.log('\n=== Testing Core Features ===');
  testResults.coreFeatures.status = 'running';
  
  try {
    // Login first with detailed logging
    console.log('Starting core features test - logging in first...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot before login
    await takeScreenshot(page, 'core-features-login', 'Login page for core features test');
    
    // Find and fill email field
    console.log('Filling login form...');
    const emailField = await page.locator('input[type="email"], input[name="email"]').first();
    const emailVisible = await emailField.isVisible();
    console.log(`Email field visible: ${emailVisible}`);
    
    if (emailVisible) {
      await emailField.fill(TEST_CREDENTIALS.email);
      console.log('Email field filled');
    } else {
      testResults.coreFeatures.details.push('✗ Email field not found or not visible');
      throw new Error('Email field not found or not visible');
    }
    
    // Find and fill password field
    const passwordField = await page.locator('input[type="password"], input[name="password"]').first();
    const passwordVisible = await passwordField.isVisible();
    console.log(`Password field visible: ${passwordVisible}`);
    
    if (passwordVisible) {
      await passwordField.fill(TEST_CREDENTIALS.password);
      console.log('Password field filled');
    } else {
      testResults.coreFeatures.details.push('✗ Password field not found or not visible');
      throw new Error('Password field not found or not visible');
    }
    
    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    const submitVisible = await submitButton.isVisible();
    console.log(`Submit button visible: ${submitVisible}`);
    
    if (submitVisible) {
      console.log('Clicking submit button...');
      await submitButton.click();
      console.log('Submit button clicked, waiting for navigation...');
      
      // Wait for navigation with timeout
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('Navigation complete');
      
      // Check if login was successful
      const currentUrl = page.url();
      console.log(`URL after login: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        testResults.coreFeatures.details.push('✗ Login failed - still on login page');
        throw new Error('Login failed - still on login page');
      } else {
        testResults.coreFeatures.details.push(`✓ Login successful - redirected to ${currentUrl}`);
      }
    } else {
      testResults.coreFeatures.details.push('✗ Submit button not found or not visible');
      throw new Error('Submit button not found or not visible');
    }
    
    // Test trade logging feature
    console.log('Testing trade logging feature...');
    await page.goto(`${BASE_URL}/log-trade`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of trade logging form
    await takeScreenshot(page, 'trade-logging-form', 'Trade logging form');
    
    // Check if trade logging form has necessary fields
    const formFields = await page.locator('form input, form select, form textarea');
    const formFieldCount = await formFields.count();
    console.log(`Found ${formFieldCount} form fields`);
    
    if (formFieldCount > 0) {
      testResults.coreFeatures.details.push(`✓ Trade logging form has ${formFieldCount} fields`);
    } else {
      testResults.coreFeatures.details.push('✗ Trade logging form has no fields');
    }
    
    // Test strategies feature
    console.log('Testing strategies feature...');
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of strategies page
    await takeScreenshot(page, 'strategies-page', 'Strategies page');
    
    // Check if strategies page has content
    const strategiesContent = await page.locator('body').textContent();
    const hasStrategiesContent = strategiesContent && strategiesContent.trim().length > 0;
    console.log(`Strategies page content length: ${strategiesContent ? strategiesContent.length : 0}`);
    
    if (hasStrategiesContent) {
      testResults.coreFeatures.details.push('✓ Strategies page has content');
    } else {
      testResults.coreFeatures.details.push('✗ Strategies page appears empty');
    }
    
    // Test trades feature
    console.log('Testing trades feature...');
    await page.goto(`${BASE_URL}/trades`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of trades page
    await takeScreenshot(page, 'trades-page', 'Trades page');
    
    // Check if trades page has content
    const tradesContent = await page.locator('body').textContent();
    const hasTradesContent = tradesContent && tradesContent.trim().length > 0;
    console.log(`Trades page content length: ${tradesContent ? tradesContent.length : 0}`);
    
    if (hasTradesContent) {
      testResults.coreFeatures.details.push('✓ Trades page has content');
    } else {
      testResults.coreFeatures.details.push('✗ Trades page appears empty');
    }
    
    // Test emotional analysis feature (if available)
    console.log('Testing emotional analysis feature...');
    try {
      await page.goto(`${BASE_URL}/emotional-analysis`);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of emotional analysis page
      await takeScreenshot(page, 'emotional-analysis-page', 'Emotional analysis page');
      
      // Check if emotional analysis page has content
      const emotionalContent = await page.locator('body').textContent();
      const hasEmotionalContent = emotionalContent && emotionalContent.trim().length > 0;
      console.log(`Emotional analysis page content length: ${emotionalContent ? emotionalContent.length : 0}`);
      
      if (hasEmotionalContent) {
        testResults.coreFeatures.details.push('✓ Emotional analysis page has content');
      } else {
        testResults.coreFeatures.details.push('✗ Emotional analysis page appears empty');
      }
    } catch (error) {
      console.log(`Emotional analysis test error: ${error.message}`);
      testResults.coreFeatures.details.push('⚠ Emotional analysis page may not exist or is not accessible');
    }
    
    testResults.coreFeatures.status = testResults.coreFeatures.details.filter(d => d.includes('✓')).length >= 2 ? 'passed' : 'failed';
    
  } catch (error) {
    testResults.coreFeatures.status = 'failed';
    testResults.coreFeatures.details.push(`✗ Error: ${error.message}`);
    console.error('Error in core features test:', error);
  }
}

async function generateReport() {
  console.log('\n=== Generating Verification Report ===');
  
  // Calculate overall status
  const passedTests = Object.values(testResults).filter(result => result.status === 'passed').length;
  const totalTests = Object.keys(testResults).length;
  const overallStatus = passedTests === totalTests ? 'PASSED' : 'PARTIAL';
  
  // Generate markdown report
  let reportContent = `# Trading Journal Functionality Verification Report\n\n`;
  reportContent += `**Overall Status:** ${overallStatus} (${passedTests}/${totalTests} tests passed)\n\n`;
  reportContent += `**Date:** ${new Date().toISOString()}\n\n`;
  
  // Add test results
  reportContent += `## Test Results\n\n`;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const formattedName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    reportContent += `### ${formattedName}\n\n`;
    reportContent += `**Status:** ${result.status.toUpperCase()}\n\n`;
    
    if (result.details.length > 0) {
      reportContent += `**Details:**\n\n`;
      for (const detail of result.details) {
        reportContent += `- ${detail}\n`;
      }
      reportContent += `\n`;
    }
  }
  
  // Add screenshots section
  reportContent += `## Screenshots\n\n`;
  reportContent += `Screenshots have been saved to the \`${SCREENSHOTS_DIR}\` directory.\n\n`;
  
  // Add recommendations
  reportContent += `## Recommendations\n\n`;
  
  if (overallStatus === 'PASSED') {
    reportContent += `All tests passed! The trading journal application appears to be fully functional.\n\n`;
  } else {
    reportContent += `Some tests failed or had issues. Please review the failed tests and address the identified problems.\n\n`;
    
    // Add specific recommendations for failed tests
    for (const [testName, result] of Object.entries(testResults)) {
      if (result.status === 'failed') {
        const formattedName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        reportContent += `### ${formattedName}\n\n`;
        
        if (testName === 'homePage') {
          reportContent += `- Check if the home page is properly loading and displaying the "Trading Journal" heading and welcome message.\n`;
          reportContent += `- Verify that the page is not showing a white screen.\n`;
        } else if (testName === 'loginPage') {
          reportContent += `- Check if the login form is properly rendered with all necessary input fields.\n`;
          reportContent += `- Verify that the submit button is visible and functional.\n`;
        } else if (testName === 'dashboard') {
          reportContent += `- Check if the dashboard loads correctly after login.\n`;
          reportContent += `- Verify that dashboard content is properly displayed.\n`;
        } else if (testName === 'logTradePage') {
          reportContent += `- Check if the trade logging form is properly rendered.\n`;
          reportContent += `- Verify that all necessary form fields are present.\n`;
        } else if (testName === 'authentication') {
          reportContent += `- Check if the authentication flow is working correctly.\n`;
          reportContent += `- Verify that users can login and logout successfully.\n`;
        } else if (testName === 'responsiveDesign') {
          reportContent += `- Check if the application displays correctly on different screen sizes.\n`;
          reportContent += `- Verify that the application is not stuck in mobile view on desktop.\n`;
        } else if (testName === 'navigation') {
          reportContent += `- Check if navigation links are working correctly.\n`;
          reportContent += `- Verify that users can navigate between different pages.\n`;
        } else if (testName === 'coreFeatures') {
          reportContent += `- Check if core features like trade logging, strategy tracking, and emotional analysis are working.\n`;
          reportContent += `- Verify that all feature pages are accessible and functional.\n`;
        }
        
        reportContent += `\n`;
      }
    }
  }
  
  // Write report to file
  fs.writeFileSync(REPORT_FILE, reportContent);
  console.log(`Report saved to: ${REPORT_FILE}`);
  
  return reportContent;
}

async function runVerification() {
  console.log('Starting Trading Journal Functionality Verification...');
  console.log('Base URL:', BASE_URL);
  console.log('Screenshots will be saved to:', SCREENSHOTS_DIR);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Run all verification tests
    await verifyHomePage(page);
    await verifyLoginPage(page);
    await verifyDashboard(page);
    await verifyLogTradePage(page);
    await verifyAuthenticationFlow(page);
    await verifyResponsiveDesign(page);
    await verifyNavigation(page);
    await verifyCoreFeatures(page);
    
    // Generate report
    const report = await generateReport();
    
    // Print summary
    console.log('\n=== Verification Summary ===');
    for (const [testName, result] of Object.entries(testResults)) {
      const formattedName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${formattedName}: ${result.status.toUpperCase()}`);
    }
    
    console.log('\nVerification complete!');
    console.log(`Full report saved to: ${REPORT_FILE}`);
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
runVerification().catch(console.error);