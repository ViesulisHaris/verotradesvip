const { chromium } = require('playwright');
const fs = require('fs');

// Test data for different trade scenarios
const testTrades = [
  {
    name: 'FOMO Trade - AAPL Stock',
    market: 'stock',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: '100',
    entryPrice: '150.00',
    exitPrice: '148.50',
    pnl: '-150.00',
    emotions: ['FOMO'],
    notes: 'FOMO trade - bought at the top after seeing big green candle'
  },
  {
    name: 'REVENGE Trade - BTCUSD Crypto',
    market: 'crypto',
    symbol: 'BTCUSD',
    side: 'Sell',
    quantity: '0.5',
    entryPrice: '45000.00',
    exitPrice: '44500.00',
    pnl: '250.00',
    emotions: ['REVENGE'],
    notes: 'Revenge trade after previous loss - wanted to win it back quickly'
  },
  {
    name: 'CONFIDENT Trade - EURUSD Forex',
    market: 'forex',
    symbol: 'EURUSD',
    side: 'Buy',
    quantity: '10000',
    entryPrice: '1.0850',
    exitPrice: '1.0875',
    pnl: '250.00',
    emotions: ['CONFIDENT'],
    notes: 'Confident trade based on solid technical analysis'
  },
  {
    name: 'Multiple Emotions Trade - TSLA Stock',
    market: 'stock',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: '50',
    entryPrice: '250.00',
    exitPrice: '248.00',
    pnl: '-100.00',
    emotions: ['FOMO', 'ANXIOUS'],
    notes: 'FOMO and anxious trade - bought during volatile market conditions'
  },
  {
    name: 'No Emotions Control Trade - SPY Stock',
    market: 'stock',
    symbol: 'SPY',
    side: 'Buy',
    quantity: '75',
    entryPrice: '450.00',
    exitPrice: '452.00',
    pnl: '150.00',
    emotions: [],
    notes: 'Disciplined trade with no emotional influence - followed plan exactly'
  }
];

