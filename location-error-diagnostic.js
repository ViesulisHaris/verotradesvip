const puppeteer = require('puppeteer');

async function diagnoseLocationError() {
  console.log('🔍 [LOCATION_ERROR_DIAGNOSTIC] Starting diagnostic test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console logs
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    if (text.includes('LOCATION_DEBUG') || text.includes('location is not defined')) {
      console.log(`📝 Browser Console: ${text}`);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('🚨 [PAGE_ERROR]:', error.message);
    if (error.message.includes('location is not defined')) {
      console.log('🎯 [LOCATION_ERROR_FOUND]:', error.message);
      console.log('🎯 [ERROR_STACK]:', error.stack);
    }
  });
  
  try {
    console.log('🔍 [LOCATION_ERROR_DIAGNOSTIC] Navigating to home page to trigger AuthGuard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for 5 seconds to capture timeout-related errors
    console.log('🔍 [LOCATION_ERROR_DIAGNOSTIC] Waiting 5 seconds to capture timeout errors...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for location error in console messages
    const locationErrors = consoleMessages.filter(msg => 
      msg.text.includes('location is not defined') || 
      msg.text.includes('ReferenceError: location')
    );
    
    const locationDebugMessages = consoleMessages.filter(msg => 
      msg.text.includes('LOCATION_DEBUG')
    );
    
    console.log('\n📊 [DIAGNOSTIC_RESULTS]');
    console.log('========================');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Location errors found: ${locationErrors.length}`);
    console.log(`Location debug messages: ${locationDebugMessages.length}`);
    
    if (locationErrors.length > 0) {
      console.log('\n🚨 [LOCATION_ERRORS_DETECTED]:');
      locationErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
        console.log(`   Type: ${error.type}`);
        console.log(`   Timestamp: ${error.timestamp}`);
      });
    }
    
    if (locationDebugMessages.length > 0) {
      console.log('\n🔍 [LOCATION_DEBUG_MESSAGES]:');
      locationDebugMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.text}`);
      });
    }
    
    // Try to trigger logout to test AuthContext location access
    console.log('\n🔍 [LOCATION_ERROR_DIAGNOSTIC] Testing logout function...');
    await page.evaluate(() => {
      // Try to access the logout function from auth context
      try {
        const { useAuth } = window.__NEXT_DATA__ ? eval('window.__NEXT_DATA__') : null;
        if (window.useAuth) {
          const auth = window.useAuth();
          auth.logout();
        }
      } catch (error) {
        console.log('🔍 [LOGOUT_TEST_ERROR]:', error.message);
      }
    });
    
    // Wait another 2 seconds for logout effects
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('🚨 [DIAGNOSTIC_ERROR]:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
diagnoseLocationError().then(() => {
  console.log('🔍 [LOCATION_ERROR_DIAGNOSTIC] Diagnostic completed');
}).catch(error => {
  console.error('🚨 [DIAGNOSTIC_FAILED]:', error);
});