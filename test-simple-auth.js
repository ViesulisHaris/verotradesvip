const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 Testing simple authentication flow...');
  
  try {
    // Navigate to login page
    console.log('📄 Navigating to login page...');
    await page.goto('http://localhost:3001/login');
    
    // Wait for page to load
    await page.waitForSelector('input[type="email"]');
    console.log('✅ Login page loaded successfully');
    
    // Fill in login credentials
    console.log('📝 Entering login credentials...');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit login form
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify dashboard loaded
    const dashboardTitle = await page.textContent('h1');
    if (dashboardTitle && dashboardTitle.includes('Trading Dashboard')) {
      console.log('✅ Successfully logged in and redirected to dashboard');
    } else {
      console.log('❌ Dashboard title not found or incorrect');
    }
    
    // Check for authentication state
    console.log('🔍 Checking authentication state...');
    const localStorageData = await page.evaluate(() => {
      return {
        sbAuthToken: localStorage.getItem('sb-auth-token') ? 'PRESENT' : 'MISSING',
        sbRefreshToken: localStorage.getItem('sb-refresh-token') ? 'PRESENT' : 'MISSING'
      };
    });
    
    console.log('📋 LocalStorage authentication tokens:', localStorageData);
    
    // Test session persistence by reloading
    console.log('🔄 Testing session persistence by reloading page...');
    await page.reload();
    await page.waitForSelector('h1', { timeout: 5000 });
    const reloadedTitle = await page.textContent('h1');
    if (reloadedTitle && reloadedTitle.includes('Trading Dashboard')) {
      console.log('✅ Session persisted after page reload');
    } else {
      console.log('❌ Session did not persist after page reload');
    }
    
    // Test logout
    console.log('🚪 Testing logout functionality...');
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login', { timeout: 5000 });
    console.log('✅ Successfully logged out and redirected to login page');
    
    // Verify tokens are cleared after logout
    const afterLogoutData = await page.evaluate(() => {
      return {
        sbAuthToken: localStorage.getItem('sb-auth-token') ? 'PRESENT' : 'MISSING',
        sbRefreshToken: localStorage.getItem('sb-refresh-token') ? 'PRESENT' : 'MISSING'
      };
    });
    
    console.log('📋 LocalStorage after logout:', afterLogoutData);
    
    if (afterLogoutData.sbAuthToken === 'MISSING') {
      console.log('✅ Authentication tokens cleared after logout');
    } else {
      console.log('❌ Authentication tokens still present after logout');
    }
    
    console.log('🎉 Authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
  } finally {
    await browser.close();
  }
})();