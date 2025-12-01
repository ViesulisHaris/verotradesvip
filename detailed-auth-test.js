const { chromium } = require('playwright');

(async () => {
  console.log('🔧 [Test] Starting detailed authentication test...');
  
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
    
    // Take screenshot before login
    await page.screenshot({ path: 'before-login.png' });
    
    // Set up console log listener
    page.on('console', msg => {
      console.log(`🔧 [Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    // Set up response listener
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`🔧 [Response] ${response.url()}: ${response.status()}`);
      }
    });
    
    // Click login button
    console.log('🔧 [Test] Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait a bit for authentication to process
    console.log('🔧 [Test] Waiting for authentication to process...');
    await page.waitForTimeout(5000);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`🔧 [Test] Current URL after login attempt: ${currentUrl}`);
    
    // Check for any error messages or alerts
    const alertMessage = await page.$('text=Invalid login credentials') || 
                          await page.$('text=Error') ||
                          await page.$('.error');
    
    if (alertMessage) {
      console.log('❌ [Test] Login failed - Found error message');
      const errorText = await alertMessage.textContent();
      console.log(`🔧 [Test] Error message: ${errorText}`);
    }
    
    // Check if we're still on login page
    if (currentUrl.includes('/login')) {
      console.log('❌ [Test] Still on login page - login likely failed');
      
      // Check if the form is still there
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        console.log('🔧 [Test] Login form is still present');
      }
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ [Test] Successfully navigated to dashboard');
      
      // Verify dashboard loaded
      console.log('🔧 [Test] Verifying dashboard loaded...');
      await page.waitForLoadState('networkidle');
      
      const dashboardTitle = await page.locator('h1').first().textContent();
      console.log(`🔧 [Test] Dashboard title: ${dashboardTitle}`);
      
      if (dashboardTitle && (dashboardTitle.includes('Dashboard') || dashboardTitle.includes('Trading'))) {
        console.log('✅ [Test] Authentication flow test PASSED - Dashboard loaded correctly after login');
      } else {
        console.log('❌ [Test] Authentication flow test FAILED - Dashboard did not load correctly');
      }
    } else {
      console.log(`🔧 [Test] Redirected to unexpected page: ${currentUrl}`);
    }
    
    // Check if user is authenticated
    const isAuthenticated = await page.evaluate(() => {
      // Check if there's a user in auth context
      return window.localStorage.getItem('supabase.auth.token') !== null;
    });
    
    console.log(`🔧 [Test] User authenticated: ${isAuthenticated}`);
    
  } catch (error) {
    console.error('❌ [Test] Authentication test FAILED with error:', error);
  } finally {
    await browser.close();
  }
})();