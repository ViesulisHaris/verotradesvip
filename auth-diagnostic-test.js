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
  screenshotsDir: './auth-diagnostic-screenshots',
  timeout: 30000
};

// Create directories for screenshots
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Helper functions
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(config.screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function logConsoleMessages(page) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    console.log(`[${type.toUpperCase()}] ${text}`);
    if (location && location.url) {
      console.log(`  at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });
  
  page.on('request', request => {
    if (request.url().includes('/auth') || request.url().includes('supabase')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      console.log(`  Headers: ${JSON.stringify(request.headers(), null, 2)}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/auth') || response.url().includes('supabase')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      const headers = response.headers();
      console.log(`  Headers: ${JSON.stringify(headers, null, 2)}`);
    }
  });
  
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()}`);
    console.log(`  Error: ${request.failure().errorText}`);
  });
}

async function diagnoseLoginIssue(page) {
  console.log('🔍 Starting login diagnostics...');
  
  // Clear any existing session
  await page.deleteCookie(...await page.cookies());
  
  // Navigate to login page
  console.log('Navigating to login page...');
  await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle2' });
  await takeScreenshot(page, 'login-page-loaded');
  
  // Check if form elements exist
  console.log('Checking form elements...');
  const emailSelector = await page.$('#email');
  const passwordSelector = await page.$('#password');
  const submitSelector = await page.$('button[type="submit"]');
  
  console.log(`Email input exists: ${!!emailSelector}`);
  console.log(`Password input exists: ${!!passwordSelector}`);
  console.log(`Submit button exists: ${!!submitSelector}`);
  
  if (!emailSelector || !passwordSelector || !submitSelector) {
    console.log('❌ Form elements missing');
    await takeScreenshot(page, 'missing-form-elements');
    return false;
  }
  
  // Fill in credentials
  console.log('Filling in credentials...');
  await page.type('#email', config.testUser.email);
  await page.type('#password', config.testUser.password);
  await takeScreenshot(page, 'form-filled');
  
  // Check form values
  const emailValue = await page.$eval('#email', el => el.value);
  const passwordValue = await page.$eval('#password', el => el.value);
  console.log(`Email value: ${emailValue}`);
  console.log(`Password value: ${passwordValue ? '***' : 'empty'}`);
  
  // Submit form
  console.log('Submitting form...');
  
  // Set up event listeners for form submission
  await page.evaluate(() => {
    document.querySelector('form').addEventListener('submit', (e) => {
      console.log('Form submit event triggered');
      console.log('Default prevented:', e.defaultPrevented);
    });
  });
  
  // Click submit button
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => {
      console.log(`Navigation timeout/error: ${e.message}`);
      return null;
    })
  ]);
  
  await takeScreenshot(page, 'after-submit');
  
  // Check current URL
  const currentUrl = page.url();
  console.log(`Current URL after submit: ${currentUrl}`);
  
  // Check for any error messages
  const errorElements = await page.$$('.bg-red-500\\/10, .text-red-400, [class*="error"], [class*="Error"]');
  console.log(`Found ${errorElements.length} potential error elements`);
  
  for (let i = 0; i < errorElements.length; i++) {
    const errorText = await page.evaluate(el => el.textContent, errorElements[i]);
    console.log(`Error ${i + 1}: ${errorText}`);
  }
  
  // Check page title
  const pageTitle = await page.title();
  console.log(`Page title: ${pageTitle}`);
  
  // Check if any redirects happened
  const navigationHistory = await page.evaluate(() => {
    return performance.getEntriesByType('navigation').map(nav => ({
      name: nav.name,
      type: nav.type,
      startTime: nav.startTime
    }));
  });
  
  console.log('Navigation history:');
  navigationHistory.forEach((nav, index) => {
    console.log(`  ${index + 1}. ${nav.name} (${nav.type}) at ${nav.startTime}ms`);
  });
  
  // Check network requests
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource').filter(resource => 
      resource.name.includes('/auth') || 
      resource.name.includes('supabase') ||
      resource.name.includes('login')
    ).map(resource => ({
      name: resource.name,
      status: 'unknown',
      duration: resource.duration
    }));
  });
  
  console.log('Auth-related network requests:');
  networkRequests.forEach((req, index) => {
    console.log(`  ${index + 1}. ${req.name} (${req.duration}ms)`);
  });
  
  return currentUrl.includes('/dashboard');
}

async function checkMiddlewareLogs(page) {
  console.log('\n🔍 Checking middleware logs...');
  
  // Set up console listener specifically for middleware
  const middlewareLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MIDDLEWARE') || 
        text.includes('AUTH') || 
        text.includes('middleware') || 
        text.includes('auth')) {
      middlewareLogs.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
      console.log(`[MIDDLEWARE LOG] ${text}`);
    }
  });
  
  // Navigate to various pages to trigger middleware
  await page.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle2' });
  await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
  await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle2' });
  
  // Wait a bit to collect all logs
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log(`Found ${middlewareLogs.length} middleware logs`);
  return middlewareLogs;
}

async function checkNetworkActivity(page) {
  console.log('\n🔍 Checking network activity...');
  
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Navigate to login page
  await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle2' });
  
  // Fill and submit form
  await page.type('#email', config.testUser.email);
  await page.type('#password', config.testUser.password);
  await page.click('button[type="submit"]');
  
  // Wait for any activity
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Filter auth-related requests
  const authRequests = requests.filter(req => 
    req.url.includes('/auth') || 
    req.url.includes('supabase') ||
    req.url.includes('login')
  );
  
  const authResponses = responses.filter(res => 
    res.url.includes('/auth') || 
    res.url.includes('supabase') ||
    res.url.includes('login')
  );
  
  console.log(`Auth requests: ${authRequests.length}`);
  authRequests.forEach((req, index) => {
    console.log(`  ${index + 1}. ${req.method} ${req.url}`);
  });
  
  console.log(`Auth responses: ${authResponses.length}`);
  authResponses.forEach((res, index) => {
    console.log(`  ${index + 1}. ${res.status} ${res.url}`);
  });
  
  return { requests: authRequests, responses: authResponses };
}

async function runDiagnostics() {
  console.log('🚀 Starting Authentication Diagnostics');
  console.log('=====================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable verbose logging
  await logConsoleMessages(page);
  
  try {
    // Run diagnostics
    const loginSuccess = await diagnoseLoginIssue(page);
    console.log(`\nLogin test result: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    const middlewareLogs = await checkMiddlewareLogs(page);
    console.log(`\nMiddleware logs found: ${middlewareLogs.length}`);
    
    const networkActivity = await checkNetworkActivity(page);
    console.log(`\nNetwork activity: ${networkActivity.requests.length} requests, ${networkActivity.responses.length} responses`);
    
    // Generate diagnostic report
    const report = {
      timestamp: new Date().toISOString(),
      loginSuccess,
      middlewareLogs,
      networkActivity,
      testEnvironment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    const reportPath = './auth-diagnostic-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Diagnostic report saved to: ${reportPath}`);
    
    return loginSuccess;
    
  } catch (error) {
    console.error(`💥 Diagnostic failed: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// Run diagnostics
runDiagnostics()
  .then(success => {
    console.log(`\n🏁 Diagnostics ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`💥 Diagnostic execution failed: ${error.message}`);
    process.exit(1);
  });