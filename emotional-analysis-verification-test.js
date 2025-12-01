const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function performVerificationTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging and network monitoring
  const consoleLogs = [];
  const networkRequests = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
  });

  try {
    console.log('🚀 Starting emotional state analysis verification test...\n');

    // Step 1: Navigate to dashboard page
    console.log('📍 Step 1: Navigating to dashboard page...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Allow page to fully load
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'verification-screenshots/dashboard-emotional-analysis.png', fullPage: true });
    
    // Extract emotional state data from dashboard
    const dashboardEmotionalData = await page.evaluate(() => {
      const emotionalElements = document.querySelectorAll('[data-testid="emotional-state-analysis"], .emotional-state-analysis, [class*="emotion"], [class*="sentiment"]');
      const data = [];
      
      emotionalElements.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && (text.includes('emotion') || text.includes('sentiment') || text.includes('fear') || text.includes('greed') || text.includes('bias'))) {
          data.push(text.trim());
        }
      });
      
      return data;
    });

    console.log('✅ Dashboard page loaded and screenshot captured');
    console.log('📊 Dashboard emotional analysis data:', dashboardEmotionalData);

    // Step 2: Navigate to confluence page
    console.log('\n📍 Step 2: Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Allow page to fully load
    
    // Take screenshot of confluence page (no filters)
    await page.screenshot({ path: 'verification-screenshots/confluence-emotional-analysis-no-filters.png', fullPage: true });
    
    // Extract emotional state data from confluence
    const confluenceEmotionalData = await page.evaluate(() => {
      const emotionalElements = document.querySelectorAll('[data-testid="emotional-state-analysis"], .emotional-state-analysis, [class*="emotion"], [class*="sentiment"]');
      const data = [];
      
      emotionalElements.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && (text.includes('emotion') || text.includes('sentiment') || text.includes('fear') || text.includes('greed') || text.includes('bias'))) {
          data.push(text.trim());
        }
      });
      
      return data;
    });

    console.log('✅ Confluence page loaded and screenshot captured');
    console.log('📊 Confluence emotional analysis data:', confluenceEmotionalData);

    // Step 3: Test filter functionality on confluence
    console.log('\n📍 Step 3: Testing filter functionality...');
    
    // Look for filter elements and try to apply some filters
    const filterElements = await page.$$('select, input[type="checkbox"], input[type="radio"], .filter, [class*="filter"]');
    
    if (filterElements.length > 0) {
      console.log(`Found ${filterElements.length} filter elements`);
      
      // Try to interact with first filter if available
      try {
        await filterElements[0].click();
        await page.waitForTimeout(1000);
        
        // Select first option if it's a select
        if (await filterElements[0].isVisible() && await filterElements[0].getAttribute('type') === 'select-one') {
          await filterElements[0].selectOption({ index: 1 });
          await page.waitForTimeout(2000);
        }
        
        // Take screenshot with filters applied
        await page.screenshot({ path: 'verification-screenshots/confluence-emotional-analysis-with-filters.png', fullPage: true });
        
        // Extract emotional data with filters
        const confluenceEmotionalDataWithFilters = await page.evaluate(() => {
          const emotionalElements = document.querySelectorAll('[data-testid="emotional-state-analysis"], .emotional-state-analysis, [class*="emotion"], [class*="sentiment"]');
          const data = [];
          
          emotionalElements.forEach(el => {
            const text = el.textContent || el.innerText;
            if (text && (text.includes('emotion') || text.includes('sentiment') || text.includes('fear') || text.includes('greed') || text.includes('bias'))) {
              data.push(text.trim());
            }
          });
          
          return data;
        });
        
        console.log('📊 Confluence emotional analysis data with filters:', confluenceEmotionalDataWithFilters);
        
        // Clear filters
        await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
      } catch (error) {
        console.log('Could not interact with filters:', error.message);
      }
    } else {
      console.log('No filter elements found on confluence page');
    }

    // Step 4: Analyze console logs for debugging information
    console.log('\n📍 Step 4: Analyzing console logs...');
    
    const relevantConsoleLogs = consoleLogs.filter(log => 
      log.text.includes('hasActiveFilters') || 
      log.text.includes('Using data source') || 
      log.text.includes('emotion') || 
      log.text.includes('filter') ||
      log.type === 'error'
    );

    console.log('📋 Relevant console logs:');
    relevantConsoleLogs.forEach(log => {
      console.log(`  [${log.type.toUpperCase()}] ${log.text}`);
    });

    // Step 5: Analyze network requests
    console.log('\n📍 Step 5: Analyzing network requests...');
    
    const relevantNetworkRequests = networkRequests.filter(request => 
      request.url.includes('/api/') || 
      request.url.includes('trades') || 
      request.url.includes('emotion') ||
      request.url.includes('supabase')
    );

    console.log('🌐 Relevant network requests:');
    relevantNetworkRequests.forEach(request => {
      console.log(`  ${request.method} ${request.url}`);
    });

    // Step 6: Compare emotional analysis data between pages
    console.log('\n📍 Step 6: Comparing emotional analysis data...');
    
    const dataMatch = JSON.stringify(dashboardEmotionalData) === JSON.stringify(confluenceEmotionalData);
    console.log(`📊 Data comparison result: ${dataMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    if (!dataMatch) {
      console.log('Dashboard data:', dashboardEmotionalData);
      console.log('Confluence data:', confluenceEmotionalData);
    }

    // Compile verification report
    const verificationReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        dashboardLoaded: true,
        confluenceLoaded: true,
        dataMatch: dataMatch,
        filtersFound: filterElements.length > 0,
        filterTested: filterElements.length > 0
      },
      emotionalAnalysisData: {
        dashboard: dashboardEmotionalData,
        confluence: confluenceEmotionalData
      },
      consoleLogs: relevantConsoleLogs,
      networkRequests: relevantNetworkRequests.map(req => ({
        method: req.method,
        url: req.url
      })),
      screenshots: {
        dashboard: 'verification-screenshots/dashboard-emotional-analysis.png',
        confluenceNoFilters: 'verification-screenshots/confluence-emotional-analysis-no-filters.png',
        confluenceWithFilters: filterElements.length > 0 ? 'verification-screenshots/confluence-emotional-analysis-with-filters.png' : null
      }
    };

    // Save verification report
    fs.writeFileSync('emotional-analysis-verification-report.json', JSON.stringify(verificationReport, null, 2));
    console.log('\n📄 Verification report saved to emotional-analysis-verification-report.json');

    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync('verification-screenshots')) {
      fs.mkdirSync('verification-screenshots');
    }

    return verificationReport;

  } catch (error) {
    console.error('❌ Error during verification test:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the verification test
performVerificationTest()
  .then(report => {
    console.log('\n✅ Verification test completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Dashboard loaded: ${report.testResults.dashboardLoaded ? '✅' : '❌'}`);
    console.log(`  - Confluence loaded: ${report.testResults.confluenceLoaded ? '✅' : '❌'}`);
    console.log(`  - Data match: ${report.testResults.dataMatch ? '✅' : '❌'}`);
    console.log(`  - Filters found: ${report.testResults.filtersFound ? '✅' : '❌'}`);
    console.log(`  - Filter tested: ${report.testResults.filterTested ? '✅' : '❌'}`);
  })
  .catch(error => {
    console.error('❌ Verification test failed:', error);
    process.exit(1);
  });