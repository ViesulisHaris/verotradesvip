/**
 * Dark Overlay Diagnostic Test
 * This script will navigate to the confluence page and run diagnostic tests
 * to identify the source of the dark overlay issue.
 */

const { chromium } = require('playwright');

async function runDarkOverlayDiagnostic() {
  console.log('🔍 Starting Dark Overlay Diagnostic Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser Console:', msg.text());
    });

    // Navigate to confluence page
    console.log('📍 Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Take screenshot before diagnostic
    await page.screenshot({ 
      path: 'confluence-before-diagnostic.png',
      fullPage: true 
    });

    // Navigate to diagnostic page
    console.log('📍 Navigating to diagnostic page...');
    await page.goto('http://localhost:3000/debug-dark-overlay', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for diagnostic page to load
    await page.waitForTimeout(2000);

    // Run the diagnostic scan
    console.log('🔬 Running overlay diagnostic scan...');
    await page.click('button:has-text("Scan for Overlay Elements")');

    // Wait for scan to complete
    await page.waitForTimeout(5000);

    // Take screenshot of diagnostic results
    await page.screenshot({ 
      path: 'diagnostic-results.png',
      fullPage: true 
    });

    // Extract diagnostic results
    const diagnosticData = await page.evaluate(() => {
      const results = {
        overlayElements: [],
        suspiciousElements: [],
        backdropFilterElements: [],
        highZIndexElements: [],
        summary: {}
      };

      // Extract overlay elements
      const overlayElements = document.querySelectorAll('.bg-red-50 .border-red-200');
      overlayElements.forEach(el => {
        const text = el.textContent;
        if (text && text.includes('Overlay Elements Found')) {
          results.overlayElements.push(text);
        }
      });

      // Extract suspicious elements
      const suspiciousElements = document.querySelectorAll('.bg-yellow-50 .border-yellow-200');
      suspiciousElements.forEach(el => {
        const text = el.textContent;
        if (text && text.includes('Suspicious Elements')) {
          results.suspiciousElements.push(text);
        }
      });

      // Extract backdrop filter elements
      const backdropElements = document.querySelectorAll('.bg-blue-50 .border-blue-200');
      backdropElements.forEach(el => {
        const text = el.textContent;
        if (text && text.includes('Backdrop Filter Elements')) {
          results.backdropFilterElements.push(text);
        }
      });

      // Extract high z-index elements
      const highZElements = document.querySelectorAll('.bg-purple-50 .border-purple-200');
      highZElements.forEach(el => {
        const text = el.textContent;
        if (text && text.includes('High z-index Elements')) {
          results.highZIndexElements.push(text);
        }
      });

      // Extract summary
      const summaryDiv = document.querySelector('.bg-gray-100');
      if (summaryDiv) {
        results.summary = summaryDiv.textContent;
      }

      return results;
    });

    console.log('\n📊 DIAGNOSTIC RESULTS:');
    console.log('========================');
    console.log('Summary:', diagnosticData.summary);
    console.log('Overlay Elements:', diagnosticData.overlayElements.length > 0 ? 'FOUND' : 'NONE');
    console.log('Suspicious Elements:', diagnosticData.suspiciousElements.length > 0 ? 'FOUND' : 'NONE');
    console.log('Backdrop Filter Elements:', diagnosticData.backdropFilterElements.length > 0 ? 'FOUND' : 'NONE');
    console.log('High z-index Elements:', diagnosticData.highZIndexElements.length > 0 ? 'FOUND' : 'NONE');

    // Go back to confluence page to check for mobile menu overlay
    console.log('\n📱 Checking for mobile menu overlay...');
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Look for mobile menu button and click it
    const mobileMenuButton = await page.$('button[aria-label="Toggle navigation menu"]');
    if (mobileMenuButton) {
      console.log('📱 Mobile menu button found, clicking...');
      await mobileMenuButton.click();
      await page.waitForTimeout(2000);

      // Take screenshot with mobile menu open
      await page.screenshot({ 
        path: 'confluence-mobile-menu-open.png',
        fullPage: true 
      });

      // Check for overlay elements
      const mobileOverlayData = await page.evaluate(() => {
        const overlays = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          if (style.position === 'fixed' && 
              style.backgroundColor.includes('rgba(0, 0, 0') &&
              rect.width >= window.innerWidth * 0.9) {
            overlays.push({
              element: el.tagName,
              className: el.className,
              id: el.id,
              zIndex: style.zIndex,
              backgroundColor: style.backgroundColor,
              backdropFilter: style.backdropFilter
            });
          }
        });
        
        return overlays;
      });

      console.log('📱 Mobile overlay elements found:', mobileOverlayData.length);
      mobileOverlayData.forEach((overlay, index) => {
        console.log(`  ${index + 1}. ${overlay.element} - z-index: ${overlay.zIndex}, bg: ${overlay.backgroundColor}`);
      });

      // Close mobile menu
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
    }

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);

    // Final screenshot
    await page.screenshot({ 
      path: 'confluence-final.png',
      fullPage: true 
    });

    console.log('\n✅ Diagnostic test completed!');
    console.log('📸 Screenshots saved:');
    console.log('  - confluence-before-diagnostic.png');
    console.log('  - diagnostic-results.png');
    console.log('  - confluence-mobile-menu-open.png');
    console.log('  - confluence-final.png');

  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
runDarkOverlayDiagnostic().catch(console.error);