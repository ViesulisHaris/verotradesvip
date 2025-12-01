const puppeteer = require('puppeteer');

async function testBackgroundVisually() {
  console.log('🧪 Starting Simple Background Visual Test...');
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshots at different scroll positions
    const positions = ['top', 'middle', 'bottom'];
    const positionResults = [];
    
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      
      if (position === 'top') {
        await page.evaluate(() => window.scrollTo(0, 0));
      } else if (position === 'middle') {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      } else if (position === 'bottom') {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const screenshotPath = `background-test-${size.name.toLowerCase()}-${position}.png`;
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: false 
      });
      
      console.log(`  📸 Screenshot saved: ${screenshotPath}`);
      
      // Simple visual check - ask user to verify
      console.log(`  👀 Please check ${screenshotPath} for:`);
      console.log(`     - No visible patterns (grids, dots, textures)`);
      console.log(`     - Uniform color gradient`);
      console.log(`     - Smooth blur effect`);
      console.log(`     - Consistent with other positions`);
      
      positionResults.push({
        position,
        screenshotPath,
        requiresManualCheck: true
      });
    }
    
    results.push({
      screenSize: size.name,
      resolution: `${size.width}x${size.height}`,
      positions: positionResults
    });
  }
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 BACKGROUND VISUAL TEST RESULTS');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n🖥️  ${result.screenSize} (${result.resolution}):`);
    result.positions.forEach(pos => {
      console.log(`   ${pos.position}: 📸 ${pos.screenshotPath}`);
      console.log(`   Manual verification required`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 MANUAL VERIFICATION INSTRUCTIONS:');
  console.log('='.repeat(60));
  console.log('1. Check all screenshots for uniform background');
  console.log('2. Verify no patterns are visible (grids, dots, textures)');
  console.log('3. Ensure consistent appearance across all screen sizes');
  console.log('4. Confirm blur effect is working properly');
  console.log('5. Check that small cards and large areas have same background treatment');
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalScreenshots: results.length * 3,
      requiresManualVerification: true
    },
    details: results
  };
  
  require('fs').writeFileSync(
    'simple-background-test-report.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Report saved to: simple-background-test-report.json');
  console.log('\n✅ Test completed. Please manually verify the screenshots.');
  
  await browser.close();
  return true;
}

// Run the test
testBackgroundVisually()
  .then(() => {
    console.log('\n🎉 Background visual test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });