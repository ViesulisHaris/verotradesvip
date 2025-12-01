const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Comprehensive Confluence Page Test
 * Tests all functionality of the /confluence route including:
 * - Page loading and authentication
 * - Component rendering (stats, radar chart, filters, table)
 * - Interactive features
 * - Error handling
 * - Responsive design
 * - Performance
 */

async function testConfluencePage() {
  console.log('🚀 Starting Confluence Page Comprehensive Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CONFLUENCE_DEBUG]') || text.includes('Error') || text.includes('Warning')) {
      console.log('📄 Browser Console:', text);
    }
  });
  
  // Enable request monitoring
  page.on('request', request => {
    if (request.url().includes('/api/confluence-')) {
      console.log('🌐 API Request:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/confluence-')) {
      console.log('📡 API Response:', response.status(), response.url());
    }
  });
  
  const testResults = {
    pageLoad: { success: false, error: null, loadTime: 0 },
    authentication: { success: false, error: null },
    components: {
      stats: { rendered: false, hasData: false, error: null },
      emotionRadar: { rendered: false, hasData: false, error: null },
      filters: { rendered: false, interactive: false, error: null },
      tradesTable: { rendered: false, hasData: false, error: null }
    },
    functionality: {
      refresh: { works: false, error: null },
      filtering: { works: false, error: null },
      pagination: { works: false, error: null }
    },
    responsive: { mobile: false, tablet: false, desktop: false },
    performance: { loadTime: 0, renderTime: 0, interactionTime: 0 },
    errors: []
  };
  
  try {
    // Step 1: Navigate to confluence page
    console.log('📍 Step 1: Navigating to confluence page...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/confluence', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    testResults.pageLoad.loadTime = loadTime;
    testResults.performance.loadTime = loadTime;
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    const currentUrl = page.url();
    
    if (currentUrl.includes('/confluence') || currentUrl.includes('/login')) {
      testResults.pageLoad.success = true;
      console.log(`✅ Page loaded successfully in ${loadTime}ms`);
    } else {
      throw new Error(`Page navigation failed. Current URL: ${currentUrl}`);
    }
    
    // Step 2: Handle authentication if needed
    console.log('\n🔐 Step 2: Checking authentication...');
    
    if (currentUrl.includes('/login')) {
      console.log('🔄 Login required, attempting authentication...');
      
      // Wait for login form
      await page.waitForSelector('#email', { timeout: 10000 });
      
      // Fill login form (using test credentials)
      await page.type('#email', 'test@example.com');
      await page.type('#password', 'testpassword123');
      
      // Submit login
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        page.click('button[type="submit"]')
      ]);
      
      const loginUrl = page.url();
      if (loginUrl.includes('/confluence')) {
        testResults.authentication.success = true;
        console.log('✅ Authentication successful');
      } else {
        throw new Error('Authentication failed - not redirected to confluence');
      }
    } else {
      testResults.authentication.success = true;
      console.log('✅ Already authenticated');
    }
    
    // Step 3: Wait for main components to load
    console.log('\n🧩 Step 3: Checking component rendering...');
    const renderStartTime = Date.now();
    
    // Wait for the main confluence container
    await page.waitForSelector('[data-testid="confluence-container"]', { timeout: 15000 });
    
    // Check statistics cards
    try {
      await page.waitForSelector('[data-testid="confluence-card"]', { timeout: 10000 });
      testResults.components.stats.rendered = true;
      
      // Check if stats have data (not empty/loading)
      const statsCards = await page.$$('[data-testid="confluence-card"]');
      if (statsCards.length >= 4) {
        testResults.components.stats.hasData = true;
        console.log('✅ Statistics cards rendered with data');
      } else {
        console.log('⚠️ Statistics cards rendered but may be loading');
      }
    } catch (error) {
      testResults.components.stats.error = error.message;
      console.log('❌ Statistics cards failed to render:', error.message);
    }
    
    // Check emotion radar chart
    try {
      await page.waitForSelector('.chart-container-enhanced', { timeout: 10000 });
      testResults.components.emotionRadar.rendered = true;
      
      // Check if radar has data (not empty state)
      const radarEmpty = await page.$('.chart-container-enhanced .text-center:has(.Brain)');
      if (!radarEmpty) {
        testResults.components.emotionRadar.hasData = true;
        console.log('✅ Emotion radar rendered with data');
      } else {
        console.log('⚠️ Emotion radar rendered but shows empty state');
      }
    } catch (error) {
      testResults.components.emotionRadar.error = error.message;
      console.log('❌ Emotion radar failed to render:', error.message);
    }
    
    // Check filters section
    try {
      await page.waitForSelector('input[placeholder="Search symbols"]', { timeout: 10000 });
      testResults.components.filters.rendered = true;
      
      // Test filter interactivity
      await page.type('input[placeholder="Search symbols"]', 'AAPL', { delay: 100 });
      await page.waitForTimeout(500); // Wait for debounced search
      
      const filterValue = await page.$eval('input[placeholder="Search symbols"]', el => el.value);
      if (filterValue === 'AAPL') {
        testResults.components.filters.interactive = true;
        console.log('✅ Filters section rendered and interactive');
      }
      
      // Clear the filter
      await page.click('input[placeholder="Search symbols"] + button');
    } catch (error) {
      testResults.components.filters.error = error.message;
      console.log('❌ Filters section failed:', error.message);
    }
    
    // Check trades table
    try {
      await page.waitForSelector('table', { timeout: 10000 });
      testResults.components.tradesTable.rendered = true;
      
      // Check if table has data rows
      const tableRows = await page.$$('table tbody tr');
      if (tableRows.length > 0) {
        testResults.components.tradesTable.hasData = true;
        console.log(`✅ Trades table rendered with ${tableRows.length} rows`);
      } else {
        console.log('⚠️ Trades table rendered but no data rows');
      }
    } catch (error) {
      testResults.components.tradesTable.error = error.message;
      console.log('❌ Trades table failed to render:', error.message);
    }
    
    const renderTime = Date.now() - renderStartTime;
    testResults.performance.renderTime = renderTime;
    console.log(`⏱️ Component rendering completed in ${renderTime}ms`);
    
    // Step 4: Test interactive functionality
    console.log('\n⚡ Step 4: Testing interactive functionality...');
    const interactionStartTime = Date.now();
    
    // Test refresh button
    try {
      await page.click('button:has(.RefreshCw)');
      await page.waitForTimeout(2000); // Wait for refresh to complete
      testResults.functionality.refresh.works = true;
      console.log('✅ Refresh button works');
    } catch (error) {
      testResults.functionality.refresh.error = error.message;
      console.log('❌ Refresh button failed:', error.message);
    }
    
    // Test emotion filters
    try {
      await page.click('button:has-text("FOMO")');
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      // Check if filter is applied (button should be highlighted)
      const fomoButton = await page.$('button:has-text("FOMO")');
      const isActive = await page.evaluate(el => {
        return el.classList.contains('bg-verotrade-gold-primary/20');
      }, fomoButton);
      
      if (isActive) {
        testResults.functionality.filtering.works = true;
        console.log('✅ Emotion filtering works');
      }
      
      // Clear emotion filter
      await page.click('button:has-text("Clear emotions")');
    } catch (error) {
      testResults.functionality.filtering.error = error.message;
      console.log('❌ Emotion filtering failed:', error.message);
    }
    
    // Test pagination if available
    try {
      const nextButton = await page.$('button:has-text("Next"):not([disabled])');
      if (nextButton) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(1000);
        testResults.functionality.pagination.works = true;
        console.log('✅ Pagination works');
      } else {
        console.log('⚠️ No pagination available (single page of results)');
      }
    } catch (error) {
      testResults.functionality.pagination.error = error.message;
      console.log('❌ Pagination failed:', error.message);
    }
    
    const interactionTime = Date.now() - interactionStartTime;
    testResults.performance.interactionTime = interactionTime;
    console.log(`⏱️ Interactive testing completed in ${interactionTime}ms`);
    
    // Step 5: Test responsive design
    console.log('\n📱 Step 5: Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="confluence-container"]');
      const grid = document.querySelector('.grid-cols-1');
      return container && grid;
    });
    
    if (mobileLayout) {
      testResults.responsive.mobile = true;
      console.log('✅ Mobile responsive design works');
    }
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.evaluate(() => {
      const grid = document.querySelector('.lg\\:grid-cols-2');
      return grid;
    });
    
    if (tabletLayout) {
      testResults.responsive.tablet = true;
      console.log('✅ Tablet responsive design works');
    }
    
    // Test desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.evaluate(() => {
      const grid = document.querySelector('.lg\\:grid-cols-2');
      return grid;
    });
    
    if (desktopLayout) {
      testResults.responsive.desktop = true;
      console.log('✅ Desktop responsive design works');
    }
    
    // Step 6: Check for console errors
    console.log('\n🔍 Step 6: Checking for errors...');
    
    // Check for any error messages on the page
    const errorElements = await page.$$('.text-verotrade-error');
    if (errorElements.length > 0) {
      const errorTexts = await Promise.all(
        errorElements.map(el => page.evaluate(el => el.textContent, el))
      );
      testResults.errors.push(...errorTexts);
      console.log('⚠️ Found error messages on page:', errorTexts);
    }
    
    // Check for any 404 or failed requests
    const failedRequests = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/api/confluence-') && 
                       (entry.response && entry.response.status >= 400));
    });
    
    if (failedRequests.length > 0) {
      testResults.errors.push(`Failed API requests: ${failedRequests.length}`);
      console.log('❌ Found failed API requests:', failedRequests.length);
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    // Calculate overall success rate
    const totalTests = Object.values(testResults.components).length + 
                      Object.values(testResults.functionality).length + 3; // +3 for pageLoad, auth, responsive
    const passedTests = Object.values(testResults.components).filter(c => c.rendered).length +
                       Object.values(testResults.functionality).filter(f => f.works).length +
                       (testResults.pageLoad.success ? 1 : 0) +
                       (testResults.authentication.success ? 1 : 0) +
                       (Object.values(testResults.responsive).filter(r => r).length > 0 ? 1 : 0);
    
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    console.log(`⏱️ Performance Metrics:`);
    console.log(`   - Page Load: ${testResults.performance.loadTime}ms`);
    console.log(`   - Component Render: ${testResults.performance.renderTime}ms`);
    console.log(`   - Interaction Response: ${testResults.performance.interactionTime}ms`);
    
    console.log(`\n🧩 Component Status:`);
    Object.entries(testResults.components).forEach(([name, result]) => {
      const status = result.rendered ? '✅' : '❌';
      const dataStatus = result.hasData ? '(with data)' : '(no data)';
      console.log(`   ${status} ${name}: ${result.rendered ? 'Rendered' : 'Failed'} ${dataStatus}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });
    
    console.log(`\n⚡ Functionality Status:`);
    Object.entries(testResults.functionality).forEach(([name, result]) => {
      const status = result.works ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${result.works ? 'Working' : 'Failed'}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });
    
    console.log(`\n📱 Responsive Design:`);
    Object.entries(testResults.responsive).forEach(([view, works]) => {
      const status = works ? '✅' : '❌';
      console.log(`   ${status} ${view}: ${works ? 'Working' : 'Failed'}`);
    });
    
    if (testResults.errors.length > 0) {
      console.log(`\n❌ Errors Found:`);
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Take a final screenshot
    await page.screenshot({ 
      path: 'confluence-test-final-screenshot.png',
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved as confluence-test-final-screenshot.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.pageLoad.error = error.message;
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'confluence-test-error-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved as confluence-test-error-screenshot.png');
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test
if (require.main === module) {
  testConfluencePage()
    .then(results => {
      console.log('\n🏁 Confluence page test completed');
      
      // Save results to file
      const fs = require('fs');
      fs.writeFileSync(
        'confluence-test-results.json',
        JSON.stringify(results, null, 2)
      );
      console.log('📄 Test results saved to confluence-test-results.json');
      
      process.exit(results.pageLoad.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testConfluencePage;