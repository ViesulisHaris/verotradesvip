const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testApplicationFunctionality() {
  console.log('='.repeat(80));
  console.log('APPLICATION FUNCTIONALITY VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log('Testing application at http://localhost:3001');
  console.log('Purpose: Verify CSS/JS asset loading fixes and gray screen issue resolution');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Capture console logs and errors
  const consoleLogs = [];
  const networkErrors = [];
  const resourceErrors = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      resourceErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });

  const testResults = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:3001',
    tests: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    },
    assets: {
      cssLoaded: [],
      jsLoaded: [],
      css404s: [],
      js404s: []
    },
    errors: {
      consoleErrors: [],
      networkErrors: [],
      resourceErrors: []
    },
    screenshots: []
  };

  try {
    console.log('\n1. Testing initial page load...');
    
    // Navigate to the application
    const response = await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    testResults.tests.initialLoad = {
      passed: response.status() === 200,
      status: response.status(),
      statusText: response.statusText(),
      loadTime: Date.now()
    };

    // Take screenshot of initial load
    const initialScreenshot = await page.screenshot({ 
      path: 'verotradesvip/test-initial-load.png',
      fullPage: true 
    });
    testResults.screenshots.push('test-initial-load.png');

    // Wait a bit more for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n2. Checking for gray screen issue...');
    
    // Check if page has content (not just gray screen)
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const hasBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                           computedStyle.backgroundColor !== 'transparent';
      const hasContent = body.innerText.trim().length > 0;
      const hasElements = body.children.length > 0;
      
      return {
        backgroundColor: computedStyle.backgroundColor,
        hasBackground,
        hasContent,
        hasElements,
        innerTextLength: body.innerText.trim().length,
        childrenCount: body.children.length
      };
    });

    testResults.tests.grayScreenCheck = {
      passed: bodyContent.hasContent && bodyContent.hasElements,
      details: bodyContent
    };

    console.log('\n3. Analyzing CSS and JS asset loading...');
    
    // Get all loaded resources
    const resources = await page.evaluate(() => {
      const resources = [];
      
      // Check CSS files
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach(sheet => {
        if (sheet.href) {
          resources.push({
            type: 'css',
            url: sheet.href,
            loaded: true
          });
        }
      });
      
      // Check JS files
      const scripts = Array.from(document.scripts);
      scripts.forEach(script => {
        if (script.src) {
          resources.push({
            type: 'js',
            url: script.src,
            loaded: true
          });
        }
      });
      
      return resources;
    });

    // Categorize assets
    resources.forEach(resource => {
      if (resource.type === 'css') {
        testResults.assets.cssLoaded.push(resource.url);
      } else if (resource.type === 'js') {
        testResults.assets.jsLoaded.push(resource.url);
      }
    });

    // Check for 404 errors in network errors
    networkErrors.forEach(error => {
      if (error.url.includes('.css')) {
        testResults.assets.css404s.push(error);
      } else if (error.url.includes('.js')) {
        testResults.assets.js404s.push(error);
      }
    });

    testResults.tests.assetLoading = {
      passed: testResults.assets.css404s.length === 0 && testResults.assets.js404s.length === 0,
      cssLoaded: testResults.assets.cssLoaded.length,
      jsLoaded: testResults.assets.jsLoaded.length,
      css404s: testResults.assets.css404s.length,
      js404s: testResults.assets.js404s.length
    };

    console.log('\n4. Checking CSS variables...');
    
    // Check for CSS variables
    const cssVariablesCheck = await page.evaluate(() => {
      const rootElement = document.documentElement;
      const rootStyle = window.getComputedStyle(rootElement);
      const cssVariables = [];
      
      // Extract CSS custom properties
      for (let i = 0; i < rootStyle.length; i++) {
        const property = rootStyle[i];
        if (property.startsWith('--')) {
          cssVariables.push({
            property: property,
            value: rootStyle.getPropertyValue(property).trim()
          });
        }
      }
      
      return {
        hasCssVariables: cssVariables.length > 0,
        cssVariablesCount: cssVariables.length,
        cssVariables: cssVariables.slice(0, 10) // First 10 for brevity
      };
    });

    testResults.tests.cssVariables = {
      passed: cssVariablesCheck.hasCssVariables,
      details: cssVariablesCheck
    };

    console.log('\n5. Testing navigation functionality...');
    
    // Check for navigation elements
    const navigationCheck = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav, [role="navigation"], .nav, .navigation, .menu');
      const links = document.querySelectorAll('a[href]');
      const buttons = document.querySelectorAll('button, [role="button"]');
      
      return {
        hasNavElements: navElements.length > 0,
        navElementsCount: navElements.length,
        linksCount: links.length,
        buttonsCount: buttons.length,
        hasInternalLinks: Array.from(links).some(link => 
          link.href.includes('localhost') || link.href.startsWith('/')
        )
      };
    });

    testResults.tests.navigation = {
      passed: navigationCheck.hasNavElements && navigationCheck.linksCount > 0,
      details: navigationCheck
    };

    // Test navigation to different pages if possible
    try {
      console.log('\n6. Testing page navigation...');
      
      // Try to navigate to login page
      await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2', timeout: 10000 });
      const loginScreenshot = await page.screenshot({ 
        path: 'verotradesvip/test-login-page.png',
        fullPage: true 
      });
      testResults.screenshots.push('test-login-page.png');
      
      const loginPageCheck = await page.evaluate(() => {
        const hasLoginForm = document.querySelector('form') !== null;
        const hasInputFields = document.querySelectorAll('input').length > 0;
        const hasButtons = document.querySelectorAll('button').length > 0;
        
        return {
          hasLoginForm,
          hasInputFields,
          hasButtons
        };
      });
      
      testResults.tests.loginPage = {
        passed: loginPageCheck.hasLoginForm,
        details: loginPageCheck
      };

      // Try to navigate to dashboard
      await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2', timeout: 10000 });
      const dashboardScreenshot = await page.screenshot({ 
        path: 'verotradesvip/test-dashboard-page.png',
        fullPage: true 
      });
      testResults.screenshots.push('test-dashboard-page.png');
      
      const dashboardPageCheck = await page.evaluate(() => {
        const hasContent = document.body.innerText.trim().length > 0;
        const hasElements = document.body.children.length > 0;
        
        return {
          hasContent,
          hasElements
        };
      });
      
      testResults.tests.dashboardPage = {
        passed: dashboardPageCheck.hasContent,
        details: dashboardPageCheck
      };
      
    } catch (navError) {
      console.log('Navigation test error:', navError.message);
      testResults.tests.pageNavigation = {
        passed: false,
        error: navError.message
      };
    }

    console.log('\n7. Checking for ErrorBoundary issues...');
    
    // Check for ErrorBoundary related errors in console
    const errorBoundaryErrors = consoleLogs.filter(log => 
      log.type === 'error' && 
      (log.text.includes('ErrorBoundary') || log.text.includes('event handler'))
    );

    testResults.tests.errorBoundary = {
      passed: errorBoundaryErrors.length === 0,
      errorCount: errorBoundaryErrors.length,
      errors: errorBoundaryErrors
    };

    console.log('\n8. Investigating API key issues...');
    
    // Check for API key related errors
    const apiKeyErrors = consoleLogs.filter(log => 
      (log.type === 'error' || log.type === 'warn') && 
      (log.text.includes('API key') || log.text.includes('Invalid') || log.text.includes('Supabase'))
    );

    testResults.tests.apiKey = {
      passed: apiKeyErrors.length === 0,
      errorCount: apiKeyErrors.length,
      errors: apiKeyErrors
    };

    // Collect all errors
    testResults.errors.consoleErrors = consoleLogs.filter(log => log.type === 'error');
    testResults.errors.networkErrors = networkErrors;
    testResults.errors.resourceErrors = resourceErrors;

    // Calculate summary
    const allTests = Object.values(testResults.tests);
    testResults.summary.totalTests = allTests.length;
    testResults.summary.passedTests = allTests.filter(test => test.passed).length;
    testResults.summary.failedTests = allTests.filter(test => !test.passed).length;

    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passedTests}`);
    console.log(`Failed: ${testResults.summary.failedTests}`);
    console.log('\nDetailed Results:');
    
    Object.entries(testResults.tests).forEach(([testName, result]) => {
      console.log(`- ${testName}: ${result.passed ? 'PASS' : 'FAIL'}`);
      if (!result.passed && result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    console.log('\nAsset Loading Summary:');
    console.log(`- CSS Files Loaded: ${testResults.assets.cssLoaded.length}`);
    console.log(`- JS Files Loaded: ${testResults.assets.jsLoaded.length}`);
    console.log(`- CSS 404 Errors: ${testResults.assets.css404s.length}`);
    console.log(`- JS 404 Errors: ${testResults.assets.js404s.length}`);

    console.log('\nError Summary:');
    console.log(`- Console Errors: ${testResults.errors.consoleErrors.length}`);
    console.log(`- Network Errors: ${testResults.errors.networkErrors.length}`);
    console.log(`- Resource Errors: ${testResults.errors.resourceErrors.length}`);

    // Save detailed results
    const reportPath = 'verotradesvip/asset-loading-verification-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error('Test execution error:', error);
    testResults.executionError = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    await browser.close();
  }

  return testResults;
}

// Run the test
testApplicationFunctionality()
  .then(results => {
    console.log('\nTest completed successfully!');
    
    // Create a markdown report
    const markdownReport = `
# Asset Loading Verification Test Report

## Test Summary
- **Timestamp:** ${results.timestamp}
- **URL Tested:** ${results.url}
- **Total Tests:** ${results.summary.totalTests}
- **Passed:** ${results.summary.passedTests}
- **Failed:** ${results.summary.failedTests}

## Key Findings

### Gray Screen Issue
- **Status:** ${results.tests.grayScreenCheck?.passed ? 'RESOLVED' : 'NOT RESOLVED'}
- **Details:** ${JSON.stringify(results.tests.grayScreenCheck?.details, null, 2)}

### Asset Loading
- **CSS Files Loaded:** ${results.assets.cssLoaded.length}
- **JS Files Loaded:** ${results.assets.jsLoaded.length}
- **CSS 404 Errors:** ${results.assets.css404s.length}
- **JS 404 Errors:** ${results.assets.js404s.length}

### CSS Variables
- **Status:** ${results.tests.cssVariables?.passed ? 'LOADED' : 'MISSING'}
- **Variables Count:** ${results.tests.cssVariables?.details?.cssVariablesCount || 0}

### Navigation
- **Status:** ${results.tests.navigation?.passed ? 'WORKING' : 'ISSUES DETECTED'}
- **Navigation Elements:** ${results.tests.navigation?.details?.navElementsCount || 0}

