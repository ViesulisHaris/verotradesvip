/**
 * SIMPLE AUTHENTICATION ROUTING TEST
 * Tests that unauthenticated users are automatically redirected from home page to login
 */

const puppeteer = require('puppeteer');

async function testAuthRouting() {
  console.log('🧪 Starting simple authentication routing test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('AUTH_GUARD_FIX') || 
          text.includes('AUTH_ROUTING_FIX') || 
          text.includes('Redirecting to login') ||
          text.includes('Auth not initialized')) {
        console.log('📝 Browser Console:', text);
      }
    });
    
    page.on('pageerror', (error) => {
      console.error('🚨 Browser Page Error:', error.message);
    });
    
    // Test 1: Navigate to home page and check for redirect
    console.log('\n📍 Test 1: Navigate to http://localhost:3000 and check for automatic redirect');
    
    // Navigate to home page
    console.log('🌐 Navigating to http://localhost:3000...');
    const response = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    console.log('📊 Initial navigation response:', response.status());
    
    // Wait for authentication initialization and potential redirect
    console.log('⏳ Waiting 5 seconds for authentication initialization and redirect...');
    await page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('🔍 Current URL after navigation:', currentUrl);
    
    // Test 2: Analyze the result
    console.log('\n📍 Test 2: Analyze routing behavior');
    
    if (currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Automatically redirected to login page');
      console.log('   🎯 Unauthenticated users are properly redirected from / to /login');
      
      // Verify login page is loaded
      try {
        await page.waitForSelector('button[type="submit"], form', { timeout: 3000 });
        console.log('✅ SUCCESS: Login page content is loaded');
      } catch (e) {
        console.log('⚠️  WARNING: Redirected to login but content may not be fully loaded');
      }
    } else if (currentUrl === 'http://localhost:3000/') {
      console.log('❌ FAILURE: Still on home page - redirect did not work');
      
      // Check what's actually on the page
      try {
        const loaderExists = await page.$('div[style*="animation: spin"]') !== null;
        const homeButtonsExist = await page.$('button:has-text("Login"), button:has-text("Register")') !== null;
        
        if (loaderExists) {
          console.log('❌ FAILURE: Still showing loader instead of redirecting');
          console.log('   🔍 AuthGuard is stuck in loading state');
        } else if (homeButtonsExist) {
          console.log('❌ FAILURE: Showing home page content instead of redirecting');
          console.log('   🔍 HomePage is rendering instead of redirecting unauthenticated users');
        } else {
          console.log('❓ UNKNOWN: Unexpected page state');
        }
      } catch (e) {
        console.log('❓ UNKNOWN: Could not determine page state');
      }
    } else {
      console.log('❓ UNKNOWN: Redirected to unexpected URL:', currentUrl);
    }
    
    // Test 3: Check page title for additional verification
    console.log('\n📍 Test 3: Check page title');
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    if (title.toLowerCase().includes('login')) {
      console.log('✅ SUCCESS: Page title confirms login page');
    } else if (title.toLowerCase().includes('verotrade') || title.toLowerCase().includes('home')) {
      console.log('❌ FAILURE: Page title indicates still on home page');
    } else {
      console.log('❓ UNKNOWN: Page title does not clearly indicate page type');
    }
    
    // Final assessment
    console.log('\n📋 FINAL ASSESSMENT:');
    console.log('==================');
    
    if (currentUrl.includes('/login')) {
      console.log('✅ AUTHENTICATION ROUTING FIX SUCCESSFUL');
      console.log('   ✅ Unauthenticated users are automatically redirected from / to /login');
      console.log('   ✅ No more need to manually add /login to the URL');
      console.log('   ✅ Authentication routing works correctly');
      console.log('   ✅ The reported issue has been RESOLVED');
    } else {
      console.log('❌ AUTHENTICATION ROUTING FIX FAILED');
      console.log('   ❌ Users are still not being redirected from home page to login');
      console.log('   ❌ Manual navigation to /login is still required');
      console.log('   ❌ The reported issue PERSISTS');
      console.log('   🔧 Further investigation needed for AuthGuard/HomePage routing logic');
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

// Run the test
testAuthRouting().catch(console.error);