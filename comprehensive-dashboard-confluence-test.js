const { chromium } = require('playwright');
const fs = require('fs');

// Test user credentials
const TEST_USER = {
  email: 'testuser1000@verotrade.com',
  password: 'TestPassword123!'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  errors: [],
  screenshots: [],
  consoleLogs: [],
  finalStatus: 'unknown'
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    console.log(`✅ ${testName}: ${details}`);
  } else {
    console.log(`❌ ${testName}: ${details}`);
    testResults.errors.push(result);
  }
}

// Helper function to save screenshot
async function saveScreenshot(page, name) {
  const path = `comprehensive-test-${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: true });
  testResults.screenshots.push(path);
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

// Main test function
async function runComprehensiveTest() {
  console.log('🧪 Starting comprehensive Dashboard and Confluence test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: './test-results/'
    }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    console.log(`BROWSER CONSOLE: ${text}`);
    testResults.consoleLogs.push({
      type: msg.type(),
      text,
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error.message}`);
    testResults.errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture network requests
  page.on('requestfailed', request => {
    console.error(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
    testResults.errors.push({
      type: 'network',
      url: request.url(),
      error: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // Step 1: Start the development server
    console.log('🚀 Starting Next.js development server...');
    const { spawn } = require('child_process');
    
    // Try different approaches to find npm
    let serverProcess;
    try {
      // First try with npm.cmd on Windows
      serverProcess = spawn('npm.cmd', ['run', 'dev'], {
        cwd: './verotradesvip',
        detached: true,
        stdio: 'pipe'
      });
    } catch (error) {
      try {
        // Try with npx.cmd on Windows
        serverProcess = spawn('npx.cmd', ['next', 'dev'], {
          cwd: './verotradesvip',
          detached: true,
          stdio: 'pipe'
        });
      } catch (error2) {
        // If both fail, assume server is already running
        console.log('⚠️  Could not start server, assuming it is already running...');
        serverProcess = null;
      }
    }
    
    // Wait for server to start
    if (serverProcess) {
      await new Promise(resolve => setTimeout(resolve, 15000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Step 2: Navigate to login page
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await saveScreenshot(page, 'login-page');
    
    // Check if login form is present
    const loginForm = await page.$('form');
    logTest('Login form loaded', !!loginForm, loginForm ? 'Form is present' : 'Form not found');
    
    if (!loginForm) {
      throw new Error('Login form not found');
    }
    
    // Step 3: Fill in login credentials
    console.log('📝 Filling in login credentials...');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await saveScreenshot(page, 'login-form-filled');
    
    // Step 4: Submit login form
    console.log('🔑 Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 })
    ]);
    
    await saveScreenshot(page, 'after-login');
    
    // Check if login was successful
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') && 
                     (currentUrl.includes('/dashboard') || currentUrl.includes('/'));
    
    logTest('User login', isLoggedIn, 
      isLoggedIn ? `Successfully logged in, redirected to: ${currentUrl}` : 'Login failed');
    
    if (!isLoggedIn) {
      throw new Error('Login failed');
    }
    
    // Step 5: Navigate to Dashboard if not already there
    if (!currentUrl.includes('/dashboard')) {
      console.log('📈 Navigating to Dashboard...');
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
      await saveScreenshot(page, 'dashboard-page');
    }
    
    // Step 6: Test Dashboard components
    console.log('🔍 Testing Dashboard components...');
    
    // Wait for content to load with timeout
    try {
      await page.waitForSelector('.verotrade-content-wrapper', { timeout: 30000 });
      logTest('Dashboard content wrapper', true, 'Content wrapper loaded successfully');
    } catch (error) {
      logTest('Dashboard content wrapper', false, `Content wrapper not loaded: ${error.message}`);
    }
    
    // Check for loading spinner
    const loadingSpinner = await page.$('.animate-spin');
    if (loadingSpinner) {
      console.log('⏳ Loading spinner detected, waiting for content to load...');
      
      // Wait for loading to complete or timeout
      try {
        await page.waitForSelector('.verotrade-content-wrapper:not(:has(.animate-spin))', { timeout: 30000 });
        logTest('Dashboard loading completion', true, 'Loading completed successfully');
      } catch (error) {
        logTest('Dashboard loading completion', false, `Loading timed out: ${error.message}`);
      }
    } else {
      logTest('Dashboard loading completion', true, 'No loading spinner detected');
    }
    
    // Check for metrics cards
    const metricsCards = await page.$$('.dashboard-card');
    logTest('Dashboard metrics cards', metricsCards.length > 0, 
      `Found ${metricsCards.length} metrics cards`);
    
    // Check for charts
    const charts = await page.$$('.recharts-wrapper');
    logTest('Dashboard charts', charts.length > 0, 
      `Found ${charts.length} charts`);
    
    // Check for recent trades table
    const tradesTable = await page.$('table');
    if (tradesTable) {
      const tableRows = await tradesTable.$$('tbody tr');
      logTest('Dashboard recent trades table', true, 
        `Found table with ${tableRows.length} rows`);
    } else {
      logTest('Dashboard recent trades table', false, 'No table found');
    }
    
    // Step 7: Test Confluence tab specifically
    console.log('📋 Testing Confluence tab...');
    
    // Navigate directly to the confluence page
    console.log('🔗 Navigating directly to Confluence page...');
    await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle' });
    console.log('✅ Navigated to Confluence page');
    
    await page.waitForLoadState('networkidle');
    await saveScreenshot(page, 'confluence-page');
      
    // Check for infinite loading
    const confluenceLoadingSpinner = await page.$('.animate-spin');
    if (confluenceLoadingSpinner) {
      console.log('⏳ Confluence loading spinner detected, checking for infinite loop...');
      
      // Wait a reasonable time for loading to complete
      try {
        await page.waitForSelector('.verotrade-content-wrapper:not(:has(.animate-spin))', { timeout: 20000 });
        logTest('Confluence loading completion', true, 'Confluence loaded successfully');
      } catch (error) {
        logTest('Confluence loading completion', false,
          'Confluence may have infinite loading - spinner did not disappear');
      }
    } else {
      logTest('Confluence loading completion', true, 'No loading spinner detected');
    }
    
    // Check for Confluence content
    const confluenceContent = await page.$('.verotrade-content-wrapper');
    logTest('Confluence content', !!confluenceContent,
      confluenceContent ? 'Confluence content loaded' : 'Confluence content not found');
    
    // Check for specific Confluence components
    const confluenceCards = await page.$$('.confluence-card');
    logTest('Confluence cards', confluenceCards.length > 0,
      `Found ${confluenceCards.length} confluence cards`);
    
    // Step 8: Check for console errors
    const consoleErrors = testResults.consoleLogs.filter(log => 
      log.type === 'error' || 
      (log.text && log.text.toLowerCase().includes('error'))
    );
    
    logTest('Console errors', consoleErrors.length === 0, 
      consoleErrors.length === 0 ? 'No console errors detected' : 
      `Found ${consoleErrors.length} console errors`);
    
    // Step 9: Check for network errors
    const networkErrors = testResults.errors.filter(error => error.type === 'network');
    logTest('Network errors', networkErrors.length === 0, 
      networkErrors.length === 0 ? 'No network errors detected' : 
      `Found ${networkErrors.length} network errors`);
    
    // Step 10: Check for page errors
    const pageErrors = testResults.errors.filter(error => error.type === 'pageerror');
    logTest('Page errors', pageErrors.length === 0, 
      pageErrors.length === 0 ? 'No page errors detected' : 
      `Found ${pageErrors.length} page errors`);
    
    // Final assessment
    const passedTests = testResults.tests.filter(t => t.passed).length;
    const totalTests = testResults.tests.length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Tests passed: ${passedTests}/${totalTests} (${successRate.toFixed(2)}%)`);
    console.log(`Errors detected: ${testResults.errors.length}`);
    console.log(`Console logs captured: ${testResults.consoleLogs.length}`);
    console.log(`Screenshots taken: ${testResults.screenshots.length}`);
    
    // Determine final status
    if (successRate >= 90 && testResults.errors.length === 0) {
      testResults.finalStatus = 'success';
      console.log('\n🎉 ALL TESTS PASSED: Dashboard and Confluence are working correctly!');
    } else if (successRate >= 70) {
      testResults.finalStatus = 'partial';
      console.log('\n⚠️  SOME TESTS FAILED: Dashboard and Confluence have minor issues');
    } else {
      testResults.finalStatus = 'failed';
      console.log('\n❌ CRITICAL ISSUES: Dashboard and Confluence have significant problems');
    }
    
    // Save test results
    const resultsPath = `comprehensive-test-results-${Date.now()}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.errors.push({
      type: 'execution',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    testResults.finalStatus = 'failed';
    
    // Save error screenshot
    await saveScreenshot(page, 'execution-error');
    
    // Save test results even on failure
    const resultsPath = `comprehensive-test-results-${Date.now()}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
  } finally {
    // Clean up
    await context.close();
    await browser.close();
    
    // Kill the server process if it exists
    if (typeof serverProcess !== 'undefined' && serverProcess) {
      serverProcess.kill();
    }
  }
  
  return testResults;
}

// Run the test
runComprehensiveTest()
  .then(results => {
    console.log('\n🏁 Test execution completed');
    process.exit(results.finalStatus === 'success' ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  });