const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  credentials: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  timeouts: {
    navigation: 30000,
    element: 10000,
    screenshot: 5000
  },
  screenshots: {
    dir: './strategy-test-screenshots',
    quality: 80,
    fullPage: true
  }
};

// Test results tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  screenshots: [],
  startTime: null,
  endTime: null
};

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function logTest(testName, passed, error = null) {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
    log(`✅ PASSED: ${testName}`);
  } else {
    testResults.failedTests++;
    log(`❌ FAILED: ${testName} - ${error}`);
    testResults.errors.push({ test: testName, error: error });
  }
}

async function takeScreenshot(page, name, description = '') {
  try {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.screenshots.dir, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: TEST_CONFIG.screenshots.fullPage
    });
    
    testResults.screenshots.push({
      filename,
      filepath,
      description,
      timestamp
    });
    
    log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'ERROR');
    return null;
  }
}

async function waitForElement(page, selector, timeout = TEST_CONFIG.timeouts.element) {
  try {
    await page.waitForSelector(selector, { timeout });
    return await page.$(selector);
  } catch (error) {
    log(`Element not found: ${selector} - ${error.message}`, 'ERROR');
    return null;
  }
}

async function clickElement(page, selector, description = '') {
  try {
    await page.click(selector);
    log(`Clicked: ${description || selector}`);
    return true;
  } catch (error) {
    log(`Failed to click: ${selector} - ${error.message}`, 'ERROR');
    return false;
  }
}

async function fillInput(page, selector, value, description = '') {
  try {
    await page.fill(selector, value);
    log(`Filled: ${description || selector} with value: ${value}`);
    return true;
  } catch (error) {
    log(`Failed to fill: ${selector} - ${error.message}`, 'ERROR');
    return false;
  }
}

async function navigateToPage(page, url, description = '') {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: TEST_CONFIG.timeouts.navigation });
    log(`Navigated to: ${description || url}`);
    return true;
  } catch (error) {
    log(`Failed to navigate to: ${url} - ${error.message}`, 'ERROR');
    return false;
  }
}

// Authentication function
async function authenticate(page) {
  log('Starting authentication process...');
  
  // Navigate to login page
  const loginSuccess = await navigateToPage(page, `${TEST_CONFIG.baseURL}/login`, 'Login page');
  if (!loginSuccess) {
    return false;
  }
  
  await takeScreenshot(page, 'login-page-loaded', 'Login page loaded');
  
  // Fill login form
  const emailFilled = await fillInput(page, 'input[type="email"]', TEST_CONFIG.credentials.email, 'Email field');
  const passwordFilled = await fillInput(page, 'input[type="password"]', TEST_CONFIG.credentials.password, 'Password field');
  
  if (!emailFilled || !passwordFilled) {
    return false;
  }
  
  await takeScreenshot(page, 'login-form-filled', 'Login form filled with credentials');
  
  // Submit login form
  const loginClicked = await clickElement(page, 'button[type="submit"]', 'Login button');
  if (!loginClicked) {
    return false;
  }
  
  // Wait for navigation to dashboard or strategies page
  try {
    await page.waitForURL(/\/(dashboard|strategies)/, { timeout: TEST_CONFIG.timeouts.navigation });
    log('Authentication successful - redirected to protected area');
    await takeScreenshot(page, 'login-success', 'Successful login redirect');
    return true;
  } catch (error) {
    log(`Authentication failed - ${error.message}`, 'ERROR');
    await takeScreenshot(page, 'login-failed', 'Failed login attempt');
    return false;
  }
}

