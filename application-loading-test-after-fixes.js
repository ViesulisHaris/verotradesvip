const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testApplicationAfterFixes() {
  console.log('🧪 Testing Trading Journal Application After Fixes...');
  console.log('==================================================');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false to visually verify
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Collect console logs and errors
  const consoleLogs = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    consoleLogs: [],
    jsErrors: [],
    screenshots: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };
  
  try {
    // Test 1: Initial Application Loading
    console.log('\n📋 Test 1: Initial Application Loading');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Wait for page to fully render
    await page.waitForTimeout(2000);
    
    // Check if page loaded successfully (not white screen)
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      return {
        bgStyle: window.getComputedStyle(body).backgroundColor,
        hasContent: body.innerText.length > 100,
        htmlContent: body.innerHTML.substring(0, 500)
      };
    });
    
    const isWhiteScreen = bodyContent.bgStyle === 'rgba(0, 0, 0, 0)' || 
                         bodyContent.bgStyle === 'white' || 
                         !bodyContent.hasContent;
    
    testResults.tests.push({
      name: 'Initial Application Loading',
      status: isWhiteScreen ? 'FAILED' : 'PASSED',
      details: {
        loadTime: `${loadTime}ms`,
        isWhiteScreen: isWhiteScreen,
        backgroundColor: bodyContent.bgStyle,
        hasContent: bodyContent.hasContent,
        contentLength: bodyContent.htmlContent.length
      }
    });
    
    // Screenshot of initial load
    await page.screenshot({ 
      path: 'verotradesvip/test-initial-load-after-fixes.png',
      fullPage: true 
    });
    testResults.screenshots.push('test-initial-load-after-fixes.png');
    
    // Test 2: Check for Balatro Background Component
    console.log('\n📋 Test 2: Balatro Background Component');
    
    const balatroStatus = await page.evaluate(() => {
      // Check for canvas elements (Balatro uses canvas)
      const canvases = document.querySelectorAll('canvas');
      const balatroElements = document.querySelectorAll('[class*="balatro"], [id*="balatro"]');
      
      return {
        canvasCount: canvases.length,
        balatroElements: balatroElements.length,
        canvasDetails: Array.from(canvases).map(canvas => ({
          width: canvas.width,
          height: canvas.height,
          display: window.getComputedStyle(canvas).display,
          visible: canvas.offsetParent !== null
        }))
      };
    });
    
    testResults.tests.push({
      name: 'Balatro Background Component',
      status: balatroStatus.canvasCount > 0 ? 'PASSED' : 'FAILED',
      details: balatroStatus
    });
    
    // Test 3: Main Navigation Elements
    console.log('\n📋 Test 3: Main Navigation Elements');
    
    const navigationStatus = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const links = document.querySelectorAll('a');
      const buttons = document.querySelectorAll('button');
      
      return {
        hasNav: !!nav,
        linkCount: links.length,
        buttonCount: buttons.length,
        navVisible: nav ? window.getComputedStyle(nav).display !== 'none' : false,
        mainLinks: Array.from(links).slice(0, 5).map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }))
      };
    });
    
    testResults.tests.push({
      name: 'Main Navigation Elements',
      status: navigationStatus.hasNav ? 'PASSED' : 'FAILED',
      details: navigationStatus
    });
    
    // Test 4: Key Pages Loading
    console.log('\n📋 Test 4: Key Pages Loading');
    
    const pagesToTest = [
      { name: 'Home', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Register', url: '/register' },
      { name: 'Dashboard', url: '/dashboard' }
    ];
    
    for (const pageTest of pagesToTest) {
      try {
        await page.goto(`http://localhost:3000${pageTest.url}`, { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        await page.waitForTimeout(1000);
        
        const pageStatus = await page.evaluate(() => {
          const body = document.body;
          return {
            title: document.title,
            hasContent: body.innerText.length > 50,
            isWhiteScreen: window.getComputedStyle(body).backgroundColor === 'rgba(0, 0, 0, 0)' || 
                           window.getComputedStyle(body).backgroundColor === 'white'
          };
        });
        
        testResults.tests.push({
          name: `Page Load: ${pageTest.name}`,
          status: pageStatus.hasContent && !pageStatus.isWhiteScreen ? 'PASSED' : 'FAILED',
          details: {
            url: pageTest.url,
            ...pageStatus
          }
        });
        
        // Screenshot for each page
        const screenshotName = `test-page-${pageTest.name.toLowerCase()}-after-fixes.png`;
        await page.screenshot({ 
          path: `verotradesvip/${screenshotName}`,
          fullPage: true 
        });
        testResults.screenshots.push(screenshotName);
        
      } catch (error) {
        testResults.tests.push({
          name: `Page Load: ${pageTest.name}`,
          status: 'FAILED',
          details: {
            url: pageTest.url,
            error: error.message
          }
        });
      }
    }
    
    // Test 5: Console Errors Check
    console.log('\n📋 Test 5: Console Errors Check');
    
    const hasErrors = jsErrors.length > 0;
    const hasWarnings = consoleLogs.filter(log => log.type === 'warning').length > 0;
    
    testResults.tests.push({
      name: 'Console Errors Check',
      status: !hasErrors ? 'PASSED' : 'FAILED',
      details: {
        jsErrorCount: jsErrors.length,
        warningCount: consoleLogs.filter(log => log.type === 'warning').length,
        logCount: consoleLogs.filter(log => log.type === 'log').length,
        errors: jsErrors.slice(0, 3), // First 3 errors
        warnings: consoleLogs.filter(log => log.type === 'warning').slice(0, 3)
      }
    });
    
    // Test 6: TypeScript and CSS Build Issues
    console.log('\n📋 Test 6: Build Issues Verification');
    
    const buildStatus = await page.evaluate(() => {
      // Check for common build issue indicators
      const hasBuildErrors = document.body.innerHTML.includes('TypeError') ||
                           document.body.innerHTML.includes('ReferenceError') ||
                           document.body.innerHTML.includes('Cannot read property');
      
      const hasStyleIssues = document.querySelectorAll('[style*="undefined"]').length > 0;
      
      return {
        hasBuildErrors,
        hasStyleIssues,
        bodyClasses: document.body.className,
        hasTailwind: document.querySelector('link[href*="tailwind"]') !== null
      };
    });
    
    testResults.tests.push({
      name: 'Build Issues Verification',
      status: !buildStatus.hasBuildErrors && !buildStatus.hasStyleIssues ? 'PASSED' : 'FAILED',
      details: buildStatus
    });
    
  } catch (error) {
    console.error('Test execution error:', error);
    testResults.tests.push({
      name: 'Test Execution',
      status: 'FAILED',
      details: { error: error.message }
    });
  } finally {
    // Collect all console logs and errors
    testResults.consoleLogs = consoleLogs;
    testResults.jsErrors = jsErrors;
    
    // Calculate summary
    testResults.summary.total = testResults.tests.length;
    testResults.summary.passed = testResults.tests.filter(t => t.status === 'PASSED').length;
    testResults.summary.failed = testResults.tests.filter(t => t.status === 'FAILED').length;
    
    // Save results
    const reportPath = 'verotradesvip/application-test-report-after-fixes.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Report saved to: ${reportPath}`);
    
    // Print detailed results
    console.log('\n📋 Detailed Results:');
    testResults.tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
      if (test.status === 'FAILED') {
        console.log(`   Details:`, test.details);
      }
    });
    
    if (jsErrors.length > 0) {
      console.log('\n⚠️ JavaScript Errors Found:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    await browser.close();
  }
}

// Run the test
testApplicationAfterFixes().catch(console.error);