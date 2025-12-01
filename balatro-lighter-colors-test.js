const { chromium } = require('playwright');
const path = require('path');

async function testLighterColors() {
  console.log('Testing lighter Balatro colors for better visibility...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the dashboard where Balatro component is used
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load and Balatro component to render
    await page.waitForTimeout(3000);
    
    // Take a screenshot to verify the lighter colors
    await page.screenshot({ 
      path: 'balatro-lighter-colors-test.png',
      fullPage: true 
    });
    
    // Take an animated screenshot to show movement visibility
    await page.waitForTimeout(2000); // Let animation run
    await page.screenshot({ 
      path: 'balatro-lighter-colors-test-animated.png',
      fullPage: true 
    });
    
    // Check if the Balatro component is rendered
    const balatroContainer = await page.$('.balatro-container');
    if (balatroContainer) {
      console.log('✓ Balatro component found on page');
      
      // Get the computed style of the canvas to verify it's visible
      const canvas = await page.$('.balatro-canvas');
      if (canvas) {
        const isVisible = await canvas.isVisible();
        console.log(`✓ Balatro canvas is visible: ${isVisible}`);
      }
    } else {
      console.log('✗ Balatro component not found');
    }
    
    console.log('Screenshots saved:');
    console.log('- balatro-lighter-colors-test.png');
    console.log('- balatro-lighter-colors-test-animated.png');
    
    console.log('\nColor changes made:');
    console.log('- Forest green: #051005 → #0A1F0A (lighter)');
    console.log('- Blue: #0A0A1A → #141430 (lighter)');
    console.log('\nThe lighter colors should make the movement/shift in the background more visible.');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testLighterColors();