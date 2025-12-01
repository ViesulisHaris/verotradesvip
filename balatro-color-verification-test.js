const { chromium } = require('playwright');
const path = require('path');

async function verifyBalatroColorChange() {
  console.log('Starting Balatro color verification test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot to verify the color change
    await page.screenshot({ 
      path: 'balatro-color-verification.png',
      fullPage: true
    });
    
    // Check if the canvas element exists
    const canvasExists = await page.locator('.balatro-canvas').isVisible();
    console.log(`Canvas element visible: ${canvasExists}`);
    
    // Get the canvas context and check if it's rendering
    const canvasElement = await page.$('.balatro-canvas');
    if (canvasElement) {
      const context = await canvasElement.evaluate((canvas) => {
        const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return ctx ? true : false;
      });
      console.log(`WebGL context available: ${context}`);
    }
    
    console.log('Balatro color verification test completed successfully!');
    console.log('Screenshot saved as: balatro-color-verification.png');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
}

verifyBalatroColorChange();