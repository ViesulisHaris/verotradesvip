const { chromium } = require('playwright');

async function simpleBlurTest() {
  console.log('Simple blur effect test...');
  
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
  });
  
  try {
    console.log('Navigating to the application...');
    
    // Navigate to the app with a shorter timeout
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('✓ Page loaded (domcontentloaded)');
    
    // Wait a bit more to see if it stabilizes
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasBalatroContainer: !!document.querySelector('.balatro-container'),
        hasBalatroCanvas: !!document.querySelector('.balatro-canvas'),
        bodyHTML: document.body.innerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('Page info:', pageInfo);
    
    if (pageInfo.hasBalatroContainer) {
      console.log('✓ Balatro container found');
    } else {
      console.log('✗ Balatro container not found');
    }
    
    if (pageInfo.hasBalatroCanvas) {
      console.log('✓ Balatro canvas found');
    } else {
      console.log('✗ Balatro canvas not found');
    }
    
    console.log('✓ Test completed successfully');
    
  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

simpleBlurTest().catch(console.error);