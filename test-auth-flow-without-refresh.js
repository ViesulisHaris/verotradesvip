const { chromium } = require('playwright');

(async () => {
  console.log('🔧 [Test] Starting authentication flow test (without refresh)...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    console.log('🔧 [Test] Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('🔧 [Test] Page loaded, waiting for email input...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('🔧 [Test] Login page loaded successfully');
    
    // Fill in login credentials
    console.log('🔧 [Test] Filling in login credentials...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    console.log('🔧 [Test] Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for either navigation to dashboard or login button to show loading state
    console.log('🔧 [Test] Waiting for authentication response...');
    
    // Check if login button shows loading state
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      const buttonText = await loginButton.textContent();
      console.log(`🔧 [Test] Login button text: ${buttonText}`);
      
      if (buttonText && buttonText.includes('Logging in')) {
        console.log('🔧 [Test] Login button shows loading state - authentication in progress');
      }
    }
    
    // Wait a bit for authentication to complete
    await page.waitForTimeout(3000);
    
    // Check if we're still on login page or if we've been redirected
    const currentUrl = page.url();
    console.log(`🔧 [Test] Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ [Test] Authentication flow test PASSED - Redirected to dashboard');
      
      // Verify dashboard loaded
      console.log('🔧 [Test] Verifying dashboard loaded...');
      await page.waitForSelector('h1', { timeout: 5000 });
      const dashboardTitle = await page.locator('h1').first().textContent();
      console.log(`🔧 [Test] Dashboard title: ${dashboardTitle}`);
      
      if (dashboardTitle && dashboardTitle.includes('Trading Dashboard')) {
        console.log('✅ [Test] Dashboard loaded correctly after login');
      } else {
        console.log('❌ [Test] Dashboard did not load correctly');
      }
    } else {
      console.log('🔧 [Test] Still on login page, checking for authentication state...');
      
      // Check if there's any indication that authentication succeeded
      const authInitialized = await page.evaluate(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            // Check if there's a user in the auth context
            const hasAuthContext = typeof window !== 'undefined' && 
                                window.localStorage && 
                                window.localStorage.getItem('supabase.auth.token') !== null;
            resolve(hasAuthContext);
          }, 2000);
        });
      });
      
      console.log(`🔧 [Test] Authentication state initialized: ${authInitialized}`);
      
      if (authInitialized) {
        console.log('✅ [Test] Authentication flow test PASSED - Authentication state initialized');
      } else {
        console.log('❌ [Test] Authentication flow test FAILED - Authentication state not initialized');
      }
    }
    
  } catch (error) {
    console.error('❌ [Test] Authentication flow test FAILED with error:', error);
  } finally {
    await browser.close();
  }
})();