const { chromium } = require('playwright');

(async () => {
  console.log('Starting sidebar visual test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Authenticate
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    console.log('Login submitted, waiting...');
    await page.waitForTimeout(3000);
    
    // Check dashboard
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    // Check sidebar visual properties
    console.log('Checking sidebar visual properties...');
    const sidebarStyle = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return 'Sidebar not found';
      
      const computedStyle = window.getComputedStyle(sidebar);
      return {
        width: computedStyle.width,
        height: computedStyle.height,
        backgroundColor: computedStyle.backgroundColor,
        backdropFilter: computedStyle.backdropFilter,
        border: computedStyle.border,
        borderRadius: computedStyle.borderRadius,
        boxShadow: computedStyle.boxShadow,
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        zIndex: computedStyle.zIndex,
        transition: computedStyle.transition,
        transform: computedStyle.transform,
        opacity: computedStyle.opacity
      };
    });
    
    console.log('Sidebar style properties:', JSON.stringify(sidebarStyle, null, 2));
    
    // Check if sidebar has glass morphism effect
    console.log('Checking glass morphism effect...');
    const hasGlassMorphism = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return false;
      
      const computedStyle = window.getComputedStyle(sidebar);
      return computedStyle.backdropFilter !== 'none' || 
             computedStyle.backgroundColor.includes('rgba') ||
             computedStyle.backgroundColor.includes('hsla');
    });
    
    console.log('Has glass morphism effect:', hasGlassMorphism);
    
    // Check menu items
    console.log('Checking menu items...');
    const menuItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.sidebar-menu-item');
      return Array.from(items).map(item => {
        const style = window.getComputedStyle(item);
        return {
          textContent: item.textContent?.trim(),
          display: style.display,
          padding: style.padding,
          margin: style.margin,
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius
        };
      });
    });
    
    console.log('Menu items:', JSON.stringify(menuItems, null, 2));
    
    // Test toggle functionality with timing
    console.log('Testing toggle functionality with timing...');
    const startTime = Date.now();
    await page.click('.sidebar-button');
    await page.waitForTimeout(500);
    const toggleTime = Date.now() - startTime;
    console.log('Toggle animation time:', toggleTime + 'ms');
    
    // Check sidebar state after toggle
    const afterToggleStyle = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return 'Sidebar not found';
      
      const computedStyle = window.getComputedStyle(sidebar);
      return {
        width: computedStyle.width,
        transform: computedStyle.transform,
        opacity: computedStyle.opacity
      };
    });
    
    console.log('Sidebar style after toggle:', JSON.stringify(afterToggleStyle, null, 2));
    
    // Check if sidebar is properly collapsed
    const isCollapsed = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      return sidebar ? sidebar.classList.contains('sidebar-collapsed') : false;
    });
    
    console.log('Sidebar is collapsed after toggle:', isCollapsed);
    
    // Test toggle back
    console.log('Testing toggle back...');
    await page.click('.sidebar-button');
    await page.waitForTimeout(500);
    
    const finalStyle = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return 'Sidebar not found';
      
      const computedStyle = window.getComputedStyle(sidebar);
      return {
        width: computedStyle.width,
        transform: computedStyle.transform
      };
    });
    
    console.log('Sidebar style after toggle back:', JSON.stringify(finalStyle, null, 2));
    
    console.log('Visual test completed successfully');
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
})();