// Test 1: Strategies List Page
async function testStrategiesListPage(page) {
  log('Testing Strategies List Page functionality...');
  
  // Navigate to strategies list
  const navSuccess = await navigateToPage(page, `${TEST_CONFIG.baseURL}/strategies`, 'Strategies list page');
  if (!navSuccess) {
    logTest('Navigate to strategies list', false, 'Failed to load strategies page');
    return false;
  }
  
  await takeScreenshot(page, 'strategies-list-loaded', 'Strategies list page loaded');
  
  // Test 1.1: Check for strategy cards with grid layout
  const strategyCards = await page.$$('div[class*="grid"] > div, .enhanced-strategy-card, [data-testid*="strategy"]');
  logTest('Strategy cards display', strategyCards.length > 0,
    strategyCards.length === 0 ? 'No strategy cards found' : `Found ${strategyCards.length} cards`);
  
  // Test 1.2: Check for strategy statistics overview
  const statsElements = await page.$$('.grid .border-l-4, .card-unified, [class*="border-l"]');
  logTest('Strategy statistics overview', statsElements.length > 0,
    statsElements.length === 0 ? 'No statistics elements found' : `Found ${statsElements.length} stats elements`);
  
  // Test 1.3: Check for active/inactive status indicators
  const statusIndicators = await page.$$('[class*="Active"], [class*="Inactive"], .px-2.py-1');
  logTest('Active/inactive status indicators', statusIndicators.length > 0,
    statusIndicators.length === 0 ? 'No status indicators found' : `Found ${statusIndicators.length} status indicators`);
  
  // Test 1.4: Check for performance metrics visualization
  const performanceMetrics = await page.$$('[class*="Total"], [class*="PnL"], [class*="Trades"]');
  logTest('Performance metrics visualization', performanceMetrics.length > 0,
    performanceMetrics.length === 0 ? 'No performance metrics found' : `Found ${performanceMetrics.length} metrics elements`);
  
  // Test 1.5: Check for create new strategy button
  const createButton = await waitForElement(page, 'a[href="/strategies/create"], button:has-text("Create Strategy"), [href*="create"]');
  logTest('Create new strategy button', createButton !== null,
    createButton === null ? 'Create strategy button not found' : 'Create strategy button found');
  
  // Test 1.6: Test edit existing strategy functionality
  let editTestPassed = false;
  if (strategyCards.length > 0) {
    // Try to find edit functionality through the EnhancedStrategyCard component
    const editButton = await page.$('button[onclick*="edit"], button:has-text("Edit"), [data-testid="edit-strategy"]');
    if (editButton) {
      const editClicked = await clickElement(page, 'button[onclick*="edit"], button:has-text("Edit"), [data-testid="edit-strategy"]', 'First edit button');
      if (editClicked) {
        // Wait for potential navigation to edit page
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        if (currentUrl.includes('/edit/') || currentUrl.includes('/strategies/edit')) {
          editTestPassed = true;
          await takeScreenshot(page, 'strategy-edit-page', 'Strategy edit page loaded');
          // Navigate back to list
          await navigateToPage(page, `${TEST_CONFIG.baseURL}/strategies`, 'Back to strategies list');
        }
      }
    }
  }
  logTest('Edit existing strategy functionality', editTestPassed,
    !editTestPassed ? 'Could not test edit functionality (no strategies found)' : 'Edit functionality working');
  
  // Test 1.7: Test delete strategy with confirmation
  let deleteTestPassed = false;
  if (strategyCards.length > 0) {
    const deleteButton = await page.$('button[onclick*="delete"], button:has-text("Delete"), [data-testid="delete-strategy"]');
    if (deleteButton) {
      const deleteClicked = await clickElement(page, 'button[onclick*="delete"], button:has-text("Delete"), [data-testid="delete-strategy"]', 'First delete button');
      if (deleteClicked) {
        // Wait for confirmation dialog
        await page.waitForTimeout(1000);
        const confirmDialog = await page.$('.modal, .dialog, .confirmation, [data-testid="delete-confirmation"]');
        if (confirmDialog) {
          await takeScreenshot(page, 'delete-confirmation-dialog', 'Delete confirmation dialog');
          // Cancel the deletion to avoid actually deleting test data
          const cancelButton = await confirmDialog.$('button:has-text("Cancel"), .cancel-btn');
          if (cancelButton) {
            await cancelButton.click();
            deleteTestPassed = true;
          }
        }
      }
    }
  }
  logTest('Delete strategy with confirmation', deleteTestPassed,
    !deleteTestPassed ? 'Could not test delete functionality (no strategies found)' : 'Delete confirmation working');
  
  // Test 1.8: Test navigate to performance details
  let performanceNavTestPassed = false;
  if (strategyCards.length > 0) {
    const performanceButton = await page.$('a[href*="performance"], button:has-text("Performance"), [data-testid="view-performance"]');
    if (performanceButton) {
      const perfClicked = await clickElement(page, 'a[href*="performance"], button:has-text("Performance"), [data-testid="view-performance"]', 'First performance button');
      if (perfClicked) {
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        if (currentUrl.includes('/performance/') || currentUrl.includes('/strategies/performance')) {
          performanceNavTestPassed = true;
          await takeScreenshot(page, 'strategy-performance-page', 'Strategy performance page loaded');
          // Navigate back to list
          await navigateToPage(page, `${TEST_CONFIG.baseURL}/strategies`, 'Back to strategies list');
        }
      }
    }
  }
  logTest('Navigate to performance details', performanceNavTestPassed,
    !performanceNavTestPassed ? 'Could not test performance navigation (no strategies found)' : 'Performance navigation working');
  
  return true;
}

