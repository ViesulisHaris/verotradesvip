const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Comprehensive validation script for trades page fixes
async function validateTradesPageFixes() {
  console.log('🔍 Starting validation of trades page fixes...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ Console Warning: ${msg.text()}`);
    }
  });
  
  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    const request = networkRequests.find(r => r.url === response.url());
    if (request) {
      request.status = response.status();
      request.statusText = response.statusText();
      
      // Log 404 errors specifically
      if (response.status() === 404) {
        console.log(`❌ 404 Error: ${response.url()}`);
      }
    }
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('🌐 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load completely
    await page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Validation results
    const validationResults = {
      timestamp: new Date().toISOString(),
      pageLoad: {
        success: false,
        loadTime: 0,
        finalUrl: currentUrl
      },
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: [],
      pageErrors: [],
      functionality: {
        hasNavigation: false,
        hasStatistics: false,
        hasFilters: false,
        hasTradeRows: false,
        hasGSAP: false,
        hasAnimations: false
      },
      performance: {
        memoryUsage: 0,
        renderTime: 0,
        bundleSize: 0
      }
    };
    
    // Check if page loaded successfully
    if (currentUrl.includes('/trades') && !currentUrl.includes('/login')) {
      validationResults.pageLoad.success = true;
      console.log('✅ Trades page loaded successfully');
    } else if (currentUrl.includes('/login')) {
      console.log('⚠️ Redirected to login - authentication required');
    } else {
      console.log('❌ Page failed to load properly');
    }
    
    // Analyze console messages
    validationResults.consoleErrors = consoleMessages.filter(m => m.type === 'error');
    validationResults.consoleWarnings = consoleMessages.filter(m => m.type === 'warning');
    
    // Analyze network errors
    validationResults.networkErrors = networkRequests.filter(r => r.status && r.status >= 400);
    
    // Analyze page errors
    validationResults.pageErrors = pageErrors;
    
    // Check functionality
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        hasNavigation: !!document.querySelector('nav'),
        hasStatistics: !!document.querySelector('.grid'),
        hasFilters: !!document.querySelector('select, input'),
        hasTradeRows: !!document.querySelector('.space-y-3'),
        hasGSAP: typeof window.gsap !== 'undefined',
        hasAnimations: !!document.querySelector('[class*="scroll-item"], [class*="flashlight"]')
      };
      
      // Check for text rendering issues
      const textElements = document.querySelectorAll('h1, h2, h3, p, span');
      const hiddenTextElements = Array.from(textElements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      });
      
      analysis.hiddenTextElements = hiddenTextElements.length;
      analysis.totalTextElements = textElements.length;
      
      // Check for performance issues
      const scripts = document.querySelectorAll('script');
      analysis.scriptCount = scripts.length;
      analysis.largeScripts = Array.from(scripts).filter(s => s.src && s.src.length > 1000).length;
      
      return analysis;
    });
    
    validationResults.functionality = pageAnalysis;
    
    // Check performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    validationResults.performance = performanceMetrics;
    
    // Generate validation report
    console.log('\n📊 VALIDATION RESULTS:');
    console.log('==================');
    
    console.log('\n🚀 Page Load:');
    console.log(`  Success: ${validationResults.pageLoad.success ? '✅' : '❌'}`);
    console.log(`  Final URL: ${validationResults.pageLoad.finalUrl}`);
    
    console.log('\n📝 Console Issues:');
    console.log(`  Errors: ${validationResults.consoleErrors.length}`);
    console.log(`  Warnings: ${validationResults.consoleWarnings.length}`);
    
    console.log('\n🌐 Network Issues:');
    console.log(`  Failed Requests: ${validationResults.networkErrors.length}`);
    const critical404s = validationResults.networkErrors.filter(r => r.status === 404 && r.url.includes('/_next/'));
    console.log(`  Critical 404s: ${critical404s.length}`);
    
    console.log('\n🔧 Functionality:');
    console.log(`  Navigation: ${validationResults.functionality.hasNavigation ? '✅' : '❌'}`);
    console.log(`  Statistics: ${validationResults.functionality.hasStatistics ? '✅' : '❌'}`);
    console.log(`  Filters: ${validationResults.functionality.hasFilters ? '✅' : '❌'}`);
    console.log(`  Trade Rows: ${validationResults.functionality.hasTradeRows ? '✅' : '❌'}`);
    console.log(`  GSAP: ${validationResults.functionality.hasGSAP ? '✅' : '❌'}`);
    console.log(`  Animations: ${validationResults.functionality.hasAnimations ? '✅' : '❌'}`);
    
    console.log('\n⚡ Performance:');
    console.log(`  DOM Content Loaded: ${validationResults.performance.domContentLoaded}ms`);
    console.log(`  Load Complete: ${validationResults.performance.loadComplete}ms`);
    console.log(`  Total Load Time: ${validationResults.performance.totalLoadTime}ms`);
    console.log(`  Resource Count: ${validationResults.performance.resourceCount}`);
    
    // Take screenshot for visual verification
    const screenshot = await page.screenshot({ 
      fullPage: true,
      path: 'trades-page-validation-screenshot.png'
    });
    console.log('\n📸 Screenshot saved: trades-page-validation-screenshot.png');
    
    // Save validation report
    const reportPath = path.join(__dirname, 'trades-page-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
    console.log(`\n📄 Full report saved: trades-page-validation-report.json`);
    
    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log('=====================');
    
    let score = 0;
    let maxScore = 10;
    
    if (validationResults.pageLoad.success) score += 2;
    if (validationResults.consoleErrors.length === 0) score += 1;
    if (validationResults.consoleWarnings.length <= 2) score += 1;
    if (critical404s.length === 0) score += 2;
    if (validationResults.functionality.hasNavigation) score += 0.5;
    if (validationResults.functionality.hasGSAP) score += 1;
    if (validationResults.functionality.hasAnimations) score += 0.5;
    if (validationResults.performance.totalLoadTime < 2000) score += 1;
    if (validationResults.performance.resourceCount < 50) score += 1;
    
    const percentage = (score / maxScore) * 100;
    console.log(`Score: ${score}/${maxScore} (${percentage.toFixed(1)}%)`);
    
    if (percentage >= 80) {
      console.log('🟢 EXCELLENT - Trades page is working very well');
    } else if (percentage >= 60) {
      console.log('🟡 GOOD - Trades page is mostly functional with minor issues');
    } else if (percentage >= 40) {
      console.log('🟠 FAIR - Trades page has some issues but is usable');
    } else {
      console.log('🔴 POOR - Trades page has significant issues');
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    if (validationResults.consoleErrors.length > 0) {
      console.log('  - Fix JavaScript errors in console');
    }
    if (critical404s.length > 0) {
      console.log('  - Resolve static asset 404 errors');
    }
    if (!validationResults.functionality.hasGSAP) {
      console.log('  - Fix GSAP initialization');
    }
    if (validationResults.performance.totalLoadTime > 2000) {
      console.log('  - Optimize page load performance');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await browser.close();
  }
}

// Run validation
validateTradesPageFixes().catch(console.error);