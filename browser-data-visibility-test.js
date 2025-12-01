const { chromium } = require('playwright');
require('dotenv').config();

async function browserDataVisibilityTest() {
  console.log('🌐 [BROWSER TEST] Testing data visibility in actual browser...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navigate to login page
    console.log('\n🔍 [STEP 1] Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 2. Fill in login credentials
    console.log('\n🔍 [STEP 2] Logging in as testuser@verotrade.com...');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ [STEP 2] Successfully logged in and redirected to dashboard');
    
    // 3. Check dashboard for data
    console.log('\n🔍 [STEP 3] Checking dashboard for trade data...');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any async data loading
    await page.waitForTimeout(3000);
    
    // Check for total trades element
    const totalTradesElement = await page.$('[data-testid="pnl"]');
    if (totalTradesElement) {
      const totalTradesText = await totalTradesElement.textContent();
      console.log(`📊 [STEP 3] Total P&L found: ${totalTradesText}`);
    } else {
      console.log('❌ [STEP 3] Total P&L element not found');
    }
    
    // Check for any "No trades yet" message
    const noTradesElement = await page.$('text=No trades yet');
    if (noTradesElement) {
      console.log('❌ [STEP 3] "No trades yet" message found - DATA NOT LOADING');
    } else {
      console.log('✅ [STEP 3] No "No trades yet" message found');
    }
    
    // Check for loading indicators
    const loadingElements = await page.$$('.animate-spin');
    if (loadingElements.length > 0) {
      console.log('⏳ [STEP 3] Loading indicators still present');
    } else {
      console.log('✅ [STEP 3] No loading indicators found');
    }
    
    // Check for error messages
    const errorElements = await page.$$('.text-red-400');
    if (errorElements.length > 0) {
      console.log('❌ [STEP 3] Error elements found:');
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log(`   - ${errorText}`);
      }
    } else {
      console.log('✅ [STEP 3] No error elements found');
    }
    
    // 4. Navigate to trades page
    console.log('\n🔍 [STEP 4] Navigating to trades page...');
    await page.click('a[href="/trades"]');
    await page.waitForURL('**/trades', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 5. Check trades page for data
    console.log('\n🔍 [STEP 5] Checking trades page for trade data...');
    
    // Check for "No trades yet" message
    const tradesPageNoTrades = await page.$('text=No trades yet');
    if (tradesPageNoTrades) {
      console.log('❌ [STEP 5] "No trades yet" message found on trades page');
    } else {
      console.log('✅ [STEP 5] No "No trades yet" message on trades page');
    }
    
    // Check for trade cards
    const tradeCards = await page.$$('.glass.rounded-xl');
    console.log(`📊 [STEP 5] Found ${tradeCards.length} trade cards`);
    
    if (tradeCards.length > 0) {
      // Get sample trade data
      const firstTradeCard = tradeCards[0];
      const symbolElement = await firstTradeCard.$('text=/^[A-Z]+$/'); // Symbol pattern
      if (symbolElement) {
        const symbol = await symbolElement.textContent();
        console.log(`📋 [STEP 5] Sample trade symbol: ${symbol}`);
      }
    }
    
    // 6. Check browser console for errors
    console.log('\n🔍 [STEP 6] Checking browser console for errors...');
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ [CONSOLE ERROR] ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`⚠️ [CONSOLE WARNING] ${msg.text()}`);
      }
    });
    
    // 7. Check network requests
    console.log('\n🔍 [STEP 7] Monitoring network requests...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/rest/v1/trades') || request.url().includes('/rest/v1/strategies')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Refresh the page to trigger network requests
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`📊 [STEP 7] Made ${requests.length} relevant API requests`);
    requests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
    });
    
    // 8. Take screenshots for visual verification
    console.log('\n🔍 [STEP 8] Taking screenshots...');
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
    console.log('📸 [STEP 8] Dashboard screenshot saved as dashboard-screenshot.png');
    
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'trades-screenshot.png', fullPage: true });
    console.log('📸 [STEP 8] Trades page screenshot saved as trades-screenshot.png');
    
    // 9. Summary
    console.log('\n🔍 [BROWSER TEST] SUMMARY:');
    console.log(`✅ Login: SUCCESS`);
    console.log(`📊 Dashboard P&L Element: ${totalTradesElement ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`📊 Dashboard "No trades": ${noTradesElement ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`📊 Trades Page Cards: ${tradeCards.length}`);
    console.log(`📊 Trades Page "No trades": ${tradesPageNoTrades ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`📊 API Requests: ${requests.length}`);
    
    if (tradeCards.length === 0) {
      console.log('\n🚨 [PROBLEM CONFIRMED] Trades are not visible in the browser despite backend working correctly.');
      console.log('🔧 [LIKELY CAUSES]:');
      console.log('   1. Frontend authentication state not properly synchronized');
      console.log('   2. Component state management issue');
      console.log('   3. Error in data fetching logic that\'s silently failing');
      console.log('   4. UI rendering issue where data exists but isn\'t displayed');
    } else {
      console.log('\n✅ [NO ISSUE] Trades are visible in the browser');
    }
    
  } catch (error) {
    console.error('❌ [BROWSER TEST] Error:', error);
  } finally {
    await browser.close();
  }
}

browserDataVisibilityTest();