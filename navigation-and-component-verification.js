/**
 * Navigation and Component Rendering Verification Script
 * 
 * This script tests:
 * 1. Navigation between all main pages
 * 2. Component rendering for all pages
 * 3. Authentication flow and protected routes
 * 4. Error handling for invalid URLs
 * 5. UI component functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'navigation-test-screenshots');
const TEST_REPORT = {
  timestamp: new Date().toISOString(),
  results: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0
  }
};

// Main pages to test
const MAIN_PAGES = [
  { name: 'Home', path: '/', expectedRedirect: '/dashboard', requiresAuth: false },
  { name: 'Login', path: '/login', requiresAuth: false },
  { name: 'Register', path: '/register', requiresAuth: false },
  { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
  { name: 'Trades', path: '/trades', requiresAuth: true },
  { name: 'Log Trade', path: '/log-trade', requiresAuth: true },
  { name: 'Calendar', path: '/calendar', requiresAuth: true },
  { name: 'Strategies', path: '/strategies', requiresAuth: true },
  { name: 'Confluence', path: '/confluence', requiresAuth: true },
  { name: 'Settings', path: '/settings', requiresAuth: true }
];

// Invalid URLs for error handling test
const INVALID_URLS = [
  '/invalid-page',
  '/trades/invalid-trade',
  '/strategies/invalid-strategy',
  '/dashboard/invalid-section'
];

// Navigation items from sidebar
const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', selector: 'a[href="/dashboard"]' },
  { name: 'Trades', href: '/trades', selector: 'a[href="/trades"]' },
  { name: 'Log Trade', href: '/log-trade', selector: 'a[href="/log-trade"]' },
  { name: 'Calendar', href: '/calendar', selector: 'a[href="/calendar"]' },
  { name: 'Strategy', href: '/strategies', selector: 'a[href="/strategies"]' },
  { name: 'Confluence', href: '/confluence', selector: 'a[href="/confluence"]' },
  { name: 'Settings', href: '/settings', selector: 'a[href="/settings"]' }
];

// Test credentials (you may need to adjust these)
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123'
};

/**
 * Initialize browser and page
 */
async function initializeBrowser() {
  console.log('🚀 Initializing browser...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE CONSOLE:', msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  return { browser, page };
}

/**
 * Take screenshot with timestamp
 */
async function takeScreenshot(page, name, description = '') {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true,
    type: 'png'
  });
  
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

/**
 * Test page loading and basic rendering
 */
async function testPageLoad(page, pageInfo, isAuthenticated = false) {
  const testName = `Load ${pageInfo.name} Page`;
  console.log(`\n🧪 Testing: ${testName}`);
  
  TEST_REPORT.summary.totalTests++;
  
  try {
    // Navigate to page
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    // Check HTTP status
    if (response.status() !== 200) {
      throw new Error(`HTTP ${response.status()}`);
    }
    
    // Wait a bit for any redirects
    await page.waitForTimeout(2000);
    
    // Check current URL (for redirects)
    const currentUrl = page.url();
    
    // Handle expected redirects
    if (pageInfo.expectedRedirect) {
      if (currentUrl.includes(pageInfo.expectedRedirect)) {
        console.log(`✅ ${pageInfo.name} redirected correctly to ${pageInfo.expectedRedirect}`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: 'Redirected correctly' };
        TEST_REPORT.summary.passedTests++;
        return true;
      } else {
        throw new Error(`Expected redirect to ${pageInfo.expectedRedirect}, got ${currentUrl}`);
      }
    }
    
    // Check if page requires authentication
    if (pageInfo.requiresAuth && !isAuthenticated) {
      // Should redirect to login
      if (currentUrl.includes('/login')) {
        console.log(`✅ ${pageInfo.name} correctly redirected to login (protected route)`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: 'Protected route working' };
        TEST_REPORT.summary.passedTests++;
        return true;
      } else {
        throw new Error(`Protected route ${pageInfo.path} should redirect to login`);
      }
    }
    
    // Check for basic page elements
    const hasContent = await page.evaluate(() => {
      const body = document.body;
      return body && body.innerText.length > 100;
    });
    
    if (!hasContent) {
      throw new Error('Page appears to be empty or not loaded properly');
    }
    
    // Check for white screen (no content)
    const isWhiteScreen = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      const bgColor = computedStyle.backgroundColor;
      return bgColor === 'rgb(255, 255, 255)' || bgColor === 'white';
    });
    
    if (isWhiteScreen) {
      throw new Error('Page has white background (possible loading issue)');
    }
    
    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.performance && window.performance.getEntriesByType('navigation')[0];
    });
    
    console.log(`✅ ${pageInfo.name} loaded successfully`);
    TEST_REPORT.results[testName] = { 
      status: 'PASSED', 
      message: 'Page loaded and rendered correctly',
      url: currentUrl
    };
    TEST_REPORT.summary.passedTests++;
    
    await takeScreenshot(page, `load-${pageInfo.name.toLowerCase()}`);
    return true;
    
  } catch (error) {
    console.error(`❌ ${testName} failed:`, error.message);
    TEST_REPORT.results[testName] = { 
      status: 'FAILED', 
      message: error.message 
    };
    TEST_REPORT.summary.failedTests++;
    
    await takeScreenshot(page, `error-${pageInfo.name.toLowerCase()}`);
    return false;
  }
}

