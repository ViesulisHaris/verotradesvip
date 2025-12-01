// Test script to verify the infinite refresh fix in StrategyPerformanceModal
const { chromium } = require('playwright');

async function testInfiniteRefreshFix() {
  console.log('🔧 Testing infinite refresh fix in StrategyPerformanceModal...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:3000/analytics');
    
    // Wait for login or navigate directly if already logged in
    await page.waitForTimeout(2000);
    
    // Look for strategy cards and click on one to open the modal
    console.log('🔍 Looking for strategy cards...');
    await page.waitForSelector('[data-testid="strategy-card"], .strategy-card', { timeout: 10000 });
    
    // Click on the first strategy card
    await page.click('[data-testid="strategy-card"], .strategy-card');
    
    // Wait for modal to appear
    console.log('⏳ Waiting for strategy modal to appear...');
    await page.waitForSelector('[data-testid="strategy-performance-modal-backdrop"], .modal-backdrop', { timeout: 5000 });
    
    // Click on the Performance tab
    console.log('📊 Clicking on Performance tab...');
    await page.click('button:has-text("Performance")');
    
    // Monitor for excessive re-renders by checking console logs
    let refreshCount = 0;
    page.on('console', msg => {
      if (msg.text().includes('StrategyPerformanceModal mounted useEffect triggered')) {
        refreshCount++;
        console.log(`🔄 Refresh count: ${refreshCount}`);
      }
    });
    
    // Wait and observe for potential infinite refresh
    console.log('⏱️ Monitoring for infinite refresh for 10 seconds...');
    await page.waitForTimeout(10000);
    
    // Check if infinite refresh was fixed
    if (refreshCount <= 3) {
      console.log('✅ SUCCESS: Infinite refresh appears to be fixed! Refresh count:', refreshCount);
    } else {
      console.log('❌ FAILURE: Infinite refresh may still be occurring. Refresh count:', refreshCount);
    }
    
    // Take a screenshot for documentation
    await page.screenshot({ path: 'infinite-refresh-fix-test-result.png' });
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testInfiniteRefreshFix();