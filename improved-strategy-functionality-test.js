const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS_FILE = 'improved-strategy-test-results.json';

// Test user credentials (using test user)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test strategy data
const TEST_STRATEGY = {
  name: `Test Strategy ${Date.now()}`,
  description: 'This is a test strategy created by automated testing',
  rules: ['Rule 1: Test rule', 'Rule 2: Another test rule'],
  isActive: true
};

// Updated strategy data for edit test
const UPDATED_STRATEGY = {
  name: `Updated Test Strategy ${Date.now()}`,
  description: 'This strategy has been updated by automated testing',
  rules: ['Updated Rule 1: Modified test rule', 'Updated Rule 2: Another modified rule', 'New Rule 3: Added during update'],
  isActive: false
};

async function runImprovedStrategyTest() {
  console.log('🚀 Starting improved strategy functionality test...');
  console.log('📅 Test started at:', new Date().toISOString());
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Capture console logs and errors
    bypassCSP: true
  });
  
  const page = await context.newPage();
  
  // Collect console logs and errors
  const consoleLogs = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    
    consoleLogs.push(logEntry);
    
    if (msg.type() === 'error') {
      consoleErrors.push(logEntry);
      console.error('❌ Console Error:', logEntry);
    } else if (msg.type() === 'warning') {
      console.warn('⚠️ Console Warning:', logEntry);
    } else {
      console.log(`📝 Console ${msg.type()}:`, logEntry.text);
    }
  });
  
  // Collect page errors
  page.on('pageerror', error => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    consoleErrors.push(errorEntry);
    console.error('❌ Page Error:', errorEntry);
  });
  
  const testResults = {
    timestamp: new Date().toISOString(),
    testUser: TEST_USER.email,
    results: {
      login: { status: 'pending', details: null, errors: [] },
      strategyListLoading: { status: 'pending', details: null, errors: [] },
      strategyCreation: { status: 'pending', details: null, errors: [] },
      strategyPerformanceViewing: { status: 'pending', details: null, errors: [] },
      strategyModification: { status: 'pending', details: null, errors: [] },
      strategyDeletion: { status: 'pending', details: null, errors: [] },
      consoleErrors: { status: 'pending', details: null, errors: [] }
    },
    consoleLogs: consoleLogs,
    consoleErrors: consoleErrors,
    summary: {
      totalTests: 7,
      passed: 0,
      failed: 0,
      overallStatus: 'pending'
    }
  };
  
  try {
    // Test 1: Login
    console.log('\n🔐 Test 1: User Login');
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      testResults.results.login.status = 'passed';
      testResults.results.login.details = 'Successfully logged in and redirected to dashboard';
      testResults.summary.passed++;
      console.log('✅ Login test passed');
    } catch (error) {
      testResults.results.login.status = 'failed';
      testResults.results.login.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Login test failed:', error.message);
    }
    
    // Test 2: Navigate to strategies page and check loading
    console.log('\n📋 Test 2: Strategy List Loading');
    try {
      await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
      
      // Wait for strategies to load - use more specific selectors
      await page.waitForSelector('h1:has-text("Trading Strategies"), .text-white', { timeout: 10000 });
      
      // Check if page loads without Next.js params error
      const pageTitle = await page.textContent('h1');
      const hasStrategies = await page.locator('a[href*="/strategies/performance/"], .glass').count() > 0;
      
      testResults.results.strategyListLoading.status = 'passed';
      testResults.results.strategyListLoading.details = {
        pageTitle: pageTitle,
        hasStrategies: hasStrategies,
        strategyCount: await page.locator('.glass').count()
      };
      testResults.summary.passed++;
      console.log('✅ Strategy list loading test passed');
    } catch (error) {
      testResults.results.strategyListLoading.status = 'failed';
      testResults.results.strategyListLoading.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Strategy list loading test failed:', error.message);
    }
    
    // Test 3: Strategy Creation
    console.log('\n➕ Test 3: Strategy Creation');
    let createdStrategyId = null;
    try {
      await page.click('a[href="/strategies/create"]');
      await page.waitForURL('**/strategies/create', { timeout: 10000 });
      
      // Wait for form to load and use more specific selectors
      await page.waitForSelector('input[placeholder*="Strategy Name"], textarea[placeholder*="Describe"]', { timeout: 10000 });
      
      // Fill in strategy details
      await page.fill('input[placeholder*="Strategy Name"]', TEST_STRATEGY.name);
      await page.fill('textarea[placeholder*="Describe"]', TEST_STRATEGY.description);
      
      // Add custom rules
      const ruleInputs = await page.locator('input[placeholder*="trade"]').all();
      if (ruleInputs.length > 0) {
        await ruleInputs[0].fill(TEST_STRATEGY.rules[0]);
        if (ruleInputs.length > 1) {
          await ruleInputs[1].fill(TEST_STRATEGY.rules[1]);
        } else {
          // Add another rule if needed
          await page.click('button:has-text("Add Custom Rule")');
          await page.waitForSelector('input[placeholder*="trade"]:last-child', { timeout: 5000 });
          await page.fill('input[placeholder*="trade"]:last-child', TEST_STRATEGY.rules[1]);
        }
      }
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Create Strategy")');
      
      // Wait for redirect back to strategies page
      await page.waitForURL('**/strategies', { timeout: 10000 });
      
      // Verify strategy was created
      await page.waitForTimeout(2000); // Wait for list to update
      const createdStrategy = await page.locator(`text=${TEST_STRATEGY.name}`).first();
      if (await createdStrategy.isVisible()) {
        testResults.results.strategyCreation.status = 'passed';
        testResults.results.strategyCreation.details = {
          strategyName: TEST_STRATEGY.name,
          successfullyCreated: true
        };
        testResults.summary.passed++;
        console.log('✅ Strategy creation test passed');
      } else {
        throw new Error('Created strategy not found in list');
      }
    } catch (error) {
      testResults.results.strategyCreation.status = 'failed';
      testResults.results.strategyCreation.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Strategy creation test failed:', error.message);
    }
    
    // Test 4: Strategy Performance Viewing
    console.log('\n📊 Test 4: Strategy Performance Viewing');
    try {
      // Find and click on a strategy card for performance viewing
      const strategyLinks = await page.locator('a[href*="/strategies/performance/"]').all();
      if (strategyLinks.length > 0) {
        await strategyLinks[0].click();
        
        // Wait for performance page to load
        await page.waitForURL('**/strategies/performance/**', { timeout: 10000 });
        
        // Check if performance page loads without Next.js params error
        await page.waitForSelector('h1, .text-white', { timeout: 10000 });
        
        // Check for performance data
        const hasStats = await page.locator('text=Winrate:, text=Net PnL:, text=Trades:').count() > 0;
        
        testResults.results.strategyPerformanceViewing.status = 'passed';
        testResults.results.strategyPerformanceViewing.details = {
          performancePageLoaded: true,
          hasPerformanceData: hasStats,
          currentUrl: page.url()
        };
        testResults.summary.passed++;
        console.log('✅ Strategy performance viewing test passed');
      } else {
        throw new Error('No strategy performance links found');
      }
    } catch (error) {
      testResults.results.strategyPerformanceViewing.status = 'failed';
      testResults.results.strategyPerformanceViewing.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Strategy performance viewing test failed:', error.message);
    }
    
    // Test 5: Strategy Modification
    console.log('\n✏️ Test 5: Strategy Modification');
    try {
      // Navigate back to strategies list
      await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Trading Strategies")', { timeout: 10000 });
      
      // Find edit button and click it
      const editButtons = await page.locator('button[title="Edit Strategy"]').all();
      if (editButtons.length > 0) {
        await editButtons[0].click();
        
        // Wait for edit page to load
        await page.waitForURL('**/strategies/edit/**', { timeout: 10000 });
        
        // Wait for form to load
        await page.waitForSelector('input[placeholder*="Strategy Name"], textarea[placeholder*="Describe"]', { timeout: 10000 });
        
        // Update strategy details
        await page.fill('input[placeholder*="Strategy Name"]', UPDATED_STRATEGY.name);
        await page.fill('textarea[placeholder*="Describe"]', UPDATED_STRATEGY.description);
        
        // Update custom rules
        const ruleInputs = await page.locator('input[placeholder*="trade"]').all();
        for (let i = 0; i < Math.min(ruleInputs.length, UPDATED_STRATEGY.rules.length); i++) {
          await ruleInputs[i].fill(UPDATED_STRATEGY.rules[i]);
        }
        
        // Add new rule if needed
        if (ruleInputs.length < UPDATED_STRATEGY.rules.length) {
          await page.click('button:has-text("Add Custom Rule")');
          await page.waitForTimeout(1000);
          await page.fill('input[placeholder*="trade"]:last-child', UPDATED_STRATEGY.rules[UPDATED_STRATEGY.rules.length - 1]);
        }
        
        // Submit form
        await page.click('button[type="submit"]:has-text("Update Strategy")');
        
        // Wait for redirect back to strategies page
        await page.waitForURL('**/strategies', { timeout: 10000 });
        
        // Verify strategy was updated
        await page.waitForTimeout(2000); // Wait for list to update
        const updatedStrategy = await page.locator(`text=${UPDATED_STRATEGY.name}`).first();
        if (await updatedStrategy.isVisible()) {
          testResults.results.strategyModification.status = 'passed';
          testResults.results.strategyModification.details = {
            originalName: TEST_STRATEGY.name,
            updatedName: UPDATED_STRATEGY.name,
            successfullyUpdated: true
          };
          testResults.summary.passed++;
          console.log('✅ Strategy modification test passed');
        } else {
          throw new Error('Updated strategy not found in list');
        }
      } else {
        throw new Error('No edit buttons found');
      }
    } catch (error) {
      testResults.results.strategyModification.status = 'failed';
      testResults.results.strategyModification.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Strategy modification test failed:', error.message);
    }
    
    // Test 6: Strategy Deletion
    console.log('\n🗑️ Test 6: Strategy Deletion');
    try {
      // Find delete button and click it
      const deleteButtons = await page.locator('button[title="Delete Strategy"]').all();
      if (deleteButtons.length > 0) {
        // Handle confirmation dialog
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await deleteButtons[0].click();
        
        // Wait for page to refresh after deletion
        await page.waitForTimeout(2000);
        
        // Verify strategy was deleted
        const deletedStrategy = await page.locator(`text=${UPDATED_STRATEGY.name}`).first();
        if (!(await deletedStrategy.isVisible())) {
          testResults.results.strategyDeletion.status = 'passed';
          testResults.results.strategyDeletion.details = {
            deletedStrategyName: UPDATED_STRATEGY.name,
            successfullyDeleted: true
          };
          testResults.summary.passed++;
          console.log('✅ Strategy deletion test passed');
        } else {
          throw new Error('Strategy still appears in list after deletion');
        }
      } else {
        throw new Error('No delete buttons found');
      }
    } catch (error) {
      testResults.results.strategyDeletion.status = 'failed';
      testResults.results.strategyDeletion.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Strategy deletion test failed:', error.message);
    }
    
    // Test 7: Console Error Check
    console.log('\n🔍 Test 7: Console Error Analysis');
    try {
      // Check for Next.js params errors
      const paramsErrors = consoleErrors.filter(error => 
        error.message && error.message.includes('params') && 
        (error.message.includes('Promise') || error.message.includes('is a Promise'))
      );
      
      // Check for other critical errors
      const criticalErrors = consoleErrors.filter(error => 
        error.message && (
          error.message.includes('TypeError') ||
          error.message.includes('ReferenceError') ||
          error.message.includes('Cannot read propert')
        )
      );
      
      if (paramsErrors.length === 0 && criticalErrors.length === 0) {
        testResults.results.consoleErrors.status = 'passed';
        testResults.results.consoleErrors.details = {
          totalConsoleErrors: consoleErrors.length,
          paramsErrors: paramsErrors.length,
          criticalErrors: criticalErrors.length,
          noNextJsParamsError: true
        };
        testResults.summary.passed++;
        console.log('✅ Console error check test passed - No Next.js params errors found');
      } else {
        testResults.results.consoleErrors.status = 'failed';
        testResults.results.consoleErrors.errors = [
          ...paramsErrors.map(e => e.message),
          ...criticalErrors.map(e => e.message)
        ];
        testResults.results.consoleErrors.details = {
          totalConsoleErrors: consoleErrors.length,
          paramsErrors: paramsErrors.length,
          criticalErrors: criticalErrors.length,
          hasNextJsParamsError: paramsErrors.length > 0
        };
        testResults.summary.failed++;
        console.log('❌ Console error check test failed - Found errors');
      }
    } catch (error) {
      testResults.results.consoleErrors.status = 'failed';
      testResults.results.consoleErrors.errors.push(error.message);
      testResults.summary.failed++;
      console.error('❌ Console error check test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Calculate overall status
    testResults.summary.overallStatus = testResults.summary.failed === 0 ? 'PASSED' : 'FAILED';
    
    // Save test results
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Overall Status: ${testResults.summary.overallStatus}`);
    console.log(`\nDetailed results saved to: ${TEST_RESULTS_FILE}`);
    
    // Print individual test results
    console.log('\n📋 Individual Test Results:');
    Object.entries(testResults.results).forEach(([testName, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result.status.toUpperCase()}`);
      if (result.status === 'failed' && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    });
    
    await browser.close();
  }
}

// Run the improved test
runImprovedStrategyTest().catch(console.error);