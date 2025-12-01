const { chromium } = require('playwright');

async function testFilteringFunctionality() {
  console.log('🔍 Starting filtering functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the confluence page
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if we're logged in, if not, redirect to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔍 Not logged in, please log in first');
      await browser.close();
      return;
    }
    
    console.log('🔍 Page loaded, starting filter tests...');
    
    // Test 1: Market Filter
    console.log('\n=== Test 1: Market Filter (Stock) ===');
    await page.selectOption('select[placeholder="All Markets"]', 'Stock');
    await page.waitForTimeout(1000);
    
    // Check if filtered trades count is displayed
    const filteredTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after market filter: ${filteredTradesCount}`);
    
    // Test 2: Side Filter
    console.log('\n=== Test 2: Side Filter (Buy) ===');
    await page.selectOption('select[placeholder="All Sides"]', 'Buy');
    await page.waitForTimeout(1000);
    
    const buyTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after side filter: ${buyTradesCount}`);
    
    // Test 3: Quick Filter Pills
    console.log('\n=== Test 3: Quick Filter Pills (Crypto) ===');
    await page.click('button:has-text("Crypto")');
    await page.waitForTimeout(1000);
    
    const cryptoTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after Crypto pill: ${cryptoTradesCount}`);
    
    // Test 4: Emotion Filter
    console.log('\n=== Test 4: Emotion Filter (FOMO) ===');
    await page.click('button:has-text("FOMO Trades")');
    await page.waitForTimeout(1000);
    
    const fomoTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after FOMO filter: ${fomoTradesCount}`);
    
    // Test 5: Reset Filters
    console.log('\n=== Test 5: Reset Filters ===');
    await page.click('button:has-text("Reset All")');
    await page.waitForTimeout(1000);
    
    const resetTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after reset: ${resetTradesCount}`);
    
    // Test 6: Symbol Filter
    console.log('\n=== Test 6: Symbol Filter ===');
    await page.fill('input[placeholder="e.g., AAPL, BTCUSD"]', 'BTC');
    await page.waitForTimeout(1000);
    
    const symbolTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after symbol filter: ${symbolTradesCount}`);
    
    // Test 7: Date Range Filter
    console.log('\n=== Test 7: Date Range Filter ===');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.waitForTimeout(1000);
    
    const dateTradesCount = await page.locator('text=Filtered Trades').textContent();
    console.log(`🔍 Filtered trades count after date filter: ${dateTradesCount}`);
    
    // Check console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('[FILTER DEBUG]') || msg.text().includes('[EMOTION FILTER DEBUG]')) {
        console.log('🔍 Browser Console:', msg.text());
      }
    });
    
    console.log('\n✅ All filter tests completed!');
    console.log('🔍 Please check the browser window to verify the filtering is working visually.');
    
    // Keep the browser open for manual verification
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testFilteringFunctionality();