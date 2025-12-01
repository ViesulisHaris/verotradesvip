const { chromium, expect } = require('playwright');

(async () => {
  console.log('🔍 Starting TradesPage Infinite Render Test...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Set to false to see the browser
    devtools: true,  // Open devtools to see console
    slowMo: 500     // Slow down by 500ms
  });
  
  // Create a new browser context
  const context = await browser.newContext();
  
  // Create a new page
  const page = await context.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`CONSOLE: ${text}`);
    
    // Check for the specific error we're looking for
    if (text.includes('Maximum update depth exceeded')) {
      console.log('❌ ERROR DETECTED: Maximum update depth exceeded error found!');
    }
    
    // Check for infinite render debug messages
    if (text.includes('INFINITE RENDER DEBUG')) {
      console.log('🔍 DEBUG: Infinite render debug message detected');
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
    console.log(`STACK: ${error.stack}`);
  });
  
  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('/trades')) {
      console.log(`NETWORK: ${request.method()} ${request.url()}`);
    }
  });
  
  try {
    // Navigate to the login page first
    console.log('🚀 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for the page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login with test credentials (you may need to adjust these)
    console.log('🔑 Logging in with test credentials...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete after login
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Login successful, redirected to dashboard');
    
    // Navigate to the trades page
    console.log('🔄 Navigating to trades page...');
    await page.click('a[href="/trades"]');
    
    // Wait for the trades page to load
    await page.waitForSelector('h1:has-text("Trade History")', { timeout: 15000 });
    console.log('✅ Trades page loaded successfully');
    
    // Wait a bit more to see if any infinite rendering occurs
    console.log('⏱️ Waiting to observe for potential infinite rendering...');
    await page.waitForTimeout(5000);
    
    // Check for the presence of trade elements
    const tradeElements = await page.$$('.dashboard-card');
    console.log(`📊 Found ${tradeElements.length} trade elements on the page`);
    
    // Try to interact with some elements to trigger potential re-renders
    console.log('🖱️ Interacting with page elements to trigger potential re-renders...');
    
    // Try to expand a trade if any exist
    const expandButtons = await page.$$('button:has-text("Expand")');
    if (expandButtons.length > 0) {
      console.log('📂 Expanding a trade to test for re-renders...');
      await expandButtons[0].click();
      await page.waitForTimeout(2000);
    }
    
    // Try to use pagination if it exists
    const nextButtons = await page.$$('button:has-text("Next")');
    if (nextButtons.length > 0) {
      console.log('📄 Clicking next page to test for re-renders...');
      await nextButtons[0].click();
      await page.waitForTimeout(2000);
    }
    
    // Wait a bit more to see if any infinite rendering occurs
    console.log('⏱️ Waiting again to observe for potential infinite rendering...');
    await page.waitForTimeout(5000);
    
    // Analyze console messages for errors
    console.log('🔍 Analyzing console messages for errors...');
    
    const maxUpdateDepthErrors = consoleMessages.filter(msg => 
      msg.includes('Maximum update depth exceeded')
    );
    
    const infiniteRenderDebugMessages = consoleMessages.filter(msg => 
      msg.includes('INFINITE RENDER DEBUG')
    );
    
    // Generate test report
    console.log('\n📋 TEST REPORT');
    console.log('================');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Maximum update depth errors: ${maxUpdateDepthErrors.length}`);
    console.log(`Infinite render debug messages: ${infiniteRenderDebugMessages.length}`);
    
    if (maxUpdateDepthErrors.length > 0) {
      console.log('\n❌ INFINITE RENDERING ISSUE DETECTED');
      console.log('=====================================');
      maxUpdateDepthErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}: ${error}`);
      });
      
      console.log('\n🔧 RECOMMENDATION: The infinite rendering issue has NOT been fixed.');
      console.log('   The TradesPage component is still causing "Maximum update depth exceeded" errors.');
    } else {
      console.log('\n✅ NO INFINITE RENDERING ISSUES DETECTED');
      console.log('=========================================');
      console.log('   The TradesPage component appears to be working correctly');
      console.log('   without any infinite rendering issues.');
      
      if (infiniteRenderDebugMessages.length > 0) {
        console.log(`\n🔍 Found ${infiniteRenderDebugMessages.length} debug messages related to rendering.`);
        console.log('   These are likely from the debugging code added to track rendering behavior.');
      }
    }
    
    // Check for any other errors
    const otherErrors = consoleMessages.filter(msg => 
      msg.includes('Error') || 
      msg.includes('error') || 
      msg.includes('Exception') ||
      msg.includes('Failed')
    ).filter(msg => !msg.includes('Maximum update depth exceeded'));
    
    if (otherErrors.length > 0) {
      console.log(`\n⚠️  Found ${otherErrors.length} other potential errors:`);
      otherErrors.forEach((error, index) => {
        console.log(`Other Error ${index + 1}: ${error}`);
      });
    } else {
      console.log('\n✅ No other errors detected in the console.');
    }
    
    // Take a screenshot for documentation
    await page.screenshot({ path: 'trades-page-test-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved as trades-page-test-result.png');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'trades-page-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as trades-page-test-error.png');
  } finally {
    // Close the browser
    await browser.close();
    console.log('🏁 Test completed');
  }
})();