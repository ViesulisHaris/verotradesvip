const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * DEFINITIVE AUTHENTICATION FLOW TEST
 * 
 * This test uses the corrected Supabase configuration to verify the complete
 * authentication flow from login to dashboard to sidebar visibility.
 * 
 * Test Credentials: testuser1000@verotrade.com / TestPassword123!
 * Supabase Config: Updated with correct API keys from .env file
 */

// Test configuration with corrected Supabase settings
const config = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'testuser1000@verotrade.com',
    password: 'TestPassword123!'
  },
  supabaseConfig: {
    url: 'https://bzmixuxautbmqbrqtufx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MDYzMiwiZXhwIjoyMDc3ODU2NjMyfQ.pFRbi-LADHU1cdrZjulUIm0NAQWvevCa5QYERbZyI6E'
  },
  screenshotsDir: './definitive-auth-screenshots',
  reportsDir: './definitive-auth-reports',
  timeout: 30000
};

// Comprehensive test results tracking
const testResults = {
  timestamp: new Date().toISOString(),
  supabaseConfig: config.supabaseConfig,
  testCredentials: config.testUser,
  phases: {
    environment: { passed: 0, failed: 0, details: [] },
    authentication: { passed: 0, failed: 0, details: [] },
    dashboard: { passed: 0, failed: 0, details: [] },
    sidebar: { passed: 0, failed: 0, details: [] },
    session: { passed: 0, failed: 0, details: [] }
  },
  screenshots: [],
  networkRequests: [],
  consoleErrors: [],
  summary: { total: 0, passed: 0, failed: 0, passRate: '0%' }
};

