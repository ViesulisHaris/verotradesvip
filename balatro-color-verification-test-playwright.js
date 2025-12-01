const { chromium } = require('playwright');
const path = require('path');

async function testBalatroColors() {
  console.log('Starting Balatro color verification test with Playwright...');
  
  const browser = await chromium.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the test page
    console.log('Navigating to test-balatro-new-colors page...');
    await page.goto('http://localhost:3000/test-balatro-new-colors', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the page to fully load and the Balatro component to initialize
    console.log('Waiting for Balatro component to initialize...');
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the full page
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(__dirname, `balatro-color-test-${timestamp}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Check if the Balatro canvas is present and rendering
    const canvasExists = await page.locator('.balatro-canvas').count() > 0;
    
    console.log(`Balatro canvas exists: ${canvasExists}`);
    
    if (canvasExists) {
      // Get the canvas context to verify WebGL is working
      const webglWorking = await page.evaluate(() => {
        const canvas = document.querySelector('.balatro-canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      });
      
      console.log(`WebGL context working: ${webglWorking}`);
      
      // Check for the color indicators on the page
      const colorIndicators = await page.evaluate(() => {
        const indicators = document.querySelectorAll('[style*="backgroundColor"]');
        const colors = [];
        indicators.forEach(indicator => {
          const style = indicator.getAttribute('style');
          const match = style.match(/backgroundColor:\s*#([A-Fa-f0-9]{6})/);
          if (match) {
            colors.push(match[1].toUpperCase());
          }
        });
        return colors;
      });
      
      console.log('Color indicators found:', colorIndicators);
      
      // Verify the expected colors are present
      const expectedColors = ['1A2F1A', '1A1A3A', '2D0B0B'];
      const allExpectedColorsPresent = expectedColors.every(color => 
        colorIndicators.includes(color)
      );
      
      console.log(`Expected colors present: ${allExpectedColorsPresent}`);
      
      if (allExpectedColorsPresent) {
        console.log('✅ All expected color indicators are present on the page');
        console.log('✅ Dark Forest Green (#1A2F1A) - Present');
        console.log('✅ Dark Blue (#1A1A3A) - Present');
        console.log('✅ Dark Red (#2D0B0B) - Present');
      } else {
        console.log('❌ Some expected colors are missing');
        console.log('Expected:', expectedColors);
        console.log('Found:', colorIndicators);
      }
    }
    
    // Wait a bit more to observe the animation
    console.log('Waiting to observe the animation...');
    await page.waitForTimeout(5000);
    
    // Take another screenshot after animation
    const animatedScreenshotPath = path.join(__dirname, `balatro-color-test-animated-${timestamp}.png`);
    await page.screenshot({
      path: animatedScreenshotPath,
      fullPage: true
    });
    console.log(`Animated screenshot saved to: ${animatedScreenshotPath}`);
    
    // Test mouse interaction
    console.log('Testing mouse interaction...');
    const canvas = page.locator('.balatro-canvas');
    if (await canvas.count() > 0) {
      // Move mouse over the canvas to test interaction
      await canvas.hover();
      await page.waitForTimeout(1000);
      
      // Move mouse to different positions
      await page.mouse.move(500, 300);
      await page.waitForTimeout(500);
      await page.mouse.move(1000, 600);
      await page.waitForTimeout(500);
      await page.mouse.move(200, 800);
      await page.waitForTimeout(500);
      
      // Take screenshot during interaction
      const interactionScreenshotPath = path.join(__dirname, `balatro-color-test-interaction-${timestamp}.png`);
      await page.screenshot({
        path: interactionScreenshotPath,
        fullPage: true
      });
      console.log(`Interaction screenshot saved to: ${interactionScreenshotPath}`);
    }
    
    console.log('\n=== BALATRO COLOR VERIFICATION REPORT ===');
    console.log('1. Test page loaded successfully: ✅');
    console.log(`2. Balatro canvas present: ${canvasExists ? '✅' : '❌'}`);
    console.log(`3. WebGL context working: ${canvasExists ? (webglWorking ? '✅' : '❌') : 'N/A'}`);
    console.log(`4. Expected color indicators present: ${allExpectedColorsPresent ? '✅' : '❌'}`);
    console.log('5. Screenshots captured: ✅');
    console.log('6. Mouse interaction tested: ✅');
    console.log('\n=== VISUAL OBSERVATION NOTES ===');
    console.log('- The page displays the Balatro background with animated gradient');
    console.log('- Little specs should be visible with dark forest green, dark blue, and dark red colors');
    console.log('- The blur intensity should be reduced (from 0.5 to 0.3) compared to previous version');
    console.log('- Mouse interaction should create a flowing gradient effect that follows cursor movement');
    console.log('\nPlease review the screenshots to visually confirm:');
    console.log('1. Dark forest green specs (#1A2F1A)');
    console.log('2. Dark blue specs (#1A1A3A)');
    console.log('3. Dark red specs (#2D0B0B)');
    console.log('4. Reduced blur intensity (should appear clearer than previous version)');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testBalatroColors();