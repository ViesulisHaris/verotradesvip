/**
 * Trades Element Blocker Diagnostic Test
 * 
 * This test specifically identifies what element is blocking the Trades navigation button
 * and preventing it from being clicked/visible.
 */

const { chromium } = require('playwright');
const path = require('path');

async function runElementBlockerDiagnostic() {
  console.log('🔍 Starting Trades Element Blocker Diagnostic...');
  
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
    
    // Step 1: Navigate directly to Trades page (bypass login for now)
    console.log('📍 Step 1: Navigating directly to Trades page...');
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Analyze the Trades navigation button in detail
    console.log('📍 Step 2: Analyzing Trades navigation button...');
    
    const tradesButtonAnalysis = await page.evaluate(() => {
      const tradesLink = document.querySelector('a[href="/trades"]');
      if (!tradesLink) {
        return { error: 'Trades link not found' };
      }
      
      const rect = tradesLink.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(tradesLink);
      const parentElement = tradesLink.parentElement;
      const parentStyle = parentElement ? window.getComputedStyle(parentElement) : null;
      
      // Check what's at the center of the trades link
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      
      // Get all elements that might be overlaying
      const allOverlays = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const elRect = el.getBoundingClientRect();
        
        // Check if element has high z-index or is positioned absolutely/fixed
        if (
          (style.position === 'absolute' || style.position === 'fixed') &&
          parseInt(style.zIndex) > 10 &&
          elRect.left <= rect.left + rect.width / 2 &&
          elRect.top <= rect.top + rect.height / 2 &&
          elRect.right >= rect.left + rect.width / 2 &&
          elRect.bottom >= rect.top + rect.height / 2
        ) {
          allOverlays.push({
            tagName: el.tagName,
            className: el.className,
            zIndex: style.zIndex,
            position: style.position,
            display: style.display,
            opacity: style.opacity,
            pointerEvents: style.pointerEvents,
            rect: elRect
          });
        }
      });
      
      return {
        tradesLink: {
          tagName: tradesLink.tagName,
          className: tradesLink.className,
          rect: rect,
          visible: computedStyle.display !== 'none' && computedStyle.opacity !== '0',
          pointerEvents: computedStyle.pointerEvents,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position
        },
        parent: parentStyle ? {
          tagName: parentElement.tagName,
          className: parentElement.className,
          display: parentStyle.display,
          opacity: parentStyle.opacity,
          pointerEvents: parentStyle.pointerEvents,
          zIndex: parentStyle.zIndex,
          position: parentStyle.position
        } : null,
        elementAtPoint: elementAtPoint ? {
          tagName: elementAtPoint.tagName,
          className: elementAtPoint.className,
          id: elementAtPoint.id
        } : null,
        potentialOverlays: allOverlays.slice(0, 5) // Top 5 overlays
      };
    });
    
    console.log('🔍 Trades button analysis:', JSON.stringify(tradesButtonAnalysis, null, 2));
    
    // Step 3: Check for modal or overlay remnants
    console.log('📍 Step 3: Checking for modal/overlay remnants...');
    
    const overlayAnalysis = await page.evaluate(() => {
      const overlays = [];
      
      // Check for common modal/overlay selectors
      const overlaySelectors = [
        '.fixed.inset-0',
        '.fixed.top-0.left-0.right-0.bottom-0',
        '[style*="position: fixed"]',
        '[style*="position: absolute"]',
        '.modal',
        '.overlay',
        '.backdrop',
        '[role="dialog"]',
        '[aria-modal="true"]'
      ];
      
      overlaySelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, index) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              overlays.push({
                selector,
                index,
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                style: {
                  position: style.position,
                  zIndex: style.zIndex,
                  display: style.display,
                  opacity: style.opacity,
                  pointerEvents: style.pointerEvents,
                  visibility: style.visibility
                },
                rect: {
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  left: rect.left
                }
              });
            }
          });
        } catch (e) {
          console.log('Error checking selector:', selector, e);
        }
      });
      
      return overlays;
    });
    
    console.log('🔍 Overlay analysis:', JSON.stringify(overlayAnalysis, null, 2));
    
    // Step 4: Test click with different methods
    console.log('📍 Step 4: Testing click with different methods...');
    
    // Try direct DOM click
    const directClickResult = await page.evaluate(() => {
      const tradesLink = document.querySelector('a[href="/trades"]');
      if (tradesLink) {
        try {
          tradesLink.click();
          return { success: true, method: 'direct DOM click' };
        } catch (e) {
          return { success: false, method: 'direct DOM click', error: e.message };
        }
      }
      return { success: false, method: 'direct DOM click', error: 'Element not found' };
    });
    
    console.log('🖱️ Direct DOM click result:', directClickResult);
    
    // Try JavaScript navigation
    const jsNavResult = await page.evaluate(() => {
      const tradesLink = document.querySelector('a[href="/trades"]');
      if (tradesLink) {
        try {
          window.location.href = tradesLink.href;
          return { success: true, method: 'JS navigation', href: tradesLink.href };
        } catch (e) {
          return { success: false, method: 'JS navigation', error: e.message };
        }
      }
      return { success: false, method: 'JS navigation', error: 'Element not found' };
    });
    
    console.log('🔗 JS navigation result:', jsNavResult);
    
    // Step 5: Check if we're actually on the Trades page
    console.log('📍 Step 5: Verifying current page...');
    
    const currentPage = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
        bodyClasses: document.body.className
      };
    });
    
    console.log('🔍 Current page info:', currentPage);
    
    // Step 6: Take screenshot for visual analysis
    console.log('📍 Step 6: Taking screenshot for visual analysis...');
    
    await page.screenshot({ 
      path: 'trades-element-blocker-analysis.png', 
      fullPage: true 
    });
    
    // Step 7: Check for CSS that might be hiding the element
    console.log('📍 Step 7: Checking CSS that might be hiding elements...');
    
    const cssAnalysis = await page.evaluate(() => {
      const tradesLink = document.querySelector('a[href="/trades"]');
      if (!tradesLink) return { error: 'Trades link not found' };
      
      // Get all CSS rules that might affect visibility
      const styleSheets = Array.from(document.styleSheets);
      const relevantRules = [];
      
      styleSheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule.selectorText && (
              rule.selectorText.includes('nav') ||
              rule.selectorText.includes('sidebar') ||
              rule.selectorText.includes('zoom') ||
              rule.selectorText.includes('pointer-events')
            )) {
              relevantRules.push({
                selector: rule.selectorText,
                style: rule.style.cssText
              });
            }
          });
        } catch (e) {
          // Skip inaccessible stylesheets
        }
      });
      
      return {
        relevantRules: relevantRules.slice(0, 10), // Top 10 relevant rules
        computedStyle: window.getComputedStyle(tradesLink),
        inheritedStyles: {
          parent: tradesLink.parentElement ? window.getComputedStyle(tradesLink.parentElement) : null,
          grandParent: tradesLink.parentElement?.parentElement ? window.getComputedStyle(tradesLink.parentElement.parentElement) : null
        }
      };
    });
    
    console.log('🔍 CSS analysis:', JSON.stringify(cssAnalysis, null, 2));
    
    console.log('🏁 Element Blocker Diagnostic completed');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    await page.screenshot({ path: 'element-blocker-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
runElementBlockerDiagnostic().catch(console.error);