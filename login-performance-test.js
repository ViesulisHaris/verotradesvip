const puppeteer = require('puppeteer');

async function measureLoginPerformance() {
  console.log('🚀 Starting Login Page Performance Test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  // Navigate to login page and measure load time
  console.log('📊 Navigating to login page...');
  const startTime = Date.now();
  
  try {
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Login page loaded in: ${loadTime}ms`);
    
    // Wait for auth initialization
    await page.waitForTimeout(2000);
    
    // Check if login form is visible
    const loginForm = await page.$('.login-form');
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('#password');
    
    console.log('🔍 Login form elements found:', {
      form: !!loginForm,
      email: !!emailInput,
      password: !!passwordInput
    });
    
    // Measure performance metrics
    const metrics = await page.metrics();
    console.log('📊 Performance Metrics:', {
      'Layout Duration': metrics.LayoutDuration.toFixed(2) + 'ms',
      'Recalc Style Duration': metrics.RecalcStyleDuration.toFixed(2) + 'ms',
      'Script Duration': metrics.ScriptDuration.toFixed(2) + 'ms',
      'Task Duration': metrics.TaskDuration.toFixed(2) + 'ms'
    });
    
    // Get console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('[PERF]') || msg.text().includes('[AuthContext]')) {
        console.log('🔧 Browser Console:', msg.text());
      }
    });
    
    // Check for any loading states
    const loadingElements = await page.$$('div[style*="spin"]');
    console.log('🔄 Loading elements found:', loadingElements.length);
    
    // Get network requests count
    const performanceEntries = JSON.parse(
      await page.evaluate(() => JSON.stringify(performance.getEntries()))
    );
    
    const resourceCount = performanceEntries.filter(entry => 
      entry.initiatorType === 'script' || 
      entry.initiatorType === 'stylesheet' || 
      entry.initiatorType === 'fetch'
    ).length;
    
    console.log('📡 Network requests:', resourceCount);
    
    // Performance assessment
    let performanceGrade = 'EXCELLENT';
    let recommendations = [];
    
    if (loadTime > 3000) {
      performanceGrade = 'POOR';
      recommendations.push('Load time exceeds 3 seconds target');
    } else if (loadTime > 2000) {
      performanceGrade = 'FAIR';
      recommendations.push('Load time could be improved further');
    } else if (loadTime > 1000) {
      performanceGrade = 'GOOD';
      recommendations.push('Load time is acceptable');
    }
    
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('================================');
    console.log(`Load Time: ${loadTime}ms`);
    console.log(`Grade: ${performanceGrade}`);
    console.log(`Network Requests: ${resourceCount}`);
    console.log(`Loading Elements: ${loadingElements.length}`);
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'login-performance-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: login-performance-test.png');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
measureLoginPerformance().catch(console.error);