const { chromium } = require('playwright');

(async () => {
  console.log('🔧 [Debug] Starting page content debug test...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    console.log('🔧 [Debug] Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    console.log('🔧 [Debug] Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the login page
    const url = page.url();
    console.log(`🔧 [Debug] Current URL: ${url}`);
    
    if (url.includes('/login')) {
      console.log('✅ [Debug] Login page loaded successfully');
      
      // Get the page title
      const title = await page.title();
      console.log(`🔧 [Debug] Page title: ${title}`);
      
      // Get the page content
      const html = await page.content();
      console.log(`🔧 [Debug] Page HTML length: ${html.length}`);
      
      // Check for specific elements
      const bodyText = await page.textContent('body');
      console.log(`🔧 [Debug] Body text length: ${bodyText.length}`);
      console.log(`🔧 [Debug] First 200 chars of body: ${bodyText.substring(0, 200)}`);
      
      // Check for form elements with more specific selectors
      const formExists = await page.$('form') !== null;
      console.log(`🔧 [Debug] Form exists: ${formExists}`);
      
      const inputs = await page.$$('input');
      console.log(`🔧 [Debug] Number of input elements: ${inputs.length}`);
      
      const buttons = await page.$$('button');
      console.log(`🔧 [Debug] Number of button elements: ${buttons.length}`);
      
      // Check for specific classes
      const glassElements = await page.$$('.glass-morphism');
      console.log(`🔧 [Debug] Number of glass-morphism elements: ${glassElements.length}`);
      
      const inputFields = await page.$$('.input-field');
      console.log(`🔧 [Debug] Number of input-field elements: ${inputFields.length}`);
      
      const buttonPrimary = await page.$$('.button-primary');
      console.log(`🔧 [Debug] Number of button-primary elements: ${buttonPrimary.length}`);
      
      // Take a screenshot to see what's actually on the page
      await page.screenshot({ path: 'debug-page-content.png' });
      console.log('🔧 [Debug] Screenshot saved as debug-page-content.png');
      
      // Save the HTML content for inspection
      require('fs').writeFileSync('debug-page-content.html', html);
      console.log('🔧 [Debug] HTML content saved as debug-page-content.html');
    } else {
      console.log('❌ [Debug] Not on login page');
    }
  } catch (error) {
    console.error('❌ [Debug] Page content debug test FAILED with error:', error);
  } finally {
    await browser.close();
  }
})();