const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting Sidebar State Debug Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]') || msg.text().includes('[SIDEBAR_OPTIMIZED]') || msg.text().includes('🔍')) {
      console.log(msg.text());
    }
  });
  
  try {
    // Navigate to login page first
    await page.goto('http://localhost:3000/login');
    console.log('📍 Navigated to login page');
    
    // Login with test credentials
    await page.fill('[type="email"]', 'test@example.com');
    await page.fill('[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in and reached dashboard');
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    // Add debug script to check sidebar state and overlay divs
    await page.evaluate(() => {
      console.log('🔍 [DEBUG] Starting comprehensive sidebar diagnostics...');
      
      // Function to check all overlay divs in the sidebar
      function checkOverlayDivs() {
        console.log('🔍 [DEBUG] Checking overlay divs...');
        
        // Find all elements with absolute positioning that might be overlays
        const overlayDivs = document.querySelectorAll('div[class*="absolute"]');
        console.log(`🔍 [DEBUG] Found ${overlayDivs.length} absolute positioned divs`);
        
        overlayDivs.forEach((div, index) => {
          const styles = window.getComputedStyle(div);
          const pointerEvents = styles.pointerEvents;
          const zIndex = styles.zIndex;
          const position = styles.position;
          const className = div.className;
          const parent = div.parentElement;
          
          console.log(`🔍 [DEBUG] Overlay ${index + 1}:`);
          console.log(`🔍 [DEBUG]   - className: ${className}`);
          console.log(`🔍 [DEBUG]   - pointerEvents: ${pointerEvents}`);
          console.log(`🔍 [DEBUG]   - zIndex: ${zIndex}`);
          console.log(`🔍 [DEBUG]   - position: ${position}`);
          
          // Check if this is a gradient overlay
          if (className.includes('bg-gradient-to-r') || className.includes('group-hover:opacity-100')) {
            console.log(`🔍 [DEBUG]   - Type: Gradient overlay`);
            
            if (pointerEvents !== 'none') {
              console.log(`🔍 [DEBUG]   ❌ CRITICAL: Gradient overlay ${index + 1} is intercepting pointer events!`);
            } else {
              console.log(`🔍 [DEBUG]   ✅ Gradient overlay ${index + 1} has pointer-events: none`);
            }
            
            // Check if parent is interactive
            if (parent) {
              const parentTag = parent.tagName.toLowerCase();
              const isInteractive = parentTag === 'button' || parentTag === 'a' || parent.getAttribute('role') === 'menuitem';
              console.log(`🔍 [DEBUG]   - Parent tag: ${parentTag}, isInteractive: ${isInteractive}`);
              
              if (isInteractive) {
                console.log(`🔍 [DEBUG]   - Parent is interactive element`);
              }
            }
          }
        });
      }
      
      // Function to check sidebar state and styles
      function checkSidebarState() {
        console.log('🔍 [DEBUG] Checking sidebar state...');
        
        const sidebar = document.querySelector('aside[class*="sidebar"]');
        if (!sidebar) {
          console.log('🔍 [DEBUG] ❌ Sidebar element not found');
          return null;
        }
        
        const styles = window.getComputedStyle(sidebar);
        const inlineStyles = sidebar.style;
        
        console.log('🔍 [DEBUG] Sidebar computed styles:');
        console.log(`🔍 [DEBUG]   - width: ${styles.width}`);
        console.log(`🔍 [DEBUG]   - minWidth: ${styles.minWidth}`);
        console.log(`🔍 [DEBUG]   - maxWidth: ${styles.maxWidth}`);
        console.log(`🔍 [DEBUG]   - transform: ${styles.transform}`);
        console.log(`🔍 [DEBUG]   - transition: ${styles.transition}`);
        console.log(`🔍 [DEBUG]   - position: ${styles.position}`);
        console.log(`🔍 [DEBUG]   - zIndex: ${styles.zIndex}`);
        
        console.log('🔍 [DEBUG] Sidebar inline styles:');
        console.log(`🔍 [DEBUG]   - width: ${inlineStyles.width}`);
        console.log(`🔍 [DEBUG]   - transform: ${inlineStyles.transform}`);
        console.log(`🔍 [DEBUG]   - transition: ${inlineStyles.transition}`);
        
        // Check CSS classes
        console.log(`🔍 [DEBUG]   - className: ${sidebar.className}`);
        const isCollapsedClass = sidebar.className.includes('sidebar-collapsed');
        const isExpandedClass = sidebar.className.includes('sidebar-expanded');
        console.log(`🔍 [DEBUG]   - has collapsed class: ${isCollapsedClass}`);
        console.log(`🔍 [DEBUG]   - has expanded class: ${isExpandedClass}`);
        
        // Determine actual state
        const actualWidth = parseInt(styles.width);
        const isCollapsed = actualWidth <= 64;
        console.log(`🔍 [DEBUG]   - actual width: ${actualWidth}px, isCollapsed: ${isCollapsed}`);
        
        return {
          width: styles.width,
          inlineWidth: inlineStyles.width,
          transform: styles.transform,
          transition: styles.transition,
          isCollapsed
        };
      }
      
      // Function to check toggle button
      function checkToggleButton() {
        console.log('🔍 [DEBUG] Checking toggle button...');
        
        const toggleButton = document.querySelector('[title="Toggle sidebar"]');
        if (!toggleButton) {
          console.log('🔍 [DEBUG] ❌ Toggle button not found');
          return;
        }
        
        const styles = window.getComputedStyle(toggleButton);
        console.log('🔍 [DEBUG] Toggle button styles:');
        console.log(`🔍 [DEBUG]   - pointerEvents: ${styles.pointerEvents}`);
        console.log(`🔍 [DEBUG]   - zIndex: ${styles.zIndex}`);
        console.log(`🔍 [DEBUG]   - position: ${styles.position}`);
        console.log(`🔍 [DEBUG]   - display: ${styles.display}`);
        
        // Check for overlay children
        const overlays = toggleButton.querySelectorAll('div[class*="absolute"]');
        console.log(`🔍 [DEBUG]   - overlay children: ${overlays.length}`);
        
        overlays.forEach((overlay, index) => {
          const overlayStyles = window.getComputedStyle(overlay);
          console.log(`🔍 [DEBUG]     - overlay ${index + 1} pointerEvents: ${overlayStyles.pointerEvents}`);
          
          if (overlayStyles.pointerEvents !== 'none') {
            console.log(`🔍 [DEBUG]     ❌ CRITICAL: Toggle button overlay ${index + 1} is blocking clicks!`);
          }
        });
      }
      
      // Function to check menu items
      function checkMenuItems() {
        console.log('🔍 [DEBUG] Checking menu items...');
        
        const menuItems = document.querySelectorAll('nav a, nav button, [role="menuitem"]');
        console.log(`🔍 [DEBUG] Found ${menuItems.length} menu items`);
        
        menuItems.forEach((item, index) => {
          const styles = window.getComputedStyle(item);
          const className = item.className;
          
          console.log(`🔍 [DEBUG] Menu Item ${index + 1}:`);
          console.log(`🔍 [DEBUG]   - className: ${className}`);
          console.log(`🔍 [DEBUG]   - pointerEvents: ${styles.pointerEvents}`);
          console.log(`🔍 [DEBUG]   - cursor: ${styles.cursor}`);
          
          // Check for overlay children
          const overlays = item.querySelectorAll('div[class*="absolute"]');
          if (overlays.length > 0) {
            console.log(`🔍 [DEBUG]   - overlay children: ${overlays.length}`);
            
            overlays.forEach((overlay, overlayIndex) => {
              const overlayStyles = window.getComputedStyle(overlay);
              console.log(`🔍 [DEBUG]     - overlay ${overlayIndex + 1} pointerEvents: ${overlayStyles.pointerEvents}`);
              
              if (overlayStyles.pointerEvents !== 'none') {
                console.log(`🔍 [DEBUG]     ❌ CRITICAL: Menu item overlay is blocking interactions!`);
              }
            });
          }
        });
      }
      
      // Run initial checks
      console.log('🔍 [DEBUG] === INITIAL STATE ===');
      const initialState = checkSidebarState();
      checkOverlayDivs();
      checkToggleButton();
      checkMenuItems();
      
      // Try to toggle the sidebar
      setTimeout(() => {
        console.log('🔍 [DEBUG] === TOGGLE TEST ===');
        const toggleButton = document.querySelector('[title="Toggle sidebar"]');
        if (toggleButton) {
          console.log('🔍 [DEBUG] Clicking toggle button...');
          toggleButton.click();
          
          // Wait for transition to complete
          setTimeout(() => {
            console.log('🔍 [DEBUG] === AFTER TOGGLE ===');
            const afterState = checkSidebarState();
            
            if (initialState && afterState) {
              const widthChanged = initialState.width !== afterState.width;
              const stateChanged = initialState.isCollapsed !== afterState.isCollapsed;
              console.log(`🔍 [DEBUG] Width changed: ${widthChanged}`);
              console.log(`🔍 [DEBUG] State changed: ${stateChanged}`);
              
              if (!widthChanged) {
                console.log('🔍 [DEBUG] ❌ CRITICAL: Sidebar width did not change after toggle!');
              }
              
              if (!stateChanged) {
                console.log('🔍 [DEBUG] ❌ CRITICAL: Sidebar collapsed state did not change after toggle!');
              }
            }
          }, 500);
        } else {
          console.log('🔍 [DEBUG] ❌ Could not find toggle button to test');
        }
      }, 1000);
    });
    
    // Wait for all checks to complete
    await page.waitForTimeout(4000);
    
    // Take screenshot
    await page.screenshot({ path: './debug-screenshots/sidebar-state-debug.png' });
    console.log('📸 Screenshot taken');
    
  } catch (error) {
    console.error('❌ Error during debug test:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🔍 Sidebar State Debug Test completed');
})();