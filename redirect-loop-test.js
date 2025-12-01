/**
 * Simple Redirect Loop Test
 * Tests that there are no infinite redirect loops in the authentication routing
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testRedirectLoops() {
  console.log('🔍 Starting Redirect Loop Test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Track navigation events to detect redirect loops
    let navigationCount = 0;
    const maxNavigations = 10;
    const navigationUrls = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('localhost:3000') && !url.includes('_next') && !url.includes('favicon')) {
        navigationCount++;
        navigationUrls.push(url);
        console.log(`🔄 Navigation ${navigationCount}: ${url}`);
        
        if (navigationCount > maxNavigations) {
          console.log('❌ Too many navigations - possible redirect loop detected!');
          throw new Error('Redirect loop detected');
        }
      }
    });
    
    console.log('🔍 Test 1: Unauthenticated user访问 /');
    
    // Test 1: Unauthenticated access to homepage
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 5000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let currentUrl = page.url();
    console.log('🔍 After unauthenticated visit, current URL:', currentUrl);
    
    // Should be redirected to login
    const test1Pass = currentUrl.includes('/login');
    console.log(`✅ Test 1 (unauthenticated redirect): ${test1Pass ? 'PASS' : 'FAIL'}`);
    
    console.log('🔍 Test 2: Direct access to login page');
    
    // Test 2: Direct access to login page
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 5000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    currentUrl = page.url();
    console.log('🔍 After login page visit, current URL:', currentUrl);
    
    // Should stay on login page for unauthenticated user
    const test2Pass = currentUrl.includes('/login');
    console.log(`✅ Test 2 (login page access): ${test2Pass ? 'PASS' : 'FAIL'}`);
    
    console.log('🔍 Test 3: Direct access to dashboard page');
    
    // Test 3: Direct access to dashboard page (should redirect to login)
    await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 5000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    currentUrl = page.url();
    console.log('🔍 After dashboard visit, current URL:', currentUrl);
    
    // Should be redirected to login for unauthenticated user
    const test3Pass = currentUrl.includes('/login');
    console.log(`✅ Test 3 (dashboard redirect): ${test3Pass ? 'PASS' : 'FAIL'}`);
    
    // Take screenshot for verification
    const screenshotPath = path.join(__dirname, 'redirect-loop-test-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 Screenshot saved:', screenshotPath);
    
    // Test results
    const allTestsPass = test1Pass && test2Pass && test3Pass;
    const noRedirectLoop = navigationCount <= maxNavigations;
    
    console.log('\n📊 REDIRECT LOOP TEST RESULTS:');
    console.log('============================');
    console.log(`✅ Unauthenticated redirect to login: ${test1Pass ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Login page accessible: ${test2Pass ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dashboard redirects to login: ${test3Pass ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No infinite redirect loop: ${noRedirectLoop ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Overall test: ${allTestsPass && noRedirectLoop ? 'PASS' : 'FAIL'}`);
    console.log('\n📋 Details:');
    console.log('- Total navigations:', navigationCount);
    console.log('- Navigation URLs:', navigationUrls);
    console.log('- Final URL:', currentUrl);
    
    if (!allTestsPass) {
      console.log('\n❌ TEST FAILED: Authentication routing issues detected');
    } else if (!noRedirectLoop) {
      console.log('\n❌ TEST FAILED: Redirect loop detected');
    } else {
      console.log('\n✅ TEST PASSED: Authentication routing working correctly');
    }
    
    return { 
      success: allTestsPass && noRedirectLoop,
      test1Pass,
      test2Pass,
      test3Pass,
      navigationCount,
      navigationUrls
    };
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testRedirectLoops().then(results => {
  console.log('\n🏁 Redirect Loop Test Complete');
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});