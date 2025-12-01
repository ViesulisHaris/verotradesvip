const { chromium } = require('playwright');

async function manualSidebarTest() {
  console.log('🧪 [MANUAL_TEST] Starting manual sidebar visual test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page first
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('🔐 [MANUAL_TEST] On login page, checking if we can see the login form...');
    
    // Quick login (if test user exists) or just go to dashboard to test sidebar
    try {
      // Try to go directly to dashboard to test sidebar visually
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000); // Wait for any redirects or loading
      
      const currentUrl = page.url();
      console.log('🔍 [MANUAL_TEST] Current URL after navigation:', currentUrl);
      
      // Take screenshot regardless of authentication state
      await page.screenshot({ 
        path: 'sidebar-test-current-state.png', 
        fullPage: true 
      });
      
      // Check for any toggle-like elements
      const buttons = await page.locator('button').all();
      console.log('🔍 [MANUAL_TEST] Found buttons on page:', buttons.length);
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i];
        const isVisible = await button.isVisible();
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (isVisible) {
          console.log(`🔍 [MANUAL_TEST] Button ${i}:`, {
            text: text?.trim(),
            ariaLabel,
            isVisible
          });
        }
      }
      
      // Check for any sidebar-like elements
      const sidebars = await page.locator('aside, nav[role="navigation"], .sidebar').all();
      console.log('🔍 [MANUAL_TEST] Found sidebar-like elements:', sidebars.length);
      
      for (let i = 0; i < sidebars.length; i++) {
        const sidebar = sidebars[i];
        const isVisible = await sidebar.isVisible();
        const className = await sidebar.getAttribute('class');
        
        console.log(`🔍 [MANUAL_TEST] Sidebar ${i}:`, {
          isVisible,
          className
        });
      }
      
      // Check page structure
      const bodyHTML = await page.locator('body').innerHTML();
      const hasMenuText = bodyHTML.includes('menu') || bodyHTML.includes('Menu');
      const hasSidebarText = bodyHTML.includes('sidebar') || bodyHTML.includes('navigation');
      
      console.log('🔍 [MANUAL_TEST] Page structure analysis:', {
        hasMenuText,
        hasSidebarText,
        bodyClass: await page.locator('body').getAttribute('class')
      });
      
    } catch (error) {
      console.error('❌ [MANUAL_TEST] Error during test:', error.message);
    }
    
    console.log('✅ [MANUAL_TEST] Manual sidebar test completed');
    
  } catch (error) {
    console.error('❌ [MANUAL_TEST] Test failed:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

manualSidebarTest().catch(console.error);