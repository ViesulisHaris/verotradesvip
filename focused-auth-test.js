const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
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
  const screenshotPath = path.join('./auth-test-screenshots', `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`📸 Screenshot saved: ${screenshotPath}`, 'info');
  return screenshotPath;
}

// Main test function
async function testAuthenticationFlow() {
  log('🚀 Starting Focused Authentication Test');
  log('======================================');
  
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync('./auth-test-screenshots')) {
    fs.mkdirSync('./auth-test-screenshots', { recursive: true });
  }
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        log(`[CONSOLE] ${text}`, 'warning');
      }
    });
    
    // Enable request/response logging for debugging
    page.on('request', request => {
      if (request.url().includes('/auth') || request.url().includes('supabase')) {
        log(`[REQUEST] ${request.method()} ${request.url()}`, 'info');
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/auth') || response.url().includes('supabase')) {
        log(`[RESPONSE] ${response.status()} ${response.url()}`, 'info');
      }
    });
    
    // Step 1: Navigate to login page
    log('Navigating to login page...');
    await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'login-page-loaded');
    
    // Step 2: Check if login form is present
    log('Checking for login form...');
    let emailSelector, passwordSelector, submitSelector;
    
    try {
      await page.waitForSelector('#email', { timeout: 5000 });
      emailSelector = '#email';
      passwordSelector = '#password';
      submitSelector = 'button[type="submit"]';
      log('Found login form with #email selector', 'success');
    } catch (error) {
      log('Primary selector failed, trying alternatives...', 'warning');
      try {
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        emailSelector = 'input[type="email"]';
        passwordSelector = 'input[type="password"]';
        submitSelector = '.btn-primary';
        log('Found login form with input[type="email"] selector', 'success');
      } catch (error2) {
        logTestResult('Login form detection', false, `Could not find login form: ${error2.message}`);
        return false;
      }
    }
    
    // Step 3: Fill in credentials
    log('Filling in credentials...');
    await page.type(emailSelector, config.testUser.email);
    await page.type(passwordSelector, config.testUser.password);
    await takeScreenshot(page, 'login-form-filled');
    
    // Step 4: Submit form
    log('Submitting login form...');
    try {
      await page.click(submitSelector);
    } catch (error) {
      log('Primary submit selector failed, trying alternatives...', 'warning');
      try {
        await page.click('.btn-primary');
      } catch (error2) {
        logTestResult('Login form submission', false, `Could not submit form: ${error2.message}`);
        return false;
      }
    }
    
    // Step 5: Wait for authentication to complete
    log('Waiting for authentication to complete...');
    
    // Wait for either redirect to dashboard or error message
    try {
      await Promise.race([
        page.waitForFunction(() => window.location.href.includes('/dashboard'), { timeout: 15000 }),
        page.waitForSelector('.bg-red-500\\/10', { timeout: 15000 })
      ]);
    } catch (error) {
      log(`Authentication timeout: ${error.message}`, 'warning');
    }
    
    // Step 6: Check if authentication was successful
    log('Checking authentication result...');
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('/dashboard');
    
    // Check for authentication cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth')
    );
    
    const hasAuthCookies = authCookies.length > 0;
    
    // Log cookie details for debugging
    if (hasAuthCookies) {
      log('🍪 Authentication cookies found:', 'info');
      authCookies.forEach(cookie => {
        log(`   - ${cookie.name}: ${cookie.value ? 'SET' : 'EMPTY'}`, 'info');
      });
    } else {
      log('No authentication cookies found', 'warning');
    }
    
    // Step 7: Determine test result
    let authSuccess = false;
    let authMessage = '';
    
    if (isOnDashboard) {
      authSuccess = true;
      authMessage = 'Successfully logged in and redirected to dashboard';
    } else if (hasAuthCookies) {
      authSuccess = true;
      authMessage = 'Authentication successful (cookies set) but no redirect to dashboard';
    } else {
      // Check for error message
      try {
        const errorElement = await page.$('.bg-red-500\\/10 .text-red-400');
        const errorMessage = errorElement ? await page.evaluate(el => el.textContent, errorElement) : 'No error message found';
        authMessage = `Authentication failed: ${errorMessage}`;
      } catch (error) {
        authMessage = `Authentication failed with unknown error: ${error.message}`;
      }
    }
    
    await takeScreenshot(page, 'authentication-result');
    logTestResult('Authentication flow', authSuccess, authMessage);
    
    return authSuccess;
    
  } catch (error) {
    logTestResult('Authentication test', false, `Exception: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationFlow()
  .then(success => {
    log(`\n🏁 Authentication test ${success ? 'PASSED' : 'FAILED'}`, success ? 'success' : 'error');
    log(`Total Tests: ${testResults.total}`);
    log(`Passed: ${testResults.passed}`);
    log(`Failed: ${testResults.failed}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });