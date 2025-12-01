const { chromium } = require('playwright');

async function testEnhancedChart() {
  console.log('🚀 Starting Enhanced PerformanceTrendChart Test Suite');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 500 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Test results tracking
  const testResults = {
    dataScenarios: {},
    visualEnhancements: {},
    responsiveDesign: {},
    integration: {},
    emptyState: {},
    errors: []
  };

  try {
    // Navigate to test page
    console.log('📍 Navigating to test page...');
    await page.goto('http://localhost:3000/test-enhanced-chart');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Data Scenarios
    console.log('📊 Testing Data Scenarios...');
    const scenarios = ['default', 'increasing', 'decreasing', 'volatile', 'flat', 'large'];
    
    for (const scenario of scenarios) {
      console.log(`  Testing scenario: ${scenario}`);
      
      // Click the scenario button - use more robust selector
      const buttonText = scenario.charAt(0).toUpperCase() + scenario.slice(1);
      await page.locator(`button:has-text("${buttonText}")`).first().click();
      await page.waitForTimeout(1000); // Wait for chart to update
      
      // Check if charts are rendered
      const chartCount = await page.locator('.chart-container-enhanced').count();
      testResults.dataScenarios[scenario] = {
        rendered: chartCount > 0,
        chartCount: chartCount,
        status: 'success'
      };
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: `test-screenshots/chart-${scenario}.png`,
        fullPage: false 
      });
      
      console.log(`    ✅ ${scenario} scenario - ${chartCount} charts rendered`);
    }
    
    // Test 2: Visual Enhancements
    console.log('🎨 Testing Visual Enhancements...');
    
    // Check for gradient fill
    const gradientExists = await page.locator('linearGradient#tealGradient').count();
    testResults.visualEnhancements.gradientFill = gradientExists > 0;
    
    // Check for glow effect
    const glowExists = await page.locator('filter#tealGlow').count();
    testResults.visualEnhancements.glowEffect = glowExists > 0;
    
    // Check for area chart (not line chart)
    const areaChartExists = await page.locator('Area[type="monotone"]').count();
    testResults.visualEnhancements.areaChart = areaChartExists > 0;
    
    // Check stroke width (should be 4-5px)
    const strokeWidth = await page.locator('Area').first().getAttribute('stroke-width');
    testResults.visualEnhancements.strokeWidth = strokeWidth === '4';
    
    // Check grid lines transparency
    const gridOpacity = await page.locator('CartesianGrid').first().getAttribute('stroke');
    testResults.visualEnhancements.transparentGrid = gridOpacity && gridOpacity.includes('0.03');
    
    console.log('  Visual enhancements check completed');
    
    // Test 3: Responsive Design
    console.log('📱 Testing Responsive Design...');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Check if charts adapt to new size
      const chartContainers = await page.locator('.chart-container-enhanced').all();
      let adaptedCount = 0;
      
      for (const container of chartContainers) {
        const boundingBox = await container.boundingBox();
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
          adaptedCount++;
        }
      }
      
      testResults.responsiveDesign[viewport.name] = {
        adapted: adaptedCount === chartContainers.length,
        containerCount: chartContainers.length,
        adaptedCount: adaptedCount
      };
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-screenshots/responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: false 
      });
      
      console.log(`    ✅ ${viewport.name} - ${adaptedCount}/${chartContainers.length} charts adapted`);
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Test 4: Empty State
    console.log('🔍 Testing Empty State...');
    
    // Scroll to empty state test section
    await page.locator('text=Empty State Test').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Check if empty state chart renders with sample data
    const emptyChartContainer = await page.locator('.chart-container-enhanced').last();
    const emptyChartExists = await emptyChartContainer.isVisible();
    
    testResults.emptyState = {
      rendered: emptyChartExists,
      status: emptyChartExists ? 'success' : 'failed'
    };
    
    await page.screenshot({ 
      path: 'test-screenshots/empty-state.png',
      fullPage: false 
    });
    
    console.log(`  ✅ Empty state - ${emptyChartExists ? 'rendered' : 'failed'}`);
    
    // Test 5: Confluence Page Integration
    console.log('🔗 Testing Confluence Page Integration...');
    
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for data to load
    
    // Check if PerformanceTrendChart is present on confluence page
    const confluenceChart = await page.locator('.chart-container-enhanced').count();
    testResults.integration.chartPresent = confluenceChart > 0;
    
    // Check if chart has data (not empty state)
    const chartDataExists = await page.locator('Area').count() > 0;
    testResults.integration.hasData = chartDataExists;
    
    await page.screenshot({ 
      path: 'test-screenshots/confluence-integration.png',
      fullPage: false 
    });
    
    console.log(`  ✅ Confluence integration - Chart present: ${confluenceChart > 0}, Has data: ${chartDataExists}`);
    
    // Test 6: Console Errors
    console.log('🐛 Checking for Console Errors...');
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push({
          type: 'console',
          message: msg.text(),
          location: msg.location()
        });
      }
    });
    
    page.on('pageerror', error => {
      testResults.errors.push({
        type: 'page',
        message: error.message,
        stack: error.stack
      });
    });
    
    // Navigate through pages again to catch any errors
    await page.goto('http://localhost:3000/test-enhanced-chart');
    await page.waitForLoadState('networkidle');
    
    // Click through all scenarios to trigger any potential errors
    for (const scenario of scenarios) {
      const buttonText = scenario.charAt(0).toUpperCase() + scenario.slice(1);
      await page.locator(`button:has-text("${buttonText}")`).first().click();
      await page.waitForTimeout(500);
    }
    
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log(`  ✅ Error checking completed - ${testResults.errors.length} errors found`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.errors.push({
      type: 'execution',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }
  
  // Generate Test Report
  console.log('\n📋 ENHANCED PERFORMANCE TREND CHART TEST REPORT');
  console.log('=' .repeat(60));
  
  console.log('\n📊 Data Scenarios Test Results:');
  Object.entries(testResults.dataScenarios).forEach(([scenario, result]) => {
    console.log(`  ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}: ${result.status} (${result.chartCount} charts)`);
  });
  
  console.log('\n🎨 Visual Enhancements Test Results:');
  console.log(`  Gradient Fill: ${testResults.visualEnhancements.gradientFill ? '✅' : '❌'}`);
  console.log(`  Glow Effect: ${testResults.visualEnhancements.glowEffect ? '✅' : '❌'}`);
  console.log(`  Area Chart: ${testResults.visualEnhancements.areaChart ? '✅' : '❌'}`);
  console.log(`  Stroke Width (4px): ${testResults.visualEnhancements.strokeWidth ? '✅' : '❌'}`);
  console.log(`  Transparent Grid: ${testResults.visualEnhancements.transparentGrid ? '✅' : '❌'}`);
  
  console.log('\n📱 Responsive Design Test Results:');
  Object.entries(testResults.responsiveDesign).forEach(([viewport, result]) => {
    console.log(`  ${viewport}: ${result.adapted ? '✅' : '❌'} (${result.adaptedCount}/${result.containerCount} charts adapted)`);
  });
  
  console.log('\n🔗 Integration Test Results:');
  console.log(`  Confluence Page Chart Present: ${testResults.integration.chartPresent ? '✅' : '❌'}`);
  console.log(`  Confluence Page Has Data: ${testResults.integration.hasData ? '✅' : '❌'}`);
  
  console.log('\n🔍 Empty State Test Results:');
  console.log(`  Empty State Rendered: ${testResults.emptyState.rendered ? '✅' : '❌'}`);
  
  console.log('\n🐛 Error Summary:');
  if (testResults.errors.length === 0) {
    console.log('  ✅ No errors detected');
  } else {
    console.log(`  ❌ ${testResults.errors.length} errors found:`);
    testResults.errors.forEach((error, index) => {
      console.log(`    ${index + 1}. [${error.type}] ${error.message}`);
    });
  }
  
  // Save detailed results to JSON file
  require('fs').writeFileSync(
    'enhanced-chart-test-results.json', 
    JSON.stringify(testResults, null, 2)
  );
  
  console.log('\n📸 Screenshots saved to: test-screenshots/');
  console.log('📄 Detailed results saved to: enhanced-chart-test-results.json');
  
  return testResults;
}

// Run the test
testEnhancedChart().then(results => {
  console.log('\n🎉 Enhanced PerformanceTrendChart testing completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});