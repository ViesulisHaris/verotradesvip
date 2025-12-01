const puppeteer = require('puppeteer');
const path = require('path');

async function diagnoseSidebarVisibility() {
  console.log('🔍 SIDEBAR VISIBILITY DIAGNOSTIC TEST');
  console.log('=====================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🌐 BROWSER CONSOLE:', msg.text());
  });
  
  // Enable request/response logging
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      console.log('📡 AUTH REQUEST:', request.url());
    }
  });
  
  try {
    console.log('\n📍 Step 1: Navigate to dashboard page...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Step 2: Check authentication state...');
    const authState = await page.evaluate(() => {
      const authContext = window.__AUTH_CONTEXT__ || {};
      return {
        user: authContext.user || null,
        loading: authContext.loading || false,
        authInitialized: authContext.authInitialized || false
      };
    });
    console.log('Authentication State:', authState);
    
    console.log('\n🎯 Step 3: Check sidebar DOM existence...');
    const sidebarExists = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay, [class*="sidebar"]');
      return {
        exists: !!sidebar,
        tagName: sidebar?.tagName,
        className: sidebar?.className,
        id: sidebar?.id,
        display: window.getComputedStyle(sidebar)?.display,
        visibility: window.getComputedStyle(sidebar)?.visibility,
        transform: window.getComputedStyle(sidebar)?.transform,
        zIndex: window.getComputedStyle(sidebar)?.zIndex,
        width: window.getComputedStyle(sidebar)?.width,
        height: window.getComputedStyle(sidebar)?.height,
        left: window.getComputedStyle(sidebar)?.left,
        top: window.getComputedStyle(sidebar)?.top,
        position: window.getComputedStyle(sidebar)?.position
      };
    });
    console.log('Sidebar DOM Analysis:', sidebarExists);
    
    console.log('\n📱 Step 4: Check mobile menu button...');
    const mobileMenuButton = await page.evaluate(() => {
      const button = document.querySelector('.verotrade-mobile-menu-btn');
      if (!button) return { exists: false };
      
      const styles = window.getComputedStyle(button);
      return {
        exists: true,
        display: styles.display,
        visibility: styles.visibility,
        zIndex: styles.zIndex,
        width: styles.width,
        height: styles.height,
        position: styles.position
      };
    });
    console.log('Mobile Menu Button:', mobileMenuButton);
    
    console.log('\n🎨 Step 5: Check CSS variables and styles...');
    const cssAnalysis = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const sidebarStyles = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
      const computedStyles = sidebarStyles ? getComputedStyle(sidebarStyles) : null;
      
      return {
        cssVariables: {
          '--deep-charcoal': rootStyles.getPropertyValue('--deep-charcoal'),
          '--dusty-gold': rootStyles.getPropertyValue('--dusty-gold'),
          '--sidebar-width': rootStyles.getPropertyValue('--sidebar-width'),
          '--sidebar-collapsed-width': rootStyles.getPropertyValue('--sidebar-collapsed-width')
        },
        sidebarComputedStyles: computedStyles ? {
          backgroundColor: computedStyles.backgroundColor,
          transform: computedStyles.transform,
          transition: computedStyles.transition,
          backdropFilter: computedStyles.backdropFilter
        } : null
      };
    });
    console.log('CSS Analysis:', cssAnalysis);
    
    console.log('\n📦 Step 6: Check component rendering...');
    const componentCheck = await page.evaluate(() => {
      // Check for React component roots
      const reactRoots = document.querySelectorAll('[data-reactroot], [data-react-checksum], #__next > div > div');
      
      // Check for UnifiedLayout
      const unifiedLayout = Array.from(reactRoots).find(root => 
        root.textContent && root.textContent.includes('UnifiedLayout')
      );
      
      // Check for UnifiedSidebar
      const unifiedSidebar = Array.from(reactRoots).find(root => 
        root.textContent && root.textContent.includes('UnifiedSidebar')
      );
      
      return {
        reactRootsCount: reactRoots.length,
        hasUnifiedLayout: !!unifiedLayout,
        hasUnifiedSidebar: !!unifiedSidebar,
        bodyChildren: document.body.children.length,
        bodyInnerHTML: document.body.innerHTML.substring(0, 500) + '...'
      };
    });
    console.log('Component Analysis:', componentCheck);
    
    console.log('\n🖱️ Step 7: Test manual sidebar toggle...');
    // Try to find and click any sidebar toggle buttons
    const toggleResult = await page.evaluate(() => {
      const selectors = [
        '.verotrade-mobile-menu-btn',
        '[aria-label*="menu"]',
        '[aria-label*="sidebar"]',
        '.unified-toggle-btn',
        'button[class*="menu"]',
        'button[class*="sidebar"]'
      ];
      
      const buttons = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => buttons.push({
          selector,
          text: el.textContent,
          ariaLabel: el.getAttribute('aria-label'),
          visible: el.offsetParent !== null
        }));
      }
      
      return buttons;
    });
    console.log('Toggle Buttons Found:', toggleResult);
    
    // Try clicking the first visible button
    const visibleButton = toggleResult.find(btn => btn.visible);
    if (visibleButton) {
      console.log(`\n🖱️ Clicking toggle button: ${visibleButton.selector}`);
      await page.click(visibleButton.selector);
      await page.waitForTimeout(1000);
      
      // Check sidebar state after click
      const sidebarAfterClick = await page.evaluate(() => {
        const sidebar = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
        if (!sidebar) return { exists: false };
        
        const styles = window.getComputedStyle(sidebar);
        return {
          exists: true,
          transform: styles.transform,
          visibility: styles.visibility,
          opacity: styles.opacity,
          display: styles.display
        };
      });
      console.log('Sidebar State After Click:', sidebarAfterClick);
    }
    
    console.log('\n📸 Step 8: Taking screenshot...');
    const screenshot = await page.screenshot({ 
      path: 'sidebar-diagnostic-screenshot.png',
      fullPage: true 
    });
    console.log('Screenshot saved: sidebar-diagnostic-screenshot.png');
    
    console.log('\n🔍 Step 9: Final DOM inspection...');
    const finalInspection = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const sidebarRelated = [];
      
      allElements.forEach(el => {
        const className = el.className || '';
        const id = el.id || '';
        const text = el.textContent || '';
        
        if (className.includes('sidebar') || 
            className.includes('menu') || 
            id.includes('sidebar') || 
            id.includes('menu') ||
            text.includes('VeroTrades') ||
            text.includes('Dashboard') ||
            text.includes('Trades')) {
          sidebarRelated.push({
            tagName: el.tagName,
            className: className,
            id: id,
            text: text.substring(0, 50),
            visible: el.offsetParent !== null,
            styles: {
              display: getComputedStyle(el).display,
              visibility: getComputedStyle(el).visibility,
              transform: getComputedStyle(el).transform,
              zIndex: getComputedStyle(el).zIndex
            }
          });
        }
      });
      
      return sidebarRelated.slice(0, 20); // Limit to first 20 elements
    });
    console.log('Final DOM Inspection:', finalInspection);
    
  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 DIAGNOSTIC COMPLETE');
  console.log('=====================================');
}

// Run the diagnostic
diagnoseSidebarVisibility().catch(console.error);