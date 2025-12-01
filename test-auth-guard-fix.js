const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('🔍 Testing AuthGuard fix...');
    
    // Test 1: Access dashboard without authentication
    console.log('\n📋 Test 1: Accessing dashboard without authentication...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to login or if AuthGuard is handling it properly
    const url = page.url();
    console.log(`Current URL after accessing dashboard: ${url}`);
    
    if (url.includes('/login')) {
      console.log('✅ Test 1 PASSED: Redirected to login page as expected');
    } else if (url.includes('/dashboard')) {
      console.log('⚠️  Test 1 WARNING: Still on dashboard page (might be showing loading state)');
      
      // Check if there's a loading indicator
      const loadingIndicator = await page.$('[data-testid="loading"], .loading, .spinner');
      if (loadingIndicator) {
        console.log('✅ Loading state detected - AuthGuard is working');
      } else {
        console.log('❌ Test 1 FAILED: No loading state or redirect detected');
      }
    } else {
      console.log(`❌ Test 1 FAILED: Unexpected redirect to ${url}`);
    }
    
    // Test 2: Check for infinite loops
    console.log('\n📋 Test 2: Checking for infinite loops...');
    let redirectCount = 0;
    let lastUrl = url;
    
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      
      if (currentUrl !== lastUrl) {
        redirectCount++;
        console.log(`Redirect detected: ${lastUrl} -> ${currentUrl}`);
        lastUrl = currentUrl;
      }
    }
    
    if (redirectCount > 2) {
      console.log(`❌ Test 2 FAILED: Too many redirects detected (${redirectCount})`);
    } else {
      console.log(`✅ Test 2 PASSED: No infinite loops detected (${redirectCount} redirects)`);
    }
    
    // Test 3: Access login page directly
    console.log('\n📋 Test 3: Accessing login page directly...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      console.log('✅ Test 3 PASSED: Login page accessible');
    } else {
      console.log(`❌ Test 3 FAILED: Login page not accessible (redirected to ${loginUrl})`);
    }
    
    console.log('\n🎯 AuthGuard fix testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
})();