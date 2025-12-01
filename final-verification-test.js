const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const APP_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'testuser1000@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const TIMEOUT = 30000; // 30 seconds timeout for operations
const CONFLUENCE_LOADING_TIMEOUT = 15000; // 15 seconds for Confluence to load

// Test results
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  errors: [],
  warnings: [],
  success: false
};

async function runFinalVerificationTest() {
  console.log('🚀 Starting Final Verification Test...');
  console.log(`📅 Test Time: ${testResults.timestamp}`);
  console.log(`🌐 App URL: ${APP_URL}`);
  console.log(`👤 Test User: ${TEST_USER_EMAIL}`);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: './test-results/' }
  });
  
  // Ensure we're using desktop viewport for navigation
  const page = await context.newPage();
  
  // Capture console logs and errors
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      testResults.errors.push(`Console Error: ${text}`);
      console.error(`❌ Console Error: ${text}`);
    } else if (msg.type() === 'warning') {
      testResults.warnings.push(`Console Warning: ${text}`);
      console.warn(`⚠️ Console Warning: ${text}`);
    } else {
      console.log(`📝 Console Log: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    testResults.errors.push(`Page Error: ${error.message}`);
    console.error(`❌ Page Error: ${error.message}`);
  });
  
  try {
    // Test 1: Start the Next.js development server
    console.log('\n📋 Test 1: Verifying Next.js development server is running...');
    try {
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
      testResults.tests.push({
        name: 'Next.js Development Server',
        status: 'PASSED',
        message: 'Successfully connected to the development server'
      });
      console.log('✅ Next.js development server is running');
    } catch (error) {
      testResults.tests.push({
        name: 'Next.js Development Server',
        status: 'FAILED',
        message: `Failed to connect to development server: ${error.message}`
      });
      testResults.errors.push(`Server Connection Error: ${error.message}`);
      console.error(`❌ Failed to connect to development server: ${error.message}`);
      throw error;
    }
    
    // Test 2: Login with valid credentials
    console.log('\n📋 Test 2: Testing login with valid credentials...');
    try {
      // Check if we're on the login page
      const loginPageVisible = await page.isVisible('text=Login to your account');
      if (!loginPageVisible) {
        // If not on login page, navigate to it
        await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
      }
      
      // Fill in login form
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      
      // Click login button
      await page.click('button:has-text("Sign in")');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: TIMEOUT });
      
      testResults.tests.push({
        name: 'User Authentication',
        status: 'PASSED',
        message: 'Successfully logged in with valid credentials'
      });
      console.log('✅ Login successful');
    } catch (error) {
      testResults.tests.push({
        name: 'User Authentication',
        status: 'FAILED',
        message: `Login failed: ${error.message}`
      });
      testResults.errors.push(`Authentication Error: ${error.message}`);
      console.error(`❌ Login failed: ${error.message}`);
      throw error;
    }
    
    // Test 3: Navigate to Dashboard page
    console.log('\n📋 Test 3: Verifying Dashboard page loads correctly...');
    try {
      // Check if dashboard is loaded
      const dashboardTitle = await page.isVisible('text=Dashboard');
      if (!dashboardTitle) {
        throw new Error('Dashboard title not visible');
      }
      
      // Wait for dashboard components to load
      await page.waitForSelector('[data-testid="metrics-container"]', { timeout: TIMEOUT });
      
      testResults.tests.push({
        name: 'Dashboard Page Load',
        status: 'PASSED',
        message: 'Dashboard page loaded successfully'
      });
      console.log('✅ Dashboard page loaded successfully');
    } catch (error) {
      testResults.tests.push({
        name: 'Dashboard Page Load',
        status: 'FAILED',
        message: `Dashboard page failed to load: ${error.message}`
      });
      testResults.errors.push(`Dashboard Load Error: ${error.message}`);
      console.error(`❌ Dashboard page failed to load: ${error.message}`);
      throw error;
    }
    
    // Test 4: Specifically test the Confluence tab
    console.log('\n📋 Test 4: Testing Confluence tab functionality...');
    try {
      // Click on Confluence tab (it's an icon link, not a button with text)
      await page.click('a[href="/confluence"]');
      
      // Wait for navigation to complete
      await page.waitForURL('**/confluence', { timeout: TIMEOUT });
      
      // Wait for Confluence content to load
      await page.waitForSelector('[data-testid="confluence-container"]', { timeout: CONFLUENCE_LOADING_TIMEOUT });
      
      // Check if Confluence cards are displayed
      const confluenceCardsVisible = await page.isVisible('[data-testid="confluence-card"]');
      if (!confluenceCardsVisible) {
        throw new Error('Confluence cards are not visible');
      }
      
      // Count the number of Confluence cards
      const cardCount = await page.$$eval('[data-testid="confluence-card"]', cards => cards.length);
      console.log(`📊 Found ${cardCount} Confluence cards`);
      
      testResults.tests.push({
        name: 'Confluence Tab Functionality',
        status: 'PASSED',
        message: `Confluence tab loaded successfully with ${cardCount} cards`
      });
      console.log('✅ Confluence tab loaded successfully');
    } catch (error) {
      testResults.tests.push({
        name: 'Confluence Tab Functionality',
        status: 'FAILED',
        message: `Confluence tab failed to load: ${error.message}`
      });
      testResults.errors.push(`Confluence Tab Error: ${error.message}`);
      console.error(`❌ Confluence tab failed to load: ${error.message}`);
      throw error;
    }
    
    // Test 5: Verify all components load correctly
    console.log('\n📋 Test 5: Verifying all dashboard components load correctly...');
    try {
      // Navigate back to Dashboard page first
      await page.click('a[href="/dashboard"]');
      
      // Wait for navigation to complete
      await page.waitForURL('**/dashboard', { timeout: TIMEOUT });
      
      // Wait for dashboard components to load
      await page.waitForSelector('[data-testid="metrics-container"]', { timeout: TIMEOUT });
      
      // Check metrics cards
      const metricsCardsVisible = await page.isVisible('[data-testid="metrics-card"]');
      if (!metricsCardsVisible) {
        throw new Error('Metrics cards are not visible');
      }
      
      // Check charts
      const chartsVisible = await page.isVisible('[data-testid="chart-container"]');
      if (!chartsVisible) {
        throw new Error('Charts are not visible');
      }
      
      // Check recent trades table
      const recentTradesVisible = await page.isVisible('[data-testid="recent-trades-table"]');
      if (!recentTradesVisible) {
        throw new Error('Recent trades table is not visible');
      }
      
      testResults.tests.push({
        name: 'Dashboard Components',
        status: 'PASSED',
        message: 'All dashboard components (metrics cards, charts, recent trades table) loaded correctly'
      });
      console.log('✅ All dashboard components loaded correctly');
    } catch (error) {
      testResults.tests.push({
        name: 'Dashboard Components',
        status: 'FAILED',
        message: `Dashboard components failed to load: ${error.message}`
      });
      testResults.errors.push(`Components Load Error: ${error.message}`);
      console.error(`❌ Dashboard components failed to load: ${error.message}`);
      throw error;
    }
    
    // Test 6: Check for infinite loops or redirect issues
    console.log('\n📋 Test 6: Checking for infinite loops or redirect issues...');
    try {
      // Monitor for rapid redirects or reloads
      let navigationCount = 0;
      page.on('framenavigated', () => {
        navigationCount++;
        if (navigationCount > 5) {
          console.warn(`⚠️ High number of navigations detected: ${navigationCount}`);
        }
      });
      
      // Wait a bit to see if there are any unexpected navigations
      await page.waitForTimeout(5000);
      
      if (navigationCount > 5) {
        throw new Error(`Potential infinite loop detected: ${navigationCount} navigations in 5 seconds`);
      }
      
      testResults.tests.push({
        name: 'Infinite Loop Detection',
        status: 'PASSED',
        message: `No infinite loops detected (${navigationCount} navigations in 5 seconds)`
      });
      console.log(`✅ No infinite loops detected (${navigationCount} navigations in 5 seconds)`);
    } catch (error) {
      testResults.tests.push({
        name: 'Infinite Loop Detection',
        status: 'FAILED',
        message: `Infinite loop or redirect issue detected: ${error.message}`
      });
      testResults.errors.push(`Infinite Loop Error: ${error.message}`);
      console.error(`❌ Infinite loop or redirect issue detected: ${error.message}`);
      throw error;
    }
    
    // All tests passed
    testResults.success = true;
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error(`\n❌ Test failed with error: ${error.message}`);
    testResults.success = false;
  } finally {
    // Save test results
    const resultsPath = path.join(__dirname, 'final-verification-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
    // Take a final screenshot
    await page.screenshot({ path: 'final-verification-screenshot.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    // Close browser
    await browser.close();
  }
  
  return testResults;
}

// Run the test
runFinalVerificationTest()
  .then(results => {
    if (results.success) {
      console.log('\n✅ Final verification test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Final verification test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`\n❌ Test execution error: ${error.message}`);
    process.exit(1);
  });