// Enhanced logging function
function log(message, phase = 'general', type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] [${phase.toUpperCase()}] ${message}`;
  console.log(logEntry);
  
  if (testResults.phases[phase]) {
    testResults.phases[phase].details.push({
      timestamp,
      type,
      message
    });
  }
}

function logTestResult(testName, passed, details = '', phase = 'general') {
  if (testResults.phases[phase]) {
    testResults.phases[phase].total = (testResults.phases[phase].total || 0) + 1;
    if (passed) {
      testResults.phases[phase].passed++;
      log(`✅ ${testName}: PASSED - ${details}`, phase, 'success');
    } else {
      testResults.phases[phase].failed++;
      log(`❌ ${testName}: FAILED - ${details}`, phase, 'error');
    }
  }
  
  // Update overall summary
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  testResults.summary.passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2) + '%';
}

async function takeScreenshot(page, name, phase = 'general') {
  const screenshotPath = path.join(config.screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  testResults.screenshots.push({
    name,
    path: screenshotPath,
    phase,
    timestamp: new Date().toISOString()
  });
  
  log(`📸 Screenshot saved: ${screenshotPath}`, phase, 'info');
  return screenshotPath;
}

async function waitForNavigation(page, timeout = config.timeout) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    log(`⚠️ Navigation timeout: ${error.message}`, 'general', 'warning');
  }
}

// Phase 1: Environment and Configuration Verification
async function testEnvironmentConfiguration(page) {
  log('\n🔧 PHASE 1: Environment and Configuration Verification', 'environment', 'info');
  
  try {
    // Test 1.1: Verify Supabase configuration is loaded
    log('Testing Supabase configuration loading...', 'environment');
    
    const supabaseConfig = await page.evaluate(() => {
      if (typeof window !== 'undefined' && window.supabase) {
        return {
          url: window.supabase.supabaseUrl,
          hasClient: !!window.supabase,
          clientInitialized: !!window.supabase.auth
        };
      }
      return null;
    });
    
    if (supabaseConfig && supabaseConfig.url) {
      logTestResult('Supabase configuration loaded', true, 
        `URL: ${supabaseConfig.url}`, 'environment');
    } else {
      logTestResult('Supabase configuration loaded', false, 
        'Supabase client not found or not initialized', 'environment');
    }
    
    // Test 1.2: Verify application is running
    await page.goto(config.baseUrl);
    await waitForNavigation(page);
    await takeScreenshot(page, 'home-page-loaded', 'environment');
    
    const homeTitle = await page.title();
    const appRunning = homeTitle && homeTitle.length > 0;
    
    logTestResult('Application running', appRunning, 
      `Title: "${homeTitle}"`, 'environment');
    
    // Test 1.3: Check login page accessibility
    await page.goto(`${config.baseUrl}/login`);
    await waitForNavigation(page);
    await takeScreenshot(page, 'login-page-accessible', 'environment');
    
    const loginUrl = page.url();
    const loginAccessible = loginUrl.includes('/login');
    
    logTestResult('Login page accessible', loginAccessible, 
      `URL: ${loginUrl}`, 'environment');
    
    return true;
  } catch (error) {
    logTestResult('Environment configuration', false, `Exception: ${error.message}`, 'environment');
    return false;
  }
}

// Phase 2: Authentication Flow Testing
async function testAuthenticationFlow(page) {
  log('\n🔐 PHASE 2: Authentication Flow Testing', 'authentication', 'info');
  
  try {
    // Test 2.1: Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await waitForNavigation(page);
    await takeScreenshot(page, 'auth-login-page', 'authentication');
    
    // Test 2.2: Fill login form with valid credentials
    log('Filling login form with valid credentials...', 'authentication');
    
    await page.fill('input[type="email"]', config.testUser.email);
    await page.fill('input[type="password"]', config.testUser.password);
    await takeScreenshot(page, 'auth-form-filled', 'authentication');
    
    // Test 2.3: Monitor network requests during authentication
    const authRequests = [];
    page.on('request', request => {
      if (request.url().includes('supabase.co') || request.url().includes('/auth/')) {
        authRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        testResults.networkRequests.push(...authRequests);
      }
    });
    
    // Test 2.4: Submit login form
    log('Submitting login form...', 'authentication');
    
    const loginStartTime = Date.now();
    await page.click('button[type="submit"]');
    
    // Test 2.5: Wait for authentication response
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      const loginTime = Date.now() - loginStartTime;
      
      await takeScreenshot(page, 'auth-login-success', 'authentication');
      
      const currentUrl = page.url();
      const loginSuccess = currentUrl.includes('/dashboard');
      
      logTestResult('Login with valid credentials', loginSuccess, 
        `Redirected to dashboard in ${loginTime}ms`, 'authentication');
      
      // Test 2.6: Verify authentication cookies
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(cookie => 
        cookie.name.includes('sb-') || 
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth')
      );
      
      logTestResult('Authentication cookies set', authCookies.length > 0, 
        `Found ${authCookies.length} auth cookies`, 'authentication');
      
      // Test 2.7: Check for authentication errors in console
      page.on('console', msg => {
        if (msg.type() === 'error') {
          testResults.consoleErrors.push({
            message: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      return loginSuccess;
      
    } catch (error) {
      await takeScreenshot(page, 'auth-login-failed', 'authentication');
      
      // Check for error message
      const errorElement = await page.$('div[class*="red"], .error, .alert-error');
      const errorMessage = errorElement ? await errorElement.textContent() : 'No error message found';
      
      logTestResult('Login with valid credentials', false, 
        `Failed: ${errorMessage}`, 'authentication');
      
      return false;
    }
  } catch (error) {
    logTestResult('Authentication flow', false, `Exception: ${error.message}`, 'authentication');
    return false;
  }
}

// Phase 3: Dashboard Functionality Testing
async function testDashboardFunctionality(page) {
  log('\n📊 PHASE 3: Dashboard Functionality Testing', 'dashboard', 'info');
  
  try {
    // Test 3.1: Verify dashboard loaded correctly
    const currentUrl = page.url();
    const onDashboard = currentUrl.includes('/dashboard');
    
    if (!onDashboard) {
      await page.goto(`${config.baseUrl}/dashboard`);
      await waitForNavigation(page);
    }
    
    await takeScreenshot(page, 'dashboard-loaded', 'dashboard');
    
    // Test 3.2: Check for dashboard content
    const dashboardContent = await page.evaluate(() => {
      const welcomeElement = document.querySelector('h1, h2, .welcome, [class*="welcome"]');
      const dashboardElement = document.querySelector('[class*="dashboard"]');
      
      return {
        hasWelcome: !!welcomeElement,
        welcomeText: welcomeElement ? welcomeElement.textContent : null,
        hasDashboardClass: !!dashboardElement,
        pageTitle: document.title
      };
    });
    
    logTestResult('Dashboard content loaded', 
      dashboardContent.hasWelcome || dashboardContent.hasDashboardClass, 
      `Welcome: "${dashboardContent.welcomeText}", Title: "${dashboardContent.pageTitle}"`, 
      'dashboard');
    
    // Test 3.3: Check for user-specific elements
    const userElements = await page.evaluate(() => {
      const userMenu = document.querySelector('[class*="user"], [class*="profile"], .avatar');
      const logoutButton = document.querySelector('button:has-text("Logout"), [onclick*="logout"], [class*="logout"]');
      
      return {
        hasUserMenu: !!userMenu,
        hasLogoutButton: !!logoutButton
      };
    });
    
    logTestResult('User-specific elements visible', 
      userElements.hasUserMenu || userElements.hasLogoutButton, 
      `User menu: ${userElements.hasUserMenu}, Logout: ${userElements.hasLogoutButton}`, 
      'dashboard');
    
    // Test 3.4: Test dashboard navigation
    const navigationLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map(link => ({ href: link.href, text: link.textContent.trim() }))
        .filter(link => link.href.includes('/strategies') || link.href.includes('/trades') || link.href.includes('/analytics'));
    });
    
    logTestResult('Dashboard navigation links', navigationLinks.length > 0, 
      `Found ${navigationLinks.length} navigation links`, 'dashboard');
    
    return true;
  } catch (error) {
    logTestResult('Dashboard functionality', false, `Exception: ${error.message}`, 'dashboard');
    return false;
  }
}

// Phase 4: Sidebar Visibility and Functionality Testing
async function testSidebarFunctionality(page) {
  log('\n📋 PHASE 4: Sidebar Visibility and Functionality Testing', 'sidebar', 'info');
  
  try {
    // Test 4.1: Check for sidebar presence
    const sidebarCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar, [class*="sidebar"], aside, nav');
      const sidebarVisible = sidebar && sidebar.offsetParent !== null;
      
      return {
        hasSidebar: !!sidebar,
        sidebarVisible: sidebarVisible,
        sidebarClasses: sidebar ? Array.from(sidebar.classList) : [],
        sidebarTag: sidebar ? sidebar.tagName : null
      };
    });
    
    await takeScreenshot(page, 'sidebar-visibility-check', 'sidebar');
    
    logTestResult('Sidebar presence', sidebarCheck.hasSidebar, 
      `Tag: ${sidebarCheck.sidebarTag}, Classes: ${sidebarCheck.sidebarClasses.join(', ')}`, 
      'sidebar');
    
    logTestResult('Sidebar visibility', sidebarCheck.sidebarVisible, 
      sidebarCheck.sidebarVisible ? 'Sidebar is visible' : 'Sidebar is hidden', 
      'sidebar');
    
    if (sidebarCheck.hasSidebar) {
      // Test 4.2: Check sidebar menu items
      const sidebarMenu = await page.evaluate(() => {
        const sidebar = document.querySelector('.verotrade-sidebar, [class*="sidebar"], aside, nav');
        if (!sidebar) return { items: [] };
        
        const menuItems = Array.from(sidebar.querySelectorAll('a, button, [role="menuitem"]'));
        return {
          items: menuItems.map(item => ({
            text: item.textContent.trim(),
            href: item.href || null,
            tag: item.tagName
          })).filter(item => item.text.length > 0)
        };
      });
      
      logTestResult('Sidebar menu items', sidebarMenu.items.length > 0, 
        `Found ${sidebarMenu.items.length} menu items`, 'sidebar');
      
      // Test 4.3: Check for authenticated-specific menu items
      const authMenuItems = sidebarMenu.items.filter(item => 
        item.text.toLowerCase().includes('logout') ||
        item.text.toLowerCase().includes('profile') ||
        item.text.toLowerCase().includes('dashboard') ||
        item.text.toLowerCase().includes('strategies')
      );
      
      logTestResult('Authenticated menu items', authMenuItems.length > 0, 
        `Found ${authMenuItems.length} authenticated menu items`, 'sidebar');
      
      // Test 4.4: Test logout functionality if present
      const logoutItem = sidebarMenu.items.find(item => 
        item.text.toLowerCase().includes('logout')
      );
      
      if (logoutItem) {
        log('Testing logout functionality...', 'sidebar');
        
        await page.click(`text=${logoutItem.text}`);
        await page.waitForTimeout(2000);
        
        const logoutUrl = page.url();
        const logoutSuccess = logoutUrl.includes('/login');
        
        await takeScreenshot(page, 'logout-result', 'sidebar');
        
        logTestResult('Logout functionality', logoutSuccess, 
          logoutSuccess ? 'Successfully logged out and redirected' : 'Logout failed', 
          'sidebar');
      } else {
        logTestResult('Logout functionality', false, 'Logout menu item not found', 'sidebar');
      }
    }
    
    return true;
  } catch (error) {
    logTestResult('Sidebar functionality', false, `Exception: ${error.message}`, 'sidebar');
    return false;
  }
}

// Phase 5: Session Management Testing
async function testSessionManagement(page) {
  log('\n🔄 PHASE 5: Session Management Testing', 'session', 'info');
  
  try {
    // Test 5.1: Check session persistence
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${config.baseUrl}/login`);
      await page.fill('input[type="email"]', config.testUser.email);
      await page.fill('input[type="password"]', config.testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Test 5.2: Navigate to protected route
    await page.goto(`${config.baseUrl}/strategies`);
    await waitForNavigation(page);
    await takeScreenshot(page, 'session-protected-route', 'session');
    
    const strategiesUrl = page.url();
    const canAccessStrategies = strategiesUrl.includes('/strategies');
    
    logTestResult('Protected route access', canAccessStrategies, 
      canAccessStrategies ? 'Can access protected routes' : 'Redirected from protected route', 
      'session');
    
    // Test 5.3: Test session validation
    const sessionCheck = await page.evaluate(() => {
      // Check for authentication indicators
      const authIndicators = [
        document.querySelector('[class*="user"]'),
        document.querySelector('[class*="profile"]'),
        document.querySelector('button:has-text("Logout")'),
        document.querySelector('.verotrade-sidebar')
      ].filter(Boolean);
      
      return {
        authIndicatorsCount: authIndicators.length,
        hasAuthContext: !!window.supabase,
        localStorageKeys: Object.keys(localStorage || {}),
        sessionStorageKeys: Object.keys(sessionStorage || {})
      };
    });
    
    logTestResult('Session validation', sessionCheck.authIndicatorsCount > 0, 
      `Found ${sessionCheck.authIndicatorsCount} auth indicators`, 'session');
    
    // Test 5.4: Test session expiration simulation (optional)
    log('Session management tests completed', 'session');
    
    return true;
  } catch (error) {
    logTestResult('Session management', false, `Exception: ${error.message}`, 'session');
    return false;
  }
}

