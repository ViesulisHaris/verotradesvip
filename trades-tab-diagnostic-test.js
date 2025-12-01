/**
 * Trades Tab Navigation Freeze Diagnostic Test
 * 
 * This test specifically isolates and diagnoses the Trades tab freezing issue
 * where users can navigate to the Trades page but then can't navigate away from it.
 */

const { chromium } = require('playwright');
const path = require('path');

async function runTradesTabDiagnosticTest() {
  console.log('🔍 Starting Trades Tab Navigation Freeze Diagnostic Test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Keep visible for debugging
    slowMo: 500 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Enable detailed console logging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Browser ${msg.type()}:`, msg.text());
      }
    });
    
    // Enable detailed request monitoring
    page.on('request', request => {
      if (request.url().includes('/trades')) {
        console.log('🔄 Trades page request:', request.url());
      }
    });
    
    // Step 1: Navigate to login and authenticate
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form (using test credentials)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Navigate to Trades page
    console.log('📍 Step 2: Navigating to Trades page...');
    await page.click('a[href="/trades"]');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the Trades page
    const currentUrl = page.url();
    if (!currentUrl.includes('/trades')) {
      throw new Error(`Failed to navigate to Trades page. Current URL: ${currentUrl}`);
    }
    console.log('✅ Successfully navigated to Trades page');
    
    // Step 3: Test navigation elements BEFORE potential freeze
    console.log('📍 Step 3: Testing navigation elements before freeze...');
    
    // Check if navigation buttons are visible and clickable
    const navButtons = [
      { selector: 'a[href="/dashboard"]', name: 'Dashboard' },
      { selector: 'a[href="/log-trade"]', name: 'Log Trade' },
      { selector: 'a[href="/strategies"]', name: 'Strategies' },
      { selector: 'a[href="/calendar"]', name: 'Calendar' },
      { selector: 'a[href="/confluence"]', name: 'Confluence' }
    ];
    
    for (const button of navButtons) {
      const element = await page.$(button.selector);
      if (element) {
        const isVisible = await element.isVisible();
        const isClickable = await element.isEnabled();
        console.log(`🔍 ${button.name}: Visible=${isVisible}, Clickable=${isClickable}`);
        
        // Get computed styles to check for z-index issues
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            zIndex: computed.zIndex,
            position: computed.position,
            pointerEvents: computed.pointerEvents,
            opacity: computed.opacity
          };
        });
        console.log(`   Styles: z-index=${styles.zIndex}, position=${styles.position}, pointer-events=${styles.pointerEvents}, opacity=${styles.opacity}`);
      } else {
        console.log(`❌ ${button.name}: Element not found`);
      }
    }
    
    // Step 4: Check for overlay elements that might be blocking navigation
    console.log('📍 Step 4: Checking for overlay elements...');
    
    const potentialOverlays = [
      { selector: '.fixed.inset-0', name: 'Modal overlay' },
      { selector: '[style*="z-index"]', name: 'High z-index elements' },
      { selector: '.bg-black\\/50', name: 'Backdrop overlay' },
      { selector: '.modal', name: 'Modal elements' }
    ];
    
    for (const overlay of potentialOverlays) {
      const elements = await page.$$(overlay.selector);
      if (elements.length > 0) {
        console.log(`⚠️ Found ${elements.length} ${overlay.name} elements`);
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const isVisible = await elements[i].isVisible();
          const styles = await elements[i].evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              zIndex: computed.zIndex,
              position: computed.position,
              pointerEvents: computed.pointerEvents,
              opacity: computed.opacity,
              display: computed.display
            };
          });
          console.log(`   Overlay ${i}: Visible=${isVisible}, z-index=${styles.zIndex}, display=${styles.display}`);
        }
      }
    }
    
    // Step 5: Test actual navigation click (this is where the freeze occurs)
    console.log('📍 Step 5: Testing navigation click (potential freeze point)...');
    
    // Try to navigate to Dashboard
    const dashboardButton = await page.$('a[href="/dashboard"]');
    if (dashboardButton) {
      console.log('🖱️ Attempting to click Dashboard button...');
      
      // Add event listeners to detect if click is intercepted
      await page.evaluate(() => {
        document.addEventListener('click', (e) => {
          console.log('🔥 Click event detected:', {
            target: e.target.tagName,
            href: e.target.href,
            className: e.target.className,
            isDefaultPrevented: e.defaultPrevented,
            stopPropagation: e.stopPropagation.toString()
          });
        }, true);
        
        document.addEventListener('mousedown', (e) => {
          console.log('🖱️ Mousedown event detected:', {
            target: e.target.tagName,
            href: e.target.href,
            className: e.target.className
          });
        }, true);
      });
      
      // Take screenshot before click
      await page.screenshot({ path: 'trades-before-navigation-click.png', fullPage: true });
      
      // Attempt the click with timeout
      try {
        await Promise.race([
          dashboardButton.click(),
          page.waitForURL('**/dashboard', { timeout: 3000 })
        ]);
        
        console.log('✅ Successfully navigated to Dashboard');
        
      } catch (error) {
        console.log('❌ Navigation failed or timed out:', error.message);
        
        // Take screenshot after failed click
        await page.screenshot({ path: 'trades-after-failed-click.png', fullPage: true });
        
        // Check if we're still on the Trades page (indicating freeze)
        const stillOnTrades = page.url().includes('/trades');
        if (stillOnTrades) {
          console.log('🧊 CONFIRMED: Still on Trades page - navigation freeze detected');
          
          // Additional diagnostic: Check for event blocking
          const eventBlocking = await page.evaluate(() => {
            const dashboardLink = document.querySelector('a[href="/dashboard"]');
            if (dashboardLink) {
              const rect = dashboardLink.getBoundingClientRect();
              const elementAtPoint = document.elementFromPoint(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
              );
              
              return {
                dashboardLink: dashboardLink.tagName,
                elementAtPoint: elementAtPoint?.tagName,
                elementAtPointClass: elementAtPoint?.className,
                elementAtPointZIndex: window.getComputedStyle(elementAtPoint || {}).zIndex
              };
            }
            return null;
          });
          
          console.log('🔍 Element blocking analysis:', eventBlocking);
        }
      }
    }
    
    // Step 6: Test zoom-aware layout interference
    console.log('📍 Step 6: Testing zoom-aware layout interference...');
    
    const zoomInfo = await page.evaluate(() => {
      return {
        zoomLevel: window.devicePixelRatio,
        effectiveWidth: window.innerWidth,
        effectiveHeight: window.innerHeight,
        actualWidth: window.screen.width,
        actualHeight: window.screen.height
      };
    });
    
    console.log('🔍 Zoom info:', zoomInfo);
    
    // Check if zoom-aware classes are causing issues
    const zoomClasses = await page.evaluate(() => {
      const body = document.body;
      return {
        className: body.className,
        zoomAware: body.classList.contains('zoom-aware-responsive'),
        zoomClasses: Array.from(body.classList).filter(c => c.startsWith('zoom-'))
      };
    });
    
    console.log('🔍 Zoom classes:', zoomClasses);
    
    // Step 7: Test localStorage interference
    console.log('📍 Step 7: Testing localStorage interference...');
    
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    
    console.log('🔍 LocalStorage keys:', Object.keys(localStorageData));
    
    // Check for sidebar state that might interfere
    const sidebarState = localStorageData['sidebar-collapsed'];
    if (sidebarState) {
      console.log('🔍 Sidebar collapsed state:', sidebarState);
    }
    
    console.log('🏁 Trades Tab Diagnostic Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'trades-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the diagnostic test
runTradesTabDiagnosticTest().catch(console.error);