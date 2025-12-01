const { chromium } = require('playwright');
const fs = require('fs');

async function testAuthenticatedStrategyCRUD() {
  console.log('🚀 Starting Authenticated Strategy CRUD Test...');
  console.log('==========================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };
  
  try {
    // Test 1: Navigate to login page
    console.log('\n📋 Test 1: Navigate to Login Page');
    try {
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      console.log('✅ Login page loaded successfully:', title);
      
      testResults.tests.push({
        name: 'Navigate to Login Page',
        status: 'PASSED',
        details: `Login page loaded with title: ${title}`
      });
      testResults.summary.passed++;
    } catch (error) {
      console.log('❌ Failed to load login page:', error.message);
      testResults.tests.push({
        name: 'Navigate to Login Page',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 2: Login with test credentials
    console.log('\n📋 Test 2: Login with Test Credentials');
    try {
      // Fill in login form
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'testpassword123');
      
      // Click login button
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      
      // Wait for navigation after login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check if we're logged in (redirected to dashboard or strategies)
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/strategies') || !currentUrl.includes('/login')) {
        console.log('✅ Login successful');
        testResults.tests.push({
          name: 'Login with Test Credentials',
          status: 'PASSED',
          details: `Successfully logged in, redirected to: ${currentUrl}`
        });
        testResults.summary.passed++;
      } else {
        console.log('❌ Login failed - still on login page');
        testResults.tests.push({
          name: 'Login with Test Credentials',
          status: 'FAILED',
          details: 'Login failed - still on login page'
        });
        testResults.summary.failed++;
      }
    } catch (error) {
      console.log('❌ Login process failed:', error.message);
      testResults.tests.push({
        name: 'Login with Test Credentials',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 3: Navigate to strategies page
    console.log('\n📋 Test 3: Navigate to Strategies Page');
    try {
      await page.goto('http://localhost:3000/strategies');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const title = await page.title();
      console.log('✅ Strategies page loaded:', title);
      
      testResults.tests.push({
        name: 'Navigate to Strategies Page',
        status: 'PASSED',
        details: `Strategies page loaded with title: ${title}`
      });
      testResults.summary.passed++;
    } catch (error) {
      console.log('❌ Failed to load strategies page:', error.message);
      testResults.tests.push({
        name: 'Navigate to Strategies Page',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 4: Check for schema cache error
    console.log('\n📋 Test 4: Check for Schema Cache Error');
    try {
      const errorMessage = await page.locator('text=An unexpected error occurred while loading the strategy').count();
      const schemaError = await page.locator('text=Could not find the table').count();
      
      if (errorMessage > 0 || schemaError > 0) {
        const errorText = await page.locator('text=An unexpected error occurred while loading the strategy, text=Could not find the table').first().textContent();
        console.log('❌ Schema cache error detected:', errorText);
        testResults.tests.push({
          name: 'Schema Cache Error Check',
          status: 'FAILED',
          details: errorText
        });
        testResults.summary.failed++;
      } else {
        console.log('✅ No schema cache errors detected');
        testResults.tests.push({
          name: 'Schema Cache Error Check',
          status: 'PASSED',
          details: 'No schema cache errors detected'
        });
        testResults.summary.passed++;
      }
    } catch (error) {
      console.log('❌ Failed to check for schema cache error:', error.message);
      testResults.tests.push({
        name: 'Schema Cache Error Check',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 5: Check for strategy display
    console.log('\n📋 Test 5: Check for Strategy Display');
    try {
      const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, .card').count();
      const strategyList = await page.locator('table tbody tr, ul.list-group li').count();
      const noStrategiesMessage = await page.locator('text=No strategies found, text=You haven\'t created any strategies yet').count();
      
      if (strategyCards > 0 || strategyList > 0) {
        console.log(`✅ Strategies displayed: ${strategyCards} cards, ${strategyList} list items`);
        testResults.tests.push({
          name: 'Strategy Display',
          status: 'PASSED',
          details: `Found ${strategyCards} strategy cards and ${strategyList} list items`
        });
        testResults.summary.passed++;
      } else if (noStrategiesMessage > 0) {
        console.log('✅ No strategies message displayed (expected for new account)');
        testResults.tests.push({
          name: 'Strategy Display',
          status: 'PASSED',
          details: 'No strategies message displayed (expected for new account)'
        });
        testResults.summary.passed++;
      } else {
        console.log('❓ No strategy display elements found');
        testResults.tests.push({
          name: 'Strategy Display',
          status: 'UNKNOWN',
          details: 'No strategy display elements found'
        });
      }
    } catch (error) {
      console.log('❌ Failed to check strategy display:', error.message);
      testResults.tests.push({
        name: 'Strategy Display',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 6: Check CRUD operation buttons
    console.log('\n📋 Test 6: Check CRUD Operation Buttons');
    try {
      const createButton = await page.locator('button:has-text("Create"), button:has-text("New Strategy"), a:has-text("Create Strategy")').count();
      
      console.log(`Found ${createButton} create button(s)`);
      
      if (createButton > 0) {
        testResults.tests.push({
          name: 'Create Strategy Button',
          status: 'PASSED',
          details: `Found ${createButton} create button(s)`
        });
        testResults.summary.passed++;
      } else {
        testResults.tests.push({
          name: 'Create Strategy Button',
          status: 'FAILED',
          details: 'No create button found'
        });
        testResults.summary.failed++;
      }
      testResults.summary.total++;
      
      // Test create functionality
      console.log('\n📋 Test 7: Test Create Strategy Functionality');
      try {
        await page.click('button:has-text("Create"), button:has-text("New Strategy"), a:has-text("Create Strategy")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/strategies/create') || currentUrl.includes('/create')) {
          console.log('✅ Navigate to create strategy page successful');
          testResults.tests.push({
            name: 'Create Strategy Navigation',
            status: 'PASSED',
            details: `Navigated to create strategy page: ${currentUrl}`
          });
          testResults.summary.passed++;
        } else {
          console.log('❌ Failed to navigate to create strategy page');
          testResults.tests.push({
            name: 'Create Strategy Navigation',
            status: 'FAILED',
            details: `Failed to navigate to create strategy page. Current URL: ${currentUrl}`
          });
          testResults.summary.failed++;
        }
      } catch (error) {
        console.log('❌ Create strategy navigation failed:', error.message);
        testResults.tests.push({
          name: 'Create Strategy Navigation',
          status: 'FAILED',
          details: error.message
        });
        testResults.summary.failed++;
      }
      testResults.summary.total++;
      
    } catch (error) {
      console.log('❌ Failed to check CRUD buttons:', error.message);
      testResults.tests.push({
        name: 'CRUD Operation Buttons',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
      testResults.summary.total++;
    }
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'authenticated-strategy-test-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved as authenticated-strategy-test-screenshot.png');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.tests.push({
      name: 'Test Execution',
      status: 'FAILED',
      details: error.message
    });
    testResults.summary.failed++;
    testResults.summary.total++;
  } finally {
    await browser.close();
  }
  
  // Save test results
  const resultsJson = JSON.stringify(testResults, null, 2);
  fs.writeFileSync('authenticated-strategy-test-results.json', resultsJson);
  
  // Print summary
  console.log('\n==========================================');
  console.log('📊 TEST SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  console.log('\n📄 Detailed results saved to: authenticated-strategy-test-results.json');
  console.log('📸 Screenshot saved as: authenticated-strategy-test-screenshot.png');
  
  return testResults;
}

// Run the test
testAuthenticatedStrategyCRUD().catch(console.error);