const { chromium } = require('playwright');

async function testEmotionFiltering() {
  console.log('🧪 Starting Emotion Filtering Tests');
  console.log('=====================================');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Slow down operations to improve stability
    timeout: 30000 // Increase timeout
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = [];
  
  // Helper function to add test result
  function addTestResult(testName, passed, details) {
    const result = {
      testName,
      passed,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    testResults.push(result);
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${details}`);
  }
  
  // Authentication function
  async function performLogin() {
    console.log('🔐 Performing authentication...');
    try {
      // Navigate to login page
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check if we're on the login page
      const loginForm = await page.locator('form').first();
      if (!await loginForm.isVisible()) {
        addTestResult('Authentication Setup', false, 'Login form not found');
        return false;
      }
      
      // Fill in login credentials using test credentials from the login page
      await page.fill('input[type="email"]', 'testuser@verotrade.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect
      await page.waitForTimeout(3000);
      
      // Check if login was successful by looking for dashboard or redirect
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/test-emotion-filtering')) {
        addTestResult('Authentication', true, 'Successfully logged in and redirected');
        return true;
      } else {
        // Check for error messages
        const errorMessage = await page.locator('.bg-red-600\\/20').first().textContent();
        addTestResult('Authentication', false, `Login failed: ${errorMessage || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      addTestResult('Authentication', false, `Login error: ${error.message}`);
      return false;
    }
  }
  
  try {
    // Perform authentication first
    const loginSuccess = await performLogin();
    if (!loginSuccess) {
      console.error('❌ Authentication failed. Cannot proceed with emotion filtering tests.');
      throw new Error('Authentication failed');
    }
    
    // Navigate to test page
    console.log('🌐 Navigating to emotion filtering test page...');
    await page.goto('http://localhost:3000/test-emotion-filtering');
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to login again (authentication might have expired)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔄 Redirected to login, attempting authentication again...');
      const retryLoginSuccess = await performLogin();
      if (!retryLoginSuccess) {
        throw new Error('Authentication retry failed');
      }
      // Navigate to test page again
      await page.goto('http://localhost:3000/test-emotion-filtering');
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify we're on the correct page and authenticated
    const pageContent = await page.locator('body').textContent();
    
    if (!pageContent.includes('Emotion Filtering Test') && !pageContent.includes('Emotion Filtering')) {
      addTestResult('Page Navigation', false, 'Not on emotion filtering test page');
      throw new Error('Failed to navigate to emotion filtering test page');
    }
    
    addTestResult('Page Navigation', true, 'Successfully navigated to emotion filtering test page');
    
    // Test 1: Create test trades
    console.log('\n📝 Test 1: Creating test trades...');
    try {
      await page.click('button:has-text("Create Test Trades")');
      await page.waitForTimeout(3000); // Wait for trades to be created
      
      // Check if test trades were created successfully
      const tradesCount = await page.locator('text=/Current Trades \\(\\d+ total/').textContent();
      if (tradesCount && tradesCount.includes('total')) {
        addTestResult('Create Test Trades', true, `Test trades created successfully. ${tradesCount}`);
      } else {
        addTestResult('Create Test Trades', false, 'Failed to create test trades');
      }
    } catch (error) {
      addTestResult('Create Test Trades', false, `Error: ${error.message}`);
    }
    
    // Test 2: Single emotion filter (FOMO)
    console.log('\n🎯 Test 2: Testing single emotion filter (FOMO)...');
    try {
      // Wait for page to be fully stable before clicking
      await page.waitForTimeout(1000);
      
      // Try to click the button with force option to avoid interception issues
      await page.click('button:has-text("Test FOMO Filter")', { force: true });
      await page.waitForTimeout(2000); // Wait for filter to apply
      
      // Check if FOMO filter worked
      const filteredTrades = await page.locator('text=/Current Trades \\(\\d+ total, \\d+ filtered/').textContent();
      const debugLogs = await page.locator('.bg-black\\/30').textContent();
      
      if (debugLogs && debugLogs.includes('FOMO')) {
        addTestResult('Single Emotion Filter (FOMO)', true, `FOMO filter applied. ${filteredTrades}`);
      } else {
        addTestResult('Single Emotion Filter (FOMO)', false, 'FOMO filter did not work properly');
      }
    } catch (error) {
      addTestResult('Single Emotion Filter (FOMO)', false, `Error: ${error.message}`);
    }
    
    // Test 3: Multiple emotion filter
    console.log('\n🎯 Test 3: Testing multiple emotion filter...');
    try {
      await page.click('button:has-text("Test Multiple Emotions")');
      await page.waitForTimeout(2000); // Wait for filter to apply
      
      // Check if multiple emotion filter worked
      const debugLogs = await page.locator('.bg-black\\/30').textContent();
      
      if (debugLogs && debugLogs.includes('FOMO, REVENGE, CONFIDENT')) {
        addTestResult('Multiple Emotion Filter', true, 'Multiple emotion filter applied successfully');
      } else {
        addTestResult('Multiple Emotion Filter', false, 'Multiple emotion filter did not work properly');
      }
    } catch (error) {
      addTestResult('Multiple Emotion Filter', false, `Error: ${error.message}`);
    }
    
    // Test 4: Case insensitive filter
    console.log('\n🎯 Test 4: Testing case insensitive filter...');
    try {
      await page.click('button:has-text("Test Case Insensitive")');
      await page.waitForTimeout(2000); // Wait for filter to apply
      
      // Check if case insensitive filter worked
      const debugLogs = await page.locator('.bg-black\\/30').textContent();
      
      if (debugLogs && debugLogs.includes('fomo, Revenge, CONFIDENT')) {
        addTestResult('Case Insensitive Filter', true, 'Case insensitive filter worked correctly');
      } else {
        addTestResult('Case Insensitive Filter', false, 'Case insensitive filter did not work properly');
      }
    } catch (error) {
      addTestResult('Case Insensitive Filter', false, `Error: ${error.message}`);
    }
    
    // Test 5: Manual emotion selection
    console.log('\n🎯 Test 5: Testing manual emotion selection...');
    try {
      // Click on emotion dropdown
      await page.click('button[aria-label="Search Emotions"]');
      await page.waitForTimeout(500);
      
      // Select FOMO emotion
      await page.click('div:has-text("FOMO")');
      await page.waitForTimeout(500);
      
      // Click outside to close dropdown
      await page.click('body');
      await page.waitForTimeout(1000);
      
      // Check if manual selection worked
      const selectedEmotions = await page.locator('span:has-text("FOMO")').count();
      if (selectedEmotions > 0) {
        addTestResult('Manual Emotion Selection', true, 'Manual emotion selection worked');
      } else {
        addTestResult('Manual Emotion Selection', false, 'Manual emotion selection did not work');
      }
    } catch (error) {
      addTestResult('Manual Emotion Selection', false, `Error: ${error.message}`);
    }
    
    // Test 6: Clear filters
    console.log('\n🧹 Test 6: Testing clear filters...');
    try {
      await page.click('button:has-text("Clear Filters")');
      await page.waitForTimeout(1000);
      
      // Check if filters were cleared
      const emotionFilter = await page.locator('button[aria-label="Search Emotions"]').textContent();
      if (emotionFilter && emotionFilter.includes('Select emotions to test')) {
        addTestResult('Clear Filters', true, 'Filters cleared successfully');
      } else {
        addTestResult('Clear Filters', false, 'Filters were not cleared properly');
      }
    } catch (error) {
      addTestResult('Clear Filters', false, `Error: ${error.message}`);
    }
    
    // Test 7: Navigate to confluence page and test emotion pills
    console.log('\n🎯 Test 7: Testing emotion filter pills in confluence page...');
    try {
      await page.goto('http://localhost:3000/confluence');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Click on FOMO Trades pill
      await page.click('button:has-text("FOMO Trades")');
      await page.waitForTimeout(2000);
      
      // Check if FOMO pill is active
      const fomoPill = await page.locator('button:has-text("FOMO Trades")');
      const isActive = await fomoPill.evaluate(el => el.classList.contains('active'));
      
      if (isActive) {
        addTestResult('Emotion Filter Pills (FOMO)', true, 'FOMO pill activated successfully');
      } else {
        addTestResult('Emotion Filter Pills (FOMO)', false, 'FOMO pill did not activate properly');
      }
    } catch (error) {
      addTestResult('Emotion Filter Pills (FOMO)', false, `Error: ${error.message}`);
    }
    
    // Test 8: Check statistics update
    console.log('\n📊 Test 8: Testing statistics update with emotion filters...');
    try {
      // Wait for statistics to update
      await page.waitForTimeout(2000);
      
      // Check if statistics are displayed
      const statsCards = await page.locator('.glass-enhanced p.text-2xl').count();
      if (statsCards > 0) {
        addTestResult('Statistics Update', true, `Statistics cards displayed: ${statsCards}`);
      } else {
        addTestResult('Statistics Update', false, 'Statistics did not update properly');
      }
    } catch (error) {
      addTestResult('Statistics Update', false, `Error: ${error.message}`);
    }
    
    // Test 9: Check filtered trades display
    console.log('\n📋 Test 9: Testing filtered trades display...');
    try {
      // Check if filtered trades table is displayed
      const tradesTable = await page.locator('table').count();
      const tradeRows = await page.locator('tbody tr').count();
      
      if (tradesTable > 0 && tradeRows >= 0) {
        addTestResult('Filtered Trades Display', true, `Trades table displayed with ${tradeRows} rows`);
      } else {
        addTestResult('Filtered Trades Display', false, 'Filtered trades table did not display properly');
      }
    } catch (error) {
      addTestResult('Filtered Trades Display', false, `Error: ${error.message}`);
    }
    
    // Test 10: Test debug logging
    console.log('\n🔍 Test 10: Testing debug logging...');
    try {
      // Go back to test page to check debug logs
      await page.goto('http://localhost:3000/test-emotion-filtering');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Run a test to generate debug logs
      await page.click('button:has-text("Test FOMO Filter")');
      await page.waitForTimeout(2000);
      
      // Check debug logs
      const debugLogs = await page.locator('.bg-black\\/30').textContent();
      
      if (debugLogs && debugLogs.includes('Starting emotion filter') && debugLogs.includes('FOMO')) {
        addTestResult('Debug Logging', true, 'Debug logging is working and providing useful information');
      } else {
        addTestResult('Debug Logging', false, 'Debug logging is not working properly');
      }
    } catch (error) {
      addTestResult('Debug Logging', false, `Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    addTestResult('Test Execution', false, `Critical error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate test report
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.details}`);
  });
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Save test results to file
  const fs = require('fs');
  const reportData = {
    testRun: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1)
    },
    results: testResults
  };
  
  fs.writeFileSync('emotion-filtering-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Test results saved to emotion-filtering-test-results.json');
  
  return reportData;
}

// Run the tests
testEmotionFiltering().catch(console.error);