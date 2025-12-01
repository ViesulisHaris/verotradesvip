// AUTHENTICATED USER SIDEBAR TEST
const puppeteer = require('puppeteer');

async function testAuthenticatedSidebar() {
  console.log('🔍 AUTHENTICATED USER SIDEBAR TEST');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🌐 BROWSER:', msg.text());
    });
    
    // Test 1: Go to dashboard (should show sidebar if authenticated)
    console.log('\n📊 Dashboard Test (Authenticated User):');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Wait a bit for any authentication to settle
    await page.waitForTimeout(3000);
    
    const dashboardAnalysis = await page.evaluate(() => {
      // Check authentication state
      const authDebug = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && el.textContent.includes('AuthGuard State'))
        .map(el => el.textContent.trim());
      
      // Check for sidebar components
      const sidebar = document.querySelector('.verotrade-sidebar-overlay');
      const topNav = document.querySelector('.verotrade-persistent-top-nav');
      const mobileMenu = document.querySelector('.verotrade-mobile-menu-btn');
      const mainContent = document.querySelector('.verotrade-main-content');
      
      // Check sidebar visibility
      let sidebarStyles = null;
      if (sidebar) {
        sidebarStyles = {
          display: window.getComputedStyle(sidebar).display,
          visibility: window.getComputedStyle(sidebar).visibility,
          transform: window.getComputedStyle(sidebar).transform,
          opacity: window.getComputedStyle(sidebar).opacity,
          zIndex: window.getComputedStyle(sidebar).zIndex
        };
      }
      
      return {
        url: window.location.href,
        authDebugMessages: authDebug,
        components: {
          sidebar: !!sidebar,
          topNav: !!topNav,
          mobileMenu: !!mobileMenu,
          mainContent: !!mainContent
        },
        sidebarStyles: sidebarStyles,
        bodyText: document.body.innerText.substring(0, 300)
      };
    });
    
    console.log('Current URL:', dashboardAnalysis.url);
    console.log('Auth Debug Messages:', dashboardAnalysis.authDebugMessages);
    console.log('Components Present:', dashboardAnalysis.components);
    console.log('Sidebar Styles:', dashboardAnalysis.sidebarStyles);
    console.log('Body Text Sample:', dashboardAnalysis.bodyText);
    
    // Test 2: Try to manually trigger sidebar
    console.log('\n🔧 Manual Sidebar Trigger Test:');
    
    const manualTrigger = await page.evaluate(() => {
      // Try to find and click any sidebar toggle buttons
      const toggleButtons = document.querySelectorAll('[aria-label*="sidebar"], [aria-label*="menu"], button[class*="menu"]');
      const results = [];
      
      toggleButtons.forEach((btn, index) => {
        results.push({
          index,
          tagName: btn.tagName,
          ariaLabel: btn.getAttribute('aria-label'),
          className: btn.className,
          visible: window.getComputedStyle(btn).display !== 'none'
        });
        
        // Try clicking it
        try {
          btn.click();
          results[index].clicked = true;
        } catch (e) {
          results[index].clicked = false;
          results[index].error = e.message;
        }
      });
      
      return results;
    });
    
    console.log('Toggle Buttons Found:', manualTrigger);
    
    // Test 3: Check for JavaScript errors
    console.log('\n❌ JavaScript Errors Check:');
    
    const jsErrors = await page.evaluate(() => {
      // Check for any error messages in the console
      const errors = [];
      const originalError = console.error;
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    console.log('JS Errors:', jsErrors);
    
    // Test 4: Check if user is actually authenticated
    console.log('\n👤 Authentication State Check:');
    
    const authState = await page.evaluate(() => {
      // Try to access auth context from window
      return {
        hasAuthContext: !!window.__AUTH_CONTEXT__,
        hasUser: !!window.__USER__,
        localStorage: {
          hasAuth: !!localStorage.getItem('supabase.auth.token'),
          hasUser: !!localStorage.getItem('supabase.auth.user')
        },
        sessionStorage: {
          hasAuth: !!sessionStorage.getItem('supabase.auth.token'),
          hasUser: !!sessionStorage.getItem('supabase.auth.user')
        }
      };
    });
    
    console.log('Authentication State:', JSON.stringify(authState, null, 2));
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('Sidebar exists:', dashboardAnalysis.components.sidebar ? '✅' : '❌');
    console.log('Top nav exists:', dashboardAnalysis.components.topNav ? '✅' : '❌');
    console.log('Mobile menu exists:', dashboardAnalysis.components.mobileMenu ? '✅' : '❌');
    console.log('Main content exists:', dashboardAnalysis.components.mainContent ? '✅' : '❌');
    
    if (dashboardAnalysis.components.sidebar && dashboardAnalysis.sidebarStyles) {
      const styles = dashboardAnalysis.sidebarStyles;
      const isVisible = styles.display !== 'none' && 
                     styles.visibility !== 'hidden' && 
                     styles.opacity !== '0' &&
                     !styles.transform.includes('translateX(-100%)');
      console.log('Sidebar is visible:', isVisible ? '✅' : '❌');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    setTimeout(() => browser.close(), 5000); // Give time to see results
  }
}

testAuthenticatedSidebar();