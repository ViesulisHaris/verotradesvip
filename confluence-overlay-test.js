/**
 * Confluence Dark Overlay Test
 * This script will login, navigate to confluence page, and test for overlay issues
 */

const { chromium } = require('playwright');

async function testConfluenceOverlay() {
  console.log('🔍 Starting Confluence Dark Overlay Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down for better observation
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser Console:', msg.text());
    });

    // Navigate to login page first
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for login page to load
    await page.waitForTimeout(2000);

    // Take screenshot of login page
    await page.screenshot({ 
      path: 'login-page.png',
      fullPage: true 
    });

    // Fill in login credentials (using test credentials)
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Take screenshot after login
    await page.screenshot({ 
      path: 'after-login.png',
      fullPage: true 
    });

    // Navigate to confluence page
    console.log('📍 Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for confluence page to fully load
    await page.waitForTimeout(5000);

    // Take screenshot of confluence page
    await page.screenshot({ 
      path: 'confluence-initial.png',
      fullPage: true 
    });

    // Test 1: Check for overlay elements immediately
    console.log('🔬 Checking for overlay elements...');
    const initialOverlayCheck = await page.evaluate(() => {
      const overlays = [];
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check for overlay characteristics
        if (style.position === 'fixed' && 
            (style.backgroundColor.includes('rgba(0, 0, 0') || 
             style.backgroundColor === 'black' ||
             style.backgroundColor === '#000000') &&
            rect.width >= window.innerWidth * 0.8) {
          overlays.push({
            element: el.tagName,
            className: el.className,
            id: el.id,
            zIndex: style.zIndex,
            backgroundColor: style.backgroundColor,
            backdropFilter: style.backdropFilter,
            position: style.position,
            width: rect.width,
            height: rect.height,
            pointerEvents: style.pointerEvents,
            display: style.display,
            visibility: style.visibility
          });
        }
      });
      
      return overlays;
    });

    console.log('📊 Initial overlay check results:');
    if (initialOverlayCheck.length === 0) {
      console.log('✅ No overlay elements found initially');
    } else {
      initialOverlayCheck.forEach((overlay, index) => {
        console.log(`  ${index + 1}. ${overlay.element} - z-index: ${overlay.zIndex}, bg: ${overlay.backgroundColor}`);
      });
    }

    // Test 2: Simulate mobile viewport and check for mobile menu overlay
    console.log('📱 Testing mobile viewport...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Take screenshot in mobile view
    await page.screenshot({ 
      path: 'confluence-mobile.png',
      fullPage: true 
    });

    // Look for mobile menu button
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

      // Check for overlay elements when mobile menu is open
      const mobileOverlayCheck = await page.evaluate(() => {
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
              backdropFilter: style.backdropFilter,
              pointerEvents: style.pointerEvents
            });
          }
        });
        
        return overlays;
      });

      console.log('📱 Mobile overlay check results:');
      if (mobileOverlayCheck.length === 0) {
        console.log('✅ No mobile overlay elements found');
      } else {
        mobileOverlayCheck.forEach((overlay, index) => {
          console.log(`  ${index + 1}. ${overlay.element} - z-index: ${overlay.zIndex}, bg: ${overlay.backgroundColor}`);
        });
      }

      // Close mobile menu
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('📱 No mobile menu button found');
    }

    // Test 3: Reset to desktop viewport and check for persistent overlays
    console.log('🖥️ Resetting to desktop viewport...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(3000);

    // Take screenshot after viewport reset
    await page.screenshot({ 
      path: 'confluence-desktop-reset.png',
      fullPage: true 
    });

    // Check for overlay elements after viewport reset
    const desktopResetOverlayCheck = await page.evaluate(() => {
      const overlays = [];
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        if (style.position === 'fixed' && 
            (style.backgroundColor.includes('rgba(0, 0, 0') || 
             style.backgroundColor === 'black' ||
             style.backgroundColor === '#000000') &&
            rect.width >= window.innerWidth * 0.8) {
          overlays.push({
            element: el.tagName,
            className: el.className,
            id: el.id,
            zIndex: style.zIndex,
            backgroundColor: style.backgroundColor,
            backdropFilter: style.backdropFilter,
            pointerEvents: style.pointerEvents
          });
        }
      });
      
      return overlays;
    });

    console.log('🖥️ Desktop reset overlay check results:');
    if (desktopResetOverlayCheck.length === 0) {
      console.log('✅ No overlay elements found after viewport reset');
    } else {
      desktopResetOverlayCheck.forEach((overlay, index) => {
        console.log(`  ${index + 1}. ${overlay.element} - z-index: ${overlay.zIndex}, bg: ${overlay.backgroundColor}`);
      });
    }

    // Test 4: Check for backdrop filter issues
    console.log('🎨 Checking for backdrop filter elements...');
    const backdropFilterCheck = await page.evaluate(() => {
      const elements = [];
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          elements.push({
            element: el.tagName,
            className: el.className,
            id: el.id,
            zIndex: style.zIndex,
            position: style.position,
            backdropFilter: style.backdropFilter,
            backgroundColor: style.backgroundColor
          });
        }
      });
      
      return elements;
    });

    console.log('🎨 Backdrop filter check results:');
    if (backdropFilterCheck.length === 0) {
      console.log('✅ No backdrop filter elements found');
    } else {
      backdropFilterCheck.forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.element} - z-index: ${element.zIndex}, backdrop-filter: ${element.backdropFilter}`);
      });
    }

    // Test 5: Check for high z-index elements that might cause overlay issues
    console.log('📊 Checking for high z-index elements...');
    const highZIndexCheck = await page.evaluate(() => {
      const elements = [];
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        
        if (zIndex > 100) {
          elements.push({
            element: el.tagName,
            className: el.className,
            id: el.id,
            zIndex: style.zIndex,
            position: style.position,
            backgroundColor: style.backgroundColor
          });
        }
      });
      
      return elements.sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex));
    });

    console.log('📊 High z-index elements (sorted by z-index):');
    if (highZIndexCheck.length === 0) {
      console.log('✅ No high z-index elements found');
    } else {
      highZIndexCheck.forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.element} - z-index: ${element.zIndex}, position: ${element.position}`);
      });
    }

    console.log('\n✅ Confluence overlay test completed!');
    console.log('📸 Screenshots saved:');
    console.log('  - login-page.png');
    console.log('  - after-login.png');
    console.log('  - confluence-initial.png');
    console.log('  - confluence-mobile.png');
    console.log('  - confluence-mobile-menu-open.png');
    console.log('  - confluence-desktop-reset.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testConfluenceOverlay().catch(console.error);