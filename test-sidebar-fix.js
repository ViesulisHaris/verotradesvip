// TEST SIDEBAR FIX
const puppeteer = require('puppeteer');

async function testSidebarFix() {
  console.log('🔧 TESTING SIDEBAR FIX');
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
    
    // Test 1: Go to dashboard
    console.log('\n📊 Testing Dashboard with Layout Fix:');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const dashboardAnalysis = await page.evaluate(() => {
      // Check for sidebar components
      const sidebar = document.querySelector('.verotrade-sidebar-overlay');
      const topNav = document.querySelector('.verotrade-persistent-top-nav');
      const mobileMenu = document.querySelector('.verotrade-mobile-menu-btn');
      const mainContent = document.querySelector('.verotrade-main-content');
      
      // Check if UnifiedLayout is being used
      const unifiedLayoutElements = document.querySelectorAll('[class*="verotrade-"]');
      const hasUnifiedLayout = unifiedLayoutElements.length > 0;
      
      return {
        url: window.location.href,
        hasUnifiedLayout,
        components: {
          sidebar: !!sidebar,
          topNav: !!topNav,
          mobileMenu: !!mobileMenu,
          mainContent: !!mainContent
        },
        authDebugMessages: Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent && el.textContent.includes('AuthGuard State:'))
          .map(el => el.textContent.trim())
      };
    });
    
    console.log('Current URL:', dashboardAnalysis.url);
    console.log('Has UnifiedLayout:', dashboardAnalysis.hasUnifiedLayout);
    console.log('Components Present:', dashboardAnalysis.components);
    console.log('Auth Debug Messages:', dashboardAnalysis.authDebugMessages);
    
    // Test 2: Try to manually trigger sidebar if it exists
    if (dashboardAnalysis.components.sidebar) {
      console.log('\n🔧 Testing Sidebar Functionality:');
      
      const sidebarTest = await page.evaluate(() => {
        const sidebar = document.querySelector('.verotrade-sidebar-overlay');
        const mobileMenuBtn = document.querySelector('.verotrade-mobile-menu-btn');
        
        if (sidebar) {
          const styles = window.getComputedStyle(sidebar);
          return {
            exists: true,
            display: styles.display,
            visibility: styles.visibility,
            transform: styles.transform,
            opacity: styles.opacity,
            width: styles.width
          };
        }
        
        return { exists: false };
      });
      
      console.log('Sidebar Info:', sidebarTest);
      
      // Try to click mobile menu button if it exists
      if (dashboardAnalysis.components.mobileMenu) {
        await page.evaluate(() => {
          const btn = document.querySelector('.verotrade-mobile-menu-btn');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        
        // Wait for sidebar to open
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const afterClickTest = await page.evaluate(() => {
          const sidebar = document.querySelector('.verotrade-sidebar-overlay');
          if (sidebar) {
            const styles = window.getComputedStyle(sidebar);
            return {
              display: styles.display,
              transform: styles.transform,
              visibility: styles.visibility
            };
          }
          return null;
        });
        
        console.log('Sidebar after mobile menu click:', afterClickTest);
      }
    }
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('='.repeat(40));
    console.log('1. UnifiedLayout present:', dashboardAnalysis.hasUnifiedLayout ? '✅' : '❌');
    console.log('2. Sidebar component exists:', dashboardAnalysis.components.sidebar ? '✅' : '❌');
    console.log('3. Top navigation exists:', dashboardAnalysis.components.topNav ? '✅' : '❌');
    console.log('4. Mobile menu exists:', dashboardAnalysis.components.mobileMenu ? '✅' : '❌');
    
    if (dashboardAnalysis.components.sidebar) {
      const styles = dashboardAnalysis.components.sidebar ? 
        await page.evaluate(() => {
          const sidebar = document.querySelector('.verotrade-sidebar-overlay');
          return window.getComputedStyle(sidebar);
        }) : null;
      
      if (styles) {
        const isVisible = styles.display !== 'none' && 
                       styles.visibility !== 'hidden' && 
                       styles.opacity !== '0';
        console.log('5. Sidebar is visible:', isVisible ? '✅' : '❌');
      }
    }
    
    console.log('\n💡 OVERALL RESULT:');
    if (dashboardAnalysis.hasUnifiedLayout && 
        dashboardAnalysis.components.sidebar && 
        dashboardAnalysis.components.topNav && 
        dashboardAnalysis.components.mobileMenu) {
      console.log('🎉 SUCCESS: Sidebar and navigation are now working for authenticated users!');
    } else {
      console.log('❌ ISSUES REMAINING: Some components are still missing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    setTimeout(() => browser.close(), 3000);
  }
}

testSidebarFix();