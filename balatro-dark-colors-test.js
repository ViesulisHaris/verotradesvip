const { chromium } = require('playwright');
const path = require('path');

async function testBalatroDarkColors() {
  console.log('Testing Balatro component with darker colors and animation...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the dashboard where Balatro component is used
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load and the Balatro component to render
    await page.waitForTimeout(3000);
    
    // Take a screenshot to verify the darker colors
    await page.screenshot({ 
      path: 'balatro-dark-colors-test.png', 
      fullPage: false 
    });
    
    // Take a screenshot after a few seconds to see the animation
    await page.waitForTimeout(5000);
    await page.screenshot({ 
      path: 'balatro-dark-colors-test-animated.png', 
      fullPage: false 
    });
    
    // Check for any JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    // Check performance metrics
    const metrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('measure');
      return perfEntries.map(entry => ({
        name: entry.name,
        duration: entry.duration
      }));
    });
    
    console.log('Performance metrics:', metrics);
    
    console.log('✅ Test completed successfully!');
    console.log('📸 Screenshots saved:');
    console.log('  - balatro-dark-colors-test.png (initial state)');
    console.log('  - balatro-dark-colors-test-animated.png (after animation)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBalatroDarkColors();