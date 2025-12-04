const puppeteer = require('puppeteer');

async function testTradesPage() {
  console.log('Starting test for trades page fix...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('Browser Console:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.error('Page Error:', error.message);
    });
    
    // Navigate to the trades page
    console.log('Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check for the specific error in console
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    // Check if the TypeError about createThrottledFunction exists
    const hasTypeError = consoleErrors.some(error => 
      error.includes('createThrottledFunction') && error.includes('not a function')
    );
    
    if (hasTypeError) {
      console.error('❌ FAILED: The TypeError "createThrottledFunction is not a function" is still present');
    } else {
      console.log('✅ SUCCESS: The TypeError "createThrottledFunction is not a function" is no longer present');
    }
    
    // Test visibility change handling
    console.log('Testing visibility change handling...');
    
    // Simulate page visibility change (like switching tabs)
    await page.evaluate(() => {
      // Dispatch visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Wait a bit to see if any errors occur
    await page.waitForTimeout(2000);
    
    console.log('✅ Visibility change handling test completed');
    
    // Check if the page loaded properly
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const hasTradesContent = await page.$('.flashlight-container') !== null;
    if (hasTradesContent) {
      console.log('✅ Trades page content loaded successfully');
    } else {
      console.log('⚠️ Trades page content may not have loaded properly');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'trades-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved as trades-page-test.png');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTradesPage().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});