async function runEndToEndTest() {
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE CONSOLE:', msg.text());
  });
  
  // Enable response logging for debugging
  page.on('response', response => {
    if (response.url().includes('/trades') || response.url().includes('/auth')) {
      console.log('API RESPONSE:', response.url(), response.status());
    }
  });
  
  const testResults = {
    startTime: new Date().toISOString(),
    tradesLogged: [],
    filteringTests: [],
    errors: []
  };
  
  try {
    console.log('🚀 Starting End-to-End Emotion Filtering Test');
    console.log('📅 Test started at:', testResults.startTime);
    
    // Step 1: Navigate to the application and login
    console.log('\n🔐 Step 1: Navigating to application and logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login or if we're already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('📝 Logging in...');
      // Fill in login credentials (assuming test user exists)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Step 2: Navigate to trade logging page
    console.log('\n📝 Step 2: Navigating to trade logging page...');
    await page.goto('http://localhost:3000/log-trade');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Log test trades with different emotions
    console.log('\n💼 Step 3: Logging test trades with different emotions...');
    
    for (let i = 0; i < testTrades.length; i++) {
      const trade = testTrades[i];
      console.log(`\n📊 Logging trade ${i + 1}/${testTrades.length}: ${trade.name}`);
      
      try {
        // Fill in trade form
        await page.click(`button[type="button"]:has-text("${trade.market}")`);
        await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', trade.symbol);
        
        if (trade.side === 'Buy') {
          await page.click('button:has-text("Buy")');
        } else {
          await page.click('button:has-text("Sell")');
        }
        
        await page.fill('input[placeholder="0.00"]:nth-of-type(1)', trade.quantity);
        await page.fill('input[placeholder="0.00"]:nth-of-type(2)', trade.entryPrice);
        await page.fill('input[placeholder="0.00"]:nth-of-type(3)', trade.exitPrice);
        await page.fill('input[name="pnl"], input[placeholder="0.00"]:nth-of-type(4)', trade.pnl);
        
        // Select emotions
        for (const emotion of trade.emotions) {
          await page.click(`button:has-text("${emotion}")`);
        }
        
        // Add notes
        if (trade.notes) {
          await page.fill('textarea[placeholder*="notes"]', trade.notes);
        }
        
        // Submit the form
        await page.click('button[type="submit"]:has-text("Save Trade")');
        await page.waitForLoadState('networkidle');
        
        // Check if trade was saved successfully
        const successMessage = await page.locator('text=Trade saved').count();
        if (successMessage > 0 || page.url().includes('/dashboard')) {
          console.log(`✅ Successfully logged: ${trade.name}`);
          testResults.tradesLogged.push({
            ...trade,
            status: 'success',
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`❌ Failed to log: ${trade.name}`);
          testResults.errors.push(`Failed to log trade: ${trade.name}`);
        }
        
        // Navigate back to log-trade page for next trade
        if (i < testTrades.length - 1) {
          await page.goto('http://localhost:3000/log-trade');
          await page.waitForLoadState('networkidle');
        }
        
      } catch (error) {
        console.error(`❌ Error logging trade ${trade.name}:`, error.message);
        testResults.errors.push(`Error logging trade ${trade.name}: ${error.message}`);
      }
    }
    
    // Step 4: Navigate to confluence page and verify unfiltered view
    console.log('\n📊 Step 4: Navigating to confluence page and verifying unfiltered view...');
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check if all trades appear in unfiltered view
    const tradesInTable = await page.locator('table tbody tr').count();
    console.log(`📋 Found ${tradesInTable} trades in the table`);
    
    if (tradesInTable >= testTrades.length) {
      console.log('✅ All trades appear in unfiltered view');
      testResults.filteringTests.push({
        test: 'Unfiltered View',
        status: 'success',
        expected: testTrades.length,
        actual: tradesInTable
      });
    } else {
      console.log(`❌ Expected at least ${testTrades.length} trades, found ${tradesInTable}`);
      testResults.filteringTests.push({
        test: 'Unfiltered View',
        status: 'failed',
        expected: testTrades.length,
        actual: tradesInTable
      });
    }
    
    // Step 5: Test emotion filter pills
    console.log('\n🎯 Step 5: Testing emotion filter pills...');
    
    const emotionTests = [
      { emotion: 'FOMO', expectedCount: 2 }, // FOMO trade + multiple emotions trade
      { emotion: 'REVENGE', expectedCount: 1 },
      { emotion: 'CONFIDENT', expectedCount: 1 },
      { emotion: 'ANXIOUS', expectedCount: 1 }
    ];
    
    for (const emotionTest of emotionTests) {
      console.log(`\n🔍 Testing ${emotionTest.emotion} filter pill...`);
      
      try {
        // Click the emotion filter pill
        await page.click(`button:has-text("${emotionTest.emotion} Trades")`);
        await page.waitForTimeout(2000); // Wait for filtering to apply
        
        // Count filtered trades
        const filteredTrades = await page.locator('table tbody tr').count();
        console.log(`📊 Found ${filteredTrades} trades for ${emotionTest.emotion} filter`);
        
        if (filteredTrades >= emotionTest.expectedCount) {
          console.log(`✅ ${emotionTest.emotion} filter works correctly`);
          testResults.filteringTests.push({
            test: `${emotionTest.emotion} Filter Pill`,
            status: 'success',
            expected: emotionTest.expectedCount,
            actual: filteredTrades
          });
        } else {
          console.log(`❌ ${emotionTest.emotion} filter failed - expected at least ${emotionTest.expectedCount}, got ${filteredTrades}`);
          testResults.filteringTests.push({
            test: `${emotionTest.emotion} Filter Pill`,
            status: 'failed',
            expected: emotionTest.expectedCount,
            actual: filteredTrades
          });
        }
        
        // Reset filters
        await page.click('button:has-text("Reset All")');
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`❌ Error testing ${emotionTest.emotion} filter:`, error.message);
        testResults.errors.push(`Error testing ${emotionTest.emotion} filter: ${error.message}`);
      }
    }
    
    // Step 6: Test multi-select emotion dropdown
    console.log('\n🎯 Step 6: Testing multi-select emotion dropdown...');
    
    try {
      // Open the emotion dropdown
      await page.click('button[aria-label*="emotion"], button:has-text("Select emotions to filter")');
      await page.waitForTimeout(1000);
      
      // Select multiple emotions
      await page.click('div:has-text("FOMO")');
      await page.waitForTimeout(500);
      await page.click('div:has-text("REVENGE")');
      await page.waitForTimeout(500);
      
      // Count filtered trades
      const multiSelectTrades = await page.locator('table tbody tr').count();
      console.log(`📊 Found ${multiSelectTrades} trades for FOMO + REVENGE filter`);
      
      if (multiSelectTrades >= 3) { // 1 FOMO + 1 REVENGE + 1 multiple emotions
        console.log('✅ Multi-select emotion filter works correctly');
        testResults.filteringTests.push({
          test: 'Multi-Select Emotion Dropdown',
          status: 'success',
          expected: 3,
          actual: multiSelectTrades
        });
      } else {
        console.log(`❌ Multi-select filter failed - expected at least 3, got ${multiSelectTrades}`);
        testResults.filteringTests.push({
          test: 'Multi-Select Emotion Dropdown',
          status: 'failed',
          expected: 3,
          actual: multiSelectTrades
        });
      }
      
      // Reset filters
      await page.click('button:has-text("Reset All")');
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.error('❌ Error testing multi-select emotion dropdown:', error.message);
      testResults.errors.push(`Error testing multi-select emotion dropdown: ${error.message}`);
    }
    
    // Step 7: Test expandable rows to verify emotions display
    console.log('\n🔍 Step 7: Testing expandable rows to verify emotions display...');
    
    try {
      // Click the first expandable row
      await page.click('table tbody tr button:has(svg)');
      await page.waitForTimeout(1000);
      
      // Check if emotions are displayed in the expanded row
      const emotionsDisplayed = await page.locator('text=Emotional State:').count();
      
      if (emotionsDisplayed > 0) {
        console.log('✅ Emotions are displayed correctly in expandable rows');
        testResults.filteringTests.push({
          test: 'Expandable Rows Emotion Display',
          status: 'success',
          expected: 1,
          actual: emotionsDisplayed
        });
      } else {
        console.log('❌ Emotions are not displayed in expandable rows');
        testResults.filteringTests.push({
          test: 'Expandable Rows Emotion Display',
          status: 'failed',
          expected: 1,
          actual: emotionsDisplayed
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing expandable rows:', error.message);
      testResults.errors.push(`Error testing expandable rows: ${error.message}`);
    }
    
    // Step 8: Test statistics update when filtering
    console.log('\n📊 Step 8: Testing statistics update when filtering...');
    
    try {
      // Get initial total trades count
      const initialTotalTrades = await page.locator('text=Filtered Trades').locator('..').locator('p:text-matches(/\\d+/)').textContent();
      console.log(`📊 Initial total trades: ${initialTotalTrades}`);
      
      // Apply FOMO filter
      await page.click('button:has-text("FOMO Trades")');
      await page.waitForTimeout(2000);
      
      // Get filtered trades count
      const filteredTotalTrades = await page.locator('text=Filtered Trades').locator('..').locator('p:text-matches(/\\d+/)').textContent();
      console.log(`📊 Filtered trades count: ${filteredTotalTrades}`);
      
      if (filteredTotalTrades !== initialTotalTrades) {
        console.log('✅ Statistics update correctly when filtering');
        testResults.filteringTests.push({
          test: 'Statistics Update on Filter',
          status: 'success',
          expected: 'different from initial',
          actual: filteredTotalTrades
        });
      } else {
        console.log('❌ Statistics do not update when filtering');
        testResults.filteringTests.push({
          test: 'Statistics Update on Filter',
          status: 'failed',
          expected: 'different from initial',
          actual: filteredTotalTrades
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing statistics update:', error.message);
      testResults.errors.push(`Error testing statistics update: ${error.message}`);
    }
    
    // Step 9: Test edge cases
    console.log('\n🧪 Step 9: Testing edge cases...');
    
    // Test clearing filters
    try {
      await page.click('button:has-text("Reset All")');
      await page.waitForTimeout(1000);
      
      const totalTradesAfterReset = await page.locator('table tbody tr').count();
      if (totalTradesAfterReset >= testTrades.length) {
        console.log('✅ Clearing filters works correctly');
        testResults.filteringTests.push({
          test: 'Clear Filters',
          status: 'success',
          expected: testTrades.length,
          actual: totalTradesAfterReset
        });
      } else {
        console.log('❌ Clearing filters failed');
        testResults.filteringTests.push({
          test: 'Clear Filters',
          status: 'failed',
          expected: testTrades.length,
          actual: totalTradesAfterReset
        });
      }
    } catch (error) {
      console.error('❌ Error testing clear filters:', error.message);
      testResults.errors.push(`Error testing clear filters: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Critical error during test execution:', error);
    testResults.errors.push(`Critical error: ${error.message}`);
  } finally {
    // Save test results
    testResults.endTime = new Date().toISOString();
    testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
    
    // Calculate success rates
    const successfulTrades = testResults.tradesLogged.filter(t => t.status === 'success').length;
    const successfulTests = testResults.filteringTests.filter(t => t.status === 'success').length;
    
    testResults.summary = {
      totalTradesAttempted: testTrades.length,
      successfulTradesLogged: successfulTrades,
      tradeSuccessRate: `${((successfulTrades / testTrades.length) * 100).toFixed(1)}%`,
      totalFilteringTests: testResults.filteringTests.length,
      successfulFilteringTests: successfulTests,
      filteringSuccessRate: `${((successfulTests / testResults.filteringTests.length) * 100).toFixed(1)}%`,
      totalErrors: testResults.errors.length
    };
    
    // Save results to file
    const resultsFile = 'end-to-end-emotion-test-results.json';
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n📁 Test results saved to: ${resultsFile}`);
    
    // Print summary
    console.log('\n📋 TEST SUMMARY:');
    console.log(`================`);
    console.log(`✅ Trades Logged: ${successfulTrades}/${testTrades.length} (${testResults.summary.tradeSuccessRate})`);
    console.log(`✅ Filtering Tests: ${successfulTests}/${testResults.filteringTests.length} (${testResults.summary.filteringSuccessRate})`);
    console.log(`❌ Errors: ${testResults.errors.length}`);
    console.log(`⏱️  Duration: ${testResults.duration}ms`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    await browser.close();
  }
}

// Run the test
runEndToEndTest().catch(console.error);