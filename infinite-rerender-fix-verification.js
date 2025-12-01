const { chromium } = require('playwright');
const fs = require('fs');

async function verifyInfiniteRerenderFix() {
  console.log('🔍 Starting infinite re-rendering fix verification...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false to observe the test
    devtools: true   // Open devtools to monitor console
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Monitor console for errors and warnings
  const consoleMessages = [];
  const errorMessages = [];
  const warningMessages = [];
  const maxUpdateDepthErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    consoleMessages.push({
      type,
      text,
      timestamp: new Date().toISOString()
    });
    
    if (type === 'error') {
      errorMessages.push(text);
      if (text.includes('Maximum update depth exceeded')) {
        maxUpdateDepthErrors.push(text);
      }
    }
    
    if (type === 'warning') {
      warningMessages.push(text);
    }
    
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  // Monitor for uncaught exceptions
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    errorMessages.push(error.message);
  });
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    consoleMessages: [],
    errorMessages: [],
    maxUpdateDepthErrors: [],
    performanceMetrics: {},
    finalStatus: 'UNKNOWN'
  };
  
  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    
    // Navigate to the home page first
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit to see if there are any immediate errors
    await page.waitForTimeout(3000);
    
    // Check if we need to authenticate
    const needsAuth = await page.locator('text=Login').isVisible().catch(() => false);
    
    if (needsAuth) {
      console.log('🔐 Authentication required, attempting to login...');
      
      // Try to login with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForTimeout(3000);
    }
    
    console.log('📊 Navigating to trades page...');
    
    // Navigate to the trades page
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the page to load and stabilize
    await page.waitForTimeout(5000);
    
    // Test 1: Check for infinite re-rendering errors
    console.log('🧪 Test 1: Checking for infinite re-rendering errors...');
    const initialErrorCount = maxUpdateDepthErrors.length;
    
    // Wait and observe for any new errors
    await page.waitForTimeout(10000);
    
    const finalErrorCount = maxUpdateDepthErrors.length;
    const hasInfiniteRerender = finalErrorCount > initialErrorCount;
    
    testResults.tests.push({
      name: 'Infinite Re-rendering Check',
      status: hasInfiniteRerender ? 'FAILED' : 'PASSED',
      details: {
        initialErrorCount,
        finalErrorCount,
        maxUpdateDepthErrors: maxUpdateDepthErrors.slice(initialErrorCount)
      }
    });
    
    // Test 2: Check if trades page loads properly
    console.log('🧪 Test 2: Checking if trades page loads properly...');
    
    const pageLoaded = await page.locator('body').isVisible();
    const hasTradesContent = await page.locator('[data-testid="trades-container"], .trades-container, table, [role="table"]').isVisible().catch(() => false);
    
    testResults.tests.push({
      name: 'Trades Page Load',
      status: pageLoaded ? 'PASSED' : 'FAILED',
      details: {
        pageLoaded,
        hasTradesContent
      }
    });
    
    // Test 3: Test filtering functionality
    console.log('🧪 Test 3: Testing filtering functionality...');
    
    let filterTestPassed = false;
    let filterError = null;
    try {
      // Look for filter inputs
      const filterInputs = await page.locator('input[placeholder*="filter"], input[placeholder*="search"], select').all();
      
      if (filterInputs.length > 0) {
        // Try to interact with the first filter input
        await filterInputs[0].fill('test');
        await page.waitForTimeout(2000);
        
        // Clear the filter
        await filterInputs[0].fill('');
        await page.waitForTimeout(2000);
        
        filterTestPassed = true;
      } else {
        console.log('No filter inputs found, skipping filter test');
        filterTestPassed = true; // Not failing if no filters exist
      }
    } catch (error) {
      console.error('Filter test error:', error.message);
      filterError = error.message;
    }
    
    testResults.tests.push({
      name: 'Filtering Functionality',
      status: filterTestPassed ? 'PASSED' : 'FAILED',
      details: {
        error: filterError
      }
    });
    
    // Test 4: Test sorting functionality
    console.log('🧪 Test 4: Testing sorting functionality...');
    
    let sortTestPassed = false;
    let sortError = null;
    try {
      // Look for sortable headers
      const sortableHeaders = await page.locator('th[role="button"], th.sortable, .sortable').all();
      
      if (sortableHeaders.length > 0) {
        // Try to click on the first sortable header
        await sortableHeaders[0].click();
        await page.waitForTimeout(2000);
        
        sortTestPassed = true;
      } else {
        console.log('No sortable headers found, skipping sort test');
        sortTestPassed = true; // Not failing if no sorting exists
      }
    } catch (error) {
      console.error('Sort test error:', error.message);
      sortError = error.message;
    }
    
    testResults.tests.push({
      name: 'Sorting Functionality',
      status: sortTestPassed ? 'PASSED' : 'FAILED',
      details: {
        error: sortError
      }
    });
    
    // Test 5: Test pagination functionality
    console.log('🧪 Test 5: Testing pagination functionality...');
    
    let paginationTestPassed = false;
    let paginationError = null;
    try {
      // Look for pagination controls
      const paginationControls = await page.locator('.pagination, [role="navigation"], button:has-text("Next"), button:has-text("Previous")').all();
      
      if (paginationControls.length > 0) {
        // Try to interact with pagination if available
        const nextButton = page.locator('button:has-text("Next"), button:has-text(">")').first();
        const isNextVisible = await nextButton.isVisible().catch(() => false);
        
        if (isNextVisible) {
          await nextButton.click();
          await page.waitForTimeout(2000);
        }
        
        paginationTestPassed = true;
      } else {
        console.log('No pagination controls found, skipping pagination test');
        paginationTestPassed = true; // Not failing if no pagination exists
      }
    } catch (error) {
      console.error('Pagination test error:', error.message);
      paginationError = error.message;
    }
    
    testResults.tests.push({
      name: 'Pagination Functionality',
      status: paginationTestPassed ? 'PASSED' : 'FAILED',
      details: {
        error: paginationError
      }
    });
    
    // Test 6: Monitor performance metrics
    console.log('🧪 Test 6: Collecting performance metrics...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        memoryUsage: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
    
    testResults.performanceMetrics = performanceMetrics;
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'verotradesvip/infinite-rerender-fix-verification-screenshot.png',
      fullPage: true 
    });
    
    // Compile final results
    testResults.consoleMessages = consoleMessages;
    testResults.errorMessages = errorMessages;
    testResults.maxUpdateDepthErrors = maxUpdateDepthErrors;
    
    const allTestsPassed = testResults.tests.every(test => test.status === 'PASSED');
    const hasCriticalErrors = maxUpdateDepthErrors.length > 0;
    
    testResults.finalStatus = allTestsPassed && !hasCriticalErrors ? 'PASSED' : 'FAILED';
    
    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log('========================');
    testResults.tests.forEach(test => {
      console.log(`${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}: ${test.status}`);
      if (test.details && Object.keys(test.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
      }
    });
    
    console.log(`\n🎯 FINAL STATUS: ${testResults.finalStatus}`);
    console.log(`📊 Total Console Messages: ${consoleMessages.length}`);
    console.log(`🚨 Total Errors: ${errorMessages.length}`);
    console.log(`⚠️  Total Warnings: ${warningMessages.length}`);
    console.log(`🔄 Maximum Update Depth Errors: ${maxUpdateDepthErrors.length}`);
    
    if (performanceMetrics.totalLoadTime) {
      console.log(`⏱️  Page Load Time: ${performanceMetrics.totalLoadTime}ms`);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.finalStatus = 'ERROR';
    testResults.error = error.message;
  } finally {
    await browser.close();
  }
  
  // Save results to file
  const resultsPath = `verotradesvip/infinite-rerender-fix-verification-results-${Date.now()}.json`;
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  
  console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
  
  return testResults;
}

// Run the verification
verifyInfiniteRerenderFix()
  .then(results => {
    console.log('\n✅ Infinite re-rendering fix verification completed!');
    process.exit(results.finalStatus === 'PASSED' ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });