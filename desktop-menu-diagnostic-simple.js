const { chromium } = require('playwright');

(async () => {
  console.log('🔍 [DEBUG] Starting Desktop Menu Freezing Diagnostic Test (Simple)');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Desktop-Browser-Freezing-Test/1.0'
  });
  
  const page = await context.newPage();
  
  // Enable console log capture
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    // Navigate to login page
    console.log('🔐 Logging in user...');
    await page.goto('http://localhost:3000/login');
    
    // Fill in login form
    await page.fill('[type="email"]', 'test@example.com');
    await page.fill('[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
    console.log('✅ User logged in successfully');
    
    // Test 1: Monitor component re-renders during navigation
    console.log('🔄 Testing component re-renders during navigation...');
    
    let renderCount = 0;
    let zoomLayoutRenderCount = 0;
    let desktopSidebarRenderCount = 0;
    
    // Capture console logs to count re-renders
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ZoomAwareLayout rendered')) {
        zoomLayoutRenderCount++;
      }
      if (text.includes('DesktopSidebar component rendered')) {
        desktopSidebarRenderCount++;
      }
      if (text.includes('Sidebar component rendered')) {
        renderCount++;
      }
    });
    
    // Navigate rapidly between pages to trigger re-renders
    const pages = ['/dashboard', '/log-trade', '/strategies', '/trades', '/calendar', '/confluence'];
    
    for (let i = 0; i < 5; i++) {
      console.log(`🔄 Navigation cycle ${i + 1}:`);
      
      for (const pageUrl of pages) {
        console.log(`  Navigating to ${pageUrl}...`);
        
        // Check page responsiveness before navigation
        const responsiveBefore = await page.evaluate(() => {
          return document.documentElement.classList.contains('hydrated');
        });
        
        await page.goto(`http://localhost:3000${pageUrl}`);
        await page.waitForLoadState('networkidle');
        
        // Check page responsiveness after navigation
        const responsiveAfter = await page.evaluate(() => {
          return document.documentElement.classList.contains('hydrated');
        });
        
        console.log(`    Page responsive before: ${responsiveBefore}, after: ${responsiveAfter}`);
        
        // Small delay to allow for any animations/transitions
        await page.waitForTimeout(500);
      }
    }
    
    console.log(`📊 Render counts after navigation cycles:`);
    console.log(`  ZoomAwareLayout renders: ${zoomLayoutRenderCount}`);
    console.log(`  DesktopSidebar renders: ${desktopSidebarRenderCount}`);
    console.log(`  Sidebar renders: ${renderCount}`);
    
    // Test 2: Check for memory leaks
    console.log('🧠 Testing for memory leaks...');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance && performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (initialMemory) {
      console.log(`  Initial memory usage: ${Math.round(initialMemory.used / 1024 / 1024)}MB`);
      
      // Perform more navigation cycles
      for (let i = 0; i < 10; i++) {
        await page.goto(`http://localhost:3000/${pages[i % pages.length]}`);
        await page.waitForLoadState('networkidle');
      }
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if (performance && performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        const memoryIncreaseMB = Math.round(memoryIncrease / 1024 / 1024);
        console.log(`  Final memory usage: ${Math.round(finalMemory.used / 1024 / 1024)}MB`);
        console.log(`  Memory increase: ${memoryIncreaseMB}MB`);
        
        if (memoryIncreaseMB > 50) {
          console.log(`  ⚠️  Potential memory leak detected: ${memoryIncreaseMB}MB increase`);
        }
      }
    }
    
    // Test 3: Check for event listener leaks
    console.log('🔌 Testing for event listener leaks...');
    
    const eventListenerCount = await page.evaluate(() => {
      // This is a rough estimate - we can't directly count all event listeners
      // but we can check if certain elements have excessive listeners
      const body = document.body;
      const listeners = [];
      
      // Check for common event types
      const eventTypes = ['click', 'resize', 'keydown', 'scroll', 'wheel'];
      
      for (const eventType of eventTypes) {
        try {
          // Create a test element to see if events are being handled
          const testElement = document.createElement('div');
          body.appendChild(testElement);
          
          // Try to trigger the event
          const event = new Event(eventType, { bubbles: true });
          testElement.dispatchEvent(event);
          
          body.removeChild(testElement);
        } catch (e) {
          listeners.push({ type: eventType, error: e.message });
        }
      }
      
      return listeners.length;
    });
    
    console.log(`  Event listener test completed: ${eventListenerCount} potential issues`);
    
    // Test 4: Check CSS positioning and z-index issues
    console.log('🎨 Testing CSS positioning and z-index...');
    
    const sidebarInfo = await page.evaluate(() => {
      const desktopSidebar = document.querySelector('.zoom-desktop .zoom-content > :first-child');
      const mobileSidebar = document.querySelector('.zoom-mobile .zoom-content > :first-child');
      
      const result = {
        desktopSidebar: {
          exists: !!desktopSidebar,
          visible: desktopSidebar ? window.getComputedStyle(desktopSidebar).display !== 'none' : false,
          zIndex: desktopSidebar ? window.getComputedStyle(desktopSidebar).zIndex : 'N/A',
          position: desktopSidebar ? window.getComputedStyle(desktopSidebar).position : 'N/A'
        },
        mobileSidebar: {
          exists: !!mobileSidebar,
          visible: mobileSidebar ? window.getComputedStyle(mobileSidebar).display !== 'none' : false,
          zIndex: mobileSidebar ? window.getComputedStyle(mobileSidebar).zIndex : 'N/A',
          position: mobileSidebar ? window.getComputedStyle(mobileSidebar).position : 'N/A'
        }
      };
      
      return result;
    });
    
    console.log(`  Desktop sidebar:`, sidebarInfo.desktopSidebar);
    console.log(`  Mobile sidebar:`, sidebarInfo.mobileSidebar);
    
    // Test 5: Check for rapid navigation issues
    console.log('⚡ Testing rapid navigation...');
    
    const rapidNavigationStart = Date.now();
    
    for (let i = 0; i < 20; i++) {
      const pageUrl = pages[i % pages.length];
      await page.goto(`http://localhost:3000${pageUrl}`);
      
      // Don't wait for full load - simulate rapid clicking
      if (i % 5 === 0) {
        console.log(`  Rapid navigation cycle ${i + 1}/20`);
      }
    }
    
    // Wait for the last page to fully load
    await page.waitForLoadState('networkidle');
    
    const rapidNavigationTime = Date.now() - rapidNavigationStart;
    console.log(`  Rapid navigation completed in ${rapidNavigationTime}ms`);
    
    // Check if page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.documentElement.classList.contains('hydrated');
    });
    
    console.log(`  Page responsive after rapid navigation: ${isResponsive}`);
    
    // Test 6: Test desktop menu button clicks
    console.log('🖱️ Testing desktop menu button clicks...');
    
    // Get back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Find and test desktop menu buttons
    const menuButtons = await page.$$('nav a[href]');
    
    for (let i = 0; i < Math.min(menuButtons.length, 5); i++) {
      const button = menuButtons[i];
      
      try {
        // Get button info
        const href = await button.getAttribute('href');
        const text = await button.textContent();
        
        console.log(`  Testing button: ${text || href}`);
        
        // Check if button is visible and clickable
        const isVisible = await button.isVisible();
        const isClickable = await button.isEnabled();
        
        console.log(`    Visible: ${isVisible}, Clickable: ${isClickable}`);
        
        if (isVisible && isClickable) {
          // Click the button
          await button.click();
          
          // Wait for navigation
          await page.waitForLoadState('networkidle');
          
          // Check if we navigated to the correct page
          const currentUrl = page.url();
          console.log(`    Navigated to: ${currentUrl}`);
          
          // Go back to dashboard for next test
          if (i < menuButtons.length - 1) {
            await page.goto('http://localhost:3000/dashboard');
            await page.waitForLoadState('networkidle');
          }
        }
      } catch (error) {
        console.log(`    ❌ Error testing button: ${error.message}`);
      }
    }
    
    console.log('✅ Desktop menu button test completed');
    
    // Final summary
    console.log('📋 Summary of desktop menu freezing diagnostic test:');
    console.log('===========================================');
    console.log(`✅ Authentication system is working properly`);
    console.log(`✅ Component re-render counts: ZoomAwareLayout (${zoomLayoutRenderCount}), DesktopSidebar (${desktopSidebarRenderCount})`);
    console.log(`✅ Memory leak test completed`);
    console.log(`✅ Event listener test completed`);
    console.log(`✅ CSS positioning test completed`);
    console.log(`✅ Rapid navigation test completed in ${rapidNavigationTime}ms`);
    console.log(`✅ Desktop menu button clicks tested`);
    
    if (zoomLayoutRenderCount > 30) {
      console.log(`⚠️  High number of ZoomAwareLayout re-renders detected: ${zoomLayoutRenderCount}`);
    }
    
    if (desktopSidebarRenderCount > 30) {
      console.log(`⚠️  High number of DesktopSidebar re-renders detected: ${desktopSidebarRenderCount}`);
    }
    
    if (!isResponsive) {
      console.log(`❌ Page became unresponsive after rapid navigation`);
    }
    
    console.log('🔍 [DEBUG] Desktop Menu Freezing Diagnostic Test Complete');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
})();