/**
 * Menu Freezing Fix Verification Script
 * 
 * This script tests whether the menu freezing issue has been resolved
 * after implementing the fixes for:
 * 1. Debug Panel Z-Index Issues in ZoomAwareLayout
 * 2. Navigation Safety System Conflicts
 * 3. Balatro CSS Pointer Events Issues
 */

const { chromium } = require('playwright');
const path = require('path');

async function verifyMenuFreezingFix() {
  console.log('🔍 Starting Menu Freezing Fix Verification...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Login to the application
    console.log('🔐 Step 2: Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Step 3: Test navigation to Trades page (where freezing occurs)
    console.log('🔄 Step 3: Navigating to Trades page...');
    
    // Check if menu is responsive before navigation
    const menuBeforeTrades = await page.locator('nav').isVisible();
    console.log(`   Menu visible before Trades: ${menuBeforeTrades}`);
    
    // Navigate to Trades page
    await page.click('text=Trades');
    await page.waitForLoadState('networkidle');
    
    // Wait for Trades page to load
    await page.waitForSelector('text=Trades', { timeout: 10000 });
    
    // Step 4: Test menu responsiveness on Trades page
    console.log('🧪 Step 4: Testing menu responsiveness on Trades page...');
    
    // Check if menu is visible on Trades page
    const menuOnTrades = await page.locator('nav').isVisible();
    console.log(`   Menu visible on Trades: ${menuOnTrades}`);
    
    // Test clicking on menu items
    const dashboardLink = page.locator('nav a[href="/dashboard"]');
    const isDashboardVisible = await dashboardLink.isVisible();
    console.log(`   Dashboard link visible: ${isDashboardVisible}`);
    
    if (isDashboardVisible) {
      // Hover over dashboard link to test responsiveness
      await dashboardLink.hover();
      await page.waitForTimeout(1000);
      
      // Check if hover state is working
      const hoverStyles = await dashboardLink.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log(`   Dashboard link hover state: ${hoverStyles}`);
    }
    
    // Step 5: Navigate away from Trades page
    console.log('🔙 Step 5: Navigating away from Trades page...');
    
    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for Dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Step 6: Test menu responsiveness after leaving Trades page
    console.log('🧪 Step 6: Testing menu responsiveness after leaving Trades page...');
    
    // Check if menu is still responsive
    const menuAfterTrades = await page.locator('nav').isVisible();
    console.log(`   Menu visible after leaving Trades: ${menuAfterTrades}`);
    
    // Test clicking on different menu items
    const strategiesLink = page.locator('nav a[href="/strategies"]');
    const isStrategiesVisible = await strategiesLink.isVisible();
    console.log(`   Strategies link visible: ${isStrategiesVisible}`);
    
    if (isStrategiesVisible) {
      await strategiesLink.hover();
      await page.waitForTimeout(1000);
      
      const strategiesHoverStyles = await strategiesLink.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log(`   Strategies link hover state: ${strategiesHoverStyles}`);
    }
    
    // Step 7: Test multiple navigation cycles
    console.log('🔄 Step 7: Testing multiple navigation cycles...');
    
    for (let i = 0; i < 3; i++) {
      console.log(`   Navigation cycle ${i + 1}:`);
      
      // Go to Trades
      await page.click('text=Trades');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const menuOnTradesCycle = await page.locator('nav').isVisible();
      console.log(`     Menu on Trades: ${menuOnTradesCycle}`);
      
      // Go to Analytics
      await page.click('text=Analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const menuOnAnalytics = await page.locator('nav').isVisible();
      console.log(`     Menu on Analytics: ${menuOnAnalytics}`);
      
      // Go to Dashboard
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const menuOnDashboard = await page.locator('nav').isVisible();
      console.log(`     Menu on Dashboard: ${menuOnDashboard}`);
    }
    
    // Step 8: Check for CSS conflicts
    console.log('🔍 Step 8: Checking for CSS conflicts...');
    
    const balatroContainer = page.locator('.balatro-container');
    const hasBalatro = await balatroContainer.count();
    console.log(`   Balatro container found: ${hasBalatro > 0}`);
    
    if (hasBalatro > 0) {
      // Check if navigation elements have proper pointer events
      const navPointerEvents = await page.locator('nav').evaluate(el => {
        return window.getComputedStyle(el).pointerEvents;
      });
      console.log(`   Navigation pointer-events: ${navPointerEvents}`);
      
      const linkPointerEvents = await page.locator('nav a').first().evaluate(el => {
        return window.getComputedStyle(el).pointerEvents;
      });
      console.log(`   Navigation link pointer-events: ${linkPointerEvents}`);
    }
    
    // Step 9: Check debug panel z-index
    console.log('🔍 Step 9: Checking debug panel z-index...');
    
    const debugPanel = page.locator('.zoom-debug-panel');
    const hasDebugPanel = await debugPanel.count();
    console.log(`   Debug panel found: ${hasDebugPanel > 0}`);
    
    if (hasDebugPanel > 0) {
      const debugZIndex = await debugPanel.evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      });
      console.log(`   Debug panel z-index: ${debugZIndex}`);
      
      const debugPointerEvents = await debugPanel.evaluate(el => {
        return window.getComputedStyle(el).pointerEvents;
      });
      console.log(`   Debug panel pointer-events: ${debugPointerEvents}`);
    }
    
    // Step 10: Final assessment
    console.log('✅ Step 10: Final assessment...');
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'menu-freezing-fix-verification.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: menu-freezing-fix-verification.png');
    
    // Check if menu is still responsive
    const finalMenuCheck = await page.locator('nav').isVisible();
    const finalLinkCheck = await page.locator('nav a').first().isVisible();
    
    if (finalMenuCheck && finalLinkCheck) {
      console.log('✅ SUCCESS: Menu is responsive after all navigation tests');
      console.log('✅ Menu freezing issue appears to be RESOLVED');
    } else {
      console.log('❌ FAILURE: Menu is still not responsive');
      console.log('❌ Menu freezing issue may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyMenuFreezingFix().then(() => {
  console.log('🏁 Menu Freezing Fix Verification Complete');
}).catch(error => {
  console.error('💥 Verification failed:', error);
});