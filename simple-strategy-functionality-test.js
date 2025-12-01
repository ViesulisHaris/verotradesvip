const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS_FILE = 'simple-strategy-test-results.json';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test results tracking
const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  },
  tests: {}
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.tests[testName] = {
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: ${details}`);
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push(`${testName}: ${details}`);
    console.log(`❌ ${testName}: ${details}`);
  }
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  try {
    await page.screenshot({ path: `test-screenshots/simple-strategy-${name}-${Date.now()}.png` });
    console.log(`📸 Screenshot saved: simple-strategy-${name}-${Date.now()}.png`);
  } catch (error) {
    console.log(`Failed to take screenshot: ${error.message}`);
  }
}

// Main test function
async function runSimpleStrategyTests() {
  console.log('🚀 Starting simple strategy functionality tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('='.repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();

  try {
    // Test 1: Strategy Page Access
    console.log('\n📋 Test 1: Strategy Page Access');
    console.log('-'.repeat(40));
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    
    // Navigate to strategies page
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loads
    const pageTitle = await page.textContent('h1');
    const pageLoaded = pageTitle && pageTitle.includes('Trading Strategies');
    logTest('Strategy Page Loads', pageLoaded, `Page title: "${pageTitle}"`);
    
    // Check for strategies
    const strategyCards = await page.locator('.glass').count();
    logTest('Strategy Elements Found', strategyCards > 0, `Found ${strategyCards} strategy elements`);
    
    // Check for create button
    const createButton = await page.locator('a[href="/strategies/create"]').count();
    logTest('Create Button Present', createButton > 0, `Create button found: ${createButton > 0}`);
    
    await takeScreenshot(page, 'page-access');

    // Test 2: Strategy Creation
    console.log('\n📝 Test 2: Strategy Creation');
    console.log('-'.repeat(40));
    
    // Click create strategy button
    await page.click('a[href="/strategies/create"]');
    await page.waitForLoadState('networkidle');
    
    // Check if create page loads
    const createPageTitle = await page.textContent('h1');
    const createPageLoaded = createPageTitle && createPageTitle.includes('Create Trading Strategy');
    logTest('Create Strategy Page Loads', createPageLoaded, `Page title: "${createPageTitle}"`);
    
    // Fill out the form with more specific selectors
    const strategyName = `Test Strategy ${Date.now()}`;
    
    // Try multiple selectors for the name field
    const nameSelectors = [
      'input[placeholder*="Strategy Name"]',
      'input[placeholder*="e.g., London Breakout Strategy"]',
      'input[type="text"]'
    ];
    
    let nameFieldFilled = false;
    for (const selector of nameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.fill(selector, strategyName);
        nameFieldFilled = true;
        logTest('Strategy Name Field Filled', true, `Used selector: ${selector}`);
        break;
      } catch (error) {
        console.log(`Selector ${selector} failed: ${error.message}`);
      }
    }
    
    if (!nameFieldFilled) {
      logTest('Strategy Name Field Filled', false, 'Could not find or fill name field');
    }
    
    // Fill description field
    try {
      await page.fill('textarea', 'Test strategy description');
      logTest('Description Field Filled', true, 'Description filled successfully');
    } catch (error) {
      logTest('Description Field Filled', false, `Error: ${error.message}`);
    }
    
    await takeScreenshot(page, 'create-form-filled');
    
    // Submit the form
    try {
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      logTest('Form Submitted', true, 'Submit button clicked');
    } catch (error) {
      logTest('Form Submitted', false, `Error: ${error.message}`);
    }
    
    // Check if strategy was created
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    const strategyNameFound = await page.locator(`text=${strategyName}`).count() > 0;
    logTest('New Strategy Appears in List', strategyNameFound, `Strategy "${strategyName}" found: ${strategyNameFound}`);
    
    await takeScreenshot(page, 'strategy-created');

    // Test 3: Strategy Performance Viewing
    console.log('\n📊 Test 3: Strategy Performance Viewing');
    console.log('-'.repeat(40));
    
    if (strategyNameFound) {
      // Click on the strategy to view performance
      try {
        await page.click(`text=${strategyName}`);
        await page.waitForLoadState('networkidle');
        
        const performancePageTitle = await page.textContent('h1');
        const performancePageLoaded = performancePageTitle && performancePageTitle.includes(strategyName);
        logTest('Performance Page Loads', performancePageLoaded, `Page title contains strategy name`);
        
        // Check for statistics
        const statsElements = await page.locator('.text-white\\/60, .text-white\\/70').count();
        logTest('Performance Statistics Displayed', statsElements > 0, `Found ${statsElements} stat elements`);
        
        // Check for tabs
        const tabsCount = await page.locator('button').count();
        logTest('Interactive Elements Found', tabsCount > 0, `Found ${tabsCount} interactive elements`);
        
        await takeScreenshot(page, 'performance-view');
        
      } catch (error) {
        logTest('Performance Page Navigation', false, `Error: ${error.message}`);
      }
    } else {
      logTest('Strategy Performance Viewing', false, 'No strategy found to view performance');
    }

    // Test 4: Strategy Modification
    console.log('\n✏️ Test 4: Strategy Modification');
    console.log('-'.repeat(40));
    
    // Go back to strategies list
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    if (strategyNameFound) {
      try {
        // Look for edit button
        const editButton = await page.locator('button[title="Edit Strategy"]').first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Check if we're on edit page
          const currentUrl = page.url();
          const onEditPage = currentUrl.includes('/strategies/edit');
          logTest('Navigate to Edit Page', onEditPage, `Current URL: ${currentUrl}`);
          
          if (onEditPage) {
            await page.waitForLoadState('networkidle');
            
            const editPageTitle = await page.textContent('h1');
            const editPageLoaded = editPageTitle && editPageTitle.includes('Edit Trading Strategy');
            logTest('Edit Strategy Page Loads', editPageLoaded, `Page title: "${editPageTitle}"`);
            
            await takeScreenshot(page, 'edit-page-loaded');
          }
        } else {
          logTest('Find Edit Button', false, 'Edit button not found');
        }
      } catch (error) {
        logTest('Strategy Modification', false, `Error: ${error.message}`);
      }
    } else {
      logTest('Strategy Modification', false, 'No strategy found to edit');
    }

    // Test 5: Strategy Deletion
    console.log('\n🗑️ Test 5: Strategy Deletion');
    console.log('-'.repeat(40));
    
    // Go back to strategies list
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    if (strategyNameFound) {
      try {
        // Look for delete button
        const deleteButton = await page.locator('button[title="Delete Strategy"]').first();
        if (await deleteButton.count() > 0) {
          // Handle confirmation dialog
          page.on('dialog', async dialog => {
            await dialog.accept();
          });
          
          await deleteButton.click();
          await page.waitForTimeout(2000);
          
          // Check if strategy was removed
          const strategyStillExists = await page.locator(`text=${strategyName}`).count() > 0;
          logTest('Strategy Deleted Successfully', !strategyStillExists, `Strategy still exists: ${strategyStillExists}`);
          
          await takeScreenshot(page, 'strategy-deleted');
        } else {
          logTest('Find Delete Button', false, 'Delete button not found');
        }
      } catch (error) {
        logTest('Strategy Deletion', false, `Error: ${error.message}`);
      }
    } else {
      logTest('Strategy Deletion', false, 'No strategy found to delete');
    }

    // Test 6: Error Handling
    console.log('\n⚠️ Test 6: Error Handling');
    console.log('-'.repeat(40));
    
    // Test accessing non-existent strategy
    try {
      await page.goto(`${BASE_URL}/strategies/performance/non-existent-id`);
      await page.waitForLoadState('networkidle');
      
      const errorPageTitle = await page.textContent('h2');
      const errorPageShown = errorPageTitle && errorPageTitle.includes('Strategy Not Found');
      logTest('Non-existent Strategy Error', errorPageShown, `Error page title: "${errorPageTitle}"`);
      
      await takeScreenshot(page, 'error-page');
    } catch (error) {
      logTest('Error Handling Test', false, `Error: ${error.message}`);
    }

  } catch (error) {
    console.error('Test execution error:', error);
    logTest('Test Execution Error', false, error.message);
  } finally {
    // Finalize test results
    testResults.endTime = new Date().toISOString();
    
    // Calculate duration
    const startTime = new Date(testResults.startTime);
    const endTime = new Date(testResults.endTime);
    const duration = Math.round((endTime - startTime) / 1000);
    testResults.duration = `${duration} seconds`;
    
    // Save test results
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log('\n📄 Test results saved to:', TEST_RESULTS_FILE);
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('🏁 Test Summary');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed} ✅`);
    console.log(`Failed: ${testResults.summary.failed} ❌`);
    console.log(`Duration: ${testResults.duration}`);
    
    if (testResults.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.summary.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log('\n🎯 Overall Result:', testResults.summary.failed === 0 ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌');
    
    await browser.close();
  }
}

// Run the tests
runSimpleStrategyTests().catch(console.error);