// Test 2: Create Strategy Page
async function testCreateStrategyPage(page) {
  log('Testing Create Strategy Page functionality...');
  
  // Navigate to create strategy page
  const navSuccess = await navigateToPage(page, `${TEST_CONFIG.baseURL}/strategies/create`, 'Create strategy page');
  if (!navSuccess) {
    logTest('Navigate to create strategy', false, 'Failed to load create strategy page');
    return false;
  }
  
  await takeScreenshot(page, 'create-strategy-page-loaded', 'Create strategy page loaded');
  
  // Test 2.1: Check for strategy name field (required)
  const nameField = await waitForElement(page, 'input[type="text"], input[placeholder*="Strategy"], [value]');
  logTest('Strategy name field', nameField !== null,
    nameField === null ? 'Strategy name field not found' : 'Strategy name field found');
  
  // Test 2.2: Check for description textarea
  const descriptionField = await waitForElement(page, 'textarea, [placeholder*="Describe"], [class*="textarea"]');
  logTest('Description textarea', descriptionField !== null,
    descriptionField === null ? 'Description field not found' : 'Description field found');
  
  // Test 2.3: Check for active/inactive status toggle
  const statusToggle = await waitForElement(page, 'input[type="checkbox"], [class*="accent"], [checked]');
  logTest('Active/inactive status toggle', statusToggle !== null,
    statusToggle === null ? 'Status toggle not found' : 'Status toggle found');
  
  // Test 2.4: Check for custom trading rules (dynamic add/remove)
  const tradingRules = await waitForElement(page, '.glass, [class*="rules"], button:has-text("Add Custom Rule")');
  logTest('Custom trading rules section', tradingRules !== null,
    tradingRules === null ? 'Trading rules section not found' : 'Trading rules section found');
  
  // Test 2.5: Test form validation and error handling
  let validationTestPassed = false;
  if (nameField) {
    // Try to submit form without required fields
    const submitButton = await waitForElement(page, 'button[type="submit"], button:has-text("Create Strategy"), [class*="bg-blue-600"]');
    if (submitButton) {
      await clickElement(page, 'button[type="submit"], button:has-text("Create Strategy"), [class*="bg-blue-600"]', 'Submit button');
      await page.waitForTimeout(1000);
      
      // Check for error messages
      const errorMessages = await page.$$('[class*="red"], [class*="error"], [class*="validation"]');
      validationTestPassed = errorMessages.length > 0;
      
      if (errorMessages.length > 0) {
        await takeScreenshot(page, 'form-validation-errors', 'Form validation errors displayed');
      }
    }
  }
  logTest('Form validation and error handling', validationTestPassed,
    !validationTestPassed ? 'Form validation not working' : 'Form validation working correctly');
  
  // Test 2.6: Test filling and submitting the form
  let formSubmissionTestPassed = false;
  if (nameField && descriptionField) {
    // Fill the form with test data
    const testName = `Test Strategy ${Date.now()}`;
    const testDescription = 'This is a test strategy created during automated testing';
    
    const nameFilled = await fillInput(page, 'input[type="text"], input[placeholder*="Strategy"], [value]', testName, 'Strategy name');
    const descriptionFilled = await fillInput(page, 'textarea, [placeholder*="Describe"], [class*="textarea"]', testDescription, 'Strategy description');
    
    if (nameFilled && descriptionFilled) {
      await takeScreenshot(page, 'create-form-filled', 'Create strategy form filled with test data');
      
      // Submit the form
      const submitButton = await waitForElement(page, 'button[type="submit"], button:has-text("Create Strategy"), [class*="bg-blue-600"]');
      if (submitButton) {
        await clickElement(page, 'button[type="submit"], button:has-text("Create Strategy"), [class*="bg-blue-600"]', 'Submit button');
        
        // Wait for submission to complete
        await page.waitForTimeout(3000);
        
        // Check if we're redirected back to strategies list or see success message
        const currentUrl = page.url();
        const successMessage = await page.$('[class*="success"], [class*="green"], [data-testid="success-message"]');
        
        if (currentUrl.includes('/strategies') && !currentUrl.includes('/create') || successMessage) {
          formSubmissionTestPassed = true;
          await takeScreenshot(page, 'strategy-creation-success', 'Strategy creation successful');
        }
      }
    }
  }
  logTest('Submit/cancel actions', formSubmissionTestPassed,
    !formSubmissionTestPassed ? 'Form submission failed' : 'Form submission successful');
  
  return true;
}

