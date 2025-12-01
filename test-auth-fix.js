/**
 * FINAL AUTHENTICATION FIX VERIFICATION TEST
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
    
    // Go to login page
    console.log('🧪 [AUTH_TEST] Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="login-submit-button"]', { timeout: 5000 });
    
    // Check if we have a single AuthContext provider
    const authContextLogs = await page.evaluate(() => {
      return console.logs.filter(log => 
        log.includes('AUTH_DEBUG') && log.includes('AuthContextProviderSimple rendering')
      );
    });
    
    console.log('🧪 [AUTH_TEST] AuthContext provider instances found:', authContextLogs.length);
    
    if (authContextLogs.length === 1) {
      console.log('✅ [AUTH_TEST] SUCCESS: Only one AuthContext provider found');
    } else {
      console.log('❌ [AUTH_TEST] FAILURE: Multiple AuthContext providers still exist');
    }
    
    // Fill in login form
    console.log('🧪 [AUTH_TEST] Filling login form...');
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'testpassword123');
    
    // Submit login
    console.log('🧪 [AUTH_TEST] Submitting login form...');
    await page.click('[data-testid="login-submit-button"]');
    
    // Wait for either dashboard or error
    try {
      await Promise.race([
        page.waitForSelector('h1', { timeout: 10000 }), // Dashboard title
        page.waitForSelector('[style*="color: #dc2626"]', { timeout: 10000 }) // Error message
      ]);
      
      const currentUrl = page.url();
      console.log('🧪 [AUTH_TEST] Navigation result:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ [AUTH_TEST] SUCCESS: Login successful, redirected to dashboard');
        
        // Check dashboard content
        const dashboardTitle = await page.$eval('h1', el => el.textContent);
        if (dashboardTitle && dashboardTitle.includes('Trading Dashboard')) {
          console.log('✅ [AUTH_TEST] SUCCESS: Dashboard loaded correctly');
        }
        
      } else if (currentUrl.includes('/login')) {
        console.log('❌ [AUTH_TEST] FAILURE: Redirected back to login - redirect loop still exists');
        
        // Check for error messages
        const errorElement = await page.$('[style*="color: #dc2626"]');
        if (errorElement) {
          const errorText = await errorElement.evaluate(el => el.textContent);
          console.log('🧪 [AUTH_TEST] Error message:', errorText);
        }
      }
      
    } catch (error) {
      console.log('❌ [AUTH_TEST] Test failed:', error.message);
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