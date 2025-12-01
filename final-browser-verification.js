const { chromium } = require('playwright');
const fs = require('fs');

async function performFinalVerification() {
  console.log('🚀 Starting Final Browser Verification for Strategy Page Fix');
  console.log('=' .repeat(70));
  
  const browser = await chromium.launch({ 
    headless: false,  // Run in visible mode for real browser testing
    slowMo: 1000     // Slow down actions for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
    errors: [],
    success: false
  };
  
  try {
    // Test 1: Navigate to strategies page
    console.log('\n📍 Test 1: Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Check if redirected to login
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/register');
    
    if (isLoginPage) {
      console.log('✅ Correctly redirected to login page');
      results.tests.push({
        test: 'Login Redirect',
        status: 'PASS',
        details: `Redirected to: ${currentUrl}`
      });
      
      // Test 2: Complete login process
      console.log('\n🔐 Test 2: Completing login process...');
      
      // Wait for login form to be ready
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      
      // Fill in credentials
      await page.fill('input[type="email"], input[name="email"]', 'testuser@verotrade.com');
      await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');
      
      // Submit login
      await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
      
      console.log('✅ Login form submitted');
      
      // Check if login was successful
      const afterLoginUrl = page.url();
      const isLoggedIn = !afterLoginUrl.includes('/login') && !afterLoginUrl.includes('/register');
      
      if (isLoggedIn) {
        console.log('✅ Login successful - redirected away from login page');
        results.tests.push({
          test: 'Login Process',
          status: 'PASS',
          details: `Redirected to: ${afterLoginUrl}`
        });
      } else {
        console.log('❌ Login failed - still on login page');
        results.tests.push({
          test: 'Login Process',
          status: 'FAIL',
          details: `Still on login page: ${afterLoginUrl}`
        });
        results.errors.push('Login process failed');
      }
    } else {
      console.log('ℹ️  Already logged in or no authentication required');
      results.tests.push({
        test: 'Login Redirect',
        status: 'SKIP',
        details: 'Already authenticated or no auth required'
      });
    }
    
    // Test 3: Navigate to strategies page after authentication
    console.log('\n📊 Test 3: Accessing strategies page after authentication...');
    
    if (!page.url().includes('/strategies')) {
      await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    }
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for the specific error message
    const errorVisible = await page.isVisible('text=An unexpected error occurred while loading the strategy. Please try again.');
    
    if (!errorVisible) {
      console.log('✅ Strategy error message NOT found - fix appears successful');
      results.tests.push({
        test: 'Strategy Error Resolution',
        status: 'PASS',
        details: 'Error message no longer appears on strategies page'
      });
    } else {
      console.log('❌ Strategy error message still present');
      results.tests.push({
        test: 'Strategy Error Resolution',
        status: 'FAIL',
        details: 'Error message still appears on strategies page'
      });
      results.errors.push('Strategy loading error still present');
    }
    
    // Test 4: Check for strategy content
    console.log('\n📋 Test 4: Checking for strategy content...');
    
    // Look for strategy-related elements
    const strategyElements = await page.$$('[data-testid="strategy-item"], .strategy-card, .strategy-row');
    const hasStrategyContent = strategyElements.length > 0;
    
    if (hasStrategyContent) {
      console.log(`✅ Found ${strategyElements.length} strategy elements`);
      results.tests.push({
        test: 'Strategy Content Loading',
        status: 'PASS',
        details: `Found ${strategyElements.length} strategy elements`
      });
    } else {
      console.log('⚠️  No strategy elements found - checking for empty state...');
      
      // Check for empty state message
      const emptyStateVisible = await page.isVisible('text=No strategies found, text=You have no strategies yet, text=Create your first strategy');
      
      if (emptyStateVisible) {
        console.log('✅ Empty state message found - this is acceptable');
        results.tests.push({
          test: 'Strategy Content Loading',
          status: 'PASS',
          details: 'Empty state message found (no strategies but page loads correctly)'
        });
      } else {
        console.log('⚠️  No strategy content or empty state found');
        results.tests.push({
          test: 'Strategy Content Loading',
          status: 'PARTIAL',
          details: 'No error but no strategy content found'
        });
      }
    }
    
    // Test 5: Test strategy functionality
    console.log('\n🔧 Test 5: Testing strategy CRUD operations...');
    
    // Look for create/add strategy button
    const createButtonVisible = await page.isVisible('button:has-text("Create"), button:has-text("Add"), button:has-text("New Strategy")');
    
    if (createButtonVisible) {
      console.log('✅ Create strategy button found');
      results.tests.push({
        test: 'Strategy Create Function',
        status: 'PASS',
        details: 'Create strategy button is available'
      });
      
      // Try clicking create button (but don't complete the process)
      await page.click('button:has-text("Create"), button:has-text("Add"), button:has-text("New Strategy")');
      await page.waitForTimeout(2000);
      
      // Check if we're on a create/edit page or modal opened
      const onCreatePage = page.url().includes('/create') || page.url().includes('/new') || 
                          await page.isVisible('.modal, .dialog, [role="dialog"]');
      
      if (onCreatePage) {
        console.log('✅ Create strategy interface opened successfully');
        results.tests.push({
          test: 'Strategy Create Interface',
          status: 'PASS',
          details: 'Create strategy interface opened correctly'
        });
        
        // Go back to strategies list
        await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
      }
    } else {
      console.log('⚠️  Create strategy button not found');
      results.tests.push({
        test: 'Strategy Create Function',
        status: 'FAIL',
        details: 'Create strategy button not found'
      });
    }
    
    // Test 6: Test navigation and session persistence
    console.log('\n🧭 Test 6: Testing navigation and session persistence...');
    
    // Navigate to another page and back
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if still authenticated
    const stillAuthenticated = !page.url().includes('/login') && !page.url().includes('/register');
    
    if (stillAuthenticated) {
      console.log('✅ Session persisted during navigation');
      results.tests.push({
        test: 'Session Persistence',
        status: 'PASS',
        details: 'User remained authenticated after navigation'
      });
    } else {
      console.log('❌ Session lost during navigation');
      results.tests.push({
        test: 'Session Persistence',
        status: 'FAIL',
        details: 'User was logged out during navigation'
      });
      results.errors.push('Session persistence issue');
    }
    
    // Navigate back to strategies
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if error still doesn't appear
    const errorStillAbsent = !await page.isVisible('text=An unexpected error occurred while loading the strategy. Please try again.');
    
    if (errorStillAbsent) {
      console.log('✅ Error still absent after navigation');
      results.tests.push({
        test: 'Error Resolution Persistence',
        status: 'PASS',
        details: 'Error remains resolved after navigation'
      });
    } else {
      console.log('❌ Error reappeared after navigation');
      results.tests.push({
        test: 'Error Resolution Persistence',
        status: 'FAIL',
        details: 'Error reappeared after navigation'
      });
      results.errors.push('Error resolution not persistent');
    }
    
    // Take final screenshot
    const screenshot = await page.screenshot({ 
      path: 'test-screenshots/final-verification-strategies-page.png',
      fullPage: true 
    });
    results.screenshots.push('final-verification-strategies-page.png');
    
    console.log('\n📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    results.errors.push(error.message);
    
    // Try to capture error screenshot
    try {
      const errorScreenshot = await page.screenshot({ 
        path: 'test-screenshots/final-verification-error.png',
        fullPage: true 
      });
      results.screenshots.push('final-verification-error.png');
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError);
    }
  } finally {
    await browser.close();
  }
  
  // Calculate overall success
  const passedTests = results.tests.filter(t => t.status === 'PASS').length;
  const totalTests = results.tests.length;
  const hasNoErrors = results.errors.length === 0;
  
  results.success = hasNoErrors && passedTests >= totalTests * 0.8; // 80% pass rate
  
  // Save results
  const resultsPath = `final-verification-results-${Date.now()}.json`;
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${results.tests.filter(t => t.status === 'FAIL').length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Overall Status: ${results.success ? '✅ SUCCESS' : '❌ FAILURE'}`);
  console.log('\nTest Details:');
  
  results.tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${status} ${test.test}: ${test.details}`);
  });
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => {
      console.log(`❌ ${error}`);
    });
  }
  
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  console.log('📸 Screenshots saved to: test-screenshots/');
  
  return results;
}

// Run the verification
performFinalVerification()
  .then(results => {
    console.log('\n🎉 Final verification completed!');
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });