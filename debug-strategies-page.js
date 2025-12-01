const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to strategies page
    console.log('Navigating to strategies page...');
    await page.goto('http://localhost:3000/strategies', { waitUntil: 'networkidle' });
    
    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Get the full HTML content
    const htmlContent = await page.content();
    console.log('Full HTML content:');
    console.log(htmlContent);
    
    // Get the body content specifically
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    console.log('\nBody content:');
    console.log(bodyContent);
    
    // Check if there's a root element
    const rootElement = await page.evaluate(() => {
      const root = document.getElementById('__next');
      return root ? root.innerHTML : 'No __next root element found';
    });
    console.log('\nRoot element content:');
    console.log(rootElement);
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-strategies-test.png', fullPage: true });
    console.log('\nScreenshot saved as debug-strategies-test.png');
    
  } catch (error) {
    console.error('Error debugging strategies page:', error);
  } finally {
    await browser.close();
  }
})();