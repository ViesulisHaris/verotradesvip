const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runBrowserStrategyVerification() {
  console.log('🚀 Starting browser strategy verification test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test results
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
    errors: [],
    success: false
  };
  
  try {
    // Test 1: Navigate to strategies page
    console.log('📋 Test 1: Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial load
    const initialScreenshot = `strategies-initial-load-${Date.now()}.png`;
    await page.screenshot({ path: `test-screenshots/${initialScreenshot}` });
    testResults.screenshots.push(initialScreenshot);
    
    // Check for error message
    const errorElement = await page.locator('text=An unexpected error occurred while loading the strategy').first();
    const hasError = await errorElement.isVisible().catch(() => false);
    
    if (hasError) {
      testResults.errors.push('Strategy loading error still present');
      console.log('❌ Strategy loading error is still present');
    } else {
      console.log('✅ No strategy loading error detected');
    }
    
    // Test 2: Check if strategies are displayed
    console.log('📋 Test 2: Checking if strategies are displayed...');
    const strategyElements = await page.locator('[data-testid="strategy-item"], .strategy-item, [class*="strategy"]').count();
    
    if (strategyElements > 0) {
      console.log(`✅ Found ${strategyElements} strategy elements on the page`);
      testResults.tests.push({
        name: 'Strategy Display',
        status: 'PASSED',
        details: `Found ${strategyElements} strategies`
      });
    } else {
      console.log('⚠️  No strategy elements found - checking for empty state');
      const emptyState = await page.locator('text=No strategies, text=No data, text=empty').first();
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      
      if (hasEmptyState) {
        console.log('✅ Empty state displayed correctly');
        testResults.tests.push({
          name: 'Empty State Display',
          status: 'PASSED',
          details: 'Empty state shown when no strategies exist'
        });
      } else {
        console.log('❌ No strategies or empty state found');
        testResults.errors.push('No strategies or empty state displayed');
      }
    }
    
    // Test 3: Test strategy creation workflow
    console.log('📋 Test 3: Testing strategy creation workflow...');
    
    // Look for create button
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Strategy"), [data-testid="create-strategy-btn"]').first();
    const hasCreateButton = await createButton.isVisible().catch(() => false);
    
    if (hasCreateButton) {
      console.log('✅ Create strategy button found');
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of create form
      const createFormScreenshot = `strategy-create-form-${Date.now()}.png`;
      await page.screenshot({ path: `test-screenshots/${createFormScreenshot}` });
      testResults.screenshots.push(createFormScreenshot);
      
      // Check if form fields are present
      const nameField = await page.locator('input[name="name"], input[placeholder*="name"], input[type="text"]').first();
      const hasNameField = await nameField.isVisible().catch(() => false);
      
      if (hasNameField) {
        console.log('✅ Strategy creation form is accessible');
        testResults.tests.push({
          name: 'Strategy Creation Form',
          status: 'PASSED',
          details: 'Create form loads and has required fields'
        });
        
        // Try to fill the form
        await nameField.fill(`Test Strategy ${Date.now()}`);
        
        // Look for description field
        const descField = await page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
        const hasDescField = await descField.isVisible().catch(() => false);
        
        if (hasDescField) {
          await descField.fill('Test strategy for verification');
        }
        
        // Look for submit button
        const submitButton = await page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
        const hasSubmitButton = await submitButton.isVisible().catch(() => false);
        
        if (hasSubmitButton) {
          console.log('✅ Submit button found, testing submission...');
          
          // Try to submit the form
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // Check for any error messages after submission
          const submitError = await page.locator('text=error, text=failed, text=required').first();
          const hasSubmitError = await submitError.isVisible().catch(() => false);
          
          if (hasSubmitError) {
            const errorText = await submitError.textContent();
            console.log('⚠️  Form submission error:', errorText);
            testResults.errors.push(`Form submission error: ${errorText}`);
          } else {
            console.log('✅ Form submitted without immediate errors');
            testResults.tests.push({
              name: 'Strategy Submission',
              status: 'PASSED',
              details: 'Form submission completed without errors'
            });
          }
        } else {
          console.log('❌ Submit button not found');
          testResults.errors.push('Submit button not found in create form');
        }
      } else {
        console.log('❌ Strategy creation form fields not found');
        testResults.errors.push('Strategy creation form fields not accessible');
      }
    } else {
      console.log('❌ Create strategy button not found');
      testResults.errors.push('Create strategy button not accessible');
    }
    
    // Test 4: Check for performance metrics display
    console.log('📋 Test 4: Checking for performance metrics...');
    const performanceElements = await page.locator('[class*="performance"], [class*="stats"], [class*="metrics"]').count();
    
    if (performanceElements > 0) {
      console.log('✅ Performance metrics elements found');
      testResults.tests.push({
        name: 'Performance Metrics Display',
        status: 'PASSED',
        details: `Found ${performanceElements} performance-related elements`
      });
    } else {
      console.log('⚠️  No performance metrics elements found');
    }
    
    // Test 5: Check navigation and page functionality
    console.log('📋 Test 5: Testing page navigation...');
    
    // Try to navigate to other pages and back
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);
    
    await page.goto('http://localhost:3000/strategies');
    await page.waitForTimeout(1000);
    
    // Check if page loads correctly after navigation
    const navigationError = await page.locator('text=An unexpected error occurred while loading the strategy').first();
    const hasNavigationError = await navigationError.isVisible().catch(() => false);
    
    if (!hasNavigationError) {
      console.log('✅ Page navigation works correctly');
      testResults.tests.push({
        name: 'Page Navigation',
        status: 'PASSED',
        details: 'Strategies page loads correctly after navigation'
      });
    } else {
      console.log('❌ Navigation error detected');
      testResults.errors.push('Navigation error: Strategy error appears after navigation');
    }
    
    // Final screenshot
    const finalScreenshot = `strategies-final-state-${Date.now()}.png`;
    await page.screenshot({ path: `test-screenshots/${finalScreenshot}` });
    testResults.screenshots.push(finalScreenshot);
    
    // Determine overall success
    testResults.success = testResults.errors.length === 0 && testResults.tests.some(t => t.status === 'PASSED');
    
    console.log('\n🎯 Test Results Summary:');
    console.log(`✅ Passed tests: ${testResults.tests.filter(t => t.status === 'PASSED').length}`);
    console.log(`❌ Errors: ${testResults.errors.length}`);
    console.log(`📸 Screenshots taken: ${testResults.screenshots.length}`);
    
    if (testResults.success) {
      console.log('🎉 Overall test result: SUCCESS');
    } else {
      console.log('⚠️  Overall test result: ISSUES DETECTED');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
    
    // Save test results
    const resultsFile = `browser-strategy-verification-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`📊 Test results saved to: ${resultsFile}`);
    
    return testResults;
  }
}

// Run the test
runBrowserStrategyVerification().then(results => {
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});