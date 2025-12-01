const { chromium } = require('playwright');

async function testBlurEffect() {
  console.log('Testing blur effect implementation...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to the application...');
    
    // Navigate to the app
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✓ Page loaded successfully');
    
    // Check if the Balatro container exists
    const balatroContainer = await page.$('.balatro-container');
    if (balatroContainer) {
      console.log('✓ Balatro container found');
    } else {
      console.log('✗ Balatro container not found');
      return;
    }
    
    // Check if the canvas exists
    const balatroCanvas = await page.$('.balatro-canvas');
    if (balatroCanvas) {
      console.log('✓ Balatro canvas found');
      
      // Check if the blur effect is NOT applied via CSS (since we moved it to WebGL)
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
      
      if (computedStyle && computedStyle.filter === 'none') {
        console.log('✓ CSS blur effect removed (as expected)');
      } else {
        console.log('⚠ CSS blur effect still present:', computedStyle?.filter);
      }
      
      // Check if WebGL context is created
      const webglInfo = await page.evaluate(() => {
        const canvas = document.querySelector('.balatro-canvas');
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            return {
              vendor: gl.getParameter(gl.VENDOR),
              renderer: gl.getParameter(gl.RENDERER),
              version: gl.getParameter(gl.VERSION)
            };
          }
        }
        return null;
      });
      
      if (webglInfo) {
        console.log('✓ WebGL context created successfully');
        console.log('WebGL Info:', webglInfo);
      } else {
        console.log('✗ WebGL context not found');
      }
      
    } else {
      console.log('✗ Balatro canvas not found');
    }
    
    // Wait a bit to see if anything crashes
    await page.waitForTimeout(3000);
    
    console.log('✓ Page appears to be stable with blur effect');
    
  } catch (error) {
    console.error('Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

testBlurEffect().catch(console.error);