const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting Pointer Events Debug Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
      console.log(msg.text());
    }
  });
  
  try {
    // Navigate to dashboard directly (assuming already logged in)
    await page.goto('http://localhost:3000/dashboard');
    console.log('📍 Navigated to dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Add debug script to check pointer events
    await page.evaluate(() => {
      console.log('[DEBUG] Starting pointer events diagnostics...');
      
      // Function to check all elements with absolute positioning
      function checkAbsoluteElements() {
        const absoluteElements = document.querySelectorAll('[class*="absolute"]');
        console.log(`[DEBUG] Found ${absoluteElements.length} elements with absolute positioning`);
        
        absoluteElements.forEach((element, index) => {
          const styles = window.getComputedStyle(element);
          const pointerEvents = styles.pointerEvents;
          const zIndex = styles.zIndex;
          const position = styles.position;
          const className = element.className;
          const parent = element.parentElement;
          
          console.log(`[DEBUG] Absolute Element ${index + 1}:`);
          console.log(`[DEBUG]   - className: ${className}`);
          console.log(`[DEBUG]   - pointerEvents: ${pointerEvents}`);
          console.log(`[DEBUG]   - zIndex: ${zIndex}`);
          console.log(`[DEBUG]   - position: ${position}`);
          
          if (pointerEvents !== 'none') {
            console.log(`[DEBUG]   ❌ ISSUE: Element ${index + 1} is intercepting pointer events!`);
            
            // Check if this element is overlaying interactive elements
            if (parent) {
              const parentStyles = window.getComputedStyle(parent);
              console.log(`[DEBUG]   - parent className: ${parent.className}`);
              console.log(`[DEBUG]   - parent position: ${parentStyles.position}`);
              
              // Check if parent has interactive elements
              const interactiveElements = parent.querySelectorAll('button, a, [role="button"]');
              console.log(`[DEBUG]   - parent has ${interactiveElements.length} interactive elements`);
              
              if (interactiveElements.length > 0) {
                console.log(`[DEBUG]   ❌ CRITICAL: This overlay is blocking interactive elements!`);
              }
            }
          } else {
            console.log(`[DEBUG]   ✅ Element ${index + 1} has pointer-events: none`);
          }
        });
      }
      
      // Function to check toggle button specifically
      function checkToggleButton() {
        const toggleButton = document.querySelector('[title="Toggle sidebar"]');
        if (!toggleButton) {
          console.log('[DEBUG] ❌ Toggle button not found');
          return;
        }
        
        console.log('[DEBUG] Checking toggle button...');
        const styles = window.getComputedStyle(toggleButton);
        const pointerEvents = styles.pointerEvents;
        const zIndex = styles.zIndex;
        const position = styles.position;
        
        console.log(`[DEBUG]   - pointerEvents: ${pointerEvents}`);
        console.log(`[DEBUG]   - zIndex: ${zIndex}`);
        console.log(`[DEBUG]   - position: ${position}`);
        
        // Check for overlay children
        const overlays = toggleButton.querySelectorAll('div[class*="absolute"]');
        console.log(`[DEBUG]   - overlay children: ${overlays.length}`);
        
        overlays.forEach((overlay, index) => {
          const overlayStyles = window.getComputedStyle(overlay);
          console.log(`[DEBUG]     - overlay ${index + 1} pointerEvents: ${overlayStyles.pointerEvents}`);
          
          if (overlayStyles.pointerEvents !== 'none') {
            console.log(`[DEBUG]     ❌ CRITICAL: Toggle button overlay ${index + 1} is blocking clicks!`);
          }
        });
      }
      
      // Function to check sidebar menu items
      function checkMenuItems() {
        const menuItems = document.querySelectorAll('nav a, nav button, [role="menuitem"]');
        console.log(`[DEBUG] Found ${menuItems.length} menu items`);
        
        menuItems.forEach((item, index) => {
          const styles = window.getComputedStyle(item);
          const pointerEvents = styles.pointerEvents;
          const className = item.className;
          
          console.log(`[DEBUG] Menu Item ${index + 1}:`);
          console.log(`[DEBUG]   - className: ${className}`);
          console.log(`[DEBUG]   - pointerEvents: ${pointerEvents}`);
          
          // Check for overlay children
          const overlays = item.querySelectorAll('div[class*="absolute"]');
          if (overlays.length > 0) {
            console.log(`[DEBUG]   - overlay children: ${overlays.length}`);
            
            overlays.forEach((overlay, overlayIndex) => {
              const overlayStyles = window.getComputedStyle(overlay);
              console.log(`[DEBUG]     - overlay ${overlayIndex + 1} pointerEvents: ${overlayStyles.pointerEvents}`);
              
              if (overlayStyles.pointerEvents !== 'none') {
                console.log(`[DEBUG]     ❌ CRITICAL: Menu item overlay is blocking interactions!`);
              }
            });
          }
        });
      }
      
      // Run all checks
      checkAbsoluteElements();
      checkToggleButton();
      checkMenuItems();
    });
    
    // Take screenshot
    await page.screenshot({ path: './debug-screenshots/pointer-events-debug.png' });
    console.log('📸 Screenshot taken');
    
  } catch (error) {
    console.error('❌ Error during debug test:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🔍 Pointer Events Debug Test completed');
})();