/**
 * Simple Confluence Page Verification Test
 * 
 * Focused test to verify confluence page loads without React Hook errors
 * after the AuthGuard fix implementation.
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
  headless: false
};

// Test results
const testResults = {
  pageLoad: { status: 'pending', details: [] },
  authentication: { status: 'pending', details: [] },
  consoleErrors: { status: 'pending', details: [] },
  reactHooks: { status: 'pending', details: [] },
  componentRendering: { status: 'pending', details: [] }
};

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

async function runSimpleVerification() {
  log('MAIN', 'Starting simple confluence page verification...');
  
  // Ensure screenshot directory exists
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }

  let browser;
  let page;
  const consoleMessages = [];

  try {
    // Launch browser
    log('BROWSER', 'Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultTimeout(CONFIG.timeout);

    // Console monitoring
    page.on('console', (msg) => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      consoleMessages.push(message);
      
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

    page.on('pageerror', (error) => {
      log('PAGE_ERROR', `Page error: ${error.message}`, 'error');
      testResults.consoleErrors.details.push(`Page error: ${error.message}`);
    });

    // Test 1: Navigate to confluence page
    log('TEST_1', 'Navigating to confluence page...');
    try {
      await page.goto(`${CONFIG.baseUrl}${CONFIG.confluencePath}`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });
      
      await sleep(5000); // Allow page to fully load
      
      // Take screenshot
      const screenshotPath = path.join(CONFIG.screenshotDir, `confluence-page-${Date.now()}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true
      });
      log('SCREENSHOT', `Screenshot saved: ${screenshotPath}`);
      
      // Check current URL
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/login');
      const isOnConfluencePage = currentUrl.includes('/confluence');
      
      log('NAVIGATION', `Current URL: ${currentUrl}`);
      log('NAVIGATION', `Is on login page: ${isOnLoginPage}`);
      log('NAVIGATION', `Is on confluence page: ${isOnConfluencePage}`);
      
      if (isOnLoginPage) {
        log('AUTHENTICATION', '✅ Correctly redirected to login when not authenticated', 'success');
        testResults.authentication.details.push('✅ Correctly redirected to login when not authenticated');
        testResults.authentication.status = 'passed';
      } else if (isOnConfluencePage) {
        log('AUTHENTICATION', '⚠️ Still on confluence page - checking content...', 'warning');
        testResults.authentication.details.push('⚠️ Still on confluence page - checking content');
        
        // Test component rendering if we're on confluence page
        await testComponentRendering(page);
      } else {
        log('AUTHENTICATION', '❌ Unexpected redirect', 'error');
        testResults.authentication.details.push('❌ Unexpected redirect');
        testResults.authentication.status = 'failed';
      }
      
      testResults.pageLoad.status = 'passed';
      testResults.pageLoad.details.push('✅ Page loaded successfully');
      
    } catch (error) {
      log('TEST_1', `Failed to navigate to confluence page: ${error.message}`, 'error');
      testResults.pageLoad.status = 'failed';
      testResults.pageLoad.details.push(`Navigation failed: ${error.message}`);
    }

    // Test 2: Try to login and access confluence
    log('TEST_2', 'Attempting to login and access confluence...');
    try {
      // Navigate to login page
      await page.goto(`${CONFIG.baseUrl}/login`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });
      
      await sleep(3000);
      
      // Try to find and fill login form
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      if (emailInput && passwordInput && submitButton) {
        log('LOGIN', 'Login form found, attempting login...');
        
        // Use test credentials
        await page.type('input[type="email"], input[name="email"]', 'test@example.com');
        await page.type('input[type="password"], input[name="password"]', 'testpassword123');
        await sleep(1000);
        
        await submitButton.click();
        await sleep(5000); // Wait for login to complete
        
        // Try to access confluence page
        await page.goto(`${CONFIG.baseUrl}${CONFIG.confluencePath}`, {
          waitUntil: 'networkidle2',
          timeout: CONFIG.timeout
        });
        
        await sleep(5000);
        
        const currentUrl = page.url();
        const isOnConfluencePage = currentUrl.includes('/confluence');
        
        if (isOnConfluencePage) {
          log('AUTHENTICATION', '✅ Successfully accessed confluence page after login', 'success');
          testResults.authentication.details.push('✅ Successfully accessed confluence page after login');
          testResults.authentication.status = 'passed';
          
          // Test component rendering
          await testComponentRendering(page);
        } else {
          log('AUTHENTICATION', '❌ Failed to access confluence page after login', 'error');
          testResults.authentication.details.push('❌ Failed to access confluence page after login');
          testResults.authentication.status = 'failed';
        }
        
      } else {
        log('LOGIN', '❌ Login form not found', 'error');
        testResults.authentication.details.push('❌ Login form not found');
        testResults.authentication.status = 'failed';
      }
      
    } catch (error) {
      log('TEST_2', `Login test failed: ${error.message}`, 'error');
      testResults.authentication.status = 'failed';
      testResults.authentication.details.push(`Login test failed: ${error.message}`);
    }

  } catch (error) {
    log('MAIN', `Test execution failed: ${error.message}`, 'error');
  } finally {
    if (page) {
      const finalScreenshotPath = path.join(CONFIG.screenshotDir, `final-state-${Date.now()}.png`);
      await page.screenshot({ 
        path: finalScreenshotPath, 
        fullPage: true
      });
    }
    if (browser) {
      await browser.close();
    }
  }

  // Analyze console errors
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

  // Generate report
  generateReport(consoleMessages);
}

async function testComponentRendering(page) {
  log('COMPONENT_TEST', 'Testing component rendering...');
  
  try {
    // Check for key components
    const hasHeader = await page.$('h1');
    const hasConfluenceTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    
    const hasStatisticsCards = await page.$$('[class*="card"], [class*="stat"]');
    const hasEmotionRadar = await page.$('[class*="emotion"], [class*="radar"], svg');
    const hasFilterSection = await page.$('[class*="filter"]');
    const hasTradesTable = await page.$('table');
    
    log('COMPONENT_TEST', `Header found: ${!!hasHeader}`);
    log('COMPONENT_TEST', `Confluence title: ${hasConfluenceTitle}`);
    log('COMPONENT_TEST', `Statistics cards: ${hasStatisticsCards.length}`);
    log('COMPONENT_TEST', `Emotion radar found: ${!!hasEmotionRadar}`);
    log('COMPONENT_TEST', `Filter section found: ${!!hasFilterSection}`);
    log('COMPONENT_TEST', `Trades table found: ${!!hasTradesTable}`);
    
    // Check for specific confluence page elements
    const hasConfluenceContent = hasConfluenceTitle && 
                               hasConfluenceTitle.includes('Confluence');
    
    if (hasConfluenceContent) {
      log('COMPONENT_TEST', '✅ Confluence page content loaded correctly', 'success');
      testResults.componentRendering.details.push('✅ Confluence page content loaded correctly');
      testResults.componentRendering.status = 'passed';
    } else {
      log('COMPONENT_TEST', '❌ Confluence page content not found', 'error');
      testResults.componentRendering.details.push('❌ Confluence page content not found');
      testResults.componentRendering.status = 'failed';
    }
    
  } catch (error) {
    log('COMPONENT_TEST', `Component rendering test failed: ${error.message}`, 'error');
    testResults.componentRendering.status = 'failed';
    testResults.componentRendering.details.push(`Component rendering test failed: ${error.message}`);
  }
}

function generateReport(consoleMessages) {
  log('REPORT', 'Generating verification report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      overallStatus: Object.values(testResults).every(result => result.status === 'passed' || result.status === 'pending') ? 'PASSED' : 'FAILED',
      totalTests: Object.keys(testResults).length,
      passedTests: Object.values(testResults).filter(result => result.status === 'passed').length,
      failedTests: Object.values(testResults).filter(result => result.status === 'failed').length
    },
    testResults: testResults,
    consoleAnalysis: {
      totalMessages: consoleMessages.length,
      errorCount: consoleMessages.filter(msg => msg.type === 'error').length,
      reactHookErrors: consoleMessages.filter(msg => 
        msg.text.includes('Invalid hook call') || 
        msg.text.includes('React Hook') ||
        msg.text.includes('infinite loop')
      ).length,
      authGuardMessages: consoleMessages.filter(msg => 
        msg.text.includes('AUTH_GUARD_DEBUG')
      ).length
    }
  };
  
  // Save report to file
  const reportPath = path.join(CONFIG.screenshotDir, `confluence-verification-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 CONFLUENCE PAGE VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Overall Status: ${report.summary.overallStatus}`);
  console.log(`Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
  console.log(`Console Errors: ${report.consoleAnalysis.errorCount}`);
  console.log(`React Hook Errors: ${report.consoleAnalysis.reactHookErrors}`);
  console.log(`AuthGuard Messages: ${report.consoleAnalysis.authGuardMessages}`);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('='.repeat(80));
  
  return report;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run verification
if (require.main === module) {
  runSimpleVerification().catch(error => {
    log('MAIN', `Verification failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runSimpleVerification, CONFIG };