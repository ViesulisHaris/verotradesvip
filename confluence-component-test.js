const puppeteer = require('puppeteer');

/**
 * Simplified Confluence Component Test
 * Tests confluence page components without authentication by using mock data
 * Focuses on component rendering, functionality, and responsive design
 */

async function testConfluenceComponents() {
  console.log('🚀 Starting Confluence Component Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CONFLUENCE') || text.includes('Error') || text.includes('Warning')) {
      console.log('📄 Browser Console:', text);
    }
  });
  
  // Enable request monitoring
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('🌐 API Request:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('📡 API Response:', response.status(), response.url());
    }
  });
  
  const testResults = {
    pageLoad: { success: false, error: null, loadTime: 0 },
    components: {
      confluenceContainer: { rendered: false, error: null },
      statsCards: { rendered: false, count: 0, error: null },
      emotionRadar: { rendered: false, hasData: false, error: null },
      filters: { rendered: false, interactive: false, error: null },
      tradesTable: { rendered: false, hasData: false, error: null }
    },
    functionality: {
      refreshButton: { works: false, error: null },
      symbolSearch: { works: false, error: null },
      emotionFilters: { works: false, error: null },
      dateFilters: { works: false, error: null }
    },
    responsive: { mobile: false, tablet: false, desktop: false },
    performance: { loadTime: 0, renderTime: 0 },
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
    
    // Wait a bit for any redirects
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    // Check if we're on confluence page or redirected to login
    if (currentUrl.includes('/confluence')) {
      testResults.pageLoad.success = true;
      console.log(`✅ Confluence page loaded successfully in ${loadTime}ms`);
    } else if (currentUrl.includes('/login')) {
      console.log('🔄 Redirected to login - testing component structure on login page first...');
      // We'll test the confluence components by examining the page structure
      // and then try to access confluence directly with mock auth
    } else {
      throw new Error(`Unexpected navigation. Current URL: ${currentUrl}`);
    }
    
    // Step 2: Test API endpoints directly to ensure they work
    console.log('\n🔌 Step 2: Testing API endpoints...');
    
    try {
      // Test confluence-stats API
      const statsResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/confluence-stats', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          return {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.json() : null
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log('📊 Confluence Stats API:', statsResponse.status, statsResponse.ok ? '✅' : '❌');
      
      // Test confluence-trades API
      const tradesResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/confluence-trades?page=1&limit=10', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          return {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.json() : null
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log('📋 Confluence Trades API:', tradesResponse.status, tradesResponse.ok ? '✅' : '❌');
      
    } catch (error) {
      console.log('❌ API testing failed:', error.message);
      testResults.errors.push(`API testing failed: ${error.message}`);
    }
    
    // Step 3: Check component rendering (whether on confluence or login page)
    console.log('\n🧩 Step 3: Checking component rendering...');
    const renderStartTime = Date.now();
    
    // Check if we can find confluence-specific elements
    const confluenceElements = await page.evaluate(() => {
      const results = {
        hasConfluenceContainer: !!document.querySelector('[data-testid="confluence-container"]'),
        hasStatsCards: !!document.querySelector('[data-testid="confluence-card"]'),
        hasEmotionRadar: !!document.querySelector('.chart-container-enhanced'),
        hasFilters: !!document.querySelector('input[placeholder*="Search symbols"]'),
        hasTradesTable: !!document.querySelector('table'),
        hasRefreshButton: !!document.querySelector('button:has(.RefreshCw)'),
        pageTitle: document.title,
        bodyClasses: document.body.className
      };
      return results;
    });
    
    console.log('Component detection results:', confluenceElements);
    
    // If we're on the login page, let's try to create a test user session
    if (currentUrl.includes('/login')) {
      console.log('🔄 On login page - attempting to create test session...');
      
      // Try to set a mock session directly
      await page.evaluate(() => {
        // Create mock user data in localStorage
        localStorage.setItem('supabase.auth.token', 'mock-token-for-testing');
        localStorage.setItem('supabase.auth.user', JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          aud: 'authenticated'
        }));
      });
      
      // Try navigating to confluence again
      await page.goto('http://localhost:3000/confluence', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      await page.waitForTimeout(2000);
      
      // Check again for confluence elements
      const confluenceAfterAuth = await page.evaluate(() => {
        const results = {
          hasConfluenceContainer: !!document.querySelector('[data-testid="confluence-container"]'),
          hasStatsCards: !!document.querySelector('[data-testid="confluence-card"]'),
          hasEmotionRadar: !!document.querySelector('.chart-container-enhanced'),
          hasFilters: !!document.querySelector('input[placeholder*="Search symbols"]'),
          hasTradesTable: !!document.querySelector('table'),
          hasRefreshButton: !!document.querySelector('button:has(.RefreshCw)'),
          pageTitle: document.title
        };
        return results;
      });
      
      console.log('Component detection after auth attempt:', confluenceAfterAuth);
      
      // Update test results with auth attempt results
      testResults.components.confluenceContainer.rendered = confluenceAfterAuth.hasConfluenceContainer;
      testResults.components.statsCards.rendered = confluenceAfterAuth.hasStatsCards;
      testResults.components.emotionRadar.rendered = confluenceAfterAuth.hasEmotionRadar;
      testResults.components.filters.rendered = confluenceAfterAuth.hasFilters;
      testResults.components.tradesTable.rendered = confluenceAfterAuth.hasTradesTable;
      
      if (confluenceAfterAuth.hasConfluenceContainer) {
        console.log('✅ Successfully accessed confluence page components');
      } else {
        console.log('⚠️ Still unable to access confluence components - testing page structure instead');
      }
    } else {
      // We're on confluence page, test components directly
      testResults.components.confluenceContainer.rendered = confluenceElements.hasConfluenceContainer;
      testResults.components.statsCards.rendered = confluenceElements.hasStatsCards;
      testResults.components.emotionRadar.rendered = confluenceElements.hasEmotionRadar;
      testResults.components.filters.rendered = confluenceElements.hasFilters;
      testResults.components.tradesTable.rendered = confluenceElements.hasTradesTable;
    }
    
    // Count stats cards if present
    if (testResults.components.statsCards.rendered) {
      const statsCardCount = await page.$$('[data-testid="confluence-card"]');
      testResults.components.statsCards.count = statsCardCount.length;
      console.log(`📊 Found ${statsCardCount.length} statistics cards`);
    }
    
    // Test emotion radar data
    if (testResults.components.emotionRadar.rendered) {
      const radarData = await page.evaluate(() => {
        const radarElement = document.querySelector('.chart-container-enhanced');
        if (!radarElement) return null;
        
        // Check if radar has data (not empty state)
        const hasEmptyState = radarElement.querySelector('.text-center:has(.Brain)');
        const hasChart = radarElement.querySelector('svg');
        
        return {
          hasEmptyState: !!hasEmptyState,
          hasChart: !!hasChart,
          innerHTML: radarElement.innerHTML.substring(0, 200) + '...'
        };
      });
      
      testResults.components.emotionRadar.hasData = radarData && radarData.hasChart && !radarData.hasEmptyState;
      console.log('🎯 Emotion radar data status:', testResults.components.emotionRadar.hasData ? 'Has data' : 'Empty/Loading');
    }
    
    // Test trades table data
    if (testResults.components.tradesTable.rendered) {
      const tableData = await page.evaluate(() => {
        const table = document.querySelector('table');
        if (!table) return null;
        
        const rows = table.querySelectorAll('tbody tr');
        const headers = table.querySelectorAll('thead th');
        
        return {
          rowCount: rows.length,
          headerCount: headers.length,
          hasData: rows.length > 0,
          firstRowText: rows.length > 0 ? rows[0].textContent.substring(0, 100) : null
        };
      });
      
      testResults.components.tradesTable.hasData = tableData && tableData.hasData;
      console.log(`📋 Trades table: ${tableData.rowCount} rows, ${tableData.headerCount} headers`);
    }
    
    const renderTime = Date.now() - renderStartTime;
    testResults.performance.renderTime = renderTime;
    console.log(`⏱️ Component rendering analysis completed in ${renderTime}ms`);
    
    // Step 4: Test interactive functionality
    console.log('\n⚡ Step 4: Testing interactive functionality...');
    
    // Test refresh button
    try {
      const refreshButton = await page.$('button:has(.RefreshCw)');
      if (refreshButton) {
        await refreshButton.click();
        await page.waitForTimeout(1000);
        testResults.functionality.refreshButton.works = true;
        console.log('✅ Refresh button clickable');
      }
    } catch (error) {
      testResults.functionality.refreshButton.error = error.message;
      console.log('❌ Refresh button test failed:', error.message);
    }
    
    // Test symbol search
    try {
      const searchInput = await page.$('input[placeholder*="Search symbols"]');
      if (searchInput) {
        await searchInput.type('AAPL', { delay: 100 });
        await page.waitForTimeout(500);
        
        const searchValue = await page.evaluate(el => el.value, searchInput);
        if (searchValue.includes('AAPL')) {
          testResults.functionality.symbolSearch.works = true;
          console.log('✅ Symbol search input works');
        }
        
        // Clear search
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
      }
    } catch (error) {
      testResults.functionality.symbolSearch.error = error.message;
      console.log('❌ Symbol search test failed:', error.message);
    }
    
    // Test emotion filters
    try {
      const emotionButton = await page.$('button:has-text("FOMO")');
      if (emotionButton) {
        await emotionButton.click();
        await page.waitForTimeout(500);
        
        const isActive = await page.evaluate(el => {
          return el.classList.contains('bg-verotrade-gold-primary') ||
                 el.classList.contains('bg-verotrade-gold-primary/20');
        }, emotionButton);
        
        if (isActive) {
          testResults.functionality.emotionFilters.works = true;
          console.log('✅ Emotion filters work');
        }
      }
    } catch (error) {
      testResults.functionality.emotionFilters.error = error.message;
      console.log('❌ Emotion filter test failed:', error.message);
    }
    
    // Test date filters
    try {
      const dateInput = await page.$('input[type="date"]');
      if (dateInput) {
        await dateInput.type('2024-01-01', { delay: 100 });
        await page.waitForTimeout(500);
        
        const dateValue = await page.evaluate(el => el.value, dateInput);
        if (dateValue.includes('2024')) {
          testResults.functionality.dateFilters.works = true;
          console.log('✅ Date filters work');
        }
      }
    } catch (error) {
      testResults.functionality.dateFilters.error = error.message;
      console.log('❌ Date filter test failed:', error.message);
    }
    
    // Step 5: Test responsive design
    console.log('\n📱 Step 5: Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="confluence-container"]');
      if (!container) return false;
      
      const grid = container.querySelector('.grid');
      const hasMobileGrid = grid && grid.classList.contains('grid-cols-1');
      return hasMobileGrid;
    });
    
    testResults.responsive.mobile = mobileLayout;
    console.log(mobileLayout ? '✅ Mobile responsive design works' : '⚠️ Mobile layout issues detected');
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="confluence-container"]');
      if (!container) return false;
      
      const grid = container.querySelector('.grid');
      const hasTabletGrid = grid && grid.classList.contains('sm:grid-cols-1');
      return hasTabletGrid;
    });
    
    testResults.responsive.tablet = tabletLayout;
    console.log(tabletLayout ? '✅ Tablet responsive design works' : '⚠️ Tablet layout issues detected');
    
    // Test desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="confluence-container"]');
      if (!container) return false;
      
      const grid = container.querySelector('.grid');
      const hasDesktopGrid = grid && grid.classList.contains('lg:grid-cols-2');
      return hasDesktopGrid;
    });
    
    testResults.responsive.desktop = desktopLayout;
    console.log(desktopLayout ? '✅ Desktop responsive design works' : '⚠️ Desktop layout issues detected');
    
    // Step 6: Check for errors
    console.log('\n🔍 Step 6: Checking for errors...');
    
    // Check for error messages
    const errorElements = await page.$$('.text-verotrade-error, .text-red-500, .error');
    if (errorElements.length > 0) {
      const errorTexts = await Promise.all(
        errorElements.map(el => page.evaluate(el => el.textContent, el))
      );
      testResults.errors.push(...errorTexts.filter(Boolean));
      console.log('⚠️ Found error elements:', errorTexts.filter(Boolean));
    }
    
    // Check console errors
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalLog = console.error;
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalLog.apply(console, args);
      };
      return errors;
    });
    
    if (consoleErrors.length > 0) {
      testResults.errors.push(...consoleErrors);
      console.log('⚠️ Console errors found:', consoleErrors);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'confluence-component-test-final.png',
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved as confluence-component-test-final.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.pageLoad.error = error.message;
    testResults.errors.push(error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'confluence-component-test-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved as confluence-component-test-error.png');
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run test
if (require.main === module) {
  testConfluenceComponents()
    .then(results => {
      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      
      // Calculate success rates
      const componentTests = Object.values(results.components).filter(c => c.rendered).length;
      const totalComponentTests = Object.keys(results.components).length;
      const functionalityTests = Object.values(results.functionality).filter(f => f.works).length;
      const totalFunctionalityTests = Object.keys(results.functionality).length;
      const responsiveTests = Object.values(results.responsive).filter(r => r).length;
      const totalResponsiveTests = Object.keys(results.responsive).length;
      
      console.log(`🧩 Components: ${componentTests}/${totalComponentTests} rendered`);
      console.log(`⚡ Functionality: ${functionalityTests}/${totalFunctionalityTests} working`);
      console.log(`📱 Responsive: ${responsiveTests}/${totalResponsiveTests} working`);
      console.log(`⏱️ Performance: Load ${results.performance.loadTime}ms, Render ${results.performance.renderTime}ms`);
      
      if (results.errors.length > 0) {
        console.log(`\n❌ Errors Found:`);
        results.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      // Save results
      const fs = require('fs');
      fs.writeFileSync(
        'confluence-component-test-results.json',
        JSON.stringify(results, null, 2)
      );
      console.log('\n📄 Results saved to confluence-component-test-results.json');
      
      // Determine overall success
      const overallSuccess = results.pageLoad.success && 
                           componentTests >= totalComponentTests * 0.5 && // At least 50% of components
                           functionalityTests >= totalFunctionalityTests * 0.5; // At least 50% of functionality
      
      console.log(`\n🏁 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}`);
      
      process.exit(overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testConfluenceComponents;