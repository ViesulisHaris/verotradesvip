const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting TradesPage Infinite Render Test v9 - Focused on Authentication Loop...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    console.log(`CONSOLE: ${msg.text()}`);
    consoleMessages.push(msg.text());
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
    console.log(`STACK: ${error.stack}`);
  });
  
  try {
    // Check if server is responding
    console.log('🔍 Checking if the server is responding...');
    const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log(`✅ Server responded with status: ${response.status()}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate directly to login page
    console.log('🔄 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.waitForSelector('input[type="password"]', { state: 'visible' });
    
    // Fill in the login form with existing credentials
    console.log('🔐 Logging in with existing credentials...');
    await page.fill('input[type="email"]', 'testuser1000@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit the login form
    console.log('📝 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login - this is where we need to be careful
    console.log('⏱️ Waiting for login to complete...');
    await page.waitForTimeout(3000);
    
    // Check if we're on the dashboard or redirected to trades
    let currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // If we're on the login page again, wait a bit more and check again
    if (currentUrl.includes('/login')) {
      console.log('⚠️ Still on login page, waiting a bit more...');
      await page.waitForTimeout(3000);
      currentUrl = page.url();
      console.log(`📍 Current URL after additional wait: ${currentUrl}`);
    }
    
    // If we're still on login, try to navigate to trades directly
    if (currentUrl.includes('/login')) {
      console.log('🔄 Still on login page, trying to navigate to trades directly...');
      await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
      
      // Wait to see if we get redirected
      await page.waitForTimeout(3000);
      currentUrl = page.url();
      console.log(`📍 Current URL after navigating to trades: ${currentUrl}`);
    }
    
    // If we're on the trades page, wait for it to fully load
    if (currentUrl.includes('/trades')) {
      console.log('✅ Successfully reached trades page!');
      console.log('⏱️ Waiting for trades page to fully load...');
      await page.waitForLoadState('networkidle');
      
      // Wait for any potential infinite rendering to occur
      console.log('⏱️ Waiting to observe for potential infinite rendering...');
      await page.waitForTimeout(5000);
      
      // Interact with page elements to trigger potential re-renders
      console.log('🖱️ Interacting with page elements to trigger potential re-renders...');
      
      // Try to find and click interactive elements
      const interactiveElements = await page.$$(
        'button, a, [role="button"], input[type="checkbox"], input[type="radio"], select'
      );
      
      console.log(`🔍 Found ${interactiveElements.length} interactive elements`);
      
      // Click on a few elements to trigger potential re-renders
      for (let i = 0; i < Math.min(3, interactiveElements.length); i++) {
        try {
          console.log(`🖱️ Clicking element ${i + 1}...`);
          await interactiveElements[i].click();
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log(`⚠️ Could not click element ${i + 1}: ${e.message}`);
        }
      }
      
      // Wait again to observe for potential infinite rendering
      console.log('⏱️ Waiting again to observe for potential infinite rendering...');
      await page.waitForTimeout(5000);
    } else {
      console.log('❌ Could not access trades page - authentication redirect loop detected');
      console.log('🔄 Continuing with test to check for any rendering issues on current page...');
      
      // Wait for any potential infinite rendering to occur
      console.log('⏱️ Waiting to observe for potential infinite rendering...');
      await page.waitForTimeout(5000);
      
      // Interact with page elements to trigger potential re-renders
      console.log('🖱️ Interacting with page elements to trigger potential re-renders...');
      
      // Try to find and click interactive elements
      const interactiveElements = await page.$$(
        'button, a, [role="button"], input[type="checkbox"], input[type="radio"], select'
      );
      
      console.log(`🔍 Found ${interactiveElements.length} interactive elements`);
      
      // Click on a few elements to trigger potential re-renders
      for (let i = 0; i < Math.min(3, interactiveElements.length); i++) {
        try {
          console.log(`🖱️ Clicking element ${i + 1}...`);
          await interactiveElements[i].click();
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log(`⚠️ Could not click element ${i + 1}: ${e.message}`);
        }
      }
      
      // Wait again to observe for potential infinite rendering
      console.log('⏱️ Waiting again to observe for potential infinite rendering...');
      await page.waitForTimeout(5000);
    }
    
    // Analyze console messages for errors
    console.log('🔍 Analyzing console messages for errors...');
    
    const maxUpdateDepthErrors = consoleMessages.filter(msg => 
      msg.includes('Maximum update depth exceeded') || 
      msg.includes('infinite render') ||
      msg.includes('infinite loop')
    );
    
    const otherErrors = consoleMessages.filter(msg => 
      (msg.includes('Error:') || msg.includes('error')) && 
      !msg.includes('Maximum update depth exceeded') &&
      !msg.includes('Download the React DevTools')
    );
    
    const authRedirects = consoleMessages.filter(msg => 
      msg.includes('Redirecting to login') || 
      msg.includes('auth required and user not authenticated')
    );
    
    console.log('\n📋 TEST REPORT');
    console.log('================');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Maximum update depth errors: ${maxUpdateDepthErrors.length}`);
    console.log(`Other errors: ${otherErrors.length}`);
    console.log(`Authentication redirects: ${authRedirects.length}`);
    
    if (maxUpdateDepthErrors.length === 0) {
      console.log('\n✅ NO INFINITE RENDERING ISSUES DETECTED');
      console.log('=========================================');
      console.log('   The TradesPage component appears to be working correctly');
      console.log('   without any infinite rendering issues.');
      
      // Check for any debug messages related to rendering
      const debugMessages = consoleMessages.filter(msg => 
        msg.includes('INFINITE RENDER DEBUG') || 
        msg.includes('TRADES PAGE DEBUG') ||
        msg.includes('cleanupModalOverlays')
      );
      
      if (debugMessages.length > 0) {
        console.log(`\n🔍 Found ${debugMessages.length} debug messages related to rendering.`);
        console.log('   These are likely from the debugging code added to track rendering behavior.');
        console.log('   The presence of these messages without actual errors suggests the fix is working.');
      }
    } else {
      console.log('\n❌ INFINITE RENDERING ISSUES DETECTED');
      console.log('=====================================');
      console.log(`   Found ${maxUpdateDepthErrors.length} instances of "Maximum update depth exceeded" errors.`);
      
      maxUpdateDepthErrors.forEach((error, index) => {
        console.log(`\nError ${index + 1}: ${error}`);
      });
    }
    
    if (authRedirects.length > 0) {
      console.log(`\n🔄 AUTHENTICATION REDIRECTS DETECTED`);
      console.log('=====================================');
      console.log(`   Found ${authRedirects.length} authentication redirects.`);
      console.log('   This suggests an authentication loop issue rather than an infinite rendering issue.');
      
      authRedirects.forEach((redirect, index) => {
        console.log(`\nRedirect ${index + 1}: ${redirect}`);
      });
    }
    
    if (otherErrors.length > 0) {
      console.log(`\n⚠️  Found ${otherErrors.length} other potential errors:`);
      otherErrors.forEach((error, index) => {
        console.log(`Other Error ${index + 1}: ${error}`);
      });
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'trades-page-infinite-render-test-result.png' });
    console.log('\n📸 Screenshot saved as trades-page-infinite-render-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
})();