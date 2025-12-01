const puppeteer = require('puppeteer');

async function testDashboardBalatro() {
  console.log('🔍 Starting Dashboard Balatro test...');
  
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
  
  try {
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Wait longer for Balatro to fully initialize
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if Balatro canvas exists and has WebGL
    const balatroInfo = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { exists: false };
      
      const rect = canvas.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      // Check WebGL context with multiple attempts
      let gl = null;
      let hasWebGL = false;
      let webglError = null;
      
      try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        hasWebGL = !!gl;
        
        if (gl) {
          // Test if WebGL is actually functional
          const testTexture = gl.createTexture();
          if (testTexture) {
            gl.deleteTexture(testTexture);
          } else {
            webglError = 'WebGL context exists but is not functional';
          }
        }
      } catch (error) {
        webglError = error.message;
      }
      
      // Check if canvas is actually rendering something
      const pixelData = canvas.getContext('2d')?.getImageData(0, 0, 1, 1);
      const hasContent = pixelData && pixelData.data.some(pixel => pixel !== 0);
      
      return {
        exists: true,
        isVisible,
        hasWebGL,
        webglError,
        width: rect.width,
        height: rect.height,
        hasContent,
        // Get some WebGL info
        webglVendor: gl ? gl.getParameter(gl.VENDOR) : null,
        webglRenderer: gl ? gl.getParameter(gl.RENDERER) : null
      };
    });
    
    console.log('\n📊 DASHBOARD BALATRO ANALYSIS:');
    console.log(JSON.stringify(balatroInfo, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-balatro-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as dashboard-balatro-test.png');
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
  } finally {
    await browser.close();
  }
}

testDashboardBalatro().catch(console.error);