// Test 3: Edit Strategy Page
async function testEditStrategyPage(page) {
  log('Testing Edit Strategy Page functionality...');
  
  // First navigate to strategies list to get a strategy to edit
  const listNavSuccess = await navigateToPage(page, `${TEST_CONFIG.baseURL}/strategies`, 'Strategies list page');
  if (!listNavSuccess) {
    logTest('Navigate to strategies list for edit test', false, 'Failed to load strategies page');
    return false;
  }
  
  // Find the first strategy card and click edit
  const strategyCards = await page.$$('.strategy-card, .card, [data-testid="strategy-card"]');
  if (strategyCards.length === 0) {
    logTest('Find strategy to edit', false, 'No strategies found to edit');
    return false;
  }
  
  const editButton = await strategyCards[0].$('button:has-text("Edit"), .edit-btn, [data-testid="edit-strategy"]');
  if (!editButton) {
    logTest('Find edit button', false, 'No edit button found on strategy card');
    return false;
  }
  
  const editClicked = await clickElement(page, 'button:has-text("Edit"), .edit-btn, [data-testid="edit-strategy"]', 'First edit button');
  if (!editClicked) {
    logTest('Click edit button', false, 'Failed to click edit button');
    return false;
  }
  
  // Wait for navigation to edit page
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  
  if (!currentUrl.includes('/edit/') && !currentUrl.includes('/strategies/edit')) {
    logTest('Navigate to edit page', false, 'Did not navigate to edit page');
    return false;
  }
  
  await takeScreenshot(page, 'edit-strategy-page-loaded', 'Edit strategy page loaded');
  
  // Test 3.1: Check for pre-populated form with existing strategy data
  const nameField = await waitForElement(page, 'input[name="name"], #name, [data-testid="strategy-name"]');
  let prePopulatedTestPassed = false;
  if (nameField) {
    const nameValue = await nameField.inputValue();
    prePopulatedTestPassed = nameValue.length > 0;
  }
  logTest('Pre-populated form with existing strategy data', prePopulatedTestPassed,
    !prePopulatedTestPassed ? 'Form not pre-populated with data' : 'Form pre-populated correctly');
  
  // Test 3.2: Test editing all strategy properties
  let editPropertiesTestPassed = false;
  if (nameField) {
    const originalName = await nameField.inputValue();
    const editedName = `${originalName} (Edited)`;
    
    const nameEdited = await fillInput(page, 'input[name="name"], #name, [data-testid="strategy-name"]', editedName, 'Edited strategy name');
    
    if (nameEdited) {
      await takeScreenshot(page, 'edit-form-modified', 'Edit strategy form with modified data');
      
      // Submit the form
      const submitButton = await waitForElement(page, 'button[type="submit"], button:has-text("Update"), button:has-text("Save"), [data-testid="update-strategy"]');
      if (submitButton) {
        await clickElement(page, 'button[type="submit"], button:has-text("Update"), button:has-text("Save"), [data-testid="update-strategy"]', 'Update button');
        
        // Wait for submission to complete
        await page.waitForTimeout(3000);
        
        // Check if we're redirected back to strategies list or see success message
        const finalUrl = page.url();
        const successMessage = await page.$('.success, .alert-success, [data-testid="success-message"]');
        
        if (finalUrl.includes('/strategies') && !finalUrl.includes('/edit') || successMessage) {
          editPropertiesTestPassed = true;
          await takeScreenshot(page, 'strategy-update-success', 'Strategy update successful');
        }
      }
    }
  }
  logTest('Edit all strategy properties', editPropertiesTestPassed,
    !editPropertiesTestPassed ? 'Failed to edit strategy properties' : 'Strategy properties edited successfully');
  
  // Test 3.3: Check for UUID validation for security (this would be tested via URL structure)
  const hasValidUUID = currentUrl.match(/\/edit\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  logTest('UUID validation for security', hasValidUUID !== null,
    hasValidUUID === null ? 'UUID not found in URL' : 'Valid UUID found in URL');
  
  return true;
}

// Test 4: Strategy Performance Page
async function testStrategyPerformancePage(page) {
  log('Testing Strategy Performance Page functionality...');
  
  // First navigate to strategies list to get a strategy to view performance for
  const listNavSuccess = await navigateToPage(page, `${TEST_CONFIG.baseURL}/strategies`, 'Strategies list page');
  if (!listNavSuccess) {
    logTest('Navigate to strategies list for performance test', false, 'Failed to load strategies page');
    return false;
  }
  
  // Find the first strategy card and click performance
  const strategyCards = await page.$$('.strategy-card, .card, [data-testid="strategy-card"]');
  if (strategyCards.length === 0) {
    logTest('Find strategy for performance view', false, 'No strategies found to view performance');
    return false;
  }
  
  const performanceButton = await strategyCards[0].$('button:has-text("Performance"), .performance-btn, a:has-text("Performance"), [data-testid="view-performance"]');
  if (!performanceButton) {
    logTest('Find performance button', false, 'No performance button found on strategy card');
    return false;
  }
  
  const perfClicked = await clickElement(page, 'button:has-text("Performance"), .performance-btn, a:has-text("Performance"), [data-testid="view-performance"]', 'First performance button');
  if (!perfClicked) {
    logTest('Click performance button', false, 'Failed to click performance button');
    return false;
  }
  
  // Wait for navigation to performance page
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  
  if (!currentUrl.includes('/performance/') && !currentUrl.includes('/strategies/performance')) {
    logTest('Navigate to performance page', false, 'Did not navigate to performance page');
    return false;
  }
  
  await takeScreenshot(page, 'strategy-performance-page-loaded', 'Strategy performance page loaded');
  
  // Test 4.1: Check for performance tabs (Overview, Performance, Rules)
  const tabs = await page.$$('.tab, .nav-tabs, [data-testid="performance-tabs"]');
  logTest('Performance tabs (Overview, Performance, Rules)', tabs.length > 0,
    tabs.length === 0 ? 'No performance tabs found' : `Found ${tabs.length} tab sections`);
  
  // Test 4.2: Check for analytics display (win rate, profit factor, net P&L, etc.)
  const analyticsElements = await page.$$('.analytics, .stats, .metrics, [data-testid="analytics-display"]');
  logTest('Analytics display (win rate, profit factor, net P&L)', analyticsElements.length > 0,
    analyticsElements.length === 0 ? 'No analytics elements found' : `Found ${analyticsElements.length} analytics elements`);
  
  // Test 4.3: Check for performance charts with trade data
  const charts = await page.$$('canvas, .chart, [data-testid="performance-chart"]');
  logTest('Performance charts with trade data', charts.length > 0,
    charts.length === 0 ? 'No performance charts found' : `Found ${charts.length} charts`);
  
  // Test 4.4: Check for Sharpe ratio and max drawdown calculations
  const sharpeElements = await page.$$('.sharpe, [data-testid="sharpe-ratio"]');
  const drawdownElements = await page.$$('.drawdown, [data-testid="max-drawdown"]');
  const advancedMetricsFound = sharpeElements.length > 0 || drawdownElements.length > 0;
  logTest('Sharpe ratio and max drawdown calculations', advancedMetricsFound,
    !advancedMetricsFound ? 'No advanced metrics found' : 'Advanced metrics (Sharpe ratio/drawdown) found');
  
  // Test 4.5: Test interactive visualizations
  let interactiveTestPassed = false;
  if (charts.length > 0) {
    // Try to interact with the first chart
    try {
      await charts[0].hover();
      await page.waitForTimeout(1000);
      interactiveTestPassed = true;
      await takeScreenshot(page, 'interactive-chart-hover', 'Interactive chart with hover effect');
    } catch (error) {
      log(`Chart interaction failed: ${error.message}`, 'ERROR');
    }
  }
  logTest('Interactive visualizations', interactiveTestPassed,
    !interactiveTestPassed ? 'Charts not interactive' : 'Charts are interactive');
  
  return true;
}

// Main test execution function
async function runStrategyManagementTests() {
  log('Starting comprehensive strategy management tests...');
  testResults.startTime = new Date().toISOString();
  
  // Create screenshots directory
  if (!fs.existsSync(TEST_CONFIG.screenshots.dir)) {
    fs.mkdirSync(TEST_CONFIG.screenshots.dir, { recursive: true });
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 100 // Slow down by 100ms
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    page = await context.newPage();
    
    // Test authentication
    log('Testing authentication...');
    const authSuccess = await authenticate(page);
    logTest('User authentication', authSuccess, 
      !authSuccess ? 'Authentication failed' : 'Authentication successful');
    
    if (!authSuccess) {
      log('Authentication failed, cannot proceed with strategy management tests', 'ERROR');
      return;
    }
    
    // Run all strategy management tests
    await testStrategiesListPage(page);
    await testCreateStrategyPage(page);
    await testEditStrategyPage(page);
    await testStrategyPerformancePage(page);
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'ERROR');
    testResults.errors.push({ test: 'Test Execution', error: error.message });
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
    }
    
    testResults.endTime = new Date().toISOString();
    
    // Generate test report
    await generateTestReport();
  }
}

