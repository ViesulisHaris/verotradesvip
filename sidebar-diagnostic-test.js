const { chromium } = require('playwright');

/**
 * Sidebar UI Diagnostic Test
 * 
 * This test will diagnose what's happening with the sidebar:
 * 1. Check if login page loads correctly
 * 2. Attempt login with proper credentials
 * 3. Check what happens after login
 * 4. Verify sidebar presence on authenticated pages
 */

async function diagnosticTest() {
  console.log('🔍 Starting Sidebar UI Diagnostic Test...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 // Slow down for better observation
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console events
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
  });
  
  try {
    // Step 1: Check login page
    console.log('\n📍 Step 1: Checking login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'diagnostic-login-page.png', fullPage: true });
    
    // Check if login form exists
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log(`Login form elements - Email: ${emailInput}, Password: ${passwordInput}, Submit: ${submitButton}`);
    
    if (emailInput > 0 && passwordInput > 0 && submitButton > 0) {
      console.log('✅ Login form found');
      
      // Step 2: Attempt login
      console.log('\n📍 Step 2: Attempting login...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      
      // Click submit button
      await page.click('button[type="submit"]');
      
      // Wait for navigation - this could go to dashboard or stay on login if failed
      try {
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ Login successful - redirected to dashboard');
      } catch (error) {
        console.log('❌ Login failed or redirected elsewhere');
        await page.waitForLoadState('networkidle');
        const currentUrl = page.url();
        console.log(`Current URL after login attempt: ${currentUrl}`);
        
        // Take screenshot of where we ended up
        await page.screenshot({ path: 'diagnostic-after-login.png', fullPage: true });
      }
    } else {
      console.log('❌ Login form not found');
    }
    
    // Step 3: Check dashboard regardless of login success
    console.log('\n📍 Step 3: Checking dashboard page...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'diagnostic-dashboard.png', fullPage: true });
    
    // Check for various elements
    const sidebar = await page.locator('aside').count();
    const settingsLink = await page.locator('a[href="/settings"]').count();
    const nav = await page.locator('nav').count();
    const main = await page.locator('main').count();
    
    console.log(`Dashboard elements - Sidebar: ${sidebar}, Settings Link: ${settingsLink}, Nav: ${nav}, Main: ${main}`);
    
    // Check page content
    const pageContent = await page.content();
    const hasUnifiedLayout = pageContent.includes('UnifiedLayout');
    const hasUnifiedSidebar = pageContent.includes('UnifiedSidebar');
    const hasAuthGuard = pageContent.includes('AuthGuard');
    
    console.log(`Content analysis - UnifiedLayout: ${hasUnifiedLayout}, UnifiedSidebar: ${hasUnifiedSidebar}, AuthGuard: ${hasAuthGuard}`);
    
    // Step 4: Check what we're actually seeing
    console.log('\n📍 Step 4: Analyzing page structure...');
    
    // Check if we're on login page (redirected)
    const isLoginPage = await page.locator('input[type="email"]').count() > 0;
    const currentUrl = page.url();
    
    if (isLoginPage || currentUrl.includes('/login')) {
      console.log('❌ Dashboard redirected to login - authentication required');
      
      // Check if there are any error messages
      const errorMessages = await page.locator('.error, .alert, [role="alert"]').count();
      console.log(`Error messages found: ${errorMessages}`);
    } else {
      console.log('✅ Dashboard loaded without redirect');
      
      // Look for sidebar with different selectors
      const sidebarSelectors = [
        'aside',
        '[data-testid="sidebar"]',
        '.sidebar',
        '[class*="sidebar"]',
        '[class*="navigation"]',
        'nav'
      ];
      
      for (const selector of sidebarSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`Found potential sidebar with selector: ${selector} (count: ${count})`);
        }
      }
    }
    
    // Step 5: Try settings page directly
    console.log('\n📍 Step 5: Checking settings page...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'diagnostic-settings.png', fullPage: true });
    
    const settingsSidebar = await page.locator('aside').count();
    const settingsCurrentUrl = page.url();
    const isSettingsLoginPage = await page.locator('input[type="email"]').count() > 0;
    
    console.log(`Settings page - Sidebar: ${settingsSidebar}, URL: ${settingsCurrentUrl}, Redirected to login: ${isSettingsLoginPage}`);
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
  }
  
  await browser.close();
  console.log('\n🔍 Diagnostic test completed');
  console.log('📸 Screenshots saved: diagnostic-login-page.png, diagnostic-after-login.png, diagnostic-dashboard.png, diagnostic-settings.png');
}

// Run the diagnostic test
diagnosticTest().catch(console.error);