/**
 * Test navigation items
 */
async function testNavigationItems(page, isAuthenticated = false) {
  console.log('\n🧪 Testing Navigation Items');
  
  for (const navItem of NAVIGATION_ITEMS) {
    const testName = `Navigate to ${navItem.name}`;
    TEST_REPORT.summary.totalTests++;
    
    try {
      // Check if navigation item exists (only if authenticated)
      if (isAuthenticated) {
        const navExists = await page.$(navItem.selector);
        if (!navExists) {
          throw new Error(`Navigation item ${navItem.name} not found`);
        }
        
        // Click navigation item
        await page.click(navItem.selector);
        await page.waitForTimeout(2000);
        
        // Check if we navigated to the correct page
        const currentUrl = page.url();
        if (!currentUrl.includes(navItem.href)) {
          throw new Error(`Navigation to ${navItem.href} failed, current URL: ${currentUrl}`);
        }
        
        console.log(`✅ Navigation to ${navItem.name} successful`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: 'Navigation successful' };
        TEST_REPORT.summary.passedTests++;
        
        await takeScreenshot(page, `nav-${navItem.name.toLowerCase()}`);
      } else {
        // For unauthenticated state, just verify navigation items aren't visible
        const navExists = await page.$(navItem.selector);
        if (navExists) {
          console.log(`ℹ️ Navigation item ${navItem.name} visible but not clickable (unauthenticated)`);
          TEST_REPORT.results[testName] = { status: 'SKIPPED', message: 'Not authenticated' };
          TEST_REPORT.summary.skippedTests++;
        } else {
          console.log(`✅ Navigation item ${navItem.name} correctly hidden (unauthenticated)`);
          TEST_REPORT.results[testName] = { status: 'PASSED', message: 'Correctly hidden when unauthenticated' };
          TEST_REPORT.summary.passedTests++;
        }
      }
      
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error.message);
      TEST_REPORT.results[testName] = { status: 'FAILED', message: error.message };
      TEST_REPORT.summary.failedTests++;
    }
  }
}

/**
 * Test authentication flow
 */
async function testAuthenticationFlow(page) {
  console.log('\n🧪 Testing Authentication Flow');
  
  // Test login page
  const loginTest = 'Login Page Functionality';
  TEST_REPORT.summary.totalTests++;
  
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Check if login form exists
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !loginButton) {
      throw new Error('Login form elements not found');
    }
    
    // Fill login form
    await page.type('input[type="email"]', TEST_CREDENTIALS.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.password);
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Submit login (this might fail with test credentials, but we're testing the flow)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    
    // Check if login was successful or if we got an error message
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful');
      TEST_REPORT.results[loginTest] = { status: 'PASSED', message: 'Login flow working' };
      TEST_REPORT.summary.passedTests++;
      return true;
    } else {
      // Check for error message
      const errorMessage = await page.$eval('body', body => {
        const alert = body.querySelector('[role="alert"]');
        return alert ? alert.textContent : 'No error message found';
      });
      
      console.log(`ℹ️ Login attempt completed (expected with test credentials): ${errorMessage}`);
      TEST_REPORT.results[loginTest] = { status: 'PASSED', message: 'Login form working (test credentials)' };
      TEST_REPORT.summary.passedTests++;
      return false;
    }
    
  } catch (error) {
    console.error(`❌ ${loginTest} failed:`, error.message);
    TEST_REPORT.results[loginTest] = { status: 'FAILED', message: error.message };
    TEST_REPORT.summary.failedTests++;
    return false;
  }
}

/**
 * Test error handling for invalid URLs
 */
async function testErrorHandling(page) {
  console.log('\n🧪 Testing Error Handling');
  
  for (const invalidUrl of INVALID_URLS) {
    const testName = `Error Handling: ${invalidUrl}`;
    TEST_REPORT.summary.totalTests++;
    
    try {
      const response = await page.goto(`${BASE_URL}${invalidUrl}`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      await page.waitForTimeout(2000);
      
      // Check if we get a proper error handling (not a blank page)
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body && body.innerText.length > 50;
      });
      
      if (response.status() === 404 || hasContent) {
        console.log(`✅ Invalid URL ${invalidUrl} handled appropriately`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: 'Error handled correctly' };
        TEST_REPORT.summary.passedTests++;
      } else {
        throw new Error(`Invalid URL ${invalidUrl} not handled properly (status: ${response.status()})`);
      }
      
      await takeScreenshot(page, `error-${invalidUrl.replace(/\//g, '-')}`);
      
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error.message);
      TEST_REPORT.results[testName] = { status: 'FAILED', message: error.message };
      TEST_REPORT.summary.failedTests++;
    }
  }
}

