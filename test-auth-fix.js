const puppeteer = require('puppeteer');

async function testAuthFix() {
  console.log('🧪 Testing Authentication Fix...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('📍 Step 1: Navigate to trades page (protected route)...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });

    // Wait a moment to see if auth initializes
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📍 Step 2: Check for infinite loading...');
    
    // Check if still showing loading state
    const isLoading = await page.evaluate(() => {
      const loadingElements = document.querySelectorAll('*');
      for (const el of loadingElements) {
        if (el.textContent && el.textContent.includes('Initializing authentication')) {
          return true;
        }
      }
      return false;
    });

    console.log('📍 Step 3: Analyze console logs...');
    
    // Analyze auth-related console messages
    const authMessages = consoleMessages.filter(msg =>
      msg.text.includes('AUTH_CONTEXT_HYDRATION_DEBUG') ||
      msg.text.includes('AUTH_GUARD_DEBUG') ||
      msg.text.includes('AuthContext')
    );

    // Check for successful initialization
    const hasInitSuccess = authMessages.some(msg =>
      msg.text.includes('Auth initialization completed successfully') ||
      msg.text.includes('authInitialized: true')
    );

    // Check for timeout triggers
    const hasTimeoutMessages = authMessages.some(msg =>
      msg.text.includes('Forcing initialization due to timeout') ||
      msg.text.includes('Critical timeout reached')
    );

    // Check for error messages
    const hasErrors = authMessages.some(msg =>
      msg.type === 'error' ||
      msg.text.includes('🚨')
    );

    console.log('\n🎯 AUTHENTICATION FIX TEST RESULTS:');
    console.log('=====================================');
    console.log(`✅ Loading State Resolved: ${!isLoading ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Auth Initialization Success: ${hasInitSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`⚠️  Timeout Mechanism Active: ${hasTimeoutMessages ? 'YES' : 'NO'}`);
    console.log(`❌ Errors Present: ${hasErrors ? 'YES' : 'NO'}`);
    
    if (!isLoading && hasInitSuccess) {
      console.log('\n🎉 SUCCESS: Authentication initialization issue appears to be FIXED!');
      console.log('   - Loading state resolved properly');
      console.log('   - Auth context initialized successfully');
      console.log('   - No infinite loading detected');
    } else {
      console.log('\n❌ ISSUE STILL PERSISTS:');
      if (isLoading) {
        console.log('   - Still showing infinite loading state');
      }
      if (!hasInitSuccess) {
        console.log('   - Auth initialization not completing');
      }
    }

    console.log('\n📊 Console Log Analysis:');
    console.log(`   - Total auth messages: ${authMessages.length}`);
    console.log(`   - Error messages: ${authMessages.filter(m => m.type === 'error').length}`);
    console.log(`   - Warning messages: ${authMessages.filter(m => m.type === 'warning').length}`);

    // Final check - try to navigate to dashboard
    console.log('\n📍 Step 4: Test navigation to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 8000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardLoaded = await page.evaluate(() => {
      return !document.body.textContent.includes('Initializing authentication');
    });

    console.log(`✅ Dashboard Navigation: ${dashboardLoaded ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFix().catch(console.error);