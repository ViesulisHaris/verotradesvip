// Hamburger Menu Diagnostic Test
// This script will help identify why the hamburger menu is not visible on mobile

const { chromium } = require('playwright');
const path = require('path');

async function diagnoseHamburgerMenu() {
  console.log('🔍 [HAMBURGER_DIAGNOSTIC] Starting hamburger menu visibility test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // Mobile viewport
  });
  const page = await context.newPage();

  try {
    // Navigate to the dashboard (requires authentication)
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    console.log('🔍 [HAMBURGER_DIAGNOSTIC] Testing on mobile viewport (375x667)');
    
    // Test 1: Check if hamburger menu button exists in DOM
    const hamburgerButton = await page.$('button[aria-label="Toggle mobile menu"]');
    const hamburgerExists = hamburgerButton !== null;
    
    console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 1 - DOM Existence:', {
      hamburgerExists,
      hamburgerSelector: 'button[aria-label="Toggle mobile menu"]'
    });
    
    // Test 2: Check hamburger menu visibility
    if (hamburgerExists) {
      const isVisible = await hamburgerButton.isVisible();
      const boundingBox = await hamburgerButton.boundingBox();
      const computedStyle = await hamburgerButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position,
          width: styles.width,
          height: styles.height,
          transform: styles.transform,
          className: el.className
        };
      });
      
      console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 2 - Visibility Analysis:', {
        isVisible,
        boundingBox,
        computedStyle
      });
    } else {
      // Try alternative selectors
      const alternativeSelectors = [
        'button.lg\\:hidden',
        'button[title="Toggle mobile menu"]',
        '.lg\\:hidden button',
        'nav button:first-child',
        'button svg.lucide-menu'
      ];
      
      for (const selector of alternativeSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log(`🔍 [HAMBURGER_DIAGNOSTIC] Found element with selector: ${selector}`);
          const isVisible = await element.isVisible();
          const computedStyle = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              zIndex: styles.zIndex,
              className: el.className
            };
          });
          
          console.log(`🔍 [HAMBURGER_DIAGNOSTIC] Alternative element analysis:`, {
            selector,
            isVisible,
            computedStyle
          });
        }
      }
    }
    
    // Test 3: Check responsive classes
    const navigationElement = await page.$('nav');
    if (navigationElement) {
      const navClasses = await navigationElement.evaluate(el => el.className);
      console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 3 - Navigation Classes:', {
        navClasses,
        hasLgHidden: navClasses.includes('lg:hidden'),
        hasFixedTop: navClasses.includes('fixed'),
        hasZ50: navClasses.includes('z-50')
      });
    }
    
    // Test 4: Check if Menu icon is rendered
    const menuIcon = await page.$('svg.lucide-menu');
    const menuIconExists = menuIcon !== null;
    
    if (menuIconExists) {
      const iconVisible = await menuIcon.isVisible();
      const iconBoundingBox = await menuIcon.boundingBox();
      
      console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 4 - Menu Icon Analysis:', {
        menuIconExists,
        iconVisible,
        iconBoundingBox
      });
    } else {
      console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 4 - Menu Icon: NOT FOUND');
    }
    
    // Test 5: Check CSS conflicts
    const cssConflicts = await page.evaluate(() => {
      const hamburger = document.querySelector('button[aria-label="Toggle mobile menu"]');
      if (!hamburger) return null;
      
      const computedStyle = window.getComputedStyle(hamburger);
      const parentStyle = window.getComputedStyle(hamburger.parentElement);
      
      return {
        hamburgerStyles: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position,
          transform: computedStyle.transform,
          clipPath: computedStyle.clipPath,
          clip: computedStyle.clip
        },
        parentStyles: {
          display: parentStyle.display,
          overflow: parentStyle.overflow,
          position: parentStyle.position
        }
      };
    });
    
    if (cssConflicts) {
      console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 5 - CSS Conflicts Analysis:', cssConflicts);
    }
    
    // Test 6: Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 },  // iPhone SE
      { width: 375, height: 667 },  // iPhone 8
      { width: 414, height: 896 },  // iPhone 11
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 768 }  // Desktop
    ];
    
    console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 6 - Responsive Breakpoint Test:');
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const hamburgerAtSize = await page.$('button[aria-label="Toggle mobile menu"]');
      const isVisibleAtSize = hamburgerAtSize ? await hamburgerAtSize.isVisible() : false;
      
      console.log(`🔍 [HAMBURGER_DIAGNOSTIC] Viewport ${viewport.width}x${viewport.height}:`, {
        hamburgerExists: hamburgerAtSize !== null,
        isVisible: isVisibleAtSize
      });
    }
    
    // Test 7: Check z-index stacking
    const zIndexAnalysis = await page.evaluate(() => {
      const elements = [];
      
      // Check common high z-index elements
      const selectors = [
        'nav',
        '.fixed',
        '[class*="z-"]',
        '[style*="z-index"]'
      ];
      
      selectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex) || 0;
          if (zIndex > 0) {
            elements.push({
              selector,
              zIndex,
              element: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
              position: style.position
            });
          }
        });
      });
      
      return elements.sort((a, b) => b.zIndex - a.zIndex);
    });
    
    console.log('🔍 [HAMBURGER_DIAGNOSTIC] Test 7 - Z-Index Stack Analysis:', zIndexAnalysis);
    
    // Take screenshot for visual verification
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: 'hamburger-menu-diagnostic.png',
      fullPage: true 
    });
    
    console.log('🔍 [HAMBURGER_DIAGNOSTIC] Screenshot saved as hamburger-menu-diagnostic.png');
    
  } catch (error) {
    console.error('❌ [HAMBURGER_DIAGNOSTIC] Error during diagnostic:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnostic
diagnoseHamburgerMenu().then(() => {
  console.log('🔍 [HAMBURGER_DIAGNOSTIC] Diagnostic complete');
}).catch(error => {
  console.error('❌ [HAMBURGER_DIAGNOSTIC] Diagnostic failed:', error);
});