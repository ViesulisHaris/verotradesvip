const puppeteer = require('puppeteer');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testEmail: 'testuser@verotrade.com',
  testPassword: 'TestPassword123!',
  headless: false,
  slowMo: 200,
  timeout: 30000
};

// Test results
const results = {
  loginPageLoaded: false,
  loginSuccessful: false,
  dashboardLoaded: false,
  sidebarExists: false,
  sidebarVisible: false,
  authContextWorking: false,
  errors: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

function logError(message, error) {
  log(message, 'error');
  results.errors.push({ message, error: error?.message || error });
  console.error(error);
}

async function takeScreenshot(page, name) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auth-diagnosis-${name}-${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    log(`Screenshot saved: ${filename}`);
  } catch (error) {
    logError('Failed to take screenshot', error);
  }
}

async function diagnoseAuthenticationFlow() {
  log('Starting Authentication & Sidebar Diagnosis...');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('AuthContext') || 
          msg.text().includes('auth') || 
          msg.text().includes('user') ||
          msg.text().includes('sidebar')) {
        log(`[Console] ${msg.text()}`);
      }
    });
    
    log('Step 1: Testing login page access...');
    
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseURL}/login`, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if login page loaded correctly
    const loginForm = await page.$('form[class*="login-form"]');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (loginForm && emailInput && passwordInput) {
      log('✅ Login page loaded successfully');
      results.loginPageLoaded = true;
    } else {
      log('❌ Login page elements missing');
      results.errors.push('Login page form elements not found');
    }
    
    await takeScreenshot(page, 'login-page-loaded');
    
    log('Step 2: Testing authentication...');
    
    // Fill in credentials
    await page.type('input[type="email"]', TEST_CONFIG.testEmail, { delay: 100 });
    await page.type('input[type="password"]', TEST_CONFIG.testPassword, { delay: 100 });
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Submit login form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_CONFIG.timeout }),
      page.click('button[type="submit"]')
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if redirected to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      log('✅ Login successful, redirected to dashboard');
      results.loginSuccessful = true;
    } else {
      log(`❌ Login failed or redirect failed. Current URL: ${currentUrl}`);
      results.errors.push(`Login redirect failed. URL: ${currentUrl}`);
    }
    
    await takeScreenshot(page, 'after-login-attempt');
    
    if (!results.loginSuccessful) {
      log('Cannot proceed with dashboard and sidebar tests due to login failure');
      return results;
    }
    
    log('Step 3: Testing dashboard access...');
    
    // Check dashboard content
    const dashboardTitle = await page.$('h1');
    const dashboardCards = await page.$('div[style*="gridTemplateColumns"]');
    
    if (dashboardTitle && dashboardCards) {
      log('✅ Dashboard content loaded');
      results.dashboardLoaded = true;
    } else {
      log('❌ Dashboard content not loaded properly');
      results.errors.push('Dashboard content missing');
    }
    
    await takeScreenshot(page, 'dashboard-loaded');
    
    log('Step 4: Testing sidebar visibility...');
    
    // Wait a bit more for sidebar to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for sidebar element
    const sidebar = await page.$('aside[class*="sidebar"]');
    
    if (sidebar) {
      log('✅ Sidebar element found in DOM');
      results.sidebarExists = true;
      
      // Check if sidebar is actually visible
      const sidebarVisibility = await page.evaluate(() => {
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        if (!sidebar) return { visible: false, reason: 'Sidebar element not found' };
        
        const styles = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        
        return {
          display: styles.display !== 'none',
          visibility: styles.visibility !== 'hidden',
          opacity: parseFloat(styles.opacity) > 0.1,
          width: rect.width > 0,
          height: rect.height > 0,
          transform: !styles.transform.includes('translateX(-100%)'),
          zIndex: parseInt(styles.zIndex) > 0,
          actualWidth: rect.width,
          actualHeight: rect.height,
          actualTransform: styles.transform,
          actualDisplay: styles.display
        };
      });
      
      log('Sidebar visibility details:');
      console.log(sidebarVisibility);
      
      // Consider sidebar visible if most checks pass
      const visibleChecks = [
        sidebarVisibility.display,
        sidebarVisibility.visibility,
        sidebarVisibility.opacity,
        sidebarVisibility.width > 50, // At least 50px (collapsed state)
        sidebarVisibility.height > 100,
        sidebarVisibility.transform,
        sidebarVisibility.zIndex > 0
      ];
      
      const visibleCount = visibleChecks.filter(Boolean).length;
      
      if (visibleCount >= 5) {
        log('✅ Sidebar is visible for authenticated user');
        results.sidebarVisible = true;
      } else {
        log(`❌ Sidebar not properly visible (${visibleCount}/6 checks passed)`);
        results.errors.push(`Sidebar visibility issues: ${visibleCount}/6 checks passed`);
      }
      
      // Check for navigation items
      const navItems = await page.evaluate(() => {
        const navLinks = document.querySelectorAll('aside a[href*="/dashboard"], aside a[href*="/trades"], aside a[href*="/strategies"]');
        return navLinks.length;
      });
      
      log(`Found ${navItems} navigation items in sidebar`);
      
      // Check for logout button
      const logoutButton = await page.$('button[aria-label*="logout"], button:contains("Logout"), button:contains("Sign Out")');
      if (logoutButton) {
        log('✅ Logout button found in sidebar');
      } else {
        log('❌ Logout button not found in sidebar');
      }
      
      // Check for user area
      const userArea = await page.$('div[class*="user"], div[class*="avatar"]');
      if (userArea) {
        log('✅ User area found in sidebar');
      } else {
        log('❌ User area not found in sidebar');
      }
      
    } else {
      log('❌ Sidebar element not found in DOM');
      results.errors.push('Sidebar element completely missing');
    }
    
    await takeScreenshot(page, 'sidebar-visibility-check');
    
    log('Step 5: Testing authentication context...');
    
    // Check authentication state
    const authState = await page.evaluate(() => {
      // Check for any authentication indicators
      const hasLogoutButton = !!document.querySelector('button[aria-label*="logout"], button:contains("Logout")');
      const hasUserAvatar = !!document.querySelector('[class*="user"], [class*="avatar"]');
      const hasSidebar = !!document.querySelector('aside[class*="sidebar"]');
      
      // Check for any error messages or login prompts
      const hasLoginPrompt = !!document.querySelector('input[type="password"]');
      const hasAuthError = !!document.querySelector('.error-message, [class*="error"]');
      
      return {
        hasLogoutButton,
        hasUserAvatar,
        hasSidebar,
        hasLoginPrompt,
        hasAuthError,
        currentPath: window.location.pathname
      };
    });
    
    log('Authentication state check:');
    console.log(authState);
    
    if (authState.hasSidebar && authState.hasLogoutButton && !authState.hasLoginPrompt) {
      log('✅ Authentication context working properly');
      results.authContextWorking = true;
    } else {
      log('❌ Authentication context not working properly');
      results.errors.push('Authentication context issues detected');
    }
    
    await takeScreenshot(page, 'auth-state-check');
    
  } catch (error) {
    logError('Diagnosis failed', error);
  } finally {
    if (page) {
      await takeScreenshot(page, 'final-state');
    }
    if (browser) {
      await browser.close();
    }
  }
  
  return results;
}

function generateDiagnosisReport(results) {
  log('\n=== AUTHENTICATION & SIDEBAR DIAGNOSIS REPORT ===\n');
  
  const totalChecks = 6;
  const passedChecks = [
    results.loginPageLoaded,
    results.loginSuccessful,
    results.dashboardLoaded,
    results.sidebarExists,
    results.sidebarVisible,
    results.authContextWorking
  ].filter(Boolean).length;
  
  log(`Tests Passed: ${passedChecks}/${totalChecks}`);
  log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
  
  log('\nDetailed Results:');
  log(`✅ Login Page Access: ${results.loginPageLoaded ? 'PASS' : 'FAIL'}`);
  log(`✅ Login Successful: ${results.loginSuccessful ? 'PASS' : 'FAIL'}`);
  log(`✅ Dashboard Loaded: ${results.dashboardLoaded ? 'PASS' : 'FAIL'}`);
  log(`✅ Sidebar Exists: ${results.sidebarExists ? 'PASS' : 'FAIL'}`);
  log(`✅ Sidebar Visible: ${results.sidebarVisible ? 'PASS' : 'FAIL'}`);
  log(`✅ Auth Context Working: ${results.authContextWorking ? 'PASS' : 'FAIL'}`);
  
  if (results.errors.length > 0) {
    log('\nErrors encountered:');
    results.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.message}`, 'error');
    });
  }
  
  // Critical issue identification
  if (!results.sidebarVisible) {
    log('\n🚨 CRITICAL ISSUE IDENTIFIED:');
    log('The sidebar is NOT VISIBLE for authenticated users!');
    log('This is the main issue that needs to be resolved.');
    log('\nMost likely causes:');
    log('1. UnifiedSidebar component returns null when user is authenticated');
    log('2. Sidebar visibility state management issues');
    log('3. Layout conflicts between login page and dashboard');
    log('4. Authentication context timing issues');
    log('5. CSS/styling issues hiding the sidebar');
  }
  
  return {
    totalChecks,
    passedChecks,
    successRate: (passedChecks / totalChecks) * 100,
    criticalIssues: !results.sidebarVisible,
    results
  };
}

// Run the diagnosis
if (require.main === module) {
  diagnoseAuthenticationFlow()
    .then(report => {
      log('\nDiagnosis complete!');
      
      if (report.criticalIssues) {
        process.exit(1); // Exit with error code for critical issues
      } else {
        process.exit(0); // Exit successfully for no critical issues
      }
    })
    .catch(error => {
      logError('Diagnosis execution failed', error);
      process.exit(1);
    });
}

module.exports = {
  diagnoseAuthenticationFlow,
  generateDiagnosisReport,
  TEST_CONFIG
};