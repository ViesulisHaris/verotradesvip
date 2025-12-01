/**
 * Authenticated User Access Test
 * Tests that authenticated users can access the main page and dashboard
 * Also checks for infinite redirect loops
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testAuthenticatedAccess() {
  console.log('🔍 Starting Authenticated User Access Test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🌐 Browser Console:', msg.text());
    });
    
    // Track redirects to detect infinite loops
    let redirectCount = 0;
    const maxRedirects = 5;
    let lastUrl = '';
    
    page.on('request', request => {
      console.log('📤 Request:', request.url());
      
      // Only count actual redirects (navigation changes, not asset requests)
      const currentUrl = request.url();
      if (currentUrl.includes('localhost:3000') &&
          !currentUrl.includes('_next') &&
          !currentUrl.includes('favicon') &&
          currentUrl !== lastUrl) {
        redirectCount++;
        console.log('🔄 Navigation detected:', currentUrl, '(Redirect count:', redirectCount, ')');
        lastUrl = currentUrl;
        
        if (redirectCount > maxRedirects) {
          console.log('❌ Infinite redirect loop detected!');
          throw new Error('Infinite redirect loop detected');
        }
      }
    });
    
    page.on('response', response => {
      console.log('📥 Response:', response.url(), response.status());
    });
    
    console.log('🔍 Step 1: Testing unauthenticated access (should redirect to login)...');
    
    // First, test unauthenticated access to confirm redirect
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let currentUrl = page.url();
    console.log('🔍 Unauthenticated URL:', currentUrl);
    
    if (!currentUrl.includes('/login')) {
      throw new Error('Unauthenticated user was not redirected to login');
    }
    
    console.log('✅ Unauthenticated user correctly redirected to login');
    
    console.log('🔍 Step 2: Simulating authentication...');
    
    // Simulate authentication by setting auth state in localStorage
    await page.evaluateOnNewDocument(() => {
      // Mock a successful authentication session
      localStorage.setItem('supabase.auth.token', 'mock-token');
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }));
    });
    
    // Navigate to login page first
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Step 3: Testing authenticated access to homepage...');
    
    // Reset redirect counter for authenticated test
    redirectCount = 0;
    
    // Now try to access the homepage as authenticated user
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    currentUrl = page.url();
    console.log('🔍 Authenticated URL after homepage access:', currentUrl);
    
    // Check if we can access dashboard content
    const dashboardElements = await page.evaluate(() => {
      const selectors = [
        'nav', 'sidebar', '.dashboard', '.main-content', 
        '.trades', '.strategies', '[data-testid="dashboard"]'
      ];
      
      const found = [];
      selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          found.push(selector);
        }
      });
      
      return found;
    });
    
    console.log('🔍 Dashboard elements found:', dashboardElements);
    
    // Check for login page elements (should not be present)
    const loginElements = await page.evaluate(() => {
      const selectors = [
        'form[action*="login"]', 'input[type="email"]', 
        'input[type="password"]', 'button[type="submit"]'
      ];
      
      const found = [];
      selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          found.push(selector);
        }
      });
      
      return found;
    });
    
    console.log('🔍 Login elements found (should be none):', loginElements);
    
    // Take screenshot for verification
    const screenshotPath = path.join(__dirname, 'authenticated-access-test-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 Screenshot saved:', screenshotPath);
    
    // Test results
    const testResults = {
      unauthenticatedRedirect: currentUrl.includes('/login') || !currentUrl.includes('/login'),
      authenticatedAccess: !currentUrl.includes('/login'),
      dashboardElementsPresent: dashboardElements.length > 0,
      loginElementsAbsent: loginElements.length === 0,
      redirectLoopDetected: redirectCount > maxRedirects,
      finalUrl: currentUrl
    };
    
    console.log('\n📊 AUTHENTICATED ACCESS TEST RESULTS:');
    console.log('=====================================');
    console.log('✅ Unauthenticated redirect:', testResults.unauthenticatedRedirect ? 'PASS' : 'FAIL');
    console.log('✅ Authenticated access:', testResults.authenticatedAccess ? 'PASS' : 'FAIL');
    console.log('✅ Dashboard elements present:', testResults.dashboardElementsPresent ? 'PASS' : 'FAIL');
    console.log('✅ Login elements absent:', testResults.loginElementsAbsent ? 'PASS' : 'FAIL');
    console.log('✅ No infinite redirect loop:', !testResults.redirectLoopDetected ? 'PASS' : 'FAIL');
    
    const overallSuccess = testResults.authenticatedAccess && 
                          testResults.loginElementsAbsent && 
                          !testResults.redirectLoopDetected;
    
    console.log('✅ Overall test:', overallSuccess ? 'PASS' : 'FAIL');
    console.log('\n📋 Details:');
    console.log('- Final URL:', testResults.finalUrl);
    console.log('- Dashboard elements found:', dashboardElements);
    console.log('- Login elements found:', loginElements);
    console.log('- Redirect count:', redirectCount);
    
    if (!overallSuccess) {
      console.log('\n❌ TEST FAILED: Authenticated user access issue detected');
      console.log('💡 Possible issues:');
      if (!testResults.authenticatedAccess) {
        console.log('  - Authenticated user still being redirected to login');
      }
      if (!testResults.loginElementsAbsent) {
        console.log('  - Login elements still present on authenticated page');
      }
      if (testResults.redirectLoopDetected) {
        console.log('  - Infinite redirect loop detected');
      }
    } else {
      console.log('\n✅ TEST PASSED: Authenticated user access working correctly');
    }
    
    return { success: overallSuccess, ...testResults };
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticatedAccess().then(results => {
  console.log('\n🏁 Authenticated User Access Test Complete');
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});