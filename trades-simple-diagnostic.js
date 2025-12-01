/**
 * Simple Trades Tab Diagnostic Test
 */

const { chromium } = require('playwright');

async function runSimpleDiagnostic() {
  console.log('🔍 Starting Simple Trades Diagnostic...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to Trades page
    console.log('📍 Step 1: Navigating to Trades page...');
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Check navigation elements
    console.log('📍 Step 2: Checking navigation elements...');
    
    const navAnalysis = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('a[href]');
      const results = [];
      
      navLinks.forEach((link, index) => {
        const rect = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none';
        
        results.push({
          index,
          href: link.href,
          text: link.textContent?.trim(),
          isVisible,
          style: {
            display: style.display,
            pointerEvents: style.pointerEvents,
            zIndex: style.zIndex,
            opacity: style.opacity
          }
        });
      });
      
      return results;
    });
    
    console.log('🔍 Navigation analysis:', navAnalysis);
    
    // Step 3: Check for overlays
    console.log('📍 Step 3: Checking for overlays...');
    
    const overlayAnalysis = await page.evaluate(() => {
      const overlays = document.querySelectorAll('.fixed, [style*="position: fixed"], [style*="position: absolute"]');
      const results = [];
      
      overlays.forEach((overlay, index) => {
        const rect = overlay.getBoundingClientRect();
        const style = window.getComputedStyle(overlay);
        
        if (rect.width > 0 && rect.height > 0) {
          results.push({
            index,
            tagName: overlay.tagName,
            className: overlay.className,
            style: {
              position: style.position,
              zIndex: style.zIndex,
              display: style.display,
              opacity: style.opacity,
              pointerEvents: style.pointerEvents
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
      
      return results;
    });
    
    console.log('🔍 Overlay analysis:', overlayAnalysis);
    
    // Step 4: Test navigation click
    console.log('📍 Step 4: Testing navigation click...');
    
    const dashboardLink = await page.$('a[href="/dashboard"]');
    if (dashboardLink) {
      // Take screenshot before click
      await page.screenshot({ path: 'trades-before-click.png' });
      
      // Try to click
      await dashboardLink.click();
      await page.waitForTimeout(3000);
      
      // Check result
      const finalUrl = page.url();
      console.log('🔍 Final URL:', finalUrl);
      
      const navigated = !finalUrl.includes('/trades');
      console.log(navigated ? '✅ Navigation successful' : '❌ Navigation failed');
      
      // Take screenshot after click
      await page.screenshot({ path: 'trades-after-click.png' });
    }
    
    console.log('🏁 Simple Diagnostic completed');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
runSimpleDiagnostic().catch(console.error);