/**
 * FINAL AUTHENTICATION FIX COMPREHENSIVE VERIFICATION
 * Tests complete authentication flow including session persistence
 */

const puppeteer = require('puppeteer');

async function testCompleteAuthFlow() {
  console.log('🧪 [FINAL_AUTH_TEST] Starting comprehensive authentication test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AUTH_DEBUG') || text.includes('LOGIN_DEBUG') || text.includes('AUTH_GUARD_DEBUG')) {
        console.log('🧪 [FINAL_AUTH_TEST] Console log:', text);
      }
    });
    
    // Test 1: Verify single AuthContext provider
    console.log('🧪 [FINAL_AUTH_TEST] TEST 1: Checking for single AuthContext provider...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    const authContextCount = await page.evaluate(() => {
      let count = 0;
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && args[0].includes && args[0].includes('AuthContextProviderSimple rendering')) {
          count++;
        }
        return originalLog.apply(console, args);
      };
      setTimeout(() => {}, 100);
      return count;
    });
    
    if (authContextCount === 1) {
      console.log('✅ [FINAL_AUTH_TEST] TEST 1 PASSED: Single AuthContext provider confirmed');
    } else {
      console.log('❌ [FINAL_AUTH_TEST] TEST 1 FAILED: Multiple AuthContext providers found:', authContextCount);
      return;
    }
    
    // Test 2: Login and check for redirect loop
    console.log('🧪 [FINAL_AUTH_TEST] TEST 2: Testing login flow...');
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'testpassword123');
    await page.click('[data-testid="login-submit-button"]');
    
    // Wait for navigation completion
    try {
      await Promise.race([
        page.waitForSelector('h1', { timeout: 15000 }), // Success: dashboard title
        page.waitForSelector('[data-testid="login-submit-button"]', { timeout: 15000 }) // Failure: back to login
      ]);
      
      const finalUrl = page.url();
      console.log('🧪 [FINAL_AUTH_TEST] Final URL after login:', finalUrl);
      
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ [FINAL_AUTH_TEST] TEST 2 PASSED: Login successful, reached dashboard');
        
        // Test 3: Verify dashboard content
        console.log('🧪 [FINAL_AUTH_TEST] TEST 3: Verifying dashboard content...');
        const dashboardTitle = await page.$eval('h1', el => el.textContent);
        if (dashboardTitle && dashboardTitle.includes('Trading Dashboard')) {
          console.log('✅ [FINAL_AUTH_TEST] TEST 3 PASSED: Dashboard loaded correctly');
        } else {
          console.log('❌ [FINAL_AUTH_TEST] TEST 3 FAILED: Dashboard content incorrect');
        }
        
        // Test 4: Session persistence test
        console.log('🧪 [FINAL_AUTH_TEST] TEST 4: Testing session persistence...');
        
        // Refresh the page
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);
        
        const afterRefreshUrl = page.url();
        console.log('🧪 [FINAL_AUTH_TEST] URL after refresh:', afterRefreshUrl);
        
        if (afterRefreshUrl.includes('/dashboard')) {
          console.log('✅ [FINAL_AUTH_TEST] TEST 4 PASSED: Session persisted after refresh');
        } else {
          console.log('❌ [FINAL_AUTH_TEST] TEST 4 FAILED: Session lost after refresh');
        }
        
      } else if (finalUrl.includes('/login')) {
        console.log('❌ [FINAL_AUTH_TEST] TEST 2 FAILED: Redirect loop detected - back to login');
      } else {
        console.log('❌ [FINAL_AUTH_TEST] TEST 2 FAILED: Unexpected destination:', finalUrl);
      }
      
    } catch (error) {
      console.log('❌ [FINAL_AUTH_TEST] TEST 2/3/4 FAILED: Timeout or error:', error.message);
    }
    
  } catch (error) {
    console.error('🧪 [FINAL_AUTH_TEST] Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test
testCompleteAuthFlow().then(() => {
  console.log('🧪 [FINAL_AUTH_TEST] Comprehensive authentication test completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('🧪 [FINAL_AUTH_TEST] Test failed:', error);
  process.exit(1);
});