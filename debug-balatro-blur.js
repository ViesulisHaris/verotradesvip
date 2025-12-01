const { chromium } = require('playwright');

async function debugBalatroBlur() {
  console.log('Starting Balatro blur effect debugging...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE CONSOLE:', msg.type(), msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    console.error('ERROR STACK:', error.stack);
  });
  
  // Enable request logging
  page.on('request', request => {
    console.log('REQUEST:', request.method(), request.url());
  });
  
  page.on('response', response => {
    console.log('RESPONSE:', response.status(), response.url());
  });
  
  try {
    console.log('Navigating to the application...');
    
    // Navigate to the app with a timeout
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page loaded, checking for Balatro component...');
    
    // Check if the Balatro container exists
    const balatroContainer = await page.$('.balatro-container');
    if (balatroContainer) {
      console.log('✓ Balatro container found');
    } else {
      console.log('✗ Balatro container not found');
    }
    
    // Check if the canvas exists
    const balatroCanvas = await page.$('.balatro-canvas');
    if (balatroCanvas) {
      console.log('✓ Balatro canvas found');
      
      // Check if the blur effect is applied
      const computedStyle = await page.evaluate(() => {
        const canvas = document.querySelector('.balatro-canvas');
        if (canvas) {
          const style = window.getComputedStyle(canvas);
          return {
            filter: style.filter,
            display: style.display,
            width: style.width,
            height: style.height
          };
        }
        return null;
      });
      
      console.log('Canvas computed style:', computedStyle);
    } else {
      console.log('✗ Balatro canvas not found');
    }
    
    // Check for any JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.performance.getEntriesByType('navigation')[0];
    });
    
    console.log('Navigation performance:', jsErrors);
    
    // Wait a bit more to see if anything crashes
    await page.waitForTimeout(5000);
    
    console.log('✓ Page appears to be stable');
    
  } catch (error) {
    console.error('Error during debugging:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await browser.close();
  }
}

debugBalatroBlur().catch(console.error);