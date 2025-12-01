// Debug script to test UnifiedSidebar rendering issues
const puppeteer = require('puppeteer');

async function debugSidebarRendering() {
  console.log('🔍 Starting UnifiedSidebar rendering diagnosis...\n');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging from the browser
  page.on('console', msg => {
    console.log('🌐 Browser:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  page.on('requestfailed', request => {
    console.log('❌ Failed Request:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('📍 Navigating to home page...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('\n🔍 Checking for sidebar elements...');
    
    // Check for sidebar element
    const sidebarElement = await page.$('aside');
    console.log('Sidebar element found:', !!sidebarElement);
    
    if (sidebarElement) {
      const sidebarStyles = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return null;
        
        const computedStyle = window.getComputedStyle(sidebar);
        return {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          transform: computedStyle.transform,
          width: computedStyle.width,
          height: computedStyle.height,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position,
          left: computedStyle.left,
          top: computedStyle.top
        };
      });
      
      console.log('Sidebar styles:', sidebarStyles);
      
      // Check if sidebar is actually visible
      const isVisible = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return false;
        
        const rect = sidebar.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
      console.log('Sidebar is visible:', isVisible);
    }
    
    console.log('\n🔍 Checking for navigation items...');
    const navItems = await page.$$('nav a');
    console.log('Navigation items found:', navItems.length);
    
    if (navItems.length > 0) {
      const navTexts = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('nav a'));
        return items.map(item => item.textContent?.trim()).filter(Boolean);
      });
      console.log('Navigation item texts:', navTexts);
    }
    
    console.log('\n🔍 Checking for Settings link specifically...');
    const settingsLink = await page.$('a[href="/settings"]');
    console.log('Settings link found:', !!settingsLink);
    
    console.log('\n🔍 Checking CSS imports...');
    const cssImports = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.map(sheet => sheet.href).filter(Boolean);
    });
    console.log('CSS imports:', cssImports);
    
    console.log('\n🔍 Checking for console errors...');
    const consoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    console.log('Console errors:', consoleErrors);
    
    console.log('\n🔍 Checking authentication state...');
    const authState = await page.evaluate(() => {
      return {
        hasAuthContext: !!window.React?.createContext,
        hasAuthProvider: !!document.querySelector('[data-auth-provider]'),
        hasAuthGuard: !!document.querySelector('[data-auth-guard]')
      };
    });
    console.log('Auth state:', authState);
    
    console.log('\n🔍 Checking component mount state...');
    const componentState = await page.evaluate(() => {
      return {
        hasUnifiedLayout: !!document.querySelector('[data-unified-layout]'),
        hasUnifiedSidebar: !!document.querySelector('[data-unified-sidebar]'),
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className
      };
    });
    console.log('Component state:', componentState);
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugSidebarRendering().then(() => {
  console.log('\n✅ Debugging completed');
}).catch(error => {
  console.error('❌ Debugging failed:', error);
});