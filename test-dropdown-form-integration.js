/**
 * Test script to verify dropdown integration with TradeForm state
 * This script tests the form state management, dropdown selection, and submission
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function testDropdownFormIntegration() {
  console.log('🔍 Testing Dropdown Integration with TradeForm State');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test results tracking
  const testResults = {
    dropdownFormIntegration: {
      passed: 0,
      failed: 0,
      details: []
    }
  };
  
  try {
    // First check if we need to login
    console.log('📍 Checking authentication status...');
    await page.goto('http://localhost:3001/log-trade');
    
    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 Login required, performing authentication...');
      
      // Fill login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForURL('**/log-trade', { timeout: 10000 });
      console.log('✅ Authentication successful');
    }
    
    // Navigate to the log-trade page if not already there
    if (!page.url().includes('/log-trade')) {
      await page.goto('http://localhost:3001/log-trade');
    }
    
    // Wait for page to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Test 1: Verify initial form state
    console.log('\n🧪 Test 1: Verifying initial form state');
    try {
      // Check if the dropdown button exists and shows placeholder
      const dropdownButton = await page.locator('button[aria-haspopup="listbox"]').first();
      const buttonText = await dropdownButton.textContent();
      
      console.log(`   Initial dropdown text: "${buttonText}"`);
      
      if (buttonText && buttonText.includes('Select a strategy')) {
        console.log('✅ PASS: Initial dropdown shows placeholder');
        testResults.dropdownFormIntegration.passed++;
        testResults.dropdownFormIntegration.details.push('Initial form state correctly shows placeholder');
      } else {
        console.log('❌ FAIL: Initial dropdown should show placeholder');
        testResults.dropdownFormIntegration.failed++;
        testResults.dropdownFormIntegration.details.push('Initial form state incorrect - expected placeholder');
      }
    } catch (error) {
      console.log('❌ FAIL: Could not verify initial form state:', error.message);
      testResults.dropdownFormIntegration.failed++;
      testResults.dropdownFormIntegration.details.push(`Initial state verification error: ${error.message}`);
    }
    
    // Test 2: Check if strategies are loaded
    console.log('\n🧪 Test 2: Checking if strategies are loaded in dropdown');
    try {
      // Click the dropdown to open it
      const dropdownButton = await page.locator('button[aria-haspopup="listbox"]').first();
      await dropdownButton.click();
      
      // Wait for options to appear
      await page.waitForSelector('[role="option"]', { timeout: 5000 });
      
      const optionCount = await page.locator('[role="option"]').count();
      const options = await page.locator('[role="option"]').allInnerTexts();
      
      console.log(`   Found ${optionCount} options in dropdown`);
      console.log('   Options:', options);
      
      if (optionCount > 1) { // At least "None" + one strategy
        console.log('✅ PASS: Strategies are loaded in dropdown');
        testResults.dropdownFormIntegration.passed++;
        testResults.dropdownFormIntegration.details.push(`Loaded ${optionCount} strategies including "None" option`);
      } else {
        console.log('⚠️  WARNING: Only "None" option found or no options loaded');
        testResults.dropdownFormIntegration.details.push('Limited or no strategies loaded');
      }
      
      // Close dropdown by clicking outside
      await page.click('body');
      await page.waitForTimeout(200);
    } catch (error) {
      console.log('❌ FAIL: Could not load strategies:', error.message);
      testResults.dropdownFormIntegration.failed++;
      testResults.dropdownFormIntegration.details.push(`Strategy loading error: ${error.message}`);
    }
    
    // Test 3: Select a strategy and verify form state update
    console.log('\n🧪 Test 3: Selecting strategy and verifying form state');
    try {
      // Open the dropdown
      const dropdownButton = await page.locator('button[aria-haspopup="listbox"]').first();
      await dropdownButton.click();
      
      // Wait for options to appear
      await page.waitForSelector('[role="option"]', { timeout: 5000 });
      
      // Get the first non-"None" option (skip the first option which should be "None")
      const options = await page.locator('[role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        const firstStrategyOption = options.nth(1); // Skip "None" option
        const optionText = await firstStrategyOption.textContent();
        
        console.log(`   Selecting strategy: ${optionText}`);
        
        // Click the option to select it
        await firstStrategyOption.click();
        
        // Wait a moment for state to update
        await page.waitForTimeout(500);
        
        // Verify the dropdown shows the selected option
        const selectedText = await dropdownButton.textContent();
        
        if (selectedText && selectedText.includes(optionText)) {
          console.log('✅ PASS: Dropdown selection updated correctly');
          testResults.dropdownFormIntegration.passed++;
          testResults.dropdownFormIntegration.details.push(`Successfully selected strategy: ${optionText}`);
          
          // Check if strategy rules section appears (indicating selectedStrategy state is updated)
          const strategyRulesVisible = await page.isVisible('text=Strategy Rules');
          if (strategyRulesVisible) {
            console.log('✅ PASS: Strategy rules section appeared after selection');
            testResults.dropdownFormIntegration.passed++;
            testResults.dropdownFormIntegration.details.push('Strategy rules section correctly displayed');
          } else {
            console.log('⚠️  WARNING: Strategy rules section not visible');
            testResults.dropdownFormIntegration.details.push('Strategy rules section not displayed');
          }
        } else {
          console.log(`❌ FAIL: Expected ${optionText}, got ${selectedText}`);
          testResults.dropdownFormIntegration.failed++;
          testResults.dropdownFormIntegration.details.push('Dropdown selection not properly updated');
        }
      } else {
        console.log('⚠️  WARNING: No strategy options available for selection');
        testResults.dropdownFormIntegration.details.push('No strategy options available');
      }
    } catch (error) {
      console.log('❌ FAIL: Strategy selection test failed:', error.message);
      testResults.dropdownFormIntegration.failed++;
      testResults.dropdownFormIntegration.details.push(`Strategy selection error: ${error.message}`);
    }
    
    // Test 4: Select "None" and verify form state reset
    console.log('\n🧪 Test 4: Selecting "None" and verifying form state reset');
    try {
      // Open the dropdown
      const dropdownButton = await page.locator('button[aria-haspopup="listbox"]').first();
      await dropdownButton.click();
      
      // Wait for options to appear
      await page.waitForSelector('[role="option"]', { timeout: 5000 });
      
      // Click the "None" option (first option)
      const noneOption = await page.locator('[role="option"]').first();
      await noneOption.click();
      
      // Wait for state to update
      await page.waitForTimeout(500);
      
      // Verify the dropdown shows placeholder again
      const selectedText = await dropdownButton.textContent();
      
      if (selectedText && selectedText.includes('Select a strategy')) {
        console.log('✅ PASS: "None" selection correctly reset to placeholder');
        testResults.dropdownFormIntegration.passed++;
        testResults.dropdownFormIntegration.details.push('"None" option correctly handled');
        
        // Check if strategy rules section is hidden
        const strategyRulesVisible = await page.isVisible('text=Strategy Rules');
        if (!strategyRulesVisible) {
          console.log('✅ PASS: Strategy rules section hidden after "None" selection');
          testResults.dropdownFormIntegration.passed++;
          testResults.dropdownFormIntegration.details.push('Strategy rules section correctly hidden');
        } else {
          console.log('⚠️  WARNING: Strategy rules section still visible');
          testResults.dropdownFormIntegration.details.push('Strategy rules section not hidden');
        }
      } else {
        console.log(`❌ FAIL: Expected placeholder text, got ${selectedText}`);
        testResults.dropdownFormIntegration.failed++;
        testResults.dropdownFormIntegration.details.push('"None" option not properly handled');
      }
    } catch (error) {
      console.log('❌ FAIL: "None" selection test failed:', error.message);
      testResults.dropdownFormIntegration.failed++;
      testResults.dropdownFormIntegration.details.push(`"None" selection error: ${error.message}`);
    }
    
    // Test 5: Fill form with strategy selected and verify submission data
    console.log('\n🧪 Test 5: Testing form submission with strategy selected');
    try {
      // Open the dropdown and select a strategy
      const dropdownButton = await page.locator('button[aria-haspopup="listbox"]').first();
      await dropdownButton.click();
      
      await page.waitForSelector('[role="option"]', { timeout: 5000 });
      const options = await page.locator('[role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        const firstStrategyOption = options.nth(1); // Skip "None" option
        const optionText = await firstStrategyOption.textContent();
        await firstStrategyOption.click();
        await page.waitForTimeout(500);
        
        // Fill minimal required fields
        await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', 'TEST');
        await page.fill('input[placeholder="0.00"]', '100'); // Entry price
        const exitPriceInput = await page.locator('input[placeholder="0.00"]').nth(1);
        await exitPriceInput.fill('110'); // Exit price
        await page.fill('input[type="number"]', '10'); // Quantity
        const pnlInput = await page.locator('input[type="number"]').nth(1);
        await pnlInput.fill('100'); // P&L
        
        // Intercept network requests to capture form submission
        let submissionData = null;
        page.on('request', request => {
          if (request.url().includes('/trades') && request.method() === 'POST') {
            try {
              submissionData = request.postData();
              console.log('   Form submission data captured');
            } catch (e) {
              console.log('   Could not parse submission data');
            }
          }
        });
        
        // Submit the form
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        if (submissionData) {
          const parsedData = JSON.parse(submissionData);
          if (parsedData.strategy_id && parsedData.strategy_id !== '') {
            console.log('✅ PASS: Strategy ID correctly included in form submission');
            testResults.dropdownFormIntegration.passed++;
            testResults.dropdownFormIntegration.details.push('Form submission includes correct strategy ID');
          } else {
            console.log(`❌ FAIL: Strategy ID missing or empty in submission`);
            testResults.dropdownFormIntegration.failed++;
            testResults.dropdownFormIntegration.details.push('Form submission strategy ID incorrect');
          }
        } else {
          console.log('⚠️  WARNING: Could not capture form submission data');
          testResults.dropdownFormIntegration.details.push('Form submission data not captured');
        }
      } else {
        console.log('⚠️  WARNING: No strategy options available for submission test');
        testResults.dropdownFormIntegration.details.push('No strategy options for submission test');
      }
    } catch (error) {
      console.log('❌ FAIL: Form submission test failed:', error.message);
      testResults.dropdownFormIntegration.failed++;
      testResults.dropdownFormIntegration.details.push(`Form submission error: ${error.message}`);
    }
    
    // Test 6: Test form validation with strategy field
    console.log('\n🧪 Test 6: Testing form validation with strategy field');
    try {
      // Check if strategy field is properly validated (should be optional)
      await page.reload();
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Fill form without selecting strategy (keep "None" selected)
      await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', 'TEST');
      await page.fill('input[placeholder="0.00"]', '100'); // Entry price
      const exitPriceInput = await page.locator('input[placeholder="0.00"]').nth(1);
      await exitPriceInput.fill('110'); // Exit price
      await page.fill('input[type="number"]', '10'); // Quantity
      const pnlInput = await page.locator('input[type="number"]').nth(1);
      await pnlInput.fill('100'); // P&L
      
      // Try to submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      // Check if validation passes (strategy is optional)
      const hasValidationError = await page.isVisible('text=Validation Errors');
      
      if (!hasValidationError) {
        console.log('✅ PASS: Form validation passes with no strategy selected');
        testResults.dropdownFormIntegration.passed++;
        testResults.dropdownFormIntegration.details.push('Form validation correctly handles optional strategy field');
      } else {
        console.log('❌ FAIL: Form validation fails when no strategy is selected');
        testResults.dropdownFormIntegration.failed++;
        testResults.dropdownFormIntegration.details.push('Form validation incorrectly requires strategy selection');
      }
    } catch (error) {
      console.log('❌ FAIL: Form validation test failed:', error.message);
      testResults.dropdownFormIntegration.failed++;
      testResults.dropdownFormIntegration.details.push(`Form validation error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Critical error during testing:', error);
    testResults.dropdownFormIntegration.failed++;
    testResults.dropdownFormIntegration.details.push(`Critical error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate test report
  const totalTests = testResults.dropdownFormIntegration.passed + testResults.dropdownFormIntegration.failed;
  const passRate = totalTests > 0 ? (testResults.dropdownFormIntegration.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${testResults.dropdownFormIntegration.passed}`);
  console.log(`Failed: ${testResults.dropdownFormIntegration.failed}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('\n📝 Detailed Results:');
  testResults.dropdownFormIntegration.details.forEach((detail, index) => {
    console.log(`   ${index + 1}. ${detail}`);
  });
  
  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    testType: 'Dropdown Form Integration Test',
    summary: {
      total: totalTests,
      passed: testResults.dropdownFormIntegration.passed,
      failed: testResults.dropdownFormIntegration.failed,
      passRate: `${passRate}%`
    },
    details: testResults.dropdownFormIntegration.details
  };
  
  fs.writeFileSync(
    'dropdown-form-integration-test-results.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n💾 Results saved to: dropdown-form-integration-test-results.json');
  
  return {
    success: testResults.dropdownFormIntegration.failed === 0,
    results: testResults
  };
}

// Run the test
testDropdownFormIntegration()
  .then(result => {
    console.log('\n🏁 Test completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });