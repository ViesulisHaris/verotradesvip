const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Focused Diagnostic Test for Critical Issues
 * Investigates specific problems identified in the comprehensive test
 */

async function runFocusedDiagnosticTest() {
  console.log('🔍 Starting Focused Diagnostic Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    pageLoadDiagnostics: {},
    authenticationDiagnostics: {},
    navigationDiagnostics: {},
    componentDiagnostics: {},
    errorAnalysis: []
  };

  try {
    // Test 1: Detailed Page Loading Diagnostics
    console.log('\n🔍 Test 1: Detailed Page Loading Diagnostics');
    
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/trades', name: 'Trades' },
      { path: '/strategies', name: 'Strategies' }
    ];
    
    for (const pageInfo of pages) {
      console.log(`\n🔍 Diagnosing ${pageInfo.name} page (${pageInfo.path})...`);
      
      try {
        // Monitor network requests
        const requests = [];
        page.on('request', request => {
          requests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
          });
        });
        
        // Monitor console errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push({
              text: msg.text(),
              location: msg.location()
            });
          }
        });
        
        const startTime = Date.now();
        const response = await page.goto(`http://localhost:3000${pageInfo.path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        const loadTime = Date.now() - startTime;
        
        // Wait a bit for dynamic content
        await page.waitForTimeout(2000);
        
        // Collect diagnostic information
        const pageTitle = await page.title();
        const pageUrl = page.url();
        const pageContent = await page.content();
        const hasError = await page.locator('text=Application error').count();
        const has404 = await page.locator('text=404').count();
        const hasServerError = await page.locator('text=500').count();
        
        // Check for specific error patterns
        const hasAuthRequired = pageContent.includes('Authentication Required');
        const hasLoginRedirect = pageContent.includes('Please log in');
        const hasNetworkError = pageContent.includes('ERR_');
        
        // Take screenshot
        const screenshotPath = `verotradesvip/diagnostic-${pageInfo.name.toLowerCase()}-${Date.now()}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        diagnosticResults.pageLoadDiagnostics[pageInfo.name] = {
          path: pageInfo.path,
          loadTime,
          responseStatus: response ? response.status() : null,
          pageTitle,
          finalUrl: pageUrl,
          contentLength: pageContent.length,
          hasError: hasError > 0,
          has404: has404 > 0,
          hasServerError: hasServerError > 0,
          hasAuthRequired,
          hasLoginRedirect,
          hasNetworkError,
          consoleErrors,
          requestCount: requests.length,
          screenshotPath,
          success: response && response.status() === 200 && hasError === 0
        };
        
        console.log(`  Status: ${response ? response.status() : 'No response'}`);
        console.log(`  Load time: ${loadTime}ms`);
        console.log(`  Content length: ${pageContent.length}`);
        console.log(`  Console errors: ${consoleErrors.length}`);
        console.log(`  Auth required: ${hasAuthRequired}`);
        console.log(`  Login redirect: ${hasLoginRedirect}`);
        
        // Clear listeners for next page
        page.removeAllListeners('request');
        page.removeAllListeners('console');
        
      } catch (error) {
        diagnosticResults.pageLoadDiagnostics[pageInfo.name] = {
          path: pageInfo.path,
          hasError: true,
          error: error.message,
          errorType: error.name,
          success: false
        };
        
        diagnosticResults.errorAnalysis.push({
          page: pageInfo.name,
          error: error.message,
          type: error.name
        });
        
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // Test 2: Authentication Flow Diagnostics
    console.log('\n🔍 Test 2: Authentication Flow Diagnostics');
    
    try {
      await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Check for login form elements
      const loginFormExists = await page.locator('form').count();
      const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
      const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
      const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In")').count();
      const registerLink = await page.locator('a[href*="register"]').count();
      
      // Check for authentication-related elements
      const authProviders = await page.locator('[class*="oauth"], [class*="google"], [class*="github"]').count();
      const errorMessages = await page.locator('[class*="error"], [class*="alert"]').count();
      
      diagnosticResults.authenticationDiagnostics = {
        loginPageAccessible: await page.locator('body').isVisible(),
        loginFormExists: loginFormExists > 0,
        hasEmailInput: emailInput > 0,
        hasPasswordInput: passwordInput > 0,
        hasLoginButton: loginButton > 0,
        hasRegisterLink: registerLink > 0,
        hasAuthProviders: authProviders > 0,
        hasErrorMessages: errorMessages > 0,
        success: emailInput > 0 && passwordInput > 0 && loginButton > 0
      };
      
      console.log(`  Login form exists: ${loginFormExists > 0}`);
      console.log(`  Email input: ${emailInput > 0}`);
      console.log(`  Password input: ${passwordInput > 0}`);
      console.log(`  Login button: ${loginButton > 0}`);
      console.log(`  Register link: ${registerLink > 0}`);
      
    } catch (error) {
      diagnosticResults.authenticationDiagnostics = {
        hasError: true,
        error: error.message,
        success: false
      };
      
      diagnosticResults.errorAnalysis.push({
        component: 'Authentication',
        error: error.message,
        type: error.name
      });
      
      console.log(`  ❌ Authentication diagnostic error: ${error.message}`);
    }

    // Test 3: Navigation System Diagnostics
    console.log('\n🔍 Test 3: Navigation System Diagnostics');
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Check for navigation elements
      const sidebar = await page.locator('[data-testid="sidebar"], .sidebar, nav, [class*="nav"]').count();
      const menuItems = await page.locator('a[href*="/dashboard"], a[href*="/trades"], a[href*="/strategies"]').count();
      const mobileMenuButton = await page.locator('button[aria-label*="menu"], .menu-button, button:has-text("Menu")').count();
      const topNavigation = await page.locator('header, .header, [class*="topnav"]').count();
      
      // Check specific navigation links
      const dashboardLink = await page.locator('a[href="/dashboard"]').count();
      const tradesLink = await page.locator('a[href="/trades"]').count();
      const strategiesLink = await page.locator('a[href="/strategies"]').count();
      const loginLink = await page.locator('a[href="/login"]').count();
      const registerLink = await page.locator('a[href="/register"]').count();
      
      diagnosticResults.navigationDiagnostics = {
        hasSidebar: sidebar > 0,
        hasTopNavigation: topNavigation > 0,
        hasMenuItems: menuItems > 0,
        hasMobileMenu: mobileMenuButton > 0,
        hasDashboardLink: dashboardLink > 0,
        hasTradesLink: tradesLink > 0,
        hasStrategiesLink: strategiesLink > 0,
        hasLoginLink: loginLink > 0,
        hasRegisterLink: registerLink > 0,
        totalNavigationLinks: menuItems,
        success: menuItems > 0
      };
      
      console.log(`  Sidebar: ${sidebar > 0}`);
      console.log(`  Top navigation: ${topNavigation > 0}`);
      console.log(`  Menu items: ${menuItems}`);
      console.log(`  Mobile menu: ${mobileMenuButton > 0}`);
      console.log(`  Dashboard link: ${dashboardLink > 0}`);
      console.log(`  Trades link: ${tradesLink > 0}`);
      console.log(`  Strategies link: ${strategiesLink > 0}`);
      
    } catch (error) {
      diagnosticResults.navigationDiagnostics = {
        hasError: true,
        error: error.message,
        success: false
      };
      
      diagnosticResults.errorAnalysis.push({
        component: 'Navigation',
        error: error.message,
        type: error.name
      });
      
      console.log(`  ❌ Navigation diagnostic error: ${error.message}`);
    }

    // Test 4: Component Rendering Diagnostics
    console.log('\n🔍 Test 4: Component Rendering Diagnostics');
    
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Check for common components
      const buttons = await page.locator('button').count();
      const cards = await page.locator('.card, [class*="card"]').count();
      const forms = await page.locator('form').count();
      const inputs = await page.locator('input').count();
      const tables = await page.locator('table').count();
      const charts = await page.locator('[class*="chart"], canvas').count();
      const loadingIndicators = await page.locator('[class*="loading"], .spinner').count();
      
      // Check for React components
      const reactRoots = await page.locator('[data-reactroot], [data-react-hm]').count();
      
      // Check for specific dashboard components
      const statsCards = await page.locator('[class*="stat"], [class*="metric"]').count();
      const tradeLists = await page.locator('[class*="trade"], [class*="table"]').count();
      
      diagnosticResults.componentDiagnostics = {
        hasButtons: buttons > 0,
        hasCards: cards > 0,
        hasForms: forms > 0,
        hasInputs: inputs > 0,
        hasTables: tables > 0,
        hasCharts: charts > 0,
        hasLoadingIndicators: loadingIndicators > 0,
        hasReactRoots: reactRoots > 0,
        hasStatsCards: statsCards > 0,
        hasTradeLists: tradeLists > 0,
        totalComponents: buttons + cards + forms + inputs + tables + charts,
        success: buttons > 0 && cards > 0
      };
      
      console.log(`  Buttons: ${buttons}`);
      console.log(`  Cards: ${cards}`);
      console.log(`  Forms: ${forms}`);
      console.log(`  Inputs: ${inputs}`);
      console.log(`  Tables: ${tables}`);
      console.log(`  Charts: ${charts}`);
      console.log(`  Loading indicators: ${loadingIndicators}`);
      console.log(`  React roots: ${reactRoots}`);
      console.log(`  Stats cards: ${statsCards}`);
      console.log(`  Trade lists: ${tradeLists}`);
      
    } catch (error) {
      diagnosticResults.componentDiagnostics = {
        hasError: true,
        error: error.message,
        success: false
      };
      
      diagnosticResults.errorAnalysis.push({
        component: 'Components',
        error: error.message,
        type: error.name
      });
      
      console.log(`  ❌ Component diagnostic error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Critical diagnostic error:', error);
    diagnosticResults.errorAnalysis.push({
      component: 'Diagnostic',
      error: error.message,
      type: error.name,
      critical: true
    });
  } finally {
    await browser.close();
  }

  // Save diagnostic results
  const resultsPath = `verotradesvip/focused-diagnostic-results-${Date.now()}.json`;
  fs.writeFileSync(resultsPath, JSON.stringify(diagnosticResults, null, 2));
  
  // Generate diagnostic report
  console.log('\n🔍 FOCUSED DIAGNOSTIC RESULTS');
  console.log('===============================');
  
  // Page loading summary
  console.log('\n📄 Page Loading Summary:');
  Object.entries(diagnosticResults.pageLoadDiagnostics).forEach(([page, results]) => {
    console.log(`  ${page}: ${results.success ? '✅' : '❌'} ${results.error || `Status: ${results.responseStatus || 'Unknown'}`}`);
  });
  
  // Authentication summary
  console.log('\n🔐 Authentication Summary:');
  console.log(`  Login form: ${diagnosticResults.authenticationDiagnostics.success ? '✅' : '❌'}`);
  
  // Navigation summary
  console.log('\n🧭 Navigation Summary:');
  console.log(`  Navigation: ${diagnosticResults.navigationDiagnostics.success ? '✅' : '❌'}`);
  
  // Component summary
  console.log('\n🧩 Component Summary:');
  console.log(`  Components: ${diagnosticResults.componentDiagnostics.success ? '✅' : '❌'}`);
  
  // Error analysis
  if (diagnosticResults.errorAnalysis.length > 0) {
    console.log('\n🚨 Error Analysis:');
    diagnosticResults.errorAnalysis.forEach((error, index) => {
      console.log(`${index + 1}. ${error.component || error.page}: ${error.error}`);
    });
  }
  
  console.log(`\n📄 Detailed diagnostic results saved to: ${resultsPath}`);
  
  return diagnosticResults;
}

// Run the diagnostic test
runFocusedDiagnosticTest().catch(console.error);