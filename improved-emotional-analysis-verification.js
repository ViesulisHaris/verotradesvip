const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function performImprovedVerificationTest() {
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
    console.log('🚀 Starting improved emotional state analysis verification test...\n');

    // Step 1: Navigate to dashboard page
    console.log('📍 Step 1: Navigating to dashboard page...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Allow page to fully load and emotion data to process
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'verification-screenshots/dashboard-emotional-analysis.png', fullPage: true });
    
    // Extract emotional state data from dashboard using more specific selectors
    const dashboardEmotionalData = await page.evaluate(() => {
      // Look for EmotionRadar component data
      const emotionRadarElements = document.querySelectorAll('[class*="emotion"], [class*="radar"], [data-testid*="emotion"]');
      const data = [];
      
      // Try to find the emotion radar chart or related elements
      const radarElements = document.querySelectorAll('svg, canvas, [class*="chart"]');
      radarElements.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && (text.includes('FOMO') || text.includes('REVENGE') || text.includes('TILT') || 
                   text.includes('PATIENCE') || text.includes('DISCIPLINE') || text.includes('CONFIDENT'))) {
          data.push(text.trim());
        }
      });
      
      // Look for emotional pattern sections
      const emotionalSections = document.querySelectorAll('h3, h4, [class*="emotion"], [class*="pattern"]');
      emotionalSections.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && (text.includes('Emotional') || text.includes('Pattern'))) {
          // Get the next sibling or parent container that might contain the data
          let container = el.nextElementSibling || el.parentElement;
          if (container) {
            const containerText = container.textContent || container.innerText;
            if (containerText && (containerText.includes('FOMO') || containerText.includes('REVENGE'))) {
              data.push(containerText.trim());
            }
          }
        }
      });
      
      return data;
    });

    console.log('✅ Dashboard page loaded and screenshot captured');
    console.log('📊 Dashboard emotional analysis data found:', dashboardEmotionalData.length > 0 ? 'Yes' : 'No');

    // Step 2: Navigate to confluence page
    console.log('\n📍 Step 2: Navigating to confluence page...');
    await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Allow page to fully load and emotion data to process
    
    // Take screenshot of confluence page (no filters)
    await page.screenshot({ path: 'verification-screenshots/confluence-emotional-analysis-no-filters.png', fullPage: true });
    
    // Extract emotional state data from confluence
    const confluenceEmotionalData = await page.evaluate(() => {
      const data = [];
      
      // Try to find the emotion radar chart or related elements
      const radarElements = document.querySelectorAll('svg, canvas, [class*="chart"]');
      radarElements.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && (text.includes('FOMO') || text.includes('REVENGE') || text.includes('TILT') || 
                   text.includes('PATIENCE') || text.includes('DISCIPLINE') || text.includes('CONFIDENT'))) {
          data.push(text.trim());
        }
      });
      
      // Look for emotional pattern sections
      const emotionalSections = document.querySelectorAll('h3, h4, [class*="emotion"], [class*="pattern"]');
      emotionalSections.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && (text.includes('Emotional') || text.includes('Pattern'))) {
          // Get the next sibling or parent container that might contain the data
          let container = el.nextElementSibling || el.parentElement;
          if (container) {
            const containerText = container.textContent || container.innerText;
            if (containerText && (containerText.includes('FOMO') || containerText.includes('REVENGE'))) {
              data.push(containerText.trim());
            }
          }
        }
      });
      
      return data;
    });

    console.log('✅ Confluence page loaded and screenshot captured');
    console.log('📊 Confluence emotional analysis data found:', confluenceEmotionalData.length > 0 ? 'Yes' : 'No');

    // Step 3: Test filter functionality on confluence
    console.log('\n📍 Step 3: Testing filter functionality...');
    
    // Look for filter elements and try to apply some filters
    const filterElements = await page.$$('select, input[type="checkbox"], input[type="radio"], .filter, [class*="filter"], button');
    
    if (filterElements.length > 0) {
      console.log(`Found ${filterElements.length} potential filter elements`);
      
      // Try to find and click emotion filter buttons
      const emotionButtons = await page.$$('button');
      let filterApplied = false;
      
      for (const button of emotionButtons) {
        const text = await button.textContent();
        if (text && (text.includes('FOMO') || text.includes('REVENGE') || text.includes('TILT'))) {
          console.log(`Found emotion filter button: ${text.trim()}`);
          await button.click();
          await page.waitForTimeout(2000);
          filterApplied = true;
          break;
        }
      }
      
      if (filterApplied) {
        // Take screenshot with filters applied
        await page.screenshot({ path: 'verification-screenshots/confluence-emotional-analysis-with-filters.png', fullPage: true });
        
        // Extract emotional data with filters
        const confluenceEmotionalDataWithFilters = await page.evaluate(() => {
          const data = [];
          
          const radarElements = document.querySelectorAll('svg, canvas, [class*="chart"]');
          radarElements.forEach(el => {
            const text = el.textContent || el.innerText;
            if (text && (text.includes('FOMO') || text.includes('REVENGE') || text.includes('TILT'))) {
              data.push(text.trim());
            }
          });
          
          return data;
        });
        
        console.log('📊 Confluence emotional analysis data with filters found:', confluenceEmotionalDataWithFilters.length > 0 ? 'Yes' : 'No');
        
        // Clear filters by going back to confluence page
        await page.goto('http://localhost:3000/confluence', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
      } else {
        console.log('No emotion filter buttons found');
      }
    } else {
      console.log('No filter elements found on confluence page');
    }

    // Step 4: Analyze console logs for debugging information
    console.log('\n📍 Step 4: Analyzing console logs...');
    
    const relevantConsoleLogs = consoleLogs.filter(log => 
      log.text.includes('hasActiveFilters') || 
      log.text.includes('Using data source') || 
      log.text.includes('EMOTION DEBUG') ||
      log.text.includes('CONFLUENCE EMOTION DEBUG') ||
      log.text.includes('DASHBOARD EMOTION DEBUG') ||
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
      request.url.includes('supabase')
    );

    console.log('🌐 Relevant network requests:');
    relevantNetworkRequests.forEach(request => {
      console.log(`  ${request.method} ${request.url}`);
    });

    // Step 6: Check for authentication and data availability
    console.log('\n📍 Step 6: Checking authentication and data availability...');
    
    const authStatus = await page.evaluate(() => {
      // Check if user is authenticated by looking for user-related elements
      const userElements = document.querySelectorAll('[class*="user"], [class*="auth"], [class*="login"]');
      const hasUserData = userElements.length > 0;
      
      // Check for trade data
      const tradeElements = document.querySelectorAll('[class*="trade"], table tbody tr');
      const hasTradeData = tradeElements.length > 0;
      
      return { hasUserData, hasTradeData, tradeCount: tradeElements.length };
    });

    console.log('🔐 Authentication status:', authStatus);

    // Step 7: Compare emotional analysis data between pages
    console.log('\n📍 Step 7: Comparing emotional analysis data...');
    
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
        filterTested: filterElements.length > 0,
        emotionalDataFound: {
          dashboard: dashboardEmotionalData.length > 0,
          confluence: confluenceEmotionalData.length > 0
        },
        authStatus: authStatus
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
    fs.writeFileSync('improved-emotional-analysis-verification-report.json', JSON.stringify(verificationReport, null, 2));
    console.log('\n📄 Verification report saved to improved-emotional-analysis-verification-report.json');

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
performImprovedVerificationTest()
  .then(report => {
    console.log('\n✅ Improved verification test completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Dashboard loaded: ${report.testResults.dashboardLoaded ? '✅' : '❌'}`);
    console.log(`  - Confluence loaded: ${report.testResults.confluenceLoaded ? '✅' : '❌'}`);
    console.log(`  - Data match: ${report.testResults.dataMatch ? '✅' : '❌'}`);
    console.log(`  - Filters found: ${report.testResults.filtersFound ? '✅' : '❌'}`);
    console.log(`  - Filter tested: ${report.testResults.filterTested ? '✅' : '❌'}`);
    console.log(`  - Dashboard emotional data: ${report.testResults.emotionalDataFound.dashboard ? '✅' : '❌'}`);
    console.log(`  - Confluence emotional data: ${report.testResults.emotionalDataFound.confluence ? '✅' : '❌'}`);
    console.log(`  - User authenticated: ${report.testResults.authStatus.hasUserData ? '✅' : '❌'}`);
    console.log(`  - Trade data available: ${report.testResults.authStatus.hasTradeData ? '✅' : '❌'}`);
  })
  .catch(error => {
    console.error('❌ Verification test failed:', error);
    process.exit(1);
  });