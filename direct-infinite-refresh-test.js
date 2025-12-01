const { chromium } = require('playwright');

/**
 * Direct Infinite Refresh Test
 * 
 * This test directly navigates to a strategy performance page
 * to test the infinite refresh loop fix without requiring existing data
 */

async function directInfiniteRefreshTest() {
  console.log('🎯 === DIRECT INFINITE REFRESH TEST ===\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track all network requests
  const allRequests = [];
  page.on('request', request => {
    allRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  // Track all console logs
  const allLogs = [];
  page.on('console', msg => {
    allLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  try {
    // Navigate to a mock strategy performance page
    console.log('🎯 Navigating directly to strategy performance page with mock ID...');
    await page.goto('http://localhost:3001/strategies/performance/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to fully render
    await page.waitForTimeout(5000);
    
    // Monitor for potential infinite refresh for 20 seconds
    console.log('⏱️ Monitoring for infinite refresh patterns for 20 seconds...');
    
    const startTime = Date.now();
    const monitoringDuration = 20000; // 20 seconds
    
    // Reset tracking
    allRequests.length = 0;
    allLogs.length = 0;
    
    await page.waitForTimeout(monitoringDuration);
    
    const endTime = Date.now();
    const timeWindow = endTime - startTime;
    
    // Analyze requests during monitoring period
    const requestsInWindow = allRequests.filter(req => 
      req.timestamp >= startTime && req.timestamp <= endTime
    );
    
    const logsInWindow = allLogs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
    
    // Calculate metrics
    const avgRequestsPerSecond = requestsInWindow.length / (timeWindow / 1000);
    
    // Categorize requests
    const pageRequests = requestsInWindow.filter(req => 
      req.url.includes('/strategies/performance') || 
      req.url.includes('/strategies')
    );
    
    const apiRequests = requestsInWindow.filter(req => 
      req.url.includes('supabase') || 
      req.url.includes('/rest/v1/')
    );
    
    const assetRequests = requestsInWindow.filter(req => 
      req.url.includes('/_next/static/') ||
      req.url.includes('fonts.googleapis.com') ||
      req.url.includes('fonts.gstatic.com')
    );
    
    // Look for infinite loop indicators in console
    const loopIndicators = logsInWindow.filter(log => 
      log.text.includes('INFINITE REFRESH') ||
      log.text.includes('useEffect triggered') ||
      log.text.includes('COMPONENT FUNCTION CALLED') ||
      log.text.includes('DIAGNOSTIC') ||
      log.text.includes('🔄 [INFINITE REFRESH DEBUG]')
    );
    
    const errorLogs = logsInWindow.filter(log => log.type === 'error');
    const warningLogs = logsInWindow.filter(log => log.type === 'warning');
    
    console.log('\n📊 NETWORK ANALYSIS:');
    console.log(`   Monitoring duration: ${timeWindow / 1000} seconds`);
    console.log(`   Total requests: ${requestsInWindow.length}`);
    console.log(`   Average requests/sec: ${avgRequestsPerSecond.toFixed(2)}`);
    console.log(`   Page requests: ${pageRequests.length}`);
    console.log(`   API requests: ${apiRequests.length}`);
    console.log(`   Asset requests: ${assetRequests.length}`);
    
    console.log('\n📝 CONSOLE ANALYSIS:');
    console.log(`   Total logs: ${logsInWindow.length}`);
    console.log(`   Error logs: ${errorLogs.length}`);
    console.log(`   Warning logs: ${warningLogs.length}`);
    console.log(`   Loop indicators: ${loopIndicators.length}`);
    
    // Show recent loop indicators
    if (loopIndicators.length > 0) {
      console.log('\n🔄 RECENT LOOP INDICATORS:');
      loopIndicators.slice(-5).forEach(log => {
        console.log(`   ${log.type.toUpperCase()}: ${log.text}`);
      });
    }
    
    // Show recent errors
    if (errorLogs.length > 0) {
      console.log('\n❌ RECENT ERRORS:');
      errorLogs.slice(-3).forEach(log => {
        console.log(`   ${log.text}`);
      });
    }
    
    // Determine if infinite loop is present
    console.log('\n🎯 INFINITE LOOP DETECTION:');
    
    let hasInfiniteLoop = false;
    let reasons = [];
    
    // Check 1: High request frequency
    if (avgRequestsPerSecond > 3) {
      hasInfiniteLoop = true;
      reasons.push(`High request frequency: ${avgRequestsPerSecond.toFixed(2)} req/sec`);
    }
    
    // Check 2: Excessive page requests
    if (pageRequests.length > 15) {
      hasInfiniteLoop = true;
      reasons.push(`Excessive page requests: ${pageRequests.length} in ${timeWindow / 1000}s`);
    }
    
    // Check 3: Excessive loop indicators
    if (loopIndicators.length > 10) {
      hasInfiniteLoop = true;
      reasons.push(`Excessive loop indicators: ${loopIndicators.length}`);
    }
    
    // Check 4: Repeated rapid page requests
    const rapidRequests = pageRequests.filter((req, index) => {
      if (index === 0) return false;
      const timeDiff = req.timestamp - pageRequests[index - 1].timestamp;
      return timeDiff < 2000; // Less than 2 seconds apart
    });
    
    if (rapidRequests.length > 5) {
      hasInfiniteLoop = true;
      reasons.push(`Rapid repeated requests: ${rapidRequests.length}`);
    }
    
    if (hasInfiniteLoop) {
      console.log('   ❌ INFINITE REFRESH LOOP DETECTED!');
      reasons.forEach(reason => console.log(`   ❌ ${reason}`));
    } else {
      console.log('   ✅ NO INFINITE REFRESH LOOP DETECTED');
      console.log('   ✅ Request patterns are normal');
      console.log('   ✅ No excessive loop indicators');
      console.log('   ✅ No rapid repeated requests');
    }
    
    // Test page behavior
    console.log('\n🎯 PAGE BEHAVIOR ANALYSIS:');
    
    // Check if page shows error state
    const errorElements = await page.locator('[class*="error"], [class*="alert"]').count();
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"]').count();
    const contentElements = await page.locator('h1, h2, p, div').count();
    
    console.log(`   Error elements: ${errorElements}`);
    console.log(`   Loading elements: ${loadingElements}`);
    console.log(`   Content elements: ${contentElements}`);
    
    // Check page title
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    // Check URL
    const url = page.url();
    console.log(`   Current URL: ${url}`);
    
    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    
    if (hasInfiniteLoop) {
      console.log('   ❌ INFINITE REFRESH LOOP ISSUE CONFIRMED');
      console.log('   ❌ The fixes have NOT resolved the issue');
      console.log('   ❌ Further investigation needed');
    } else {
      console.log('   ✅ INFINITE REFRESH LOOP ISSUE RESOLVED');
      console.log('   ✅ The fixes are working correctly');
      console.log('   ✅ No abnormal request patterns detected');
      console.log('   ✅ Page behavior is stable');
    }
    
    // Test page refresh behavior
    console.log('\n🔄 Testing page refresh behavior...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const refreshRequests = allRequests.filter(req => 
      req.timestamp > endTime && req.url.includes('/strategies/performance')
    );
    
    console.log(`   Requests after refresh: ${refreshRequests.length}`);
    
    if (refreshRequests.length > 5) {
      console.log('   ⚠️ Excessive requests after page refresh');
    } else {
      console.log('   ✅ Normal behavior after page refresh');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  directInfiniteRefreshTest()
    .then(() => {
      console.log('\n🎯 Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { directInfiniteRefreshTest };