const puppeteer = require('puppeteer');
const path = require('path');

async function testBackgroundUniformity() {
  console.log('🧪 Starting Background Uniformity Test...');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Test different screen sizes
  const testSizes = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];
  
  const results = [];
  
  for (const size of testSizes) {
    console.log(`\n📱 Testing ${size.name} (${size.width}x${size.height})...`);
    
    await page.setViewport({ width: size.width, height: size.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the Balatro component to fully render
    await page.waitForTimeout(3000);
    
    // Take multiple screenshots at different scroll positions
    const screenshots = [];
    
    // Top of page
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 1000));
    screenshots.push({
      position: 'top',
      path: `background-test-${size.name.toLowerCase()}-top.png`,
      buffer: await page.screenshot({ fullPage: false })
    });
    
    // Middle of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise(resolve => setTimeout(resolve, 1000));
    screenshots.push({
      position: 'middle',
      path: `background-test-${size.name.toLowerCase()}-middle.png`,
      buffer: await page.screenshot({ fullPage: false })
    });
    
    // Bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 1000));
    screenshots.push({
      position: 'bottom',
      path: `background-test-${size.name.toLowerCase()}-bottom.png`,
      buffer: await page.screenshot({ fullPage: false })
    });
    
    // Analyze each screenshot for pattern consistency
    const analysisResults = [];
    
    for (const screenshot of screenshots) {
      console.log(`  📸 Analyzing ${screenshot.position} position...`);
      
      // Get image data for analysis
      const imageData = await page.evaluate(() => {
        // Get the WebGL canvas
        const canvas = document.querySelector('.balatro-canvas');
        if (!canvas) return [];
        
        const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!ctx) return [];
        
        // Get canvas dimensions
        const width = canvas.width;
        const height = canvas.height;
        
        // Create a temporary canvas to read pixels
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw WebGL canvas to 2D canvas
        tempCtx.drawImage(canvas, 0, 0);
        
        // Sample pixels from different regions
        const samples = [];
        const sampleSize = Math.min(50, Math.floor(width / 10), Math.floor(height / 10));
        
        for (let x = 0; x < width; x += sampleSize) {
          for (let y = 0; y < height; y += sampleSize) {
            const pixel = tempCtx.getImageData(x, y, 1, 1).data;
            samples.push({
              x, y,
              r: pixel[0],
              g: pixel[1],
              b: pixel[2]
            });
          }
        }
        
        return samples;
      });
      
      // Analyze color consistency
      const colorVariance = calculateColorVariance(imageData);
      const hasPatterns = detectPatterns(imageData);
      
      analysisResults.push({
        position: screenshot.position,
        colorVariance,
        hasPatterns,
        isUniform: colorVariance < 15 && !hasPatterns
      });
      
      console.log(`    ✅ Color variance: ${colorVariance.toFixed(2)}`);
      console.log(`    ${hasPatterns ? '❌' : '✅'} Patterns detected: ${hasPatterns}`);
      console.log(`    ${colorVariance < 15 && !hasPatterns ? '✅' : '❌'} Background uniform: ${colorVariance < 15 && !hasPatterns}`);
    }
    
    results.push({
      screenSize: size.name,
      resolution: `${size.width}x${size.height}`,
      screenshots: analysisResults,
      isUniform: analysisResults.every(r => r.isUniform)
    });
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(60));
  console.log('📊 BACKGROUND UNIFORMITY TEST RESULTS');
  console.log('='.repeat(60));
  
  let allPassed = true;
  
  results.forEach(result => {
    console.log(`\n🖥️  ${result.screenSize} (${result.resolution}):`);
    result.screenshots.forEach(screenshot => {
      const status = screenshot.isUniform ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${screenshot.position}: ${status} (Variance: ${screenshot.colorVariance.toFixed(2)}, Patterns: ${screenshot.hasPatterns})`);
    });
    
    const overallStatus = result.isUniform ? '✅ PASS' : '❌ FAIL';
    console.log(`   Overall: ${overallStatus}`);
    
    if (!result.isUniform) allPassed = false;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 FINAL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60));
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: allPassed,
      totalTests: results.length * 3, // 3 positions per screen size
      passedTests: results.filter(r => r.isUniform).length * 3
    },
    details: results
  };
  
  require('fs').writeFileSync(
    'background-uniformity-test-report.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: background-uniformity-test-report.json');
  
  await browser.close();
  return allPassed;
}

function calculateColorVariance(samples) {
  if (samples.length === 0) return Infinity;
  
  // Calculate mean color
  const mean = samples.reduce((acc, sample) => ({
    r: acc.r + sample.r / samples.length,
    g: acc.g + sample.g / samples.length,
    b: acc.b + sample.b / samples.length
  }), { r: 0, g: 0, b: 0 });
  
  // Calculate variance
  const variance = samples.reduce((acc, sample) => {
    const rDiff = sample.r - mean.r;
    const gDiff = sample.g - mean.g;
    const bDiff = sample.b - mean.b;
    return acc + Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }, 0) / samples.length;
  
  return variance;
}

function detectPatterns(samples) {
  if (samples.length < 10) return false;
  
  // Simple pattern detection: check for regular color variations
  // that would indicate grid-like or repeating patterns
  
  // Group samples by color ranges
  const colorGroups = {};
  samples.forEach(sample => {
    const key = `${Math.floor(sample.r / 20)}-${Math.floor(sample.g / 20)}-${Math.floor(sample.b / 20)}`;
    colorGroups[key] = (colorGroups[key] || 0) + 1;
  });
  
  // If we have many distinct color groups, likely has patterns
  const groupCount = Object.keys(colorGroups).length;
  return groupCount > 8; // Threshold for pattern detection
}

// Run the test
testBackgroundUniformity()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });