const { chromium } = require('playwright');

(async () => {
  console.log('=== SIDEBAR DIAGNOSIS TEST ===');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Authenticate
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    console.log('\n1. TESTING VISIBILITY ISSUES:');
    const visibilityCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return { error: 'Sidebar not found' };
      
      const rect = sidebar.getBoundingClientRect();
      const style = window.getComputedStyle(sidebar);
      
      return {
        isVisible: rect.width > 0 && rect.height > 0,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter,
        border: style.border,
        zIndex: style.zIndex
      };
    });
    
    console.log('Visibility check:', JSON.stringify(visibilityCheck, null, 2));
    
    console.log('\n2. TESTING TRANSFORM VS WIDTH ISSUE:');
    const transformCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return { error: 'Sidebar not found' };
      
      const style = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      
      return {
        actualWidth: rect.width,
        cssWidth: style.width,
        transform: style.transform,
        transformMatrix: style.transform,
        isUsingTransform: style.transform !== 'none',
        leftPosition: rect.left,
        isVisibleOnScreen: rect.left >= -rect.width && rect.left <= window.innerWidth
      };
    });
    
    console.log('Transform check:', JSON.stringify(transformCheck, null, 2));
    
    console.log('\n3. TESTING STATE MANAGEMENT:');
    const stateCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return { error: 'Sidebar not found' };
      
      return {
        hasCollapsedClass: sidebar.classList.contains('sidebar-collapsed'),
        hasExpandedClass: sidebar.classList.contains('sidebar-expanded'),
        computedWidth: window.getComputedStyle(sidebar).width,
        actualWidth: sidebar.getBoundingClientRect().width
      };
    });
    
    console.log('State management check:', JSON.stringify(stateCheck, null, 2));
    
    console.log('\n4. TESTING MENU ITEM ISSUES:');
    const menuCheck = await page.evaluate(() => {
      const menuItems = document.querySelectorAll('.sidebar-menu-item');
      return Array.from(menuItems).slice(0, 3).map(item => {
        const style = window.getComputedStyle(item);
        return {
          textContent: item.textContent,
          innerHTML: item.innerHTML,
          padding: style.padding,
          margin: style.margin,
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          display: style.display
        };
      });
    });
    
    console.log('Menu item check:', JSON.stringify(menuCheck, null, 2));
    
    console.log('\n5. TESTING TRANSITION TIMING:');
    // Test transition timing
    const startTime = performance.now();
    await page.click('.sidebar-button');
    
    // Wait for transition to complete
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      return sidebar && window.getComputedStyle(sidebar).transition === 'none';
    }, { timeout: 2000 });
    
    const endTime = performance.now();
    const transitionTime = endTime - startTime;
    
    console.log('Transition timing:', {
      measuredTime: transitionTime + 'ms',
      expectedTime: '300ms',
      isWithinTolerance: transitionTime <= 350, // 50ms tolerance
      performanceIssue: transitionTime > 350
    });
    
    console.log('\n6. TESTING GLASS MORPHISM EFFECT:');
    const glassMorphismCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      if (!sidebar) return { error: 'Sidebar not found' };
      
      const style = window.getComputedStyle(sidebar);
      
      return {
        hasBackdropFilter: style.backdropFilter !== 'none',
        backdropFilterValue: style.backdropFilter,
        hasTransparentBackground: style.backgroundColor.includes('rgba') && 
                                  style.backgroundColor.includes('0)'),
        hasBorder: style.border !== 'none' && !style.border.includes('rgba(0, 0, 0, 0)'),
        hasBoxShadow: style.boxShadow !== 'none',
        glassMorphismWorking: style.backdropFilter !== 'none' || 
                             (style.backgroundColor.includes('rgba') && 
                              !style.backgroundColor.includes('0)'))
      };
    });
    
    console.log('Glass morphism check:', JSON.stringify(glassMorphismCheck, null, 2));
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    
  } catch (error) {
    console.error('Diagnosis error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
})();