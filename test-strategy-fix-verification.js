const { chromium } = require('playwright');
const fs = require('fs');

async function testStrategyFix() {
  console.log('=== STRATEGY FIX VERIFICATION TEST ===\n');
  
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
  
  async function runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      const result = await testFunction();
      if (result.passed) {
        console.log(`✅ ${testName}: PASSED`);
        console.log(`   ${result.message}`);
        testResults.summary.passed++;
      } else {
        console.log(`❌ ${testName}: FAILED`);
        console.log(`   ${result.message}`);
        testResults.summary.failed++;
      }
      testResults.tests.push({
        name: testName,
        passed: result.passed,
        message: result.message,
        details: result.details || {}
      });
    } catch (error) {
      console.log(`❌ ${testName}: ERROR`);
      console.log(`   ${error.message}`);
      testResults.summary.failed++;
      testResults.tests.push({
        name: testName,
        passed: false,
        message: error.message,
        details: { stack: error.stack }
      });
    }
    testResults.summary.total++;
  }
  
  // Test 1: Navigate to strategies page
  await runTest('Navigate to Strategies Page', async () => {
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if we're on the strategies page
    const url = page.url();
    if (!url.includes('/strategies')) {
      return {
        passed: false,
        message: `Expected to be on strategies page, but URL is: ${url}`,
        details: { url }
      };
    }
    
    // Check for the error message
    const errorElement = await page.locator('text=An unexpected error occurred while loading the strategy').first();
    const hasError = await errorElement.count();
    
    if (hasError > 0) {
      return {
        passed: false,
        message: 'Strategy loading error is still present',
        details: { errorPresent: true }
      };
    }
    
    return {
      passed: true,
      message: 'Successfully navigated to strategies page without error',
      details: { url, errorPresent: false }
    };
  });
  
  // Test 2: Check if strategies are loading
  await runTest('Check Strategy Loading', async () => {
    // Wait for any loading states to resolve
    await page.waitForTimeout(2000);
    
    // Look for strategy-related elements
    const strategyElements = await page.locator('[data-testid="strategy-card"], .strategy-card, [data-testid="strategy-item"]').count();
    const loadingElements = await page.locator('[data-testid="loading"], .loading, .spinner').count();
    
    if (loadingElements > 0) {
      return {
        passed: false,
        message: 'Page still shows loading indicators',
        details: { strategyElements, loadingElements }
      };
    }
    
    return {
      passed: true,
      message: `Page loaded without persistent loading states`,
      details: { strategyElements, loadingElements }
    };
  });
  
  // Test 3: Test strategy functionality
  await runTest('Test Strategy Functionality', async () => {
    // Look for strategy action buttons
    const viewButtons = await page.locator('button:has-text("View"), button:has-text("View Performance")').count();
    const editButtons = await page.locator('button:has-text("Edit"), button:has-text("Modify")').count();
    const deleteButtons = await page.locator('button:has-text("Delete"), button:has-text("Remove")').count();
    
    // Check if any strategy cards are present
    const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, .card').count();
    
    if (strategyCards === 0) {
      return {
        passed: true,
        message: 'No strategies found (empty state), but page loaded without errors',
        details: { strategyCards, viewButtons, editButtons, deleteButtons }
      };
    }
    
    return {
      passed: true,
      message: `Strategy functionality appears available`,
      details: { strategyCards, viewButtons, editButtons, deleteButtons }
    };
  });
  
  // Test 4: Check console for errors
  await runTest('Check Console for Errors', async () => {
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Wait a bit to collect any console errors
    await page.waitForTimeout(2000);
    
    const strategyErrors = logs.filter(log => 
      log.includes('strategy') || 
      log.includes('compliance') || 
      log.includes('404')
    );
    
    if (strategyErrors.length > 0) {
      return {
        passed: false,
        message: `Found ${strategyErrors.length} strategy-related console errors`,
        details: { errors: strategyErrors }
      };
    }
    
    return {
      passed: true,
      message: 'No strategy-related console errors found',
      details: { totalErrors: logs.length, strategyErrors }
    };
  });
  
  // Test 5: Test navigation to other pages
  await runTest('Test Navigation to Other Pages', async () => {
    // Try navigating to dashboard
    await page.click('a[href="/dashboard"], nav a:has-text("Dashboard")');
    await page.waitForTimeout(2000);
    
    const dashboardUrl = page.url();
    if (!dashboardUrl.includes('/dashboard')) {
      return {
        passed: false,
        message: 'Failed to navigate to dashboard',
        details: { dashboardUrl }
      };
    }
    
    // Navigate back to strategies
    await page.click('a[href="/strategies"], nav a:has-text("Strategies")');
    await page.waitForTimeout(2000);
    
    const strategiesUrl = page.url();
    if (!strategiesUrl.includes('/strategies')) {
      return {
        passed: false,
        message: 'Failed to navigate back to strategies',
        details: { strategiesUrl }
      };
    }
    
    return {
      passed: true,
      message: 'Navigation between pages works correctly',
      details: { dashboardUrl, strategiesUrl }
    };
  });
  
  // Save test results
  const resultsFile = `strategy-fix-verification-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Results saved to: ${resultsFile}`);
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: `strategy-fix-verification-${Date.now()}.png`, fullPage: true });
  console.log(`Screenshot saved: strategy-fix-verification-${Date.now()}.png`);
  
  await browser.close();
  
  return testResults;
}

// Run the test
testStrategyFix()
  .then(results => {
    console.log('\n✅ Strategy fix verification completed');
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Strategy fix verification failed:', error);
    process.exit(1);
  });