// Generate comprehensive report
function generateDefinitiveReport() {
  const report = {
    ...testResults,
    testConfiguration: {
      baseUrl: config.baseUrl,
      testUser: config.testUser.email,
      supabaseUrl: config.supabaseConfig.url,
      testDuration: Date.now() - new Date(testResults.timestamp).getTime()
    },
    phaseSummaries: {},
    recommendations: generateRecommendations(),
    overallStatus: testResults.summary.failed === 0 ? 'SUCCESS' : 'FAILED'
  };
  
  // Calculate phase summaries
  Object.keys(testResults.phases).forEach(phase => {
    const phaseData = testResults.phases[phase];
    const total = phaseData.passed + phaseData.failed;
    report.phaseSummaries[phase] = {
      passed: phaseData.passed,
      failed: phaseData.failed,
      total: total,
      passRate: total > 0 ? ((phaseData.passed / total) * 100).toFixed(2) + '%' : '0%'
    };
  });
  
  // Save JSON report
  const reportPath = path.join(config.reportsDir, `definitive-auth-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(config.reportsDir, `DEFINITIVE_AUTHENTICATION_REPORT_${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  // Print summary
  log('\n🎯 DEFINITIVE AUTHENTICATION TEST SUMMARY', 'general', 'info');
  log('==========================================', 'general', 'info');
  log(`Overall Status: ${report.overallStatus}`, 'general', report.overallStatus === 'SUCCESS' ? 'success' : 'error');
  log(`Total Tests: ${testResults.summary.total}`, 'general', 'info');
  log(`Passed: ${testResults.summary.passed}`, 'general', 'success');
  log(`Failed: ${testResults.summary.failed}`, 'general', 'error');
  log(`Pass Rate: ${testResults.summary.passRate}`, 'general', 'info');
  log(`Test Duration: ${report.testConfiguration.testDuration}ms`, 'general', 'info');
  
  log('\n📊 Phase Results:', 'general', 'info');
  Object.entries(report.phaseSummaries).forEach(([phase, summary]) => {
    log(`  ${phase.toUpperCase()}: ${summary.passed}/${summary.total} (${summary.passRate})`, 'general', 'info');
  });
  
  log(`\n📄 Reports saved to:`, 'general', 'info');
  log(`  JSON: ${reportPath}`, 'general', 'info');
  log(`  Markdown: ${markdownPath}`, 'general', 'info');
  
  if (testResults.consoleErrors.length > 0) {
    log(`\n⚠️ Console Errors Found: ${testResults.consoleErrors.length}`, 'general', 'warning');
    testResults.consoleErrors.forEach(error => {
      log(`  - ${error.message}`, 'general', 'warning');
    });
  }
  
  return report;
}

function generateMarkdownReport(report) {
  let markdown = `# Definitive Authentication Flow Test Report\n\n`;
  markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  markdown += `**Overall Status:** ${report.overallStatus}\n`;
  markdown += `**Test Duration:** ${report.testConfiguration.testDuration}ms\n\n`;
  
  markdown += `## Test Configuration\n\n`;
  markdown += `- **Base URL:** ${report.testConfiguration.baseUrl}\n`;
  markdown += `- **Test User:** ${report.testConfiguration.testUser}\n`;
  markdown += `- **Supabase URL:** ${report.testConfiguration.supabaseUrl}\n\n`;
  
  markdown += `## Executive Summary\n\n`;
  markdown += `- **Total Tests:** ${report.summary.total}\n`;
  markdown += `- **Passed:** ${report.summary.passed}\n`;
  markdown += `- **Failed:** ${report.summary.failed}\n`;
  markdown += `- **Pass Rate:** ${report.summary.passRate}\n\n`;
  
  markdown += `## Phase Results\n\n`;
  markdown += `| Phase | Passed | Failed | Total | Pass Rate |\n`;
  markdown += `|-------|--------|--------|-------|-----------|\n`;
  
  Object.entries(report.phaseSummaries).forEach(([phase, summary]) => {
    markdown += `| ${phase.toUpperCase()} | ${summary.passed} | ${summary.failed} | ${summary.total} | ${summary.passRate} |\n`;
  });
  
  markdown += `\n## Detailed Test Results\n\n`;
  
  Object.entries(report.phases).forEach(([phase, phaseData]) => {
    if (phaseData.details && phaseData.details.length > 0) {
      markdown += `### ${phase.toUpperCase()} Phase\n\n`;
      phaseData.details.forEach(detail => {
        const icon = detail.type === 'success' ? '✅' : detail.type === 'error' ? '❌' : detail.type === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `${icon} ${detail.message}\n`;
      });
      markdown += `\n`;
    }
  });
  
  if (report.screenshots.length > 0) {
    markdown += `## Screenshots\n\n`;
    report.screenshots.forEach(screenshot => {
      markdown += `- **${screenshot.name}** (${screenshot.phase}): ${screenshot.path}\n`;
    });
    markdown += `\n`;
  }
  
  if (report.consoleErrors.length > 0) {
    markdown += `## Console Errors\n\n`;
    report.consoleErrors.forEach(error => {
      markdown += `- ${error.message}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Recommendations\n\n`;
  report.recommendations.forEach(rec => {
    markdown += `- ${rec}\n`;
  });
  
  markdown += `\n---\n`;
  markdown += `*Report generated by Definitive Authentication Flow Test*\n`;
  
  return markdown;
}

function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.summary.failed === 0) {
    recommendations.push('🎉 All authentication tests passed! The system is working correctly.');
    recommendations.push('Consider implementing automated regression testing to maintain this quality.');
  } else {
    recommendations.push('🔧 Address the failed tests to ensure proper authentication functionality.');
    
    if (testResults.phases.environment.failed > 0) {
      recommendations.push('Fix environment configuration issues before testing other components.');
    }
    
    if (testResults.phases.authentication.failed > 0) {
      recommendations.push('Review authentication flow and Supabase configuration.');
    }
    
    if (testResults.phases.sidebar.failed > 0) {
      recommendations.push('Check sidebar component implementation and authentication state integration.');
    }
  }
  
  if (testResults.consoleErrors.length > 0) {
    recommendations.push('Resolve console errors to improve user experience and debugging.');
  }
  
  recommendations.push('Regularly run this definitive test to ensure authentication system reliability.');
  recommendations.push('Monitor Supabase service status and API key validity.');
  
  return recommendations;
}

// Main test execution
async function runDefinitiveAuthenticationTest() {
  log('🚀 STARTING DEFINITIVE AUTHENTICATION FLOW TEST', 'general', 'info');
  log('================================================', 'general', 'info');
  log(`Test User: ${config.testUser.email}`, 'general', 'info');
  log(`Base URL: ${config.baseUrl}`, 'general', 'info');
  log(`Supabase URL: ${config.supabaseConfig.url}`, 'general', 'info');
  
  // Create directories
  if (!fs.existsSync(config.screenshotsDir)) {
    fs.mkdirSync(config.screenshotsDir, { recursive: true });
  }
  if (!fs.existsSync(config.reportsDir)) {
    fs.mkdirSync(config.reportsDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 500 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  try {
    // Execute all test phases
    await testEnvironmentConfiguration(page);
    await testAuthenticationFlow(page);
    await testDashboardFunctionality(page);
    await testSidebarFunctionality(page);
    await testSessionManagement(page);
    
    // Generate final report
    const report = generateDefinitiveReport();
    
    log('\n🏁 DEFINITIVE AUTHENTICATION TEST COMPLETED', 'general', 'info');
    log('=============================================', 'general', 'info');
    
    return report;
    
  } catch (error) {
    log(`💥 Test execution failed: ${error.message}`, 'general', 'error');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run test if executed directly
if (require.main === module) {
  runDefinitiveAuthenticationTest().catch(console.error);
}

module.exports = {
  runDefinitiveAuthenticationTest,
  config,
  testResults
};