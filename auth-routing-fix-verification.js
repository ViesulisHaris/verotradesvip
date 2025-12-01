const puppeteer = require('puppeteer');

async function testAuthRoutingFix() {
  console.log('🔍 [AUTH_ROUTING_FIX_VERIFICATION] Starting comprehensive test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console logs and errors
  const consoleMessages = [];
  const pageErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    if (text.includes('location is not defined') || text.includes('ReferenceError')) {
      console.log(`🚨 [ERROR]: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log('🚨 [PAGE_ERROR]:', error.message);
  });
  
  try {
    console.log('\n📍 [TEST 1] Testing unauthenticated home page redirect...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for redirect to login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('/login');
    
    console.log(`📊 [RESULT 1]: Current URL: ${currentUrl}`);
    console.log(`📊 [RESULT 1]: Redirected to login: ${redirectedToLogin}`);
    
    console.log('\n📍 [TEST 2] Testing direct login page access...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const loginUrl = page.url();
    const loginPageLoaded = loginUrl.includes('/login');
    
    console.log(`📊 [RESULT 2]: Login page URL: ${loginUrl}`);
    console.log(`📊 [RESULT 2]: Login page loaded: ${loginPageLoaded}`);
    
    console.log('\n📍 [TEST 3] Testing direct register page access...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const registerUrl = page.url();
    const registerPageLoaded = registerUrl.includes('/register');
    
    console.log(`📊 [RESULT 3]: Register page URL: ${registerUrl}`);
    console.log(`📊 [RESULT 3]: Register page loaded: ${registerPageLoaded}`);
    
    console.log('\n📍 [TEST 4] Testing home page again to check for location errors...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for timeout
    
    // Check for any location errors in this cycle
    const locationErrors = consoleMessages.filter(msg => 
      msg.text.includes('location is not defined') || 
      msg.text.includes('ReferenceError: location')
    );
    
    const authGuardMessages = consoleMessages.filter(msg => 
      msg.text.includes('AUTH_GUARD_FIX')
    );
    
    console.log(`📊 [RESULT 4]: Location errors in this test: ${locationErrors.length}`);
    console.log(`📊 [RESULT 4]: AuthGuard messages: ${authGuardMessages.length}`);
    
    // Analyze results
    console.log('\n📊 [FINAL ANALYSIS]');
    console.log('========================');
    
    const locationErrorsFound = pageErrors.filter(error => 
      error.message.includes('location is not defined')
    );
    
    console.log(`✅ Location errors: ${locationErrorsFound.length} (should be 0)`);
    console.log(`✅ Console location errors: ${locationErrors.length} (should be 0)`);
    console.log(`✅ Home → Login redirect: ${redirectedToLogin} (should be true)`);
    console.log(`✅ Login page accessible: ${loginPageLoaded} (should be true)`);
    console.log(`✅ Register page accessible: ${registerPageLoaded} (should be true)`);
    
    const allTestsPassed = 
      locationErrorsFound.length === 0 &&
      locationErrors.length === 0 &&
      redirectedToLogin &&
      loginPageLoaded &&
      registerPageLoaded;
    
    console.log(`\n🎯 [OVERALL RESULT]: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (locationErrorsFound.length > 0) {
      console.log('\n🚨 [REMAINING ERRORS]:');
      locationErrorsFound.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
      });
    }
    
    return {
      success: allTestsPassed,
      locationErrors: locationErrorsFound.length + locationErrors.length,
      redirectWorking: redirectedToLogin,
      loginAccessible: loginPageLoaded,
      registerAccessible: registerPageLoaded
    };
    
  } catch (error) {
    console.error('🚨 [TEST_ERROR]:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the verification test
testAuthRoutingFix().then(result => {
  console.log('\n🔍 [AUTH_ROUTING_FIX_VERIFICATION] Test completed');
  console.log('📊 [FINAL RESULT]:', result);
}).catch(error => {
  console.error('🚨 [VERIFICATION_FAILED]:', error);
});