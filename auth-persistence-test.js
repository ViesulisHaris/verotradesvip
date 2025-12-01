// Authentication Persistence Test Script
// This script will test authentication state persistence across page refreshes

const puppeteer = require('puppeteer');

async function testAuthenticationPersistence() {
  console.log('🧪 Starting Authentication Persistence Test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🌐 [Browser Console]', msg.text());
  });
  
  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Fill in login credentials
    console.log('📍 Step 2: Filling in login credentials...');
    await page.type('input[type="email"]', 'testuser1000@verotrade.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Step 3: Submit login form
    console.log('📍 Step 3: Submitting login form...');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Check if login was successful
    console.log('📍 Step 4: Checking login success...');
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/trades')) {
      console.log('✅ Login successful - redirected to authenticated page');
    } else {
      console.log('❌ Login failed - not redirected to authenticated page');
    }
    
    // Step 5: Navigate to test page to check auth state
    console.log('📍 Step 5: Navigating to auth test page...');
    await page.goto('http://localhost:3000/test-auth-persistence');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 6: Check localStorage for auth data
    console.log('📍 Step 6: Checking localStorage for auth data...');
    const localStorageData = await page.evaluate(() => {
      return {
        supabaseAuth: localStorage.getItem('supabase.auth.token'),
        supabaseUrl: localStorage.getItem('supabase.url'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('LocalStorage data:', localStorageData);
    
    // Step 7: Test page refresh
    console.log('📍 Step 7: Testing page refresh persistence...');
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 8: Check if auth state persisted after refresh
    console.log('📍 Step 8: Checking auth state after refresh...');
    const authStateAfterRefresh = await page.evaluate(() => {
      return {
        url: window.location.href,
        localStorage: Object.keys(localStorage)
      };
    });
    
    console.log('Auth state after refresh:', authStateAfterRefresh);
    
    // Step 9: Test navigation to another authenticated page
    console.log('📍 Step 9: Testing navigation to authenticated page...');
    await page.goto('http://localhost:3000/dashboard');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const navigationResult = {
      url: page.url(),
      success: page.url().includes('/dashboard')
    };
    
    console.log('Navigation test result:', navigationResult);
    
    // Step 10: Final auth state check
    console.log('📍 Step 10: Final authentication state check...');
    const finalAuthState = await page.evaluate(() => {
      return {
        url: window.location.href,
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });
    
    console.log('Final auth state:', finalAuthState);
    
    console.log('🎉 Authentication Persistence Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationPersistence().catch(console.error);