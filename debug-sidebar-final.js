const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting Sidebar Final Debug Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: './debug-videos' }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
      console.log(msg.text());
    }
  });
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    console.log('📍 Navigated to login page');
    
    // Login with test credentials
    await page.fill('[type="email"]', 'test@example.com');
    await page.fill('[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in and reached dashboard');
    
    // Add debug script to check overlay divs and sidebar functionality
    await page.addInitScript(() => {
      console.log('[DEBUG] Starting sidebar diagnostics...');
      
      // Function to check overlay divs
      function checkOverlayDivs() {
        const overlays = document.querySelectorAll('div[class*="absolute"][class*="inset-0"]');
        console.log(`[DEBUG] Found ${overlays.length} overlay divs`);
        
        overlays.forEach((overlay, index) => {
          const styles = window.getComputedStyle(overlay);
          const pointerEvents = styles.pointerEvents;
          const zIndex = styles.zIndex;
          const position = styles.position;
          const className = overlay.className;
          
          console.log(`[DEBUG] Overlay ${index + 1}:`);
          console.log(`[DEBUG]   - className: ${className}`);
          console.log(`[DEBUG]   - pointerEvents: ${pointerEvents}`);
          console.log(`[DEBUG]   - zIndex: ${zIndex}`);
          console.log(`[DEBUG]   - position: ${position}`);
          
          if (pointerEvents !== 'none') {
            console.log(`[DEBUG]   ❌ ISSUE: Overlay ${index + 1} is intercepting pointer events!`);
          } else {
            console.log(`[DEBUG]   ✅ Overlay ${index + 1} has pointer-events: none`);
          }
        });
      }
      
      // Function to check sidebar state
      function checkSidebarState() {
        const sidebar = document.querySelector('[class*="sidebar"]');
        if (!sidebar) {
          console.log('[DEBUG] ❌ Sidebar element not found');
          return;
        }
        
        const styles = window.getComputedStyle(sidebar);
        const width = styles.width;
        const minWidth = styles.minWidth;
        const maxWidth = styles.maxWidth;
        const transform = styles.transform;
        const transition = styles.transition;
        
        console.log('[DEBUG] Sidebar state:');
        console.log(`[DEBUG]   - width: ${width}`);
        console.log(`[DEBUG]   - minWidth: ${minWidth}`);
        console.log(`[DEBUG]   - maxWidth: ${maxWidth}`);
        console.log(`[DEBUG]   - transform: ${transform}`);
        console.log(`[DEBUG]   - transition: ${transition}`);
        
        // Check if sidebar is expanded or collapsed
        const isExpanded = width === '256px';
        console.log(`[DEBUG]   - isExpanded: ${isExpanded}`);
        
        return {
          width,
          minWidth,
          maxWidth,
          transform,
          transition,
          isExpanded
        };
      }
      
      // Function to check toggle button
      function checkToggleButton() {
        const toggleButton = document.querySelector('[title="Toggle sidebar"]');
        if (!toggleButton) {
          console.log('[DEBUG] ❌ Toggle button not found');
          return;
        }
        
        const styles = window.getComputedStyle(toggleButton);
        const pointerEvents = styles.pointerEvents;
        const zIndex = styles.zIndex;
        const position = styles.position;
        
        console.log('[DEBUG] Toggle button state:');
        console.log(`[DEBUG]   - pointerEvents: ${pointerEvents}`);
        console.log(`[DEBUG]   - zIndex: ${zIndex}`);
        console.log(`[DEBUG]   - position: ${position}`);
        
        // Check for overlay children
        const overlays = toggleButton.querySelectorAll('div[class*="absolute"][class*="inset-0"]');
        console.log(`[DEBUG]   - overlay children: ${overlays.length}`);
        
        overlays.forEach((overlay, index) => {
          const overlayStyles = window.getComputedStyle(overlay);
          console.log(`[DEBUG]     - overlay ${index + 1} pointerEvents: ${overlayStyles.pointerEvents}`);
        });
      }
      
      // Run checks
      setTimeout(() => {
        console.log('[DEBUG] === Initial State Check ===');
        checkOverlayDivs();
        checkSidebarState();
        checkToggleButton();
        
        // Find and click toggle button
        const toggleButton = document.querySelector('[title="Toggle sidebar"]');
        if (toggleButton) {
          console.log('[DEBUG] Clicking toggle button...');
          toggleButton.click();
          
          setTimeout(() => {
            console.log('[DEBUG] === After Toggle Check ===');
            checkSidebarState();
          }, 500);
        }
      }, 2000);
    });
    
    // Wait for debug checks to complete
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: './debug-screenshots/sidebar-final-debug.png' });
    console.log('📸 Screenshot taken');
    
  } catch (error) {
    console.error('❌ Error during debug test:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🔍 Sidebar Final Debug Test completed');
})();