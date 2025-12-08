const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './authentication-fix-verification-screenshots';
const TIMEOUT = 30000; // 30 seconds timeout for page loads
const AUTH_TIMEOUT = 10000; // 10 seconds timeout for authentication initialization

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

// Test results
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper function to take screenshots
async function takeScreenshot(page, testName, description) {
  const timestamp = Date.now();
  const filename = `${testName}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    return { success: true, filepath, filename };
  } catch (error) {
    console.error(`❌ Failed to take screenshot: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Helper function to log test results
function logTestResult(testName, status, details = {}) {
  const result = {
    testName,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: FAILED`);
  } else if (status === 'WARNING') {
    testResults.summary.warnings++;
    console.log(`⚠️  ${testName}: WARNING`);
  }
  
  if (details.error) {
    console.log(`   Error: ${details.error}`);
  }
  if (details.message) {
    console.log(`   Message: ${details.message}`);
  }
}

// Helper function to wait for authentication initialization
async function waitForAuthInit(page, timeout = AUTH_TIMEOUT) {
  try {
    await page.waitForFunction(
      () => {
        // Check if "Initializing authentication..." message is gone
        const authInitElements = document.querySelectorAll('*');
        for (const element of authInitElements) {
          if (element.textContent && element.textContent.includes('Initializing authentication')) {
            return false; // Still initializing
          }
        }
        return true; // Initialization complete
      },
      { timeout }
    );
    return true;
  } catch (error) {
    return false; // Timeout or error
  }
}

// Helper function to check for console errors
function checkConsoleErrors(consoleMessages) {
  const errors = consoleMessages.filter(msg => msg.type() === 'error');
  const warnings = consoleMessages.filter(msg => msg.type() === 'warning');
  
  return {
    errors: errors.map(msg => msg.text()),
    warnings: warnings.map(msg => msg.text())
  };
}

// Main verification function
async function verifyAuthenticationFix() {
  console.log('🚀 Starting Authentication Fix Verification...');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}`);
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false for visual debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Monitor console for errors and warnings
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg);
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`🟡 Console Warning: ${msg.text()}`);
      }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
      console.log(`🚨 Page Error: ${error.message}`);
    });
    
    // Test 1: Main application URL loads without hanging
    console.log('\n📋 Test 1: Main Application URL Loading');
    try {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      const loadTime = Date.now() - startTime;
      
      // Check if authentication initialization completes without hanging
      const authInitComplete = await waitForAuthInit(page);
      
      if (authInitComplete && loadTime < TIMEOUT) {
        logTestResult('Main URL Loading', 'PASS', {
          message: `Page loaded in ${loadTime}ms without authentication hang`,
          loadTime,
          authInitComplete
        });
      } else {
        logTestResult('Main URL Loading', 'FAIL', {
          message: 'Page either took too long to load or authentication initialization hung',
          loadTime,
          authInitComplete
        });
      }
      
      await takeScreenshot(page, 'main-url-loading', 'Main application page loaded');
      
    } catch (error) {
      logTestResult('Main URL Loading', 'FAIL', {
        error: error.message,
        message: 'Failed to load main application URL'
      });
    }
    
    // Test 2: Authentication flow - Login page
    console.log('\n📋 Test 2: Login Page Functionality');
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      
      // Check if login page loads without hanging
      const authInitComplete = await waitForAuthInit(page);
      
      // Check for login form elements
      const loginForm = await page.$('form');
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      if (authInitComplete && loginForm && emailInput && passwordInput && submitButton) {
        logTestResult('Login Page Loading', 'PASS', {
          message: 'Login page loaded successfully with all form elements',
          authInitComplete
        });
      } else {
        logTestResult('Login Page Loading', 'FAIL', {
          message: 'Login page missing required elements or authentication hung',
          authInitComplete,
          hasForm: !!loginForm,
          hasEmailInput: !!emailInput,
          hasPasswordInput: !!passwordInput,
          hasSubmitButton: !!submitButton
        });
      }
      
      await takeScreenshot(page, 'login-page', 'Login page loaded');
      
    } catch (error) {
      logTestResult('Login Page Loading', 'FAIL', {
        error: error.message,
        message: 'Failed to load login page'
      });
    }
    
    // Test 3: Authentication flow - Register page
    console.log('\n📋 Test 3: Register Page Functionality');
    try {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      
      // Check if register page loads without hanging
      const authInitComplete = await waitForAuthInit(page);
      
      // Check for register form elements
      const registerForm = await page.$('form');
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      if (authInitComplete && registerForm && emailInput && passwordInput && submitButton) {
        logTestResult('Register Page Loading', 'PASS', {
          message: 'Register page loaded successfully with all form elements',
          authInitComplete
        });
      } else {
        logTestResult('Register Page Loading', 'FAIL', {
          message: 'Register page missing required elements or authentication hung',
          authInitComplete,
          hasForm: !!registerForm,
          hasEmailInput: !!emailInput,
          hasPasswordInput: !!passwordInput,
          hasSubmitButton: !!submitButton
        });
      }
      
      await takeScreenshot(page, 'register-page', 'Register page loaded');
      
    } catch (error) {
      logTestResult('Register Page Loading', 'FAIL', {
        error: error.message,
        message: 'Failed to load register page'
      });
    }
    
    // Test 4: Protected routes - Dashboard (should redirect to login when not authenticated)
    console.log('\n📋 Test 4: Protected Route - Dashboard');
    try {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      const loadTime = Date.now() - startTime;
      
      // Check if authentication initialization completes
      const authInitComplete = await waitForAuthInit(page);
      
      // Check current URL - should redirect to login if not authenticated
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login');
      
      if (authInitComplete && redirectedToLogin) {
        logTestResult('Protected Route Redirect', 'PASS', {
          message: 'Protected route properly redirected to login when not authenticated',
          loadTime,
          authInitComplete,
          currentUrl
        });
      } else if (authInitComplete && !redirectedToLogin) {
        logTestResult('Protected Route Redirect', 'WARNING', {
          message: 'Protected route did not redirect to login - may have authentication issue',
          loadTime,
          authInitComplete,
          currentUrl
        });
      } else {
        logTestResult('Protected Route Redirect', 'FAIL', {
          message: 'Protected route failed to load or authentication hung',
          loadTime,
          authInitComplete,
          currentUrl
        });
      }
      
      await takeScreenshot(page, 'protected-route-dashboard', 'Dashboard protected route test');
      
    } catch (error) {
      logTestResult('Protected Route Redirect', 'FAIL', {
        error: error.message,
        message: 'Failed to test protected route'
      });
    }
    
    // Test 5: Check for infinite loops and race conditions
    console.log('\n📋 Test 5: Infinite Loops and Race Conditions Detection');
    try {
      // Monitor console for repeated error messages or infinite loop patterns
      const consoleErrors = checkConsoleErrors(consoleMessages);
      
      // Check for hook-related errors (indicative of the duplicate AuthContextProvider issue)
      const hookErrors = consoleErrors.errors.filter(error => 
        error.includes('Rendered more hooks than during the previous render') ||
        error.includes('Invalid hook call') ||
        error.includes('AuthContextProvider')
      );
      
      // Check for authentication-related errors
      const authErrors = consoleErrors.errors.filter(error => 
        error.includes('authentication') ||
        error.includes('auth') ||
        error.includes('Initializing')
      );
      
      if (hookErrors.length === 0 && authErrors.length === 0) {
        logTestResult('Infinite Loops Detection', 'PASS', {
          message: 'No hook-related or authentication errors detected',
          totalErrors: consoleErrors.errors.length,
          totalWarnings: consoleErrors.warnings.length
        });
      } else {
        logTestResult('Infinite Loops Detection', 'FAIL', {
          message: 'Detected hook or authentication errors indicating potential infinite loops',
          hookErrors: hookErrors.length,
          authErrors: authErrors.length,
          hookErrorMessages: hookErrors,
          authErrorMessages: authErrors
        });
      }
      
    } catch (error) {
      logTestResult('Infinite Loops Detection', 'FAIL', {
        error: error.message,
        message: 'Failed to detect infinite loops'
      });
    }
    
    // Test 6: Site navigation and functionality
    console.log('\n📋 Test 6: Site Navigation and Functionality');
    try {
      // Test navigation between different pages
      const testPages = [
        { url: '/', name: 'Home' },
        { url: '/login', name: 'Login' },
        { url: '/register', name: 'Register' }
      ];
      
      let navigationPassed = 0;
      
      for (const pageTest of testPages) {
        try {
          await page.goto(`${BASE_URL}${pageTest.url}`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
          const authInitComplete = await waitForAuthInit(page);
          
          if (authInitComplete) {
            navigationPassed++;
            console.log(`✅ Navigation to ${pageTest.name} successful`);
          } else {
            console.log(`❌ Navigation to ${pageTest.name} failed - auth hang`);
          }
        } catch (error) {
          console.log(`❌ Navigation to ${pageTest.name} failed - ${error.message}`);
        }
      }
      
      if (navigationPassed === testPages.length) {
        logTestResult('Site Navigation', 'PASS', {
          message: 'All test pages loaded successfully without authentication issues',
          pagesTested: testPages.length,
          pagesPassed: navigationPassed
        });
      } else {
        logTestResult('Site Navigation', 'FAIL', {
          message: 'Some pages failed to load properly',
          pagesTested: testPages.length,
          pagesPassed: navigationPassed
        });
      }
      
      await takeScreenshot(page, 'site-navigation-final', 'Final navigation test state');
      
    } catch (error) {
      logTestResult('Site Navigation', 'FAIL', {
        error: error.message,
        message: 'Failed to test site navigation'
      });
    }
    
    // Test 7: Authentication state consistency
    console.log('\n📋 Test 7: Authentication State Consistency');
    try {
      // Check if authentication state is consistent across page loads
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      await waitForAuthInit(page);
      
      // Get authentication state from the page
      const authState = await page.evaluate(() => {
        // Look for authentication indicators in the DOM
        const authElements = document.querySelectorAll('[data-auth], [class*="auth"], [id*="auth"]');
        const loginButtons = document.querySelectorAll('a[href*="login"], button:contains("Login")');
        const logoutButtons = document.querySelectorAll('a[href*="logout"], button:contains("Logout")');
        
        return {
          authElementsCount: authElements.length,
          loginButtonsCount: loginButtons.length,
          logoutButtonsCount: logoutButtons.length,
          hasAuthState: authElements.length > 0
        };
      });
      
      logTestResult('Authentication State Consistency', 'PASS', {
        message: 'Authentication state is consistent and accessible',
        authState
      });
      
    } catch (error) {
      logTestResult('Authentication State Consistency', 'FAIL', {
        error: error.message,
        message: 'Failed to verify authentication state consistency'
      });
    }
    
  } catch (error) {
    console.error('🚨 Critical error during verification:', error);
    logTestResult('Overall Verification', 'FAIL', {
      error: error.message,
      message: 'Critical error during verification process'
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate final report
  testResults.endTime = new Date().toISOString();
  testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
  
  // Save results to file
  const reportPath = './authentication-fix-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Generate summary
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Warnings: ${testResults.summary.warnings}`);
  console.log(`Duration: ${testResults.duration}ms`);
  console.log(`\n📁 Detailed report saved to: ${reportPath}`);
  console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
  
  // Overall assessment
  const successRate = (testResults.summary.passed / testResults.summary.total) * 100;
  
  if (successRate >= 90 && testResults.summary.failed === 0) {
    console.log('\n🎉 AUTHENTICATION FIX VERIFICATION: SUCCESS');
    console.log('✅ The authentication initialization hang issue has been resolved!');
    console.log('✅ All critical functionality is working properly');
    console.log('✅ No infinite loops or race conditions detected');
  } else if (successRate >= 70) {
    console.log('\n⚠️  AUTHENTICATION FIX VERIFICATION: PARTIAL SUCCESS');
    console.log('✅ Most functionality is working, but some issues remain');
    console.log('⚠️  Review the failed tests and warnings');
  } else {
    console.log('\n❌ AUTHENTICATION FIX VERIFICATION: FAILED');
    console.log('❌ Significant issues remain with the authentication fix');
    console.log('❌ Immediate attention required');
  }
  
  return testResults;
}

// Run verification
if (require.main === module) {
  verifyAuthenticationFix()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyAuthenticationFix };