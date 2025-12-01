const { chromium } = require('playwright');

async function manualChartTest() {
  console.log('🚀 Starting Manual Enhanced Chart Test');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Navigate to test page
    console.log('📍 Step 1: Navigate to test page');
    await page.goto('http://localhost:3000/test-enhanced-chart');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-screenshots/01-initial-load.png' });
    console.log('✅ Initial page loaded');
    
    // Test 2: Check if charts are rendered
    console.log('📊 Step 2: Check if charts are rendered');
    const chartContainers = await page.locator('.chart-container-enhanced').count();
    console.log(`Found ${chartContainers} chart containers`);
    
    if (chartContainers > 0) {
      await page.screenshot({ path: 'test-screenshots/02-charts-rendered.png' });
      console.log('✅ Charts are rendered');
    }
    
    // Test 3: Test data scenarios manually
    console.log('🔄 Step 3: Test data scenarios');
    const scenarios = ['default', 'increasing', 'decreasing', 'volatile', 'flat', 'large'];
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const buttonText = scenario.charAt(0).toUpperCase() + scenario.slice(1);
      
      console.log(`  Testing ${scenario} scenario`);
      
      // Try different selector approaches
      try {
        // Method 1: Direct text selector
        await page.locator(`button:has-text("${buttonText}")`).first().click();
      } catch (e) {
        try {
          // Method 2: CSS selector with text content
          await page.locator(`button`, { hasText: buttonText }).first().click();
        } catch (e2) {
          try {
            // Method 3: XPath
            await page.locator(`xpath=//button[contains(text(), '${buttonText}')]`).first().click();
          } catch (e3) {
            console.log(`    ❌ Could not click ${buttonText} button`);
            continue;
          }
        }
      }
      
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `test-screenshots/03-scenario-${scenario}.png` });
      console.log(`    ✅ ${scenario} scenario tested`);
    }
    
    // Test 4: Check visual enhancements
    console.log('🎨 Step 4: Check visual enhancements');
    
    // Check for gradient
    const gradientCount = await page.locator('linearGradient').count();
    console.log(`Found ${gradientCount} gradient definitions`);
    
    // Check for filters (glow effects)
    const filterCount = await page.locator('filter').count();
    console.log(`Found ${filterCount} filter definitions`);
    
    // Check for area charts
    const areaCount = await page.locator('Area').count();
    console.log(`Found ${areaCount} area chart elements`);
    
    await page.screenshot({ path: 'test-screenshots/04-visual-enhancements.png' });
    console.log('✅ Visual enhancements checked');
    
    // Test 5: Responsive design
    console.log('📱 Step 5: Test responsive design');
    
    const viewports = [
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`  Testing ${viewport.name} viewport`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-screenshots/05-responsive-${viewport.name}.png` });
      console.log(`    ✅ ${viewport.name} viewport tested`);
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Test 6: Test empty state
    console.log('🔍 Step 6: Test empty state');
    await page.locator('text=Empty State Test').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/06-empty-state.png' });
    console.log('✅ Empty state tested');
    
    // Test 7: Test confluence integration
    console.log('🔗 Step 7: Test confluence page integration');
    await page.goto('http://localhost:3000/confluence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for data to load
    
    // Check if chart is present
    const confluenceChartCount = await page.locator('.chart-container-enhanced').count();
    console.log(`Found ${confluenceChartCount} charts on confluence page`);
    
    if (confluenceChartCount > 0) {
      await page.screenshot({ path: 'test-screenshots/07-confluence-integration.png' });
      console.log('✅ Confluence integration tested');
    }
    
    // Test 8: Check for errors
    console.log('🐛 Step 8: Check for console errors');
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Navigate back to test page to catch any errors
    await page.goto('http://localhost:3000/test-enhanced-chart');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`Found ${errors.length} console errors`);
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`  Error ${index + 1}: ${error}`);
      });
    }
    
    console.log('✅ Error checking completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Manual chart testing completed!');
}

manualChartTest().catch(console.error);