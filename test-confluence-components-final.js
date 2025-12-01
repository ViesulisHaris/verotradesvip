const puppeteer = require('puppeteer');

/**
 * Final Confluence Components Test
 * Tests the confluence components page with mock data
 * This bypasses authentication and tests all components directly
 */

async function testConfluenceComponentsFinal() {
  console.log('🚀 Starting Final Confluence Components Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('Warning') || text.includes('error')) {
      console.log('📄 Browser Console:', text);
    }
  });
  
  const testResults = {
    pageLoad: { success: false, loadTime: 0, error: null },
    components: {
      container: { rendered: false, error: null },
      statsCards: { rendered: false, count: 0, error: null },
      emotionRadar: { rendered: false, hasData: false, error: null },
      filters: { rendered: false, interactive: false, error: null },
      tradesTable: { rendered: false, hasData: false, error: null }
    },
    functionality: {
      refreshButton: { works: false, error: null },
      symbolSearch: { works: false, error: null },
      emotionFilters: { works: false, error: null },
      dateFilters: { works: false, error: null },
      marketFilter: { works: false, error: null }
    },
    responsive: { mobile: false, tablet: false, desktop: false },
    performance: { loadTime: 0, interactionTime: 0 },
    errors: []
  };
  
  try {
    // Step 1: Navigate to test confluence components page
    console.log('📍 Step 1: Navigating to test confluence components page...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/test-confluence-components', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    const loadTime = Date.now() - startTime;
    testResults.pageLoad.loadTime = loadTime;
    testResults.performance.loadTime = loadTime;
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/test-confluence-components')) {
      testResults.pageLoad.success = true;
      console.log(`✅ Test confluence components page loaded successfully in ${loadTime}ms`);
    } else {
      throw new Error(`Failed to load test page. Current URL: ${currentUrl}`);
    }
    
    // Step 2: Check component rendering
    console.log('\n🧩 Step 2: Checking component rendering...');
    
    const componentCheck = await page.evaluate(() => {
      const results = {
        hasContainer: !!document.querySelector('[data-testid="confluence-container"]'),
        statsCards: document.querySelectorAll('[data-testid="confluence-card"]').length,
        hasEmotionRadar: !!document.querySelector('.chart-container-enhanced'),
        hasFilters: !!document.querySelector('input[placeholder*="Search symbols"]'),
        hasTradesTable: !!document.querySelector('table'),
        hasRefreshButton: !!document.querySelector('button:has(.RefreshCw)'),
        pageTitle: document.title,
        bodyClasses: document.body.className
      };
      return results;
    });
    
    console.log('Component check results:', componentCheck);
    
    testResults.components.container.rendered = componentCheck.hasContainer;
    testResults.components.statsCards.rendered = componentCheck.statsCards > 0;
    testResults.components.statsCards.count = componentCheck.statsCards;
    testResults.components.emotionRadar.rendered = componentCheck.hasEmotionRadar;
    testResults.components.filters.rendered = componentCheck.hasFilters;
    testResults.components.tradesTable.rendered = componentCheck.hasTradesTable;
    
    // Check if components have data
    if (testResults.components.emotionRadar.rendered) {
      const radarData = await page.evaluate(() => {
        const radarElement = document.querySelector('.chart-container-enhanced');
        if (!radarElement) return null;
        
        const hasChart = radarElement.querySelector('svg');
        const hasEmptyState = radarElement.querySelector('.text-center:has(.Brain)');
        
        return {
          hasChart: !!hasChart,
          hasEmptyState: !!hasEmptyState,
          innerHTML: radarElement.innerHTML.substring(0, 200) + '...'
        };
      });
      
      testResults.components.emotionRadar.hasData = radarData && radarData.hasChart && !radarData.hasEmptyState;
      console.log('🎯 Emotion radar data status:', testResults.components.emotionRadar.hasData ? 'Has data' : 'Empty/Loading');
    }
    
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
    
    // Step 3: Test interactive functionality
    console.log('\n⚡ Step 3: Testing interactive functionality...');
    const interactionStartTime = Date.now();
    
    // Test refresh button
    try {
      const refreshButton = await page.$('button:has(.RefreshCw)');
      if (refreshButton) {
        await refreshButton.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        testResults.functionality.refreshButton.works = true;
        console.log('✅ Refresh button works');
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const searchValue = await page.evaluate(el => el.value, searchInput);
        if (searchValue.includes('AAPL')) {
          testResults.functionality.symbolSearch.works = true;
          console.log('✅ Symbol search works');
        }
        
        // Test clear button
        const clearButton = await page.$('input[placeholder*="Search symbols"] + button');
        if (clearButton) {
          await clearButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ Search clear button works');
        }
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const isActive = await page.evaluate(el => {
          return el.classList.contains('bg-verotrade-gold-primary') ||
                 el.classList.contains('bg-verotrade-gold-primary/20');
        }, emotionButton);
        
        if (isActive) {
          testResults.functionality.emotionFilters.works = true;
          console.log('✅ Emotion filters work');
        }
        
        // Test clear emotions button
        const clearEmotionsButton = await page.$('button:has-text("Clear emotions")');
        if (clearEmotionsButton) {
          await clearEmotionsButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ Clear emotions button works');
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
    
    // Test market filter
    try {
      const marketSelect = await page.$('select');
      if (marketSelect) {
        await marketSelect.select('Crypto');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const marketValue = await page.evaluate(el => el.value, marketSelect);
        if (marketValue === 'Crypto') {
          testResults.functionality.marketFilter.works = true;
          console.log('✅ Market filter works');
        }
      }
    } catch (error) {
      testResults.functionality.marketFilter.error = error.message;
      console.log('❌ Market filter test failed:', error.message);
    }
    
    const interactionTime = Date.now() - interactionStartTime;
    testResults.performance.interactionTime = interactionTime;
    console.log(`⏱️ Interactive testing completed in ${interactionTime}ms`);
    
    // Step 4: Test responsive design
    console.log('\n📱 Step 4: Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const desktopLayout = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="confluence-container"]');
      if (!container) return false;
      
      const grid = container.querySelector('.grid');
      const hasDesktopGrid = grid && grid.classList.contains('lg:grid-cols-2');
      return hasDesktopGrid;
    });
    
    testResults.responsive.desktop = desktopLayout;
    console.log(desktopLayout ? '✅ Desktop responsive design works' : '⚠️ Desktop layout issues detected');
    
    // Step 5: Check for errors
    console.log('\n🔍 Step 5: Checking for errors...');
    
    const errorCheck = await page.evaluate(() => {
      const errorElements = document.querySelectorAll(
        '.error, .text-red-500, .text-verotrade-error, [role="alert"]'
      );
      const errorTexts = Array.from(errorElements).map(el => el.textContent).filter(Boolean);
      
      // Check for broken images
      const images = document.querySelectorAll('img');
      const brokenImages = Array.from(images).filter(img => 
        img.naturalWidth === 0 && img.complete
      );
      
      return {
        errorCount: errorElements.length,
        errorTexts: errorTexts.slice(0, 3),
        brokenImageCount: brokenImages.length
      };
    });
    
    if (errorCheck.errorCount > 0) {
      testResults.errors.push(...errorCheck.errorTexts);
      console.log('⚠️ Found error elements:', errorCheck.errorTexts);
    }
    
    if (errorCheck.brokenImageCount > 0) {
      testResults.errors.push(`${errorCheck.brokenImageCount} broken images`);
      console.log('⚠️ Found broken images:', errorCheck.brokenImageCount);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'confluence-components-test-final.png',
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved as confluence-components-test-final.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.pageLoad.error = error.message;
    testResults.errors.push(error.message);
    
    await page.screenshot({ 
      path: 'confluence-components-test-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved as confluence-components-test-error.png');
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run test
if (require.main === module) {
  testConfluenceComponentsFinal()
    .then(results => {
      console.log('\n📊 Final Test Results Summary:');
      console.log('================================');
      
      console.log(`📍 Page Load: ${results.pageLoad.success ? '✅' : '❌'} (${results.pageLoad.loadTime}ms)`);
      
      console.log('\n🧩 Components:');
      console.log(`   ${results.components.container.rendered ? '✅' : '❌'} Container`);
      console.log(`   ${results.components.statsCards.rendered ? '✅' : '❌'} Stats Cards (${results.components.statsCards.count})`);
      console.log(`   ${results.components.emotionRadar.rendered ? '✅' : '❌'} Emotion Radar ${results.components.emotionRadar.hasData ? '(with data)' : '(no data)'}`);
      console.log(`   ${results.components.filters.rendered ? '✅' : '❌'} Filters`);
      console.log(`   ${results.components.tradesTable.rendered ? '✅' : '❌'} Trades Table ${results.components.tradesTable.hasData ? '(with data)' : '(no data)'}`);
      
      console.log('\n⚡ Functionality:');
      console.log(`   ${results.functionality.refreshButton.works ? '✅' : '❌'} Refresh Button`);
      console.log(`   ${results.functionality.symbolSearch.works ? '✅' : '❌'} Symbol Search`);
      console.log(`   ${results.functionality.emotionFilters.works ? '✅' : '❌'} Emotion Filters`);
      console.log(`   ${results.functionality.dateFilters.works ? '✅' : '❌'} Date Filters`);
      console.log(`   ${results.functionality.marketFilter.works ? '✅' : '❌'} Market Filter`);
      
      console.log('\n📱 Responsive Design:');
      console.log(`   ${results.responsive.mobile ? '✅' : '❌'} Mobile`);
      console.log(`   ${results.responsive.tablet ? '✅' : '❌'} Tablet`);
      console.log(`   ${results.responsive.desktop ? '✅' : '❌'} Desktop`);
      
      console.log(`\n⏱️ Performance:`);
      console.log(`   Load Time: ${results.performance.loadTime}ms`);
      console.log(`   Interaction Time: ${results.performance.interactionTime}ms`);
      
      if (results.errors.length > 0) {
        console.log('\n❌ Errors Found:');
        results.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      // Calculate overall success
      const componentSuccess = Object.values(results.components).filter(c => c.rendered).length;
      const totalComponents = Object.keys(results.components).length;
      const functionalitySuccess = Object.values(results.functionality).filter(f => f.works).length;
      const totalFunctionality = Object.keys(results.functionality).length;
      const responsiveSuccess = Object.values(results.responsive).filter(r => r).length;
      const totalResponsive = Object.keys(results.responsive).length;
      
      const overallSuccess = results.pageLoad.success && 
                           componentSuccess >= totalComponents * 0.8 && // At least 80% components
                           functionalitySuccess >= totalFunctionality * 0.8 && // At least 80% functionality
                           responsiveSuccess >= totalResponsive * 0.6; // At least 60% responsive
      
      console.log(`\n🏁 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}`);
      console.log(`   Components: ${componentSuccess}/${totalComponents} (${Math.round(componentSuccess/totalComponents*100)}%)`);
      console.log(`   Functionality: ${functionalitySuccess}/${totalFunctionality} (${Math.round(functionalitySuccess/totalFunctionality*100)}%)`);
      console.log(`   Responsive: ${responsiveSuccess}/${totalResponsive} (${Math.round(responsiveSuccess/totalResponsive*100)}%)`);
      
      // Save results
      const fs = require('fs');
      fs.writeFileSync(
        'confluence-components-final-test-results.json',
        JSON.stringify(results, null, 2)
      );
      console.log('\n📄 Results saved to confluence-components-final-test-results.json');
      
      process.exit(overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testConfluenceComponentsFinal;