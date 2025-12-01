const puppeteer = require('puppeteer');

async function testBalatroPage() {
  console.log('🔍 Starting Balatro debug test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console output
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log('🚨 PAGE ERROR:', error.message);
    console.log('🚨 ERROR STACK:', error.stack);
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    console.log('❌ REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  try {
  await page.goto('http://localhost:3000/test-balatro-simple', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  // Wait for WebGL initialization
  await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if Balatro canvas exists
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return false;
      
      const rect = canvas.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      // Check WebGL context with more detailed info
      let gl = null;
      let webglError = null;
      try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          webglError = 'WebGL context not supported';
        }
      } catch (error) {
        webglError = error.message;
      }
      const hasWebGL = !!gl;
      
      return {
        canvasExists: true,
        isVisible,
        hasWebGL,
        webglError,
        webglExtensions: gl ? gl.getSupportedExtensions() : null,
        webglVendor: gl ? gl.getParameter(gl.VENDOR) : null,
        webglRenderer: gl ? gl.getParameter(gl.RENDERER) : null,
        width: rect.width,
        height: rect.height,
        canvas: canvas.outerHTML.substring(0, 200) + '...'
      };
    });
    
    console.log('\n📊 BALATRO CANVAS ANALYSIS:');
    console.log(JSON.stringify(canvasExists, null, 2));
    
    // Check Balatro container
    const containerInfo = await page.evaluate(() => {
      const container = document.querySelector('.balatro-container');
      if (!container) return { exists: false };
      
      const rect = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      
      return {
        exists: true,
        width: rect.width,
        height: rect.height,
        zIndex: styles.zIndex,
        position: styles.position,
        top: styles.top,
        left: styles.left,
        background: styles.background,
        display: styles.display
      };
    });
    
    console.log('\n📦 BALATRO CONTAINER ANALYSIS:');
    console.log(JSON.stringify(containerInfo, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'balatro-debug-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as balatro-debug-test.png');
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
  } finally {
    await browser.close();
  }
}

testBalatroPage().catch(console.error);