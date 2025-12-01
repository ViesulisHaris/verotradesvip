const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  loginUrl: 'http://localhost:3000/login',
  testUser: {
    email: 'testuser1000@verotrade.com',
    password: 'TestPassword123!'
  },
  performanceTargets: {
    loginPageLoad: 3000,      // < 3 seconds
    authentication: 5000,      // < 5 seconds
    dashboardLoad: 3000,      // < 3 seconds
    totalFlow: 11000          // < 11 seconds total
  },
  timeouts: {
    pageLoad: 30000,
    authentication: 15000,
    elementLoad: 10000
  }
};

// Performance metrics storage
let performanceMetrics = {
  loginPageLoad: null,
  authentication: null,
  dashboardLoad: null,
  sidebarRender: null,
  authStatePersistence: null,
  logout: null,
  totalFlow: null,
  timestamps: []
};

// Utility function to measure time
function measureTime() {
  return Date.now();
}

// Utility function to format milliseconds
function formatMs(ms) {
  return `${ms}ms (${(ms / 1000).toFixed(2)}s)`;
}

// Utility function to check if performance meets target
function meetsTarget(actual, target, metricName) {
  const passes = actual <= target;
  console.log(`${passes ? '✅' : '❌'} ${metricName}: ${formatMs(actual)} (target: <${formatMs(target)})`);
  return passes;
}

// Take screenshot for documentation
async function takeScreenshot(page, filename, description) {
  try {
    await page.screenshot({ 
      path: filename,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    performanceMetrics.timestamps.push({
      timestamp: new Date().toISOString(),
      action: description,
      screenshot: filename
    });
  } catch (error) {
    console.log(`⚠️  Could not save screenshot: ${filename}`);
  }
}

// Main test function
async function runComprehensiveAuthTest() {
  console.log('🚀 Starting Comprehensive Authentication Flow Test');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.setRequestInterception(true);
  page.on('request', request => request.continue());
  
  try {
    // Step 1: Navigate to login page and measure load time
    console.log('\n📍 Step 1: Testing Login Page Load Performance');
    console.log('-'.repeat(50));
    
    const loginPageStartTime = measureTime();
    await page.goto(TEST_CONFIG.loginUrl, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeouts.pageLoad 
    });
    
    // Wait for login form to be fully loaded
    await page.waitForSelector('#email', { timeout: TEST_CONFIG.timeouts.elementLoad });
    await page.waitForSelector('#password', { timeout: TEST_CONFIG.timeouts.elementLoad });
    await page.waitForSelector('button[type="submit"]', { timeout: TEST_CONFIG.timeouts.elementLoad });
    
    const loginPageLoadTime = measureTime() - loginPageStartTime;
    performanceMetrics.loginPageLoad = loginPageLoadTime;
    
    meetsTarget(loginPageLoadTime, TEST_CONFIG.performanceTargets.loginPageLoad, 'Login Page Load');
    await takeScreenshot(page, 'auth-flow-test-login-page.png', 'Login page loaded');
    
    // Step 2: Test login with valid credentials and measure authentication time
    console.log('\n🔐 Step 2: Testing Authentication Performance');
    console.log('-'.repeat(50));
    
    // Fill in login form
    await page.type('#email', TEST_CONFIG.testUser.email);
    await page.type('#password', TEST_CONFIG.testUser.password);
    
    const authStartTime = measureTime();
    
    // Click login button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeouts.authentication 
      }),
      page.click('button[type="submit"]')
    ]);
    
    const authTime = measureTime() - authStartTime;
    performanceMetrics.authentication = authTime;
    
    meetsTarget(authTime, TEST_CONFIG.performanceTargets.authentication, 'Authentication');
    
    // Verify we're on dashboard page
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/trades')) {
      console.log('✅ Successfully redirected to dashboard after login');
    } else {
      console.log(`❌ Unexpected redirect after login: ${currentUrl}`);
    }
    
    // Step 3: Verify dashboard load time
    console.log('\n📊 Step 3: Testing Dashboard Load Performance');
    console.log('-'.repeat(50));
    
    const dashboardStartTime = measureTime();
    
    // Wait for dashboard elements to load
    try {
      await page.waitForSelector('[data-testid="dashboard-container"], .dashboard, main', { 
        timeout: TEST_CONFIG.timeouts.elementLoad 
      });
    } catch (error) {
      // Try alternative selectors
      await page.waitForSelector('h1, .title, [role="heading"]', { 
        timeout: 5000 
      });
    }
    
    const dashboardLoadTime = measureTime() - dashboardStartTime;
    performanceMetrics.dashboardLoad = dashboardLoadTime;
    
    meetsTarget(dashboardLoadTime, TEST_CONFIG.performanceTargets.dashboardLoad, 'Dashboard Load');
    await takeScreenshot(page, 'auth-flow-test-dashboard.png', 'Dashboard loaded after login');
    
    // Step 4: Confirm sidebar visibility and functionality
    console.log('\n🎛️  Step 4: Testing Sidebar Visibility and Functionality');
    console.log('-'.repeat(50));
    
    const sidebarStartTime = measureTime();
    
    // Check for sidebar elements
    const sidebarSelectors = [
      '[data-testid="sidebar"]',
      '.sidebar',
      'nav',
      '[role="navigation"]'
    ];
    
    let sidebarFound = false;
    for (const selector of sidebarSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        sidebarFound = true;
        console.log(`✅ Sidebar found with selector: ${selector}`);
        break;
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!sidebarFound) {
      console.log('❌ Sidebar not found with any known selector');
    }
    
    // Test sidebar functionality - look for navigation links
    const navLinks = await page.$$eval('a[href]', links => 
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      })).filter(link => link.text && link.href)
    );
    
    console.log(`📋 Found ${navLinks.length} navigation links in sidebar`);
    navLinks.forEach(link => {
      console.log(`   - ${link.text} (${link.href})`);
    });
    
    const sidebarRenderTime = measureTime() - sidebarStartTime;
    performanceMetrics.sidebarRender = sidebarRenderTime;
    console.log(`⏱️  Sidebar detection time: ${formatMs(sidebarRenderTime)}`);
    
    await takeScreenshot(page, 'auth-flow-test-sidebar.png', 'Sidebar visibility test');
    
    // Step 5: Test authentication state persistence
    console.log('\n💾 Step 5: Testing Authentication State Persistence');
    console.log('-'.repeat(50));
    
    const persistenceStartTime = measureTime();
    
    // Refresh the page to test persistence
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Wait for page to load and check if user is still authenticated
    try {
      await page.waitForSelector('[data-testid="user-menu"], .user-menu, .avatar', { 
        timeout: TEST_CONFIG.timeouts.elementLoad 
      });
      console.log('✅ Authentication state persisted after page refresh');
    } catch (error) {
      // Check if we're still on dashboard/trades page (not redirected to login)
      const currentUrlAfterRefresh = page.url();
      if (currentUrlAfterRefresh.includes('/login')) {
        console.log('❌ Authentication state lost - redirected to login');
      } else {
        console.log('✅ Authentication state persisted - still on authenticated page');
      }
    }
    
    const persistenceTime = measureTime() - persistenceStartTime;
    performanceMetrics.authStatePersistence = persistenceTime;
    console.log(`⏱️  Authentication state persistence test time: ${formatMs(persistenceTime)}`);
    
    await takeScreenshot(page, 'auth-flow-test-persistence.png', 'After page refresh');
    
    // Step 6: Test logout functionality
    console.log('\n🚪 Step 6: Testing Logout Functionality');
    console.log('-'.repeat(50));
    
    const logoutStartTime = measureTime();
    
    // Look for logout button/link
    const logoutSelectors = [
      '[data-testid="logout-button"]',
      'button[aria-label*="logout"]',
      'a[href*="logout"]',
      'button:contains("Logout")',
      'button:contains("Sign out")'
    ];
    
    let logoutButtonFound = false;
    for (const selector of logoutSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          logoutButtonFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // If no specific logout button found, try to find it via text content
    if (!logoutButtonFound) {
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const logoutButton = buttons.find(btn => 
            btn.textContent.toLowerCase().includes('logout') ||
            btn.textContent.toLowerCase().includes('sign out')
          );
          if (logoutButton) logoutButton.click();
        });
        logoutButtonFound = true;
      } catch (error) {
        console.log('❌ Could not find or click logout button');
      }
    }
    
    if (logoutButtonFound) {
      // Wait for logout to complete and redirect to login
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeouts.authentication 
      });
      
      const logoutTime = measureTime() - logoutStartTime;
      performanceMetrics.logout = logoutTime;
      
      // Verify we're back on login page
      const finalUrl = page.url();
      if (finalUrl.includes('/login')) {
        console.log('✅ Logout successful - redirected to login page');
        meetsTarget(logoutTime, TEST_CONFIG.performanceTargets.authentication, 'Logout');
      } else {
        console.log(`❌ Unexpected redirect after logout: ${finalUrl}`);
      }
    } else {
      console.log('❌ Logout button not found - logout test skipped');
      performanceMetrics.logout = null;
    }
    
    await takeScreenshot(page, 'auth-flow-test-logout.png', 'After logout');
    
    // Step 7: Calculate total flow performance
    console.log('\n📈 Step 7: Total Authentication Flow Performance');
    console.log('-'.repeat(50));
    
    const totalFlowTime = (performanceMetrics.loginPageLoad || 0) + 
                         (performanceMetrics.authentication || 0) + 
                         (performanceMetrics.dashboardLoad || 0);
    
    performanceMetrics.totalFlow = totalFlowTime;
    meetsTarget(totalFlowTime, TEST_CONFIG.performanceTargets.totalFlow, 'Total Authentication Flow');
    
    // Step 8: Generate comprehensive performance report
    console.log('\n📊 Step 8: Comprehensive Performance Report');
    console.log('=' .repeat(60));
    
    const report = {
      testDate: new Date().toISOString(),
      testConfig: TEST_CONFIG,
      performanceMetrics: performanceMetrics,
      targetsMet: {
        loginPageLoad: performanceMetrics.loginPageLoad ? 
          performanceMetrics.loginPageLoad <= TEST_CONFIG.performanceTargets.loginPageLoad : false,
        authentication: performanceMetrics.authentication ? 
          performanceMetrics.authentication <= TEST_CONFIG.performanceTargets.authentication : false,
        dashboardLoad: performanceMetrics.dashboardLoad ? 
          performanceMetrics.dashboardLoad <= TEST_CONFIG.performanceTargets.dashboardLoad : false,
        totalFlow: performanceMetrics.totalFlow ? 
          performanceMetrics.totalFlow <= TEST_CONFIG.performanceTargets.totalFlow : false
      },
      overallSuccess: false,
      screenshots: performanceMetrics.timestamps
    };
    
    // Calculate overall success
    const criticalMetrics = ['loginPageLoad', 'authentication', 'dashboardLoad'];
    report.overallSuccess = criticalMetrics.every(metric => 
      performanceMetrics[metric] && report.targetsMet[metric]
    );
    
    // Save detailed report
    fs.writeFileSync(
      'comprehensive-auth-flow-test-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Display summary
    console.log('\n📋 PERFORMANCE SUMMARY:');
    console.log('-'.repeat(40));
    console.log(`Login Page Load: ${formatMs(performanceMetrics.loginPageLoad || 0)}`);
    console.log(`Authentication: ${formatMs(performanceMetrics.authentication || 0)}`);
    console.log(`Dashboard Load: ${formatMs(performanceMetrics.dashboardLoad || 0)}`);
    console.log(`Sidebar Render: ${formatMs(performanceMetrics.sidebarRender || 0)}`);
    console.log(`Auth Persistence: ${formatMs(performanceMetrics.authStatePersistence || 0)}`);
    console.log(`Logout: ${formatMs(performanceMetrics.logout || 0)}`);
    console.log(`Total Flow: ${formatMs(performanceMetrics.totalFlow || 0)}`);
    
    console.log('\n🎯 TARGETS MET:');
    console.log('-'.repeat(40));
    Object.entries(report.targetsMet).forEach(([metric, met]) => {
      console.log(`${met ? '✅' : '❌'} ${metric}`);
    });
    
    console.log(`\n🏆 OVERALL SUCCESS: ${report.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('\n📸 Screenshots saved:');
    performanceMetrics.timestamps.forEach(ts => {
      console.log(`   - ${ts.screenshot}: ${ts.action}`);
    });
    
    console.log('\n📄 Detailed report saved to: comprehensive-auth-flow-test-report.json');
    
    return report;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Take error screenshot
    await takeScreenshot(page, 'auth-flow-test-error.png', 'Error state');
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveAuthTest()
    .then(report => {
      console.log('\n✅ Comprehensive authentication flow test completed');
      process.exit(report.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Comprehensive authentication flow test failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveAuthTest, TEST_CONFIG };