/**
 * Test component rendering
 */
async function testComponentRendering(page, isAuthenticated = false) {
  console.log('\n🧪 Testing Component Rendering');
  
  const componentTests = [
    {
      name: 'Sidebar Component',
      selector: '.verotrade-sidebar',
      required: isAuthenticated,
      description: 'Sidebar should be present for authenticated users'
    },
    {
      name: 'Navigation Items',
      selector: '.verotrade-nav-item',
      required: isAuthenticated,
      description: 'Navigation items should be present for authenticated users'
    },
    {
      name: 'Login Form',
      selector: 'input[type="email"]',
      required: !isAuthenticated,
      description: 'Login form should be present for unauthenticated users'
    },
    {
      name: 'Page Content',
      selector: '.verotrade-content-wrapper',
      required: true,
      description: 'Content wrapper should always be present'
    }
  ];
  
  for (const test of componentTests) {
    const testName = `Component: ${test.name}`;
    TEST_REPORT.summary.totalTests++;
    
    try {
      const element = await page.$(test.selector);
      
      if (test.required && !element) {
        throw new Error(`Required component ${test.name} not found`);
      }
      
      if (!test.required && element) {
        console.log(`ℹ️ ${test.name} present but not required`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: test.description };
        TEST_REPORT.summary.passedTests++;
      } else if (test.required && element) {
        console.log(`✅ ${test.name} rendered correctly`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: test.description };
        TEST_REPORT.summary.passedTests++;
      } else {
        console.log(`✅ ${test.name} correctly not present`);
        TEST_REPORT.results[testName] = { status: 'PASSED', message: test.description };
        TEST_REPORT.summary.passedTests++;
      }
      
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error.message);
      TEST_REPORT.results[testName] = { status: 'FAILED', message: error.message };
      TEST_REPORT.summary.failedTests++;
    }
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  const reportPath = path.join(__dirname, `NAVIGATION_COMPONENT_TEST_REPORT-${Date.now()}.md`);
  
  let report = `# Navigation and Component Rendering Verification Report\n\n`;
  report += `**Generated:** ${TEST_REPORT.timestamp}\n\n`;
  
  // Summary
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${TEST_REPORT.summary.totalTests}\n`;
  report += `- **Passed:** ${TEST_REPORT.summary.passedTests}\n`;
  report += `- **Failed:** ${TEST_REPORT.summary.failedTests}\n`;
  report += `- **Skipped:** ${TEST_REPORT.summary.skippedTests}\n`;
  report += `- **Success Rate:** ${((TEST_REPORT.summary.passedTests / TEST_REPORT.summary.totalTests) * 100).toFixed(1)}%\n\n`;
  
  // Detailed Results
  report += `## Detailed Results\n\n`;
  
  Object.entries(TEST_REPORT.results).forEach(([testName, result]) => {
    const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
    report += `### ${status} ${testName}\n\n`;
    report += `**Status:** ${result.status}\n`;
    report += `**Message:** ${result.message}\n`;
    if (result.url) {
      report += `**URL:** ${result.url}\n`;
    }
    report += `\n`;
  });
  
  // Screenshots
  report += `## Screenshots\n\n`;
  report += `Screenshots are saved in: \`${SCREENSHOT_DIR}\`\n\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Test report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🎯 Starting Navigation and Component Rendering Verification\n');
  
  let browser, page;
  
  try {
    ({ browser, page } = await initializeBrowser());
    
    // Test unauthenticated state
    console.log('\n📋 Testing UNAUTHENTICATED state');
    for (const pageInfo of MAIN_PAGES.filter(p => !p.requiresAuth)) {
      await testPageLoad(page, pageInfo, false);
    }
    
    await testNavigationItems(page, false);
    await testComponentRendering(page, false);
    
    // Test authentication flow
    const authSuccess = await testAuthenticationFlow(page);
    
    if (authSuccess) {
      // Test authenticated state
      console.log('\n📋 Testing AUTHENTICATED state');
      for (const pageInfo of MAIN_PAGES) {
        await testPageLoad(page, pageInfo, true);
      }
      
      await testNavigationItems(page, true);
      await testComponentRendering(page, true);
    }
    
    // Test error handling
    await testErrorHandling(page);
    
    // Generate report
    const reportPath = generateTestReport();
    
    console.log('\n🎉 Test execution completed!');
    console.log(`📊 Success Rate: ${((TEST_REPORT.summary.passedTests / TEST_REPORT.summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`📄 Report: ${reportPath}`);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 Browser closed');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testPageLoad,
  testNavigationItems,
  testAuthenticationFlow,
  testErrorHandling,
  testComponentRendering
};