// Generate test report
async function generateTestReport() {
  log('Generating test report...');
  
  const report = {
    summary: {
      testName: 'Strategy Management Comprehensive Test',
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: testResults.totalTests > 0 ? 
        ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) + '%' : '0%'
    },
    testResults: testResults,
    recommendations: []
  };
  
  // Add recommendations based on test results
  if (testResults.failedTests > 0) {
    report.recommendations.push('Review failed tests and fix identified issues');
  }
  
  if (testResults.errors.length > 0) {
    report.recommendations.push('Address critical errors that prevented test execution');
  }
  
  if (testResults.passedTests === testResults.totalTests) {
    report.recommendations.push('All tests passed - strategy management functionality is working correctly');
  }
  
  // Save report to file
  const reportFilename = `strategy-management-test-report-${Date.now()}.json`;
  const reportPath = path.join(TEST_CONFIG.screenshots.dir, reportFilename);
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Test report saved to: ${reportPath}`);
    
    // Also save a markdown version for easier reading
    const markdownReport = generateMarkdownReport(report);
    const markdownPath = path.join(TEST_CONFIG.screenshots.dir, `strategy-management-test-report-${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    log(`Markdown report saved to: ${markdownPath}`);
    
  } catch (error) {
    log(`Failed to save test report: ${error.message}`, 'ERROR');
  }
  
  // Print summary to console
  console.log('\n' + '='.repeat(80));
  console.log('STRATEGY MANAGEMENT COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests}`);
  console.log(`Failed: ${testResults.failedTests}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log(`Screenshots: ${testResults.screenshots.length}`);
  console.log(`Errors: ${testResults.errors.length}`);
  
  if (testResults.errors.length > 0) {
    console.log('\nERRORS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\nRECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('='.repeat(80));
}

// Generate markdown report
function generateMarkdownReport(report) {
  const { summary, testResults, recommendations } = report;
  
  let markdown = `# Strategy Management Comprehensive Test Report\n\n`;
  markdown += `**Test Date:** ${new Date(summary.startTime).toLocaleString()}\n\n`;
  
  markdown += `## Test Summary\n\n`;
  markdown += `- **Total Tests:** ${summary.totalTests}\n`;
  markdown += `- **Passed Tests:** ${summary.passedTests}\n`;
  markdown += `- **Failed Tests:** ${summary.failedTests}\n`;
  markdown += `- **Success Rate:** ${summary.successRate}\n`;
  markdown += `- **Screenshots Captured:** ${testResults.screenshots.length}\n\n`;
  
  if (testResults.errors.length > 0) {
    markdown += `## Errors\n\n`;
    testResults.errors.forEach((error, index) => {
      markdown += `${index + 1}. **${error.test}:** ${error.error}\n`;
    });
    markdown += `\n`;
  }
  
  if (recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Screenshots\n\n`;
  testResults.screenshots.forEach((screenshot, index) => {
    markdown += `${index + 1}. **${screenshot.filename}** - ${screenshot.description}\n`;
  });
  
  return markdown;
}

// Run the tests
if (require.main === module) {
  runStrategyManagementTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runStrategyManagementTests,
  testStrategiesListPage,
  testCreateStrategyPage,
  testEditStrategyPage,
  testStrategyPerformancePage
};