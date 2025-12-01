const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * FOCUSED AUTHENTICATION TEST
 * 
 * A streamlined test that focuses on the core authentication flow
 * with shorter timeouts and better error handling for slow-loading pages.
 */

// Simplified configuration with shorter timeouts
const config = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'testuser1000@verotrade.com',
    password: 'TestPassword123!'
  },
  screenshotsDir: './focused-auth-screenshots',
  timeout: 10000 // Reduced timeout
};

// Test results tracking
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  screenshots: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logEntry);
}

function logTestResult(testName, passed, details = '') {
  const result = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    log(`✅ ${testName}: PASSED - ${details}`, 'success');
  } else {
    testResults.summary.failed++;
    log(`❌ ${testName}: FAILED - ${details}`, 'error');
  }
}

async function takeScreenshot(page, name) {
  try {
    const screenshotPath = path.join(config.screenshotsDir, `${name}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false }); // Don't wait for full page
    testResults.screenshots.push({ name, path: screenshotPath });
    log(`📸 Screenshot: ${screenshotPath}`, 'info');
    return screenshotPath;
  } catch (error) {
    log(`⚠️ Screenshot failed: ${error.message}`, 'warning');
    return null;
  }
}

async function quickNavigate(page, url, description = '') {
  try {
    log(`Navigating to: ${url} ${description}`, 'info');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.timeout });
    await page.waitForTimeout(2000); // Brief wait for content to settle
    return true;
  } catch (error) {
    log(`Navigation failed: ${error.message}`, 'error');
    return false;
  }
}

// Main authentication test
async function runFocusedAuthenticationTest() {
  log('🚀 STARTING FOCUSED AUTHENTICATION TEST', 'info');
  log('=======================================', 'info');
  
  // Create screenshots directory
  if (!fs.existsSync(config.screenshotsDir)) {
    fs.mkdirSync(config.screenshotsDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // Faster actions
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Basic application accessibility
    log('\n📋 Test 1: Application Accessibility', 'info');
    const homeAccessible = await quickNavigate(page, config.baseUrl, 'Home page');
    await takeScreenshot(page, 'home-page');
    logTestResult('Home page accessible', homeAccessible, homeAccessible ? 'Page loaded' : 'Page failed to load');
    
    // Test 2: Login page accessibility
    log('\n📋 Test 2: Login Page Accessibility', 'info');
    const loginAccessible = await quickNavigate(page, `${config.baseUrl}/login`, 'Login page');
    await takeScreenshot(page, 'login-page');
    logTestResult('Login page accessible', loginAccessible, loginAccessible ? 'Login page loaded' : 'Login page failed');
    
    if (!loginAccessible) {
      log('❌ Cannot proceed with authentication tests - login page not accessible', 'error');
      return generateReport();
    }
    
    // Test 3: Form interaction
    log('\n📋 Test 3: Login Form Interaction', 'info');
    try {
      // Wait for form elements
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      
      // Fill form
      await page.fill('input[type="email"]', config.testUser.email);
      await page.fill('input[type="password"]', config.testUser.password);
      await takeScreenshot(page, 'login-form-filled');
      
      logTestResult('Login form interaction', true, 'Form filled successfully');
    } catch (error) {
      logTestResult('Login form interaction', false, `Form interaction failed: ${error.message}`);
      return generateReport();
    }
    
    // Test 4: Authentication attempt
    log('\n📋 Test 4: Authentication Attempt', 'info');
    try {
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for response (either success or error)
      await page.waitForTimeout(5000);
      
      // Check current state
      const currentUrl = page.url();
      await takeScreenshot(page, 'auth-result');
      
      // Determine if login was successful
      const loginSuccess = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
      
      if (loginSuccess) {
        logTestResult('Authentication attempt', true, `Redirected to: ${currentUrl}`);
        
        // Test 5: Dashboard verification
        log('\n📋 Test 5: Dashboard Verification', 'info');
        
        // Navigate to dashboard if not already there
        if (!currentUrl.includes('/dashboard')) {
          await quickNavigate(page, `${config.baseUrl}/dashboard`, 'Dashboard');
        }
        
        await takeScreenshot(page, 'dashboard-verification');
        
        // Check for dashboard elements
        const dashboardCheck = await page.evaluate(() => {
          const indicators = [
            document.querySelector('h1, h2'),
            document.querySelector('[class*="dashboard"]'),
            document.querySelector('[class*="welcome"]'),
            document.querySelector('.verotrade-sidebar')
          ].filter(Boolean);
          
          return {
            hasContent: indicators.length > 0,
            indicatorsCount: indicators.length,
            title: document.title
          };
        });
        
        logTestResult('Dashboard verification', dashboardCheck.hasContent, 
          `Found ${dashboardCheck.indicatorsCount} dashboard indicators`);
        
        // Test 6: Sidebar verification
        log('\n📋 Test 6: Sidebar Verification', 'info');
        
        const sidebarCheck = await page.evaluate(() => {
          const sidebar = document.querySelector('.verotrade-sidebar, [class*="sidebar"], aside, nav');
          const menuItems = sidebar ? 
            Array.from(sidebar.querySelectorAll('a, button')).filter(item => item.textContent.trim().length > 0) : [];
          
          return {
            hasSidebar: !!sidebar,
            menuItemsCount: menuItems.length,
            menuItems: menuItems.slice(0, 5).map(item => item.textContent.trim()) // First 5 items
          };
        });
        
        await takeScreenshot(page, 'sidebar-verification');
        
        logTestResult('Sidebar presence', sidebarCheck.hasSidebar, 
          sidebarCheck.hasSidebar ? `Sidebar found with ${sidebarCheck.menuItemsCount} menu items` : 'No sidebar found');
        
        if (sidebarCheck.hasSidebar) {
          logTestResult('Sidebar menu items', sidebarCheck.menuItemsCount > 0, 
            `Menu items: ${sidebarCheck.menuItems.join(', ')}`);
        }
        
        // Test 7: Logout functionality
        log('\n📋 Test 7: Logout Functionality', 'info');
        
        const logoutCheck = await page.evaluate(() => {
          const logoutButton = document.querySelector('button:has-text("Logout"), [onclick*="logout"], [class*="logout"]');
          return !!logoutButton;
        });
        
        if (logoutCheck) {
          await page.click('button:has-text("Logout"), [onclick*="logout"], [class*="logout"]');
          await page.waitForTimeout(3000);
          
          const logoutUrl = page.url();
          const logoutSuccess = logoutUrl.includes('/login');
          
          await takeScreenshot(page, 'logout-result');
          
          logTestResult('Logout functionality', logoutSuccess, 
            logoutSuccess ? 'Successfully logged out' : 'Logout failed');
        } else {
          logTestResult('Logout functionality', false, 'Logout button not found');
        }
        
      } else {
        // Check for error message
        const errorCheck = await page.evaluate(() => {
          const errorElement = document.querySelector('.error, [class*="red"], [class*="alert"]');
          return errorElement ? errorElement.textContent.trim() : null;
        });
        
        logTestResult('Authentication attempt', false, 
          errorCheck ? `Login failed with error: ${errorCheck}` : 'Login failed without clear error message');
      }
      
    } catch (error) {
      logTestResult('Authentication attempt', false, `Exception: ${error.message}`);
    }
    
    return generateReport();
    
  } catch (error) {
    log(`💥 Test execution failed: ${error.message}`, 'error');
    return generateReport();
  } finally {
    await browser.close();
  }
}

function generateReport() {
  const endTime = new Date();
  const duration = endTime - new Date(testResults.startTime);
  
  const report = {
    ...testResults,
    endTime: endTime.toISOString(),
    duration: `${duration}ms`,
    passRate: testResults.summary.total > 0 ? 
      ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2) + '%' : '0%'
  };
  
  // Save report
  const reportPath = path.join(config.screenshotsDir, `focused-auth-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  log('\n🎯 FOCUSED AUTHENTICATION TEST SUMMARY', 'info');
  log('=====================================', 'info');
  log(`Duration: ${report.duration}`, 'info');
  log(`Total Tests: ${report.summary.total}`, 'info');
  log(`Passed: ${report.summary.passed}`, 'success');
  log(`Failed: ${report.summary.failed}`, 'error');
  log(`Pass Rate: ${report.passRate}`, 'info');
  log(`Report saved: ${reportPath}`, 'info');
  
  // Print test details
  log('\n📋 Test Results:', 'info');
  report.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    log(`  ${status} ${test.name}: ${test.details}`, 'info');
  });
  
  // Print recommendations
  log('\n💡 Recommendations:', 'info');
  if (report.summary.failed === 0) {
    log('  🎉 All tests passed! Authentication system is working correctly.', 'success');
  } else {
    log('  🔧 Address the failed tests to ensure proper authentication functionality.', 'error');
    
    const failedTests = report.tests.filter(t => !t.passed);
    failedTests.forEach(test => {
      log(`    - ${test.name}: ${test.details}`, 'error');
    });
  }
  
  log('  📸 Screenshots saved in: ' + config.screenshotsDir, 'info');
  
  return report;
}

// Run the test
if (require.main === module) {
  runFocusedAuthenticationTest().catch(console.error);
}

module.exports = { runFocusedAuthenticationTest, config, testResults };