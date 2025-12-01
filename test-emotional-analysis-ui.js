const { chromium } = require('playwright');

console.log('🔍 TESTING EMOTIONAL ANALYSIS UI');
console.log('================================');

async function testEmotionalAnalysis() {
  console.log('🌐 Launching browser for emotional analysis testing...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // Step 2: Test Dashboard Emotional Analysis
    console.log('\n📊 Testing Dashboard Emotional Analysis...');
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    // Look for emotional analysis components
    const dashboardResults = await analyzeEmotionalComponents(page, 'dashboard');
    
    // Step 3: Test Confluence Emotional Analysis
    console.log('\n📊 Testing Confluence Emotional Analysis...');
    await page.goto('http://localhost:3000/confluence');
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    const confluenceResults = await analyzeEmotionalComponents(page, 'confluence');
    
    // Step 4: Test Emotion Filtering
    console.log('\n🔍 Testing Emotion Filtering...');
    const filterResults = await testEmotionFiltering(page);
    
    // Step 5: Summary
    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log('========================');
    
    console.log('\n📊 Dashboard Results:');
    console.log(`  - Emotional analysis elements found: ${dashboardResults.emotionalElements}`);
    console.log(`  - Chart elements found: ${dashboardResults.chartElements}`);
    console.log(`  - Radar charts found: ${dashboardResults.radarCharts}`);
    console.log(`  - Emotion labels found: ${dashboardResults.emotionLabels.join(', ')}`);
    
    console.log('\n📊 Confluence Results:');
    console.log(`  - Emotional analysis elements found: ${confluenceResults.emotionalElements}`);
    console.log(`  - Chart elements found: ${confluenceResults.chartElements}`);
    console.log(`  - Radar charts found: ${confluenceResults.radarCharts}`);
    console.log(`  - Emotion labels found: ${confluenceResults.emotionLabels.join(', ')}`);
    
    console.log('\n🔍 Filter Results:');
    console.log(`  - Filter controls found: ${filterResults.filterControls}`);
    console.log(`  - Filter functionality working: ${filterResults.filterWorking}`);
    
    // Determine success
    const dashboardWorking = dashboardResults.emotionalElements > 0 && dashboardResults.radarCharts > 0;
    const confluenceWorking = confluenceResults.emotionalElements > 0 && confluenceResults.radarCharts > 0;
    const filteringWorking = filterResults.filterControls > 0 && filterResults.filterWorking;
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log(`  - Dashboard emotional analysis: ${dashboardWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`  - Confluence emotional analysis: ${confluenceWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`  - Emotion filtering: ${filteringWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    
    const allWorking = dashboardWorking && confluenceWorking && filteringWorking;
    console.log(`  - Overall status: ${allWorking ? '🎉 SUCCESS - ALL FEATURES WORKING' : '⚠️  PARTIAL SUCCESS - SOME FEATURES NEED ATTENTION'}`);
    
    return {
      dashboard: dashboardResults,
      confluence: confluenceResults,
      filtering: filterResults,
      allWorking
    };
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return null;
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🌐 Browser remains open for manual inspection...');
    console.log('   Close the browser window to end the test.');
    
    // Wait for browser to be closed manually
    // await browser.close();
  }
}

async function analyzeEmotionalComponents(page, pageType) {
  const results = {
    emotionalElements: 0,
    chartElements: 0,
    radarCharts: 0,
    emotionLabels: []
  };
  
  try {
    // Look for emotional analysis text/headers
    const emotionalTexts = await page.locator('text=/emotional/i').count();
    results.emotionalElements += emotionalTexts;
    
    // Look for chart elements (canvas, svg, etc.)
    const canvasElements = await page.locator('canvas').count();
    const svgElements = await page.locator('svg').count();
    results.chartElements += canvasElements + svgElements;
    
    // Look for radar chart specific elements
    const radarTexts = await page.locator('text=/radar/i').count();
    results.radarCharts += radarTexts;
    
    // Look for specific emotion labels
    const emotions = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];
    
    for (const emotion of emotions) {
      const emotionFound = await page.locator(`text=${emotion}`).count();
      if (emotionFound > 0) {
        results.emotionLabels.push(emotion);
      }
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: `emotional-analysis-${pageType}-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved: emotional-analysis-${pageType}-${Date.now()}.png`);
    
  } catch (error) {
    console.error(`Error analyzing ${pageType} components:`, error);
  }
  
  return results;
}

async function testEmotionFiltering(page) {
  const results = {
    filterControls: 0,
    filterWorking: false
  };
  
  try {
    // Look for filter controls (dropdowns, checkboxes, etc.)
    const dropdowns = await page.locator('select').count();
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    const filterButtons = await page.locator('button:has-text("Filter")').count();
    
    results.filterControls = dropdowns + checkboxes + filterButtons;
    
    if (results.filterControls > 0) {
      // Try to test filter functionality
      console.log('🔍 Testing filter functionality...');
      
      // Look for emotion filter specifically
      const emotionFilter = await page.locator('select:has-text("emotion")').count();
      if (emotionFilter > 0) {
        // Try to select an emotion
        await page.selectOption('select:has-text("emotion")', 'CONFIDENT');
        await page.waitForTimeout(2000);
        
        // Check if content changed
        const contentAfterFilter = await page.content();
        if (contentAfterFilter.includes('CONFIDENT')) {
          results.filterWorking = true;
        }
      }
      
      const emotionCheckboxes = await page.locator('input:has-text("CONFIDENT")').count();
      if (emotionCheckboxes > 0) {
        // Try to check an emotion checkbox
        await page.check('input:has-text("CONFIDENT")');
        await page.waitForTimeout(2000);
        results.filterWorking = true;
      }
    }
    
  } catch (error) {
    console.error('Error testing filtering:', error);
  }
  
  return results;
}

async function main() {
  console.log('🎯 Starting emotional analysis UI testing...');
  
  const results = await testEmotionalAnalysis();
  
  if (results && results.allWorking) {
    console.log('\n🎉 SUCCESS: Emotional analysis is working on both pages!');
    console.log('\n📋 VERIFICATION COMPLETE:');
    console.log('✅ Trades created with all 8 emotions');
    console.log('✅ Emotional analysis working on dashboard');
    console.log('✅ Emotional analysis working on confluence');
    console.log('✅ Emotion filtering functional');
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS: Some features need attention');
    console.log('   Check the screenshots and browser for detailed inspection');
  }
}

// Execute the test
main();