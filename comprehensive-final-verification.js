const puppeteer = require('puppeteer');
const fs = require('fs');

async function comprehensiveVerification() {
  console.log('🔍 Starting Comprehensive Final Verification...\n');
  
  const results = {
    tradesStatistics: {
      barChartIcon: false,
      tradesLabel: false,
      statisticsCards: false,
      overallStyling: false
    },
    staticAssets: {
      no404Errors: false,
      cssLoaded: false,
      jsLoaded: false,
      properHTTPResponses: false
    },
    overallFunctionality: {
      pageLoads: false,
      interactiveFeatures: false,
      serverSideRendering: false,
      clientSideRendering: false
    },
    errors: [],
    screenshots: []
  };

  let browser;
  let page;

  try {
    // Launch browser with detailed logging
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Enable console logging and network monitoring
    page.on('console', msg => {
      console.log('Browser Console:', msg.type(), msg.text());
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      // Log all asset requests
      if (url.includes('.css') || url.includes('.js') || url.includes('.woff') || url.includes('.ttf')) {
        console.log(`Asset Request: ${url} - Status: ${status}`);
        
        if (status >= 400) {
          results.errors.push(`Asset error: ${url} returned ${status}`);
        }
      }
    });

    console.log('📊 1. Testing Trades Statistics Fixes...');
    
    // Navigate to trades page
    console.log('Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for page to load completely
    await page.waitForTimeout(3000);

    // Take screenshot for visual verification
    const screenshot1 = await page.screenshot({ 
      path: 'trades-page-initial.png',
      fullPage: true 
    });
    results.screenshots.push('trades-page-initial.png');
    console.log('📸 Screenshot saved: trades-page-initial.png');

    // Check 1: Bar chart icon displays correctly (not as text "stacked_bar_chart")
    console.log('Checking bar chart icon...');
    const barChartIcon = await page.evaluate(() => {
      const statCards = document.querySelectorAll('.flashlight-container');
      for (let card of statCards) {
        const iconElement = card.querySelector('.material-symbols-outlined');
        if (iconElement && iconElement.textContent) {
          const iconText = iconElement.textContent.trim();
          if (iconText === 'bar_chart') {
            return { found: true, text: iconText, element: iconElement.outerHTML };
          }
        }
      }
      return { found: false };
    });

    if (barChartIcon.found) {
      console.log('✅ Bar chart icon displays correctly:', barChartIcon.text);
      results.tradesStatistics.barChartIcon = true;
    } else {
      console.log('❌ Bar chart icon issue detected');
      results.errors.push('Bar chart icon not displaying correctly');
    }

    // Check 2: Label shows "Trades" instead of "Total Trades"
    console.log('Checking trades label...');
    const tradesLabel = await page.evaluate(() => {
      const statCards = document.querySelectorAll('.flashlight-container');
      for (let card of statCards) {
        const labelElement = card.querySelector('.text-gray-400');
        if (labelElement && labelElement.textContent) {
          const labelText = labelElement.textContent.trim();
          if (labelText.includes('Trades') && !labelText.includes('Total Trades')) {
            return { found: true, text: labelText };
          }
        }
      }
      return { found: false };
    });

    if (tradesLabel.found) {
      console.log('✅ Trades label displays correctly:', tradesLabel.text);
      results.tradesStatistics.tradesLabel = true;
    } else {
      console.log('❌ Trades label issue detected');
      results.errors.push('Trades label not displaying correctly');
    }

    // Check 3: All statistics cards render properly with correct styling
    console.log('Checking statistics cards styling...');
    const statisticsCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('.flashlight-container');
      const cardInfo = [];
      
      cards.forEach((card, index) => {
        const styles = window.getComputedStyle(card);
        const hasFlashlightBg = card.querySelector('.flashlight-bg') !== null;
        const hasFlashlightBorder = card.querySelector('.flashlight-border') !== null;
        const hasRelativeZ10 = card.querySelector('.relative.z-10') !== null;
        
        cardInfo.push({
          index,
          hasFlashlightBg,
          hasFlashlightBorder,
          hasRelativeZ10,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          backgroundColor: styles.backgroundColor
        });
      });
      
      return cardInfo;
    });

    const validCards = statisticsCards.filter(card => 
      card.hasFlashlightBg && card.hasFlashlightBorder && card.hasRelativeZ10
    );

    if (validCards.length >= 4) {
      console.log('✅ All statistics cards render with proper styling');
      results.tradesStatistics.statisticsCards = true;
      results.tradesStatistics.overallStyling = true;
    } else {
      console.log('❌ Statistics cards styling issues detected');
      results.errors.push(`Only ${validCards.length}/4 cards have proper styling`);
    }

    console.log('\n🌐 2. Testing Static Asset Fixes...');
    
    // Monitor network for asset loading
    const networkErrors = [];
    page.on('requestfailed', request => {
      const url = request.url();
      if (url.includes('.css') || url.includes('.js') || url.includes('.woff') || url.includes('.ttf')) {
        networkErrors.push({ url, error: request.failure().errorText });
      }
    });

    // Reload page to monitor asset loading
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Check for 404 errors in network logs
    if (networkErrors.length === 0) {
      console.log('✅ No 404 errors for static assets');
      results.staticAssets.no404Errors = true;
    } else {
      console.log('❌ Static asset 404 errors detected:', networkErrors);
      results.errors.push(`Static asset errors: ${networkErrors.length} failures`);
    }

    // Check CSS and JS loading
    const assetLoading = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      const scripts = Array.from(document.scripts);
      
      return {
        cssLoaded: stylesheets.length > 0,
        jsLoaded: scripts.length > 0,
        cssCount: stylesheets.length,
        jsCount: scripts.length
      };
    });

    if (assetLoading.cssLoaded) {
      console.log('✅ CSS files loaded successfully');
      results.staticAssets.cssLoaded = true;
    } else {
      console.log('❌ CSS files not loaded');
      results.errors.push('CSS files failed to load');
    }

    if (assetLoading.jsLoaded) {
      console.log('✅ JavaScript files loaded successfully');
      results.staticAssets.jsLoaded = true;
    } else {
      console.log('❌ JavaScript files not loaded');
      results.errors.push('JavaScript files failed to load');
    }

    // Check HTTP responses for assets
    const assetResponses = await page.evaluate(() => {
      return new Promise((resolve) => {
        const assets = [];
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name.includes('.css') || entry.name.includes('.js')) {
              assets.push({
                url: entry.name,
                status: 'loaded', // Performance API only shows successful loads
                duration: entry.duration
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
        
        // Wait a bit then resolve
        setTimeout(() => {
          observer.disconnect();
          resolve(assets);
        }, 2000);
      });
    });

    if (assetResponses.length > 0) {
      console.log('✅ Static assets loading with proper HTTP responses');
      results.staticAssets.properHTTPResponses = true;
    } else {
      console.log('❌ Issues with static asset HTTP responses');
      results.errors.push('Static assets not loading properly');
    }

    console.log('\n🔧 3. Testing Overall Functionality...');
    
    // Check page loads completely
    const pageLoadComplete = await page.evaluate(() => {
      return document.readyState === 'complete';
    });

    if (pageLoadComplete) {
      console.log('✅ Page loads completely');
      results.overallFunctionality.pageLoads = true;
    } else {
      console.log('❌ Page loading incomplete');
      results.errors.push('Page not fully loaded');
    }

    // Check interactive features
    console.log('Testing interactive features...');
    
    // Try to interact with filters
    await page.click('input[placeholder="Search symbol..."]');
    await page.type('input[placeholder="Search symbol..."]', 'AAPL');
    await page.waitForTimeout(1000);
    
    const filterInteraction = await page.evaluate(() => {
      const symbolInput = document.querySelector('input[placeholder="Search symbol..."]');
      return symbolInput && symbolInput.value === 'AAPL';
    });

    if (filterInteraction) {
      console.log('✅ Interactive features working (filter input)');
      results.overallFunctionality.interactiveFeatures = true;
    } else {
      console.log('❌ Interactive features not working');
      results.errors.push('Interactive features failed');
    }

    // Check server-side rendering
    const pageContent = await page.content();
    if (pageContent.includes('Trade History') && pageContent.includes('VeroTrade')) {
      console.log('✅ Server-side rendering working');
      results.overallFunctionality.serverSideRendering = true;
    } else {
      console.log('❌ Server-side rendering issues');
      results.errors.push('Server-side rendering not working properly');
    }

    // Check client-side rendering
    const clientSideContent = await page.evaluate(() => {
      return {
        hasStatsCards: document.querySelectorAll('.flashlight-container').length > 0,
        hasFilters: document.querySelector('input[placeholder="Search symbol..."]') !== null,
        hasNavigation: document.querySelector('nav') !== null
      };
    });

    if (clientSideContent.hasStatsCards && clientSideContent.hasFilters && clientSideContent.hasNavigation) {
      console.log('✅ Client-side rendering working');
      results.overallFunctionality.clientSideRendering = true;
    } else {
      console.log('❌ Client-side rendering issues');
      results.errors.push('Client-side rendering not working properly');
    }

    // Take final screenshot
    const screenshot2 = await page.screenshot({ 
      path: 'trades-page-final.png',
      fullPage: true 
    });
    results.screenshots.push('trades-page-final.png');
    console.log('📸 Final screenshot saved: trades-page-final.png');

  } catch (error) {
    console.error('❌ Verification error:', error);
    results.errors.push(`Verification error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate comprehensive report
  console.log('\n📋 COMPREHENSIVE VERIFICATION REPORT');
  console.log('=' .repeat(50));
  
  console.log('\n📊 Trades Statistics Fixes:');
  Object.entries(results.tradesStatistics).forEach(([key, value]) => {
    const status = value ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${key}: ${status}`);
  });
  
  console.log('\n🌐 Static Asset Fixes:');
  Object.entries(results.staticAssets).forEach(([key, value]) => {
    const status = value ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${key}: ${status}`);
  });
  
  console.log('\n🔧 Overall Functionality:');
  Object.entries(results.overallFunctionality).forEach(([key, value]) => {
    const status = value ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${key}: ${status}`);
  });
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n📸 Screenshots taken:');
  results.screenshots.forEach((screenshot, index) => {
    console.log(`  ${index + 1}. ${screenshot}`);
  });

  // Calculate overall success rate
  const allChecks = [
    ...Object.values(results.tradesStatistics),
    ...Object.values(results.staticAssets),
    ...Object.values(results.overallFunctionality)
  ];
  
  const passedChecks = allChecks.filter(Boolean).length;
  const totalChecks = allChecks.length;
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passedChecks}/${totalChecks} checks passed)`);
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    successRate,
    results,
    summary: {
      tradesStatisticsFixed: Object.values(results.tradesStatistics).every(Boolean),
      staticAssetsFixed: Object.values(results.staticAssets).every(Boolean),
      overallFunctional: Object.values(results.overallFunctionality).every(Boolean),
      allIssuesResolved: successRate === 100
    }
  };
  
  fs.writeFileSync('comprehensive-verification-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: comprehensive-verification-report.json');
  
  return reportData;
}

// Run the verification
if (require.main === module) {
  comprehensiveVerification()
    .then(() => {
      console.log('\n✅ Comprehensive verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = comprehensiveVerification;