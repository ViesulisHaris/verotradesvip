const { chromium } = require('playwright');
const fs = require('fs');

async function conductLiveBrowserTest() {
  console.log('🔍 Starting live browser test for infinite refresh issue...');
  
  const browser = await chromium.launch({ 
    headless: false, // Keep browser visible for observation
    slowMo: 100 // Slow down actions for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.type()}: ${msg.text()}`);
  });
  
  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
  });
  
  try {
    console.log('📍 Step 1: Navigating to strategies page...');
    await page.goto('http://localhost:3001/strategies');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Step 2: Waiting for strategies to load...');
    await page.waitForTimeout(2000);
    
    // Look for strategy cards or clickable elements
    const strategySelectors = [
      '[data-testid="strategy-card"]',
      '.strategy-card',
      '[data-strategy-id]',
      'button[onclick*="strategy"]',
      'a[href*="strategy"]',
      '.strategy-item',
      '[role="button"]'
    ];
    
    let strategyElement = null;
    for (const selector of strategySelectors) {
      try {
        strategyElement = await page.waitForSelector(selector, { timeout: 2000 });
        if (strategyElement) {
          console.log(`✅ Found strategy element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ No element found with selector: ${selector}`);
      }
    }
    
    if (!strategyElement) {
      console.log('⚠️ No strategy elements found, checking page content...');
      const pageContent = await page.content();
      console.log('Page content length:', pageContent.length);
      
      // Look for any clickable elements that might lead to strategy details
      const allClickables = await page.$$('[role="button"], button, a[href]');
      console.log(`Found ${allClickables.length} clickable elements`);
      
      if (allClickables.length > 0) {
        strategyElement = allClickables[0];
        console.log('Using first clickable element as fallback');
      }
    }
    
    if (strategyElement) {
      console.log('📍 Step 3: Clicking on strategy to view details...');
      await strategyElement.click();
      await page.waitForTimeout(3000);
      
      // Look for Performance tab
      console.log('📍 Step 4: Looking for Performance tab...');
      const performanceTabSelectors = [
        '[data-testid="performance-tab"]',
        'button:has-text("Performance")',
        'a:has-text("Performance")',
        '[role="tab"]:has-text("Performance")',
        '.tab-performance',
        '#performance-tab'
      ];
      
      let performanceTab = null;
      for (const selector of performanceTabSelectors) {
        try {
          performanceTab = await page.waitForSelector(selector, { timeout: 2000 });
          if (performanceTab) {
            console.log(`✅ Found Performance tab with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ No Performance tab found with selector: ${selector}`);
        }
      }
      
      if (performanceTab) {
        console.log('📍 Step 5: Clicking on Performance tab...');
        await performanceTab.click();
        await page.waitForTimeout(2000);
        
        console.log('📍 Step 6: Starting performance monitoring...');
        
        // Start monitoring for refresh patterns
        const refreshData = {
          startTime: Date.now(),
          networkRequests: [],
          domChanges: [],
          consoleMessages: [],
          screenshots: []
        };
        
        // Monitor network requests for 15 seconds
        const networkMonitor = setInterval(async () => {
          const currentRequests = requests.filter(r => r.timestamp > refreshData.startTime);
          refreshData.networkRequests.push(...currentRequests);
          console.log(`📊 Active requests in last second: ${currentRequests.length}`);
        }, 1000);
        
        // Monitor DOM changes
        let previousDomContent = await page.content();
        const domMonitor = setInterval(async () => {
          const currentDomContent = await page.content();
          if (currentDomContent !== previousDomContent) {
            refreshData.domChanges.push({
              timestamp: Date.now(),
              change: 'DOM content modified'
            });
            console.log('🔄 DOM content changed');
            previousDomContent = currentDomContent;
          }
        }, 500);
        
        // Take screenshots every 2 seconds
        const screenshotMonitor = setInterval(async () => {
          const screenshot = await page.screenshot();
          const screenshotPath = `infinite-refresh-screenshot-${Date.now()}.png`;
          fs.writeFileSync(screenshotPath, screenshot);
          refreshData.screenshots.push(screenshotPath);
          console.log(`📸 Screenshot saved: ${screenshotPath}`);
        }, 2000);
        
        // Monitor for 15 seconds
        console.log('⏱️ Monitoring for 15 seconds...');
        await page.waitForTimeout(15000);
        
        // Stop all monitors
        clearInterval(networkMonitor);
        clearInterval(domMonitor);
        clearInterval(screenshotMonitor);
        
        // Analyze the collected data
        console.log('\n📈 ANALYSIS RESULTS:');
        console.log('===================');
        
        const totalRequests = refreshData.networkRequests.length;
        const uniqueUrls = [...new Set(refreshData.networkRequests.map(r => r.url))];
        const domChangeCount = refreshData.domChanges.length;
        
        console.log(`Total network requests: ${totalRequests}`);
        console.log(`Unique URLs requested: ${uniqueUrls.length}`);
        console.log(`DOM changes detected: ${domChangeCount}`);
        console.log(`Screenshots captured: ${refreshData.screenshots.length}`);
        
        if (uniqueUrls.length > 0) {
          console.log('\n🔗 Most requested URLs:');
          const urlCounts = {};
          refreshData.networkRequests.forEach(r => {
            urlCounts[r.url] = (urlCounts[r.url] || 0) + 1;
          });
          Object.entries(urlCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([url, count]) => {
              console.log(`  ${count}x: ${url}`);
            });
        }
        
        if (domChangeCount > 5) {
          console.log('\n⚠️ HIGH DOM ACTIVITY DETECTED - Possible infinite refresh');
        }
        
        if (totalRequests > 20) {
          console.log('\n⚠️ HIGH NETWORK ACTIVITY DETECTED - Possible infinite requests');
        }
        
        // Save detailed report
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            totalRequests,
            uniqueUrls: uniqueUrls.length,
            domChanges: domChangeCount,
            screenshots: refreshData.screenshots.length,
            monitoringDuration: 15000
          },
          details: refreshData
        };
        
        fs.writeFileSync(
          `infinite-refresh-test-report-${Date.now()}.json`,
          JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to JSON file');
        
      } else {
        console.log('❌ Performance tab not found. Available tabs:');
        const allTabs = await page.$$('[role="tab"], button, a');
        for (let i = 0; i < Math.min(allTabs.length, 10); i++) {
          const text = await allTabs[i].textContent();
          console.log(`  - ${text || 'No text'}`);
        }
      }
    } else {
      console.log('❌ No strategy elements found to click');
      
      // Take a screenshot to see what's on the page
      const screenshot = await page.screenshot();
      fs.writeFileSync('strategies-page-debug.png', screenshot);
      console.log('📸 Debug screenshot saved as strategies-page-debug.png');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    console.log('🔚 Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and end the test');
    
    // Wait for manual intervention
    await new Promise(resolve => {
      process.on('SIGINT', resolve);
    });
    
    await browser.close();
    console.log('✅ Test completed');
  }
}

conductLiveBrowserTest().catch(console.error);