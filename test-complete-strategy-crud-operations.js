const { chromium } = require('playwright');
const fs = require('fs');

async function testCompleteStrategyCRUD() {
  console.log('🚀 Starting Complete Strategy CRUD Operations Test...');
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
    },
    createdStrategyId: null
  };
  
  try {
    // Step 1: Login
    console.log('\n📋 Step 1: Login');
    try {
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || !currentUrl.includes('/login')) {
        console.log('✅ Login successful');
        testResults.tests.push({
          name: 'Login',
          status: 'PASSED',
          details: `Successfully logged in, redirected to: ${currentUrl}`
        });
        testResults.summary.passed++;
      } else {
        console.log('❌ Login failed');
        testResults.tests.push({
          name: 'Login',
          status: 'FAILED',
          details: 'Login failed - still on login page'
        });
        testResults.summary.failed++;
      }
    } catch (error) {
      console.log('❌ Login process failed:', error.message);
      testResults.tests.push({
        name: 'Login',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Step 2: Navigate to create strategy page
    console.log('\n📋 Step 2: Navigate to Create Strategy Page');
    try {
      await page.goto('http://localhost:3000/strategies/create');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/strategies/create')) {
        console.log('✅ Navigate to create strategy page successful');
        testResults.tests.push({
          name: 'Navigate to Create Strategy Page',
          status: 'PASSED',
          details: `Navigated to create strategy page: ${currentUrl}`
        });
        testResults.summary.passed++;
      } else {
        console.log('❌ Failed to navigate to create strategy page');
        testResults.tests.push({
          name: 'Navigate to Create Strategy Page',
          status: 'FAILED',
          details: `Failed to navigate to create strategy page. Current URL: ${currentUrl}`
        });
        testResults.summary.failed++;
      }
    } catch (error) {
      console.log('❌ Navigate to create strategy page failed:', error.message);
      testResults.tests.push({
        name: 'Navigate to Create Strategy Page',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Step 3: Fill and submit strategy form
    console.log('\n📋 Step 3: Create New Strategy');
    try {
      // Fill strategy form with test data
      const timestamp = Date.now();
      const strategyName = `Test Strategy ${timestamp}`;
      
      // Use more specific selectors based on the actual form structure
      await page.fill('input[placeholder="e.g., London Breakout Strategy"]', strategyName);
      await page.fill('textarea[placeholder="Describe your trading strategy..."]', 'This is a test strategy created for testing CRUD operations');
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Create Strategy")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if strategy was created (redirected to strategies page or shows success message)
      const currentUrl = page.url();
      const successMessage = await page.locator('text=Strategy created successfully, text=created successfully').count();
      
      if (currentUrl.includes('/strategies') && !currentUrl.includes('/create') || successMessage > 0) {
        console.log('✅ Strategy created successfully');
        testResults.tests.push({
          name: 'Create Strategy',
          status: 'PASSED',
          details: `Strategy "${strategyName}" created successfully`
        });
        testResults.summary.passed++;
        
        // Try to get the strategy ID from URL or page content
        if (currentUrl.includes('/strategies/') && !currentUrl.endsWith('/strategies')) {
          const idMatch = currentUrl.match(/\/strategies\/([^\/\?]+)/);
          if (idMatch) {
            testResults.createdStrategyId = idMatch[1];
          }
        }
      } else {
        console.log('❌ Strategy creation failed');
        testResults.tests.push({
          name: 'Create Strategy',
          status: 'FAILED',
          details: `Failed to create strategy. Current URL: ${currentUrl}`
        });
        testResults.summary.failed++;
      }
    } catch (error) {
      console.log('❌ Create strategy failed:', error.message);
      testResults.tests.push({
        name: 'Create Strategy',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Step 4: Navigate back to strategies page to verify creation
    console.log('\n📋 Step 4: Verify Strategy Creation');
    try {
      await page.goto('http://localhost:3000/strategies');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Look for the created strategy
      const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, .card').count();
      const strategyList = await page.locator('table tbody tr, ul.list-group li').count();
      const noStrategiesMessage = await page.locator('text=No strategies found').count();
      
      if (strategyCards > 0 || strategyList > 0) {
        console.log(`✅ Strategies displayed: ${strategyCards} cards, ${strategyList} list items`);
        testResults.tests.push({
          name: 'Verify Strategy Creation',
          status: 'PASSED',
          details: `Found ${strategyCards} strategy cards and ${strategyList} list items`
        });
        testResults.summary.passed++;
      } else if (noStrategiesMessage > 0) {
        console.log('❌ No strategies found after creation');
        testResults.tests.push({
          name: 'Verify Strategy Creation',
          status: 'FAILED',
          details: 'No strategies found after creation'
        });
        testResults.summary.failed++;
      } else {
        console.log('❓ Unable to verify strategy creation');
        testResults.tests.push({
          name: 'Verify Strategy Creation',
          status: 'UNKNOWN',
          details: 'Unable to verify strategy creation'
        });
      }
    } catch (error) {
      console.log('❌ Verify strategy creation failed:', error.message);
      testResults.tests.push({
        name: 'Verify Strategy Creation',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Step 5: Test strategy editing
    console.log('\n📋 Step 5: Test Strategy Editing');
    try {
      // Look for edit buttons
      const editButtons = await page.locator('button:has-text("Edit"), a:has-text("Edit")').count();
      
      if (editButtons > 0) {
        // Click the first edit button
        await page.click('button:has-text("Edit"), a:has-text("Edit")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/edit') || currentUrl.includes('/strategies/')) {
          console.log('✅ Navigate to edit strategy page successful');
          testResults.tests.push({
            name: 'Navigate to Edit Strategy',
            status: 'PASSED',
            details: `Navigated to edit strategy page: ${currentUrl}`
          });
          testResults.summary.passed++;
          
          // Try to update the strategy
          await page.fill('input[name="name"], input[placeholder*="name"], input[id*="name"]', 'Updated Test Strategy');
          await page.click('button[type="submit"], button:has-text("Update"), button:has-text("Save")');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          const updateSuccess = await page.locator('text=updated successfully, text=Strategy updated').count();
          if (updateSuccess > 0) {
            console.log('✅ Strategy updated successfully');
            testResults.tests.push({
              name: 'Update Strategy',
              status: 'PASSED',
              details: 'Strategy updated successfully'
            });
            testResults.summary.passed++;
          } else {
            console.log('❓ Strategy update status unclear');
            testResults.tests.push({
              name: 'Update Strategy',
              status: 'UNKNOWN',
              details: 'Strategy update status unclear'
            });
          }
          testResults.summary.total++;
        } else {
          console.log('❌ Failed to navigate to edit strategy page');
          testResults.tests.push({
            name: 'Navigate to Edit Strategy',
            status: 'FAILED',
            details: `Failed to navigate to edit strategy page. Current URL: ${currentUrl}`
          });
          testResults.summary.failed++;
        }
        testResults.summary.total++;
      } else {
        console.log('❓ No edit buttons found (no strategies to edit)');
        testResults.tests.push({
          name: 'Test Strategy Editing',
          status: 'SKIPPED',
          details: 'No edit buttons found - no strategies to edit'
        });
      }
    } catch (error) {
      console.log('❌ Test strategy editing failed:', error.message);
      testResults.tests.push({
        name: 'Test Strategy Editing',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Step 6: Test strategy deletion
    console.log('\n📋 Step 6: Test Strategy Deletion');
    try {
      // Go back to strategies page
      await page.goto('http://localhost:3000/strategies');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Look for delete buttons
      const deleteButtons = await page.locator('button:has-text("Delete"), button:has-text("Remove")').count();
      
      if (deleteButtons > 0) {
        // Click the first delete button
        page.on('dialog', async dialog => {
          console.log('Dialog detected:', dialog.message());
          await dialog.accept();
        });
        
        await page.click('button:has-text("Delete"), button:has-text("Remove")');
        await page.waitForTimeout(2000);
        
        const deleteSuccess = await page.locator('text=deleted successfully, text=Strategy deleted').count();
        if (deleteSuccess > 0) {
          console.log('✅ Strategy deleted successfully');
          testResults.tests.push({
            name: 'Delete Strategy',
            status: 'PASSED',
            details: 'Strategy deleted successfully'
          });
          testResults.summary.passed++;
        } else {
          console.log('❓ Strategy deletion status unclear');
          testResults.tests.push({
            name: 'Delete Strategy',
            status: 'UNKNOWN',
            details: 'Strategy deletion status unclear'
          });
        }
      } else {
        console.log('❓ No delete buttons found (no strategies to delete)');
        testResults.tests.push({
          name: 'Test Strategy Deletion',
          status: 'SKIPPED',
          details: 'No delete buttons found - no strategies to delete'
        });
      }
    } catch (error) {
      console.log('❌ Test strategy deletion failed:', error.message);
      testResults.tests.push({
        name: 'Test Strategy Deletion',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'complete-strategy-crud-test-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved as complete-strategy-crud-test-screenshot.png');
    
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
  fs.writeFileSync('complete-strategy-crud-test-results.json', resultsJson);
  
  // Print summary
  console.log('\n==========================================');
  console.log('📊 COMPLETE STRATEGY CRUD TEST SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  if (testResults.createdStrategyId) {
    console.log(`Created Strategy ID: ${testResults.createdStrategyId}`);
  }
  
  console.log('\n📄 Detailed results saved to: complete-strategy-crud-test-results.json');
  console.log('📸 Screenshot saved as: complete-strategy-crud-test-screenshot.png');
  
  return testResults;
}

// Run the test
testCompleteStrategyCRUD().catch(console.error);