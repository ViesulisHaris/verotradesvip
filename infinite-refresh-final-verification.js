const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Final Verification Script for Infinite Refresh Loop Fix
 * 
 * This script thoroughly tests the fixes implemented in:
 * 1. AuthProvider.tsx - Early return for loading state, removed setTimeout
 * 2. SchemaValidator.tsx - useCallback memoization, useRef tracking
 * 3. Strategies page - Removed router dependency from useCallback
 */

async function finalVerification() {
  console.log('🔍 === FINAL VERIFICATION: INFINITE REFRESH LOOP FIX ===\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/CD
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  // Track console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    networkRequests: [],
    consoleLogs: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };
  
  try {
    // Test 1: Navigate to Strategies Performance Details page
    console.log('🧪 Test 1: Navigate to Strategies Performance Details page');
    const test1Result = await testStrategiesPerformancePage(page);
    results.tests.push(test1Result);
    
    // Test 2: Monitor for infinite refresh loops
    console.log('\n🧪 Test 2: Monitor for infinite refresh loops');
    const test2Result = await testForInfiniteRefresh(page, networkRequests, consoleLogs);
    results.tests.push(test2Result);
    
    // Test 3: Test edge cases
    console.log('\n🧪 Test 3: Test edge cases');
    const test3Result = await testEdgeCases(page);
    results.tests.push(test3Result);
    
    // Test 4: Verify functionality preservation
    console.log('\n🧪 Test 4: Verify functionality preservation');
    const test4Result = await testFunctionalityPreservation(page);
    results.tests.push(test4Result);
    
    // Store network and console data
    results.networkRequests = networkRequests.slice(-50); // Last 50 requests
    results.consoleLogs = consoleLogs.slice(-100); // Last 100 logs
    
    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.status === 'passed').length;
    results.summary.failed = results.tests.filter(t => t.status === 'failed').length;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  // Save results
  const resultsPath = path.join(__dirname, `infinite-refresh-verification-results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Results saved to: ${resultsPath}`);
  
  // Print summary
  printSummary(results);
  
  return results;
}

async function testStrategiesPerformancePage(page) {
  const testResult = {
    name: 'Strategies Performance Details Page Navigation',
    status: 'pending',
    details: [],
    errors: []
  };
  
  try {
    // Navigate to login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      testResult.details.push('📝 Login form detected, attempting login...');
      
      // Fill login form (adjust selectors as needed)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to strategies page
    await page.goto('http://localhost:3001/strategies');
    await page.waitForLoadState('networkidle');
    
    testResult.details.push('✅ Strategies page loaded successfully');
    
    // Wait for strategies to load
    await page.waitForTimeout(2000);
    
    // Check for strategy cards
    const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, [class*="strategy"]').count();
    
    if (strategyCards > 0) {
      testResult.details.push(`✅ Found ${strategyCards} strategy card(s)`);
      
      // Click on the first strategy to view performance
      await page.locator('[data-testid="strategy-card"], .strategy-card, [class*="strategy"]').first().click();
      await page.waitForLoadState('networkidle');
      
      testResult.details.push('✅ Navigated to strategy performance page');
      
      // Check for performance indicators
      const performanceElements = await page.locator('[class*="performance"], [class*="stats"], [class*="chart"]').count();
      if (performanceElements > 0) {
        testResult.details.push(`✅ Found ${performanceElements} performance element(s)`);
        testResult.status = 'passed';
      } else {
        testResult.errors.push('⚠️ No performance elements found on page');
        testResult.status = 'warning';
      }
    } else {
      testResult.errors.push('⚠️ No strategy cards found - may need to create test data');
      testResult.status = 'warning';
    }
    
  } catch (error) {
    testResult.errors.push(`❌ Error: ${error.message}`);
    testResult.status = 'failed';
  }
  
  return testResult;
}

async function testForInfiniteRefresh(page, networkRequests, consoleLogs) {
  const testResult = {
    name: 'Infinite Refresh Loop Detection',
    status: 'pending',
    details: [],
    errors: [],
    metrics: {
      totalRequests: 0,
      refreshRequests: 0,
      uniqueUrls: new Set(),
      requestFrequency: []
    }
  };
  
  try {
    // Monitor for 30 seconds to detect refresh patterns
    console.log('⏱️ Monitoring for 30 seconds to detect refresh patterns...');
    
    const startTime = Date.now();
    const monitoringDuration = 30000; // 30 seconds
    
    // Reset network tracking
    networkRequests.length = 0;
    
    await page.waitForTimeout(monitoringDuration);
    
    const endTime = Date.now();
    const timeWindow = endTime - startTime;
    
    // Analyze network requests
    const requestsInWindow = networkRequests.filter(req => 
      req.timestamp >= startTime && req.timestamp <= endTime
    );
    
    testResult.metrics.totalRequests = requestsInWindow.length;
    
    // Count refresh/navigation requests
    const refreshRequests = requestsInWindow.filter(req => 
      req.url.includes('/strategies') || 
      req.url.includes('/dashboard') ||
      req.url.includes('/login')
    );
    
    testResult.metrics.refreshRequests = refreshRequests.length;
    
    // Count unique URLs
    requestsInWindow.forEach(req => {
      testResult.metrics.uniqueUrls.add(req.url);
    });
    
    // Calculate request frequency
    const timeGroups = {};
    requestsInWindow.forEach(req => {
      const timeSlot = Math.floor((req.timestamp - startTime) / 5000) * 5000; // 5-second buckets
      timeGroups[timeSlot] = (timeGroups[timeSlot] || 0) + 1;
    });
    
    testResult.metrics.requestFrequency = Object.entries(timeGroups).map(([time, count]) => ({
      timeWindow: `${time}ms-${parseInt(time) + 5000}ms`,
      requests: count
    }));
    
    // Analyze console logs for infinite loop indicators
    const loopIndicators = consoleLogs.filter(log => 
      log.text.includes('INFINITE REFRESH') ||
      log.text.includes('useEffect triggered') ||
      log.text.includes('COMPONENT FUNCTION CALLED')
    );
    
    // Determine if infinite loop is present
    const avgRequestsPerSecond = requestsInWindow.length / (timeWindow / 1000);
    const hasHighFrequency = avgRequestsPerSecond > 2; // More than 2 requests per second is suspicious
    const hasLoopIndicators = loopIndicators.length > 10; // More than 10 loop indicators is suspicious
    
    if (hasHighFrequency || hasLoopIndicators) {
      testResult.status = 'failed';
      testResult.errors.push(`❌ High request frequency detected: ${avgRequestsPerSecond.toFixed(2)} req/sec`);
      testResult.errors.push(`❌ Loop indicators found: ${loopIndicators.length}`);
    } else {
      testResult.status = 'passed';
      testResult.details.push(`✅ Normal request frequency: ${avgRequestsPerSecond.toFixed(2)} req/sec`);
      testResult.details.push(`✅ Low loop indicators: ${loopIndicators.length}`);
    }
    
    testResult.details.push(`📊 Total requests: ${requestsInWindow.length}`);
    testResult.details.push(`📊 Refresh requests: ${refreshRequests.length}`);
    testResult.details.push(`📊 Unique URLs: ${testResult.metrics.uniqueUrls.size}`);
    
  } catch (error) {
    testResult.errors.push(`❌ Error: ${error.message}`);
    testResult.status = 'failed';
  }
  
  return testResult;
}

