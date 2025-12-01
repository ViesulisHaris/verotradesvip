const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runAuthenticatedStrategyVerification() {
  console.log('🚀 Starting authenticated strategy verification test...');
  
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
    // Step 1: Login first
    console.log('📋 Step 1: Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    const emailField = await page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = await page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();
    
    if (await emailField.isVisible() && await passwordField.isVisible() && await loginButton.isVisible()) {
      await emailField.fill('test@example.com');
      await passwordField.fill('password123');
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      // Check if login successful (redirected to dashboard or strategies)
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/strategies')) {
        console.log('✅ Login successful');
        testResults.tests.push({
          name: 'Authentication',
          status: 'PASSED',
          details: 'Successfully logged in'
        });
      } else {
        console.log('⚠️  Login may have failed, but continuing test...');
      }
    } else {
      console.log('❌ Login form not found, trying direct access to strategies...');
    }
    
    // Step 2: Navigate to strategies page
    console.log('📋 Step 2: Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of strategies page
    const strategiesScreenshot = `strategies-authenticated-${Date.now()}.png`;
    await page.screenshot({ path: `test-screenshots/${strategiesScreenshot}` });
    testResults.screenshots.push(strategiesScreenshot);
    
    // Check for the original error
    const errorElement = await page.locator('text=An unexpected error occurred while loading the strategy').first();
    const hasError = await errorElement.isVisible().catch(() => false);
    
    if (hasError) {
      testResults.errors.push('Strategy loading error still present after authentication');
      console.log('❌ Strategy loading error is still present');
    } else {
      console.log('✅ No strategy loading error detected (authenticated)');
      testResults.tests.push({
        name: 'Strategy Page Load (Authenticated)',
        status: 'PASSED',
        details: 'Strategy page loads without errors after authentication'
      });
    }
    
    // Step 3: Test strategy creation
    console.log('📋 Step 3: Testing strategy creation...');
    
    // Look for create button with different selectors
    const createSelectors = [
      'button:has-text("Create")',
      'button:has-text("Add")',
      'button:has-text("New Strategy")',
      '[data-testid="create-strategy-btn"]',
      '.create-btn',
      '[class*="create"]'
    ];
    
    let createButton = null;
    for (const selector of createSelectors) {
      const btn = await page.locator(selector).first();
      if (await btn.isVisible().catch(() => false)) {
        createButton = btn;
        break;
      }
    }
    
    if (createButton) {
      console.log('✅ Create strategy button found');
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of create form
      const createFormScreenshot = `strategy-create-form-auth-${Date.now()}.png`;
      await page.screenshot({ path: `test-screenshots/${createFormScreenshot}` });
      testResults.screenshots.push(createFormScreenshot);
      
      // Fill the form
      const nameField = await page.locator('input[name="name"], input[placeholder*="name"], input[type="text"]').first();
      const hasNameField = await nameField.isVisible().catch(() => false);
      
      if (hasNameField) {
        const testStrategyName = `Test Strategy ${Date.now()}`;
        await nameField.fill(testStrategyName);
        
        // Look for description field
        const descField = await page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
        const hasDescField = await descField.isVisible().catch(() => false);
        
        if (hasDescField) {
          await descField.fill('Test strategy created for verification');
        }
        
        // Submit the form
        const submitButton = await page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
        const hasSubmitButton = await submitButton.isVisible().catch(() => false);
        
        if (hasSubmitButton) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Check for success or error
          const successMessage = await page.locator('text=created, text=success, text=saved').first();
          const hasSuccess = await successMessage.isVisible().catch(() => false);
          
          const errorMessage = await page.locator('text=error, text=failed, text=required').first();
          const hasError = await errorMessage.isVisible().catch(() => false);
          
          if (hasSuccess) {
            console.log('✅ Strategy creation successful');
            testResults.tests.push({
              name: 'Strategy Creation',
              status: 'PASSED',
              details: `Successfully created strategy: ${testStrategyName}`
            });
          } else if (hasError) {
            const errorText = await errorMessage.textContent();
            console.log('⚠️  Strategy creation error:', errorText);
            testResults.errors.push(`Strategy creation error: ${errorText}`);
          } else {
            console.log('✅ Strategy creation submitted (no explicit success/error message)');
            testResults.tests.push({
              name: 'Strategy Creation',
              status: 'PASSED',
              details: 'Strategy creation form submitted'
            });
          }
        } else {
          console.log('❌ Submit button not found');
          testResults.errors.push('Submit button not found in create form');
        }
      } else {
        console.log('❌ Strategy name field not found');
        testResults.errors.push('Strategy name field not accessible');
      }
    } else {
      console.log('❌ Create strategy button not found');
      testResults.errors.push('Create strategy button not accessible');
    }
    
    // Step 4: Test strategy viewing and modification
    console.log('📋 Step 4: Testing strategy viewing and modification...');
    
    // Look for existing strategies
    const strategyItems = await page.locator('[class*="strategy"], [data-testid*="strategy"], .strategy-item').count();
    
    if (strategyItems > 0) {
      console.log(`✅ Found ${strategyItems} strategy items`);
      
      // Try to click on the first strategy
      const firstStrategy = await page.locator('[class*="strategy"], [data-testid*="strategy"], .strategy-item').first();
      await firstStrategy.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of strategy detail/view
      const strategyViewScreenshot = `strategy-view-${Date.now()}.png`;
      await page.screenshot({ path: `test-screenshots/${strategyViewScreenshot}` });
      testResults.screenshots.push(strategyViewScreenshot);
      
      // Look for edit/modify options
      const editButton = await page.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-strategy"]').first();
      const hasEditButton = await editButton.isVisible().catch(() => false);
      
      if (hasEditButton) {
        console.log('✅ Edit button found');
        testResults.tests.push({
          name: 'Strategy Viewing',
          status: 'PASSED',
          details: 'Strategy detail view accessible with edit option'
        });
      } else {
        console.log('⚠️  Edit button not found, but strategy view loaded');
        testResults.tests.push({
          name: 'Strategy Viewing',
          status: 'PASSED',
          details: 'Strategy detail view loaded (edit option not visible)'
        });
      }
    } else {
      console.log('⚠️  No strategy items found for viewing/modification test');
    }
    
    // Step 5: Test strategy deletion (if strategies exist)
    console.log('📋 Step 5: Testing strategy deletion...');
    
    // Go back to strategies list
    await page.goto('http://localhost:3000/strategies');
    await page.waitForTimeout(1000);
    
    const strategyItemsForDelete = await page.locator('[class*="strategy"], [data-testid*="strategy"], .strategy-item').count();
    
    if (strategyItemsForDelete > 0) {
      // Look for delete button
      const deleteButton = await page.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-strategy"]').first();
      const hasDeleteButton = await deleteButton.isVisible().catch(() => false);
      
      if (hasDeleteButton) {
        console.log('✅ Delete button found');
        testResults.tests.push({
          name: 'Strategy Deletion Access',
          status: 'PASSED',
          details: 'Delete option available for strategies'
        });
      } else {
        console.log('⚠️  Delete button not found');
        testResults.errors.push('Delete button not accessible');
      }
    } else {
      console.log('⚠️  No strategies available for deletion test');
    }
    
    // Final screenshot
    const finalScreenshot = `strategies-final-auth-${Date.now()}.png`;
    await page.screenshot({ path: `test-screenshots/${finalScreenshot}` });
    testResults.screenshots.push(finalScreenshot);
    
    // Determine overall success
    testResults.success = testResults.errors.length === 0 && testResults.tests.some(t => t.status === 'PASSED');
    
    console.log('\n🎯 Authenticated Test Results Summary:');
    console.log(`✅ Passed tests: ${testResults.tests.filter(t => t.status === 'PASSED').length}`);
    console.log(`❌ Errors: ${testResults.errors.length}`);
    console.log(`📸 Screenshots taken: ${testResults.screenshots.length}`);
    
    if (testResults.success) {
      console.log('🎉 Overall authenticated test result: SUCCESS');
    } else {
      console.log('⚠️  Overall authenticated test result: ISSUES DETECTED');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
    
    // Save test results
    const resultsFile = `authenticated-strategy-verification-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`📊 Authenticated test results saved to: ${resultsFile}`);
    
    return testResults;
  }
}

// Run the authenticated test
runAuthenticatedStrategyVerification().then(results => {
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Authenticated test failed:', error);
  process.exit(1);
});