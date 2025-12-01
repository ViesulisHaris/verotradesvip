// Comprehensive Dashboard Performance Test
// Measures actual authenticated dashboard load time with full user flow

const puppeteer = require('puppeteer');

async function measureAuthenticatedDashboardLoad() {
  console.log('🚀 Starting Comprehensive Dashboard Performance Test...');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const metrics = {
    testStartTime: Date.now(),
    loginPageLoad: 0,
    loginSubmit: 0,
    dashboardRedirect: 0,
    dashboardContentLoad: 0,
    dashboardFullyLoaded: 0,
    totalTestTime: 0
  };

  try {
    console.log('📍 Step 1: Navigate to login page...');
    const loginStartTime = Date.now();
    
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    metrics.loginPageLoad = Date.now() - loginStartTime;
    console.log(`✅ Login page loaded in ${metrics.loginPageLoad}ms`);

    console.log('📍 Step 2: Fill and submit login form...');
    
    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill login form
    await page.type('input[type="email"]', 'testuser1000@verotrade.com', { delay: 50 });
    await page.type('input[type="password"]', 'Test123456!', { delay: 50 });
    
    // Measure login submission time
    const loginSubmitTime = Date.now();
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    metrics.loginSubmit = Date.now() - loginSubmitTime;
    metrics.dashboardRedirect = Date.now() - loginSubmitTime;
    
    console.log(`✅ Login submitted and redirected in ${metrics.loginSubmit}ms`);
    
    // Check if we're on dashboard or still on login (error)
    const currentUrl = page.url();
    console.log(`🔍 Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
      
      console.log('📍 Step 3: Measuring dashboard load performance...');
      
      // Wait for dashboard content to be visible
      const dashboardContentStart = Date.now();
      
      try {
        // Wait for key dashboard elements to load
        await page.waitForSelector('[data-testid="dashboard-content"], .dashboard-content, main, .main-content', { timeout: 10000 });
      } catch (error) {
        console.log('⚠️  Dashboard content selector not found, waiting for fallback elements...');
        await page.waitForSelector('h1, .title, .header', { timeout: 5000 });
      }
      
      metrics.dashboardContentLoad = Date.now() - dashboardContentStart;
      console.log(`✅ Dashboard content loaded in ${metrics.dashboardContentLoad}ms`);
      
      // Wait for full dashboard interactivity (all components loaded)
      const dashboardFullyLoadedStart = Date.now();
      
      try {
        // Wait for data loading to complete (no loading spinners)
        await page.waitForFunction(() => {
          const loadingElements = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
          return loadingElements.length === 0;
        }, { timeout: 8000 });
      } catch (error) {
        console.log('⚠️  Could not detect loading state completion, using timeout fallback');
        // Wait additional time for components to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      metrics.dashboardFullyLoaded = Date.now() - dashboardFullyLoadedStart;
      console.log(`✅ Dashboard fully interactive in ${metrics.dashboardFullyLoaded}ms`);
      
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Login failed - still on login page');
      
      // Check for error messages
      try {
        const errorElement = await page.$('.error-message, .alert, [role="alert"]');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log(`❌ Login error: ${errorText}`);
        }
      } catch (error) {
        console.log('❌ Could not determine login error');
      }
    } else {
      console.log(`❌ Unexpected redirect to: ${currentUrl}`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    metrics.totalTestTime = Date.now() - metrics.testStartTime;
    
    // Performance Summary
    console.log('='.repeat(60));
    console.log('📊 COMPREHENSIVE PERFORMANCE RESULTS');
    console.log('='.repeat(60));
    console.log(`Login Page Load: ${metrics.loginPageLoad}ms`);
    console.log(`Login Submission: ${metrics.loginSubmit}ms`);
    console.log(`Dashboard Redirect: ${metrics.dashboardRedirect}ms`);
    console.log(`Dashboard Content Load: ${metrics.dashboardContentLoad}ms`);
    console.log(`Dashboard Fully Interactive: ${metrics.dashboardFullyLoaded}ms`);
    console.log(`Total Test Time: ${metrics.totalTestTime}ms`);
    
    // Performance Analysis
    console.log('='.repeat(60));
    console.log('🔍 PERFORMANCE ANALYSIS');
    console.log('='.repeat(60));
    
    const targetLoadTime = 3000; // 3 seconds target
    const actualDashboardLoad = metrics.dashboardContentLoad || metrics.dashboardFullyLoaded;
    
    if (actualDashboardLoad <= targetLoadTime) {
      console.log(`✅ SUCCESS: Dashboard loads in ${actualDashboardLoad}ms (target: <${targetLoadTime}ms)`);
      console.log('🎯 Performance target achieved!');
    } else {
      const improvementNeeded = actualDashboardLoad - targetLoadTime;
      const improvementPercent = (improvementNeeded / actualDashboardLoad * 100).toFixed(1);
      console.log(`⚠️  Dashboard loads in ${actualDashboardLoad}ms (target: <${targetLoadTime}ms)`);
      console.log(`📈 Needs ${improvementNeeded}ms improvement (${improvementPercent}% faster)`);
    }
    
    // Bottleneck Analysis
    console.log('='.repeat(60));
    console.log('🔧 BOTTLENECK ANALYSIS');
    console.log('='.repeat(60));
    
    if (metrics.loginPageLoad > 3000) {
      console.log(`🐌 Login page is slow: ${metrics.loginPageLoad}ms`);
    }
    
    if (metrics.loginSubmit > 5000) {
      console.log(`🔐 Authentication is slow: ${metrics.loginSubmit}ms`);
    }
    
    if (metrics.dashboardContentLoad > 3000) {
      console.log(`📊 Dashboard content loading is slow: ${metrics.dashboardContentLoad}ms`);
    }
    
    if (metrics.dashboardFullyLoaded > 5000) {
      console.log(`⚡ Dashboard interactivity is slow: ${metrics.dashboardFullyLoaded}ms`);
    }
    
    await browser.close();
  }
}

// Run the test
measureAuthenticatedDashboardLoad().catch(console.error);