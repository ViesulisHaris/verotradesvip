/**
 * SIMPLE AUTHENTICATION FIX VERIFICATION
 * Tests the complete authentication flow after fixing double provider nesting
 */

const puppeteer = require('puppeteer');

async function testAuthenticationFlow() {
  console.log('🧪 [AUTH_TEST] Starting authentication flow test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('AUTH_DEBUG') && msg.text().includes('AuthContextProviderSimple rendering')) {
        console.log('🧪 [AUTH_TEST] Found AuthContext log:', msg.text());
      }
    });
    
    // Go to login page
    console.log('🧪 [AUTH_TEST] Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Count AuthContext providers
    const authContextCount = await page.evaluate(() => {
      let count = 0;
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && args[0].includes && args[0].includes('AuthContextProviderSimple rendering')) {
          count++;
        }
        return originalLog.apply(console, args);
      };
      
      // Trigger a re-render to capture logs
      setTimeout(() => {}, 100);
      
      return count;
    });
    
    console.log('🧪 [AUTH_TEST] AuthContext provider instances found:', authContextCount);
    
    if (authContextCount === 1) {
      console.log('✅ [AUTH_TEST] SUCCESS: Only one AuthContext provider found - DOUBLE NESTING FIXED!');
    } else {
      console.log('❌ [AUTH_TEST] FAILURE: Multiple AuthContext providers still exist:', authContextCount);
    }
    
    // Fill in login form
    console.log('🧪 [AUTH_TEST] Filling login form...');
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'testpassword123');
    
    // Submit login
    console.log('🧪 [AUTH_TEST] Submitting login form...');
    await page.click('[data-testid="login-submit-button"]');
    
    // Wait for navigation
    console.log('🧪 [AUTH_TEST] Waiting for navigation...');
    await page.waitForTimeout(10000);
    
    const currentUrl = page.url();
    console.log('🧪 [AUTH_TEST] Final URL after login attempt:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ [AUTH_TEST] SUCCESS: Login successful, reached dashboard');
    } else if (currentUrl.includes('/login')) {
      console.log('❌ [AUTH_TEST] FAILURE: Still on login page - redirect loop detected');
    } else {
      console.log('🧪 [AUTH_TEST] UNKNOWN: Ended up at:', currentUrl);
    }
    
  } catch (error) {
    console.error('🧪 [AUTH_TEST] Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationFlow().then(() => {
  console.log('🧪 [AUTH_TEST] Authentication flow test completed');
  process.exit(0);
}).catch(error => {
  console.error('🧪 [AUTH_TEST] Test failed:', error);
  process.exit(1);
});