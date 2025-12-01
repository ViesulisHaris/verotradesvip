/**
 * Test script to verify Trades tab navigation freeze fixes
 * 
 * This script tests:
 * 1. Debug panel z-index fixes
 * 2. Modal overlay cleanup fixes
 * 3. Navigation functionality after visiting Trades page
 */

const { chromium } = require('playwright');

async function testTradesNavigationFixes() {
  console.log('🧪 Testing Trades tab navigation fixes...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Login if needed
    console.log('🔐 Checking login status...');
    const loginButton = await page.$('text=Login');
    if (loginButton) {
      console.log('🔑 Logging in...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to Trades page
    console.log('📊 Navigating to Trades page...');
    await page.click('text=Trades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow page to fully load
    
    // Check for debug panel
    console.log('🔍 Checking debug panel z-index...');
    const debugPanel = await page.$('.zoom-debug-panel');
    if (debugPanel) {
      const zIndex = await debugPanel.evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      });
      const pointerEvents = await debugPanel.evaluate(el => {
        return window.getComputedStyle(el).pointerEvents;
      });
      console.log(`🐛 Debug panel z-index: ${zIndex}, pointer-events: ${pointerEvents}`);
      
      if (parseInt(zIndex) > 100) {
        console.log('❌ Debug panel z-index is still too high!');
      } else {
        console.log('✅ Debug panel z-index is acceptable');
      }
      
      if (pointerEvents === 'none') {
        console.log('✅ Debug panel has pointer-events: none');
      } else {
        console.log('⚠️ Debug panel may still block clicks');
      }
    } else {
      console.log('ℹ️ Debug panel not found (likely production mode)');
    }
    
    // Test modal cleanup by opening and closing a modal
    console.log('🪟 Testing modal cleanup...');
    const editButton = await page.$('button[title="Edit trade"]');
    if (editButton) {
      console.log('📝 Opening edit modal...');
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal is visible
      const modal = await page.$('.fixed.inset-0');
      if (modal) {
        const modalZIndex = await modal.evaluate(el => {
          return window.getComputedStyle(el).zIndex;
        });
        console.log(`🪟 Modal z-index: ${modalZIndex}`);
        
        // Close modal
        console.log('❌ Closing modal...');
        const closeButton = await page.$('button:has(svg)');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Check if modal was properly cleaned up
        const remainingModals = await page.$$('.fixed.inset-0');
        console.log(`🧹 Remaining modals after close: ${remainingModals.length}`);
      }
    }
    
    // Test navigation away from Trades page
    console.log('🧭 Testing navigation away from Trades page...');
    
    // Try to navigate to Dashboard
    console.log('📈 Navigating to Dashboard...');
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if navigation worked
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || !currentUrl.includes('/trades')) {
      console.log('✅ Navigation away from Trades page successful');
    } else {
      console.log('❌ Navigation away from Trades page failed');
    }
    
    // Navigate back to Trades to test again
    console.log('🔄 Navigating back to Trades page...');
    await page.click('text=Trades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try navigation to another page
    console.log('📈 Navigating to Performance...');
    await page.click('text=Performance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Final check
    const finalUrl = page.url();
    if (finalUrl.includes('/performance') || !finalUrl.includes('/trades')) {
      console.log('✅ Second navigation test successful');
    } else {
      console.log('❌ Second navigation test failed');
    }
    
    // Check for any lingering overlays
    console.log('🔍 Checking for lingering overlays...');
    const overlays = await page.$$('.fixed.inset-0, .modal-backdrop, [style*="position: fixed"]');
    console.log(`📊 Found ${overlays.length} potential overlay elements`);
    
    overlays.forEach(async (overlay, index) => {
      const zIndex = await overlay.evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      });
      const display = await overlay.evaluate(el => {
        return window.getComputedStyle(el).display;
      });
      console.log(`  Overlay ${index + 1}: z-index=${zIndex}, display=${display}`);
    });
    
    console.log('✅ Trades navigation fix test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTradesNavigationFixes().catch(console.error);