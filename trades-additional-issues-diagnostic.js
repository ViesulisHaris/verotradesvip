/**
 * Trades Additional Issues Diagnostic Test
 * 
 * This test investigates other potential causes of Trades tab freezing beyond modal overlays
 */

const { chromium } = require('playwright');
const path = require('path');

async function runAdditionalIssuesDiagnostic() {
  console.log('🔍 Starting Trades Additional Issues Diagnostic...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
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
    
    // Enable request monitoring
    page.on('request', request => {
      if (request.url().includes('/trades')) {
        console.log('🔄 Trades request:', request.url());
      }
    });
    
    // Step 1: Check for authentication issues
    console.log('📍 Step 1: Testing authentication flow...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if login page loads correctly
    const loginFormExists = await page.$('form');
    console.log('🔍 Login form exists:', !!loginFormExists);
    
    // Try to login with test credentials
    if (loginFormExists) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      
      // Monitor for authentication errors
      const authError = await page.$('.text-error, .error-message');
      if (authError) {
        console.log('⚠️ Authentication error found on login page');
      }
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    // Step 2: Navigate to Trades page and check for route guards
    console.log('📍 Step 2: Testing navigation to Trades page...');
    
    // Check current URL after login
    const currentUrl = page.url();
    console.log('🔍 Current URL after login:', currentUrl);
    
    // Try to navigate to Trades
    const tradesLink = await page.$('a[href="/trades"]');
    if (tradesLink) {
      console.log('✅ Trades link found, attempting navigation...');
      await tradesLink.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } else {
      console.log('❌ Trades link not found, checking navigation structure...');
      
      // Analyze navigation structure
      const navStructure = await page.evaluate(() => {
        const navElements = document.querySelectorAll('nav a, .nav a, [href*="/"]');
        return Array.from(navElements).map(el => ({
          href: el.href,
          text: el.textContent?.trim(),
          className: el.className,
          visible: el.offsetParent !== null
        }));
      });
      
      console.log('🔍 Navigation structure:', navStructure);
    }
    
    // Step 3: Check for React component mounting issues
    console.log('📍 Step 3: Testing React component mounting...');
    
    const reactMounting = await page.evaluate(() => {
      // Check for React dev tools
      const hasReactDevTools = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Check for component errors
      const errorElements = document.querySelectorAll('[data-testid="error"], .error, .error-message');
      const errors = Array.from(errorElements).map(el => el.textContent?.trim()).filter(Boolean);
      
      // Check for unmounted components
      const emptyContainers = document.querySelectorAll('.empty:empty, .loading:empty');
      
      // Check for hydration issues
      const hasHydrationMismatch = document.querySelector('[data-hydration-mismatch]') !== null;
      
      return {
        hasReactDevTools,
        componentErrors: errors,
        emptyContainers: emptyContainers.length,
        hasHydrationMismatch,
        reactRoots: document.querySelectorAll('[data-reactroot]').length
      };
    });
    
    console.log('🔍 React mounting analysis:', reactMounting);
    
    // Step 4: Test for CSS pointer-events issues
    console.log('📍 Step 4: Testing CSS pointer-events issues...');
    
    const pointerEventsAnalysis = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const problematicElements = [];
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check for elements that block pointer events
        if (
          style.pointerEvents === 'none' &&
          rect.width > 0 &&
          rect.height > 0 &&
          el.tagName !== 'SCRIPT' &&
          el.tagName !== 'STYLE'
        ) {
          problematicElements.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            pointerEvents: style.pointerEvents,
            position: style.position,
            zIndex: style.zIndex,
            display: style.display,
            opacity: style.opacity
          });
        }
      });
      
      return problematicElements.slice(0, 10); // Top 10 problematic elements
    });
    
    console.log('🔍 Pointer events analysis:', pointerEventsAnalysis);
    
    // Step 5: Test for JavaScript event listener conflicts
    console.log('📍 Step 5: Testing JavaScript event listener conflicts...');
    
    const eventListenerAnalysis = await page.evaluate(() => {
      let clickListeners = 0;
      let mouseDownListeners = 0;
      
      // Count event listeners on navigation elements
      document.querySelectorAll('a[href]').forEach(link => {
        const listeners = getEventListeners ? getEventListeners(link) : [];
        clickListeners += listeners.filter(l => l.type === 'click').length;
        mouseDownListeners += listeners.filter(l => l.type === 'mousedown').length;
      });
      
      // Check for event.preventDefault usage
      let preventDefaultCount = 0;
      const originalPreventDefault = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function() {
        preventDefaultCount++;
        return originalPreventDefault.call(this);
      };
      
      return {
        navigationLinks: document.querySelectorAll('a[href]').length,
        clickListeners,
        mouseDownListeners,
        preventDefaultCount
      };
    });
    
    console.log('🔍 Event listener analysis:', eventListenerAnalysis);
    
    // Step 6: Test for memory leaks or performance issues
    console.log('📍 Step 6: Testing for memory/performance issues...');
    
    const performanceAnalysis = await page.evaluate(() => {
      // Check memory usage
      const memory = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null;
      
      // Check for long-running tasks
      let longTasks = 0;
      if (window.PerformanceObserver) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              longTasks++;
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      }
      
      // Check for DOM size
      const domNodes = document.querySelectorAll('*').length;
      
      return {
        memory,
        longTasks,
        domNodes,
        bodyClasses: document.body.className
      };
    });
    
    console.log('🔍 Performance analysis:', performanceAnalysis);
    
    // Step 7: Test for specific Trades page issues
    console.log('📍 Step 7: Testing Trades page specific issues...');
    
    // Try to navigate to Trades page directly
    await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle' });
    
    const tradesPageAnalysis = await page.evaluate(() => {
      // Check if we're actually on Trades page
      const isTradesPage = window.location.pathname.includes('/trades');
      
      // Check for trade data loading
      const tradeElements = document.querySelectorAll('[data-testid*="trade"], .trade-card, [class*="trade"]');
      const loadingElements = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
      
      // Check for filter/sort components
      const filterComponents = document.querySelectorAll('input[type="text"], select, [data-filter]');
      const sortComponents = document.querySelectorAll('[data-sort], .sort-button');
      
      // Check for pagination
      const paginationElements = document.querySelectorAll('.pagination, [data-page], button[class*="page"]');
      
      return {
        isTradesPage,
        tradeElements: tradeElements.length,
        loadingElements: loadingElements.length,
        filterComponents: filterComponents.length,
        sortComponents: sortComponents.length,
        paginationElements: paginationElements.length,
        pageTitle: document.title,
        bodyClasses: document.body.className
      };
    });
    
    console.log('🔍 Trades page analysis:', tradesPageAnalysis);
    
    // Step 8: Test navigation from Trades page
    console.log('📍 Step 8: Testing navigation FROM Trades page...');
    
    if (tradesPageAnalysis.isTradesPage) {
      // Try to click on Dashboard link
      const dashboardLink = await page.$('a[href="/dashboard"]');
      if (dashboardLink) {
        console.log('🖱️ Attempting to navigate from Trades to Dashboard...');
        
        // Monitor for click interception
        const clickIntercepted = await page.evaluate(() => {
          let intercepted = false;
          const dashboardLink = document.querySelector('a[href="/dashboard"]');
          
          if (dashboardLink) {
            // Add click listener to check interception
            dashboardLink.addEventListener('click', (e) => {
              console.log('Click event intercepted:', {
                defaultPrevented: e.defaultPrevented,
                stopPropagation: e.stopPropagation.toString(),
                target: e.target,
                currentTarget: e.currentTarget
              });
              intercepted = true;
            });
            
            // Check if element is actually clickable
            const rect = dashboardLink.getBoundingClientRect();
            const style = window.getComputedStyle(dashboardLink);
            const elementAtPoint = document.elementFromPoint(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2
            );
            
            return {
              rect,
              style: {
                pointerEvents: style.pointerEvents,
                zIndex: style.zIndex,
                position: style.position,
                display: style.display,
                opacity: style.opacity
              },
              elementAtPoint: elementAtPoint?.tagName,
              intercepted
            };
          });
          
          console.log('🔍 Click interception analysis:', clickIntercepted);
          
          // Now try the actual click
          await dashboardLink.click();
          
          // Wait a moment to see what happens
          await page.waitForTimeout(2000);
          
          // Check if navigation occurred
          const afterClickUrl = page.url();
          console.log('🔍 URL after click:', afterClickUrl);
          
          const navigated = !afterClickUrl.includes('/trades');
          console.log(navigated ? '✅ Navigation successful' : '❌ Navigation blocked');
        }
      }
    }
    
    // Step 9: Take final screenshots
    console.log('📍 Step 9: Taking final screenshots...');
    
    await page.screenshot({ 
      path: 'trades-additional-issues-final.png', 
      fullPage: true 
    });
    
    console.log('🏁 Additional Issues Diagnostic completed');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    await page.screenshot({ path: 'additional-issues-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
runAdditionalIssuesDiagnostic().catch(console.error);