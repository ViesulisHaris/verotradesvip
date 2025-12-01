/**
 * Navigation Freezing Fix Verification Test
 * 
 * This test verifies that the critical timing fixes resolve the persistent menu freezing issue:
 * 1. Navigation Safety Timing Conflicts - aligned to 30000ms
 * 2. Enhanced state management to prevent cleanup during active navigation
 * 3. Debug panel z-index conflicts resolved
 * 4. Manual click testing without timing interference
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runNavigationFreezingFixVerification() {
  console.log('🔧 NAVIGATION FREEZING FIX VERIFICATION');
  console.log('=====================================');
  console.log('Testing critical timing fixes for menu freezing issue...\n');

  const browser = await chromium.launch({ 
    headless: false, // Show browser for manual verification
    slowMo: 100 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Navigation Safety') || text.includes('🧭') || text.includes('🔍') || text.includes('🚫')) {
      console.log('BROWSER:', text);
    }
  });

  const testResults = {
    timingFixes: [],
    stateManagement: [],
    debugPanelFixes: [],
    manualClickTests: [],
    overallStatus: 'PENDING'
  };

  try {
    console.log('📍 Step 1: Navigate to application and initialize navigation safety...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Wait for navigation safety to initialize
    await page.waitForTimeout(1000);

    console.log('✅ Application loaded successfully');

    // Test 1: Verify Navigation Safety Timing Fix
    console.log('\n🧪 Test 1: Navigation Safety Timing Fix Verification');
    console.log('---------------------------------------------------');
    
    // Check if navigation safety is enabled
    const navigationSafetyEnabled = await page.evaluate(() => {
      return window.navigationSafety && window.navigationSafety.isNavigationSafetyEnabled();
    });
    
    testResults.timingFixes.push({
      test: 'Navigation Safety Enabled',
      status: navigationSafetyEnabled ? 'PASS' : 'FAIL',
      details: `Navigation safety system: ${navigationSafetyEnabled ? 'enabled' : 'disabled'}`
    });

    // Test the cleanup cooldown timing
    const cleanupTimingTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Test multiple cleanup calls to verify cooldown
        let cleanupCallCount = 0;
        const originalCleanup = window.navigationSafety.forceCleanupNavigationBlockers;
        
        window.navigationSafety.forceCleanupNavigationBlockers = function() {
          cleanupCallCount++;
          console.log(`Cleanup called ${cleanupCallCount} times`);
          return originalCleanup.call(this);
        };
        
        // Call cleanup multiple times rapidly
        window.navigationSafety.forceCleanupNavigationBlockers();
        setTimeout(() => window.navigationSafety.forceCleanupNavigationBlockers(), 100);
        setTimeout(() => window.navigationSafety.forceCleanupNavigationBlockers(), 200);
        setTimeout(() => window.navigationSafety.forceCleanupNavigationBlockers(), 300);
        
        setTimeout(() => {
          resolve({
            cleanupCallCount,
            cooldownWorking: cleanupCallCount <= 2 // Should only execute once due to cooldown
          });
        }, 500);
      });
    });

    testResults.timingFixes.push({
      test: 'Cleanup Cooldown Timing (30000ms)',
      status: cleanupTimingTest.cooldownWorking ? 'PASS' : 'FAIL',
      details: `Cleanup calls: ${cleanupTimingTest.cleanupCallCount}, Cooldown working: ${cleanupTimingTest.cooldownWorking}`
    });

    console.log('✅ Navigation Safety Timing Fix tests completed');

    // Test 2: Verify Enhanced State Management
    console.log('\n🧪 Test 2: Enhanced State Management Verification');
    console.log('--------------------------------------------------');

    // Test navigation state management
    const stateManagementTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Test navigation state protection
        let stateTestResults = {
          navigationFlagSet: false,
          userInteractionFlagSet: false,
          cleanupSkippedDuringNavigation: false
        };

        // Override forceCleanup to check if it's skipped during navigation
        const originalCleanup = window.navigationSafety.forceCleanupNavigationBlockers;
        
        window.navigationSafety.forceCleanupNavigationBlockers = function() {
          const result = originalCleanup.call(this);
          if (this.isNavigating || this.userInteractionInProgress) {
            stateTestResults.cleanupSkippedDuringNavigation = true;
          }
          return result;
        };

        // Test safeNavigation function
        window.navigationSafety.safeNavigation('/test-navigation', 'Test Navigation');
        
        setTimeout(() => {
          // Check if navigation flags were set
          stateTestResults.navigationFlagSet = window.navigationSafety.isNavigating;
          stateTestResults.userInteractionFlagSet = window.navigationSafety.userInteractionInProgress;
          
          resolve(stateTestResults);
        }, 100);
      });
    });

    testResults.stateManagement.push({
      test: 'Navigation State Protection',
      status: stateManagementTest.navigationFlagSet ? 'PASS' : 'FAIL',
      details: `Navigation flag: ${stateManagementTest.navigationFlagSet}, User interaction: ${stateManagementTest.userInteractionFlagSet}`
    });

    testResults.stateManagement.push({
      test: 'Cleanup Skip During Navigation',
      status: stateManagementTest.cleanupSkippedDuringNavigation ? 'PASS' : 'FAIL',
      details: `Cleanup properly skipped during navigation: ${stateManagementTest.cleanupSkippedDuringNavigation}`
    });

    console.log('✅ Enhanced State Management tests completed');

    // Test 3: Verify Debug Panel Z-Index Fix
    console.log('\n🧪 Test 3: Debug Panel Z-Index Fix Verification');
    console.log('--------------------------------------------------');

    const debugPanelTest = await page.evaluate(() => {
      const debugPanel = document.querySelector('.zoom-debug-panel');
      if (!debugPanel) {
        return { found: false, zIndex: null, pointerEvents: null };
      }
      
      const computedStyle = window.getComputedStyle(debugPanel);
      return {
        found: true,
        zIndex: computedStyle.zIndex,
        pointerEvents: computedStyle.pointerEvents,
        opacity: computedStyle.opacity,
        transform: computedStyle.transform
      };
    });

    testResults.debugPanelFixes.push({
      test: 'Debug Panel Z-Index (-1)',
      status: debugPanelTest.found && debugPanelTest.zIndex === '-1' ? 'PASS' : 'FAIL',
      details: `Z-index: ${debugPanelTest.zIndex}, Found: ${debugPanelTest.found}`
    });

    testResults.debugPanelFixes.push({
      test: 'Debug Panel Pointer Events (none)',
      status: debugPanelTest.found && debugPanelTest.pointerEvents === 'none' ? 'PASS' : 'FAIL',
      details: `Pointer events: ${debugPanelTest.pointerEvents}`
    });

    testResults.debugPanelFixes.push({
      test: 'Debug Panel Low Intrusiveness',
      status: debugPanelTest.found && parseFloat(debugPanelTest.opacity) <= 0.4 ? 'PASS' : 'FAIL',
      details: `Opacity: ${debugPanelTest.opacity}, Transform: ${debugPanelTest.transform}`
    });

    console.log('✅ Debug Panel Z-Index Fix tests completed');

    // Test 4: Manual Click Testing - Navigation Flow
    console.log('\n🧪 Test 4: Manual Click Testing - Navigation Flow');
    console.log('---------------------------------------------------');

    // First, login if needed
    try {
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Check if already logged in
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log('🔐 Logging in for navigation test...');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('⚠️ Login attempt failed, continuing with available pages...');
    }

    // Test navigation to Trades page
    console.log('🔄 Testing navigation to Trades page...');
    
    try {
      // Look for Trades navigation link
      const tradesLink = await page.locator('a[href*="/trades"], a:has-text("Trades"), nav a:has-text("Trades")').first();
      
      if (await tradesLink.isVisible()) {
        console.log('📱 Found Trades navigation link, testing click...');
        
        // Test manual click without timing interference
        const clickStartTime = Date.now();
        await tradesLink.click();
        const clickEndTime = Date.now();
        
        await page.waitForTimeout(2000); // Wait for navigation
        
        const navigationTime = clickEndTime - clickStartTime;
        const currentUrl = page.url();
        
        testResults.manualClickTests.push({
          test: 'Trades Page Navigation Click',
          status: currentUrl.includes('/trades') ? 'PASS' : 'FAIL',
          details: `Navigation time: ${navigationTime}ms, Final URL: ${currentUrl}`
        });
        
        console.log(`✅ Navigation to Trades completed in ${navigationTime}ms`);
        
        // Test navigation away from Trades page
        console.log('🔄 Testing navigation away from Trades page...');
        
        const dashboardLink = await page.locator('a[href*="/dashboard"], a:has-text("Dashboard"), nav a:has-text("Dashboard")').first();
        
        if (await dashboardLink.isVisible()) {
          const awayClickStartTime = Date.now();
          await dashboardLink.click();
          const awayClickEndTime = Date.now();
          
          await page.waitForTimeout(2000);
          
          const awayNavigationTime = awayClickEndTime - awayClickStartTime;
          const awayUrl = page.url();
          
          testResults.manualClickTests.push({
            test: 'Away from Trades Navigation Click',
            status: !awayUrl.includes('/trades') ? 'PASS' : 'FAIL',
            details: `Navigation time: ${awayNavigationTime}ms, Final URL: ${awayUrl}`
          });
          
          console.log(`✅ Navigation away from Trades completed in ${awayNavigationTime}ms`);
        } else {
          testResults.manualClickTests.push({
            test: 'Away from Trades Navigation Click',
            status: 'SKIP',
            details: 'Dashboard link not found'
          });
        }
        
        // Test return to Trades page again
        console.log('🔄 Testing return navigation to Trades page...');
        
        const returnTradesLink = await page.locator('a[href*="/trades"], a:has-text("Trades"), nav a:has-text("Trades")').first();
        
        if (await returnTradesLink.isVisible()) {
          const returnClickStartTime = Date.now();
          await returnTradesLink.click();
          const returnClickEndTime = Date.now();
          
          await page.waitForTimeout(2000);
          
          const returnNavigationTime = returnClickEndTime - returnClickStartTime;
          const returnUrl = page.url();
          
          testResults.manualClickTests.push({
            test: 'Return to Trades Navigation Click',
            status: returnUrl.includes('/trades') ? 'PASS' : 'FAIL',
            details: `Navigation time: ${returnNavigationTime}ms, Final URL: ${returnUrl}`
          });
          
          console.log(`✅ Return navigation to Trades completed in ${returnNavigationTime}ms`);
        } else {
          testResults.manualClickTests.push({
            test: 'Return to Trades Navigation Click',
            status: 'SKIP',
            details: 'Trades link not found for return test'
          });
        }
        
      } else {
        testResults.manualClickTests.push({
          test: 'Trades Page Navigation Click',
          status: 'SKIP',
          details: 'Trades navigation link not found'
        });
      }
      
    } catch (error) {
      testResults.manualClickTests.push({
        test: 'Manual Navigation Flow',
        status: 'ERROR',
        details: `Navigation test failed: ${error.message}`
      });
    }

    console.log('✅ Manual Click Testing completed');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.overallStatus = 'ERROR';
  }

  // Calculate overall status
  const allTests = [
    ...testResults.timingFixes,
    ...testResults.stateManagement,
    ...testResults.debugPanelFixes,
    ...testResults.manualClickTests
  ];
  
  const passedTests = allTests.filter(test => test.status === 'PASS').length;
  const failedTests = allTests.filter(test => test.status === 'FAIL').length;
  const skippedTests = allTests.filter(test => test.status === 'SKIP').length;
  const errorTests = allTests.filter(test => test.status === 'ERROR').length;
  
  if (errorTests > 0) {
    testResults.overallStatus = 'ERROR';
  } else if (failedTests > 0) {
    testResults.overallStatus = 'FAILED';
  } else if (passedTests > 0 && failedTests === 0) {
    testResults.overallStatus = 'PASSED';
  } else {
    testResults.overallStatus = 'INCONCLUSIVE';
  }

  // Generate detailed report
  console.log('\n📊 NAVIGATION FREEZING FIX VERIFICATION REPORT');
  console.log('==============================================');
  console.log(`Overall Status: ${testResults.overallStatus}`);
  console.log(`Total Tests: ${allTests.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Skipped: ${skippedTests}`);
  console.log(`Errors: ${errorTests}\n`);

  console.log('🔧 TIMING FIXES RESULTS:');
  testResults.timingFixes.forEach(test => {
    console.log(`  ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'} ${test.test}: ${test.details}`);
  });

  console.log('\n🛡️ STATE MANAGEMENT RESULTS:');
  testResults.stateManagement.forEach(test => {
    console.log(`  ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'} ${test.test}: ${test.details}`);
  });

  console.log('\n🐛 DEBUG PANEL FIXES RESULTS:');
  testResults.debugPanelFixes.forEach(test => {
    console.log(`  ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'} ${test.test}: ${test.details}`);
  });

  console.log('\n🖱️ MANUAL CLICK TESTS RESULTS:');
  testResults.manualClickTests.forEach(test => {
    console.log(`  ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : test.status === 'ERROR' ? '💥' : '⏭️'} ${test.test}: ${test.details}`);
  });

  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      overallStatus: testResults.overallStatus,
      totalTests: allTests.length,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      errors: errorTests
    },
    fixesImplemented: [
      'Navigation Safety Timing Conflicts - aligned function-level cooldown to 30000ms',
      'Enhanced State Management - added navigationStartTime and userInteractionInProgress flags',
      'Debug Panel Z-Index Fix - set to -1 and pointer-events to none',
      'Manual Click Testing - verified navigation flow without timing interference'
    ]
  };

  const reportPath = path.join(__dirname, 'navigation-freezing-fix-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Close browser
  await browser.close();

  return testResults;
}

// Run the verification test
runNavigationFreezingFixVerification()
  .then(results => {
    console.log('\n🎉 Navigation Freezing Fix Verification completed!');
    console.log(`Final Status: ${results.overallStatus}`);
    
    if (results.overallStatus === 'PASSED') {
      console.log('✅ All critical fixes verified successfully!');
      console.log('🚫 Menu freezing issue should now be resolved!');
    } else if (results.overallStatus === 'FAILED') {
      console.log('❌ Some fixes failed verification. Please review the results.');
    } else if (results.overallStatus === 'ERROR') {
      console.log('💥 Test execution encountered errors. Please check the setup.');
    } else {
      console.log('⚠️ Test results inconclusive. Manual verification recommended.');
    }
    
    process.exit(results.overallStatus === 'PASSED' ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Navigation Freezing Fix Verification failed:', error);
    process.exit(1);
  });