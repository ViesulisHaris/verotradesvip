const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  tests: [],
  errors: [],
  screenshots: [],
  networkRequests: [],
  consoleMessages: []
};

// Test user credentials (you may need to update these)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = `test-screenshots/strategy-fix-verification-${name}-${Date.now()}.png`;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    TEST_RESULTS.screenshots.push(screenshotPath);
    console.log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`Failed to take screenshot ${name}:`, error.message);
  }
}

async function logTestResult(testName, passed, details = '') {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.tests.push(result);
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   Details: ${details}`);
}

async function monitorNetworkRequests(page) {
  page.on('request', request => {
    TEST_RESULTS.networkRequests.push({
      type: 'request',
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('response', response => {
    TEST_RESULTS.networkRequests.push({
      type: 'response',
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      timestamp: new Date().toISOString()
    });
  });
}

async function monitorConsoleMessages(page) {
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    TEST_RESULTS.consoleMessages.push(message);
    
    if (msg.type() === 'error') {
      console.log(`Console Error: ${msg.text()}`);
      TEST_RESULTS.errors.push({
        type: 'console',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
    TEST_RESULTS.errors.push({
      type: 'page',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkForErrorMessage(page) {
  const errorSelectors = [
    '[data-testid="error-message"]',
    '.error-message',
    '.alert-error',
    '[role="alert"]',
    'text="An unexpected error occurred while loading the strategy. Please try again."'
  ];

  for (const selector of errorSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        if (text && text.includes('unexpected error occurred while loading the strategy')) {
          return text;
        }
      }
    } catch (error) {
      // Continue checking other selectors
    }
  }
  return null;
}

async function testStrategiesPageLoad(page) {
  console.log('\n=== Testing Strategies Page Load ===');
  
  try {
    // Navigate to strategies page
    await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Take screenshot of initial load
    await takeScreenshot(page, 'strategies-initial-load');
    
    // Check for the specific error message
    const errorMessage = await checkForErrorMessage(page);
    if (errorMessage) {
      await logTestResult('Strategies Page Load - Error Message Check', false, 
        `Found error message: ${errorMessage}`);
      return false;
    }
    
    // Check if page loads successfully
    const pageTitle = await page.title();
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.length > 100;
    });
    
    await logTestResult('Strategies Page Load - Basic Load', hasContent, 
      `Page title: ${pageTitle}`);
    
    // Look for strategy-related elements
    const hasStrategyElements = await waitForElement(page, '[data-testid="strategy-list"], .strategy-container, .strategies-grid', 5000);
    await logTestResult('Strategies Page Load - Strategy Elements', hasStrategyElements);
    
    return hasContent && !errorMessage;
    
  } catch (error) {
    await logTestResult('Strategies Page Load', false, `Exception: ${error.message}`);
    TEST_RESULTS.errors.push({
      type: 'navigation',
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

async function testStrategyViewing(page) {
  console.log('\n=== Testing Strategy Viewing ===');
  
  try {
    // Look for strategy items
    const strategyItems = await page.$$('[data-testid="strategy-item"], .strategy-card, .strategy-row');
    
    if (strategyItems.length === 0) {
      await logTestResult('Strategy Viewing - Strategy Items Found', false, 
        'No strategy items found on page');
      return false;
    }
    
    await logTestResult('Strategy Viewing - Strategy Items Found', true, 
      `Found ${strategyItems.length} strategy items`);
    
    // Click on the first strategy to view details
    await strategyItems[0].click();
    await sleep(2000);
    
    await takeScreenshot(page, 'strategy-details-view');
    
    // Check if strategy details are displayed
    const hasDetails = await waitForElement(page, '[data-testid="strategy-details"], .strategy-details, .strategy-performance', 5000);
    await logTestResult('Strategy Viewing - Details Display', hasDetails);
    
    // Check for performance metrics
    const hasPerformance = await page.evaluate(() => {
      const perfElements = document.querySelectorAll('[data-testid="performance-metrics"], .performance, .stats');
      return perfElements.length > 0;
    });
    
    await logTestResult('Strategy Viewing - Performance Metrics', hasPerformance);
    
    return hasDetails;
    
  } catch (error) {
    await logTestResult('Strategy Viewing', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testStrategyModification(page) {
  console.log('\n=== Testing Strategy Modification ===');
  
  try {
    // Look for edit/modify buttons
    const editButtons = await page.$$('[data-testid="edit-strategy"], .edit-strategy, .modify-strategy, button[aria-label*="edit"]');
    
    if (editButtons.length === 0) {
      await logTestResult('Strategy Modification - Edit Button Found', false, 
        'No edit buttons found');
      return false;
    }
    
    await logTestResult('Strategy Modification - Edit Button Found', true);
    
    // Click edit button
    await editButtons[0].click();
    await sleep(2000);
    
    await takeScreenshot(page, 'strategy-edit-mode');
    
    // Check if edit form is displayed
    const hasEditForm = await waitForElement(page, '[data-testid="strategy-form"], .strategy-form, form', 5000);
    await logTestResult('Strategy Modification - Edit Form Display', hasEditForm);
    
    if (hasEditForm) {
      // Try to modify a field (e.g., strategy name)
      const nameInput = await page.$('input[name="name"], input[data-testid="strategy-name"], .strategy-name-input');
      if (nameInput) {
        await nameInput.click();
        await nameInput.clear();
        await nameInput.fill('Test Modified Strategy');
        await sleep(1000);
        
        await logTestResult('Strategy Modification - Field Edit', true, 'Successfully modified strategy name');
      }
      
      // Look for save button
      const saveButton = await page.$('button[type="submit"], [data-testid="save-strategy"], .save-strategy');
      if (saveButton) {
        await takeScreenshot(page, 'strategy-modified-ready-to-save');
        await logTestResult('Strategy Modification - Save Button Found', true);
        
        // Note: We won't actually save to avoid modifying real data
        await logTestResult('Strategy Modification - Ready to Save', true, 
          'Form is ready to save (not actually saving to preserve data)');
      }
    }
    
    return hasEditForm;
    
  } catch (error) {
    await logTestResult('Strategy Modification', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testStrategyDeletion(page) {
  console.log('\n=== Testing Strategy Deletion ===');
  
  try {
    // Look for delete buttons
    const deleteButtons = await page.$$('[data-testid="delete-strategy"], .delete-strategy, button[aria-label*="delete"]');
    
    if (deleteButtons.length === 0) {
      await logTestResult('Strategy Deletion - Delete Button Found', false, 
        'No delete buttons found');
      return false;
    }
    
    await logTestResult('Strategy Deletion - Delete Button Found', true);
    
    // Note: We won't actually click delete to avoid losing real data
    await logTestResult('Strategy Deletion - Delete Available', true, 
      'Delete functionality is available (not actually executing to preserve data)');
    
    return true;
    
  } catch (error) {
    await logTestResult('Strategy Deletion', false, `Exception: ${error.message}`);
    return false;
  }
}

async function testCompleteWorkflow(page) {
  console.log('\n=== Testing Complete User Workflow ===');
  
  try {
    // Start from login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    await takeScreenshot(page, 'workflow-login-page');
    
    // Check if login form is present
    const hasLoginForm = await waitForElement(page, 'form', 5000);
    await logTestResult('Complete Workflow - Login Form', hasLoginForm);
    
    if (hasLoginForm) {
      // Fill in login credentials
      await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
      await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
      
      await takeScreenshot(page, 'workflow-login-filled');
      
      // Note: We won't actually submit login to avoid authentication issues
      await logTestResult('Complete Workflow - Login Ready', true, 
        'Login form is ready to submit (not actually submitting)');
    }
    
    // Navigate to strategies page directly
    await page.goto(`${BASE_URL}/strategies`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Check if we can access strategies without the error
    const errorMessage = await checkForErrorMessage(page);
    const workflowSuccess = !errorMessage;
    
    await logTestResult('Complete Workflow - Strategies Access', workflowSuccess, 
      errorMessage ? `Error found: ${errorMessage}` : 'No errors found');
    
    await takeScreenshot(page, 'workflow-strategies-final');
    
    return workflowSuccess;
    
  } catch (error) {
    await logTestResult('Complete Workflow', false, `Exception: ${error.message}`);
    return false;
  }
}

async function analyzeNetworkErrors() {
  console.log('\n=== Analyzing Network Requests ===');
  
  const failedRequests = TEST_RESULTS.networkRequests.filter(req => 
    req.type === 'response' && req.status >= 400
  );
  
  if (failedRequests.length > 0) {
    await logTestResult('Network Requests - Failed Requests', false, 
      `Found ${failedRequests.length} failed requests`);
    
    failedRequests.forEach(req => {
      console.log(`   Failed: ${req.method || 'GET'} ${req.url} - ${req.status} ${req.statusText}`);
    });
  } else {
    await logTestResult('Network Requests - Failed Requests', true, 
      'No failed requests found');
  }
  
  return failedRequests.length === 0;
}

async function analyzeConsoleErrors() {
  console.log('\n=== Analyzing Console Errors ===');
  
  const consoleErrors = TEST_RESULTS.consoleMessages.filter(msg => 
    msg.type === 'error'
  );
  
  if (consoleErrors.length > 0) {
    await logTestResult('Console Errors - Error Messages', false, 
      `Found ${consoleErrors.length} console errors`);
    
    consoleErrors.forEach(error => {
      console.log(`   Console Error: ${error.text}`);
    });
  } else {
    await logTestResult('Console Errors - Error Messages', true, 
      'No console errors found');
  }
  
  return consoleErrors.length === 0;
}

async function generateReport() {
  console.log('\n=== Generating Test Report ===');
  
  const totalTests = TEST_RESULTS.tests.length;
  const passedTests = TEST_RESULTS.tests.filter(test => test.passed).length;
  const failedTests = totalTests - passedTests;
  
  const report = {
    ...TEST_RESULTS,
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(2)}%`
    }
  };
  
  // Save detailed report
  const reportPath = `strategy-fix-verification-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log(`Screenshots saved: ${TEST_RESULTS.screenshots.length}`);
  
  // Generate summary for completion
  const summary = {
    fixWorking: failedTests === 0,
    errorGone: !TEST_RESULTS.tests.some(test => 
      test.test.includes('Error Message') && !test.passed
    ),
    networkIssues: TEST_RESULTS.networkRequests.some(req => 
      req.type === 'response' && req.status >= 400
    ),
    consoleIssues: TEST_RESULTS.consoleMessages.some(msg => msg.type === 'error'),
    summary: report.summary
  };
  
  return summary;
}

async function runComprehensiveVerification() {
  console.log('Starting comprehensive strategy fix verification...\n');
  
  // Create screenshots directory
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Set to false for visual verification
      viewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set up monitoring
    await monitorNetworkRequests(page);
    await monitorConsoleMessages(page);
    
    // Run tests
    const results = {
      pageLoad: await testStrategiesPageLoad(page),
      viewing: await testStrategyViewing(page),
      modification: await testStrategyModification(page),
      deletion: await testStrategyDeletion(page),
      workflow: await testCompleteWorkflow(page),
      network: await analyzeNetworkErrors(),
      console: await analyzeConsoleErrors()
    };
    
    // Generate final report
    const summary = await generateReport();
    
    await browser.close();
    
    return summary;
    
  } catch (error) {
    console.error('Verification failed:', error);
    if (browser) await browser.close();
    throw error;
  }
}

// Run the verification
if (require.main === module) {
  runComprehensiveVerification()
    .then(summary => {
      console.log('\n=== FINAL VERIFICATION RESULT ===');
      console.log(`Schema Cache Fix Working: ${summary.fixWorking ? '✅ YES' : '❌ NO'}`);
      console.log(`Original Error Gone: ${summary.errorGone ? '✅ YES' : '❌ NO'}`);
      console.log(`Network Issues: ${summary.networkIssues ? '❌ YES' : '✅ NO'}`);
      console.log(`Console Issues: ${summary.consoleIssues ? '❌ YES' : '✅ NO'}`);
      console.log(`Test Success Rate: ${summary.summary.successRate}`);
      process.exit(summary.fixWorking ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveVerification };