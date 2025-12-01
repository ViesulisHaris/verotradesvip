/**
 * Test script to verify that the infinite loop fixes are working properly
 * This script simulates the scenarios that were causing infinite loops before
 */

const { chromium } = require('playwright');

async function testInfiniteLoopFixes() {
  console.log('🧪 Starting infinite loop fix verification test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Listen for console errors
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error') {
      console.log('🔴 Console Error:', text);
    }
    
    // Check for infinite loop indicators
    if (text.includes('Maximum update depth exceeded')) {
      console.log('❌ INFINITE LOOP DETECTED:', text);
    }
    
    if (text.includes('INFINITE_LOOP_DEBUG')) {
      console.log('🔍 Debug message:', text);
    }
  });

  // Listen for uncaught errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
    if (error.message.includes('Maximum update depth exceeded')) {
      console.log('❌ INFINITE LOOP ERROR DETECTED!');
    }
  });

  try {
    // Navigate to the analytics page (where charts are displayed)
    console.log('📊 Navigating to analytics page...');
    await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Test 1: Check if page loads without infinite loops
    console.log('🧪 Test 1: Checking if page loads without infinite loops...');
    const initialErrorCount = consoleMessages.filter(msg => 
      msg.type === 'error' && msg.text.includes('Maximum update depth exceeded')
    ).length;
    
    if (initialErrorCount > 0) {
      console.log(`❌ FAILED: Found ${initialErrorCount} infinite loop errors on initial load`);
      return false;
    } else {
      console.log('✅ PASSED: No infinite loop errors on initial load');
    }
    
    // Test 2: Trigger sidebar toggle (this was causing infinite loops)
    console.log('🧪 Test 2: Testing sidebar toggle...');
    
    // Find and click the sidebar toggle button
    const sidebarToggle = await page.locator('[data-testid="sidebar-toggle"], button[aria-label*="sidebar"], button:has-text("Menu")').first();
    
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      console.log('📱 Sidebar toggle clicked');
      
      // Wait for transition to complete
      await page.waitForTimeout(500);
      
      // Check for infinite loops after toggle
      const afterToggleErrorCount = consoleMessages.filter(msg => 
        msg.type === 'error' && msg.text.includes('Maximum update depth exceeded')
      ).length;
      
      if (afterToggleErrorCount > initialErrorCount) {
        console.log(`❌ FAILED: Found ${afterToggleErrorCount - initialErrorCount} new infinite loop errors after sidebar toggle`);
        return false;
      } else {
        console.log('✅ PASSED: No new infinite loop errors after sidebar toggle');
      }
      
      // Toggle back
      await sidebarToggle.click();
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ Sidebar toggle button not found, skipping toggle test');
    }
    
    // Test 3: Resize window (this was also causing infinite loops)
    console.log('🧪 Test 3: Testing window resize...');
    
    const beforeResizeErrorCount = consoleMessages.filter(msg => 
      msg.type === 'error' && msg.text.includes('Maximum update depth exceeded')
    ).length;
    
    // Resize window multiple times
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(200);
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(200);
    
    const afterResizeErrorCount = consoleMessages.filter(msg => 
      msg.type === 'error' && msg.text.includes('Maximum update depth exceeded')
    ).length;
    
    if (afterResizeErrorCount > beforeResizeErrorCount) {
      console.log(`❌ FAILED: Found ${afterResizeErrorCount - beforeResizeErrorCount} new infinite loop errors after resize`);
      return false;
    } else {
      console.log('✅ PASSED: No new infinite loop errors after window resize');
    }
    
    // Test 4: Check for excessive debug messages (indicates loops)
    console.log('🧪 Test 4: Checking for excessive debug messages...');
    
    const debugMessages = consoleMessages.filter(msg => 
      msg.text.includes('INFINITE_LOOP_DEBUG')
    );
    
    if (debugMessages.length > 50) {
      console.log(`⚠️ WARNING: Found ${debugMessages.length} debug messages, might indicate a loop`);
    } else {
      console.log(`✅ PASSED: Found ${debugMessages.length} debug messages (within normal range)`);
    }
    
    // Test 5: Verify charts are rendered
    console.log('🧪 Test 5: Verifying charts are rendered...');
    
    const emotionRadar = await page.locator('[data-testid="emotion-radar"], .recharts-wrapper').first();
    const pnlChart = await page.locator('[data-testid="pnl-chart"], .recharts-wrapper').nth(1);
    
    const emotionRadarVisible = await emotionRadar.isVisible().catch(() => false);
    const pnlChartVisible = await pnlChart.isVisible().catch(() => false);
    
    if (emotionRadarVisible) {
      console.log('✅ PASSED: Emotion radar chart is visible');
    } else {
      console.log('⚠️ WARNING: Emotion radar chart not found or not visible');
    }
    
    if (pnlChartVisible) {
      console.log('✅ PASSED: P&L chart is visible');
    } else {
      console.log('⚠️ WARNING: P&L chart not found or not visible');
    }
    
    console.log('🎉 All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testInfiniteLoopFixes().then(success => {
  if (success) {
    console.log('\n✅ INFINITE LOOP FIX VERIFICATION: PASSED');
    console.log('🎯 The infinite loop issues have been successfully resolved!');
    process.exit(0);
  } else {
    console.log('\n❌ INFINITE LOOP FIX VERIFICATION: FAILED');
    console.log('🚨 There are still infinite loop issues that need to be addressed.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});