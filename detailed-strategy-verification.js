const { chromium } = require('playwright');
const fs = require('fs');

async function performDetailedStrategyVerification() {
  console.log('🔍 Starting Detailed Strategy Page Verification');
  console.log('=' .repeat(70));
  
  const browser = await chromium.launch({ 
    headless: false,  // Run in visible mode for real browser testing
    slowMo: 500      // Slow down actions for better observation
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
    pageContent: {},
    success: false
  };
  
  try {
    // Navigate to strategies page
    console.log('\n📍 Step 1: Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Check if redirected to login
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/register');
    
    if (isLoginPage) {
      console.log('✅ Redirected to login page - completing authentication...');
      
      // Complete login
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await page.fill('input[type="email"], input[name="email"]', 'testuser@verotrade.com');
      await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
      
      // Navigate to strategies again
      await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    }
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Check for the specific error message
    console.log('\n🚨 Step 2: Checking for strategy loading error...');
    const errorVisible = await page.isVisible('text=An unexpected error occurred while loading the strategy. Please try again.');
    
    if (!errorVisible) {
      console.log('✅ SUCCESS: Strategy loading error NOT found');
      results.tests.push({
        test: 'Strategy Error Resolution',
        status: 'PASS',
        details: 'Error message no longer appears on strategies page'
      });
    } else {
      console.log('❌ FAILURE: Strategy loading error still present');
      results.tests.push({
        test: 'Strategy Error Resolution',
        status: 'FAIL',
        details: 'Error message still appears on strategies page'
      });
      results.errors.push('Strategy loading error still present');
    }
    
    // Analyze page content in detail
    console.log('\n📋 Step 3: Analyzing page content...');
    
    // Check for page title
    const pageTitle = await page.textContent('h1');
    console.log(`📄 Page title: "${pageTitle}"`);
    results.pageContent.title = pageTitle;
    
    // Check for "Create Strategy" button (using the actual text from the code)
    const createStrategyButton = await page.locator('text=Create Strategy').first();
    const createButtonVisible = await createStrategyButton.isVisible();
    console.log(`🔧 Create Strategy button visible: ${createButtonVisible}`);
    results.pageContent.createButtonVisible = createButtonVisible;
    
    if (createButtonVisible) {
      results.tests.push({
        test: 'Create Strategy Button',
        status: 'PASS',
        details: 'Create Strategy button is visible'
      });
    } else {
      results.tests.push({
        test: 'Create Strategy Button',
        status: 'FAIL',
        details: 'Create Strategy button not found'
      });
    }
    
    // Check for empty state message (using the actual text from the code)
    const emptyStateTitle = await page.locator('text=No Strategies Yet').first();
    const emptyStateVisible = await emptyStateTitle.isVisible();
    console.log(`📭 Empty state visible: ${emptyStateVisible}`);
    results.pageContent.emptyStateVisible = emptyStateVisible;
    
    if (emptyStateVisible) {
      console.log('✅ Empty state message found - this is expected for new users');
      results.tests.push({
        test: 'Empty State Message',
        status: 'PASS',
        details: 'Empty state message found (expected for users with no strategies)'
      });
      
      // Get the empty state description
      const emptyStateDesc = await page.locator('text=Create your first trading strategy').first();
      const emptyStateDescVisible = await emptyStateDesc.isVisible();
      console.log(`📝 Empty state description visible: ${emptyStateDescVisible}`);
      results.pageContent.emptyStateDescriptionVisible = emptyStateDescVisible;
    } else {
      console.log('⚠️  No empty state found - checking for strategy content...');
      
      // Look for strategy cards
      const strategyCards = await page.$$('.grid > div');
      console.log(`📊 Strategy cards found: ${strategyCards.length}`);
      results.pageContent.strategyCardsCount = strategyCards.length;
      
      if (strategyCards.length > 0) {
        results.tests.push({
          test: 'Strategy Content',
          status: 'PASS',
          details: `Found ${strategyCards.length} strategy cards`
        });
      } else {
        results.tests.push({
          test: 'Strategy Content',
          status: 'PARTIAL',
          details: 'No error but no strategy content or empty state found'
        });
      }
    }
    
    // Test the Create Strategy button functionality
    if (createButtonVisible) {
      console.log('\n🔧 Step 4: Testing Create Strategy button...');
      
      // Click the create button
      await createStrategyButton.click();
      await page.waitForTimeout(2000);
      
      // Check if we navigated to create page
      const onCreatePage = page.url().includes('/strategies/create');
      console.log(`📍 Navigated to create page: ${onCreatePage}`);
      
      if (onCreatePage) {
        results.tests.push({
          test: 'Create Strategy Navigation',
          status: 'PASS',
          details: 'Successfully navigated to strategy creation page'
        });
      } else {
        results.tests.push({
          test: 'Create Strategy Navigation',
          status: 'FAIL',
          details: 'Failed to navigate to strategy creation page'
        });
      }
      
      // Go back to strategies list
      await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    }
    
    // Test navigation and session persistence
    console.log('\n🧭 Step 5: Testing navigation and session persistence...');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if still authenticated
    const stillAuthenticated = !page.url().includes('/login') && !page.url().includes('/register');
    console.log(`🔐 Session persistent: ${stillAuthenticated}`);
    
    if (stillAuthenticated) {
      results.tests.push({
        test: 'Session Persistence',
        status: 'PASS',
        details: 'User remained authenticated after navigation'
      });
    } else {
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
    console.log(`✅ Error still absent: ${errorStillAbsent}`);
    
    if (errorStillAbsent) {
      results.tests.push({
        test: 'Error Resolution Persistence',
        status: 'PASS',
        details: 'Error remains resolved after navigation'
      });
    } else {
      results.tests.push({
        test: 'Error Resolution Persistence',
        status: 'FAIL',
        details: 'Error reappeared after navigation'
      });
      results.errors.push('Error resolution not persistent');
    }
    
    // Take final screenshot
    const screenshot = await page.screenshot({ 
      path: 'test-screenshots/detailed-strategy-verification.png',
      fullPage: true 
    });
    results.screenshots.push('detailed-strategy-verification.png');
    
    console.log('\n📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    results.errors.push(error.message);
    
    // Try to capture error screenshot
    try {
      const errorScreenshot = await page.screenshot({ 
        path: 'test-screenshots/detailed-verification-error.png',
        fullPage: true 
      });
      results.screenshots.push('detailed-verification-error.png');
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
  
  // Consider it successful if the main error is resolved and core functionality works
  const mainErrorResolved = results.tests.some(t => 
    t.test === 'Strategy Error Resolution' && t.status === 'PASS'
  );
  const coreFunctionalityWorks = results.tests.some(t => 
    (t.test === 'Create Strategy Button' || t.test === 'Empty State Message') && 
    t.status === 'PASS'
  );
  
  results.success = mainErrorResolved && coreFunctionalityWorks && hasNoErrors;
  
  // Save results
  const resultsPath = `detailed-strategy-verification-results-${Date.now()}.json`;
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 DETAILED STRATEGY VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${results.tests.filter(t => t.status === 'FAIL').length}`);
  console.log(`Partial: ${results.tests.filter(t => t.status === 'PARTIAL').length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Overall Status: ${results.success ? '✅ SUCCESS' : '❌ FAILURE'}`);
  console.log('\nTest Details:');
  
  results.tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${status} ${test.test}: ${test.details}`);
  });
  
  console.log('\nPage Content Analysis:');
  console.log(`📄 Page Title: "${results.pageContent.title || 'Not found'}"`);
  console.log(`🔧 Create Button Visible: ${results.pageContent.createButtonVisible || false}`);
  console.log(`📭 Empty State Visible: ${results.pageContent.emptyStateVisible || false}`);
  console.log(`📊 Strategy Cards: ${results.pageContent.strategyCardsCount || 0}`);
  
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
performDetailedStrategyVerification()
  .then(results => {
    console.log('\n🎉 Detailed strategy verification completed!');
    if (results.success) {
      console.log('✅ The strategy page fix is working correctly!');
    } else {
      console.log('❌ There are still issues with the strategy page.');
    }
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });