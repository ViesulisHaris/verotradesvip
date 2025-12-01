const { chromium } = require('playwright');

(async () => {
  console.log('🔧 [Test] Starting direct dashboard access test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate directly to dashboard
    console.log('🔧 [Test] Navigating directly to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`🔧 [Test] Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ [Test] Successfully redirected to login page - AuthGuard is working correctly');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('🔧 [Test] On dashboard page - checking if it loaded correctly...');
      
      // Check if dashboard content is loaded
      const dashboardTitle = await page.locator('h1').first().textContent();
      console.log(`🔧 [Test] Dashboard title: ${dashboardTitle}`);
      
      if (dashboardTitle && (dashboardTitle.includes('Dashboard') || dashboardTitle.includes('Trading'))) {
        console.log('✅ [Test] Dashboard loaded correctly');
      } else {
        console.log('❌ [Test] Dashboard did not load correctly');
      }
    } else {
      console.log(`🔧 [Test] Unexpected page: ${currentUrl}`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-direct-access.png' });
    console.log('🔧 [Test] Screenshot saved as dashboard-direct-access.png');
    
  } catch (error) {
    console.error('❌ [Test] Direct dashboard access test FAILED with error:', error);
  } finally {
    await browser.close();
  }
})();