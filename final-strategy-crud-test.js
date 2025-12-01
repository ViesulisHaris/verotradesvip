const { chromium } = require('playwright');
const fs = require('fs');

async function runFinalStrategyCRUDTest() {
  console.log('Starting final strategy CRUD functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console errors but filter out Supabase-related errors for now
  const consoleErrors = [];
  const supabaseErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorMsg = msg.text();
      consoleErrors.push({
        text: errorMsg,
        location: msg.location()
      });
      
      // Categorize errors
      if (errorMsg.includes('supabaseKey is required') || 
          errorMsg.includes('SchemaValidator') ||
          errorMsg.includes('[CACHE]')) {
        supabaseErrors.push(errorMsg);
      } else {
        console.error('Non-Supabase console error:', errorMsg);
      }
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
    strategyCreationNavigation: { status: 'pending', details: [] },
    strategyCreationForm: { status: 'pending', details: [] },
    strategyCardInteraction: { status: 'pending', details: [] },
    strategyEditNavigation: { status: 'pending', details: [] },
    strategyDeletion: { status: 'pending', details: [] },
    consoleErrors: consoleErrors,
    supabaseErrors: supabaseErrors,
    summary: ''
  };
  
  try {
    // Navigate to strategies page
    console.log('1. Testing Strategy Page Load...');
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    const bodyVisible = await page.locator('body').isVisible();
    
    if (bodyVisible && pageTitle.toLowerCase().includes('strateg')) {
      testResults.strategyPageLoad.status = 'passed';
      testResults.strategyPageLoad.details.push('Strategies page loaded successfully');
      
      // Check for key elements
      const createButton = await page.locator('a[href="/strategies/create"]').first();
      const createButtonVisible = await createButton.isVisible().catch(() => false);
      
      if (createButtonVisible) {
        testResults.strategyPageLoad.details.push('Create Strategy button found');
      } else {
        testResults.strategyPageLoad.details.push('Create Strategy button not found');
      }
      
      // Check for empty state or strategy cards
      const emptyState = await page.locator('text=No Strategies Yet').isVisible().catch(() => false);
      const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card').count().catch(() => 0);
      
      if (emptyState) {
        testResults.strategyPageLoad.details.push('Empty state displayed (no strategies)');
      } else if (strategyCards > 0) {
        testResults.strategyPageLoad.details.push(`${strategyCards} strategy cards found`);
      } else {
        testResults.strategyPageLoad.details.push('No strategy content or empty state detected');
      }
    } else {
      testResults.strategyPageLoad.status = 'failed';
      testResults.strategyPageLoad.details.push('Strategies page failed to load');
    }
    
    // Test Strategy Creation Navigation
    console.log('2. Testing Strategy Creation Navigation...');
    const createButton = await page.locator('a[href="/strategies/create"]').first();
    const createButtonVisible = await createButton.isVisible().catch(() => false);
    
    if (createButtonVisible) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/strategies/create')) {
        testResults.strategyCreationNavigation.status = 'passed';
        testResults.strategyCreationNavigation.details.push('Successfully navigated to strategy creation page');
        
        // Test Strategy Creation Form
        console.log('3. Testing Strategy Creation Form...');
        
        // Check for form elements
        const nameInput = await page.locator('input[name="name"], input[placeholder*="Strategy"]').first();
        const descriptionTextarea = await page.locator('textarea[name="description"], textarea[placeholder*="Describe"]').first();
        const submitButton = await page.locator('button[type="submit"], button:has-text("Create Strategy")').first();
        
        const nameInputVisible = await nameInput.isVisible().catch(() => false);
        const descriptionVisible = await descriptionTextarea.isVisible().catch(() => false);
        const submitVisible = await submitButton.isVisible().catch(() => false);
        
        if (nameInputVisible && descriptionVisible && submitVisible) {
          testResults.strategyCreationForm.status = 'passed';
          testResults.strategyCreationForm.details.push('Strategy creation form loaded with all required elements');
          
          // Test form interaction
          await nameInput.fill('Test Strategy ' + Date.now());
          await descriptionTextarea.fill('This is a test strategy for verification purposes');
          
          // Check if we can fill the form
          const nameValue = await nameInput.inputValue();
          const descriptionValue = await descriptionTextarea.inputValue();
          
          if (nameValue.length > 0 && descriptionValue.length > 0) {
            testResults.strategyCreationForm.details.push('Form fields can be filled successfully');
          } else {
            testResults.strategyCreationForm.details.push('Form fields cannot be filled');
          }
          
          // Test custom rules section
          const addRuleButton = await page.locator('button:has-text("Add Custom Rule")').first();
          const addRuleVisible = await addRuleButton.isVisible().catch(() => false);
          
          if (addRuleVisible) {
            testResults.strategyCreationForm.details.push('Custom rules section found');
            await addRuleButton.click();
            await page.waitForTimeout(500);
            
            const ruleInput = await page.locator('input[placeholder*="trade"]').first();
            const ruleInputVisible = await ruleInput.isVisible().catch(() => false);
            
            if (ruleInputVisible) {
              testResults.strategyCreationForm.details.push('Custom rule input can be added');
              await ruleInput.fill('Test rule: Only trade during market hours');
            }
          } else {
            testResults.strategyCreationForm.details.push('Custom rules section not found');
          }
          
        } else {
          testResults.strategyCreationForm.status = 'failed';
          testResults.strategyCreationForm.details.push('Strategy creation form missing required elements');
        }
      } else {
        testResults.strategyCreationNavigation.status = 'failed';
        testResults.strategyCreationNavigation.details.push('Navigation to strategy creation page failed');
      }
    } else {
      testResults.strategyCreationNavigation.status = 'skipped';
      testResults.strategyCreationNavigation.details.push('Create Strategy button not found');
    }
    
    // Go back to strategies page to test other functionality
    await page.goto('http://localhost:3000/strategies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test Strategy Card Interaction
    console.log('4. Testing Strategy Card Interaction...');
    const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card').count().catch(() => 0);
    
    if (strategyCards > 0) {
      const firstCard = await page.locator('[data-testid="strategy-card"], .strategy-card').first();
      const cardVisible = await firstCard.isVisible().catch(() => false);
      
      if (cardVisible) {
        testResults.strategyCardInteraction.status = 'passed';
        testResults.strategyCardInteraction.details.push('Strategy cards are visible and interactive');
        
        // Try to find edit and delete buttons
        const editButton = await firstCard.locator('button:has-text("Edit"), [data-testid*="edit"], a:has-text("Edit")').first();
        const deleteButton = await firstCard.locator('button:has-text("Delete"), [data-testid*="delete"], button:has-text("Remove")').first();
        
        const editVisible = await editButton.isVisible().catch(() => false);
        const deleteVisible = await deleteButton.isVisible().catch(() => false);
        
        if (editVisible) {
          testResults.strategyCardInteraction.details.push('Edit button found on strategy card');
          
          // Test Strategy Edit Navigation
          console.log('5. Testing Strategy Edit Navigation...');
          await editButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          const editUrl = page.url();
          if (editUrl.includes('/strategies/edit/') || editUrl.includes('/strategy/')) {
            testResults.strategyEditNavigation.status = 'passed';
            testResults.strategyEditNavigation.details.push('Successfully navigated to strategy edit page');
            
            // Check for edit form elements
            const editNameInput = await page.locator('input[name="name"], input[placeholder*="Strategy"]').first();
            const editNameVisible = await editNameInput.isVisible().catch(() => false);
            
            if (editNameVisible) {
              testResults.strategyEditNavigation.details.push('Edit form loaded with name field');
              
              // Check if field is pre-populated
              const editNameValue = await editNameInput.inputValue();
              if (editNameValue.length > 0) {
                testResults.strategyEditNavigation.details.push('Edit form pre-populated with existing data');
              } else {
                testResults.strategyEditNavigation.details.push('Edit form not pre-populated');
              }
            } else {
              testResults.strategyEditNavigation.details.push('Edit form missing name field');
            }
          } else {
            testResults.strategyEditNavigation.status = 'failed';
            testResults.strategyEditNavigation.details.push('Navigation to edit page failed');
          }
          
          // Go back to strategies
          await page.goto('http://localhost:3000/strategies');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
        } else {
          testResults.strategyCardInteraction.details.push('Edit button not found on strategy card');
        }
        
        if (deleteVisible) {
          testResults.strategyCardInteraction.details.push('Delete button found on strategy card');
          
          // Test Strategy Deletion
          console.log('6. Testing Strategy Deletion...');
          
          // Take screenshot before deletion
          const cardsBeforeDelete = await page.locator('[data-testid="strategy-card"], .strategy-card').count().catch(() => 0);
          
          await deleteButton.click();
          await page.waitForTimeout(1000);
          
          // Look for confirmation dialog
          const confirmDialog = await page.locator('text=Are you sure, text=Delete, text=Confirm, [role="dialog"]').first();
          const confirmVisible = await confirmDialog.isVisible().catch(() => false);
          
          if (confirmVisible) {
            testResults.strategyDeletion.details.push('Deletion confirmation dialog appeared');
            
            // Try to find and click confirm button
            const confirmButton = await page.locator('button:has-text("Delete"), button:has-text("Confirm"), button[type="button"]').first();
            const confirmButtonVisible = await confirmButton.isVisible().catch(() => false);
            
            if (confirmButtonVisible) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
              
              const cardsAfterDelete = await page.locator('[data-testid="strategy-card"], .strategy-card').count().catch(() => 0);
              
              if (cardsAfterDelete < cardsBeforeDelete) {
                testResults.strategyDeletion.status = 'passed';
                testResults.strategyDeletion.details.push('Strategy successfully deleted');
              } else {
                testResults.strategyDeletion.status = 'partial';
                testResults.strategyDeletion.details.push('Delete confirmation clicked but strategy not removed');
              }
            } else {
              testResults.strategyDeletion.status = 'partial';
              testResults.strategyDeletion.details.push('Deletion confirmation appeared but no confirm button found');
            }
          } else {
            testResults.strategyDeletion.status = 'partial';
            testResults.strategyDeletion.details.push('Delete button clicked but no confirmation dialog appeared');
          }
        } else {
          testResults.strategyCardInteraction.details.push('Delete button not found on strategy card');
        }
      } else {
        testResults.strategyCardInteraction.status = 'failed';
        testResults.strategyCardInteraction.details.push('Strategy cards not visible');
      }
    } else {
      testResults.strategyCardInteraction.status = 'skipped';
      testResults.strategyCardInteraction.details.push('No strategy cards available to test interaction');
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
  
  const partialTests = Object.values(testResults).filter(result => 
    typeof result === 'object' && result.status === 'partial'
  ).length;
  
  testResults.summary = `Tests completed: ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped, ${partialTests} partial`;
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `final-strategy-crud-test-results-${timestamp}.json`;
  
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`Test results saved to ${resultsFile}`);
  
  return testResults;
}

