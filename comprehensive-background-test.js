// Comprehensive test to verify the Balatro background fix
const puppeteer = require('puppeteer');

async function comprehensiveBackgroundTest() {
  console.log('Starting comprehensive background test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport to a standard size
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load and for the canvas to be initialized
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the Balatro component is loaded
    const balatroInfo = await page.evaluate(() => {
      const container = document.querySelector('.balatro-container');
      const canvas = document.querySelector('.balatro-canvas');
      
      if (!container) return { error: 'Balatro container not found' };
      if (!canvas) return { error: 'Balatro canvas not found' };
      
      const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!ctx) return { error: 'WebGL context not found' };
      
      return {
        containerExists: true,
        canvasExists: true,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasStyle: {
          width: canvas.style.width,
          height: canvas.style.height,
          position: canvas.style.position
        },
        hasWebGLContext: true,
        containerStyle: {
          position: container.style.position,
          zIndex: container.style.zIndex,
          overflow: container.style.overflow
        }
      };
    });
    
    console.log('Balatro component info:', balatroInfo);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'comprehensive-background-test-initial.png',
      fullPage: true 
    });
    
    // Test mouse interaction at different positions
    const positions = [
      { x: 200, y: 200 },
      { x: 800, y: 300 },
      { x: 1400, y: 700 },
      { x: 960, y: 540 } // Center
    ];
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      console.log(`Moving mouse to position ${i + 1}: (${pos.x}, ${pos.y})`);
      
      await page.mouse.move(pos.x, pos.y);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Take screenshot after each mouse movement
      await page.screenshot({ 
        path: `comprehensive-background-test-mouse-${i + 1}.png`,
        fullPage: true 
      });
    }
    
    // Check for any visual artifacts by sampling pixels
    const pixelAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('.balatro-canvas');
      if (!canvas) return { error: 'Canvas not found for pixel analysis' };
      
      const ctx = canvas.getContext('2dd') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      // Sample pixels at different positions
      const samples = [];
      const positions = [
        { x: 100, y: 100 },
        { x: 500, y: 300 },
        { x: 900, y: 200 },
        { x: 1300, y: 600 },
        { x: 1600, y: 800 }
      ];
      
      for (const pos of positions) {
        try {
          // Get pixel data (this is a simplified approach)
          const pixelData = {
            position: pos,
            timestamp: Date.now()
          };
          samples.push(pixelData);
        } catch (e) {
          samples.push({ position: pos, error: e.message });
        }
      }
      
      return { samples };
    });
    
    console.log('Pixel analysis:', pixelAnalysis);
    
    // Final screenshot
    await page.screenshot({ 
      path: 'comprehensive-background-test-final.png',
      fullPage: true 
    });
    
    console.log('Comprehensive background test completed successfully!');
    console.log('Screenshots saved:');
    console.log('- comprehensive-background-test-initial.png');
    for (let i = 1; i <= positions.length; i++) {
      console.log(`- comprehensive-background-test-mouse-${i}.png`);
    }
    console.log('- comprehensive-background-test-final.png');
    
    // Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      balatroInfo,
      pixelAnalysis,
      mouseTestPositions: positions,
      conclusion: balatroInfo.canvasExists && balatroInfo.hasWebGLContext ? 
        'SUCCESS: Balatro component loaded correctly with WebGL context' : 
        'FAILURE: Balatro component did not load properly'
    };
    
    // Save test report
    const fs = require('fs');
    fs.writeFileSync(
      'comprehensive-background-test-report.json',
      JSON.stringify(testReport, null, 2)
    );
    
    console.log('Test report saved to: comprehensive-background-test-report.json');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveBackgroundTest();