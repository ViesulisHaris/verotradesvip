const { chromium } = require('playwright');

async function runGraphTransparencyTest() {
  console.log('🔍 Starting Graph Background Transparency Test...');
  console.log('🎯 Testing if all graph components have transparent backgrounds');
  console.log('🌊 Verifying seamless integration with Balatro background');

  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Test 1: Check if charts have transparent backgrounds
    console.log('🧪 Test 1: Checking chart background transparency...');
    
    const chartComponents = [
      '.chart-container-enhanced',
      '.chart-container',
      '[class*="chart"]',
      '.recharts-wrapper',
      '.recharts-surface'
    ];
    
    const transparencyResults = [];
    
    for (const selector of chartComponents) {
      try {
        const elements = await page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const computedStyle = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              backgroundColor: style.backgroundColor,
              backgroundImage: style.backgroundImage,
              opacity: style.opacity
            };
          });
          
          const isTransparent = computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                              computedStyle.backgroundColor === 'transparent' ||
                              computedStyle.opacity === '0';
          
          transparencyResults.push({
            selector,
            elementIndex: i,
            backgroundColor: computedStyle.backgroundColor,
            backgroundImage: computedStyle.backgroundImage,
            opacity: computedStyle.opacity,
            isTransparent
          });
          
          console.log(`   ${selector}[${i}]: ${computedStyle.backgroundColor} (${isTransparent ? '✅ Transparent' : '❌ Not Transparent'})`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error checking ${selector}: ${error.message}`);
      }
    }
    
    // Test 2: Check if Balatro background is visible through charts
    console.log('🌊 Test 2: Checking Balatro background visibility...');
    
    // Take screenshots at different positions to verify background visibility
    const screenshots = [];
    
    for (let i = 0; i < 5; i++) {
      // Scroll to different parts of the page
      await page.evaluate(() => {
        window.scrollTo(0, i * 200);
      });
      
      await page.waitForTimeout(1000);
      
      const screenshot = await page.screenshot({
        fullPage: false,
        clip: { x: 100, y: 100 + (i * 200), width: 400, height: 300 }
      });
      
      screenshots.push({
        position: i,
        screenshot: screenshot.toString('base64')
      });
      
      console.log(`   Screenshot ${i + 1}/5 taken at position ${i * 200}px`);
    }
    
    // Test 3: Verify no visual conflicts between charts and background
    console.log('🎨 Test 3: Checking for visual conflicts...');
    
    const conflictChecks = await page.evaluate(() => {
      const charts = document.querySelectorAll('[class*="chart"], .chart-container-enhanced, .chart-container');
      const conflicts = [];
      
      charts.forEach((chart, index) => {
        const rect = chart.getBoundingClientRect();
        const style = window.getComputedStyle(chart);
        
        // Check for conflicting backgrounds
        const hasConflict = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                          style.backgroundColor !== 'transparent' &&
                          !style.backgroundColor.includes('rgba(0, 0, 0, 0)');
        
        if (hasConflict) {
          conflicts.push({
            index,
            className: chart.className,
            backgroundColor: style.backgroundColor,
            position: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height
            }
          });
        }
      });
      
      return conflicts;
    });
    
    console.log(`   Found ${conflictChecks.length} charts with background conflicts`);
    conflictChecks.forEach(conflict => {
      console.log(`   ❌ Chart ${conflict.index}: ${conflict.backgroundColor} at (${conflict.position.x}, ${conflict.position.y})`);
    });
    
    // Test 4: Check overall visual consistency
    console.log('📊 Test 4: Checking overall visual consistency...');
    
    const overallCheck = await page.evaluate(() => {
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      
      // Check if body has transparent background
      const bodyTransparent = bodyStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                           bodyStyle.backgroundColor === 'transparent';
      
      // Check for Balatro container
      const balatroContainer = document.querySelector('.balatro-container');
      const balatroExists = !!balatroContainer;
      
      // Check if charts are properly layered
      const charts = document.querySelectorAll('[class*="chart"], .chart-container-enhanced, .chart-container');
      const chartsHaveZIndex = Array.from(charts).every(chart => {
        const style = window.getComputedStyle(chart);
        return style.zIndex !== 'auto';
      });
      
      return {
        bodyTransparent,
        balatroExists,
        totalCharts: charts.length,
        chartsHaveZIndex
      };
    });
    
    console.log(`   Body transparent: ${overallCheck.bodyTransparent ? '✅' : '❌'}`);
    console.log(`   Balatro container exists: ${overallCheck.balatroExists ? '✅' : '❌'}`);
    console.log(`   Total charts found: ${overallCheck.totalCharts}`);
    console.log(`   Charts have proper z-index: ${overallCheck.chartsHaveZIndex ? '✅' : '❌'}`);
    
    // Compile results
    const testResults = {
      timestamp: new Date().toISOString(),
      transparencyResults,
      screenshots,
      conflictChecks,
      overallCheck,
      summary: {
        totalChartsChecked: transparencyResults.length,
        transparentCharts: transparencyResults.filter(r => r.isTransparent).length,
        chartsWithConflicts: conflictChecks.length,
        bodyTransparent: overallCheck.bodyTransparent,
        balatroExists: overallCheck.balatroExists,
        allTestsPassed: (
          transparencyResults.filter(r => r.isTransparent).length === transparencyResults.length &&
          conflictChecks.length === 0 &&
          overallCheck.bodyTransparent &&
          overallCheck.balatroExists
        )
      }
    };
    
    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log(`   Total charts checked: ${testResults.summary.totalChartsChecked}`);
    console.log(`   Charts with transparent backgrounds: ${testResults.summary.transparentCharts}`);
    console.log(`   Charts with background conflicts: ${testResults.summary.chartsWithConflicts}`);
    console.log(`   Body has transparent background: ${testResults.summary.bodyTransparent ? '✅' : '❌'}`);
    console.log(`   Balatro component exists: ${testResults.summary.balatroExists ? '✅' : '❌'}`);
    console.log(`   All tests passed: ${testResults.summary.allTestsPassed ? '✅' : '❌'}`);
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(
      'graph-background-transparency-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n💾 Results saved to: graph-background-transparency-test-results.json');
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
runGraphTransparency().catch(console.error);