// Run the test
runFinalStrategyCRUDTest().then(results => {
  console.log('\n=== FINAL STRATEGY CRUD VERIFICATION RESULTS ===');
  console.log('Strategy Page Load:', results.strategyPageLoad.status);
  console.log('Strategy Creation Navigation:', results.strategyCreationNavigation.status);
  console.log('Strategy Creation Form:', results.strategyCreationForm.status);
  console.log('Strategy Card Interaction:', results.strategyCardInteraction.status);
  console.log('Strategy Edit Navigation:', results.strategyEditNavigation.status);
  console.log('Strategy Deletion:', results.strategyDeletion.status);
  
  console.log('\nNon-Supabase Console Errors:', results.consoleErrors.length - results.supabaseErrors.length);
  console.log('Supabase-related Console Errors:', results.supabaseErrors.length);
  
  if (results.consoleErrors.length - results.supabaseErrors.length > 0) {
    console.log('\nNon-Supabase Console Errors Found:');
    const nonSupabaseErrors = results.consoleErrors.filter(e => 
      !results.supabaseErrors.includes(e.text)
    );
    const uniqueErrors = [...new Set(nonSupabaseErrors.map(e => e.text))];
    uniqueErrors.forEach(error => {
      console.log('-', error);
    });
  }
  
  console.log('\nDetails:');
  console.log('Strategy Page Load:', results.strategyPageLoad.details.join('; '));
  console.log('Strategy Creation Navigation:', results.strategyCreationNavigation.details.join('; '));
  console.log('Strategy Creation Form:', results.strategyCreationForm.details.join('; '));
  console.log('Strategy Card Interaction:', results.strategyCardInteraction.details.join('; '));
  console.log('Strategy Edit Navigation:', results.strategyEditNavigation.details.join('; '));
  console.log('Strategy Deletion:', results.strategyDeletion.details.join('; '));
  console.log('Summary:', results.summary);
  
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});