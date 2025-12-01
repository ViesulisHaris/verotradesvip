const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Trades Tab Freezing Diagnostic Test
 * 
 * This test reproduces the exact user flow where the Trades tab freezes navigation:
 * 1. Navigate to the application
 * 2. Click on the Trades tab
 * 3. Try to navigate away using menu buttons
 * 4. Identify what's blocking navigation
 */

async function runTradesFreezingTest() {
  console.log('🔍 Starting Trades Tab Freezing Diagnostic Test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual debugging
    slowMo: 100, // Slow down actions to see what's happening
    args: [
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: path.join(__dirname, 'test-videos') },
    recordHar: { path: path.join(__dirname, 'trades-freezing-test.har') }
  });
  
  const page = await context.newPage();
  
  // Enable console logging to capture JavaScript errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error') {
      console.log('🚨 JavaScript Error:', msg.text());
    }
  });
  
  // Enable uncaught exception logging
  page.on('pageerror', error => {
    console.log('💥 Uncaught Exception:', error.message);
    console.log('Stack:', error.stack);
  });
  
  // Enable request/response logging for performance issues
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  try {
    console.log('📍 Step 1: Navigating to application...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for app to load
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('📍 Step 2: Checking if login is needed...');
    const loginNeeded = await page.locator('text=Login').isVisible().catch(() => false);
    
    if (loginNeeded) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    console.log('📍 Step 3: Looking for Trades tab...');
    const tradesTab = page.locator('a[href="/trades"]');
    await tradesTab.waitFor({ state: 'visible', timeout: 10000 });
    
    // Take screenshot before clicking Trades
    await page.screenshot({ 
      path: path.join(__dirname, 'before-trades-click.png'),
      fullPage: true 
    });
    
    console.log('📍 Step 4: Clicking on Trades tab...');
    await tradesTab.click();
    
    // Wait for Trades page to load
    await page.waitForURL('**/trades', { timeout: 10000 });
    await page.waitForTimeout(3000); // Extra wait for any dynamic content
    
    // Take screenshot after Trades loads
    await page.screenshot({ 
      path: path.join(__dirname, 'after-trades-load.png'),
      fullPage: true 
    });
    
    console.log('📍 Step 5: Checking for overlays and modals...');
    
    // Check for any modal overlays that might be blocking navigation
    const overlays = await page.evaluate(() => {
      const overlays = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Look for elements with high z-index that cover the screen
        if (parseInt(style.zIndex) > 50 && 
            style.position === 'fixed' && 
            rect.width > window.innerWidth * 0.8 && 
            rect.height > window.innerHeight * 0.8) {
          overlays.push({
            element: el.tagName,
            className: el.className,
            zIndex: style.zIndex,
            position: style.position,
            width: rect.width,
            height: rect.height,
            pointerEvents: style.pointerEvents,
            display: style.display,
            visibility: style.visibility,
            innerHTML: el.innerHTML.substring(0, 200) + '...'
          });
        }
      });
      
      return overlays;
    });
    
    console.log('🔍 Found overlays:', overlays.length);
    overlays.forEach((overlay, index) => {
      console.log(`  Overlay ${index + 1}:`, {
        element: overlay.element,
        className: overlay.className,
        zIndex: overlay.zIndex,
        pointerEvents: overlay.pointerEvents,
        display: overlay.display,
        visibility: overlay.visibility
      });
    });
    
    console.log('📍 Step 6: Checking body styles that might block interactions...');
    
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      
      return {
        pointerEvents: style.pointerEvents,
        overflow: style.overflow,
        userSelect: style.userSelect,
        touchAction: style.touchAction,
        classList: Array.from(body.classList),
        hasInlineStyles: body.hasAttribute('style'),
        inlineStyles: body.getAttribute('style')
      };
    });
    
    console.log('🔍 Body styles:', bodyStyles);
    
    console.log('📍 Step 7: Testing navigation click...');
    
    // Try to click on Dashboard link
    const dashboardLink = page.locator('a[href="/dashboard"]');
    await dashboardLink.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check if the link is actually clickable
    const linkInfo = await dashboardLink.evaluate(el => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      return {
        isVisible: style.visibility !== 'hidden' && style.display !== 'none',
        isClickable: style.pointerEvents !== 'none',
        zIndex: style.zIndex,
        position: style.position,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      };
    });
    
    console.log('🔍 Dashboard link info:', linkInfo);
    
    // Take screenshot before attempting navigation
    await page.screenshot({ 
      path: path.join(__dirname, 'before-navigation-attempt.png'),
      fullPage: true 
    });
    
    // Try to click the dashboard link
    console.log('🖱️ Attempting to click Dashboard link...');
    
    // Add event listeners to detect if click is blocked
    await page.evaluate(() => {
      document.addEventListener('click', (e) => {
        console.log('🖱️ Click event detected:', {
          target: e.target.tagName,
          href: e.target.href,
          prevented: e.defaultPrevented,
          stopped: e.eventPhase === Event.CAPTURING_PHASE || e.eventPhase === Event.BUBBLING_PHASE
        });
      }, true);
      
      // Add navigation event listeners
      window.addEventListener('beforeunload', () => {
        console.log('🧭 Before unload triggered');
      });
      
      window.addEventListener('unload', () => {
        console.log('🧭 Unload triggered');
      });
    });
    
    try {
      await dashboardLink.click({ timeout: 5000 });
      await page.waitForTimeout(2000); // Wait to see if navigation starts
      
      // Check if URL changed
      const currentUrl = page.url();
      console.log('🔍 Current URL after click:', currentUrl);
      
      if (currentUrl.includes('/trades')) {
        console.log('❌ Navigation failed - still on Trades page');
        
        // Check for any new overlays that appeared
        const newOverlays = await page.evaluate(() => {
          const overlays = [];
          const elements = document.querySelectorAll('*');
          
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            if (parseInt(style.zIndex) > 100 && 
                style.position === 'fixed') {
              overlays.push({
                element: el.tagName,
                className: el.className,
                zIndex: style.zIndex,
                pointerEvents: style.pointerEvents
              });
            }
          });
          
          return overlays;
        });
        
        console.log('🔍 New overlays after click:', newOverlays);
      } else {
        console.log('✅ Navigation successful - moved to:', currentUrl);
      }
    } catch (error) {
      console.log('❌ Click failed with error:', error.message);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: path.join(__dirname, 'after-navigation-attempt.png'),
      fullPage: true 
    });
    
    console.log('📍 Step 8: Checking for infinite loops or performance issues...');
    
    // Monitor for a few seconds to detect any performance issues
    const performanceMetrics = [];
    for (let i = 0; i < 10; i++) {
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        const memory = performance.memory;
        
        return {
          timestamp: Date.now(),
          domNodes: document.querySelectorAll('*').length,
          memoryUsed: memory ? memory.usedJSHeapSize : 0,
          memoryTotal: memory ? memory.totalJSHeapSize : 0,
          eventListeners: (function() {
            let count = 0;
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
              const events = getEventListeners ? getEventListeners(el) : null;
              if (events) {
                count += Object.keys(events).length;
              }
            });
            return count;
          })()
        };
      });
      
      performanceMetrics.push(metrics);
      await page.waitForTimeout(500);
    }
    
    console.log('📊 Performance metrics:', performanceMetrics);
    
    // Generate diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        overlaysFound: overlays.length,
        bodyStyles: bodyStyles,
        linkInfo: linkInfo,
        navigationSuccessful: !page.url().includes('/trades'),
        consoleErrors: consoleMessages.filter(m => m.type === 'error'),
        performanceMetrics: performanceMetrics,
        requestsCount: requests.length
      },
      recommendations: []
    };
    
    // Add recommendations based on findings
    if (overlays.length > 0) {
      diagnosticReport.recommendations.push('Found overlays that might be blocking navigation');
    }
    
    if (bodyStyles.pointerEvents === 'none') {
      diagnosticReport.recommendations.push('Body has pointer-events: none which blocks all interactions');
    }
    
    if (consoleMessages.some(m => m.text.includes('error'))) {
      diagnosticReport.recommendations.push('JavaScript errors detected that might interfere with navigation');
    }
    
    if (performanceMetrics.some(m => m.domNodes > 5000)) {
      diagnosticReport.recommendations.push('High DOM node count detected - possible memory leak');
    }
    
    // Save diagnostic report
    fs.writeFileSync(
      path.join(__dirname, 'trades-freezing-diagnostic-report.json'),
      JSON.stringify(diagnosticReport, null, 2)
    );
    
    console.log('📋 Diagnostic report saved to trades-freezing-diagnostic-report.json');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: path.join(__dirname, 'error-screenshot.png'),
      fullPage: true 
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  runTradesFreezingTest()
    .then(() => console.log('✅ Test completed'))
    .catch(error => console.error('❌ Test failed:', error));
}

module.exports = { runTradesFreezingTest };