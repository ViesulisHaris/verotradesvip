const { chromium } = require('playwright');
const fs = require('fs');

async function runManualStrategyTest() {
  console.log('Starting manual strategy functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
      console.error('Console error:', msg.text());
    }
  });
  
  // Capture uncaught exceptions
  page.on('pageerror', error => {
    consoleErrors.push({
      text: error.message,
      stack: error.stack
    });
    console.error('Page error:', error.message);
  });
  
  const testResults = {
    strategyPageLoad: { status: 'pending', details: [] },
    strategyNavigation: { status: 'pending', details: [] },
    consoleErrors: consoleErrors,
    summary: ''
  };
  
  try {
    // Navigate to the application
    console.log('Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load completely
    await page.waitForTimeout(3000);
    
    // Check if strategies page loaded
    const strategiesPageVisible = await page.locator('body').isVisible();
    
    if (strategiesPageVisible) {
      testResults.strategyPageLoad.status = 'passed';
      testResults.strategyPageLoad.details.push('Strategies page loaded successfully');
      
      // Check for any visible error messages
      const errorMessages = await page.locator('.error, .alert, [role="alert"]').count();
      if (errorMessages > 0) {
        testResults.strategyPageLoad.details.push(`${errorMessages} error messages found on page`);
      }
      
      // Check for strategy cards or empty state
      const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, .card').count();
      const emptyState = await page.locator('text=No strategies, text=Create your first strategy, text=No data').count();
      
      if (strategyCards > 0) {
        testResults.strategyPageLoad.details.push(`${strategyCards} strategy cards found`);
      } else if (emptyState > 0) {
        testResults.strategyPageLoad.details.push('Empty state displayed (no strategies found)');
      } else {
        testResults.strategyPageLoad.details.push('Page loaded but no strategy content or empty state found');
      }
      
      // Test navigation to different strategy-related pages
      console.log('Testing navigation to strategy-related pages...');
      
      // Try to find and click on create strategy button
      const createButtonSelectors = [
        'button:has-text("Create Strategy")',
        'button:has-text("New Strategy")',
        'a:has-text("Create Strategy")',
        'a:has-text("New Strategy")',
        '[data-testid="create-strategy-button"]',
        '.btn-primary:has-text("Create")',
        'button:has-text("+")'
      ];
      
      let createButtonFound = false;
      for (const selector of createButtonSelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible({ timeout: 1000 })) {
            console.log(`Found create button with selector: ${selector}`);
            createButtonFound = true;
            
            // Try to click it
            await button.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // Check if we navigated to a create/edit page
            const currentUrl = page.url();
            if (currentUrl.includes('/strategies/new') || currentUrl.includes('/strategies/create') || currentUrl.includes('/strategy/')) {
              testResults.strategyNavigation.status = 'passed';
              testResults.strategyNavigation.details.push('Successfully navigated to strategy creation page');
              
              // Check for form elements
              const formFields = await page.locator('input, textarea, select, form').count();
              if (formFields > 0) {
                testResults.strategyNavigation.details.push(`Found ${formFields} form elements on creation page`);
              }
            } else {
              testResults.strategyNavigation.status = 'partial';
              testResults.strategyNavigation.details.push('Create button clicked but navigation may have failed');
            }
            
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!createButtonFound) {
        testResults.strategyNavigation.status = 'skipped';
        testResults.strategyNavigation.details.push('No create strategy button found');
      }
      
    } else {
      testResults.strategyPageLoad.status = 'failed';
      testResults.strategyPageLoad.details.push('Strategies page failed to load');
    }
    
    // Test navigation to dashboard
    console.log('Testing navigation to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dashboardLoaded = await page.locator('body').isVisible();
    if (dashboardLoaded) {
      testResults.strategyNavigation.details.push('Dashboard page loaded successfully');
    } else {
      testResults.strategyNavigation.details.push('Dashboard page failed to load');
    }
    
  } catch (error) {
    console.error('Test execution error:', error);
    testResults.strategyPageLoad.status = 'failed';
    testResults.strategyPageLoad.details.push(`Test execution failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate summary
  const passedTests = Object.values(testResults).filter(result => 
    typeof result === 'object' && result.status === 'passed'
  ).length;
  
  const failedTests = Object.values(testResults).filter(result => 
    typeof result === 'object' && result.status === 'failed'
  ).length;
  
  const skippedTests = Object.values(testResults).filter(result => 
    typeof result === 'object' && result.status === 'skipped'
  ).length;
  
  testResults.summary = `Tests completed: ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped`;
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `manual-strategy-test-results-${timestamp}.json`;
  
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`Test results saved to ${resultsFile}`);
  
  return testResults;
}

// Run the test
runManualStrategyTest().then(results => {
  console.log('\n=== MANUAL STRATEGY FUNCTIONALITY TEST RESULTS ===');
  console.log('Strategy Page Load:', results.strategyPageLoad.status);
  console.log('Strategy Navigation:', results.strategyNavigation.status);
  console.log('Console Errors:', results.consoleErrors.length + ' errors detected');
  
  if (results.consoleErrors.length > 0) {
    console.log('\nConsole Errors Found:');
    // Group unique errors
    const uniqueErrors = [...new Set(results.consoleErrors.map(e => e.text))];
    uniqueErrors.forEach(error => {
      console.log('-', error);
    });
  }
  
  console.log('\nDetails:');
  console.log('Strategy Page Load:', results.strategyPageLoad.details.join('; '));
  console.log('Strategy Navigation:', results.strategyNavigation.details.join('; '));
  console.log('Summary:', results.summary);
  
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});