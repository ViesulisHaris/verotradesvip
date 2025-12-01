// AUTHENTICATED USER SIDEBAR DEBUG TEST
const puppeteer = require('puppeteer');

async function debugAuthenticatedSidebar() {
  console.log('🔍 AUTHENTICATED USER SIDEBAR DEBUG');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from page
    page.on('console', msg => {
      console.log('🌐 BROWSER:', msg.text());
    });
    
    // Test 1: Go directly to dashboard (assuming user is already logged in)
    console.log('\n📊 Direct Dashboard Access Test:');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const dashboardAnalysis = await page.evaluate(() => {
      // Check authentication state from debug logs
      const authDebugElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && el.textContent.includes('AuthGuard State:'))
        .map(el => el.textContent.trim());
      
      // Check for sidebar components
      const sidebar = document.querySelector('.verotrade-sidebar-overlay');
      const topNav = document.querySelector('.verotrade-persistent-top-nav');
      const mobileMenu = document.querySelector('.verotrade-mobile-menu-btn');
      const mainContent = document.querySelector('.verotrade-main-content');
      
      // Check if UnifiedLayout is being used
      const unifiedLayoutElements = document.querySelectorAll('[class*="verotrade-"]');
      const hasUnifiedLayout = unifiedLayoutElements.length > 0;
      
      // Check sidebar specific styles and visibility
      let sidebarInfo = null;
      if (sidebar) {
        const computedStyle = window.getComputedStyle(sidebar);
        sidebarInfo = {
          exists: true,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          transform: computedStyle.transform,
          zIndex: computedStyle.zIndex,
          width: computedStyle.width,
          height: computedStyle.height,
          position: computedStyle.position,
          left: computedStyle.left,
          top: computedStyle.top
        };
      } else {
        sidebarInfo = { exists: false };
      }
      
      // Check for any error boundaries or fallback content
      const errorElements = document.querySelectorAll('[class*="error"], [class*="fallback"]');
      const errors = Array.from(errorElements).map(el => ({
        text: el.textContent.trim(),
        className: el.className
      }));
      
      // Check if there are any navigation-related elements
      const navElements = document.querySelectorAll('nav, [role="navigation"], button[aria-label*="menu"], button[aria-label*="sidebar"]');
      const navInfo = Array.from(navElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent.trim().substring(0, 50)
      }));
      
      return {
        url: window.location.href,
        authDebugMessages: authDebugElements,
        hasUnifiedLayout,
        components: {
          sidebar: !!sidebar,
          topNav: !!topNav,
          mobileMenu: !!mobileMenu,
          mainContent: !!mainContent
        },
        sidebarInfo,
        navigationElements: navInfo,
        errors,
        bodyClasses: document.body.className,
        bodyHtml: document.body.innerHTML.substring(0, 500)
      };
    });
    
    console.log('Current URL:', dashboardAnalysis.url);
    console.log('Auth Debug Messages:', dashboardAnalysis.authDebugMessages);
    console.log('Has UnifiedLayout:', dashboardAnalysis.hasUnifiedLayout);
    console.log('Components Present:', dashboardAnalysis.components);
    console.log('Sidebar Info:', dashboardAnalysis.sidebarInfo);
    console.log('Navigation Elements Found:', dashboardAnalysis.navigationElements);
    console.log('Errors:', dashboardAnalysis.errors);
    console.log('Body Classes:', dashboardAnalysis.bodyClasses);
    
    // Test 2: Try to manually trigger sidebar visibility
    console.log('\n🔧 Manual Sidebar Trigger Test:');
    
    const manualTrigger = await page.evaluate(() => {
      const results = [];
      
      // Try to find and click any sidebar-related buttons
      const potentialTriggers = document.querySelectorAll(`
        button[aria-label*="sidebar"],
        button[aria-label*="menu"],
        button[class*="menu"],
        button[class*="sidebar"],
        .verotrade-mobile-menu-btn,
        [data-testid*="sidebar"],
        [data-testid*="menu"]
      `);
      
      potentialTriggers.forEach((btn, index) => {
        const isVisible = window.getComputedStyle(btn).display !== 'none';
        results.push({
          index,
          tagName: btn.tagName,
          className: btn.className,
          ariaLabel: btn.getAttribute('aria-label'),
          visible: isVisible,
          text: btn.textContent.trim()
        });
        
        if (isVisible) {
          try {
            btn.click();
            results[index].clicked = true;
          } catch (e) {
            results[index].clicked = false;
            results[index].error = e.message;
          }
        }
      });
      
      // Try to dispatch custom events that might trigger sidebar
      try {
        window.dispatchEvent(new CustomEvent('toggleSidebar', {}));
        window.dispatchEvent(new CustomEvent('openSidebar', {}));
        window.dispatchEvent(new CustomEvent('sidebarOpen', {}));
        results.push({ action: 'dispatched toggle events' });
      } catch (e) {
        results.push({ action: 'event dispatch failed', error: e.message });
      }
      
      return results;
    });
    
    console.log('Manual Trigger Results:', manualTrigger);
    
    // Wait a moment to see if sidebar appears
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Check if sidebar appeared after triggers
    console.log('\n👀 Post-Trigger Sidebar Check:');
    
    const postTriggerCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar-overlay');
      if (sidebar) {
        const computedStyle = window.getComputedStyle(sidebar);
        return {
          exists: true,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          transform: computedStyle.transform,
          opacity: computedStyle.opacity
        };
      }
      return { exists: false };
    });
    
    console.log('Sidebar after trigger:', postTriggerCheck);
    
    // Test 4: Check for React component mounting issues
    console.log('\n⚛️ React Component Check:');
    
    const reactCheck = await page.evaluate(() => {
      // Check if React is properly loaded
      const hasReact = typeof window.React !== 'undefined';
      const hasReactDOM = typeof window.ReactDOM !== 'undefined';
      
      // Check for any React-related errors in console
      const reactErrors = [];
      
      return {
        hasReact,
        hasReactDOM,
        reactVersion: hasReact ? window.React.version : 'N/A'
      };
    });
    
    console.log('React Check:', reactCheck);
    
    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('='.repeat(40));
    console.log('1. UnifiedLayout present:', dashboardAnalysis.hasUnifiedLayout ? '✅' : '❌');
    console.log('2. Sidebar component exists:', dashboardAnalysis.components.sidebar ? '✅' : '❌');
    console.log('3. Sidebar visible:', dashboardAnalysis.sidebarInfo?.exists && dashboardAnalysis.sidebarInfo.display !== 'none' ? '✅' : '❌');
    console.log('4. Top navigation exists:', dashboardAnalysis.components.topNav ? '✅' : '❌');
    console.log('5. Mobile menu exists:', dashboardAnalysis.components.mobileMenu ? '✅' : '❌');
    
    if (dashboardAnalysis.sidebarInfo?.exists) {
      const styles = dashboardAnalysis.sidebarInfo;
      const isVisible = styles.display !== 'none' && 
                     styles.visibility !== 'hidden' && 
                     styles.opacity !== '0';
      console.log('6. Sidebar is actually visible:', isVisible ? '✅' : '❌');
    }
    
    console.log('\n💡 LIKELY ISSUES:');
    if (!dashboardAnalysis.hasUnifiedLayout) {
      console.log('- UnifiedLayout is not being used on dashboard');
    }
    if (!dashboardAnalysis.components.sidebar) {
      console.log('- Sidebar component is not rendering at all');
    }
    if (dashboardAnalysis.sidebarInfo?.exists && dashboardAnalysis.sidebarInfo.display === 'none') {
      console.log('- Sidebar exists but is hidden by CSS');
    }
    if (dashboardAnalysis.sidebarInfo?.exists && dashboardAnalysis.sidebarInfo.transform.includes('translateX(-100%)')) {
      console.log('- Sidebar exists but is translated off-screen');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    setTimeout(() => browser.close(), 5000);
  }
}

debugAuthenticatedSidebar();