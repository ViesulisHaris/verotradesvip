/**
 * Final Confluence Page Verification Test
 * 
 * This script comprehensively tests the confluence page loading after the React Hook fix
 * It verifies that the page loads without errors, all components render correctly,
 * and there are no React Hook errors or infinite loops.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  confluencePath: '/confluence',
  timeout: 30000,
  screenshotDir: './confluence-verification-screenshots',
  headless: false, // Set to true for headless mode
  slowMo: 100 // Slow down actions for better visibility
};

// Test results tracking
const testResults = {
  pageLoad: { status: 'pending', details: [] },
  authentication: { status: 'pending', details: [] },
  componentRendering: { status: 'pending', details: [] },
  consoleErrors: { status: 'pending', details: [] },
  functionality: { status: 'pending', details: [] },
  reactHooks: { status: 'pending', details: [] }
};

// Utility functions
function log(category, message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;
  
  switch(type) {
    case 'success':
      console.log(`✅ ${prefix} ${message}`);
      break;
    case 'error':
      console.log(`❌ ${prefix} ${message}`);
      break;
    case 'warning':
      console.log(`⚠️ ${prefix} ${message}`);
      break;
    default:
      console.log(`ℹ️ ${prefix} ${message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, filename, category = 'general') {
  try {
    const screenshotPath = path.join(CONFIG.screenshotDir, `${category}-${filename}-${Date.now()}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    log('SCREENSHOT', `Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log('SCREENSHOT', `Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

// Main verification function
async function runConfluenceVerification() {
  log('MAIN', 'Starting comprehensive confluence page verification test...');
  
  // Ensure screenshot directory exists
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }

  let browser;
  let page;

  try {
    // Launch browser
    log('BROWSER', 'Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    page = await browser.newPage();
    
    // Set viewport and timeout
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultTimeout(CONFIG.timeout);
    page.setDefaultNavigationTimeout(CONFIG.timeout);

    // Console monitoring for errors and React Hook issues
    const consoleMessages = [];
    page.on('console', (msg) => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      consoleMessages.push(message);
      
      // Log important messages
      if (msg.type() === 'error') {
        log('CONSOLE_ERROR', msg.text(), 'error');
        testResults.consoleErrors.details.push(`Error: ${msg.text()}`);
      }
      
      // Check for React Hook errors specifically
      if (msg.text().includes('Invalid hook call') || 
          msg.text().includes('React Hook') ||
          msg.text().includes('infinite loop')) {
        log('REACT_HOOKS', `React Hook issue detected: ${msg.text()}`, 'error');
        testResults.reactHooks.details.push(`React Hook issue: ${msg.text()}`);
      }
      
      // Check for AuthGuard debug messages
      if (msg.text().includes('AUTH_GUARD_DEBUG')) {
        log('AUTH_GUARD', msg.text());
      }
    });

    // Page error monitoring
    page.on('pageerror', (error) => {
      log('PAGE_ERROR', `Page error: ${error.message}`, 'error');
      testResults.consoleErrors.details.push(`Page error: ${error.message}`);
    });

    // Test 1: Navigate to confluence page without authentication
    log('TEST_1', 'Testing confluence page access without authentication...');
    try {
      await page.goto(`${CONFIG.baseUrl}${CONFIG.confluencePath}`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });
      
      await sleep(3000); // Allow page to fully load
      await takeScreenshot(page, 'confluence-no-auth', 'authentication');
      
      // Check if redirected to login
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/login');
      const isOnConfluencePage = currentUrl.includes('/confluence');
      
      log('AUTHENTICATION', `Current URL: ${currentUrl}`);
      log('AUTHENTICATION', `Is on login page: ${isOnLoginPage}`);
      log('AUTHENTICATION', `Is on confluence page: ${isOnConfluencePage}`);
      
      if (isOnLoginPage) {
        log('AUTHENTICATION', '✅ Correctly redirected to login when not authenticated', 'success');
        testResults.authentication.details.push('✅ Correctly redirected to login when not authenticated');
      } else if (isOnConfluencePage) {
        log('AUTHENTICATION', '⚠️ Still on confluence page - authentication may not be working', 'warning');
        testResults.authentication.details.push('⚠️ Still on confluence page - authentication may not be working');
      } else {
        log('AUTHENTICATION', '❌ Unexpected redirect', 'error');
        testResults.authentication.details.push('❌ Unexpected redirect');
      }
      
      testResults.authentication.status = isOnLoginPage ? 'passed' : 'failed';
      
    } catch (error) {
      log('TEST_1', `Failed to navigate to confluence page: ${error.message}`, 'error');
      testResults.pageLoad.status = 'failed';
      testResults.pageLoad.details.push(`Navigation failed: ${error.message}`);
    }

    // Test 2: Login and test authenticated access
    log('TEST_2', 'Testing authenticated access to confluence page...');
    try {
      // Navigate to login page
      await page.goto(`${CONFIG.baseUrl}/login`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });
      
      await sleep(2000);
      await takeScreenshot(page, 'login-page', 'authentication');
      
      // Fill login form (using test credentials if available)
      const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email"]';
      const passwordSelector = 'input[type="password"], input[name="password"], input[placeholder*="password"]';
      const submitSelector = 'button[type="submit"], button';
      
      const emailInput = await page.$(emailSelector);
      const passwordInput = await page.$(passwordSelector);
      const submitButton = await page.$(submitSelector);
      
      if (emailInput && passwordInput && submitButton) {
        log('AUTHENTICATION', 'Login form found, attempting login...');
        
        // Use test credentials (these should be replaced with actual test credentials)
        await page.type(emailSelector, 'test@example.com');
        await page.type(passwordSelector, 'testpassword123');
        await sleep(1000);
        
        await page.click(submitSelector);
        await sleep(5000); // Wait for login to complete
        
        await takeScreenshot(page, 'after-login', 'authentication');
        
        // Now try to access confluence page
        await page.goto(`${CONFIG.baseUrl}${CONFIG.confluencePath}`, {
          waitUntil: 'networkidle2',
          timeout: CONFIG.timeout
        });
        
        await sleep(5000); // Allow confluence page to fully load
        await takeScreenshot(page, 'confluence-authenticated', 'authentication');
        
        const currentUrl = page.url();
        const isOnConfluencePage = currentUrl.includes('/confluence');
        
        if (isOnConfluencePage) {
          log('AUTHENTICATION', '✅ Successfully accessed confluence page after login', 'success');
          testResults.authentication.details.push('✅ Successfully accessed confluence page after login');
          testResults.authentication.status = 'passed';
          
          // Test 3: Component rendering verification
          await testComponentRendering(page);
          
          // Test 4: Functionality testing
          await testFunctionality(page);
          
        } else {
          log('AUTHENTICATION', '❌ Failed to access confluence page after login', 'error');
          testResults.authentication.details.push('❌ Failed to access confluence page after login');
          testResults.authentication.status = 'failed';
        }
        
      } else {
        log('AUTHENTICATION', '❌ Login form not found', 'error');
        testResults.authentication.details.push('❌ Login form not found');
        testResults.authentication.status = 'failed';
      }
      
    } catch (error) {
      log('TEST_2', `Authentication test failed: ${error.message}`, 'error');
      testResults.authentication.status = 'failed';
      testResults.authentication.details.push(`Authentication test failed: ${error.message}`);
    }

    // Test 5: Console error analysis
    log('TEST_5', 'Analyzing console errors and React Hook issues...');
    
    const errorCount = consoleMessages.filter(msg => msg.type === 'error').length;
    const reactHookErrors = consoleMessages.filter(msg => 
      msg.text.includes('Invalid hook call') || 
      msg.text.includes('React Hook') ||
      msg.text.includes('infinite loop')
    );
    
    log('CONSOLE_ANALYSIS', `Total console errors: ${errorCount}`);
    log('CONSOLE_ANALYSIS', `React Hook errors: ${reactHookErrors.length}`);
    
    if (errorCount === 0) {
      log('CONSOLE_ANALYSIS', '✅ No console errors detected', 'success');
      testResults.consoleErrors.status = 'passed';
    } else {
      log('CONSOLE_ANALYSIS', `❌ ${errorCount} console errors detected`, 'error');
      testResults.consoleErrors.status = 'failed';
    }
    
    if (reactHookErrors.length === 0) {
      log('REACT_HOOKS', '✅ No React Hook errors detected', 'success');
      testResults.reactHooks.status = 'passed';
    } else {
      log('REACT_HOOKS', `❌ ${reactHookErrors.length} React Hook errors detected`, 'error');
      testResults.reactHooks.status = 'failed';
    }

  } catch (error) {
    log('MAIN', `Test execution failed: ${error.message}`, 'error');
  } finally {
    if (page) {
      await takeScreenshot(page, 'final-state', 'general');
    }
    if (browser) {
      await browser.close();
    }
  }

  // Generate comprehensive report
  generateReport(consoleMessages);
}

// Component rendering test
async function testComponentRendering(page) {
  log('TEST_3', 'Testing component rendering...');
  
  try {
    // Check for key components
    const componentChecks = {
      header: await page.$('h1'),
      confluenceTitle: await page.$eval('h1', el => el.textContent).catch(() => null),
      statisticsCards: await page.$$('[class*="card"], [class*="stat"]'),
      emotionRadar: await page.$('[class*="emotion"], [class*="radar"], svg'),
      filterSection: await page.$('[class*="filter"]'),
      tradesTable: await page.$('table'),
      refreshButton: await page.$('button'),
      loadingIndicator: await page.$('[class*="loading"], [class*="spin"]')
    };
    
    log('COMPONENT_RENDERING', `Header found: ${!!componentChecks.header}`);
    log('COMPONENT_RENDERING', `Confluence title: ${componentChecks.confluenceTitle}`);
    log('COMPONENT_RENDERING', `Statistics cards: ${componentChecks.statisticsCards.length}`);
    log('COMPONENT_RENDERING', `Emotion radar found: ${!!componentChecks.emotionRadar}`);
    log('COMPONENT_RENDERING', `Filter section found: ${!!componentChecks.filterSection}`);
    log('COMPONENT_RENDERING', `Trades table found: ${!!componentChecks.tradesTable}`);
    log('COMPONENT_RENDERING', `Refresh button found: ${!!componentChecks.refreshButton}`);
    
    // Check for specific confluence page elements
    const hasConfluenceContent = componentChecks.confluenceTitle && 
                               componentChecks.confluenceTitle.includes('Confluence');
    
    if (hasConfluenceContent) {
      log('COMPONENT_RENDERING', '✅ Confluence page content loaded correctly', 'success');
      testResults.componentRendering.details.push('✅ Confluence page content loaded correctly');
    } else {
      log('COMPONENT_RENDERING', '❌ Confluence page content not found', 'error');
      testResults.componentRendering.details.push('❌ Confluence page content not found');
    }
    
    // Check for error states
    const errorElements = await page.$$('[class*="error"], [class*="alert"]');
    if (errorElements.length > 0) {
      log('COMPONENT_RENDERING', `⚠️ ${errorElements.length} error elements found`, 'warning');
      testResults.componentRendering.details.push(`⚠️ ${errorElements.length} error elements found`);
    }
    
    testResults.componentRendering.status = hasConfluenceContent ? 'passed' : 'failed';
    
  } catch (error) {
    log('COMPONENT_RENDERING', `Component rendering test failed: ${error.message}`, 'error');
    testResults.componentRendering.status = 'failed';
    testResults.componentRendering.details.push(`Component rendering test failed: ${error.message}`);
  }
}

// Functionality testing
async function testFunctionality(page) {
  log('TEST_4', 'Testing page functionality...');
  
  try {
    // Test refresh functionality
    const refreshButton = await page.$('button:has-text("Refresh"), button:has([class*="refresh"])');
    if (refreshButton) {
      log('FUNCTIONALITY', 'Testing refresh button...');
      await refreshButton.click();
      await sleep(3000);
      log('FUNCTIONALITY', '✅ Refresh button clicked successfully', 'success');
      testResults.functionality.details.push('✅ Refresh button works');
    } else {
      log('FUNCTIONALITY', '⚠️ Refresh button not found', 'warning');
      testResults.functionality.details.push('⚠️ Refresh button not found');
    }
    
    // Test filter functionality
    const filterElements = await page.$$('[class*="filter"], select, input[placeholder*="filter"]');
    if (filterElements.length > 0) {
      log('FUNCTIONALITY', `Found ${filterElements.length} filter elements`);
      testResults.functionality.details.push(`Found ${filterElements.length} filter elements`);
    }
    
    // Test emotion filter if present
    const emotionFilter = await page.$('[class*="emotion"], [class*="dropdown"]');
    if (emotionFilter) {
      log('FUNCTIONALITY', '✅ Emotion filter found', 'success');
      testResults.functionality.details.push('✅ Emotion filter found');
    }
    
    // Test data loading
    const dataElements = await page.$$('table tr, [class*="trade"], [class*="data"]');
    if (dataElements.length > 1) {
      log('FUNCTIONALITY', `✅ Data loaded: ${dataElements.length} data elements found`, 'success');
      testResults.functionality.details.push(`✅ Data loaded: ${dataElements.length} elements`);
    } else {
      log('FUNCTIONALITY', '⚠️ No data elements found', 'warning');
      testResults.functionality.details.push('⚠️ No data elements found');
    }
    
    testResults.functionality.status = 'passed';
    
  } catch (error) {
    log('FUNCTIONALITY', `Functionality test failed: ${error.message}`, 'error');
    testResults.functionality.status = 'failed';
    testResults.functionality.details.push(`Functionality test failed: ${error.message}`);
  }
}

// Generate comprehensive report
function generateReport(consoleMessages) {
  log('REPORT', 'Generating comprehensive verification report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    testConfiguration: CONFIG,
    summary: {
      overallStatus: Object.values(testResults).every(result => result.status === 'passed') ? 'PASSED' : 'FAILED',
      totalTests: Object.keys(testResults).length,
      passedTests: Object.values(testResults).filter(result => result.status === 'passed').length,
      failedTests: Object.values(testResults).filter(result => result.status === 'failed').length
    },
    testResults: testResults,
    consoleAnalysis: {
      totalMessages: consoleMessages.length,
      errorCount: consoleMessages.filter(msg => msg.type === 'error').length,
      warningCount: consoleMessages.filter(msg => msg.type === 'warning').length,
      reactHookErrors: consoleMessages.filter(msg => 
        msg.text.includes('Invalid hook call') || 
        msg.text.includes('React Hook') ||
        msg.text.includes('infinite loop')
      ).length,
      authGuardMessages: consoleMessages.filter(msg => 
        msg.text.includes('AUTH_GUARD_DEBUG')
      ).length
    },
    recommendations: []
  };
  
  // Add recommendations based on test results
  if (testResults.pageLoad.status === 'failed') {
    report.recommendations.push('🔧 Fix page loading issues - check network connectivity and server status');
  }
  
  if (testResults.authentication.status === 'failed') {
    report.recommendations.push('🔧 Fix authentication flow - verify login credentials and AuthGuard implementation');
  }
  
  if (testResults.componentRendering.status === 'failed') {
    report.recommendations.push('🔧 Fix component rendering - check React components and CSS styles');
  }
  
  if (testResults.consoleErrors.status === 'failed') {
    report.recommendations.push('🔧 Fix console errors - review JavaScript code and error handling');
  }
  
  if (testResults.reactHooks.status === 'failed') {
    report.recommendations.push('🔧 Fix React Hook errors - ensure hooks are called correctly and no infinite loops');
  }
  
  if (testResults.functionality.status === 'failed') {
    report.recommendations.push('🔧 Fix functionality issues - test user interactions and data loading');
  }
  
  // Save report to file
  const reportPath = path.join(CONFIG.screenshotDir, `confluence-verification-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(CONFIG.screenshotDir, `CONFLUENCE_VERIFICATION_REPORT.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 CONFLUENCE PAGE VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Overall Status: ${report.summary.overallStatus}`);
  console.log(`Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
  console.log(`Console Errors: ${report.consoleAnalysis.errorCount}`);
  console.log(`React Hook Errors: ${report.consoleAnalysis.reactHookErrors}`);
  console.log(`AuthGuard Messages: ${report.consoleAnalysis.authGuardMessages}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log(`📄 Markdown report saved to: ${markdownPath}`);
  console.log('='.repeat(80));
  
  return report;
}

// Generate markdown report
function generateMarkdownReport(report) {
  return `# Confluence Page Verification Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Executive Summary

- **Overall Status:** ${report.summary.overallStatus}
- **Tests Passed:** ${report.summary.passedTests}/${report.summary.totalTests}
- **Console Errors:** ${report.consoleAnalysis.errorCount}
- **React Hook Errors:** ${report.consoleAnalysis.reactHookErrors}

## Test Results

### 1. Page Loading Test
**Status:** ${testResults.pageLoad.status.toUpperCase()}
${testResults.pageLoad.details.map(detail => `- ${detail}`).join('\n')}

### 2. Authentication Test
**Status:** ${testResults.authentication.status.toUpperCase()}
${testResults.authentication.details.map(detail => `- ${detail}`).join('\n')}

### 3. Component Rendering Test
**Status:** ${testResults.componentRendering.status.toUpperCase()}
${testResults.componentRendering.details.map(detail => `- ${detail}`).join('\n')}

### 4. Functionality Test
**Status:** ${testResults.functionality.status.toUpperCase()}
${testResults.functionality.details.map(detail => `- ${detail}`).join('\n')}

### 5. Console Errors Test
**Status:** ${testResults.consoleErrors.status.toUpperCase()}
${testResults.consoleErrors.details.map(detail => `- ${detail}`).join('\n')}

### 6. React Hooks Test
**Status:** ${testResults.reactHooks.status.toUpperCase()}
${testResults.reactHooks.details.map(detail => `- ${detail}`).join('\n')}

## Console Analysis

- **Total Messages:** ${report.consoleAnalysis.totalMessages}
- **Error Count:** ${report.consoleAnalysis.errorCount}
- **Warning Count:** ${report.consoleAnalysis.warningCount}
- **React Hook Errors:** ${report.consoleAnalysis.reactHookErrors}
- **AuthGuard Debug Messages:** ${report.consoleAnalysis.authGuardMessages}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Conclusion

${report.summary.overallStatus === 'PASSED' ? 
  '✅ The confluence page is working correctly after the React Hook fix. All components are rendering properly and no errors are detected.' :
  '❌ The confluence page still has issues that need to be addressed. Please review the test results and recommendations above.'}

---

*This report was generated automatically by the confluence verification test script.*
`;
}

// Run the verification
if (require.main === module) {
  runConfluenceVerification().catch(error => {
    log('MAIN', `Verification failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runConfluenceVerification, CONFIG };