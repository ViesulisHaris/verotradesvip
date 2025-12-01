const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Final Comprehensive Verification Test
 * Tests all aspects of the trading journal application
 */

async function runFinalComprehensiveTest() {
  console.log('🚀 Starting Final Comprehensive Verification Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const testResults = {
    timestamp: new Date().toISOString(),
    applicationStartup: {},
    pageLoading: {},
    authenticationFlow: {},
    navigationSystem: {},
    componentRendering: {},
    responsiveDesign: {},
    errorHandling: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: []
    }
  };

  try {
    // Test 1: Application Startup
    console.log('\n📋 Test 1: Application Startup');
    testResults.summary.totalTests++;
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    const loadTime = Date.now() - startTime;
    
    // Check if page loads without errors
    const pageTitle = await page.title();
    const hasError = await page.locator('text=Application error').count();
    const hasWhiteScreen = await page.evaluate(() => {
      return document.body.innerHTML.trim().length < 100;
    });
    
    testResults.applicationStartup = {
      loadTime,
      pageTitle,
      hasError: hasError > 0,
      hasWhiteScreen,
      success: !hasError && !hasWhiteScreen && loadTime < 5000
    };
    
    if (testResults.applicationStartup.success) {
      testResults.summary.passedTests++;
      console.log('✅ Application startup successful');
    } else {
      testResults.summary.failedTests++;
      testResults.summary.criticalIssues.push('Application startup failed');
      console.log('❌ Application startup failed');
    }

    // Test 2: Page Loading Verification
    console.log('\n📋 Test 2: Page Loading Verification');
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/trades', name: 'Trades' },
      { path: '/strategies', name: 'Strategies' }
    ];
    
    for (const pageInfo of pages) {
      testResults.summary.totalTests++;
      console.log(`Testing ${pageInfo.name} page...`);
      
      try {
        await page.goto(`http://localhost:3000${pageInfo.path}`, { 
          waitUntil: 'networkidle',
          timeout: 8000 
        });
        
        // Wait a bit for dynamic content
        await page.waitForTimeout(1000);
        
        // Check for errors
        const hasError = await page.locator('text=Application error').count();
        const has404 = await page.locator('text=404').count();
        const pageContent = await page.content();
        const hasContent = pageContent.length > 1000;
        
        // Take screenshot for verification
        const screenshot = await page.screenshot({ 
          path: `verotradesvip/final-test-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
          fullPage: true 
        });
        
        testResults.pageLoading[pageInfo.name] = {
          hasError: hasError > 0,
          has404: has404 > 0,
          hasContent,
          success: !hasError && !has404 && hasContent
        };
        
        if (testResults.pageLoading[pageInfo.name].success) {
          testResults.summary.passedTests++;
          console.log(`✅ ${pageInfo.name} page loaded successfully`);
        } else {
          testResults.summary.failedTests++;
          testResults.summary.criticalIssues.push(`${pageInfo.name} page loading failed`);
          console.log(`❌ ${pageInfo.name} page loading failed`);
        }
      } catch (error) {
        testResults.pageLoading[pageInfo.name] = {
          hasError: true,
          error: error.message,
          success: false
        };
        testResults.summary.failedTests++;
        testResults.summary.criticalIssues.push(`${pageInfo.name} page loading error: ${error.message}`);
        console.log(`❌ ${pageInfo.name} page loading error: ${error.message}`);
      }
    }

    // Test 3: Authentication Flow
    console.log('\n📋 Test 3: Authentication Flow');
    testResults.summary.totalTests++;
    
    try {
      // Navigate to login page
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Check if login form exists
      const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
      const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
      const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In")').count();
      
      testResults.authenticationFlow = {
        loginFormExists: emailInput > 0 && passwordInput > 0 && loginButton > 0,
        success: emailInput > 0 && passwordInput > 0 && loginButton > 0
      };
      
      if (testResults.authenticationFlow.success) {
        testResults.summary.passedTests++;
        console.log('✅ Authentication flow - login form available');
      } else {
        testResults.summary.failedTests++;
        testResults.summary.criticalIssues.push('Authentication flow - login form not available');
        console.log('❌ Authentication flow - login form not available');
      }
    } catch (error) {
      testResults.authenticationFlow = {
        hasError: true,
        error: error.message,
        success: false
      };
      testResults.summary.failedTests++;
      testResults.summary.criticalIssues.push(`Authentication flow error: ${error.message}`);
      console.log(`❌ Authentication flow error: ${error.message}`);
    }

    // Test 4: Navigation System
    console.log('\n📋 Test 4: Navigation System');
    testResults.summary.totalTests++;
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Check for navigation elements
      const sidebar = await page.locator('[data-testid="sidebar"], .sidebar, nav').count();
      const menuItems = await page.locator('a[href*="/dashboard"], a[href*="/trades"], a[href*="/strategies"]').count();
      const mobileMenuButton = await page.locator('button[aria-label*="menu"], .menu-button, button:has-text("Menu")').count();
      
      testResults.navigationSystem = {
        hasSidebar: sidebar > 0,
        hasMenuItems: menuItems > 0,
        hasMobileMenu: mobileMenuButton > 0,
        success: menuItems > 0
      };
      
      if (testResults.navigationSystem.success) {
        testResults.summary.passedTests++;
        console.log('✅ Navigation system working');
      } else {
        testResults.summary.failedTests++;
        testResults.summary.criticalIssues.push('Navigation system not working');
        console.log('❌ Navigation system not working');
      }
    } catch (error) {
      testResults.navigationSystem = {
        hasError: true,
        error: error.message,
        success: false
      };
      testResults.summary.failedTests++;
      testResults.summary.criticalIssues.push(`Navigation system error: ${error.message}`);
      console.log(`❌ Navigation system error: ${error.message}`);
    }

    // Test 5: Component Rendering
    console.log('\n📋 Test 5: Component Rendering');
    testResults.summary.totalTests++;
    
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Check for common components
      const buttons = await page.locator('button').count();
      const cards = await page.locator('.card, [class*="card"]').count();
      const forms = await page.locator('form').count();
      const inputs = await page.locator('input').count();
      
      testResults.componentRendering = {
        hasButtons: buttons > 0,
        hasCards: cards > 0,
        hasForms: forms > 0,
        hasInputs: inputs > 0,
        componentCount: buttons + cards + forms + inputs,
        success: buttons > 0 && cards > 0
      };
      
      if (testResults.componentRendering.success) {
        testResults.summary.passedTests++;
        console.log('✅ Component rendering working');
      } else {
        testResults.summary.failedTests++;
        testResults.summary.criticalIssues.push('Component rendering issues');
        console.log('❌ Component rendering issues');
      }
    } catch (error) {
      testResults.componentRendering = {
        hasError: true,
        error: error.message,
        success: false
      };
      testResults.summary.failedTests++;
      testResults.summary.criticalIssues.push(`Component rendering error: ${error.message}`);
      console.log(`❌ Component rendering error: ${error.message}`);
    }

    // Test 6: Responsive Design
    console.log('\n📋 Test 6: Responsive Design');
    testResults.summary.totalTests++;
    
    try {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];
      
      let responsiveSuccess = true;
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth;
        });
        
        // Check if content is visible
        const contentVisible = await page.locator('body').isVisible();
        
        if (hasHorizontalScroll || !contentVisible) {
          responsiveSuccess = false;
        }
        
        console.log(`  ${viewport.name}: ${hasHorizontalScroll ? '❌ Horizontal scroll' : '✅ OK'}`);
      }
      
      testResults.responsiveDesign = {
        tested: true,
        success: responsiveSuccess
      };
      
      if (testResults.responsiveDesign.success) {
        testResults.summary.passedTests++;
        console.log('✅ Responsive design working');
      } else {
        testResults.summary.failedTests++;
        testResults.summary.criticalIssues.push('Responsive design issues');
        console.log('❌ Responsive design issues');
      }
    } catch (error) {
      testResults.responsiveDesign = {
        hasError: true,
        error: error.message,
        success: false
      };
      testResults.summary.failedTests++;
      testResults.summary.criticalIssues.push(`Responsive design error: ${error.message}`);
      console.log(`❌ Responsive design error: ${error.message}`);
    }

    // Test 7: Error Handling
    console.log('\n📋 Test 7: Error Handling');
    testResults.summary.totalTests++;
    
    try {
      // Test invalid URL
      await page.goto('http://localhost:3000/invalid-page-that-should-not-exist', { 
        waitUntil: 'networkidle',
        timeout: 5000 
      });
      
      await page.waitForTimeout(1000);
      
      // Check if 404 page is shown or if it redirects properly
      const has404 = await page.locator('text=404').count();
      const hasNotFound = await page.locator('text=Not Found').count();
      const hasError = await page.locator('text=Application error').count();
      
      testResults.errorHandling = {
        handles404: has404 > 0 || hasNotFound > 0,
        noApplicationError: hasError === 0,
        success: (has404 > 0 || hasNotFound > 0) && hasError === 0
      };
      
      if (testResults.errorHandling.success) {
        testResults.summary.passedTests++;
        console.log('✅ Error handling working');
      } else {
        testResults.summary.failedTests++;
        console.log('❌ Error handling issues');
      }
    } catch (error) {
      testResults.errorHandling = {
        hasError: true,
        error: error.message,
        success: false
      };
      testResults.summary.failedTests++;
      console.log(`❌ Error handling test error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
    testResults.summary.criticalIssues.push(`Critical test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Save results
  const resultsPath = `verotradesvip/final-comprehensive-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  
  // Generate report
  console.log('\n📊 FINAL COMPREHENSIVE TEST RESULTS');
  console.log('=====================================');
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passedTests}`);
  console.log(`Failed: ${testResults.summary.failedTests}`);
  console.log(`Success Rate: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%`);
  
  if (testResults.summary.criticalIssues.length > 0) {
    console.log('\n🚨 Critical Issues:');
    testResults.summary.criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  
  return testResults;
}

// Run the test
runFinalComprehensiveTest().catch(console.error);