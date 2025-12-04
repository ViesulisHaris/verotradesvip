const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Comprehensive debugging script for trades page critical issues
async function debugTradesPage() {
  console.log('🔍 Starting comprehensive trades page debugging...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console errors, warnings, and logs
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture network requests and failures
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
  });
  
  try {
    console.log('🌐 Navigating to trades page...');
    await page.goto('http://localhost:3000/trades', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if page redirected to login
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Page redirected to login - authentication required');
      
      // Try to login with test credentials if available
      try {
        await page.type('input[type="email"]', 'test@example.com');
        await page.type('input[type="password"]', 'testpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check if login successful
        const loginUrl = page.url();
        if (!loginUrl.includes('/login')) {
          console.log('✅ Login successful, proceeding to trades page');
          await page.goto('http://localhost:3000/trades', { waitUntil: 'networkidle2' });
        }
      } catch (loginError) {
        console.log('❌ Login failed or login form not found:', loginError.message);
      }
    }
    
    // Take screenshot for visual analysis
    const screenshot = await page.screenshot({ 
      fullPage: true,
      path: 'trades-page-debug-screenshot.png'
    });
    console.log('📸 Screenshot saved: trades-page-debug-screenshot.png');
    
    // Analyze page content
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        hasTradesContent: false,
        hasStatistics: false,
        hasFilters: false,
        hasTradeRows: false,
        hasNavigation: false,
        errorElements: [],
        loadingElements: [],
        textIssues: [],
        performanceIssues: []
      };
      
      // Check for main components
      analysis.hasNavigation = !!document.querySelector('nav');
      analysis.hasStatistics = !!document.querySelector('.grid');
      analysis.hasFilters = !!document.querySelector('select, input');
      analysis.hasTradeRows = !!document.querySelector('.space-y-3');
      analysis.hasTradesContent = document.body.innerText.includes('Trade History') || 
                                 document.body.innerText.includes('No trades yet');
      
      // Check for error elements
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      errorElements.forEach(el => {
        analysis.errorElements.push({
          tag: el.tagName,
          className: el.className,
          text: el.innerText
        });
      });
      
      // Check for loading states
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
      loadingElements.forEach(el => {
        analysis.loadingElements.push({
          tag: el.tagName,
          className: el.className,
          text: el.innerText
        });
      });
      
      // Check for text rendering issues
      const textElements = document.querySelectorAll('h1, h2, h3, p, span');
      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          analysis.textIssues.push({
            tag: el.tagName,
            className: el.className,
            text: el.innerText.substring(0, 50),
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity
          });
        }
      });
      
      // Check for performance issues
      const scripts = document.querySelectorAll('script');
      analysis.performanceIssues.push({
        scriptCount: scripts.length,
        hasGSAP: !!document.querySelector('script[src*="gsap"]'),
        hasLargeScripts: Array.from(scripts).filter(s => s.src && s.src.length > 1000).length
      });
      
      return analysis;
    });
    
    console.log('📊 Page Analysis:', JSON.stringify(pageAnalysis, null, 2));
    
    // Check for GSAP issues specifically
    const gsapAnalysis = await page.evaluate(() => {
      try {
        const hasGSAP = typeof window.gsap !== 'undefined';
        const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
        
        return {
          hasGSAP,
          hasScrollTrigger,
          gsapVersion: hasGSAP ? window.gsap.version : null,
          scrollTriggerVersion: hasScrollTrigger ? window.ScrollTrigger.version : null
        };
      } catch (error) {
        return {
          error: error.message,
          hasGSAP: false,
          hasScrollTrigger: false
        };
      }
    });
    
    console.log('🎬 GSAP Analysis:', JSON.stringify(gsapAnalysis, null, 2));
    
    // Performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    console.log('⚡ Performance Metrics:', JSON.stringify(performanceMetrics, null, 2));
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    // Generate comprehensive report
    const debugReport = {
      timestamp: new Date().toISOString(),
      consoleMessages,
      networkRequests,
      pageErrors,
      pageAnalysis: pageAnalysis || {},
      gsapAnalysis: gsapAnalysis || {},
      performanceMetrics: performanceMetrics || {},
      summary: {
        totalErrors: pageErrors.length,
        consoleErrors: consoleMessages.filter(m => m.type === 'error').length,
        consoleWarnings: consoleMessages.filter(m => m.type === 'warning').length,
        networkFailures: networkRequests.filter(r => r.status && r.status >= 400).length
      }
    };
    
    // Save debug report
    fs.writeFileSync(
      path.join(__dirname, 'trades-page-debug-report.json'),
      JSON.stringify(debugReport, null, 2)
    );
    
    console.log('📄 Debug report saved: trades-page-debug-report.json');
    console.log('📋 Summary:');
    console.log(`  - Total Errors: ${debugReport.summary.totalErrors}`);
    console.log(`  - Console Errors: ${debugReport.summary.consoleErrors}`);
    console.log(`  - Console Warnings: ${debugReport.summary.consoleWarnings}`);
    console.log(`  - Network Failures: ${debugReport.summary.networkFailures}`);
    
    await browser.close();
  }
}

// Run the debugging
debugTradesPage().catch(console.error);