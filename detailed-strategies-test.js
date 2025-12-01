const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
    if (msg.location()) {
      console.log(`  at ${msg.location().url}:${msg.location().lineNumber}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
    console.log('  Stack:', error.stack);
  });
  
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url());
    console.log('  Error:', request.failure().errorText);
  });
  
  try {
    // Navigate to strategies page
    console.log('Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page HTML to check what's actually rendered
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('Body HTML length:', bodyHTML.length);
    
    // Check for specific elements
    const elements = [
      '.verotrade-top-navigation',
      '.verotrade-content-wrapper',
      'h1',
      '.dashboard-card',
      '.h1-dashboard'
    ];
    
    for (const selector of elements) {
      const visible = await page.isVisible(selector);
      console.log(`${selector} visible:`, visible);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'detailed-strategies-test.png', fullPage: true });
    console.log('Screenshot saved as detailed-strategies-test.png');
    
    // Get any error messages on the page
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      errorElements.forEach(el => {
        errors.push(el.textContent || el.innerText);
      });
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
  } catch (error) {
    console.error('Error testing strategies page:', error);
    console.log('Stack:', error.stack);
  } finally {
    await browser.close();
  }
})();