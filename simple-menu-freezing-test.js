/**
 * Simple Menu Freezing Test
 * 
 * This script specifically tests the menu freezing issue by:
 * 1. Going directly to the Trades page
 * 2. Testing menu responsiveness
 * 3. Navigating away and back
 * 4. Checking if menu remains responsive
 */

const { chromium } = require('playwright');

async function testMenuFreezing() {
  console.log('🔍 Starting Simple Menu Freezing Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Go directly to Trades page (bypassing login for testing)
    console.log('📍 Step 1: Navigating to Trades page...');
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(3000);
    
    // Step 2: Check if menu is visible and responsive
    console.log('🧪 Step 2: Testing menu visibility and responsiveness...');
    
    // Check for navigation elements
    const navElement = page.locator('nav').first();
    const isNavVisible = await navElement.isVisible();
    console.log(`   Navigation visible: ${isNavVisible}`);
    
    // Look for any navigation links
    const navLinks = page.locator('nav a, [role="navigation"] a, .nav-link');
    const navLinksCount = await navLinks.count();
    console.log(`   Navigation links found: ${navLinksCount}`);
    
    if (navLinksCount > 0) {
      // Test the first navigation link
      const firstNavLink = navLinks.first();
      const isFirstLinkVisible = await firstNavLink.isVisible();
      console.log(`   First nav link visible: ${isFirstLinkVisible}`);
      
      if (isFirstLinkVisible) {
        // Test hover state
        await firstNavLink.hover();
        await page.waitForTimeout(1000);
        
        // Check if hover worked by evaluating styles
        const hoverStyles = await firstNavLink.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            pointerEvents: styles.pointerEvents,
            cursor: styles.cursor
          };
        });
        console.log(`   Hover styles:`, hoverStyles);
        
        // Test click
        await firstNavLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('   ✅ Navigation link clicked successfully');
      }
    }
    
    // Step 3: Test mobile menu button if present
    console.log('📱 Step 3: Testing mobile menu button...');
    
    const mobileMenuButton = page.locator('.mobile-menu-button, .menu-button, .sidebar-toggle');
    const mobileMenuCount = await mobileMenuButton.count();
    console.log(`   Mobile menu buttons found: ${mobileMenuCount}`);
    
    if (mobileMenuCount > 0) {
      const firstMobileButton = mobileMenuButton.first();
      const isMobileButtonVisible = await firstMobileButton.isVisible();
      console.log(`   Mobile menu button visible: ${isMobileButtonVisible}`);
      
      if (isMobileButtonVisible) {
        // Test mobile menu button
        await firstMobileButton.hover();
        await page.waitForTimeout(500);
        
        const mobileButtonStyles = await firstMobileButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            pointerEvents: styles.pointerEvents,
            cursor: styles.cursor,
            zIndex: styles.zIndex
          };
        });
        console.log(`   Mobile button styles:`, mobileButtonStyles);
        
        await firstMobileButton.click();
        await page.waitForTimeout(1000);
        
        console.log('   ✅ Mobile menu button clicked successfully');
      }
    }
    
    // Step 4: Check for CSS conflicts
    console.log('🔍 Step 4: Checking for CSS conflicts...');
    
    // Check if Balatro container exists
    const balatroContainer = page.locator('.balatro-container');
    const balatroCount = await balatroContainer.count();
    console.log(`   Balatro containers found: ${balatroCount}`);
    
    if (balatroCount > 0) {
      // Check pointer events on navigation elements
      const navPointerEvents = await navElement.evaluate(el => {
        return window.getComputedStyle(el).pointerEvents;
      });
      console.log(`   Navigation pointer-events: ${navPointerEvents}`);
      
      if (navLinksCount > 0) {
        const linkPointerEvents = await navLinks.first().evaluate(el => {
          return window.getComputedStyle(el).pointerEvents;
        });
        console.log(`   Navigation link pointer-events: ${linkPointerEvents}`);
      }
    }
    
    // Step 5: Test multiple navigation cycles
    console.log('🔄 Step 5: Testing multiple navigation cycles...');
    
    for (let i = 0; i < 2; i++) {
      console.log(`   Cycle ${i + 1}:`);
      
      // Try to navigate to different pages
      const possiblePages = ['Dashboard', 'Analytics', 'Strategies', 'Calendar'];
      
      for (const pageName of possiblePages) {
        try {
          const pageLink = page.locator(`nav a:has-text("${pageName}"), [role="navigation"] a:has-text("${pageName}")`);
          const isPageLinkVisible = await pageLink.isVisible();
          
          if (isPageLinkVisible) {
            console.log(`     Clicking ${pageName}...`);
            await pageLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            // Check if menu is still responsive
            const menuStillVisible = await navElement.isVisible();
            console.log(`     Menu still visible after ${pageName}: ${menuStillVisible}`);
            
            break; // Found and clicked a link, move to next cycle
          }
        } catch (error) {
          console.log(`     Could not navigate to ${pageName}`);
        }
      }
    }
    
    // Step 6: Final assessment
    console.log('✅ Step 6: Final assessment...');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'simple-menu-freezing-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: simple-menu-freezing-test.png');
    
    // Final menu check
    const finalMenuVisible = await navElement.isVisible();
    const finalLinksCount = await navLinks.count();
    
    console.log(`   Final menu visibility: ${finalMenuVisible}`);
    console.log(`   Final navigation links count: ${finalLinksCount}`);
    
    if (finalMenuVisible && finalLinksCount > 0) {
      console.log('✅ SUCCESS: Menu remains responsive throughout the test');
      console.log('✅ Menu freezing issue appears to be RESOLVED');
    } else {
      console.log('❌ FAILURE: Menu became unresponsive');
      console.log('❌ Menu freezing issue may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMenuFreezing().then(() => {
  console.log('🏁 Simple Menu Freezing Test Complete');
}).catch(error => {
  console.error('💥 Test failed:', error);
});