const puppeteer = require('puppeteer');

async function investigateCSSIssues() {
  console.log('🎨 CSS INVESTIGATION TEST');
  console.log('============================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from page
  page.on('console', msg => {
    console.log('🌐 BROWSER CONSOLE:', msg.text());
  });
  
  // Enable network request logging
  page.on('request', request => {
    if (request.url().includes('css') || request.url().includes('styles')) {
      console.log('📡 CSS REQUEST:', request.url());
    }
  });
  
  try {
    console.log('\n📍 Step 1: Navigate to direct sidebar test page...');
    await page.goto('http://localhost:3000/test-sidebar-direct', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🎨 Step 2: Inject mock user to bypass authentication...');
    // Inject a mock user into the page context
    await page.evaluate(() => {
      // Mock user data
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };
      
      // Override the useAuth hook by modifying the window
      if (typeof window !== 'undefined') {
        // Create a mock auth context
        window.__MOCK_AUTH_CONTEXT__ = {
          user: mockUser,
          loading: false,
          authInitialized: true
        };
        
        console.log('🔧 Mock user injected:', mockUser);
        
        // Trigger a re-render by dispatching a custom event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { user: mockUser }
        }));
      }
    });
    
    // Wait for re-render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n🔍 Step 3: Check sidebar DOM after mock user injection...');
    const sidebarCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
      if (!sidebar) {
        return {
          exists: false,
          message: 'Sidebar element not found'
        };
      }
      
      const styles = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      
      return {
        exists: true,
        tagName: sidebar.tagName,
        className: sidebar.className,
        id: sidebar.id,
        display: styles.display,
        visibility: styles.visibility,
        transform: styles.transform,
        zIndex: styles.zIndex,
        width: styles.width,
        height: styles.height,
        left: styles.left,
        top: styles.top,
        position: styles.position,
        rect: {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y
        },
        computedTransform: styles.transform,
        isInViewport: rect.width > 0 && rect.height > 0,
        // Check if it's actually visible on screen
        isHidden: styles.display === 'none' || styles.visibility === 'hidden' || styles.transform.includes('translateX(-100%)'),
        // Check for potential CSS issues
        hasNegativeTransform: styles.transform && styles.transform.includes('translateX(-100%)'),
        hasDisplayNone: styles.display === 'none',
        hasVisibilityHidden: styles.visibility === 'hidden',
        // Check parent elements
        parentDisplay: sidebar.parentElement ? window.getComputedStyle(sidebar.parentElement).display : 'no-parent',
        parentVisibility: sidebar.parentElement ? window.getComputedStyle(sidebar.parentElement).visibility : 'no-parent'
      };
    });
    
    console.log('Sidebar Check Results:', sidebarCheck);
    
    console.log('\n🎯 Step 4: Check mobile menu button...');
    const mobileButtonCheck = await page.evaluate(() => {
      const button = document.querySelector('.verotrade-mobile-menu-btn');
      if (!button) {
        return {
          exists: false,
          message: 'Mobile menu button not found'
        };
      }
      
      const styles = window.getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      
      return {
        exists: true,
        tagName: button.tagName,
        className: button.className,
        display: styles.display,
        visibility: styles.visibility,
        transform: styles.transform,
        zIndex: styles.zIndex,
        width: styles.width,
        height: styles.height,
        rect: {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y
        },
        isInViewport: rect.width > 0 && rect.height > 0,
        isHidden: styles.display === 'none' || styles.visibility === 'hidden'
      };
    });
    
    console.log('Mobile Button Check Results:', mobileButtonCheck);
    
    console.log('\n🖱️ Step 5: Test manual sidebar opening...');
    // Try to manually open the sidebar
    const manualOpenResult = await page.evaluate(() => {
      const sidebar = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
      if (!sidebar) {
        return { success: false, message: 'Sidebar not found' };
      }
      
      // Try to remove the transform that hides it
      const originalTransform = sidebar.style.transform;
      sidebar.style.transform = 'translateX(0)';
      
      // Check if it's now visible
      const newStyles = window.getComputedStyle(sidebar);
      const newRect = sidebar.getBoundingClientRect();
      
      return {
        success: true,
        originalTransform: originalTransform,
        newTransform: newStyles.transform,
        newRect: {
          width: newRect.width,
          height: newRect.height,
          x: newRect.x,
          y: newRect.y
        },
        isVisible: newRect.width > 0 && newRect.height > 0 && newStyles.transform === 'translateX(0)'
      };
    });
    
    console.log('Manual Open Results:', manualOpenResult);
    
    console.log('\n📸 Step 6: Take screenshot...');
    const screenshot = await page.screenshot({ 
      path: 'css-investigation-screenshot.png',
      fullPage: true 
    });
    console.log('Screenshot saved: css-investigation-screenshot.png');
    
    console.log('\n🔍 Step 7: Check CSS variables and computed styles...');
    const cssCheck = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const sidebar = document.querySelector('.verotrade-sidebar, .verotrade-sidebar-overlay');
      
      return {
        cssVariables: {
          '--deep-charcoal': rootStyles.getPropertyValue('--deep-charcoal'),
          '--dusty-gold': rootStyles.getPropertyValue('--dusty-gold'),
          '--sidebar-width': rootStyles.getPropertyValue('--sidebar-width'),
          '--sidebar-collapsed-width': rootStyles.getPropertyValue('--sidebar-collapsed-width')
        },
        sidebarElement: sidebar ? {
          position: window.getComputedStyle(sidebar).position,
          zIndex: window.getComputedStyle(sidebar).zIndex,
          transform: window.getComputedStyle(sidebar).transform,
          width: window.getComputedStyle(sidebar).width,
          height: window.getComputedStyle(sidebar).height,
          display: window.getComputedStyle(sidebar).display,
          visibility: window.getComputedStyle(sidebar).visibility,
          backgroundColor: window.getComputedStyle(sidebar).backgroundColor,
          backdropFilter: window.getComputedStyle(sidebar).backdropFilter
        } : null
      };
    });
    
    console.log('CSS Check Results:', cssCheck);
    
    console.log('\n🎯 Step 8: Check for overlay elements...');
    const overlayCheck = await page.evaluate(() => {
      const overlays = document.querySelectorAll('[class*="overlay"]');
      const mobileOverlay = document.querySelector('.verotrade-mobile-overlay');
      const desktopOverlay = document.querySelector('.verotrade-desktop-overlay');
      
      return {
        totalOverlays: overlays.length,
        overlayElements: Array.from(overlays).map(el => ({
          tagName: el.tagName,
          className: el.className,
          display: window.getComputedStyle(el).display,
          visibility: window.getComputedStyle(el).visibility,
          zIndex: window.getComputedStyle(el).zIndex
        })),
        mobileOverlay: mobileOverlay ? {
          exists: true,
          display: window.getComputedStyle(mobileOverlay).display,
          visibility: window.getComputedStyle(mobileOverlay).visibility,
          opacity: window.getComputedStyle(mobileOverlay).opacity
        } : { exists: false },
        desktopOverlay: desktopOverlay ? {
          exists: true,
          display: window.getComputedStyle(desktopOverlay).display,
          visibility: window.getComputedStyle(desktopOverlay).visibility,
          opacity: window.getComputedStyle(desktopOverlay).opacity
        } : { exists: false }
      };
    });
    
    console.log('Overlay Check Results:', overlayCheck);
    
  } catch (error) {
    console.error('❌ Investigation Error:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 CSS INVESTIGATION COMPLETE');
  console.log('============================');
}

// Run the investigation
investigateCSSIssues().catch(console.error);