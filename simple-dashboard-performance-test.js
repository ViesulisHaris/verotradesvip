// Simple Dashboard Performance Test
// Focus on measuring dashboard load time accurately

const puppeteer = require('puppeteer');

async function measureDashboardLoadTime() {
  console.log('🚀 Starting Simple Dashboard Performance Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const metrics = {
    loginStartTime: 0,
    loginCompleteTime: 0,
    dashboardStartTime: 0,
    dashboardCompleteTime: 0,
    totalLoadTime: 0,
    dashboardLoadTime: 0
  };

  try {
    console.log('📍 Step 1: Navigate to login page...');
    await page.goto('http://localhost:3001/login', {
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('📍 Step 2: Fill and submit login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'testuser1000@verotrade.com');
    await page.type('input[type="password"]', 'Test123456!');

    metrics.loginStartTime = Date.now();
    
    // Submit login and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    metrics.loginCompleteTime = Date.now();
    metrics.dashboardStartTime = metrics.loginCompleteTime;
    
    console.log(`✅ Login completed in ${metrics.loginCompleteTime - metrics.loginStartTime}ms`);

    console.log('📍 Step 3: Wait for dashboard to fully load...');
    
    // Wait for dashboard content with multiple fallbacks
    try {
      // Try to wait for dashboard title
      await page.waitForFunction(() => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent && h1.textContent.includes('Trading Dashboard');
      }, { timeout: 20000 });
      
      console.log('✅ Dashboard title found');
    } catch (error) {
      console.log('⚠️ Dashboard title not found, trying alternative selectors...');
      
      // Fallback: Wait for any dashboard content
      try {
        await page.waitForSelector('[style*="backgroundColor: #1c1c1c"]', { timeout: 10000 });
        console.log('✅ Dashboard cards found');
      } catch (error2) {
        console.log('⚠️ Dashboard cards not found, waiting for timeout...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Additional wait for any remaining async operations
    await new Promise(resolve => setTimeout(resolve, 3000));

    metrics.dashboardCompleteTime = Date.now();
    metrics.dashboardLoadTime = metrics.dashboardCompleteTime - metrics.dashboardStartTime;
    metrics.totalLoadTime = metrics.dashboardCompleteTime - metrics.loginStartTime;

    console.log('\n📊 PERFORMANCE RESULTS');
    console.log('=' .repeat(40));
    console.log(`📍 Login Time: ${metrics.loginCompleteTime - metrics.loginStartTime}ms`);
    console.log(`📍 Dashboard Load Time: ${metrics.dashboardLoadTime}ms`);
    console.log(`📍 Total Load Time: ${metrics.totalLoadTime}ms`);
    console.log(`🎯 Target: <3000ms | Status: ${metrics.dashboardLoadTime < 3000 ? 'PASS' : 'FAIL'}`);

    // Take screenshot for verification
    const screenshotPath = `dashboard-screenshot-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Get page title and URL for verification
    const title = await page.title();
    const url = page.url();
    console.log(`📍 Final URL: ${url}`);
    console.log(`📍 Page Title: ${title}`);

    return metrics;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    metrics.error = error.message;
    return metrics;
  } finally {
    await browser.close();
  }
}

// Run the test
measureDashboardLoadTime()
  .then((results) => {
    console.log('\n✅ Dashboard Performance Test Completed');
    if (results.dashboardLoadTime) {
      console.log(`🎯 Dashboard Load Time: ${results.dashboardLoadTime}ms`);
      console.log(`🎯 Performance Target: <3000ms`);
      console.log(`🎯 Status: ${results.dashboardLoadTime < 3000 ? 'PASS ✅' : 'FAIL ❌'}`);
      
      if (results.dashboardLoadTime >= 3000) {
        console.log('\n⚠️ PERFORMANCE ISSUES IDENTIFIED:');
        console.log('• Dashboard load time exceeds 3000ms target');
        console.log('• Need to optimize component loading');
        console.log('• Need to optimize data fetching');
        console.log('• Need to implement lazy loading');
      }
    }
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
  });