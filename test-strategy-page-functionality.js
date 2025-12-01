const { chromium } = require('playwright');
const fs = require('fs');

async function testStrategyPageFunctionality() {
  console.log('🚀 Starting Strategy Page Functionality Test...');
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
    }
  };
  
  try {
    // Test 1: Navigate to test strategy fix page
    console.log('\n📋 Test 1: Navigate to Strategy Test Page');
    try {
      await page.goto('http://localhost:3000/test-strategy-fix');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      console.log('✅ Page loaded successfully:', title);
      
      testResults.tests.push({
        name: 'Navigate to Strategy Test Page',
        status: 'PASSED',
        details: `Page loaded with title: ${title}`
      });
      testResults.summary.passed++;
    } catch (error) {
      console.log('❌ Failed to load strategy test page:', error.message);
      testResults.tests.push({
        name: 'Navigate to Strategy Test Page',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Test 2: Check for strategy loading status
    console.log('\n📋 Test 2: Check Strategy Loading Status');
    try {
      const statusElement = await page.locator('text=Loading strategies...').count();
      const successElement = await page.locator('text=Strategies loaded successfully!').count();
      const errorElement = await page.locator('text=Error loading strategies').count();
      
      if (successElement > 0) {
        console.log('✅ Strategies loaded successfully');
        testResults.tests.push({
          name: 'Strategy Loading Status',
          status: 'PASSED',
          details: 'Strategies loaded successfully'
        });
        testResults.summary.passed++;
      } else if (errorElement > 0) {
        const errorText = await page.locator('text=Error loading strategies').textContent();
        console.log('❌ Strategy loading error:', errorText);
        testResults.tests.push({
          name: 'Strategy Loading Status',
          status: 'FAILED',
          details: errorText
        });
        testResults.summary.failed++;
      } else if (statusElement > 0) {
        console.log('⏳ Strategies still loading...');
        testResults.tests.push({
          name: 'Strategy Loading Status',
          status: 'PENDING',
          details: 'Strategies still loading'
        });
      } else {
        console.log('❓ Unknown loading status');
        testResults.tests.push({
          name: 'Strategy Loading Status',
          status: 'UNKNOWN',
          details: 'Could not determine loading status'
        });
      }
    } catch (error) {
      console.log('❌ Failed to check strategy loading status:', error.message);
      testResults.tests.push({
        name: 'Strategy Loading Status',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 3: Navigate to actual strategies page
    console.log('\n📋 Test 3: Navigate to Strategies Page');
    try {
      await page.goto('http://localhost:3000/strategies');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      console.log('✅ Strategies page loaded:', title);
      
      testResults.tests.push({
        name: 'Navigate to Strategies Page',
        status: 'PASSED',
        details: `Strategies page loaded with title: ${title}`
      });
      testResults.summary.passed++;
    } catch (error) {
      console.log('❌ Failed to load strategies page:', error.message);
      testResults.tests.push({
        name: 'Navigate to Strategies Page',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Wait for strategies page to load
    await page.waitForTimeout(5000);
    
    // Test 4: Check for strategy cards or list
    console.log('\n📋 Test 4: Check for Strategy Display');
    try {
      const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, .card').count();
      const strategyList = await page.locator('table, ul.list-group').count();
      const errorMessage = await page.locator('text=An unexpected error occurred').count();
      
      if (errorMessage > 0) {
        const errorText = await page.locator('text=An unexpected error occurred').textContent();
        console.log('❌ Error message found on strategies page:', errorText);
        testResults.tests.push({
          name: 'Strategy Display',
          status: 'FAILED',
          details: errorText
        });
        testResults.summary.failed++;
      } else if (strategyCards > 0 || strategyList > 0) {
        console.log(`✅ Strategy display found: ${strategyCards} cards, ${strategyList} lists`);
        testResults.tests.push({
          name: 'Strategy Display',
          status: 'PASSED',
          details: `Found ${strategyCards} strategy cards and ${strategyList} strategy lists`
        });
        testResults.summary.passed++;
      } else {
        console.log('❓ No strategy display elements found');
        testResults.tests.push({
          name: 'Strategy Display',
          status: 'UNKNOWN',
          details: 'No strategy display elements found'
        });
      }
    } catch (error) {
      console.log('❌ Failed to check strategy display:', error.message);
      testResults.tests.push({
        name: 'Strategy Display',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    // Test 5: Check for CRUD operation buttons
    console.log('\n📋 Test 5: Check for CRUD Operation Buttons');
    try {
      const createButton = await page.locator('button:has-text("Create"), button:has-text("New Strategy"), a:has-text("Create")').count();
      const editButtons = await page.locator('button:has-text("Edit"), a:has-text("Edit")').count();
      const deleteButtons = await page.locator('button:has-text("Delete"), button:has-text("Remove")').count();
      
      console.log(`Found ${createButton} create buttons, ${editButtons} edit buttons, ${deleteButtons} delete buttons`);
      
      if (createButton > 0) {
        testResults.tests.push({
          name: 'Create Strategy Button',
          status: 'PASSED',
          details: `Found ${createButton} create button(s)`
        });
        testResults.summary.passed++;
      } else {
        testResults.tests.push({
          name: 'Create Strategy Button',
          status: 'FAILED',
          details: 'No create button found'
        });
        testResults.summary.failed++;
      }
      testResults.summary.total++;
      
      if (editButtons > 0) {
        testResults.tests.push({
          name: 'Edit Strategy Buttons',
          status: 'PASSED',
          details: `Found ${editButtons} edit button(s)`
        });
        testResults.summary.passed++;
      } else {
        testResults.tests.push({
          name: 'Edit Strategy Buttons',
          status: 'FAILED',
          details: 'No edit buttons found'
        });
        testResults.summary.failed++;
      }
      testResults.summary.total++;
      
      if (deleteButtons > 0) {
        testResults.tests.push({
          name: 'Delete Strategy Buttons',
          status: 'PASSED',
          details: `Found ${deleteButtons} delete button(s)`
        });
        testResults.summary.passed++;
      } else {
        testResults.tests.push({
          name: 'Delete Strategy Buttons',
          status: 'FAILED',
          details: 'No delete buttons found'
        });
        testResults.summary.failed++;
      }
      testResults.summary.total++;
    } catch (error) {
      console.log('❌ Failed to check CRUD buttons:', error.message);
      testResults.tests.push({
        name: 'CRUD Operation Buttons',
        status: 'FAILED',
        details: error.message
      });
      testResults.summary.failed++;
      testResults.summary.total++;
    }
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'strategy-page-test-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved as strategy-page-test-screenshot.png');
    
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
  fs.writeFileSync('strategy-page-test-results.json', resultsJson);
  
  // Print summary
  console.log('\n==========================================');
  console.log('📊 TEST SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  console.log('\n📄 Detailed results saved to: strategy-page-test-results.json');
  console.log('📸 Screenshot saved as: strategy-page-test-screenshot.png');
  
  return testResults;
}

// Run the test
testStrategyPageFunctionality().catch(console.error);