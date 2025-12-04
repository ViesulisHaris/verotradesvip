const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('🚀 Starting Simple Test for /trades page');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    // Navigate to the /trades page
    console.log('Navigating to http://localhost:3000/trades');
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if we got an error
    const status = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body ? document.body.innerText.substring(0, 200) : 'No body found'
      };
    });
    
    console.log('Page status:', status);
    
    // Wait a bit more to see if the page loads
    await page.waitForTimeout(5000);
    
    // Check for any error messages on the page
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      const errorElements = document.querySelectorAll('h1, h2, p, div');
      
      errorElements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('Error') || text.includes('500') || text.includes('Internal Server Error')) {
          errors.push({
            tag: el.tagName,
            text: text.substring(0, 100)
          });
        }
      });
      
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('Error messages found on page:', errorMessages);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'trades-page-debug.png' });
    console.log('Screenshot saved to trades-page-debug.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);