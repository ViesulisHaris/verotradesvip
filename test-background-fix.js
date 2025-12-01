// Test script to verify the Balatro background fix
const puppeteer = require('puppeteer');

async function testBackgroundFix() {
  console.log('Testing Balatro background fix...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport to a standard size
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot of the full page
    await page.screenshot({ 
      path: 'background-test-full-page.png',
      fullPage: true 
    });
    
    // Take a screenshot of just the background canvas
    const canvasElement = await page.$('.balatro-canvas');
    if (canvasElement) {
      await canvasElement.screenshot({ 
        path: 'background-test-canvas.png' 
      });
    }
    
    // Check if the canvas is rendering properly
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { error: 'Canvas not found' };
      
      const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!ctx) return { error: 'WebGL context not found' };
      
      return {
        width: canvas.width,
        height: canvas.height,
        hasContext: true
      };
    });
    
    console.log('Canvas info:', canvasInfo);
    
    // Test mouse interaction to see if the blur effect responds
    await page.mouse.move(500, 300);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.mouse.move(1000, 700);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take another screenshot after mouse interaction
    await page.screenshot({ 
      path: 'background-test-after-interaction.png',
      fullPage: true 
    });
    
    console.log('Background fix test completed successfully!');
    console.log('Screenshots saved:');
    console.log('- background-test-full-page.png');
    console.log('- background-test-canvas.png');
    console.log('- background-test-after-interaction.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testBackgroundFix();