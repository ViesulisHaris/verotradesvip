/**
 * Trades Navigation Verification Test
 * 
 * This script verifies that the Trades tab navigation freeze issue has been resolved
 * after implementing the fixes for:
 * 1. Debug Panel Z-Index Fix in ZoomAwareLayout.tsx
 * 2. Modal Overlay Cleanup Fix in trades/page.tsx
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runTradesNavigationVerification() {
  console.log('🔍 Starting Trades Navigation Verification Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false for visual verification
    slowMo: 500 // Slow down actions for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Collect console logs and errors
  const consoleLogs = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  const testResults = {
    navigationFlow: {
      toTrades: false,
      fromTradesToDashboard: false,
      fromTradesToStrategies: false,
      multipleNavigationCycles: false
    },
    overlayInterference: {
      debugPanelZIndex: false,
      modalOverlayCleanup: false,
      noBlockingOverlays: false
    },
    edgeCases: {
      afterFiltering: false,
      afterSorting: false,
      afterModalInteraction: false,
      afterTradeExpansion: false
    },
    consoleErrors: {
      count: 0,
      errors: []
    },
    performance: {
      navigationTimes: [],
      overlayCleanupTimes: []
    }
  };
  
  try {
    // Test 1: Navigate to Trades page
    console.log('📍 Test 1: Navigate to Trades page');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Login (assuming test user exists)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to Trades page
    await page.click('a[href="/trades"]');
    await page.waitForURL('**/trades');
    await page.waitForLoadState('networkidle');
    
    const navigationTime = Date.now() - startTime;
    testResults.performance.navigationTimes.push(navigationTime);
    testResults.navigationFlow.toTrades = true;
    console.log(`✅ Successfully navigated to Trades page in ${navigationTime}ms`);
    
    // Test 2: Check for overlay interference
    console.log('\n🔍 Test 2: Check for overlay interference');
    
    // Check debug panel z-index
    const debugPanel = await page.$('.zoom-debug-panel');
    if (debugPanel) {
      const zIndex = await debugPanel.evaluate(el => 
        window.getComputedStyle(el).zIndex
      );
      const pointerEvents = await debugPanel.evaluate(el => 
        window.getComputedStyle(el).pointerEvents
      );
      
      testResults.overlayInterference.debugPanelZIndex = 
        parseInt(zIndex) <= 100 && pointerEvents === 'none';
      
      console.log(`📊 Debug panel z-index: ${zIndex}, pointer-events: ${pointerEvents}`);
    }
    
    // Check for any blocking overlays
    const overlays = await page.$$eval([
      '.fixed.inset-0',
      '.modal-backdrop',
      '[style*="position: fixed"]',
      '.modal-overlay',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '.fixed.z-50',
      '.fixed.z-\\[999999\\]'
    ].join(', '), elements => elements.length);
    
    testResults.overlayInterference.noBlockingOverlays = overlays === 0;
    console.log(`📊 Found ${overlays} potential blocking overlays`);
    
    // Test 3: Navigate away from Trades to Dashboard
    console.log('\n📍 Test 3: Navigate from Trades to Dashboard');
    const startTime2 = Date.now();
    
    // Check if cleanupModalOverlays function exists
    const cleanupExists = await page.evaluate(() => {
      return typeof window.cleanupModalOverlays === 'function' || 
             document.querySelector('script[data-cleanup-function]') !== null;
    });
    
    if (cleanupExists) {
      console.log('✅ Modal cleanup function is available');
    }
    
    await page.click('a[href="/dashboard"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    const navigationTime2 = Date.now() - startTime2;
    testResults.performance.navigationTimes.push(navigationTime2);
    testResults.navigationFlow.fromTradesToDashboard = true;
    console.log(`✅ Successfully navigated to Dashboard in ${navigationTime2}ms`);
    
    // Test 4: Navigate back to Trades
    console.log('\n📍 Test 4: Navigate back to Trades');
    
    await page.click('a[href="/trades"]');
    await page.waitForURL('**/trades');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Successfully navigated back to Trades');
    
    // Test 5: Navigate to Strategies
    console.log('\n📍 Test 5: Navigate from Trades to Strategies');
    const startTime3 = Date.now();
    
    await page.click('a[href="/strategies"]');
    await page.waitForURL('**/strategies');
    await page.waitForLoadState('networkidle');
    
    const navigationTime3 = Date.now() - startTime3;
    testResults.performance.navigationTimes.push(navigationTime3);
    testResults.navigationFlow.fromTradesToStrategies = true;
    console.log(`✅ Successfully navigated to Strategies in ${navigationTime3}ms`);
    
    // Test 6: Multiple navigation cycles
    console.log('\n📍 Test 6: Multiple navigation cycles');
    
    const pages = ['/trades', '/dashboard', '/strategies', '/trades', '/dashboard', '/trades'];
    
    for (let i = 0; i < pages.length; i++) {
      const targetPage = pages[i];
      const cycleStart = Date.now();
      
      await page.click(`a[href="${targetPage}"]`);
      await page.waitForURL(`**${targetPage}`);
      await page.waitForLoadState('networkidle');
      
      const cycleTime = Date.now() - cycleStart;
      console.log(`  🔄 Cycle ${i + 1}: ${targetPage} (${cycleTime}ms)`);
    }
    
    testResults.navigationFlow.multipleNavigationCycles = true;
    console.log('✅ Multiple navigation cycles completed successfully');
    
    // Test 7: Edge cases - Filtering
    console.log('\n🔍 Test 7: Edge case - Filtering');
    
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with filter elements
    const symbolInput = await page.$('input[placeholder*="Search symbol"]');
    if (symbolInput) {
      await symbolInput.fill('AAPL');
      await page.waitForTimeout(1000);
      
      // Try to navigate after filtering
      await page.click('a[href="/dashboard"]');
      await page.waitForURL('**/dashboard');
      
      testResults.edgeCases.afterFiltering = true;
      console.log('✅ Navigation works after filtering');
    }
    
    // Test 8: Edge cases - Sorting
    console.log('\n🔍 Test 8: Edge case - Sorting');
    
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with sort elements
    const sortButton = await page.$('button[aria-label*="sort"], .sort-indicator');
    if (sortButton) {
      await sortButton.click();
      await page.waitForTimeout(1000);
      
      // Try to navigate after sorting
      await page.click('a[href="/strategies"]');
      await page.waitForURL('**/strategies');
      
      testResults.edgeCases.afterSorting = true;
      console.log('✅ Navigation works after sorting');
    }
    
    // Test 9: Edge cases - Modal interaction
    console.log('\n🔍 Test 9: Edge case - Modal interaction');
    
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Try to open and close a modal
    const editButton = await page.$('button[title*="edit"], button[title*="Edit"]');
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal is open
      const modal = await page.$('.fixed.inset-0, .modal-backdrop');
      if (modal) {
        // Try to close modal
        const closeButton = await page.$('button[aria-label*="close"], button[title*="close"], .close-button');
        if (closeButton) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      }
      
      // Try to navigate after modal interaction
      await page.click('a[href="/dashboard"]');
      await page.waitForURL('**/dashboard');
      
      testResults.edgeCases.afterModalInteraction = true;
      console.log('✅ Navigation works after modal interaction');
    }
    
    // Test 10: Edge cases - Trade expansion
    console.log('\n🔍 Test 10: Edge case - Trade expansion');
    
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    // Try to expand a trade
    const expandButton = await page.$('button[aria-label*="expand"], .expand-button, button:has(svg)');
    if (expandButton) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Try to navigate after trade expansion
      await page.click('a[href="/strategies"]');
      await page.waitForURL('**/strategies');
      
      testResults.edgeCases.afterTradeExpansion = true;
      console.log('✅ Navigation works after trade expansion');
    }
    
    // Final check for any remaining overlays
    console.log('\n🔍 Final overlay check');
    
    await page.goto('http://localhost:3000/trades');
    await page.waitForLoadState('networkidle');
    
    const finalOverlays = await page.$$eval([
      '.fixed.inset-0',
      '.modal-backdrop',
      '[style*="position: fixed"]',
      '.modal-overlay',
      '[role="dialog"]',
      '[aria-modal="true"]'
    ].join(', '), elements => 
      elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position
      }))
    );
    
    testResults.overlayInterference.modalOverlayCleanup = finalOverlays.length === 0;
    console.log(`📊 Final overlay count: ${finalOverlays.length}`);
    
    if (finalOverlays.length > 0) {
      console.log('⚠️ Remaining overlays:', finalOverlays);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.consoleErrors.errors.push(error.message);
  } finally {
    // Collect console errors
    testResults.consoleErrors.count = jsErrors.length;
    testResults.consoleErrors.errors = jsErrors;
    
    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript errors found:');
      jsErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    }
    
    await browser.close();
  }
  
  // Calculate performance metrics
  if (testResults.performance.navigationTimes.length > 0) {
    const avgNavigationTime = testResults.performance.navigationTimes.reduce((a, b) => a + b, 0) / 
                              testResults.performance.navigationTimes.length;
    testResults.performance.averageNavigationTime = avgNavigationTime;
    console.log(`\n📊 Average navigation time: ${avgNavigationTime.toFixed(2)}ms`);
  }
  
  return testResults;
}

