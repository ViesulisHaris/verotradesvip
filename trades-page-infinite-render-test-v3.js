const { chromium, expect } = require('playwright');

(async () => {
  console.log('🔍 Starting TradesPage Infinite Render Test v3 - Focused on Maximum Update Depth Error...');
  
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
  
  // Set longer timeouts
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  
  // Capture console messages
  const consoleMessages = [];
  const maxUpdateDepthErrors = [];
  const infiniteRenderDebugMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`CONSOLE: ${text}`);
    
    // Check for the specific error we're looking for
    if (text.includes('Maximum update depth exceeded')) {
      console.log('❌ ERROR DETECTED: Maximum update depth exceeded error found!');
      maxUpdateDepthErrors.push(text);
    }
    
    // Check for infinite render debug messages
    if (text.includes('INFINITE RENDER DEBUG')) {
      console.log('🔍 DEBUG: Infinite render debug message detected');
      infiniteRenderDebugMessages.push(text);
    }
    
    // Check for any React errors
    if (text.includes('Uncaught Error') || text.includes('React error')) {
      console.log('⚠️ REACT ERROR DETECTED:', text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
    console.log(`STACK: ${error.stack}`);
    
    // Check if this is the maximum update depth exceeded error
    if (error.message.includes('Maximum update depth exceeded')) {
      console.log('❌ CRITICAL ERROR: Maximum update depth exceeded error detected in page error!');
      maxUpdateDepthErrors.push(error.message);
    }
  });
  
  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('/trades')) {
      console.log(`NETWORK: ${request.method()} ${request.url()}`);
    }
  });
  
  try {
    // First check if the server is responding
    console.log('🔍 Checking if the server is responding...');
    try {
      const response = await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      console.log(`✅ Server responded with status: ${response.status()}`);
    } catch (error) {
      console.log(`❌ Server not responding: ${error.message}`);
      throw new Error('Server is not running or not accessible');
    }
    
    // Navigate to the home page first
    console.log('🚀 Navigating to home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Check if we need to login
    const loginButton = await page.$('a[href="/login"]');
    if (loginButton) {
      console.log('🔑 Login button found, navigating to login page...');
      await loginButton.click();
      
      // Wait for the login page to load
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Login with test credentials (you may need to adjust these)
      console.log('🔑 Logging in with test credentials...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Find and click the login button
      const loginSubmitButton = await page.$('button[type="submit"]');
      if (loginSubmitButton) {
        await loginSubmitButton.click();
      } else {
        // Try to find any button that contains "Login" or "Sign In"
        const loginButtons = await page.$$('button');
        for (const button of loginButtons) {
          const buttonText = await button.textContent();
          if (buttonText && (buttonText.includes('Login') || buttonText.includes('Sign In'))) {
            await button.click();
            break;
          }
        }
      }
      
      // Wait for navigation to complete after login
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Login successful, redirected to dashboard');
    } else {
      console.log('ℹ️  Already logged in or login page not found');
    }
    
    // Navigate to the trades page
    console.log('🔄 Navigating to trades page...');
    
    // Try multiple ways to find the trades link
    let tradesLink = await page.$('a[href="/trades"]');
    if (!tradesLink) {
      // Try to find a link with text "Trades"
      const links = await page.$$('a');
      for (const link of links) {
        const linkText = await link.textContent();
        if (linkText && linkText.includes('Trades')) {
          tradesLink = link;
          break;
        }
      }
    }
    
    if (tradesLink) {
      await tradesLink.click();
    } else {
      // If no link found, navigate directly
      console.log('🔄 No trades link found, navigating directly...');
      await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
    }
    
    // Wait for the trades page to load
    try {
      await page.waitForSelector('h1:has-text("Trade History")', { timeout: 15000 });
      console.log('✅ Trades page loaded successfully');
    } catch (error) {
      console.log('⚠️  Could not find "Trade History" heading, checking for other indicators...');
      
      // Try to find any element that indicates we're on the trades page
      const tradeElements = await page.$$('.dashboard-card');
      if (tradeElements.length > 0) {
        console.log('✅ Found trade elements, assuming trades page loaded');
      } else {
        console.log('❌ Could not confirm trades page loaded');
        throw new Error('Could not confirm trades page loaded');
      }
    }
    
    // Wait a bit more to see if any infinite rendering occurs
    console.log('⏱️ Waiting to observe for potential infinite rendering...');
    await page.waitForTimeout(5000);
    
    // Check for the presence of trade elements
    const tradeElements = await page.$$('.dashboard-card');
    console.log(`📊 Found ${tradeElements.length} trade elements on the page`);
    
    // Try to interact with elements that might trigger re-renders
    console.log('🖱️ Interacting with page elements to trigger potential re-renders...');
    
    // 1. Try to expand a trade if any exist
    const expandButtons = await page.$$('button');
    for (const button of expandButtons) {
      const buttonText = await button.textContent();
      if (buttonText && (buttonText.includes('Expand') || buttonText.includes('Details') || buttonText.includes('ChevronDown'))) {
        console.log('📂 Expanding a trade to test for re-renders...');
        await button.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // 2. Try to use pagination if it exists
    const nextButtons = await page.$$('button');
    for (const button of nextButtons) {
      const buttonText = await button.textContent();
      if (buttonText && (buttonText.includes('Next') || buttonText.includes('>') || buttonText.includes('ChevronRight'))) {
        console.log('📄 Clicking next page to test for re-renders...');
        await button.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // 3. Try to use filters if they exist
    const filterInputs = await page.$$('input');
    for (const input of filterInputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && (placeholder.includes('Search') || placeholder.includes('Filter'))) {
        console.log('🔍 Using filter to test for re-renders...');
        await input.fill('TEST');
        await page.waitForTimeout(2000);
        await input.fill('');
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // 4. Try to use sort controls if they exist
    const sortButtons = await page.$$('button');
    for (const button of sortButtons) {
      const buttonText = await button.textContent();
      if (buttonText && (buttonText.includes('Sort') || buttonText.includes('Date') || buttonText.includes('Symbol'))) {
        console.log('🔄 Using sort controls to test for re-renders...');
        await button.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // Wait a bit more to see if any infinite rendering occurs
    console.log('⏱️ Waiting again to observe for potential infinite rendering...');
    await page.waitForTimeout(5000);
    
    // Analyze console messages for errors
    console.log('🔍 Analyzing console messages for errors...');
    
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
      console.log('   This is likely happening at line 93:92 as mentioned in the issue.');
    } else {
      console.log('\n✅ NO INFINITE RENDERING ISSUES DETECTED');
      console.log('=========================================');
      console.log('   The TradesPage component appears to be working correctly');
      console.log('   without any infinite rendering issues.');
      
      if (infiniteRenderDebugMessages.length > 0) {
        console.log(`\n🔍 Found ${infiniteRenderDebugMessages.length} debug messages related to rendering.`);
        console.log('   These are likely from the debugging code added to track rendering behavior.');
        console.log('   The presence of these messages without actual errors suggests the fix is working.');
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
    await page.screenshot({ path: 'trades-page-infinite-render-test-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved as trades-page-infinite-render-test-result.png');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    
    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: 'trades-page-infinite-render-test-error.png', fullPage: true });
      console.log('📸 Error screenshot saved as trades-page-infinite-render-test-error.png');
    } catch (screenshotError) {
      console.log('❌ Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    // Close the browser
    await browser.close();
    console.log('🏁 Test completed');
  }
})();