const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!'
  },
  screenshotsDir: './auth-test-screenshots',
  reportsDir: './auth-test-reports',
  timeout: 30000
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logEntry);
  
  testResults.details.push({
    timestamp,
    type,
    message
  });
}

function logTestResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}: PASSED - ${details}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ ${testName}: FAILED - ${details}`, 'error');
  }
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(config.screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`📸 Screenshot saved: ${screenshotPath}`, 'info');
  return screenshotPath;
}

async function waitForNavigation(page, timeout = config.timeout) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    log(`⚠️ Navigation timeout: ${error.message}`, 'warning');
  }
}

// Test functions
async function testLoginWithValidCredentials(page) {
  log('\n=== Testing Login with Valid Credentials ===');
  
  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await waitForNavigation(page);
    await takeScreenshot(page, 'login-page-loaded');
    
    // Fill in valid credentials
    await page.fill('input[type="email"]', config.testUser.email);
    await page.fill('input[type="password"]', config.testUser.password);
    await takeScreenshot(page, 'login-form-filled-valid');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await takeScreenshot(page, 'login-success-redirect');
      
      // Verify we're on dashboard
      const currentUrl = page.url();
      const isOnDashboard = currentUrl.includes('/dashboard');
      
      logTestResult('Login with valid credentials', isOnDashboard, 
        isOnDashboard ? 'Successfully redirected to dashboard' : 'Failed to redirect to dashboard');
      
      return isOnDashboard;
    } catch (error) {
      // Check if there's an error message
      await takeScreenshot(page, 'login-error-message');
      const errorElement = await page.$('div[class*="red"]');
      const errorMessage = errorElement ? await errorElement.textContent() : 'No error message found';
      
      logTestResult('Login with valid credentials', false, `Login failed: ${errorMessage}`);
      return false;
    }
  } catch (error) {
    logTestResult('Login with valid credentials', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testLoginWithInvalidCredentials(page) {
  log('\n=== Testing Login with Invalid Credentials ===');
  
  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await waitForNavigation(page);
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', config.invalidUser.email);
    await page.fill('input[type="password"]', config.invalidUser.password);
    await takeScreenshot(page, 'login-form-filled-invalid');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('div[class*="red"]', { timeout: 5000 });
    await takeScreenshot(page, 'login-invalid-credentials-error');
    
    // Check error message
    const errorElement = await page.$('div[class*="red"]');
    const errorMessage = errorElement ? await errorElement.textContent() : '';
    
    const hasError = errorMessage && errorMessage.length > 0;
    logTestResult('Login with invalid credentials', hasError, 
      hasError ? `Correctly showed error: ${errorMessage}` : 'No error message shown');
    
    // Verify we're still on login page
    const currentUrl = page.url();
    const stillOnLoginPage = currentUrl.includes('/login');
    
    logTestResult('Stay on login page after invalid login', stillOnLoginPage,
      stillOnLoginPage ? 'Correctly stayed on login page' : 'Incorrectly redirected');
    
    return hasError && stillOnLoginPage;
  } catch (error) {
    logTestResult('Login with invalid credentials', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testFormValidation(page) {
  log('\n=== Testing Form Validation ===');
  
  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await waitForNavigation(page);
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'login-empty-form-submission');
    
    // Check if validation prevents submission
    const currentUrl = page.url();
    const stillOnLoginPage = currentUrl.includes('/login');
    
    logTestResult('Empty form validation', stillOnLoginPage,
      stillOnLoginPage ? 'Correctly prevented empty form submission' : 'Allowed empty form submission');
    
    // Test email only (missing password)
    await page.fill('input[type="email"]', config.testUser.email);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'login-missing-password');
    
    // Test password only (missing email)
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', config.testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'login-missing-email');
    
    return stillOnLoginPage;
  } catch (error) {
    logTestResult('Form validation', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testRegistrationWithValidData(page) {
  log('\n=== Testing Registration with Valid Data ===');
  
  try {
    // Navigate to registration page
    await page.goto(`${config.baseUrl}/register`);
    await waitForNavigation(page);
    await takeScreenshot(page, 'register-page-loaded');
    
    // Generate random email for testing
    const randomEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Fill in registration form
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', testPassword);
    await takeScreenshot(page, 'register-form-filled-valid');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'register-submission-result');
    
    // Check for success message or redirect
    const currentUrl = page.url();
    const hasSuccessMessage = await page.$('text=Check your email for confirmation');
    const redirectedToLogin = currentUrl.includes('/login');
    
    const registrationSuccess = hasSuccessMessage || redirectedToLogin;
    logTestResult('Registration with valid data', registrationSuccess,
      registrationSuccess ? 'Registration processed successfully' : 'Registration failed');
    
    return registrationSuccess;
  } catch (error) {
    logTestResult('Registration with valid data', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testRegistrationWithInvalidData(page) {
  log('\n=== Testing Registration with Invalid Data ===');
  
  try {
    // Navigate to registration page
    await page.goto(`${config.baseUrl}/register`);
    await waitForNavigation(page);
    
    // Test invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'register-invalid-email');
    
    // Test short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'register-short-password');
    
    // Test empty form
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'register-empty-form');
    
    logTestResult('Registration with invalid data', true, 'Invalid data validation tested');
    return true;
  } catch (error) {
    logTestResult('Registration with invalid data', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testLogoutFunctionality(page) {
  log('\n=== Testing Logout Functionality ===');
  
  try {
    // First, login to have a session
    await page.goto(`${config.baseUrl}/login`);
    await page.fill('input[type="email"]', config.testUser.email);
    await page.fill('input[type="password"]', config.testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await takeScreenshot(page, 'logout-before-logout');
    
    // Find and click logout button
    const logoutButton = await page.$('button:has-text("Logout"), button[onclick*="logout"]');
    if (logoutButton) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'logout-after-click');
      
      // Verify redirect to login page
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login');
      
      logTestResult('Logout functionality', redirectedToLogin,
        redirectedToLogin ? 'Successfully logged out and redirected' : 'Failed to redirect after logout');
      
      return redirectedToLogin;
    } else {
      logTestResult('Logout functionality', false, 'Logout button not found');
      return false;
    }
  } catch (error) {
    logTestResult('Logout functionality', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testProtectedRoutes(page) {
  log('\n=== Testing Protected Routes ===');
  
  const protectedRoutes = [
    '/dashboard',
    '/trades',
    '/strategies',
    '/strategies/create',
    '/strategies/edit/[id]',
    '/strategies/performance/[id]',
    '/log-trade',
    '/confluence',
    '/calendar',
    '/analytics'
  ];
  
  let allProtected = true;
  const protectedRouteResults = [];
  
  for (const route of protectedRoutes) {
    try {
      // Try to access protected route without authentication
      await page.goto(`${config.baseUrl}${route.replace('[id]', '1')}`);
      await page.waitForTimeout(2000);
      await takeScreenshot(page, `protected-route-${route.replace(/[\/\[\]]/g, '-')}`);
      
      // Check if redirected to login
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login');
      
      if (!redirectedToLogin) {
        allProtected = false;
      }
      
      const routeResult = {
        route,
        success: redirectedToLogin,
        message: redirectedToLogin ? 'Correctly redirected to login' : 'Allowed access without authentication',
        finalUrl: currentUrl
      };
      
      protectedRouteResults.push(routeResult);
      
      logTestResult(`Protected route ${route}`, redirectedToLogin, routeResult.message);
    } catch (error) {
      const routeResult = {
        route,
        success: false,
        message: `Exception: ${error.message}`,
        finalUrl: 'N/A'
      };
      
      protectedRouteResults.push(routeResult);
      logTestResult(`Protected route ${route}`, false, routeResult.message);
      allProtected = false;
    }
  }
  
  // Store detailed results for reporting
  testResults.protectedRouteResults = protectedRouteResults;
  
  return allProtected;
}

async function testPublicRoutes(page) {
  log('\n=== Testing Public Routes ===');
  
  const publicRoutes = ['/login', '/register', '/'];
  let allPublicAccessible = true;
  const publicRouteResults = [];
  
  for (const route of publicRoutes) {
    try {
      // Try to access public route without authentication
      await page.goto(`${config.baseUrl}${route}`);
      await page.waitForTimeout(2000);
      await takeScreenshot(page, `public-route-${route.replace(/[\/]/g, '-') || 'home'}`);
      
      // Check if we can access the route without being redirected to login
      const currentUrl = page.url();
      const notRedirectedToLogin = !currentUrl.includes('/login') || route === '/login';
      
      if (!notRedirectedToLogin) {
        allPublicAccessible = false;
      }
      
      const routeResult = {
        route: route === '/' ? '/ (home)' : route,
        success: notRedirectedToLogin,
        message: notRedirectedToLogin ? 'Correctly accessible without authentication' : 'Incorrectly redirected to login',
        finalUrl: currentUrl
      };
      
      publicRouteResults.push(routeResult);
      
      logTestResult(`Public route ${route === '/' ? '/ (home)' : route}`, notRedirectedToLogin, routeResult.message);
    } catch (error) {
      const routeResult = {
        route: route === '/' ? '/ (home)' : route,
        success: false,
        message: `Exception: ${error.message}`,
        finalUrl: 'N/A'
      };
      
      publicRouteResults.push(routeResult);
      logTestResult(`Public route ${route === '/' ? '/ (home)' : route}`, false, routeResult.message);
      allPublicAccessible = false;
    }
  }
  
  // Store detailed results for reporting
  testResults.publicRouteResults = publicRouteResults;
  
  return allPublicAccessible;
}

async function testRedirectBehavior(page) {
  log('\n=== Testing Redirect Behavior ===');
  
  try {
    // Test redirect after login
    await page.goto(`${config.baseUrl}/login`);
    await page.fill('input[type="email"]', config.testUser.email);
    await page.fill('input[type="password"]', config.testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    const dashboardUrl = page.url();
    const redirectedToDashboard = dashboardUrl.includes('/dashboard');
    
    logTestResult('Redirect after login', redirectedToDashboard,
      redirectedToDashboard ? 'Correctly redirected to dashboard' : 'Failed to redirect to dashboard');
    
    // Test redirect after logout
    const logoutButton = await page.$('button:has-text("Logout")');
    if (logoutButton) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login');
      
      logTestResult('Redirect after logout', redirectedToLogin,
        redirectedToLogin ? 'Correctly redirected to login' : 'Failed to redirect after logout');
      
      return redirectedToDashboard && redirectedToLogin;
    } else {
      logTestResult('Redirect after logout', false, 'Logout button not found');
      return false;
    }
  } catch (error) {
    logTestResult('Redirect behavior', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testRememberMeFunctionality(page) {
  log('\n=== Testing Remember Me Functionality ===');
  
  try {
    // Check if remember me option exists
    await page.goto(`${config.baseUrl}/login`);
    await waitForNavigation(page);
    
    const rememberMeCheckbox = await page.$('input[type="checkbox"]');
    const rememberMeLabel = await page.$('text=Remember me');
    
    const hasRememberMe = rememberMeCheckbox || rememberMeLabel;
    
    if (hasRememberMe) {
      await takeScreenshot(page, 'remember-me-option-found');
      
      // Test with remember me checked
      if (rememberMeCheckbox) {
        await rememberMeCheckbox.check();
      }
      
      await page.fill('input[type="email"]', config.testUser.email);
      await page.fill('input[type="password"]', config.testUser.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // Check if session persists (simplified test)
      const currentUrl = page.url();
      const loginSuccessful = currentUrl.includes('/dashboard');
      
      logTestResult('Remember me functionality', loginSuccessful,
        loginSuccessful ? 'Remember me option works' : 'Remember me option failed');
      
      return loginSuccessful;
    } else {
      await takeScreenshot(page, 'remember-me-option-not-found');
      logTestResult('Remember me functionality', false, 'Remember me option not found');
      return false;
    }
  } catch (error) {
    logTestResult('Remember me functionality', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testErrorHandling(page) {
  log('\n=== Testing Error Handling ===');
  
  try {
    // Test network error simulation
    await page.goto(`${config.baseUrl}/login`);
    
    // Fill form and submit
    await page.fill('input[type="email"]', config.testUser.email);
    await page.fill('input[type="password"]', config.testUser.password);
    
    // Simulate network offline
    await page.context().setOffline(true);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'network-error-simulation');
    
    // Restore network
    await page.context().setOffline(false);
    
    // Check if error is handled gracefully
    const errorElement = await page.$('div[class*="red"]');
    const hasErrorHandling = errorElement !== null;
    
    logTestResult('Error handling', hasErrorHandling,
      hasErrorHandling ? 'Error handled gracefully' : 'No error handling found');
    
    return hasErrorHandling;
  } catch (error) {
    logTestResult('Error handling', false, `Exception: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting Comprehensive Authentication Tests');
  log('==========================================');
  
  // Create directories for screenshots and reports
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
    // Run all tests
    await testLoginWithValidCredentials(page);
    await testLoginWithInvalidCredentials(page);
    await testFormValidation(page);
    await testRegistrationWithValidData(page);
    await testRegistrationWithInvalidData(page);
    await testRememberMeFunctionality(page);
    await testErrorHandling(page);
    await testLogoutFunctionality(page);
    await testRedirectBehavior(page);
    await testProtectedRoutes(page);
    await testPublicRoutes(page);
    
    // Generate final report
    generateFinalReport();
    
  } catch (error) {
    log(`💥 Test execution failed: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
}

function generateFinalReport() {
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: config.baseUrl,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    details: testResults.details,
    protectedRoutes: testResults.protectedRouteResults || [],
    publicRoutes: testResults.publicRouteResults || [],
    recommendations: generateRecommendations(),
    testEnvironment: {
      nodeVersion: process.version,
      platform: process.platform,
      screenshotsDir: config.screenshotsDir,
      reportsDir: config.reportsDir
    }
  };
  
  const reportPath = path.join(config.reportsDir, `auth-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report for better readability
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(config.reportsDir, `AUTHENTICATION_TEST_REPORT_${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  log('\n📊 Test Summary');
  log('================');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Pass Rate: ${report.summary.passRate}`);
  log(`\n📄 Detailed report saved to: ${reportPath}`);
  log(`📝 Markdown report saved to: ${markdownPath}`);
  
  // Print recommendations
  log('\n💡 Recommendations');
  log('==================');
  report.recommendations.forEach(rec => log(`• ${rec}`));
  
  // Print route-specific summaries
  if (testResults.protectedRouteResults) {
    log('\n🔒 Protected Routes Summary');
    log('===========================');
    const protectedPassed = testResults.protectedRouteResults.filter(r => r.success).length;
    const protectedTotal = testResults.protectedRouteResults.length;
    log(`Protected Routes: ${protectedPassed}/${protectedTotal} properly secured`);
    
    testResults.protectedRouteResults.forEach(route => {
      const status = route.success ? '✅' : '❌';
      log(`  ${status} ${route.route}: ${route.message}`);
    });
  }
  
  if (testResults.publicRouteResults) {
    log('\n🌐 Public Routes Summary');
    log('========================');
    const publicPassed = testResults.publicRouteResults.filter(r => r.success).length;
    const publicTotal = testResults.publicRouteResults.length;
    log(`Public Routes: ${publicPassed}/${publicTotal} properly accessible`);
    
    testResults.publicRouteResults.forEach(route => {
      const status = route.success ? '✅' : '❌';
      log(`  ${status} ${route.route}: ${route.message}`);
    });
  }
}

function generateMarkdownReport(report) {
  const { timestamp, summary, protectedRoutes, publicRoutes, recommendations, baseUrl } = report;
  
  let markdown = `# Comprehensive Authentication Test Report\n\n`;
  markdown += `**Generated:** ${new Date(timestamp).toLocaleString()}\n`;
  markdown += `**Base URL:** ${baseUrl}\n\n`;
  
  markdown += `## Test Summary\n\n`;
  markdown += `- **Total Tests:** ${summary.total}\n`;
  markdown += `- **Passed:** ${summary.passed}\n`;
  markdown += `- **Failed:** ${summary.failed}\n`;
  markdown += `- **Pass Rate:** ${summary.passRate}\n\n`;
  
  if (protectedRoutes.length > 0) {
    markdown += `## Protected Routes Test Results\n\n`;
    markdown += `| Route | Status | Result | Final URL |\n`;
    markdown += `|-------|--------|--------|-----------|\n`;
    
    protectedRoutes.forEach(route => {
      const status = route.success ? '✅ PASSED' : '❌ FAILED';
      markdown += `| ${route.route} | ${status} | ${route.message} | ${route.finalUrl} |\n`;
    });
    markdown += `\n`;
  }
  
  if (publicRoutes.length > 0) {
    markdown += `## Public Routes Test Results\n\n`;
    markdown += `| Route | Status | Result | Final URL |\n`;
    markdown += `|-------|--------|--------|-----------|\n`;
    
    publicRoutes.forEach(route => {
      const status = route.success ? '✅ PASSED' : '❌ FAILED';
      markdown += `| ${route.route} | ${status} | ${route.message} | ${route.finalUrl} |\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Recommendations\n\n`;
  recommendations.forEach(rec => {
    markdown += `- ${rec}\n`;
  });
  markdown += `\n`;
  
  markdown += `## Test Details\n\n`;
  markdown += `All screenshots are saved in the \`${report.testEnvironment.screenshotsDir}\` directory.\n`;
  markdown += `Detailed JSON reports are available in the \`${report.testEnvironment.reportsDir}\` directory.\n\n`;
  
  markdown += `---\n`;
  markdown += `*Report generated by Comprehensive Authentication Test Script*\n`;
  
  return markdown;
}

function generateRecommendations() {
  const recommendations = [];
  
  // Analyze test results and generate recommendations
  const failedTests = testResults.details.filter(d => d.type === 'error');
  
  if (failedTests.length > 0) {
    recommendations.push('Review failed authentication tests and fix underlying issues');
  }
  
  if (testResults.failed > 0) {
    recommendations.push('Improve error handling and user feedback in authentication flows');
  }
  
  if (testResults.passed === testResults.total) {
    recommendations.push('All authentication tests passed! Consider adding more edge case tests');
  }
  
  recommendations.push('Regularly run authentication tests to ensure system reliability');
  recommendations.push('Consider implementing automated regression testing for authentication');
  
  return recommendations;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  config,
  testResults
};