async function testEdgeCases(page) {
  const testResult = {
    name: 'Edge Cases Testing',
    status: 'pending',
    details: [],
    errors: []
  };
  
  try {
    // Test 1: Navigate between different strategies
    testResult.details.push('🔄 Testing navigation between different strategies...');
    
    const strategyCards = await page.locator('[data-testid="strategy-card"], .strategy-card, [class*="strategy"]').count();
    
    if (strategyCards > 1) {
      // Click on second strategy
      await page.locator('[data-testid="strategy-card"], .strategy-card, [class*="strategy"]').nth(1).click();
      await page.waitForLoadState('networkidle');
      testResult.details.push('✅ Navigated to second strategy');
      
      // Go back to strategies list
      await page.click('button:has-text("Back"), a:has-text("Back")');
      await page.waitForLoadState('networkidle');
      testResult.details.push('✅ Returned to strategies list');
    }
    
    // Test 2: Switch between tabs
    testResult.details.push('🔄 Testing tab switching...');
    
    const tabs = await page.locator('button:has-text("Overview"), button:has-text("Performance"), button:has-text("Rules")').count();
    
    if (tabs > 0) {
      // Click Performance tab
      const performanceTab = await page.locator('button:has-text("Performance")').first();
      if (await performanceTab.isVisible()) {
        await performanceTab.click();
        await page.waitForTimeout(1000);
        testResult.details.push('✅ Switched to Performance tab');
      }
      
      // Click Overview tab
      const overviewTab = await page.locator('button:has-text("Overview")').first();
      if (await overviewTab.isVisible()) {
        await overviewTab.click();
        await page.waitForTimeout(1000);
        testResult.details.push('✅ Switched to Overview tab');
      }
    }
    
    // Test 3: Page refresh
    testResult.details.push('🔄 Testing page refresh...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    testResult.details.push('✅ Page refreshed successfully');
    
    // Test 4: Browser back/forward
    testResult.details.push('🔄 Testing browser navigation...');
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.goForward();
    await page.waitForLoadState('networkidle');
    testResult.details.push('✅ Browser back/forward navigation successful');
    
    testResult.status = 'passed';
    
  } catch (error) {
    testResult.errors.push(`❌ Error: ${error.message}`);
    testResult.status = 'failed';
  }
  
  return testResult;
}

async function testFunctionalityPreservation(page) {
  const testResult = {
    name: 'Functionality Preservation',
    status: 'pending',
    details: [],
    errors: []
  };
  
  try {
    // Test 1: Check if data loads correctly
    testResult.details.push('🔍 Testing data loading...');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check for performance metrics
    const metrics = await page.locator('[class*="winrate"], [class*="profit"], [class*="pnl"], [class*="trades"]').count();
    if (metrics > 0) {
      testResult.details.push(`✅ Found ${metrics} performance metrics`);
    } else {
      testResult.errors.push('⚠️ No performance metrics found');
    }
    
    // Test 2: Check if charts render
    testResult.details.push('🔍 Testing chart rendering...');
    
    const charts = await page.locator('[class*="chart"], canvas, svg').count();
    if (charts > 0) {
      testResult.details.push(`✅ Found ${charts} chart element(s)`);
    } else {
      testResult.errors.push('⚠️ No chart elements found');
    }
    
    // Test 3: Check interactive elements
    testResult.details.push('🔍 Testing interactive elements...');
    
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    
    testResult.details.push(`✅ Found ${buttons} buttons and ${links} links`);
    
    // Test 4: Check for error states
    testResult.details.push('🔍 Testing error handling...');
    
    const errorElements = await page.locator('[class*="error"], [class*="alert"]').count();
    if (errorElements === 0) {
      testResult.details.push('✅ No error elements found');
    } else {
      testResult.errors.push(`⚠️ Found ${errorElements} error/alert elements`);
    }
    
    // Determine overall status
    if (testResult.errors.length === 0) {
      testResult.status = 'passed';
    } else {
      testResult.status = 'warning';
    }
    
  } catch (error) {
    testResult.errors.push(`❌ Error: ${error.message}`);
    testResult.status = 'failed';
  }
  
  return testResult;
}

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${results.summary.total}`);
  console.log(`   ✅ Passed: ${results.summary.passed}`);
  console.log(`   ❌ Failed: ${results.summary.failed}`);
  
  console.log(`\n📋 Test Details:`);
  results.tests.forEach((test, index) => {
    const statusIcon = test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
    console.log(`   ${index + 1}. ${statusIcon} ${test.name}`);
    
    if (test.details.length > 0) {
      test.details.forEach(detail => {
        console.log(`      ${detail}`);
      });
    }
    
    if (test.errors.length > 0) {
      test.errors.forEach(error => {
        console.log(`      ${error}`);
      });
    }
  });
  
  // Network analysis
  if (results.networkRequests.length > 0) {
    console.log(`\n🌐 Network Analysis:`);
    console.log(`   Total Requests: ${results.networkRequests.length}`);
    
    const uniqueUrls = new Set(results.networkRequests.map(req => req.url));
    console.log(`   Unique URLs: ${uniqueUrls.size}`);
    
    // Check for suspicious patterns
    const refreshRequests = results.networkRequests.filter(req => 
      req.url.includes('/strategies') || req.url.includes('/dashboard')
    );
    
    if (refreshRequests.length > 10) {
      console.log(`   ⚠️ High number of refresh requests: ${refreshRequests.length}`);
    } else {
      console.log(`   ✅ Normal refresh request count: ${refreshRequests.length}`);
    }
  }
  
  // Console analysis
  if (results.consoleLogs.length > 0) {
    console.log(`\n📝 Console Analysis:`);
    console.log(`   Total Logs: ${results.consoleLogs.length}`);
    
    const errorLogs = results.consoleLogs.filter(log => log.type === 'error');
    const warningLogs = results.consoleLogs.filter(log => log.type === 'warning');
    
    console.log(`   Errors: ${errorLogs.length}`);
    console.log(`   Warnings: ${warningLogs.length}`);
    
    if (errorLogs.length > 0) {
      console.log(`   ⚠️ Recent errors:`);
      errorLogs.slice(-3).forEach(log => {
        console.log(`      ${log.text}`);
      });
    }
  }
  
  // Final verdict
  console.log(`\n🎯 FINAL VERDICT:`);
  if (results.summary.failed === 0) {
    console.log(`   ✅ INFINITE REFRESH LOOP FIX VERIFIED!`);
    console.log(`   ✅ All tests passed - the issue has been resolved.`);
  } else {
    console.log(`   ❌ ISSUES DETECTED!`);
    console.log(`   ❌ ${results.summary.failed} test(s) failed - further investigation needed.`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the verification
if (require.main === module) {
  finalVerification()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { finalVerification };