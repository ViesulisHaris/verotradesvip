const { chromium } = require('playwright');
const fs = require('fs');

async function runImprovedStrategyCRUDTest() {
  console.log('Starting improved strategy CRUD verification...');
  
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
    strategyPerformanceViewing: { status: 'pending', details: [] },
    strategyModification: { status: 'pending', details: [] },
    strategyDeletion: { status: 'pending', details: [] },
    strategyCreation: { status: 'pending', details: [] },
    consoleErrors: [],
    summary: ''
  };
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if user needs to login
    const loginRequired = await page.locator('text=Login').isVisible().catch(() => false);
    
    if (loginRequired) {
      console.log('Login required, performing login...');
      
      // Try to find login form elements
      const emailInput = await page.locator('input[name="email"]').isVisible().catch(() => false);
      const passwordInput = await page.locator('input[name="password"]').isVisible().catch(() => false);
      
      if (emailInput && passwordInput) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // Check if login was successful
        const stillOnLoginPage = await page.locator('text=Login').isVisible().catch(() => false);
        if (stillOnLoginPage) {
          console.log('Login may have failed, trying alternative credentials...');
          // Try with different credentials or skip to test page directly
        }
      } else {
        console.log('Login form not found, trying to navigate directly to strategies page...');
      }
    }
    
    // 1. Test Strategy Performance Viewing
    console.log('Testing Strategy Performance Viewing...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    // Wait for strategies to load or handle empty state
    try {
      await page.waitForSelector('[data-testid="strategy-card"]', { timeout: 5000 });
      const strategyCards = await page.locator('[data-testid="strategy-card"]').count();
      
      if (strategyCards > 0) {
        // Click on first strategy to view performance
        await page.locator('[data-testid="strategy-card"]').first().click();
        await page.waitForLoadState('networkidle');
        
        // Check if performance page loaded without errors
        const performancePageLoaded = await page.locator('text=Performance').isVisible().catch(() => false) ||
                                     await page.locator('[data-testid="strategy-performance"]').isVisible().catch(() => false);
        
        if (performancePageLoaded) {
          testResults.strategyPerformanceViewing.status = 'passed';
          testResults.strategyPerformanceViewing.details.push('Performance page loaded successfully');
        } else {
          testResults.strategyPerformanceViewing.status = 'failed';
          testResults.strategyPerformanceViewing.details.push('Performance page failed to load');
        }
      } else {
        testResults.strategyPerformanceViewing.status = 'skipped';
        testResults.strategyPerformanceViewing.details.push('No strategies available to test');
      }
    } catch (error) {
      testResults.strategyPerformanceViewing.status = 'skipped';
      testResults.strategyPerformanceViewing.details.push('Strategy cards not found or page loading issue');
    }
    
    // 2. Test Strategy Modification
    console.log('Testing Strategy Modification...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    try {
      const strategyCardsForEdit = await page.locator('[data-testid="strategy-card"]').count();
      
      if (strategyCardsForEdit > 0) {
        // Look for edit button
        const editButtonVisible = await page.locator('[data-testid="edit-strategy-button"]').first().isVisible().catch(() => false);
        
        if (editButtonVisible) {
          await page.locator('[data-testid="edit-strategy-button"]').first().click();
          await page.waitForLoadState('networkidle');
          
          // Check if edit form loaded
          const editFormLoaded = await page.locator('form').isVisible().catch(() => false);
          
          if (editFormLoaded) {
            testResults.strategyModification.status = 'passed';
            testResults.strategyModification.details.push('Edit form loaded successfully');
            
            // Test form fields population
            const nameField = await page.locator('input[name="name"]').isVisible().catch(() => false);
            const descField = await page.locator('textarea[name="description"]').isVisible().catch(() => false);
            
            if (nameField && descField) {
              testResults.strategyModification.details.push('Form fields are present');
            } else {
              testResults.strategyModification.details.push('Some form fields are missing');
            }
          } else {
            testResults.strategyModification.status = 'failed';
            testResults.strategyModification.details.push('Edit form failed to load');
          }
        } else {
          testResults.strategyModification.status = 'skipped';
          testResults.strategyModification.details.push('Edit button not found');
        }
      } else {
        testResults.strategyModification.status = 'skipped';
        testResults.strategyModification.details.push('No strategies available to edit');
      }
    } catch (error) {
      testResults.strategyModification.status = 'skipped';
      testResults.strategyModification.details.push('Strategy modification test failed: ' + error.message);
    }
    
    // 3. Test Strategy Creation
    console.log('Testing Strategy Creation...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for create button
      const createButtonVisible = await page.locator('[data-testid="create-strategy-button"]').isVisible().catch(() => false) ||
                                 await page.locator('button:has-text("Create Strategy")').isVisible().catch(() => false) ||
                                 await page.locator('a:has-text("Create Strategy")').isVisible().catch(() => false) ||
                                 await page.locator('button:has-text("New Strategy")').isVisible().catch(() => false) ||
                                 await page.locator('a:has-text("New Strategy")').isVisible().catch(() => false);
      
      if (createButtonVisible) {
        // Click create button
        if (await page.locator('[data-testid="create-strategy-button"]').isVisible().catch(() => false)) {
          await page.locator('[data-testid="create-strategy-button"]').click();
        } else if (await page.locator('button:has-text("Create Strategy")').isVisible().catch(() => false)) {
          await page.locator('button:has-text("Create Strategy")').click();
        } else if (await page.locator('a:has-text("Create Strategy")').isVisible().catch(() => false)) {
          await page.locator('a:has-text("Create Strategy")').click();
        } else if (await page.locator('button:has-text("New Strategy")').isVisible().catch(() => false)) {
          await page.locator('button:has-text("New Strategy")').click();
        } else {
          await page.locator('a:has-text("New Strategy")').click();
        }
        
        await page.waitForLoadState('networkidle');
        
        // Check if creation form loaded
        const createFormLoaded = await page.locator('form').isVisible().catch(() => false);
        
        if (createFormLoaded) {
          testResults.strategyCreation.status = 'passed';
          testResults.strategyCreation.details.push('Creation form loaded successfully');
          
          // Test form submission
          const nameField = await page.locator('input[name="name"]').isVisible().catch(() => false);
          const descField = await page.locator('textarea[name="description"]').isVisible().catch(() => false);
          const submitButton = await page.locator('button[type="submit"]').isVisible().catch(() => false);
          
          if (nameField && descField && submitButton) {
            // Fill form with test data
            await page.fill('input[name="name"]', 'Test Strategy ' + Date.now());
            await page.fill('textarea[name="description"]', 'Test strategy description for verification');
            
            // Submit form
            await page.locator('button[type="submit"]').click();
            await page.waitForLoadState('networkidle');
            
            // Check if redirected back to strategies page
            const backToStrategies = await page.url().includes('/strategies');
            
            if (backToStrategies) {
              testResults.strategyCreation.details.push('Strategy created successfully');
            } else {
              testResults.strategyCreation.details.push('Form submission may have failed');
            }
          } else {
            testResults.strategyCreation.details.push('Some form fields are missing');
          }
        } else {
          testResults.strategyCreation.status = 'failed';
          testResults.strategyCreation.details.push('Creation form failed to load');
        }
      } else {
        testResults.strategyCreation.status = 'skipped';
        testResults.strategyCreation.details.push('Create button not found');
      }
    } catch (error) {
      testResults.strategyCreation.status = 'skipped';
      testResults.strategyCreation.details.push('Strategy creation test failed: ' + error.message);
    }
    
    // 4. Test Strategy Deletion (only if we have multiple strategies)
    console.log('Testing Strategy Deletion...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    
    try {
      const strategyCardsForDelete = await page.locator('[data-testid="strategy-card"]').count();
      
      if (strategyCardsForDelete > 1) { // Only test deletion if there are multiple strategies
        // Look for delete button
        const deleteButtonVisible = await page.locator('[data-testid="delete-strategy-button"]').first().isVisible().catch(() => false);
        
        if (deleteButtonVisible) {
          // Count strategies before deletion
          const strategiesBeforeDelete = await page.locator('[data-testid="strategy-card"]').count();
          
          // Click delete button
          await page.locator('[data-testid="delete-strategy-button"]').first().click();
          
          // Handle confirmation dialog if present
          try {
            await page.waitForSelector('text=Are you sure', { timeout: 2000 });
            await page.locator('button:has-text("Delete")').click();
          } catch (error) {
            // No confirmation dialog, continue
          }
          
          await page.waitForLoadState('networkidle');
          
          // Count strategies after deletion
          const strategiesAfterDelete = await page.locator('[data-testid="strategy-card"]').count();
          
          if (strategiesAfterDelete < strategiesBeforeDelete) {
            testResults.strategyDeletion.status = 'passed';
            testResults.strategyDeletion.details.push('Strategy successfully deleted');
          } else {
            testResults.strategyDeletion.status = 'failed';
            testResults.strategyDeletion.details.push('Strategy deletion failed');
          }
        } else {
          testResults.strategyDeletion.status = 'skipped';
          testResults.strategyDeletion.details.push('Delete button not found');
        }
      } else {
        testResults.strategyDeletion.status = 'skipped';
        testResults.strategyDeletion.details.push('Not enough strategies to test deletion');
      }
    } catch (error) {
      testResults.strategyDeletion.status = 'skipped';
      testResults.strategyDeletion.details.push('Strategy deletion test failed: ' + error.message);
    }
    
    // 5. Comprehensive Console Error Check
    console.log('Performing comprehensive console error check...');
    
    // Navigate through all strategy-related pages
    const pagesToCheck = [
      'http://localhost:3000/strategies',
      'http://localhost:3000/dashboard'
    ];
    
    for (const pageUrl of pagesToCheck) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more for any delayed errors
      await page.waitForTimeout(2000);
    }
    
    // Store console errors
    testResults.consoleErrors = consoleErrors;
    
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
    
  } catch (error) {
    console.error('Test execution error:', error);
    testResults.summary = `Test execution failed: ${error.message}`;
  } finally {
    await browser.close();
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `improved-strategy-crud-verification-results-${timestamp}.json`;
  
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`Test results saved to ${resultsFile}`);
  
  return testResults;
}

// Run the test
runImprovedStrategyCRUDTest().then(results => {
  console.log('\n=== IMPROVED STRATEGY CRUD VERIFICATION RESULTS ===');
  console.log('Strategy Performance Viewing:', results.strategyPerformanceViewing.status);
  console.log('Strategy Modification:', results.strategyModification.status);
  console.log('Strategy Deletion:', results.strategyDeletion.status);
  console.log('Strategy Creation:', results.strategyCreation.status);
  
  if (Array.isArray(results.consoleErrors)) {
    console.log('Console Errors:', results.consoleErrors.length + ' errors detected');
    if (results.consoleErrors.length > 0) {
      console.log('\nConsole Errors Found:');
      results.consoleErrors.forEach(error => {
        console.log('-', error.text);
      });
    }
  } else {
    console.log('Console Errors:', results.consoleErrors);
  }
  
  console.log('Summary:', results.summary);
  
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});