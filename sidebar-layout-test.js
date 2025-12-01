/**
 * Sidebar Layout Test Script
 * Tests that the sidebar functions as an overlay without affecting main content positioning
 */

const { chromium } = require('playwright');

async function testSidebarLayout() {
  console.log('🧪 Testing Sidebar Layout Fix...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for initial render

    console.log('📊 Testing desktop sidebar behavior...');

    // Get initial main content position
    const mainContentInitial = await page.locator('main').boundingBox();
    console.log(`Initial main content position: x=${mainContentInitial.x}, y=${mainContentInitial.y}`);

    // Test navigation to trades page
    console.log('🔄 Navigating to trades page...');
    await page.click('a[href="/trades"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get main content position after navigation
    const mainContentAfterNav = await page.locator('main').boundingBox();
    console.log(`Main content position after navigation: x=${mainContentAfterNav.x}, y=${mainContentAfterNav.y}`);

    // Check if position changed (should be stable)
    const positionChanged = Math.abs(mainContentInitial.x - mainContentAfterNav.x) > 1;
    if (positionChanged) {
      console.log('❌ ISSUE: Main content position shifted after navigation');
    } else {
      console.log('✅ SUCCESS: Main content position stable after navigation');
    }

    // Test sidebar toggle
    console.log('🔄 Testing sidebar collapse/expand...');
    const toggleButton = page.locator('button[aria-label*="sidebar"], button[aria-label*="Close sidebar"], button[aria-label*="Open sidebar"]');
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);

      const mainContentAfterToggle = await page.locator('main').boundingBox();
      console.log(`Main content position after toggle: x=${mainContentAfterToggle.x}, y=${mainContentAfterToggle.y}`);

      const togglePositionChanged = Math.abs(mainContentInitial.x - mainContentAfterToggle.x) > 1;
      if (togglePositionChanged) {
        console.log('❌ ISSUE: Main content position shifted after sidebar toggle');
      } else {
        console.log('✅ SUCCESS: Main content position stable after sidebar toggle');
      }
    } else {
      console.log('⚠️  Sidebar toggle button not found');
    }

    // Test mobile behavior
    console.log('📱 Testing mobile behavior...');
    await context.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mainContentMobile = await page.locator('main').boundingBox();
    console.log(`Mobile main content position: x=${mainContentMobile.x}, y=${mainContentMobile.y}`);

    // Test mobile menu toggle
    const mobileMenuButton = page.locator('.verotrade-mobile-menu-btn');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      const mainContentMobileAfterToggle = await page.locator('main').boundingBox();
      console.log(`Mobile main content position after menu toggle: x=${mainContentMobileAfterToggle.x}, y=${mainContentMobileAfterToggle.y}`);

      const mobilePositionChanged = Math.abs(mainContentMobile.x - mainContentMobileAfterToggle.x) > 1;
      if (mobilePositionChanged) {
        console.log('❌ ISSUE: Mobile main content position shifted after menu toggle');
      } else {
        console.log('✅ SUCCESS: Mobile main content position stable after menu toggle');
      }
    }

    // Test navigation to strategies page
    console.log('🔄 Testing navigation to strategies page...');
    await context.setViewportSize({ width: 1200, height: 800 }); // Back to desktop
    await page.waitForTimeout(1000);
    
    await page.click('a[href="/strategies"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const mainContentStrategies = await page.locator('main').boundingBox();
    console.log(`Strategies page main content position: x=${mainContentStrategies.x}, y=${mainContentStrategies.y}`);

    const strategiesPositionChanged = Math.abs(mainContentInitial.x - mainContentStrategies.x) > 1;
    if (strategiesPositionChanged) {
      console.log('❌ ISSUE: Main content position shifted on strategies page');
    } else {
      console.log('✅ SUCCESS: Main content position stable on strategies page');
    }

    // Final summary
    console.log('\n📋 SIDEBAR LAYOUT TEST SUMMARY:');
    console.log('- Desktop navigation stability: ' + (positionChanged ? 'FAILED' : 'PASSED'));
    console.log('- Desktop sidebar toggle stability: ' + (togglePositionChanged ? 'FAILED' : 'PASSED'));
    console.log('- Mobile menu toggle stability: ' + (mobilePositionChanged ? 'FAILED' : 'PASSED'));
    console.log('- Strategies page stability: ' + (strategiesPositionChanged ? 'FAILED' : 'PASSED'));

    // Take screenshot for visual verification
    await page.screenshot({ path: 'sidebar-layout-test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved as sidebar-layout-test-final.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testSidebarLayout().catch(console.error);