const puppeteer = require('puppeteer');
const path = require('path');

async function testBalatroColors() {
  console.log('Testing Balatro component colors...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot to verify the colors
    const screenshot = await page.screenshot({ 
      path: 'balatro-color-test-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png',
      fullPage: true 
    });
    
    // Also capture an animated version to see the specs
    await new Promise(resolve => setTimeout(resolve, 2000));
    const animatedScreenshot = await page.screenshot({ 
      path: 'balatro-color-test-animated-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png',
      fullPage: true 
    });
    
    console.log('Screenshots taken successfully!');
    console.log('Please verify that only dark blue and dark forest green colors are present.');
    console.log('There should be no dark red color in the background.');
    
    // Keep the browser open for manual inspection
    console.log('Browser will remain open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testBalatroColors();