### ErrorBoundary
- **Status:** ${results.tests.errorBoundary?.passed ? 'NO ERRORS' : 'ERRORS DETECTED'}
- **Error Count:** ${results.tests.errorBoundary?.errorCount || 0}

### API Key Issues
- **Status:** ${results.tests.apiKey?.passed ? 'NO ISSUES' : 'ISSUES DETECTED'}
- **Error Count:** ${results.tests.apiKey?.errorCount || 0}

## Screenshots Taken
${results.screenshots.map(screenshot => `- ${screenshot}`).join('\n')}

## Recommendations
${results.summary.failedTests > 0 ? 
  'Some tests failed. Please review the detailed report for specific issues that need to be addressed.' : 
  'All critical tests passed. The application appears to be functioning correctly.'}

## Next Steps
1. If gray screen issue is resolved, the CSS/JS asset loading fixes were successful
2. If API key errors persist, investigate Supabase configuration
3. Monitor console for any remaining errors during user testing
`;

    fs.writeFileSync('verotradesvip/ASSET_LOADING_VERIFICATION_REPORT.md', markdownReport);
    console.log('Markdown report saved to: verotradesvip/ASSET_LOADING_VERIFICATION_REPORT.md');
    
  })
  .catch(error => {
    console.error('Test failed:', error);
  });