// Run the verification test
runTradesNavigationVerification()
  .then(results => {
    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log('==========================');
    
    console.log('\n🧭 Navigation Flow:');
    Object.entries(results.navigationFlow).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('\n🔍 Overlay Interference:');
    Object.entries(results.overlayInterference).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('\n🧪 Edge Cases:');
    Object.entries(results.edgeCases).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('\n🐛 Console Errors:');
    console.log(`  ${results.consoleErrors.count === 0 ? '✅' : '❌'} Error count: ${results.consoleErrors.count}`);
    
    // Overall assessment
    const allTests = [
      ...Object.values(results.navigationFlow),
      ...Object.values(results.overlayInterference),
      ...Object.values(results.edgeCases)
    ];
    
    const passedTests = allTests.filter(Boolean).length;
    const totalTests = allTests.length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log(`  Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests} tests passed)`);
    
    if (successRate >= 90) {
      console.log('  ✅ Trades tab navigation freeze issue appears to be RESOLVED');
    } else if (successRate >= 70) {
      console.log('  ⚠️ Trades tab navigation issue is PARTIALLY RESOLVED - some issues remain');
    } else {
      console.log('  ❌ Trades tab navigation freeze issue is NOT RESOLVED - significant issues remain');
    }
    
    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        successRate,
        passedTests,
        totalTests,
        resolved: successRate >= 90
      }
    };
    
    fs.writeFileSync(
      'trades-navigation-verification-report.json',
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: trades-navigation-verification-report.json');
    
    return results;
  })
  .catch(error => {
    console.error('❌ Verification test failed:', error);
    process.exit(1);
  });